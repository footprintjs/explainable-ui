/** Presentation of recorded stage reads; never expression-level output derivation. */
import type { StageSnapshot } from "../types";
import { theme, v } from "../theme";
import { buildTraceDependencyGraph, type TraceDependencyGraph } from "./traceDependencyGraph";
import type { TraceIngredient, TraceWalk } from "./traceWalk";
import { recordedValueAtPath, recordedValuePreview } from "./recordedValuePreview";
import { ownDataField, TRACE_WORK_LIMIT } from "./safeRecordRead";

export interface TraceWorkflowStage {
  runtimeStageId: string;
  stageId: string;
  color: string;
  role: "question" | "input" | "upstream";
  values: readonly { key: string; preview: string | null; color: string }[];
}

export interface TraceWorkflowRead {
  key: string;
  sourceRuntimeStageId: string;
  targetRuntimeStageId: string;
  color: string;
}

export interface TraceWorkflowOverlay {
  questionKey: string;
  scopeKey: string;
  focusRuntimeStageId: string | null;
  stages: readonly TraceWorkflowStage[];
  reads: readonly TraceWorkflowRead[];
}

const QUESTION_COLOR = "var(--fp-accent, #6366f1)";
const SOURCE_COLORS = [
  v("--fp-chip-1", "#0d9488"),
  v("--fp-chip-2", "#d97706"),
  v("--fp-chip-3", "#7c3aed"),
  v("--fp-chip-4", "#e11d48"),
];

/** One question-local palette, keyed by exact written-key/writer-commit identity. */
export function traceNodeColors(graph: TraceDependencyGraph): ReadonlyMap<string, string> {
  const colors = new Map<string, string>();
  let source = 0;
  for (const node of graph.nodes) {
    colors.set(node.id, node.kind === "unresolved" ? theme.textMuted
      : node.isAnchor ? QUESTION_COLOR : SOURCE_COLORS[source++] ?? theme.textMuted);
  }
  return colors;
}

/** Repeated names and loop visits never borrow another writer's color. */
export function traceIngredientColor(
  graph: TraceDependencyGraph,
  colors: ReadonlyMap<string, string>,
  ingredient: TraceIngredient,
): string {
  if (ingredient.writerRuntimeStageId === null || ingredient.writerCommitIdx === null) return theme.textMuted;
  const node = graph.nodes.find(candidate => candidate.key === ingredient.key &&
    candidate.runtimeStageId === ingredient.writerRuntimeStageId && candidate.commitIdx === ingredient.writerCommitIdx);
  return node ? colors.get(node.id) ?? theme.textMuted : theme.textMuted;
}

/** Overlay the bounded variable graph on workflow writers without adding workflow edges. */
export function buildTraceWorkflowOverlay(
  walk: TraceWalk | null,
  snapshots: StageSnapshot[],
  cursorRuntimeStageId: string | null,
): TraceWorkflowOverlay | null {
  if (!walk || walk.missing) return null;
  const graph = buildTraceDependencyGraph(walk);
  const anchor = graph.nodes.find(node => node.isAnchor && node.runtimeStageId !== null);
  if (!anchor?.runtimeStageId) return null;
  const colors = traceNodeColors(graph);
  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const immediate = new Set(graph.edges.filter(edge => edge.target === anchor.id).map(edge => edge.source));
  // The overlay address is a runtime visit. It cannot safely collapse a
  // hand-built walk that assigns different writer commits the same visit ID.
  const commits = new Map<string, number>();
  const ambiguous = new Set<string>();
  for (const node of graph.nodes) {
    if (node.runtimeStageId === null || node.commitIdx === null) continue;
    const previous = commits.get(node.runtimeStageId);
    if (previous !== undefined && previous !== node.commitIdx) ambiguous.add(node.runtimeStageId);
    commits.set(node.runtimeStageId, node.commitIdx);
  }
  if (ambiguous.has(anchor.runtimeStageId)) return null;
  const memories = new Map<string, unknown>();
  const duplicateSnapshots = new Set<string>();
  // Oversized snapshot rails still get the bounded names-only overlay. Partial
  // scanning could falsely choose one of two matching visits, so omit values.
  if (snapshots.length <= TRACE_WORK_LIMIT) for (const snapshot of snapshots) {
    try {
      const runtimeStageId = ownDataField(snapshot, "runtimeStageId");
      if (typeof runtimeStageId !== "string" || !commits.has(runtimeStageId)) continue;
      if (memories.has(runtimeStageId)) duplicateSnapshots.add(runtimeStageId);
      memories.set(runtimeStageId, ownDataField(snapshot, "memory"));
    } catch { /* Unreadable snapshot metadata cannot attest a writer value. */ }
  }
  const stages = new Map<string, TraceWorkflowStage>();
  for (const node of graph.nodes) {
    if (node.runtimeStageId === null || ambiguous.has(node.runtimeStageId)) continue;
    const color = colors.get(node.id) ?? theme.textMuted;
    const role = node.isAnchor ? "question" : immediate.has(node.id) ? "input" : "upstream";
    let stage = stages.get(node.runtimeStageId);
    if (!stage) {
      const stamp = node.runtimeStageId.lastIndexOf("#");
      const stageId = stamp < 0 ? node.runtimeStageId : node.runtimeStageId.slice(0, stamp);
      stage = { runtimeStageId: node.runtimeStageId, stageId, color, role, values: [] };
      stages.set(node.runtimeStageId, stage);
    }
    if (role === "question" || (role === "input" && stage.role === "upstream")) {
      stage.role = role; stage.color = color;
    }
    stage.values = [...stage.values, {
      key: node.key,
      preview: duplicateSnapshots.has(node.runtimeStageId) ? null
        : recordedValuePreview(recordedValueAtPath(memories.get(node.runtimeStageId), node.key)),
      color,
    }];
  }
  const reads: TraceWorkflowRead[] = [];
  const seenReads = new Set<string>();
  for (const edge of graph.edges) {
    const source = nodeById.get(edge.source), target = nodeById.get(edge.target);
    if (!source?.runtimeStageId || !target?.runtimeStageId ||
      !stages.has(source.runtimeStageId) || !stages.has(target.runtimeStageId)) continue;
    const id = JSON.stringify([edge.readKey, source.runtimeStageId, target.runtimeStageId]);
    if (seenReads.has(id)) continue;
    seenReads.add(id);
    reads.push({ key: edge.readKey, sourceRuntimeStageId: source.runtimeStageId,
      targetRuntimeStageId: target.runtimeStageId, color: colors.get(source.id) ?? theme.textMuted });
  }
  return { questionKey: walk.key, scopeKey: JSON.stringify(walk.scope?.invocationPath ?? []),
    focusRuntimeStageId: cursorRuntimeStageId && stages.has(cursorRuntimeStageId) ? cursorRuntimeStageId : anchor.runtimeStageId,
    stages: [...stages.values()], reads };
}
