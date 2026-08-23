import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { experimentCases } from "./transit-experiment-fixtures.mjs";

const DEFAULT_INTERVALS = [1000, 500, 250, 150, 100, 50, 0];
const DEFAULT_CASES = ["1x1", "2x2", "3x3"];
const DEFAULT_TIMEOUT_MS = 30_000;

function parseArgs(argv) {
  const values = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const nextValue = inlineValue ?? argv[index + 1];
    values.set(rawKey, nextValue);
    if (inlineValue === undefined) index += 1;
  }

  const parseList = (key, fallback) => {
    const raw = values.get(key);
    return raw ? raw.split(",").map((value) => value.trim()).filter(Boolean) : fallback;
  };

  const parsePositiveInteger = (key, fallback) => {
    const value = Number(values.get(key) ?? fallback);
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`--${key} must be a non-negative integer`);
    }
    return value;
  };

  return {
    baseUrl: values.get("base-url") ?? "http://localhost:3000",
    intervals: parseList("intervals", DEFAULT_INTERVALS).map(Number),
    cases: parseList("cases", DEFAULT_CASES),
    repeats: parsePositiveInteger("repeats", 1),
    budget: parsePositiveInteger("budget", 200),
    cooldownMs: parsePositiveInteger("cooldown-ms", 30_000),
    timeoutMs: parsePositiveInteger("timeout-ms", DEFAULT_TIMEOUT_MS),
    outputDir: values.get("output-dir") ?? "docs/results",
  };
}

function validateConfig(config) {
  for (const interval of config.intervals) {
    if (!Number.isFinite(interval) || interval < 0) {
      throw new Error(`Invalid interval: ${interval}`);
    }
  }

  for (const caseId of config.cases) {
    if (!experimentCases[caseId]) {
      throw new Error(`Unknown case "${caseId}". Available: ${Object.keys(experimentCases).join(", ")}`);
    }
  }

  const plannedRequests =
    config.intervals.length *
    config.repeats *
    config.cases.reduce(
      (total, caseId) =>
        total + experimentCases[caseId].starts.length * experimentCases[caseId].ends.length,
      0
    );

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

async function requestCell({ baseUrl, start, end, timeoutMs, previousStartedAt }) {
  const searchParams = new URLSearchParams({
    sx: start.x,
    sy: start.y,
    ex: end.x,
    ey: end.y,
  });
  const url = new URL(`/api/transit?${searchParams.toString()}`, baseUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

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

    const completedAt = Date.now();
    return {
      fromId: start.id,
      fromName: start.name,
      toId: end.id,
      toName: end.name,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      startGapMs: previousStartedAt === null ? null : startedAt - previousStartedAt,
      durationMs: completedAt - startedAt,
      status: response.status,
      errorCode: payload?.errorCode ?? null,
      errorSource: payload?.errorSource ?? null,
      classification: classifyResponse(response.status, payload),
      totalTime: typeof payload?.totalTime === "number" ? payload.totalTime : null,
    };
  } catch (error) {
    const completedAt = Date.now();
    return {
      fromId: start.id,
      fromName: start.name,
      toId: end.id,
      toName: end.name,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      startGapMs: previousStartedAt === null ? null : startedAt - previousStartedAt,
      durationMs: completedAt - startedAt,
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

function summarizeRun(run) {
  const durations = run.requests.map((request) => request.durationMs);
  const startGaps = run.requests
    .map((request) => request.startGapMs)
    .filter((value) => typeof value === "number");
  const count = (classification) =>
    run.requests.filter((request) => request.classification === classification).length;

  return {
    runId: run.runId,
    caseId: run.caseId,
    intervalMs: run.intervalMs,
    iteration: run.iteration,
    starts: run.starts,
    ends: run.ends,
    totalRequests: run.requests.length,
    totalDurationMs: run.totalDurationMs,
    successCount: count("success"),
    walkOnlyCount: count("walk-only"),
    noRouteCount: count("no-route"),
    http429Count: count("http-429"),
    odsayMinus1Count: count("odsay-minus-1"),
    http5xxCount: count("http-5xx"),
    otherErrorCount: run.requests.filter((request) =>
      ["http-error", "invalid-payload", "timeout", "network-error"].includes(request.classification)
    ).length,
    responseAverageMs: Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length),
    responseP50Ms: percentile(durations, 0.5),
    responseP95Ms: percentile(durations, 0.95),
    responseMaxMs: Math.max(...durations),
    startGapMinMs: startGaps.length ? Math.min(...startGaps) : null,
    startGapAverageMs: startGaps.length
      ? Math.round(startGaps.reduce((sum, value) => sum + value, 0) / startGaps.length)
      : null,
    startGapMaxMs: startGaps.length ? Math.max(...startGaps) : null,
  };
}

function toCsv(summaries) {
  const headers = Object.keys(summaries[0]);
  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  return [
    headers.join(","),
    ...summaries.map((summary) => headers.map((header) => escape(summary[header])).join(",")),
  ].join("\n");
}

async function runExperiment(config) {
  const plannedRequests = validateConfig(config);
  const experimentStartedAt = new Date();
  const runs = [];
  let executedRequests = 0;
  let stoppedEarly = false;

  console.log(`Planned requests: ${plannedRequests}`);

  outer:
  for (const intervalMs of config.intervals) {
    for (const caseId of config.cases) {
      const testCase = experimentCases[caseId];

      for (let iteration = 1; iteration <= config.repeats; iteration += 1) {
        const runStartedAt = Date.now();
        const requests = [];
        let previousStartedAt = null;
        const cells = testCase.starts.flatMap((start) =>
          testCase.ends.map((end) => ({ start, end }))
        );

        for (let cellIndex = 0; cellIndex < cells.length; cellIndex += 1) {
          const { start, end } = cells[cellIndex];
          const result = await requestCell({
            baseUrl: config.baseUrl,
            start,
            end,
            timeoutMs: config.timeoutMs,
            previousStartedAt,
          });
          previousStartedAt = Date.parse(result.startedAt);
          requests.push(result);
          executedRequests += 1;

          if (result.classification === "http-429" || result.classification === "odsay-minus-1") {
            stoppedEarly = true;
            break;
          }

          if (intervalMs > 0 && cellIndex < cells.length - 1) {
            await sleep(intervalMs);
          }
        }

        const run = {
          runId: `${caseId}-${intervalMs}ms-${iteration}`,
          caseId,
          description: testCase.description,
          intervalMs,
          iteration,
          starts: testCase.starts.length,
          ends: testCase.ends.length,
          startedAt: new Date(runStartedAt).toISOString(),
          totalDurationMs: Date.now() - runStartedAt,
          requests,
        };
        runs.push(run);
        const summary = summarizeRun(run);
        console.log(JSON.stringify(summary));

        if (stoppedEarly) break outer;
        if (config.cooldownMs > 0 && executedRequests < plannedRequests) {
          await sleep(config.cooldownMs);
        }
      }
    }
  }

  const summaries = runs.map(summarizeRun);
  const timestamp = experimentStartedAt.toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const outputDirectory = path.resolve(config.outputDir);
  const baseName = `transit-interval-${timestamp}`;
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

const config = parseArgs(process.argv.slice(2));
await runExperiment(config);
