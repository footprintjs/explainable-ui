/**
 * Small, single-purpose sample graphs — one per composition pattern.
 *
 * Each isolates ONE layout concern so a fix is visible at a glance (the big
 * 53-node agent chart is too dense to read): sequence → straight spine; fork →
 * centered parent + comb fan; decision → diamond + branches; loop → side-lane
 * back-edge; nested → composition. dagre lays them out (positions are 0,0 in).
 */
import type { Edge } from "@xyflow/react";
import type {
  TraceGraph,
  TraceNode,
  TraceNodeData,
  TraceEdgeData,
} from "../src/components/FlowchartView/traceStructureRecorder";

function n(id: string, label: string, extra: Partial<TraceNodeData> = {}): TraceNode {
  return {
    id,
    type: "stage",
    position: { x: 0, y: 0 },
    data: {
      label,
      isDecider: false,
      isFork: false,
      isStreaming: false,
      isSubflow: false,
      prevIds: [],
      nextIds: [],
      ...extra,
    } as TraceNodeData,
  } as TraceNode;
}
const e = (
  s: string,
  t: string,
  kind: TraceEdgeData["kind"] = "next",
): Edge<TraceEdgeData> => ({ id: `${s}->${t}:${kind}`, source: s, target: t, data: { kind } });

/** Pure linear chain — should render a perfectly straight, centered spine. */
export const SEQUENCE: TraceGraph = {
  nodes: [n("seed", "Seed"), n("validate", "Validate"), n("enrich", "Enrich"), n("done", "Done")],
  edges: [e("seed", "validate"), e("validate", "enrich"), e("enrich", "done")],
};

/** 1→N→1 fork-join — tests fork-centering (parent over span) + the comb fan. */
export const FORK: TraceGraph = {
  nodes: [
    n("start", "Compose", { isFork: true }),
    n("sys", "System prompt"),
    n("msg", "Messages"),
    n("tools", "Tools"),
    n("join", "Assemble"),
  ],
  edges: [
    e("start", "sys"),
    e("start", "msg"),
    e("start", "tools"),
    e("sys", "join"),
    e("msg", "join"),
    e("tools", "join"),
  ],
};

/** Decider → two labeled branches → merge. Tests the diamond + branch fan. */
export const DECISION: TraceGraph = {
  nodes: [
    n("intake", "Intake"),
    n("decide", "Adjudicate", { isDecider: true }),
    n("approve", "Approve"),
    n("reject", "Reject"),
    n("notify", "Notify"),
  ],
  edges: [
    e("intake", "decide"),
    e("decide", "approve", "decision-branch"),
    e("decide", "reject", "decision-branch"),
    e("approve", "notify"),
    e("reject", "notify"),
  ],
};

/** ReAct-style loop — the back-edge should route on the side lane, not tangle. */
export const LOOP: TraceGraph = {
  nodes: [
    n("start", "Start"),
    n("think", "Think"),
    n("act", "Act (tool)"),
    n("check", "Done?", { isDecider: true }),
    n("final", "Final answer"),
  ],
  edges: [
    e("start", "think"),
    e("think", "act"),
    e("act", "check"),
    e("check", "final", "decision-branch"),
    e("check", "think", "loop"),
  ],
};

/** Sequence ∘ fork ∘ merge ∘ sequence — composition of the above. */
export const NESTED: TraceGraph = {
  nodes: [
    n("intake", "Intake"),
    n("split", "Split", { isFork: true }),
    n("left", "Branch A"),
    n("right", "Branch B"),
    n("merge", "Merge"),
    n("finalize", "Finalize"),
  ],
  edges: [
    e("intake", "split"),
    e("split", "left"),
    e("split", "right"),
    e("left", "merge"),
    e("right", "merge"),
    e("merge", "finalize"),
  ],
};

export const GALLERY: { title: string; subtitle: string; graph: TraceGraph }[] = [
  { title: "Sequence", subtitle: "straight centered spine", graph: SEQUENCE },
  { title: "Fork / parallel", subtitle: "centered parent + comb fan", graph: FORK },
  { title: "Decision", subtitle: "diamond → labelled branches", graph: DECISION },
  { title: "Loop", subtitle: "back-edge on the side lane", graph: LOOP },
  { title: "Nested", subtitle: "sequence ∘ fork ∘ merge", graph: NESTED },
];
