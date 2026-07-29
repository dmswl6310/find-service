import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { experimentCases } from "./transit-experiment-fixtures.mjs";
import { runScheduledRequests } from "./transit-request-scheduler.mjs";

function parseArgs(argv) {
  const values = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;

    const [key, inlineValue] = token.slice(2).split("=", 2);
    const value = inlineValue ?? argv[index + 1];
    values.set(key, value);
    if (inlineValue === undefined) index += 1;
  }

  const integer = (key, fallback) => {
    const value = Number(values.get(key) ?? fallback);
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`--${key} must be a non-negative integer`);
    }
    return value;
  };

  return {
    baseUrl: values.get("base-url") ?? "http://localhost:3000",
    cases: (values.get("cases") ?? "3x3").split(",").map((value) => value.trim()),
    repeats: integer("repeats", 1),
    sessions: integer("sessions", 1),
    schedulerScope: values.get("scheduler-scope") ?? "global",
    budget: integer("budget", 100),
    runCooldownMs: integer("run-cooldown-ms", 5_000),
    timeoutMs: integer("timeout-ms", 30_000),
    outputDir: values.get("output-dir") ?? "docs/results",
    label: values.get("label") ?? "scheduler",
    policy: {
      concurrency: integer("concurrency", 1),
      minStartGapMs: integer("min-start-gap-ms", 0),
      completionCooldownMs: integer("completion-cooldown-ms", 0),
      maxStartsPerWindow: integer("max-starts-per-window", 0),
      windowMs: integer("window-ms", 1_000),
    },
  };
}

function validateConfig(config) {
  if (!["global", "per-session"].includes(config.schedulerScope)) {
    throw new Error("--scheduler-scope must be global or per-session");
  }

  if (config.sessions < 1) {
    throw new Error("--sessions must be at least 1");
  }

  for (const caseId of config.cases) {
    if (!experimentCases[caseId]) {
      throw new Error(`Unknown case "${caseId}"`);
    }
  }

  const plannedRequests =
    config.repeats *
    config.sessions *
    config.cases.reduce((sum, caseId) => {
      const testCase = experimentCases[caseId];
      return sum + testCase.starts.length * testCase.ends.length;
    }, 0);

  if (plannedRequests > config.budget) {
    throw new Error(`Planned ${plannedRequests} requests exceeds --budget ${config.budget}`);
  }

  return plannedRequests;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function percentile(values, ratio) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
}

function classifyResponse(status, payload) {
  const code = payload && typeof payload === "object" ? String(payload.errorCode ?? "") : "";

  if (status === 429) return "http-429";
  if (code === "-1") return "odsay-minus-1";
  if (payload?.walkOnly === true) return "walk-only";
  if (status === 404) return "no-route";
  if (status >= 500) return "http-5xx";
  if (status >= 400) return "http-error";
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.totalTime !== "number" ||
    typeof payload.payment !== "number"
  ) {
    return "invalid-payload";
  }
  return "success";
}

