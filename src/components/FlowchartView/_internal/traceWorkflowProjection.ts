import type { TraceWorkflowOverlay, TraceWorkflowStage } from "../../../trace/traceWorkflowOverlay";
import type { Rect } from "@xyflow/react";
import type { ChartFitNode } from "./chartFitGeometry";
import { positiveFinite } from "./chartFitGeometry";

/** The caption is paint, not layout: reserve its bounded extent only for automatic fits. */
export function traceWorkflowPaintBounds(
  nodes: ReadonlyMap<string, ChartFitNode>,
  stageIds: Iterable<string>,
): Rect | undefined {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const id of stageIds) {
    const node = nodes.get(id);
    if (!node || node.hidden) continue;
    const { x, y } = node.internals.positionAbsolute;
    const width = node.measured?.width, height = node.measured?.height;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !positiveFinite(width) || !positiveFinite(height)) return undefined;
    const captionHalfWidth = Math.max(width / 2 + 8, 110);
    left = Math.min(left, x + width / 2 - captionHalfWidth);
    right = Math.max(right, x + width / 2 + captionHalfWidth);
    top = Math.min(top, y - 8);
    bottom = Math.max(bottom, y + height + 26); // 7px gap + 18px caption + rounding room.
  }
  if (![left, top, right, bottom].every(Number.isFinite)) return undefined;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export interface VisibleWorkflowRead {
  readonly key: string;
  readonly source: string;
  readonly target: string;
  readonly sourceRuntimeStageId: string;
  readonly targetRuntimeStageId: string;
  readonly color: string;
}

/** A static chart can show one selected visit of a repeated stage, never a blend of visits. */
export function projectTraceWorkflow(
  overlay: TraceWorkflowOverlay | null | undefined,
  visible: readonly { id: string; hidden?: boolean }[],
): { stages: ReadonlyMap<string, TraceWorkflowStage>; reads: readonly VisibleWorkflowRead[] } {
  const stages = new Map<string, TraceWorkflowStage>();
  const reads: VisibleWorkflowRead[] = [];
  if (!overlay) return { stages, reads };
  const visibleCounts = new Map<string, number>();
  for (const node of visible) {
    if (!node.hidden) visibleCounts.set(node.id, (visibleCounts.get(node.id) ?? 0) + 1);
  }
  const candidates = new Map<string, TraceWorkflowStage[]>();
  const runtimeCounts = new Map<string, number>();
  for (const stage of overlay.stages) {
    runtimeCounts.set(stage.runtimeStageId, (runtimeCounts.get(stage.runtimeStageId) ?? 0) + 1);
    // The projected stage ID must carry the runtime stamp's complete scope. A leaf/suffix is no join.
    const stamp = stage.runtimeStageId.lastIndexOf("#");
    if (stamp <= 0 || !/^(0|[1-9]\d*)$/.test(stage.runtimeStageId.slice(stamp + 1)) ||
      stage.runtimeStageId.slice(0, stamp) !== stage.stageId || visibleCounts.get(stage.stageId) !== 1) continue;
    const group = candidates.get(stage.stageId) ?? [];
    group.push(stage);
    candidates.set(stage.stageId, group);
  }
  const nodeByRuntime = new Map<string, string>();
  for (const [id, group] of candidates) {
    const selected = group.length === 1 ? group[0]
      : group.find(stage => stage.runtimeStageId === overlay.focusRuntimeStageId);
    if (!selected || runtimeCounts.get(selected.runtimeStageId) !== 1) continue;
    stages.set(id, selected);
    nodeByRuntime.set(selected.runtimeStageId, id);
  }
  const seen = new Set<string>();
  for (const read of overlay.reads) {
    const source = nodeByRuntime.get(read.sourceRuntimeStageId);
    const target = nodeByRuntime.get(read.targetRuntimeStageId);
    if (!source || !target) continue;
    const id = JSON.stringify([read.key, read.sourceRuntimeStageId, read.targetRuntimeStageId]);
    if (seen.has(id)) continue;
    seen.add(id);
    reads.push({ ...read, source, target });
  }
  return { stages, reads };
}
