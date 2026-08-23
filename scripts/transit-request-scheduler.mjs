const DEFAULT_STOP_CLASSIFICATIONS = ["http-429", "odsay-minus-1"];

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizePolicy(policy = {}) {
  const normalized = {
    concurrency: policy.concurrency ?? 1,
    minStartGapMs: policy.minStartGapMs ?? 0,
    completionCooldownMs: policy.completionCooldownMs ?? 0,
    maxStartsPerWindow: policy.maxStartsPerWindow ?? 0,
    windowMs: policy.windowMs ?? 1000,
    stopClassifications: policy.stopClassifications ?? DEFAULT_STOP_CLASSIFICATIONS,
  };

  for (const key of [
    "concurrency",
    "minStartGapMs",
    "completionCooldownMs",
    "maxStartsPerWindow",
    "windowMs",
  ]) {
    if (!Number.isInteger(normalized[key]) || normalized[key] < 0) {
      throw new Error(`${key} must be a non-negative integer`);
    }
  }

  if (normalized.concurrency < 1) {
    throw new Error("concurrency must be at least 1");
  }

  if (normalized.maxStartsPerWindow > 0 && normalized.windowMs < 1) {
    throw new Error("windowMs must be at least 1 when maxStartsPerWindow is enabled");
  }

  return normalized;
}

function pruneWindowStarts(startedTimestamps, now, windowMs) {
  const cutoff = now - windowMs;
  while (startedTimestamps.length > 0 && startedTimestamps[0] <= cutoff) {
    startedTimestamps.shift();
  }
}

function getNextStartDelay({
  activeCount,
  hasPendingTasks,
  lastStartedAt,
  completionBlockedUntil,
  startedTimestamps,
  now,
  policy,
}) {
  if (!hasPendingTasks || activeCount >= policy.concurrency) {
    return Number.POSITIVE_INFINITY;
  }

  pruneWindowStarts(startedTimestamps, now, policy.windowMs);

  let allowedAt = Math.max(
    lastStartedAt === null ? now : lastStartedAt + policy.minStartGapMs,
    completionBlockedUntil
  );

  if (
    policy.maxStartsPerWindow > 0 &&
    startedTimestamps.length >= policy.maxStartsPerWindow
  ) {
    allowedAt = Math.max(allowedAt, startedTimestamps[0] + policy.windowMs);
  }

  return Math.max(0, allowedAt - now);
}

export async function runScheduledRequests({
  tasks,
  worker,
  policy: rawPolicy,
  shouldStop,
}) {
  const policy = normalizePolicy(rawPolicy);
  const queuedAt = Date.now();
  const results = new Array(tasks.length);
  const active = new Map();
  const startedTimestamps = [];
  let nextTaskIndex = 0;
  let lastStartedAt = null;
  let completionBlockedUntil = 0;
  let maxObservedConcurrency = 0;
  let maxObservedStartsPerWindow = 0;
  let stopReason = null;

  const stopPredicate =
    shouldStop ??
    ((result) => policy.stopClassifications.includes(result?.classification));

  const startTask = (taskIndex) => {
    const now = Date.now();
    pruneWindowStarts(startedTimestamps, now, policy.windowMs);
    const activeAtStart = active.size + 1;
    const startsInWindowAtStart = startedTimestamps.length + 1;
    startedTimestamps.push(now);
    lastStartedAt = now;
    maxObservedConcurrency = Math.max(maxObservedConcurrency, activeAtStart);
    maxObservedStartsPerWindow = Math.max(
      maxObservedStartsPerWindow,
      startsInWindowAtStart
    );

    const promise = (async () => {
      let workerResult;

      try {
        workerResult = await worker(tasks[taskIndex], {
          taskIndex,
          startedAt: now,
          activeAtStart,
          startsInWindowAtStart,
        });
      } catch (error) {
        workerResult = {
          classification: "worker-error",
          errorMessage: error instanceof Error ? error.message : String(error),
        };
      }

      const completedAt = Date.now();
      return {
        taskIndex,
        record: {
          ...workerResult,
          taskIndex,
          queuedAt: new Date(queuedAt).toISOString(),
          startedAt: new Date(now).toISOString(),
          completedAt: new Date(completedAt).toISOString(),
          queueWaitMs: now - queuedAt,
          durationMs: completedAt - now,
          activeAtStart,
          startsInWindowAtStart,
        },
      };
    })();

    active.set(taskIndex, promise);
  };

  while ((nextTaskIndex < tasks.length && !stopReason) || active.size > 0) {
    let launchedTask = false;

    while (!stopReason && nextTaskIndex < tasks.length) {
      const delay = getNextStartDelay({
        activeCount: active.size,
        hasPendingTasks: true,
        lastStartedAt,
        completionBlockedUntil,
        startedTimestamps,
        now: Date.now(),
        policy,
      });

      if (delay > 0) break;

      startTask(nextTaskIndex);
      nextTaskIndex += 1;
      launchedTask = true;
    }

    if (active.size === 0) {
      if (stopReason || nextTaskIndex >= tasks.length) break;

      const delay = getNextStartDelay({
        activeCount: 0,
        hasPendingTasks: true,
        lastStartedAt,
        completionBlockedUntil,
        startedTimestamps,
        now: Date.now(),
        policy,
      });
      await sleep(delay);
      continue;
    }

    const nextStartDelay = getNextStartDelay({
      activeCount: active.size,
      hasPendingTasks: !stopReason && nextTaskIndex < tasks.length,
      lastStartedAt,
      completionBlockedUntil,
      startedTimestamps,
      now: Date.now(),
      policy,
    });

    const completionPromise = Promise.race(active.values());
    const outcome =
      Number.isFinite(nextStartDelay) && nextStartDelay > 0
        ? await Promise.race([
            completionPromise,
            sleep(nextStartDelay).then(() => null),
          ])
        : await completionPromise;

    if (outcome === null) {
      continue;
    }

    active.delete(outcome.taskIndex);
    results[outcome.taskIndex] = outcome.record;
    completionBlockedUntil = Math.max(
      completionBlockedUntil,
      Date.parse(outcome.record.completedAt) + policy.completionCooldownMs
    );

    if (!stopReason && stopPredicate(outcome.record)) {
      stopReason = outcome.record.classification ?? "stop-predicate";
    }

    if (launchedTask) {
      await Promise.resolve();
    }
  }

  return {
    policy,
    results: results.filter(Boolean),
    scheduledTaskCount: nextTaskIndex,
    unscheduledTaskCount: tasks.length - nextTaskIndex,
    maxObservedConcurrency,
    maxObservedStartsPerWindow,
    stopReason,
  };
}
