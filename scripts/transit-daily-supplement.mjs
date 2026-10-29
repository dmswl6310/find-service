import {existsSync, readFileSync, writeFileSync, renameSync} from 'node:fs';
import path from 'node:path';
import {quotaDay, dailyAllowance} from './transit-daily-policy.mjs';
import {acquireExperimentLock, otherReservedCalls} from './transit-experiment-budget.mjs';
import {createOdsayTransport, makeTasks, runDirectBatch, summarizeBatch} from './transit-direct-experiment-core.mjs';

const args = new Map(process.argv.slice(2).map(arg => {const at = arg.indexOf('='); return [arg.slice(2, at), arg.slice(at + 1)];}));
const evidence = {used: Number(args.get('used')), limit: 30, confirmedAt: args.get('confirmed-at'), source: args.get('source')};
const day = quotaDay();
const directory = path.resolve('docs/results');
const output = path.join(directory, `transit-reexperiment-${day}-daily`);
const statePath = path.join(output, 'state.json');
dailyAllowance(evidence);
const release = acquireExperimentLock(directory, day);
process.once('exit', release);
if (!existsSync(statePath)) throw new Error("Today's comparison ledger is missing");
const state = JSON.parse(readFileSync(statePath, 'utf8'));
if (state.pending || state.halted || state.supplement || state.reservedCalls !== 18 || state.batches.length !== 2 || state.batches.some((batch, index) => batch.gapMs !== [250, 500][index] || !batch.eligible)) {
  throw new Error('Supplement preconditions not met: require successful 250ms/500ms batches and exactly 18 prior calls');
}
const others = otherReservedCalls(directory, day, statePath);
const allowance = dailyAllowance(evidence, new Date(), others);
if (allowance < 30 || state.reservedCalls + 12 > allowance) throw new Error('Full-day allowance is not available for the partial repeat');

const persist = () => {
  const tmp = `${statePath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(tmp, statePath);
  const headers = ['id','gapMs','requests','success','errors','http429','odsay429','odsayMinus1','totalMs','minStartGapMs','maxActive','maxStarts1s','unscheduled','eligible','stopReason'];
  writeFileSync(path.join(output, 'matrix.csv'), `${headers.join(',')}\n${state.batches.map(batch => headers.map(key => JSON.stringify(batch[key] ?? '')).join(',')).join('\n')}\n`);
  const rows = state.batches.map(batch => `| ${[batch.id,batch.gapMs,`${batch.success}/${batch.requests}`,(batch.totalMs/1000).toFixed(3),batch.minStartGapMs ?? '—',batch.maxActive,batch.maxStarts1s,batch.stopReason ?? '없음'].join(' | ')} |`);
  writeFileSync(path.join(output, 'matrix.md'), `# ${day} ODsay 간격 비교\n\n직접 호출, 동시 상한 없음. 시작 사용량은 사용자 상시 확인 ${evidence.used}건. 실험 총 시도 ${state.reservedCalls}회. 상태: ${state.halted ?? (state.complete ? '오늘 계획 완료' : '진행')}.\n\n| 배치 | 간격 ms | 정상/시도 | 완료 초 | 실제 최소 간격 ms | 최대 동시 | 최대 1초 시작 | 오류 |\n|---|---:|---:|---:|---:|---:|---:|---|\n${rows.join('\n')}\n\n3x3 완성 배치와 부분 12회는 별도 기록하며 부분 배치는 완성 배치 속도/반복수와 비교하지 않는다. 최적값과 장기 안정성은 미확정이다.\n`);
};

const previousEnd = state.batches.at(-1).endedAt;
const restUntil = previousEnd + 30000;
while (Date.now() < restUntil) await new Promise(resolve => setTimeout(resolve, Math.min(10000, restUntil - Date.now())));
if (quotaDay() !== day || state.reservedCalls + 12 + otherReservedCalls(directory, day, statePath) > allowance) throw new Error('Day or call-budget preconditions changed during rest');
if (!existsSync('.env.local')) throw new Error('.env.local missing');
process.loadEnvFile('.env.local');
const transport = createOdsayTransport({apiKey: process.env.ODSAY_API_KEY, appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://moduspot.vercel.app'});
const abort = new AbortController();
process.once('SIGINT', () => abort.abort());
const id = `batch-${String(state.batches.length + 1).padStart(3, '0')}`;
state.supplement = {status: 'running', role: 'partial-reference-repeat-not-comparable', gapMs: 500, calls: 12};
state.pending = {id, gapMs: 500, reserved: 12, role: state.supplement.role};
state.reservedCalls += 12;
persist();
const result = await runDirectBatch({tasks: makeTasks('5x5').slice(0, 12), gapMs: 500, transport, signal: abort.signal});
writeFileSync(path.join(output, `${id}.json`), `${JSON.stringify(result, null, 2)}\n`);
state.reservedCalls -= result.unscheduled;
state.pending = null;
const summary = {id, role: state.supplement.role, caseId: '5x5-partial', begunAt: result.begunAt, endedAt: result.endedAt, ...summarizeBatch(result)};
state.batches.push(summary);
if (!summary.eligible) {
  state.halted = summary.stopReason || 'incomplete';
  state.supplement.status = 'stopped';
} else {
  state.supplement.status = 'complete';
}
state.supplement.finishedAt = new Date().toISOString();
persist();
console.log(JSON.stringify({summary, reservedCalls: state.reservedCalls, completeComparison: state.batches.slice(0, 2).every(batch => batch.eligible), supplement: state.supplement, halted: state.halted}));
