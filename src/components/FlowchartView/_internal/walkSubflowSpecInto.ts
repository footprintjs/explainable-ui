/**
 * walkSubflowSpecInto — walks a footprintjs v6.0+ `subflowSpec` payload
 * from `StructureSubflowMountedEvent` and emits nodes + edges into the
 * trace recorder's existing upsert helpers.
 *
 * This is the local mirror of `walkSubflowSpec` from `footprintjs/trace`
 * — kept local to preserve explainable-ui's zero-`footprintjs`-dep
 * boundary (see traceStructureRecorder.ts top-of-file rationale).
 *
 * Stage IDs come pre-prefixed from footprintjs's `_prefixNodeTree`
 * (e.g. `'sf-tools/execute-tool-calls'`), so we use them as-is for
 * node ids. The `subflowPath` is set on `data.subflowOf` to mark which
 * subflow each inner stage belongs to.
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

function walkNode(
  node: SpecNode,
  subflowPath: string,
  sink: WalkSink,
  visited: Set<string>,
): void {
  if (visited.has(node.id)) return;
  visited.add(node.id);
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
  const isDecider = type === "decider" || type === "selector";
  const isFork = type === "fork";
  const isStreaming = type === "streaming";
  const isSubflow = !!node.isSubflowRoot;

  const stageId = asStageId(node.id);
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
  if (node.subflowId !== undefined) data.subflowId = node.subflowId;
  if (node.isLazy === true) data.isLazy = true;
  if (node.isPausable === true) data.isPausable = true;

  sink.upsertNode({
    id: node.id,
    type: "stage",
    position: { x: 0, y: 0 },
    data,
  });

  // Children (decider/selector/fork branches).
  if (node.children && node.children.length > 0) {
    const edgeKind: "fork-branch" | "decision-branch" = type === "fork" ? "fork-branch" : "decision-branch";
    for (const child of node.children) {
      const edgeId = `${node.id}->${child.id}:${edgeKind}${edgeKind === "decision-branch" ? `:${child.id}` : ""}`;
      const edgeData: TraceEdgeData = { kind: edgeKind };
      if (edgeKind === "decision-branch") edgeData.label = child.id;
      const edge: Edge<TraceEdgeData> = {
        id: edgeId,
        source: node.id,
        target: child.id,
        data: edgeData,
      };
      if (edgeKind === "decision-branch") edge.label = child.id;
      sink.pushEdge(edge);
      walkNode(child, subflowPath, sink, visited);
    }
  }

  // Linear next or loop back-edge.
  if (node.next) {
    if (node.next.isLoopReference && node.loopTarget) {
      sink.pushEdge({
        id: `${node.id}->${node.loopTarget}:loop`,
        source: node.id,
        target: node.loopTarget,
        data: { kind: "loop" },
      });
    } else {
      const edgeId = `${node.id}->${node.next.id}:next`;
      sink.pushEdge({
        id: edgeId,
        source: node.id,
        target: node.next.id,
        data: { kind: "next" },
      });
      walkNode(node.next, subflowPath, sink, visited);
    }
  }
  // Suppress unused-binding warning for stageId (kept for parity with
  // recorder upsertNode signature; xyflow node `id` is the string form).
  void stageId;
}
