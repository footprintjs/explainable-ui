import { describe, it, expect } from "vitest";
import { childTraceScope } from "../../src/trace/traceScope";
import { buildTraceWalk, formatTraceWalk } from "../../src/trace/traceWalk";
import { toVisualizationSnapshots } from "../../src/adapters/fromRuntimeSnapshot";
import { resolveSubflowInvocation } from "../../src/components/ExplainableShell/_internal/subflowInvocation";

const step = { stage: "Compute", stageId: "compute", runtimeStageId: "child/compute#2", trace: [{path:"total"}] };
function selected(overwrite: Record<string, unknown>) {
  return childTraceScope({treeContext:{history:[{runtimeStageId:"child#1", overwrite},step],stageContexts:{runtimeStageId:step.runtimeStageId,stageReads:{missing:undefined,base:0}}}},["child#1"],true);
}
function story(overwrite: Record<string, unknown>) {
  const scope = selected(overwrite);
  return formatTraceWalk(buildTraceWalk(scope.commitLog,scope.executionTree,"total",{scope:{invocationPath:scope.invocationPath,startKeys:(scope as any).startKeys,readsAvailable:true}}),()=>null);
}
describe("fourth subflow review regressions",()=>{
  it("never upgrades an absent or undefined starting value to an input",()=>{
    const text=story({base:0,missing:undefined});
    expect(text).toContain("missing (no recorded write; value unknown)");
    expect(text).not.toContain("missing (present when");
    expect(text).toContain("base (recorded at invocation start; earlier origin unknown)");
  });
  it("does not invoke starting-value getters or retain their values",()=>{
    let calls=0;
    const data={base:0};
    Object.defineProperty(data,"missing",{enumerable:true,get(){calls++;return "secret";}});
    const text=story(data);
    expect(calls).toBe(0);
    expect(text).toContain("missing (no recorded write; value unknown)");
    expect(text).not.toContain("secret");
  });
  it("public root text recognises a child mount without UI-only scope",()=>{
    const text=formatTraceWalk(buildTraceWalk([{...step,runtimeStageId:"child#1"}],{runtimeStageId:"child#1",subflowId:"child",name:"Outer"},"total"),()=>1);
    expect(text).toContain("computed inside Outer");
    expect(text).not.toContain("reads nothing — origin");
  });
  it("a missing trace is unavailable evidence, never a crash or a claim of no writes",()=>{
    const walk=buildTraceWalk([{...step,trace:undefined}],{runtimeStageId:step.runtimeStageId},"total");
    expect(formatTraceWalk(walk,()=>null)).toContain("write evidence is unavailable");
  });
  it("does not turn refused root metadata into a false no-read origin",()=>{
    const tree:any={runtimeStageId:step.runtimeStageId,stageReads:{}};
    tree.next=tree;
    expect(formatTraceWalk(buildTraceWalk([step],tree,"total"),()=>1)).toContain("write evidence is unavailable");
  });
  it("never substitutes the sole remaining visit for a disappeared exact selection",()=>{
    expect(resolveSubflowInvocation([{stageName:"child",stageLabel:"child",runtimeStageId:"child#1",subflowId:"child",subflowResult:{},memory:{},narrative:"",startMs:0,durationMs:0}],"child",undefined,"child#9")).toEqual({kind:"missing"});
  });
  it("refuses a shared tree before it can expand exponentially",()=>{
    let tree: any={id:"leaf"};
    for(let i=0;i<12;i++) tree={id:`level${i}`,children:[tree,tree]};
    expect(()=>toVisualizationSnapshots({sharedState:{},commitLog:[],executionTree:tree} as any)).toThrow(/shared|cycle/);
  });
});
