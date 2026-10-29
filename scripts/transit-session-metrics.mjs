export function sessionMetrics(batch,tasks){
 return [...new Set(tasks.map(t=>t.sessionId))].sort((a,b)=>a-b).map(sessionId=>{
  const rows=batch.records.filter(r=>r.sessionId===sessionId);const planned=tasks.filter(t=>t.sessionId===sessionId).length;
  const success=rows.filter(r=>r.classification==='success').length;
  return {sessionId,planned,requests:rows.length,success,errors:rows.length-success,unscheduled:planned-rows.length,firstStartDelayMs:rows.length?Math.min(...rows.map(r=>r.startedAt))-batch.begunAt:null,completionMs:rows.length?Math.max(...rows.map(r=>r.completedAt))-batch.begunAt:null};
 });
}
