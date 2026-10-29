import {readFileSync, writeFileSync, renameSync} from 'node:fs';
import {dailyAllowance, quotaDay} from './transit-daily-policy.mjs';
import {acquireExperimentLock, otherReservedCalls} from './transit-experiment-budget.mjs';
import {createOdsayTransport, makeTasks, runDirectBatch, summarizeBatch} from './transit-direct-experiment-core.mjs';
import path from 'node:path';

const directory=path.resolve('docs/results');
const output=path.join(directory,'transit-reexperiment-2026-10-07-daily');
const statePath=path.join(output,'state.json');
const release=acquireExperimentLock(directory,'2026-10-07');
process.once('exit',release);
const state=JSON.parse(readFileSync(statePath,'utf8'));
if(quotaDay()!==state.dateKst || state.pending || state.continuation || state.halted!=='odsay-429') throw new Error('Continuation preconditions not met');
dailyAllowance(state.quotaFollowup);
if(state.quotaFollowup.used!==14 || state.reservedCalls!==15 || Date.now()-state.batches.at(-1).endedAt<300000) throw new Error('Usage/cooldown evidence does not match');
state.continuation={authorizedBy:'user: use all remaining daily calls; service unused',startedAt:new Date().toISOString(),previousHalt:state.halted,cooldownMinimumMs:300000,status:'pending'};
const save=()=>{writeFileSync(statePath+'.tmp',JSON.stringify(state,null,2)+'\n');renameSync(statePath+'.tmp',statePath);};
save();
process.loadEnvFile('.env.local');
const transport=createOdsayTransport({apiKey:process.env.ODSAY_API_KEY,appUrl:process.env.NEXT_PUBLIC_APP_URL||'https://moduspot.vercel.app'});
const abort=new AbortController();process.once('SIGINT',()=>abort.abort());
for(const [gapMs,count,role] of [[250,6,'recovery-probe'],[200,9,'candidate-comparison']]){
  dailyAllowance(state.quotaFollowup);
  const others=otherReservedCalls(directory,state.dateKst,statePath);
  if(state.quotaEvidence.used+others+state.reservedCalls+count>30 || abort.signal.aborted) throw new Error('Daily attempt budget exhausted or cancelled');
  const id='batch-'+String(state.batches.length+1).padStart(3,'0');
  state.pending={id,gapMs,reserved:count,role};state.reservedCalls+=count;save();
  const result=await runDirectBatch({tasks:makeTasks('3x3').slice(0,count),gapMs,transport,signal:abort.signal});
  writeFileSync(path.join(output,id+'.json'),JSON.stringify(result,null,2)+'\n');
  state.reservedCalls-=result.unscheduled;state.pending=null;
  const summary={id,role,begunAt:result.begunAt,endedAt:result.endedAt,...summarizeBatch(result)};
  state.batches.push(summary);
  state.continuation.status=summary.eligible?'running':'stopped';
  state.continuation.stopReason=summary.stopReason;save();console.log(JSON.stringify(summary));
  if(!summary.eligible)break;
  if(role==='recovery-probe')await new Promise(resolve=>setTimeout(resolve,30000));
  else {state.continuation.status='complete';save();}
}
console.log(JSON.stringify({reservedCalls:state.reservedCalls,continuation:state.continuation}));
