import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRequestLimiter,
  getTransitRequestLimiterConfig,
} from "@/lib/transitRequestLimiter";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, reject, resolve };
}

describe("createRequestLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("uses the stability-selected C3/S500/R2 defaults", () => {
    vi.stubEnv("TRANSIT_SERVER_MAX_CONCURRENCY", "");
    vi.stubEnv("TRANSIT_SERVER_MIN_START_GAP_MS", "");
    vi.stubEnv("TRANSIT_SERVER_MAX_STARTS_PER_WINDOW", "");
    vi.stubEnv("TRANSIT_SERVER_RATE_WINDOW_MS", "");

    expect(getTransitRequestLimiterConfig()).toEqual({
      concurrency: 3,
      minStartGapMs: 500,
      maxStartsPerWindow: 2,
      windowMs: 1_000,
    });
  });

  it("keeps at most two active requests and starts them at least 500ms apart", async () => {
    const limiter = createRequestLimiter({
      concurrency: 2,
      minStartGapMs: 500,
      maxStartsPerWindow: 2,
      windowMs: 1_000,
    });
    const first = deferred<string>();
    const second = deferred<string>();
    const third = deferred<string>();
    const startedAt: number[] = [];

    const firstResult = limiter.schedule(() => {
      startedAt.push(Date.now());
      return first.promise;
    });
    const secondResult = limiter.schedule(() => {
      startedAt.push(Date.now());
      return second.promise;
    });
    const thirdResult = limiter.schedule(() => {
      startedAt.push(Date.now());
      return third.promise;
    });

    expect(startedAt).toEqual([0]);
    expect(limiter.getSnapshot()).toMatchObject({
      activeCount: 1,
      queuedCount: 2,
    });

    await vi.advanceTimersByTimeAsync(499);
    expect(startedAt).toEqual([0]);

    await vi.advanceTimersByTimeAsync(1);
    expect(startedAt).toEqual([0, 500]);
    expect(limiter.getSnapshot()).toMatchObject({
      activeCount: 2,
      queuedCount: 1,
    });

    await vi.advanceTimersByTimeAsync(500);
    expect(startedAt).toEqual([0, 500]);

    first.resolve("first");
    await vi.advanceTimersByTimeAsync(0);
    expect(startedAt).toEqual([0, 500, 1_000]);

    second.resolve("second");
    third.resolve("third");
    await expect(
      Promise.all([firstResult, secondResult, thirdResult])
    ).resolves.toEqual(["first", "second", "third"]);
  });

  it("limits starts to two in each rolling one-second window", async () => {
    const limiter = createRequestLimiter({
      concurrency: 3,
      minStartGapMs: 0,
      maxStartsPerWindow: 2,
      windowMs: 1_000,
    });
    const pending = [deferred<void>(), deferred<void>(), deferred<void>()];
    const startedAt: number[] = [];

    const results = pending.map((item) =>
      limiter.schedule(() => {
        startedAt.push(Date.now());
        return item.promise;
      })
    );

    expect(startedAt).toEqual([0, 0]);
    await vi.advanceTimersByTimeAsync(999);
    expect(startedAt).toEqual([0, 0]);

    await vi.advanceTimersByTimeAsync(1);
    expect(startedAt).toEqual([0, 0, 1_000]);

    pending.forEach((item) => item.resolve());
    await expect(Promise.all(results)).resolves.toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("removes an aborted request while it is still queued", async () => {
    const limiter = createRequestLimiter({
      concurrency: 1,
      minStartGapMs: 0,
      maxStartsPerWindow: 0,
      windowMs: 1_000,
    });
    const active = deferred<void>();
    const queuedTask = vi.fn().mockResolvedValue(undefined);
    const controller = new AbortController();

    const activeResult = limiter.schedule(() => active.promise);
    const queuedResult = limiter.schedule(queuedTask, controller.signal);
    const rejection = expect(queuedResult).rejects.toMatchObject({
      name: "AbortError",
    });

    controller.abort();
    await rejection;
    expect(queuedTask).not.toHaveBeenCalled();

    active.resolve();
    await activeResult;
    await vi.advanceTimersByTimeAsync(0);
    expect(queuedTask).not.toHaveBeenCalled();
  });
});
