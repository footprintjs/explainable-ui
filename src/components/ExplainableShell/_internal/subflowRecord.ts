import type { StageSnapshot, NarrativeEntry } from "../../../types";
import { subflowResultToSnapshots } from "../../../adapters/fromRuntimeSnapshot";
import { childTraceScope, type TraceScope } from "./traceScope";
import { ownDataField, isPlainRecord } from "./safeRecordRead";
import {
  resolveSubflowInvocation,
  type InvocationResolution,
} from "./subflowInvocation";
export interface DrillDownEntry {
  subflowId: string;
  label: string;
  spec: null;
  snapshots: StageSnapshot[];
  narrative?: NarrativeEntry[];
  traceScope: TraceScope;
  sourceRunId: unknown;
  parentSnapshotIdx: number;
  mountRuntimeStageId: string;
}
export type DrillResolution =
  | { kind: "found"; entry: DrillDownEntry }
  | Exclude<InvocationResolution, { kind: "found" }>;
/** Never let the adapter's legacy path alias pick the last repeated visit. */
export function exactSubflowResults(
  results: unknown,
): Record<string, unknown> | undefined {
  if (!isPlainRecord(results)) return undefined;
  return Object.fromEntries(
    Object.keys(results)
      .filter((key) => key.includes("#"))
      .map((key) => [key, ownDataField(results, key)]),
  );
}
const cache = new WeakMap<
  object,
  Map<string, { scope: TraceScope; snapshots: StageSnapshot[] }>
>();
export function resolveSubflowLevel(
  parent: StageSnapshot[],
  key: string,
  cursorId: string | undefined,
  parentPath: readonly string[],
  sourceRunId: unknown,
  readsAvailable: boolean,
  results: Record<string, unknown> | undefined,
  narrative: NarrativeEntry[] | undefined,
  requestedId?: string,
): DrillResolution {
  const resolution = resolveSubflowInvocation(
    parent,
    key,
    cursorId,
    requestedId,
  );
  if (resolution.kind !== "found") return resolution;
  const snapshot = resolution.snapshot;
  const mountRuntimeStageId = snapshot.runtimeStageId;
  if (!mountRuntimeStageId) return { kind: "missing" };
  const invocationPath = [...parentPath, mountRuntimeStageId];
  const result = snapshot.subflowResult;
  if (!result || typeof result !== "object") return { kind: "missing" };
  let cached = cache.get(result);
  if (!cached) {
    cached = new Map();
    cache.set(result, cached);
  }
  const cacheKey = JSON.stringify([invocationPath, readsAvailable]);
  let projection = cached.get(cacheKey);
  if (!projection) {
    const scope = childTraceScope(result, invocationPath, readsAvailable);
    // Admission and conversion share one selected record. Refused evidence
    // never feeds a trace walker; the existing adapter supplies rail values.
    let snapshots: StageSnapshot[] = [];
    try {
      snapshots = subflowResultToSnapshots(result);
    } catch {
      return { kind: "missing" };
    }
    projection = { scope, snapshots };
    cached.set(cacheKey, projection);
  }
  if (!projection.snapshots.length) return { kind: "missing" };
  // Child results are run-level facts and may advance independently of this
  // parent's immutable record. Never retain an old map inside a cached rail.
  const snapshots = projection.snapshots.map((stage) => {
    const child = stage.runtimeStageId
      ? results?.[stage.runtimeStageId]
      : undefined;
    return child ? { ...stage, subflowResult: child } : stage;
  });
  const runtimeIds = new Set(snapshots.map((stage) => stage.runtimeStageId));
  const selectedNarrative = narrative?.filter(
    (entry) => !!entry.runtimeStageId && runtimeIds.has(entry.runtimeStageId),
  );
  const label = snapshot.stageLabel ?? snapshot.stageName ?? key;
  return {
    kind: "found",
    entry: {
      subflowId: key,
      label:
        resolution.total > 1
          ? `${label} · visit ${resolution.visit} of ${resolution.total}`
          : label,
      spec: null,
      snapshots,
      narrative: selectedNarrative,
      traceScope: projection.scope,
      sourceRunId,
      parentSnapshotIdx: resolution.index,
      mountRuntimeStageId,
    },
  };
}
