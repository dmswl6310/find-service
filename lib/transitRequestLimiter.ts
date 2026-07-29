type RequestLimiterConfig = {
  concurrency: number;
  minStartGapMs: number;
  maxStartsPerWindow: number;
  windowMs: number;
};

type QueueEntry<T> = {
  aborted: boolean;
  cleanupAbortListener: () => void;
  reject: (reason?: unknown) => void;
  resolve: (value: T | PromiseLike<T>) => void;
  task: () => Promise<T>;
};

export type RequestLimiterSnapshot = {
  activeCount: number;
  queuedCount: number;
  recentStartCount: number;
};

function abortError(): DOMException {
  return new DOMException("요청이 취소되었습니다.", "AbortError");
}

function normalizeConfig(config: RequestLimiterConfig): RequestLimiterConfig {
  return {
    concurrency: Math.max(1, Math.floor(config.concurrency)),
    minStartGapMs: Math.max(0, Math.floor(config.minStartGapMs)),
    maxStartsPerWindow: Math.max(0, Math.floor(config.maxStartsPerWindow)),
    windowMs: Math.max(1, Math.floor(config.windowMs)),
  };
}

export function createRequestLimiter(inputConfig: RequestLimiterConfig) {
  const config = normalizeConfig(inputConfig);
  const queue: QueueEntry<unknown>[] = [];
  const startedTimestamps: number[] = [];
  let activeCount = 0;
  let lastStartedAt: number | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const pruneStartedTimestamps = (now: number) => {
    const cutoff = now - config.windowMs;
    while (startedTimestamps.length > 0 && startedTimestamps[0] <= cutoff) {
      startedTimestamps.shift();
    }
  };

  const nextAllowedStartAt = (now: number) => {
    pruneStartedTimestamps(now);
    let allowedAt =
      lastStartedAt === null ? now : lastStartedAt + config.minStartGapMs;

    if (
      config.maxStartsPerWindow > 0 &&
      startedTimestamps.length >= config.maxStartsPerWindow
    ) {
      allowedAt = Math.max(
        allowedAt,
        startedTimestamps[0] + config.windowMs
      );
    }

    return allowedAt;
  };

  const schedulePump = (delayMs: number) => {
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      pump();
    }, delayMs);
  };

  const startEntry = (entry: QueueEntry<unknown>) => {
    const startedAt = Date.now();
    activeCount += 1;
    lastStartedAt = startedAt;
    startedTimestamps.push(startedAt);
    entry.cleanupAbortListener();

    void entry
      .task()
      .then(entry.resolve, entry.reject)
      .finally(() => {
        activeCount -= 1;
        pump();
      });
  };

  const pump = () => {
    if (timer !== null || activeCount >= config.concurrency) return;

    while (queue.length > 0 && queue[0].aborted) {
      queue.shift();
    }

    if (queue.length === 0) return;

    const now = Date.now();
    const allowedAt = nextAllowedStartAt(now);
    if (allowedAt > now) {
      schedulePump(allowedAt - now);
      return;
    }

    const entry = queue.shift();
    if (!entry) return;
    startEntry(entry);

    if (activeCount < config.concurrency && queue.length > 0) {
      const nextStartAt = nextAllowedStartAt(Date.now());
      if (nextStartAt <= Date.now()) {
        pump();
      } else {
        schedulePump(nextStartAt - Date.now());
      }
    }
  };

  return {
    schedule<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
      if (signal?.aborted) {
        return Promise.reject(abortError());
      }

      return new Promise<T>((resolve, reject) => {
        const entry: QueueEntry<T> = {
          aborted: false,
          cleanupAbortListener: () => undefined,
          reject,
          resolve,
          task,
        };

        if (signal) {
          const handleAbort = () => {
            if (entry.aborted) return;
            entry.aborted = true;
            entry.cleanupAbortListener();
            reject(abortError());
            pump();
          };
          signal.addEventListener("abort", handleAbort, { once: true });
          entry.cleanupAbortListener = () =>
            signal.removeEventListener("abort", handleAbort);
        }

        queue.push(entry as QueueEntry<unknown>);
        pump();
      });
    },

    getSnapshot(): RequestLimiterSnapshot {
      const now = Date.now();
      pruneStartedTimestamps(now);
      return {
        activeCount,
        queuedCount: queue.filter((entry) => !entry.aborted).length,
        recentStartCount: startedTimestamps.length,
      };
    },
  };
}

function parseNonNegativeInteger(value: string | undefined, fallback: number) {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getTransitRequestLimiterConfig(): RequestLimiterConfig {
  return {
    concurrency: Math.max(
      1,
      parseNonNegativeInteger(process.env.TRANSIT_SERVER_MAX_CONCURRENCY, 3)
    ),
    minStartGapMs: parseNonNegativeInteger(
      process.env.TRANSIT_SERVER_MIN_START_GAP_MS,
      500
    ),
    maxStartsPerWindow: parseNonNegativeInteger(
      process.env.TRANSIT_SERVER_MAX_STARTS_PER_WINDOW,
      2
    ),
    windowMs: Math.max(
      1,
      parseNonNegativeInteger(process.env.TRANSIT_SERVER_RATE_WINDOW_MS, 1_000)
    ),
  };
}

const globalForTransitLimiter = globalThis as typeof globalThis & {
  __moduspotTransitRequestLimiter?: ReturnType<typeof createRequestLimiter>;
};

export const transitRequestLimiter =
  globalForTransitLimiter.__moduspotTransitRequestLimiter ??
  createRequestLimiter(getTransitRequestLimiterConfig());

if (process.env.NODE_ENV !== "production") {
  globalForTransitLimiter.__moduspotTransitRequestLimiter =
    transitRequestLimiter;
}

export function scheduleTransitRequest<T>(
  task: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  return transitRequestLimiter.schedule(task, signal);
}
