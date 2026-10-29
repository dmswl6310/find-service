import { experimentCases } from "./transit-experiment-fixtures.mjs";

export function classifyOdsay(status, payload) {
  const entry = Array.isArray(payload?.error) ? payload.error[0] : payload?.error;
  const code = entry?.code === undefined ? null : String(entry.code);
  if (status === 429) return "http-429";
  if (code === "429") return "odsay-429";
  if (code === "-1") return "odsay-minus-1";
  if (status >= 500) return "http-5xx";
  if (status >= 400) return "http-error";
  if (code === "-98") return "walk-only";
  if (entry) return "odsay-error";
  const info = payload?.result?.path?.[0]?.info;
  return Number.isFinite(info?.totalTime) && Number.isFinite(info?.payment) ? "success" : "invalid-payload";
}

export function makeTasks(caseId, sessions = 1) {
  const fixture = experimentCases[caseId];
  if (!fixture || !Number.isInteger(sessions) || sessions < 1) throw new Error("Invalid fixture or sessions");
  // Round-robin submission prevents the second session being placed behind every first-session task.
  return fixture.starts.flatMap(start => fixture.ends.flatMap(end =>
    Array.from({ length: sessions }, (_, i) => ({ start, end, sessionId: i + 1 }))));
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function runDirectBatch({ tasks, gapMs, concurrency = tasks.length, timeoutMs = 30000, transport, signal }) {
  if (!Number.isInteger(gapMs) || gapMs < 1 || !Number.isInteger(concurrency) || concurrency < 1 || timeoutMs <= 0) throw new Error("Invalid batch policy");
  const begunAt = Date.now();
  const records = [];
  const active = new Set();
  let lastStart = null;
  let stopReason = null;
  let issued = 0;
  let maxActive = 0;
  let slotBlockedMs = 0;
  const onAbort = () => { stopReason ??= "cancelled"; };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    for (const task of tasks) {
      if (signal?.aborted) onAbort();
      if (stopReason) break;
      while (lastStart !== null && Date.now() < lastStart + gapMs && !stopReason) {
        await sleep(Math.min(20, lastStart + gapMs - Date.now()));
      }
      if (stopReason || signal?.aborted) break;
      if (active.size >= concurrency) {
        const blockedAt = Date.now();
        await Promise.race(active);
        slotBlockedMs += Date.now() - blockedAt;
      }
      if (stopReason || signal?.aborted) break;
      const startedAt = Date.now();
      lastStart = startedAt;
      const taskIndex = issued++;
      maxActive = Math.max(maxActive, active.size + 1);
      const controller = new AbortController();
      let timedOut = false;
      const abortActive = () => controller.abort();
      signal?.addEventListener("abort", abortActive, { once: true });
      const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
      let pending;
      pending = (async () => {
        let record;
        try {
          // This is the application's direct fetch issuance time, not remote-server processing time.
          const { status, payload } = await transport(task, { signal: controller.signal });
          const entry = Array.isArray(payload?.error) ? payload.error[0] : payload?.error;
          record = { status, errorCode: entry?.code === undefined ? null : String(entry.code), classification: classifyOdsay(status, payload), totalTime: payload?.result?.path?.[0]?.info?.totalTime ?? null };
        } catch {
          record = { status: null, errorCode: null, classification: timedOut ? "timeout" : signal?.aborted ? "cancelled" : "network-error", totalTime: null };
        } finally {
          clearTimeout(timer);
          signal?.removeEventListener("abort", abortActive);
        }
        const completedAt = Date.now();
        records.push({ ...record, taskIndex, fromId: task.start.id, toId: task.end.id, sessionId: task.sessionId, startedAt, completedAt, durationMs: completedAt - startedAt });
        // Conservative pause on ANY non-success; route errors need fixture review, not faster admission.
        if (record.classification !== "success") stopReason ??= record.classification;
      })().finally(() => active.delete(pending));
      active.add(pending);
    }
    await Promise.all(active);
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
  return { begunAt, endedAt: Date.now(), gapMs, concurrency, timeoutMs, totalTasks: tasks.length, issued, unscheduled: tasks.length - issued, stopReason, maxActive, slotBlockedMs, records: records.sort((a, b) => a.taskIndex - b.taskIndex) };
}

export function summarizeBatch(batch) {
  const count = label => batch.records.filter(r => r.classification === label).length;
  const starts = batch.records.map(r => r.startedAt).sort((a, b) => a - b);
  const gaps = starts.slice(1).map((at, i) => at - starts[i]);
  let maxStarts1s = 0;
  for (const at of starts) maxStarts1s = Math.max(maxStarts1s, starts.filter(x => x > at - 1000 && x <= at).length);
  return { gapMs: batch.gapMs, cap: batch.concurrency === batch.totalTasks ? "none" : batch.concurrency, requests: batch.issued, success: count("success"), errors: batch.issued - count("success"), http429: count("http-429"), odsay429: count("odsay-429"), odsayMinus1: count("odsay-minus-1"), timeouts: count("timeout"), totalMs: batch.endedAt - batch.begunAt, minStartGapMs: gaps.length ? Math.min(...gaps) : null, maxActive: batch.maxActive, maxStarts1s, slotBlockedMs: batch.slotBlockedMs, unscheduled: batch.unscheduled, stopReason: batch.stopReason, eligible: !batch.stopReason && batch.issued === batch.totalTasks && count("success") === batch.totalTasks };
}

export function createOdsayTransport({ apiKey, appUrl, fetchImpl = fetch }) {
  if (!apiKey) throw new Error("ODSAY_API_KEY missing");
  return async (task, { signal }) => {
    const query = new URLSearchParams({ SX: task.start.x, SY: task.start.y, EX: task.end.x, EY: task.end.y, apiKey });
    const response = await fetchImpl(`https://api.odsay.com/v1/api/searchPubTransPathT?${query}`, {
      signal, cache: "no-store", headers: { Referer: appUrl, Origin: appUrl },
    });
    if (response.status >= 400) {
      void response.body?.cancel().catch(() => {});
      return { status: response.status, payload: null };
    }
    const payload = await response.json().catch(() => null);
    return { status: response.status, payload };
  };
}
