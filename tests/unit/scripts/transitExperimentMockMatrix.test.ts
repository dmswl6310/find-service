// @vitest-environment node
import { writeFileSync, mkdirSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { makeTasks, runDirectBatch, summarizeBatch } from "../../../scripts/transit-direct-experiment-core.mjs";

afterEach(() => vi.useRealTimers());

it("produces a labelled synthetic matrix for delays, timeouts and cancellation without external requests", async () => {
  vi.useFakeTimers();
  const rows: Record<string, unknown>[] = [];
  const successfulPayload = {result: {path: [{info: {totalTime: 30, payment: 1500}}]}};
  for (const caseId of ["3x3", "5x5", "8x8"]) {
    for (const sessions of [1, 2, 5]) {
      for (const scenario of ["normal-500ms", "normal-2000ms", "mixed-10000ms", "timeout-31000ms", "cancel-at-2000ms"]) {
        const tasks = makeTasks(caseId, sessions);
        for (const cap of [tasks.length, 3, 5, 8]) {
          const abort = new AbortController();
          const pending = runDirectBatch({tasks, gapMs: 250, concurrency: cap, signal: abort.signal,
            transport: async (task: {fromId?: string; start: {id: string}}, {signal}: {signal: AbortSignal}) => {
              const delay = scenario === "normal-500ms" ? 500 : scenario === "normal-2000ms" ? 2000 : scenario === "mixed-10000ms" ? (task.start.id === tasks[0].start.id ? 10000 : 500) : 31000;
              return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {signal.removeEventListener("abort", cancelled); resolve({status: 200, payload: successfulPayload});}, delay);
                function cancelled() {clearTimeout(timer); reject(new DOMException("aborted", "AbortError"));}
                signal.addEventListener("abort", cancelled, {once: true});
              });
            }
          });
          if (scenario === "cancel-at-2000ms") setTimeout(() => abort.abort(), 2000);
          await vi.runAllTimersAsync();
          const summary = summarizeBatch(await pending);
          expect(summary.maxActive).toBeLessThanOrEqual(cap);
          if (scenario.startsWith("normal") || scenario.startsWith("mixed")) expect(summary.success).toBe(tasks.length);
          if (scenario.startsWith("timeout")) expect(summary.timeouts).toBeGreaterThan(0);
          if (scenario.startsWith("cancel")) expect(summary.eligible).toBe(false);
          rows.push({caseId, sessions, scenario, ...summary});
        }
      }
    }
  }
  mkdirSync("docs/results/transit-reexperiment-2026-10-06-mock", {recursive: true});
  writeFileSync("docs/results/transit-reexperiment-2026-10-06-mock/matrix.json", JSON.stringify({source: "synthetic transports, Vitest virtual clock; NOT actual ODsay performance", gapMs: 250, rows}, null, 2));
  const headers = Object.keys(rows[0]);
  writeFileSync("docs/results/transit-reexperiment-2026-10-06-mock/matrix.csv", headers.join(",") + "\n" + rows.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(",")).join("\n"));
  expect(rows).toHaveLength(180);
}, 60000);
