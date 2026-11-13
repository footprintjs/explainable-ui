import { toVisualizationSnapshots } from "../adapters/fromRuntimeSnapshot";
import type { NarrativeEntry, StageSnapshot } from "../types";

/** Raw runtime snapshot consumed by the recording views, without an engine dependency. */
export interface RuntimeSnapshotInput {
  sharedState: Record<string, unknown>;
  executionTree: unknown;
  commitLog: unknown[];
  subflowResults?: Record<string, unknown>;
  /** Recorder snapshots from toSnapshot() — auto-generates detail tabs. */
  recorders?: Array<{
    id: string;
    name: string;
    description?: string;
    preferredOperation?: "translate" | "accumulate" | "aggregate";
    data: unknown;
  }>;
}

export type ParsedRecordingInput =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly detail: string };

/** Parse mechanics only: each public view retains its own envelope/error policy. */
export function parseRecordingInput(input: unknown): ParsedRecordingInput {
  if (typeof input !== "string") return { ok: true, value: input };
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

export type RuntimeSnapshotProjection =
  | { readonly kind: "ready" | "empty"; readonly snapshots: StageSnapshot[] }
  | {
      readonly kind: "unreadable";
      readonly snapshots: StageSnapshot[];
      readonly detail: string;
    };

/**
 * Project an already-selected source without adding admission, fallback or UI policy.
 * The shell supplies its own-field input and exact subflow results; callers retain
 * companion ownership, missing-data wording and whether an empty run is an error.
 */
export function projectRuntimeSnapshot(
  snapshot: unknown,
  narrativeEntries?: NarrativeEntry[],
): RuntimeSnapshotProjection {
  try {
    const snapshots = toVisualizationSnapshots(
      snapshot as Parameters<typeof toVisualizationSnapshots>[0],
      narrativeEntries,
    );
    return { kind: snapshots.length > 0 ? "ready" : "empty", snapshots };
  } catch (error) {
    return {
      kind: "unreadable",
      snapshots: [],
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
