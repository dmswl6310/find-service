import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { createOdsayTransport, makeTasks, runDirectBatch, summarizeBatch } from "./transit-direct-experiment-core.mjs";
import { acquireExperimentLock, otherReservedCalls } from "./transit-experiment-budget.mjs";

const args = new Map(process.argv.slice(2).map(arg => { const i = arg.indexOf("="); return [arg.slice(2, i), arg.slice(i + 1)]; }));
const phase = args.get("phase") ?? "explore";
const root = path.resolve(args.get("output") ?? "docs/results/transit-reexperiment-2026-10-06");
const budget = Number(args.get("budget") ?? 400);
if (!Number.isInteger(budget) || budget < 1 || budget > 400) throw new Error("Budget must be 1..400");
const verifiedDailyLimit = Number(args.get("daily-limit") ?? 30);
const usedBefore = Number(args.get("used-before") ?? 0);
if (!Number.isInteger(verifiedDailyLimit) || !Number.isInteger(usedBefore) || usedBefore < 0 || budget > verifiedDailyLimit - usedBefore) throw new Error("Experiment budget exceeds confirmed remaining daily quota (Basic default 30). Re-plan before execution.");
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const transport = createOdsayTransport({ apiKey: process.env.ODSAY_API_KEY, appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://moduspot.vercel.app" });
mkdirSync(root, { recursive: true });
const resultDirectory = path.resolve("docs/results");
if (path.dirname(root) !== resultDirectory || !path.basename(root).startsWith("transit-reexperiment-2026-10-06")) throw new Error("Output must stay in the shared day result namespace");
const releaseLock = acquireExperimentLock(resultDirectory, "2026-10-06");
process.once("exit", releaseLock);
const statePath = path.join(root, "state.json");
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : {
  version: 1, budget, dateKst: "2026-10-06", dailyLimit: 1000, priorUsageUserReported: 0,
  source: "direct ODsay fetch issuance; bypasses production server/browser limiters",
  timestampMeaning: "local fetch issuance and full JSON receipt, not upstream internal processing or wire arrival",
  departureCondition: "no explicit date/time, same as departure-time toggle off",
  createdAt: new Date().toISOString(), reservedCalls: 0, batches: [], halted: null, explorationComplete: false,
};
if (state.dateKst !== new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())) throw new Error("State date differs from current KST day");
if (state.halted === "daily-quota-exhausted" || state.quotaCorrection) throw new Error("Confirmed daily quota exhausted; recovery probing disabled. Re-plan with current quota before any new run.");
if (state.pending || (state.halted && phase !== "recovery")) throw new Error("Experiment paused or unresolved batch; review state before manual resumption");
const controller = new AbortController();
process.once("SIGINT", () => controller.abort());
const persist = () => {
  const temp = statePath + ".tmp";
  writeFileSync(temp, JSON.stringify(state, null, 2) + "\n");
  renameSync(temp, statePath);
  const headers = ["stage", "caseId", "sessions", "gapMs", "cap", "requests", "success", "errors", "http429", "odsay429", "odsayMinus1", "timeouts", "totalMs", "minStartGapMs", "maxActive", "maxStarts1s", "slotBlockedMs", "unscheduled", "stopReason", "eligible"];
  writeFileSync(path.join(root, "matrix.csv"), headers.join(",") + "\n" + state.batches.map(b => headers.map(h => JSON.stringify(b[h] ?? "")).join(",")).join("\n") + "\n");
  const rows = state.batches.map(b => `| ${b.stage} | ${b.caseId}/${b.sessions}명 | ${b.gapMs} | ${b.success}/${b.requests} | ${(b.totalMs / 1000).toFixed(3)} | ${b.minStartGapMs ?? "—"} | ${b.maxActive} | ${b.maxStarts1s} | ${b.stopReason ?? "없음"} |`);
  writeFileSync(path.join(root, "matrix.md"), `# ODsay 실제 호출 실험\n\n진행 중 결과. 완료 및 반복 검증 전 운영값을 확정하지 않음. 동시 상한 비활성화, G=0, 별도 R 제한 없음. 시간은 직접 fetch 호출 시점부터 JSON 수신 완료까지이며 외부 서버 내부 처리 시각은 아님.\n\n예산 사용(예약 포함): ${state.reservedCalls}/${state.budget}. 실제 완료 기록: ${state.batches.reduce((s,b)=>s+b.requests,0)}회. 상태: ${state.halted ?? "진행/대기"}.\n\n| 단계 | 배치/사용자 | 간격 ms | 정상/호출 | 완료 초 | 실제 최소 간격 ms | 최대 동시 | 최대 1초 시작 | 중단 이유 |\n|---|---|---:|---:|---:|---:|---:|---:|---|\n${rows.join("\n")}\n`);
};
const pause = async () => {
  const last = state.batches.at(-1);
  if (!last) return;
  const delay = Math.max(0, last.endedAt + 30000 - Date.now());
  if (delay) await new Promise(resolve => setTimeout(resolve, delay));
};
async function batch(stage, gapMs, caseId = "3x3", sessions = 1, reserve = 0) {
  const tasks = makeTasks(caseId, sessions);
  const otherCalls = otherReservedCalls(resultDirectory, state.dateKst, statePath);
  if (state.reservedCalls + otherCalls + tasks.length + reserve > state.budget) return null;
  await pause();
  if (controller.signal.aborted) return null;
  const id = `batch-${String(state.batches.length + 1).padStart(3, "0")}`;
  state.pending = { id, stage, gapMs, caseId, sessions, reserved: tasks.length };
  state.reservedCalls += tasks.length;
  persist(); // Reserve before issuance; an interrupted unknown batch remains charged conservatively.
  const result = await runDirectBatch({ tasks, gapMs, transport, signal: controller.signal });
  writeFileSync(path.join(root, id + ".json"), JSON.stringify(result, null, 2) + "\n");
  const row = { id, stage, caseId, sessions, begunAt: result.begunAt, endedAt: result.endedAt, ...summarizeBatch(result) };
  state.reservedCalls -= result.unscheduled;
  state.batches.push(row);
  state.pending = null;
  if (!row.eligible) state.halted = row.stopReason || "incomplete-batch";
  persist();
  console.log(JSON.stringify(row));
  if (state.halted) throw new Error("Paused: " + state.halted + "; no automatic retry");
  return row;
}

persist();
if (phase === "explore") {
  if (state.batches.length) throw new Error("Exploration already started; review rather than replay");
  // Reserve 3 candidates * 4 blocks * 9 requests + final confirmation 172 = 280.
  const reserve = 280;
  let previous = await batch("explore", 500, "3x3", 1, reserve);
  if (!previous) throw new Error("Insufficient exploration budget");
  let gap = 250;
  const tested = [500];
  while (gap >= 1) {
    const first = await batch("explore", gap, "3x3", 1, reserve + 18);
    if (!first) { state.explorationEnd = "budget"; break; }
    const second = await batch("reverse-check", gap, "3x3", 1, reserve + 9);
    const prevAgain = await batch("reverse-check", previous.gapMs, "3x3", 1, reserve);
    tested.push(gap);
    const improvement = 1 - (first.totalMs + second.totalMs) / (previous.totalMs + prevAgain.totalMs);
    const consistent = first.totalMs < previous.totalMs && second.totalMs < prevAgain.totalMs;
    state.explorationComparisons ??= [];
    state.explorationComparisons.push({ slow: previous.gapMs, fast: gap, improvement, consistent });
    if (!consistent || improvement < 0.10) { state.explorationEnd = consistent ? "improvement-under-10pct" : "inconsistent"; break; }
    previous = second;
    gap = Math.max(1, Math.ceil(gap / 2));
    if (gap === previous.gapMs) { state.explorationEnd = "integer-resolution"; break; }
  }
  state.testedGaps = tested;
  state.explorationComplete = true;
  persist();
} else if (phase === "compare") {
  if (!state.explorationComplete) throw new Error("Exploration not complete");
  if (state.batches.some(b => b.stage === "compare")) throw new Error("Comparison already started");
  const gaps = (args.get("gaps") ?? "").split(",").map(Number);
  if (gaps.length < 2 || gaps.length > 3 || new Set(gaps).size !== gaps.length || gaps.some(g => !Number.isInteger(g) || g < 1) || !gaps.includes(500)) throw new Error("Choose 2..3 unique gaps including 500");
  state.comparisonGaps = gaps;
  // Even three candidates receive four repeats. Rotate plus reverse the last block to reduce ordering bias.
  for (let block = 0; block < 4; block++) {
    let order = gaps.slice(block % gaps.length).concat(gaps.slice(0, block % gaps.length));
    if (block === 3) order = [...gaps].reverse();
    for (const g of order) {
      if (!await batch("compare", g, "3x3", 1, 172)) throw new Error("Budget exhausted before comparison complete");
    }
  }
  state.comparisonComplete = true;
  persist();
} else if (phase === "confirm") {
  if (!state.comparisonComplete) throw new Error("Comparison not complete");
  if (state.batches.some(b => b.stage.startsWith("confirm"))) throw new Error("Confirmation already started");
  const gap = Number(args.get("gap"));
  if (!state.comparisonGaps.includes(gap) || gap === 500) throw new Error("Choose a compared non-baseline gap");
  for (const g of [500, gap, gap, 500]) if (!await batch("confirm-single", g, "5x5")) throw new Error("Budget exhausted");
  for (const g of [gap, 500, 500, gap]) if (!await batch("confirm-multi", g, "3x3", 2)) throw new Error("Budget exhausted");
  state.confirmationComplete = true;
  persist();
} else if (phase === "recovery") {
  if (!state.halted || state.batches.some(b => b.stage === "recovery-probe")) throw new Error("Recovery requires one prior halt, and can be probed only once");
  const last = state.batches.at(-1);
  const until = last.endedAt + 5 * 60 * 1000;
  console.log(JSON.stringify({phase: "recovery-wait", until: new Date(until).toISOString(), rule: "one single probe only, no automatic retry or faster-gap resumption"}));
  await new Promise(resolve => setTimeout(resolve, Math.max(0, until - Date.now())));
  state.originalHalt = state.halted;
  state.halted = null;
  const probe = await batch("recovery-probe", 1000, "1x1");
  state.halted = "paused-after-recovery-probe";
  state.recoveryProbeSuccess = probe?.eligible ?? false;
  persist();
} else throw new Error("Unknown phase");
console.log(JSON.stringify({ phase, reservedCalls: state.reservedCalls, root, end: state.explorationEnd }));
