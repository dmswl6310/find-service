// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {sessionMetrics} from '../../../scripts/transit-session-metrics.mjs';
import {makeTasks} from '../../../scripts/transit-direct-experiment-core.mjs';
describe('two-session measurement',()=>{
 it('submits both sessions round-robin to one queue',()=>{const tasks=makeTasks('3x3',2);expect(tasks).toHaveLength(18);expect(tasks.map(t=>t.sessionId)).toEqual(Array.from({length:18},(_,i)=>i%2+1));});
 it('includes queue wait and retains missing/error counts by session',()=>{expect(sessionMetrics({begunAt:1000,records:[{sessionId:1,startedAt:1100,completedAt:1200,classification:'success'},{sessionId:2,startedAt:1300,completedAt:1500,classification:'odsay-429'}]},[{sessionId:1},{sessionId:1},{sessionId:2}])).toEqual([{sessionId:1,planned:2,requests:1,success:1,errors:0,unscheduled:1,firstStartDelayMs:100,completionMs:200},{sessionId:2,planned:1,requests:1,success:0,errors:1,unscheduled:0,firstStartDelayMs:300,completionMs:500}]);});
});
