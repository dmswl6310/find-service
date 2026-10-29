import {readFileSync, writeFileSync, renameSync} from 'node:fs';
import path from 'node:path';
import {quotaDay} from './transit-daily-policy.mjs';
import {acquireExperimentLock, otherReservedCalls} from './transit-experiment-budget.mjs';
import {createOdsayTransport, makeTasks, runDirectBatch, summarizeBatch} from './transit-direct-experiment-core.mjs';
const directory=path.resolve('docs/results');
const day='2026-10-08';
const output=path.join(directory,'transit-reexperiment-'+day+'-daily');
const statePath=path.join(output,'state.json');
const release=acquireExperimentLock(directory,day);process.once('exit',release);
const state=JSON.parse(readFileSync(statePath,'utf8'));
if(quotaDay()!==day || state.pending || state.halted || state.supplement || state.reservedCalls!==18 || Date.now()-state.batches.at(-1).endedAt<30000)throw new Error('Supplement preconditions not met');
state.supplement={authorization:'user explicitly requests full30 daily attempts; daily starting usage0, service unused',status:'running'};
const save=()=>{writeFileSync(statePath+'.tmp',JSON.stringify(state,null,2)+'\n');renameSync(statePath+'.tmp',statePath);};
save();process.loadEnvFile('.env.local');
const transport=createOdsayTransport({apiKey:process.env.ODSAY_API_KEY,appUrl:process.env.NEXT_PUBLIC_APP_URL||'https://moduspot.vercel.app'});
const abort=new AbortController();process.once('SIGINT',()=>abort.abort());
for(const [count,role] of [[9,'500ms-baseline'],[3,'500ms-partial-repeat-not-comparable']]){
 if(state.reservedCalls+count+otherReservedCalls(directory,day,statePath)>30 || abort.signal.aborted)throw new Error('Daily budget exhausted or cancelled');
 const id='batch-'+String(state.batches.length+1).padStart(3,'0');
 state.pending={id,gapMs:500,reserved:count,role};state.reservedCalls+=count;save();
 const result=await runDirectBatch({tasks:makeTasks('3x3').slice(0,count),gapMs:500,transport,signal:abort.signal});
 writeFileSync(path.join(output,id+'.json'),JSON.stringify(result,null,2)+'\n');
 state.reservedCalls-=result.unscheduled;state.pending=null;
 const summary={id,role,begunAt:result.begunAt,endedAt:result.endedAt,...summarizeBatch(result)};
 state.batches.push(summary);
 if(!summary.eligible){state.halted=summary.stopReason||'incomplete';state.supplement.status='stopped';state.complete=false;}
 save();console.log(JSON.stringify(summary));if(state.halted)break;
 if(count===9)await new Promise(resolve=>setTimeout(resolve,30000));
 else{state.supplement.status='complete';state.complete=true;save();}
}
console.log(JSON.stringify({reservedCalls:state.reservedCalls,halted:state.halted,supplement:state.supplement}));
