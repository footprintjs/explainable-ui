/** Data Trace projects Foottrace's stage-level query; it owns no causal algorithm. */
import { causalChain, flattenCausalDAG } from "foottrace";
import type { CausalNode, ReadsCoverage } from "foottrace";
import { prepareTraceSource } from "../../../adapters/recordInput/traceSource";
import type { FlowRecordSelection } from "../../../adapters/recordInput";

/** The established panel/callback shape, unchanged. */
export interface DataTraceFrame {
  runtimeStageId: string;
  stageId: string;
  stageName: string;
  keysWritten: string[];
  linkedBy: string;
  depth: number;
}
export interface DataTraceResult {
  frames: DataTraceFrame[];
  /** Some read keys were observed; NEVER a guarantee of complete capture. */
  readsAvailable: boolean;
  status: "available" | "unavailable" | "not-recorded";
  note: string;
  evidence?: {
    sourceId: string;
    beforeCommitIdx: number;
    readsKind: string;
    readsCoverage?: ReadsCoverage;
    /** Original canonical DAG, including every edge qualifier; not JSON-safe. */
    root?: CausalNode;
    truncated?: CausalNode["truncated"];
    nodes: Pick<CausalNode, "runtimeStageId" | "incompleteSources" | "preRunReads">[];
    nestedEdges: { from: string; to: string; key?: string }[];
    redactedPaths: readonly string[];
  };
}
export function unavailableDataTrace(note: string): DataTraceResult {
  return { status: "unavailable", frames: [], readsAvailable: false, note };
}

/** The host selects one source and one canonical, exclusive boundary. */
export function buildSelectedDataTrace(
  selection: FlowRecordSelection,
  targetRuntimeStageId: string,
  options: { beforeCommitIdx?: number; maxDepth?: number; maxFrames?: number } = {},
): DataTraceResult {
  const maxDepth = options.maxDepth ?? 10;
  const maxFrames = options.maxFrames ?? 50;
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 0 || !Number.isSafeInteger(maxFrames) || maxFrames < 1) {
    return unavailableDataTrace("Causal tracing needs a nonnegative depth and a positive frame limit.");
  }
  const source = prepareTraceSource(selection, targetRuntimeStageId, options.beforeCommitIdx);
  if (source.status === "unavailable") return unavailableDataTrace(source.message);
  try {
    let observedReads = false;
    const root = causalChain(source.log, targetRuntimeStageId, id => {
      const keys = source.reads.lookup(id);
      observedReads ||= keys.length > 0;
      return keys;
    }, { maxDepth, maxNodes: maxFrames, edgeAttribution: "stage" });
    const nodes = root ? flattenCausalDAG(root) : [];
    const readsAvailable = observedReads || (source.reads.coverage?.stepsWithReads ?? 0) > 0 ||
      nodes.some(node => node.parentEdges.some(edge => edge.kind === "data") || (node.preRunReads?.keys.length ?? 0) > 0);
    const notes = ["Recorded stage-level dependencies; read capture may be incomplete."];
    if (!source.reads.coverage) notes.push("Read coverage is unknown; the supplied lookup does not establish complete capture.");
    if (!readsAvailable) notes.push("Read coverage is unknown or no read keys were recorded; missing edges do not prove independence.");
    if (!root) notes.push("The selected stage is not present in this source prefix.");
    if (root?.truncated?.byDepth) notes.push("The depth limit cut the explanation short.");
    if (root?.truncated?.byNodes) notes.push("The frame limit cut the explanation short.");
    if (nodes.some(node => node.incompleteSources?.length)) notes.push("Some consumed sources were not tracked.");
    if (nodes.some(node => node.preRunReads?.keys.length)) notes.push("Some reads have no earlier recorded writer; their origin is not proven by this log.");
    const nestedEdges = nodes.flatMap(node => node.parentEdges.filter(edge => edge.basis === "nested-rows").map(edge => ({ from: node.runtimeStageId, to: edge.parent.runtimeStageId, ...(edge.key !== undefined && { key: edge.key }) })));
    if (nestedEdges.length) notes.push("Some writers changed only nested parts of a value.");
    if (source.fold.redacted) notes.push("Recorded values were redacted; the explanation may omit hidden evidence.");
    return {
      status: root ? "available" : "not-recorded",
      frames: nodes.map(({ runtimeStageId, stageId, stageName, keysWritten, linkedBy, depth }) => ({
        runtimeStageId,
        stageId: typeof stageId === "string" ? stageId : runtimeStageId,
        stageName: typeof stageName === "string" ? stageName : runtimeStageId,
        keysWritten, linkedBy, depth,
      })),
      readsAvailable, note: notes.join(" "),
      evidence: {
        sourceId: source.sourceId, beforeCommitIdx: source.beforeCommitIdx, readsKind: source.reads.kind,
        ...(root && { root }),
        ...(source.reads.coverage !== undefined && { readsCoverage: source.reads.coverage }),
        ...(root?.truncated !== undefined && { truncated: root.truncated }),
        nodes: nodes.map(({ runtimeStageId, incompleteSources, preRunReads }) => ({ runtimeStageId, ...(incompleteSources && { incompleteSources }), ...(preRunReads && { preRunReads }) })),
        nestedEdges, redactedPaths: source.fold.redactedPaths,
      },
    };
  } catch {
    return unavailableDataTrace("Foottrace could not explain the selected source prefix.");
  }
}

/** Retained positional seam for existing internal callers, including traceWalk. */
export function buildDataTrace(commitLog: unknown[], executionTree: unknown, targetRuntimeStageId: string, maxDepth = 10, maxFrames = 50): DataTraceResult {
  return buildSelectedDataTrace({ sourceId: "flow:record", format: "snapshot", record: { commitLog, executionTree }, reads: { status: "unknown" } }, targetRuntimeStageId,
    { beforeCommitIdx: commitLog.length, maxDepth, maxFrames });
}
