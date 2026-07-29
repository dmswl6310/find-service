import { describe, expect, it } from "vitest";
import { runScheduledRequests } from "../../../scripts/transit-request-scheduler.mjs";

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

describe("runScheduledRequests", () => {
  const policyCases = [
    { id: "Q01", concurrency: 1, minStartGapMs: 0, completionCooldownMs: 25 },
    { id: "Q02", concurrency: 1, minStartGapMs: 0, completionCooldownMs: 0 },
    { id: "Q03", concurrency: 2, minStartGapMs: 100, completionCooldownMs: 0 },
    { id: "Q04", concurrency: 2, minStartGapMs: 75, completionCooldownMs: 0 },
    { id: "Q05", concurrency: 2, minStartGapMs: 50, completionCooldownMs: 0 },
    { id: "Q06", concurrency: 2, minStartGapMs: 25, completionCooldownMs: 0 },
    { id: "Q07", concurrency: 3, minStartGapMs: 100, completionCooldownMs: 0 },
    { id: "Q08", concurrency: 3, minStartGapMs: 50, completionCooldownMs: 0 },
    {
      id: "Q09",
      concurrency: 2,
      minStartGapMs: 0,
      completionCooldownMs: 0,
      maxStartsPerWindow: 2,
      windowMs: 100,
    },
    {
      id: "Q10",
      concurrency: 3,
      minStartGapMs: 0,
      completionCooldownMs: 0,
      maxStartsPerWindow: 3,
      windowMs: 100,
    },
    {
      id: "Q11",
      concurrency: 2,
      minStartGapMs: 50,
      completionCooldownMs: 0,
      maxStartsPerWindow: 2,
      windowMs: 100,
    },
    {
      id: "Q12",
      concurrency: 3,
      minStartGapMs: 50,
      completionCooldownMs: 0,
      maxStartsPerWindow: 2,
      windowMs: 100,
    },
  ];

  it.each(policyCases)(
    "$id respects all configured admission limits",
    async (policyCase) => {
      const run = await runScheduledRequests({
        tasks: Array.from({ length: 10 }, (_, index) => index),
        policy: policyCase,
        worker: async (task: number) => {
          await wait(task % 4 === 0 ? 30 : 8);
          return { classification: "success" };
        },
      });

      const starts = run.results
        .map((result) => Date.parse(result.startedAt))
        .sort((left, right) => left - right);
      const gaps = starts.slice(1).map((startedAt, index) => startedAt - starts[index]);

      expect(run.results).toHaveLength(10);
      expect(run.maxObservedConcurrency).toBeLessThanOrEqual(policyCase.concurrency);

      if (policyCase.minStartGapMs > 0) {
        expect(Math.min(...gaps)).toBeGreaterThanOrEqual(policyCase.minStartGapMs - 2);
      }

      if (policyCase.maxStartsPerWindow && policyCase.windowMs) {
        for (const start of starts) {
          const startsInWindow = starts.filter(
            (candidate) =>
              candidate > start - policyCase.windowMs! && candidate <= start
          );
          expect(startsInWindow.length).toBeLessThanOrEqual(
            policyCase.maxStartsPerWindow
          );
        }
      }
    }
  );

  it("enforces concurrency and minimum start gap", async () => {
    const run = await runScheduledRequests({
      tasks: Array.from({ length: 6 }, (_, index) => index),
      policy: {
        concurrency: 2,
        minStartGapMs: 20,
      },
      worker: async () => {
        await wait(45);
        return { classification: "success" };
      },
    });

    const starts = run.results.map((result) => Date.parse(result.startedAt));
    const gaps = starts.slice(1).map((startedAt, index) => startedAt - starts[index]);

    expect(run.results).toHaveLength(6);
    expect(run.maxObservedConcurrency).toBe(2);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(18);
  });

  it("enforces a rolling start window even with fast responses", async () => {
    const run = await runScheduledRequests({
      tasks: Array.from({ length: 5 }, (_, index) => index),
      policy: {
        concurrency: 3,
        maxStartsPerWindow: 2,
        windowMs: 60,
      },
      worker: async () => {
        await wait(2);
        return { classification: "success" };
      },
    });

    const starts = run.results.map((result) => Date.parse(result.startedAt));

    for (const start of starts) {
      const startsInWindow = starts.filter(
        (candidate) => candidate > start - 60 && candidate <= start
      );
      expect(startsInWindow.length).toBeLessThanOrEqual(2);
    }

    expect(run.maxObservedStartsPerWindow).toBe(2);
  });

  it("waits after completion when a completion cooldown is configured", async () => {
    const run = await runScheduledRequests({
      tasks: [0, 1, 2],
      policy: {
        concurrency: 1,
        completionCooldownMs: 20,
      },
      worker: async () => {
        await wait(10);
        return { classification: "success" };
      },
    });

    const startTimes = run.results.map((result) => Date.parse(result.startedAt));
    const completionTimes = run.results.map((result) => Date.parse(result.completedAt));

    expect(startTimes[1] - completionTimes[0]).toBeGreaterThanOrEqual(18);
    expect(startTimes[2] - completionTimes[1]).toBeGreaterThanOrEqual(18);
  });

  it("stops admitting queued tasks after a rate-limit result", async () => {
    const run = await runScheduledRequests({
      tasks: Array.from({ length: 10 }, (_, index) => index),
      policy: {
        concurrency: 2,
        minStartGapMs: 15,
      },
      worker: async (task: number) => {
        await wait(20);
        return {
          classification: task === 2 ? "http-429" : "success",
        };
      },
    });

    expect(run.stopReason).toBe("http-429");
    expect(run.unscheduledTaskCount).toBeGreaterThan(0);
    expect(run.results.some((result) => result.classification === "http-429")).toBe(true);
  });

  it("does not treat walk-only results as rate-limit failures", async () => {
    const run = await runScheduledRequests({
      tasks: [0, 1, 2],
      policy: { concurrency: 2 },
      worker: async (task: number) => ({
        classification: task === 1 ? "walk-only" : "success",
      }),
    });

    expect(run.results).toHaveLength(3);
    expect(run.stopReason).toBeNull();
  });

  it("completes a 10x10-sized queue without exceeding limits", async () => {
    const run = await runScheduledRequests({
      tasks: Array.from({ length: 100 }, (_, index) => index),
      policy: {
        concurrency: 3,
        minStartGapMs: 5,
        maxStartsPerWindow: 10,
        windowMs: 60,
      },
      worker: async (task: number) => {
        await wait(task % 10 === 0 ? 20 : 7);
        return { classification: "success" };
      },
    });

    expect(run.results).toHaveLength(100);
    expect(run.unscheduledTaskCount).toBe(0);
    expect(run.maxObservedConcurrency).toBeLessThanOrEqual(3);
    expect(run.maxObservedStartsPerWindow).toBeLessThanOrEqual(10);
  });
});
