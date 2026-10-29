import {existsSync, mkdirSync, readFileSync, writeFileSync, renameSync} from "node:fs";
import path from "node:path";
import {quotaDay, dailyAllowance} from "./transit-daily-policy.mjs";
import {acquireExperimentLock, otherReservedCalls} from "./transit-experiment-budget.mjs";
import {createOdsayTransport, makeTasks, runDirectBatch, summarizeBatch} from "./transit-direct-experiment-core.mjs";

const args = new Map(process.argv.slice(2).map(arg => {const at=arg.indexOf("="); return [arg.slice(2,at),arg.slice(at+1)];}));
const evidence = {used: Number(args.get("used")), limit: 30, confirmedAt: args.get("confirmed-at"), source: args.get("source")};
const gaps = (args.get("gaps") ?? "").split(",").map(Number);
if (gaps.length > 2 || gaps.length < 1 || new Set(gaps).size !== gaps.length || gaps.some(g=>!Number.isInteger(g)||g<1)) throw new Error("Provide one or two unique positive integer gaps");
const day = quotaDay();
dailyAllowance(evidence);
const directory = path.resolve("docs/results");
const output = path.join(directory, "transit-reexperiment-"+day+"-daily");
const statePath = path.join(output,"state.json");
mkdirSync(directory,{recursive:true});
const release = acquireExperimentLock(directory, day);
process.once("exit",release);
if (existsSync(statePath)) throw new Error("Today's run already has a ledger; review it instead of replaying");
const others = otherReservedCalls(directory, day, statePath);
const allowance = dailyAllowance(evidence,new Date(),others);
if (allowance < 9) throw new Error("Fewer than nine experimental calls available in the confirmed remaining quota");
const plannedGaps = gaps.slice(0,Math.floor(allowance/9));
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const transport = createOdsayTransport({apiKey:process.env.ODSAY_API_KEY,appUrl:process.env.NEXT_PUBLIC_APP_URL||"https://moduspot.vercel.app"});
mkdirSync(output,{recursive:true});
const state = {version:1,dateKst:day,dailyLimit:30,quotaEvidence:evidence,otherReservedAtStart:others,allowance,plannedGaps,reservedCalls:0,batches:[],pending:null,halted:null,source:"direct fetch issuance/full JSON receipt, not remote processing",departureCondition:"no explicit date/time"};
const abort = new AbortController();
process.once("SIGINT",()=>abort.abort());
const persist = ()=>{
  const tmp=statePath+".tmp";writeFileSync(tmp,JSON.stringify(state,null,2)+"\n");renameSync(tmp,statePath);
  const headers=["id","gapMs","requests","success","errors","http429","odsay429","odsayMinus1","totalMs","minStartGapMs","maxActive","maxStarts1s","unscheduled","eligible","stopReason"];
  writeFileSync(path.join(output,"matrix.csv"),headers.join(",")+"\n"+state.batches.map(b=>headers.map(k=>JSON.stringify(b[k]??"")).join(",")).join("\n")+"\n");
  const rows=state.batches.map(b=>"| "+[b.id,b.gapMs,b.success+"/"+b.requests,(b.totalMs/1000).toFixed(3),b.minStartGapMs??"—",b.maxActive,b.maxStarts1s,b.stopReason??"없음"].join(" | ")+" |");
  writeFileSync(path.join(output,"matrix.md"),"# "+day+" ODsay 간격 비교\n\n직접 호출, 동시 상한 없음, 완료 후 대기 없음, 별도 시간창 제한 없음. 날짜/출발 시각 미지정. 오늘 사용량은 사용자 확인 "+evidence.used+"건. 실험 예약 포함 "+state.reservedCalls+"회. 상태: "+(state.halted??(state.complete?"오늘 계획 완료":"진행"))+".\n\n| 배치 | 간격 ms | 정상/시도 | 완료 초 | 실제 최소 간격 ms | 최대 동시 | 최대 1초 시작 | 오류 |\n|---|---:|---:|---:|---:|---:|---:|---|\n"+rows.join("\n")+"\n\n1회씩의 일별 관측이며 최적값/장기 안정성 확정 자료가 아니다. 다음 비교일에는 순서를 반대로 실행한다.\n");
};
persist();
try {
  for (const gapMs of plannedGaps) {
    if(abort.signal.aborted){state.halted="cancelled";break;}
    const currentAllowance=dailyAllowance(evidence,new Date(),otherReservedCalls(directory,day,statePath));
    if(state.reservedCalls+9>currentAllowance){state.halted="insufficient-quota";break;}
    const id="batch-"+String(state.batches.length+1).padStart(3,"0");
    state.pending={id,gapMs,reserved:9};state.reservedCalls+=9;persist();
    const result=await runDirectBatch({tasks:makeTasks("3x3"),gapMs,transport,signal:abort.signal});
    writeFileSync(path.join(output,id+".json"),JSON.stringify(result,null,2)+"\n");
    state.reservedCalls-=result.unscheduled;
    const summary={id,begunAt:result.begunAt,endedAt:result.endedAt,...summarizeBatch(result)};
    state.batches.push(summary);state.pending=null;
    if(!summary.eligible)state.halted=summary.stopReason||"incomplete";
    persist();console.log(JSON.stringify(summary));
    if(state.halted)break;
    if(state.batches.length<plannedGaps.length)await new Promise(resolve=>setTimeout(resolve,30000));
  }
  state.complete=!state.halted&&state.batches.length===plannedGaps.length;
  persist();console.log(JSON.stringify({output,reservedCalls:state.reservedCalls,complete:state.complete,halted:state.halted}));
} finally { /* exit handler releases the lock; unresolved reservations remain in ledger */ }