async function requestCell({ baseUrl, task, timeoutMs }) {
  const searchParams = new URLSearchParams({
    sx: task.start.x,
    sy: task.start.y,
    ex: task.end.x,
    ey: task.end.y,
  });
  const url = new URL(`/api/transit?${searchParams.toString()}`, baseUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "cache-control": "no-cache" },
    });
    const rawText = await response.text();
    let payload = null;

    try {
      payload = rawText ? JSON.parse(rawText) : null;
    } catch {
      payload = null;
    }

    return {
      sessionId: task.sessionId,
      fromId: task.start.id,
      fromName: task.start.name,
      toId: task.end.id,
      toName: task.end.name,
      status: response.status,
      errorCode: payload?.errorCode ?? null,
      errorSource: payload?.errorSource ?? null,
      classification: classifyResponse(response.status, payload),
      totalTime: typeof payload?.totalTime === "number" ? payload.totalTime : null,
    };
  } catch (error) {
    return {
      sessionId: task.sessionId,
      fromId: task.start.id,
      fromName: task.start.name,
      toId: task.end.id,
      toName: task.end.name,
      status: null,
      errorCode: null,
      errorSource: "client",
      classification: error?.name === "AbortError" ? "timeout" : "network-error",
      totalTime: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildSessionTasks(testCase, sessions) {
  return Array.from({ length: sessions }, (_, sessionIndex) => {
    const sessionId = `session-${sessionIndex + 1}`;
    return testCase.starts.flatMap((start) =>
      testCase.ends.map((end) => ({ sessionId, start, end }))
    );
  });
}

function maxConcurrentRequests(requests) {
  const events = requests.flatMap((request) => [
    { at: Date.parse(request.startedAt), delta: 1 },
    { at: Date.parse(request.completedAt), delta: -1 },
  ]);
  events.sort((left, right) => left.at - right.at || left.delta - right.delta);

  let active = 0;
  let maximum = 0;
  for (const event of events) {
    active += event.delta;
    maximum = Math.max(maximum, active);
  }
  return maximum;
}

function maxStartsInWindow(requests, windowMs) {
  const starts = requests
    .map((request) => Date.parse(request.startedAt))
    .sort((a, b) => a - b);
  let left = 0;
  let maximum = 0;

  for (let right = 0; right < starts.length; right += 1) {
    while (starts[left] <= starts[right] - windowMs) {
      left += 1;
    }
    maximum = Math.max(maximum, right - left + 1);
  }
  return maximum;
}

function summarizeRun(run) {
  const durations = run.requests.map((request) => request.durationMs);
  const starts = run.requests
    .map((request) => Date.parse(request.startedAt))
    .sort((a, b) => a - b);
  const startGaps = starts.slice(1).map((value, index) => value - starts[index]);
  const count = (classification) =>
    run.requests.filter((request) => request.classification === classification).length;

  return {
    runId: run.runId,
    label: run.label,
    caseId: run.caseId,
    iteration: run.iteration,
    sessions: run.sessions,
    schedulerScope: run.schedulerScope,
    concurrency: run.policy.concurrency,
    minStartGapMs: run.policy.minStartGapMs,
    completionCooldownMs: run.policy.completionCooldownMs,
    maxStartsPerWindow: run.policy.maxStartsPerWindow,
    windowMs: run.policy.windowMs,
    totalRequests: run.requests.length,
    unscheduledRequests: run.unscheduledRequests,
    totalDurationMs: run.totalDurationMs,
    successCount: count("success"),
    walkOnlyCount: count("walk-only"),
    noRouteCount: count("no-route"),
    http429Count: count("http-429"),
    odsayMinus1Count: count("odsay-minus-1"),
    http5xxCount: count("http-5xx"),
    otherErrorCount: run.requests.filter((request) =>
      ["http-error", "invalid-payload", "timeout", "network-error", "worker-error"].includes(
        request.classification
      )
    ).length,
    responseAverageMs: Math.round(
      durations.reduce((sum, value) => sum + value, 0) / durations.length
    ),
    responseP50Ms: percentile(durations, 0.5),
    responseP95Ms: percentile(durations, 0.95),
    responseMaxMs: Math.max(...durations),
    startGapMinMs: startGaps.length ? Math.min(...startGaps) : null,
    startGapP50Ms: percentile(startGaps, 0.5),
    startGapP95Ms: percentile(startGaps, 0.95),
    maxObservedGlobalConcurrency: maxConcurrentRequests(run.requests),
    maxObservedStartsPerSecond: maxStartsInWindow(run.requests, 1_000),
    stopReason: run.stopReason,
  };
}

function toCsv(rows) {
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}

async function runOne({ config, testCase, caseId, iteration }) {
  const sessionTasks = buildSessionTasks(testCase, config.sessions);
  const runStartedAt = Date.now();
  let requests = [];
  let unscheduledRequests = 0;
  let stopReason = null;

  if (config.schedulerScope === "global") {
    const scheduled = await runScheduledRequests({
      tasks: sessionTasks.flat(),
      policy: config.policy,
      worker: (task) =>
        requestCell({ baseUrl: config.baseUrl, task, timeoutMs: config.timeoutMs }),
    });
    requests = scheduled.results;
    unscheduledRequests = scheduled.unscheduledTaskCount;
    stopReason = scheduled.stopReason;
  } else {
    const scheduledSessions = await Promise.all(
      sessionTasks.map((tasks) =>
        runScheduledRequests({
          tasks,
          policy: config.policy,
          worker: (task) =>
            requestCell({ baseUrl: config.baseUrl, task, timeoutMs: config.timeoutMs }),
        })
      )
    );
    requests = scheduledSessions
      .flatMap((scheduled) => scheduled.results)
      .sort((left, right) => Date.parse(left.startedAt) - Date.parse(right.startedAt));
    unscheduledRequests = scheduledSessions.reduce(
      (sum, scheduled) => sum + scheduled.unscheduledTaskCount,
      0
    );
    stopReason =
      scheduledSessions.find((scheduled) => scheduled.stopReason)?.stopReason ?? null;
  }

  return {
    runId: `${config.label}-${caseId}-${iteration}`,
    label: config.label,
    caseId,
    iteration,
    sessions: config.sessions,
    schedulerScope: config.schedulerScope,
    policy: config.policy,
    startedAt: new Date(runStartedAt).toISOString(),
    totalDurationMs: Date.now() - runStartedAt,
    requests,
    unscheduledRequests,
    stopReason,
  };
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  const plannedRequests = validateConfig(config);
  const experimentStartedAt = new Date();
  const runs = [];
  let executedRequests = 0;
  let stoppedEarly = false;

  console.log(JSON.stringify({ plannedRequests, config }));

  outer:
  for (const caseId of config.cases) {
    const testCase = experimentCases[caseId];

    for (let iteration = 1; iteration <= config.repeats; iteration += 1) {
      const run = await runOne({ config, testCase, caseId, iteration });
      runs.push(run);
      executedRequests += run.requests.length;
      const summary = summarizeRun(run);
      console.log(JSON.stringify(summary));

      if (run.stopReason) {
        stoppedEarly = true;
        break outer;
      }

      if (config.runCooldownMs > 0 && executedRequests < plannedRequests) {
        await sleep(config.runCooldownMs);
      }
    }
  }

  const summaries = runs.map(summarizeRun);
  const timestamp = experimentStartedAt.toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const outputDirectory = path.resolve(config.outputDir);
  const baseName = `transit-scheduler-${config.label}-${timestamp}`;
  await mkdir(outputDirectory, { recursive: true });

  const artifact = {
    experimentStartedAt: experimentStartedAt.toISOString(),
    experimentCompletedAt: new Date().toISOString(),
    config,
    plannedRequests,
    executedRequests,
    stoppedEarly,
    runs,
  };
  const jsonPath = path.join(outputDirectory, `${baseName}.json`);
  const csvPath = path.join(outputDirectory, `${baseName}.csv`);
  await writeFile(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  await writeFile(csvPath, `${toCsv(summaries)}\n`, "utf8");
  console.log(JSON.stringify({ jsonPath, csvPath, executedRequests, stoppedEarly }));
}

await main();
