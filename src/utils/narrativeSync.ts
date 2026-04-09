/**
 * Narrative sync utilities — shared logic for mapping timeline position
 * to narrative entries. Used by NarrativePanel and available to consumers
 * building custom visualization shells.
 */
import type { StageSnapshot, NarrativeEntry } from "../types";

// ── Entry Range Index ───────────────────────────────────────────────────────

/**
 * Range index: runtimeStageId → half-open range [firstIdx, endIdx) in entries array.
 *
 * This is the same shape as `SequenceRecorder.getEntryRanges()` in footprintjs.
 * When you have recorder access, pass `recorder.getEntryRanges()` directly.
 * When you only have the flat array, use `buildEntryRangeIndex()` to build it.
 */
export type EntryRangeIndex = ReadonlyMap<string, { readonly firstIdx: number; readonly endIdx: number }>;

/**
 * Build a range index from a flat entries array for O(1) per-step lookups.
 * Equivalent to `SequenceRecorder.getEntryRanges()` but works on detached arrays.
 *
 * Call once when narrativeEntries changes, then pass to `computeRevealedEntryCount`.
 *
 * @param entries — structured entries (from CombinedNarrativeRecorder.getEntries() or getNarrativeEntries())
 * @returns range index for fast slider sync
 */
export function buildEntryRangeIndex(entries: Pick<NarrativeEntry, "runtimeStageId">[]): EntryRangeIndex {
  const ranges = new Map<string, { firstIdx: number; endIdx: number }>();
  let lastId: string | undefined;

  for (let i = 0; i < entries.length; i++) {
    const id = entries[i].runtimeStageId;
    if (id) {
      const existing = ranges.get(id);
      if (!existing) {
        ranges.set(id, { firstIdx: i, endIdx: i + 1 });
      } else {
        existing.endIdx = i + 1;
      }
      lastId = id;
    } else if (lastId) {
      // Structural marker — extend preceding step's range
      ranges.get(lastId)!.endIdx = i + 1;
    }
  }

  return ranges;
}

// ── Revealed Entry Count ────────────────────────────────────────────────────

/**
 * Compute how many narrative entries to reveal at a given slider position.
 *
 * **With range index (preferred):** O(selectedIndex) — one Map lookup per snapshot.
 * **Without index (convenience):** O(entries) forward scan.
 *
 * The range index can come from:
 * - `SequenceRecorder.getEntryRanges()` (when you have recorder access)
 * - `buildEntryRangeIndex(entries)` (when you only have the flat array)
 *
 * @param narrativeEntries — structured entries from CombinedNarrativeRecorder
 * @param snapshots — execution timeline (from adapter)
 * @param selectedIndex — current slider position (0-based)
 * @param rangeIndex — optional precomputed range index for O(1) lookups
 * @returns number of entries to reveal (0 to narrativeEntries.length)
 */
export function computeRevealedEntryCount(
  narrativeEntries: NarrativeEntry[],
  snapshots: Pick<StageSnapshot, "runtimeStageId">[],
  selectedIndex: number,
  rangeIndex?: EntryRangeIndex,
): number {
  if (!narrativeEntries.length || snapshots.length === 0) return 0;

  if (rangeIndex) {
    // Fast path: O(selectedIndex) with Map lookups
    let maxEndIdx = 0;
    for (let si = 0; si <= selectedIndex && si < snapshots.length; si++) {
      const targetId = snapshots[si].runtimeStageId;
      if (!targetId) continue;
      const range = rangeIndex.get(targetId);
      if (range && range.endIdx > maxEndIdx) {
        maxEndIdx = range.endIdx;
      }
    }
    return maxEndIdx;
  }

  // Fallback: forward scan (no index provided)
  let entryIdx = 0;
  for (let si = 0; si <= selectedIndex && si < snapshots.length; si++) {
    const targetId = snapshots[si].runtimeStageId;
    if (!targetId) continue;

    let found = false;
    for (let j = entryIdx; j < narrativeEntries.length; j++) {
      if (narrativeEntries[j].runtimeStageId === targetId) {
        found = true;
        entryIdx = j;
        break;
      }
    }
    if (!found) continue;

    while (entryIdx < narrativeEntries.length) {
      const eId = narrativeEntries[entryIdx].runtimeStageId;
      if (eId && eId !== targetId) break;
      entryIdx++;
    }
  }
  return entryIdx;
}

// ── Subflow Extraction ──────────────────────────────────────────────────────

/**
 * Extract narrative entries belonging to a specific subflow.
 *
 * Three-tier matching (most reliable first):
 * 1. `stageName` prefix match (e.g., entries with `stageName` starting with `"sf-pay/"`)
 * 2. `subflowId` field match
 * 3. `direction` field on subflow entry/exit markers (renderer-agnostic)
 *
 * @param entries — all narrative entries from the execution
 * @param subflowId — subflow identifier to extract
 * @param subflowName — optional display name for fallback matching
 * @returns entries belonging to the subflow
 */
export function extractSubflowNarrative(
  entries: NarrativeEntry[],
  subflowId: string,
  subflowName?: string,
): NarrativeEntry[] {
  // Primary: filter by stageName prefix
  const prefix = subflowId + "/";
  const byPrefix = entries.filter((e) => e.stageName?.startsWith(prefix));
  if (byPrefix.length > 0) return byPrefix;

  // Fallback: structured subflowId field
  const byId = entries.filter((e) => e.subflowId === subflowId);
  if (byId.length > 0) return byId;

  // Last resort: use direction field on subflow entries (renderer-agnostic)
  const result: NarrativeEntry[] = [];
  const searchName = subflowName ?? subflowId;
  let inside = false;
  for (const entry of entries) {
    if (entry.type === "subflow" && entry.direction === "entry" && entry.stageName === searchName) { inside = true; continue; }
    if (inside && entry.type === "subflow" && entry.direction === "exit" && entry.stageName === searchName) break;
    if (inside) result.push(entry);
  }
  return result;
}
