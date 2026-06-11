/**
 * walkSubflowSpecInto — walks a footprintjs v6.0+ `subflowSpec` payload
 * from `StructureSubflowMountedEvent` and emits nodes + edges into the
 * trace recorder's existing upsert helpers.
 *
 * This is the local mirror of `walkSubflowSpec` from `footprintjs/trace`
 * — kept local to preserve explainable-ui's zero-`footprintjs`-dep
 * boundary (see traceStructureRecorder.ts top-of-file rationale).
 *
 * Node-id qualification (why inner ids get the subflow-path prefix)
 * ────────────────────────────────────────────────────────────────
 * The `subflowStructure` payload on a mount event carries the child
 * chart's OWN build-time ids, which are LOCAL and unprefixed (e.g. two
 * sibling slot subflows can each contain a stage literally named
 * `compose`). xyflow requires globally-unique node ids, and the
 * recorder dedupes by id — so two siblings sharing `compose` would
 * collapse into one node (last-write-wins), orphaning the other.
 *
 * To prevent that we qualify every emitted node id with the composed
 * `subflowPath`: `compose` under `sf-system-prompt` becomes
 * `sf-system-prompt/compose`. This MIRRORS footprintjs's runtime
 * `runtimeStageId` format (`subflowPath/stageId#index`) exactly, so the
 * runtime overlay matches a node by comparing its id against the
 * runtimeStageId minus the `#index` suffix (see overlayProjection.ts).
 * `data.subflowOf` still carries the path alone; `data.subflowId` still
 * carries the LOCAL id for mount nodes — only the xyflow node `id` and
 * edge endpoints are path-qualified.
 */

import type { Node, Edge } from "@xyflow/react";
import { asStageId } from "./keys";
import type { TraceEdgeData, TraceNodeData } from "../traceStructureRecorder";

/** Minimal duck-typed spec shape — mirrors the slice of
 *  `SerializedPipelineStructure` we need. */
interface SpecNode {
  readonly id: string;
  readonly name: string;
  readonly type?: "stage" | "decider" | "selector" | "fork" | "streaming" | "subflow" | "loop";
  /** Real-engine decider/selector flags — footprintjs serializes these
   *  stages as `type: 'stage'` with `hasDecider`/`hasSelector` stamped on
   *  the spec node (same contract as the top-level `onStageAdded` spec;
   *  see StructureSpecRef in traceStructureRecorder.ts). */
  readonly hasDecider?: boolean;
  readonly hasSelector?: boolean;
  readonly icon?: string;
  readonly description?: string;
  readonly children?: readonly SpecNode[];
  readonly next?: SpecNode;
  readonly loopTarget?: string;
  readonly isLoopReference?: boolean;
  readonly isSubflowRoot?: boolean;
  readonly subflowId?: string;
  readonly subflowName?: string;
  readonly subflowStructure?: SpecNode;
  readonly isPausable?: boolean;
  readonly isLazy?: boolean;
}

interface WalkSink {
  upsertNode(node: Node<TraceNodeData>): void;
  pushEdge(edge: Edge<TraceEdgeData>): void;
}

export function walkSubflowSpecInto(
  spec: SpecNode,
  subflowPath: string,
  sink: WalkSink,
): void {
  walkNode(spec, subflowPath, sink, new Set<string>());
}

/**
 * Qualify a LOCAL node id with its subflow path, mirroring footprintjs's
 * runtimeStageId format (`subflowPath/stageId`). All ids that share a
 * `subflowPath` are siblings, so edge endpoints inside one walkNode call
 * use the same path. `loopTarget` is a local id in the same subflow.
 */
function qid(subflowPath: string, localId: string): string {
  return `${subflowPath}/${localId}`;
}

function walkNode(
  node: SpecNode,
  subflowPath: string,
  sink: WalkSink,
  visited: Set<string>,
): void {
  // Cycle guard keyed on the QUALIFIED id — two different subflows can
  // share a local id (e.g. both have `compose`); keying on the bare id
  // would wrongly skip the second.
  const fullId = qid(subflowPath, node.id);
  if (visited.has(fullId)) return;
  visited.add(fullId);
  if (node.isLoopReference) return;

  // Nested subflow mount — recurse into its structure with composed path.
  if (node.isSubflowRoot && node.subflowId !== undefined && node.subflowStructure) {
    const nestedPath = `${subflowPath}/${node.subflowId}`;
    walkNode(node.subflowStructure, nestedPath, sink, visited);
    // Fall through so the mount node itself is emitted in the parent
    // subflow's scope below.
  }

  // Emit the stage node, tagged with subflowOf.
  const type = node.type ?? "stage";
  const isDecider =
    type === "decider" ||
    type === "selector" ||
    node.hasDecider === true ||
    node.hasSelector === true;
  const isFork = type === "fork";
  const isStreaming = type === "streaming";
  const isSubflow = !!node.isSubflowRoot;

  const data: TraceNodeData = {
    label: node.name,
    isDecider,
    isFork,
    isStreaming,
    isSubflow,
    subflowOf: subflowPath,
    prevIds: [],
    nextIds: [],
  };
  if (node.description !== undefined) data.description = node.description;
  if (node.icon !== undefined) data.icon = node.icon;
  // `subflowId` stays the LOCAL id (mount nodes use it to match runtime
  // events + drill scope); only the xyflow node `id` is path-qualified.
  if (node.subflowId !== undefined) data.subflowId = node.subflowId;
  if (node.isLazy === true) data.isLazy = true;
  if (node.isPausable === true) data.isPausable = true;

  sink.upsertNode({
    id: asStageId(fullId),
    type: "stage",
    position: { x: 0, y: 0 },
    data,
  });

  // Children (decider/selector/fork branches) — siblings at the same path.
  if (node.children && node.children.length > 0) {
    const edgeKind: "fork-branch" | "decision-branch" = type === "fork" ? "fork-branch" : "decision-branch";
    for (const child of node.children) {
      const childFullId = qid(subflowPath, child.id);
      const edgeId = `${fullId}->${childFullId}:${edgeKind}${edgeKind === "decision-branch" ? `:${child.id}` : ""}`;
      const edgeData: TraceEdgeData = { kind: edgeKind };
      if (edgeKind === "decision-branch") edgeData.label = child.id;
      const edge: Edge<TraceEdgeData> = {
        id: edgeId,
        source: fullId,
        target: childFullId,
        data: edgeData,
      };
      if (edgeKind === "decision-branch") edge.label = child.id;
      sink.pushEdge(edge);
      walkNode(child, subflowPath, sink, visited);
    }
  }

  // Linear next or loop back-edge — also same-path siblings.
  if (node.next) {
    if (node.next.isLoopReference && node.loopTarget) {
      const loopFullId = qid(subflowPath, node.loopTarget);
      sink.pushEdge({
        id: `${fullId}->${loopFullId}:loop`,
        source: fullId,
        target: loopFullId,
        data: { kind: "loop" },
      });
    } else {
      const nextFullId = qid(subflowPath, node.next.id);
      const edgeId = `${fullId}->${nextFullId}:next`;
      sink.pushEdge({
        id: edgeId,
        source: fullId,
        target: nextFullId,
        data: { kind: "next" },
      });
      walkNode(node.next, subflowPath, sink, visited);
    }
  }
}
