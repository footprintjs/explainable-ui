import type { NarrativeEntry, StageSnapshot } from "../types";
import { narrativeSynchronizationStatus } from "../utils/narrativeSync";

export interface CommentaryInput {
  readonly snapshots: readonly StageSnapshot[];
  readonly selectedIndex: number;
  readonly narrativeEntries: readonly NarrativeEntry[];
  readonly narrativeAvailable?: boolean;
  readonly narrativeScopeSubflowId?: string;
  readonly presentation?: "log" | "current";
  readonly maxLines?: number;
}

export interface CommentaryProjection {
  readonly availability: "exact" | "unsynchronized" | "unavailable";
  readonly reason?: string;
  readonly entries: readonly {
    readonly entry: NarrativeEntry;
    readonly sourceIndex: number;
    readonly selectedVisit: boolean;
  }[];
  readonly selectedRuntimeStageId: string | undefined;
  readonly totalCount: number;
  readonly revealedCount: number;
  readonly hiddenCount: number;
  readonly futureCount: number;
}

/** Recorded prose follows one admitted rail; recorder order never establishes a visit. */
export function projectCommentary(input: CommentaryInput): CommentaryProjection {
  const empty: CommentaryProjection = { availability: "exact", entries: [], selectedRuntimeStageId: undefined,
    totalCount: 0, revealedCount: 0, hiddenCount: 0, futureCount: 0 };
  if (input.narrativeAvailable === false) return { ...empty, availability: "unavailable", reason: "source-unavailable" };
  if (input.narrativeEntries.length === 0) return empty;
  const railStatus = narrativeSynchronizationStatus([], input.snapshots);
  if (railStatus.status !== "exact") return { ...empty, availability: "unsynchronized", reason: railStatus.reason };
  const railIds = new Set(input.snapshots.map(snapshot => snapshot.runtimeStageId).filter(Boolean));
  const snapshotsById = new Map(input.snapshots.map(snapshot => [snapshot.runtimeStageId, snapshot]));
  let scopeMismatch = false;
  const scoped = input.narrativeEntries.map((entry, sourceIndex) => ({ entry, sourceIndex })).filter(({ entry }) => {
    const scope = input.narrativeScopeSubflowId;
    if (scope !== undefined) {
      if (entry.type === "subflow") {
        // Exact mount boundaries may describe a nested child of this scope.
        if (entry.subflowId !== scope && !entry.subflowId?.startsWith(`${scope}/`)) return false;
        return !entry.runtimeStageId || railIds.has(entry.runtimeStageId);
      }
      return entry.subflowId === scope;
    }
    // A flattened recording may include child visits on this same rail. Their
    // exact runtime ids, rather than a guessed root/child label, admit them.
    if (entry.type === "subflow") return !entry.runtimeStageId || railIds.has(entry.runtimeStageId);
    if (entry.runtimeStageId && !railIds.has(entry.runtimeStageId) && entry.subflowId) return false;
    const owner = snapshotsById.get(entry.runtimeStageId)?.subflowId;
    if (owner !== undefined && owner !== entry.subflowId) { scopeMismatch = true; return false; }
    return true;
  });
  if (scoped.length === 0) return scopeMismatch
    ? { ...empty, availability: "unsynchronized", reason: "entry-scope-unavailable" } : empty;
  const synchronization = narrativeSynchronizationStatus(scoped.map(item => item.entry), input.snapshots);
  if (synchronization.status !== "exact") return { ...empty, availability: "unsynchronized", reason: synchronization.reason };
  const ownersByVisit = new Map<string, Set<string | undefined>>();
  for (const { entry } of scoped) {
    if (entry.type === "subflow") continue;
    const owners = ownersByVisit.get(entry.runtimeStageId!) ?? new Set<string | undefined>();
    owners.add(entry.subflowId);
    if (owners.size > 1) return { ...empty, availability: "unsynchronized", reason: "ambiguous-entry-scope" };
    ownersByVisit.set(entry.runtimeStageId!, owners);
  }
  if (!Number.isInteger(input.selectedIndex) || input.selectedIndex < 0 || input.selectedIndex >= input.snapshots.length) {
    return { ...empty, availability: "unsynchronized", reason: "cursor-unavailable" };
  }
  const selectedRuntimeStageId = input.snapshots[input.selectedIndex].runtimeStageId!;
  const admittedIds = new Set(input.snapshots.slice(0, input.selectedIndex + 1).map(snapshot => snapshot.runtimeStageId));
  const throughCursor = scoped.filter(({ entry }) => admittedIds.has(entry.runtimeStageId));
  const revealed = input.presentation === "current"
    ? throughCursor.filter(({ entry }) => entry.runtimeStageId === selectedRuntimeStageId) : throughCursor;
  const requestedLimit = input.maxLines ?? 200;
  const limit = Number.isFinite(requestedLimit) ? Math.max(0, Math.floor(requestedLimit)) : 200;
  const visible = revealed.slice(Math.max(0, revealed.length - limit));
  return {
    availability: "exact", selectedRuntimeStageId,
    entries: visible.map(item => ({ ...item, selectedVisit: item.entry.runtimeStageId === selectedRuntimeStageId })),
    totalCount: scoped.length, revealedCount: revealed.length,
    hiddenCount: revealed.length - visible.length, futureCount: scoped.length - throughCursor.length,
  };
}
