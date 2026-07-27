/**
 * graphFromStructure — the chart, rebuilt from a SAVED structure.
 *
 * `createTraceStructureRecorder` collects the chart while footprintjs
 * BUILDS it. This is its post-hoc twin: hand it the `buildTimeStructure`
 * a chart carries (`chart.buildTimeStructure`, plain JSON) and it produces
 * the same `TraceGraph` — no builder, no live process, no agent framework.
 *
 * Why it exists
 * ─────────────
 * A recording is three things: `events`, `snapshot`, and `structure`.
 * The snapshot draws the memory panel, the story and the rail; only the
 * structure can draw the CHART. Until now the one spec→graph adapter in
 * the ecosystem was `structureGraphFromSpec` in `agentfootprint-lens`,
 * which reaches into `agentfootprint` for agent vocabulary — so a plain
 * footprintjs consumer had to install an agent framework to draw a saved
 * pipeline run. This is that adapter, with no agent semantics.
 *
 * ```ts
 * // Recording side (in the app that ran the pipeline):
 * const recording = {
 *   snapshot:  executor.getSnapshot(),
 *   structure: chart.buildTimeStructure,   // ← the chart. Nothing else can draw it.
 * };
 *
 * // Rendering side, anywhere later:
 * <ExplainableShell
 *   runtimeSnapshot={recording.snapshot}
 *   traceGraph={graphFromStructure(recording.structure)}
 * />
 * ```
 *
 * Same graph, same ids
 * ────────────────────
 * Node ids are the chart's own stage ids at the top level and
 * `subflowPath/stageId` inside a subflow — byte-identical to the live
 * recorder, which is what lets the runtime overlay (live OR
 * `overlayFromSnapshot`) light the right boxes. The events are replayed
 * into `createTraceStructureRecorder` itself rather than re-implemented,
 * so the two paths cannot drift: one graph builder, two front doors.
 *
 * What a saved structure cannot carry (honest absence — never invented)
 * ────────────────────────────────────────────────────────────────────
 *   - **A decider's `defaultBranch`.** footprintjs's live
 *     `onDeciderComplete` event names the fallback branch, but
 *     `SerializedPipelineStructure` has no field for it, so a rebuilt
 *     decider node carries `branchIds` without `defaultBranch`. Renderers
 *     that badge the default simply don't badge it.
 *   - **A lazy subflow's internals.** `isLazy` mounts resolve at run time;
 *     the saved structure holds the mount node alone, exactly as the live
 *     recorder saw it at build time.
 */

import { createTraceStructureRecorder } from "../components/FlowchartView/traceStructureRecorder";
import type { TraceGraph } from "../components/FlowchartView/traceStructureRecorder";

/**
 * The slice of footprintjs's `SerializedPipelineStructure` this walker
 * reads. Duck-typed on purpose — explainable-ui declares no `footprintjs`
 * dependency (see traceStructureRecorder.ts for the boundary rationale).
 */
export interface SerializedStructureNode {
  readonly id: string;
  readonly name: string;
  readonly type?: "stage" | "decider" | "selector" | "fork" | "streaming" | "subflow" | "loop";
  readonly description?: string;
  readonly icon?: string;
  readonly hasDecider?: boolean;
  readonly hasSelector?: boolean;
  readonly branchIds?: readonly string[];
  readonly children?: readonly SerializedStructureNode[];
  readonly next?: SerializedStructureNode;
  readonly loopTarget?: string;
  readonly isLoopReference?: boolean;
  readonly isSubflowRoot?: boolean;
  readonly subflowId?: string;
  readonly subflowName?: string;
  readonly subflowStructure?: SerializedStructureNode;
  readonly isLazy?: boolean;
  readonly isPausable?: boolean;
  /** Structure-only: this branch rejoins at its OWN named stage instead of
   *  the shared convergence stage (an unequal-depth merge). */
  readonly convergeAt?: string;
  readonly [key: string]: unknown;
}

/** A structure-shaped object is one with an id and a name to draw. */
function looksLikeStructure(value: unknown): value is SerializedStructureNode {
  if (value === null || typeof value !== "object") return false;
  const n = value as Record<string, unknown>;
  return typeof n.id === "string" && typeof n.name === "string";
}

/**
 * Where a node's `next` edge actually starts.
 *
 * A branching node (fork / decider / selector) stores its downstream stage
 * ONCE, on itself — but the chart has to show each branch rejoining, so one
 * serialized `next` becomes N edges, one per branch. This mirrors
 * footprintjs's own `_fireNextEdgeFromParent`; get it wrong and a fork
 * renders as a single line out of the decision box with the branches
 * dangling.
 *
 * Two branches opt out: one that loops back instead of rejoining, and one
 * with `convergeAt` (a declared unequal-depth merge — it rejoins at its own
 * named target rather than the shared one).
 */
