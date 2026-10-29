import {existsSync, readFileSync, writeFileSync, renameSync} from 'node:fs';
import path from 'node:path';
import {quotaDay, dailyAllowance} from './transit-daily-policy.mjs';
import {acquireExperimentLock, otherReservedCalls} from './transit-experiment-budget.mjs';
import {createOdsayTransport, makeTasks, runDirectBatch, summarizeBatch} from './transit-direct-experiment-core.mjs';

const day = '2026-10-24';
const directory = path.resolve('docs/results');
const output = path.join(directory, `transit-reexperiment-${day}-daily`);
const statePath = path.join(output, 'state.json');
const release = acquireExperimentLock(directory, day);
process.once('exit', release);
const state = JSON.parse(readFileSync(statePath, 'utf8'));
if (quotaDay() !== day || state.pending || state.halted !== 'odsay-429' || state.supplement || state.reservedCalls !== 6) {
  throw new Error('Recovery preconditions not met');
}

const evidence = state.quotaEvidence;
state.supplement = {previousHalt: state.halted, authorization: 'standing-user-confirmation-unused-service; daily limit 30', status: 'waiting-cooldown'};

const persist = () => {
  const tmp = `${statePath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(tmp, statePath);
  const headers = ['id','gapMs','requests','success','errors','http429','odsay429','odsayMinus1','totalMs','minStartGapMs','maxActive','maxStarts1s','unscheduled','eligible','stopReason'];
  writeFileSync(path.join(output, 'matrix.csv'), `${headers.join(',')}\n${state.batches.map(batch => headers.map(key => JSON.stringify(batch[key] ?? '')).join(',')).join('\n')}\n`);
  const rows = state.batches.map(batch => `| ${[batch.id,batch.gapMs,`${batch.success}/${batch.requests}`,(batch.totalMs/1000).toFixed(3),batch.minStartGapMs ?? '—',batch.maxActive,batch.maxStarts1s,batch.stopReason ?? '없음'].join(' | ')} |`);
  writeFileSync(path.join(output, 'matrix.md'), `# ${day} ODsay 간격 비교\n\n직접 호출, 동시 상한 없음. 오늘 사용량은 사용자 상시 확인 0건. 실험과 기존 예약 포함 ${state.reservedCalls}회 시도. 상태: ${state.halted ?? (state.complete ? '오늘 계획 완료' : '진행')}.\n\n| 배치 | 간격 ms | 정상/시도 | 완료 초 | 실제 최소 간격 ms | 최대 동시 | 최대 1초 시작 | 오류 |\n|---|---:|---:|---:|---:|---:|---:|---|\n${rows.join('\n')}\n\n125ms 오류로 해당 배치 중단. 회복 및 부분 반복은 완성 배치 비교와 분리한다.\n`);
};
persist();

const failedAt = state.batches.at(-1).endedAt;
const recoveryAt = failedAt + 300000;
while (Date.now() < recoveryAt) await new Promise(resolve => setTimeout(resolve, Math.min(10000, recoveryAt - Date.now())));
if (quotaDay() !== day || dailyAllowance(evidence) < 24 || otherReservedCalls(directory, day, statePath) > 0) {
  state.supplement.status = 'stopped';
  state.supplement.reason = 'daily-budget-or-reservation-check-failed';
  state.complete = false;
  persist();
  throw new Error('Recovery budget preconditions changed');
}

if (!existsSync('.env.local')) throw new Error('.env.local missing');
process.loadEnvFile('.env.local');
const transport = createOdsayTransport({apiKey: process.env.ODSAY_API_KEY, appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://moduspot.vercel.app'});
const abort = new AbortController();
process.once('SIGINT', () => abort.abort());

for (const [count, role] of [[9, '500ms-recovery-and-baseline'], [15, '500ms-partial-not-comparable']]) {
  if (abort.signal.aborted || state.reservedCalls + count > 30 || otherReservedCalls(directory, day, statePath) > 0) break;
  const id = `batch-${String(state.batches.length + 1).padStart(3, '0')}`;
  state.pending = {id, gapMs: 500, reserved: count, role};
  state.reservedCalls += count;
  persist();
  const tasks = (count === 9 ? makeTasks('3x3') : makeTasks('5x5')).slice(0, count);
  const result = await runDirectBatch({tasks, gapMs: 500, transport, signal: abort.signal});
  writeFileSync(path.join(output, `${id}.json`), `${JSON.stringify(result, null, 2)}\n`);
  state.reservedCalls -= result.unscheduled;
  state.pending = null;
  const summary = {id, role, caseId: count === 9 ? '3x3' : '5x5-partial', begunAt: result.begunAt, endedAt: result.endedAt, ...summarizeBatch(result)};
  state.batches.push(summary);
  if (!summary.eligible) {
    state.halted = summary.stopReason || 'incomplete';
    state.supplement.status = 'stopped';
    state.complete = false;
  }
  persist();
  console.log(JSON.stringify(summary));
  if (!summary.eligible) break;
  if (count === 9) await new Promise(resolve => setTimeout(resolve, 30000));
  else state.supplement.status = 'complete';
}

state.complete = false;
state.supplement.finishedAt = new Date().toISOString();
state.supplement.callsUsed = state.reservedCalls;
if (state.supplement.status !== 'stopped') state.supplement.status = 'complete';
persist();
console.log(JSON.stringify({reservedCalls: state.reservedCalls, halted: state.halted, supplement: state.supplement}));
