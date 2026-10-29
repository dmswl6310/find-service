// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyOdsay, createOdsayTransport, makeTasks, runDirectBatch, summarizeBatch } from "../../../scripts/transit-direct-experiment-core.mjs";

afterEach(() => vi.useRealTimers());

describe("direct transit experiment", () => {
  it("recognizes HTTP and payload limits without treating route failures as success", () => {
    expect(classifyOdsay(429, {})).toBe("http-429");
    expect(classifyOdsay(200, { error: [{code: "429"}] })).toBe("odsay-429");
    expect(classifyOdsay(200, { error: [{ code: -1 }] })).toBe("odsay-minus-1");
    expect(classifyOdsay(200, { error: { code: "-98" } })).toBe("walk-only");
    expect(classifyOdsay(200, { error: { code: "-9" } })).toBe("odsay-error");
    expect(classifyOdsay(200, { result: { path: [{ info: { totalTime: 30, payment: 1500 } }] } })).toBe("success");
    expect(classifyOdsay(200, {})).toBe("invalid-payload");
  });

  it("uses direct ODsay coordinates, headers and cancellation without a proxy or logged key", async () => {
    const signal = new AbortController().signal;
    const fetchImpl = vi.fn(async () => ({status: 200, json: async () => ({result: {path: []}})}));
    await createOdsayTransport({apiKey: "test-secret+/", appUrl: "https://example.test", fetchImpl})(makeTasks("1x1")[0], {signal});
    const [url, options] = fetchImpl.mock.calls[0] as unknown as [string, {signal: AbortSignal; headers: {Origin: string}}];
    expect(new URL(url).hostname).toBe("api.odsay.com");
    expect(new URL(url).searchParams.get("apiKey")).toBe("test-secret+/");
    expect(options.signal).toBe(signal);
    expect(options.headers.Origin).toBe("https://example.test");
  });

  it.each([429, 503, 401])("returns HTTP %s immediately even when its body never completes", async (status) => {
    const json = vi.fn(() => new Promise(() => {}));
    const fetchImpl = vi.fn(async () => ({status, json, body: {cancel: async () => {}}}));
    const transport = createOdsayTransport({apiKey: "test", appUrl: "https://example.test", fetchImpl});
    const result = await Promise.race([
      transport(makeTasks("1x1")[0], {signal: new AbortController().signal}),
      new Promise(resolve => setTimeout(() => resolve("body-blocked"), 20)),
    ]);
    expect(result).toEqual({status, payload: null});
    expect(json).not.toHaveBeenCalled();
  });

  it("starts direct calls at the configured gap without the app server limiter", async () => {
    vi.useFakeTimers();
    const issued: number[] = [];
    const pending = runDirectBatch({ tasks: makeTasks("3x3", 1), gapMs: 250,
      transport: async () => { issued.push(Date.now()); await new Promise(r => setTimeout(r, 2000)); return { status: 200, payload: { result: { path: [{ info: { totalTime: 30, payment: 1500 } }] } } }; }
    });
    await vi.runAllTimersAsync();
    const batch = await pending;
    expect(issued).toHaveLength(9);
    expect(issued.slice(1).map((at, i) => at - issued[i])).toEqual(Array(8).fill(250));
    expect(summarizeBatch(batch).maxActive).toBe(8);
    expect(summarizeBatch(batch).success).toBe(9);
  });

  it("stops new admission on a rate limit and drains calls already issued", async () => {
    vi.useFakeTimers();
    let issued = 0;
    const pending = runDirectBatch({ tasks: makeTasks("3x3", 1), gapMs: 250,
      transport: async () => { issued++; return { status: 200, payload: { error: { code: "-1" } } }; }
    });
    await vi.runAllTimersAsync();
    const batch = await pending;
    expect(issued).toBe(1);
    expect(batch.stopReason).toBe("odsay-minus-1");
    expect(batch.unscheduled).toBe(8);
    expect(summarizeBatch(batch).errors).toBe(1);
  });

  it("records timeout and does not label a failed batch as a fast successful result", async () => {
    vi.useFakeTimers();
    const pending = runDirectBatch({ tasks: makeTasks("1x1", 1), gapMs: 250, timeoutMs: 30,
      transport: async (_task: unknown, { signal }: {signal: AbortSignal}) => new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
      })
    });
    await vi.runAllTimersAsync();
    const summary = summarizeBatch(await pending);
    expect(summary.timeouts).toBe(1);
    expect(summary.eligible).toBe(false);
  });

  it("cancels queued work and aborts active transports", async () => {
    vi.useFakeTimers();
    const abort = new AbortController();
    let issued = 0;
    const pending = runDirectBatch({ tasks: makeTasks("3x3", 1), gapMs: 250, signal: abort.signal,
      transport: async (_task: unknown, { signal }: {signal: AbortSignal}) => {
        issued++; return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true }));
      }
    });
    setTimeout(() => abort.abort(), 600);
    await vi.runAllTimersAsync();
    const batch = await pending;
    expect(issued).toBe(3);
    expect(batch.unscheduled).toBe(6);
    expect(batch.records.every((r: {classification: string}) => r.classification === "cancelled")).toBe(true);
  });
});