function convergenceEdges(
  node: SerializedStructureNode,
  targetId: string,
): Array<{ from: string; to: string }> {
  const children = node.children;
  const isBranching =
    (node.type === "fork" || node.type === "decider" || node.type === "selector") &&
    Array.isArray(children) &&
    children.length > 0;
  if (!isBranching) return [{ from: node.id, to: targetId }];

  const edges: Array<{ from: string; to: string }> = [];
  for (const child of children!) {
    if (child.isLoopReference) continue;
    if (child.next?.isLoopReference) continue;
    edges.push({ from: child.id, to: child.convergeAt ?? targetId });
  }
  return edges;
}

/**
 * Builds the chart's `TraceGraph` from a serialized `buildTimeStructure`.
 *
 * Pass the result to `<ExplainableShell traceGraph={...}>` or
 * `<TracedFlow graph={...}>`. Returns an EMPTY graph (`{nodes: [], edges: []}`)
 * when the input isn't a structure — a recording saved without its
 * structure draws no chart, which is the truthful rendering. Check
 * `graph.nodes.length` if you want to branch on that.
 */
export function graphFromStructure(structure: unknown): TraceGraph {
  const trace = createTraceStructureRecorder({ id: "graph-from-structure" });
  if (!looksLikeStructure(structure)) return trace.getGraph();

  const rec = trace.recorder;
  // One node is announced once, even when several branches converge on it
  // (a fork's children all point `next` at the same join stage).
  const announced = new Set<string>();
  const walked = new Set<string>();

  const announce = (node: SerializedStructureNode): void => {
    if (announced.has(node.id)) return;
    announced.add(node.id);
    rec.onStageAdded?.({
      stageId: node.id,
      name: node.name,
      // The serialized spelling of a decision stage is `type: 'decider'`;
      // the live builder's is `type: 'stage'` + `spec.hasDecider`. The
      // recorder reads BOTH, so either front door yields the same node.
      type: node.type ?? "stage",
      ...(node.isPausable === true ? { isPausable: true } : {}),
      spec: node,
    });
  };

  // A mount node is a stage in ITS chart plus a doorway into another one.
  // The recorder materialises the child chart's nodes from `subflowSpec` with
  // path-qualified ids — the same walk the live mount event triggers. Fired
  // right after the node's incoming edge, which is where the builder fires it.
  const mounted = new Set<string>();
  const mount = (node: SerializedStructureNode): void => {
    if (!node.isSubflowRoot || node.subflowId === undefined || mounted.has(node.id)) return;
    mounted.add(node.id);
    rec.onSubflowMounted?.({
      subflowId: node.subflowId,
      subflowName: node.subflowName ?? node.name,
      rootStageId: node.id,
      ...(node.isLazy === true ? { isLazy: true } : {}),
      ...(node.subflowStructure ? { subflowSpec: node.subflowStructure } : {}),
      subflowPath: node.subflowId,
    });
  };

  const walk = (node: SerializedStructureNode): void => {
    // Loop-ref stubs are back-EDGES, never stages (footprintjs plants them
    // with a duplicate id — walking one would announce a phantom node).
    if (node.isLoopReference || walked.has(node.id)) return;
    walked.add(node.id);
    announce(node);
    mount(node);

    const children = node.children ?? [];
    if (children.length > 0) {
      // Branch edges first for ALL children, THEN the sealed branch list,
      // THEN the recursion — the order footprintjs's builder fires them in,
      // so the node/edge arrays come out in the same order as a live build.
      const kind = node.type === "fork" ? "fork-branch" : "decision-branch";
      for (const child of children) {
        announce(child);
        rec.onEdgeAdded?.({
          from: node.id,
          to: child.id,
          kind,
          ...(kind === "decision-branch" ? { label: child.id } : {}),
        });
        // A subflow mounted AS a branch: stage, branch edge, mount — the
        // builder's order (addSubFlowChartBranch), so the inner nodes land
        // in the same place they would in a live build.
        mount(child);
      }
      const isDecision =
        node.type === "decider" ||
        node.type === "selector" ||
        node.hasDecider === true ||
        node.hasSelector === true;
      if (isDecision) {
        rec.onDeciderComplete?.({
          decider: node.id,
          type: node.hasSelector === true || node.type === "selector" ? "selector" : "decider",
          branchIds: node.branchIds ?? children.map((c) => c.id),
          // `defaultBranch` is deliberately absent — see the module JSDoc.
        });
      }
      for (const child of children) walk(child);
    }

    const next = node.next;
    if (!next) return;
    if (next.isLoopReference) {
      // `loopTo()` plants a stub whose id IS the loop target; prefer the
      // explicit `loopTarget` and fall back to the stub's own id.
      rec.onLoopEdgeAdded?.({ from: node.id, to: node.loopTarget ?? next.id });
      return;
    }
    announce(next);
    for (const edge of convergenceEdges(node, next.id)) {
      rec.onEdgeAdded?.({ from: edge.from, to: edge.to, kind: "next" });
    }
    mount(next);
    walk(next);
  };

  walk(structure);
  return trace.getGraph();
}
