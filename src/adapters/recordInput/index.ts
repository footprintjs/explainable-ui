import type { KeysReadSource, TimeTravelSource } from "foottrace";

/** Supplied stage-read evidence is not a claim of complete capture. */
export type FlowReadEvidence =
  | { readonly status: "unknown" }
  | { readonly status: "supplied"; readonly source: KeysReadSource };

/** One source, explicitly selected by the host; never a root/child lookup. */
export interface FlowRecordSelection {
  readonly sourceId: string;
  /** Snapshot uses commitLog; the two child envelopes use their own history. */
  readonly format: "snapshot" | "subtree" | "tree-context";
  readonly record: unknown;
  readonly reads: FlowReadEvidence;
}

export type FlowRecordInput =
  | {
      readonly status: "accepted";
      readonly sourceId: string;
      readonly source: TimeTravelSource;
      readonly evidence: {
        readonly base: "recorded" | "missing";
        readonly reads: FlowReadEvidence;
      };
    }
  | {
      readonly status: "refused";
      readonly code:
        | "invalid-source-id"
        | "unsupported-format"
        | "invalid-record"
        | "missing-log"
        | "invalid-log"
        | "invalid-base"
        | "invalid-read-evidence";
      readonly message: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * M2's structural seam, not a reader or validator for individual record rows.
 * Foottrace alone interprets rows at the requested boundary. Keeping the array
 * untouched preserves gaps and addresses, including a valid prefix before a
 * later corrupt row. This module is not wired into the released Flow views.
 */
export function adaptFlowRecord(input: FlowRecordSelection): FlowRecordInput {
  if (typeof input.sourceId !== "string" || !input.sourceId.trim()) {
    return {
      status: "refused",
      code: "invalid-source-id",
      message: "Select and label one recorded source.",
    };
  }
  if (
    input.format !== "snapshot" &&
    input.format !== "subtree" &&
    input.format !== "tree-context"
  ) {
    return {
      status: "refused",
      code: "unsupported-format",
      message:
        "Select a snapshot, subtree, or tree-context envelope explicitly.",
    };
  }
  if (!isRecord(input.record)) {
    return {
      status: "refused",
      code: "invalid-record",
      message: "The selected recording must be a plain source object.",
    };
  }
  const field = input.format === "snapshot" ? "commitLog" : "history";
  const log: unknown = input.record[field];
  if (log === undefined) {
    return {
      status: "refused",
      code: "missing-log",
      message: `The selected source has no ${field}; stageWrites alone cannot reconstruct its record.`,
    };
  }
  if (!Array.isArray(log)) {
    return {
      status: "refused",
      code: "invalid-log",
      message: `The selected source's ${field} must be an array.`,
    };
  }
  const base = input.record.initialState;
  if (base !== undefined && !isRecord(base)) {
    return {
      status: "refused",
      code: "invalid-base",
      message:
        "The recorded initialState must be a plain state object or absent.",
    };
  }
  if (
    !input.reads ||
    (input.reads.status !== "unknown" && input.reads.status !== "supplied") ||
    (input.reads.status === "supplied" &&
      (!input.reads.source ||
        typeof input.reads.source.kind !== "string" ||
        typeof input.reads.source.lookup !== "function"))
  ) {
    return {
      status: "refused",
      code: "invalid-read-evidence",
      message:
        "Declare reads unknown or supply this source's KeysReadSource explicitly.",
    };
  }
  const tree =
    input.format === "tree-context"
      ? input.record.stageContexts
      : input.record.executionTree;
  const source: TimeTravelSource = {
    ...(field === "commitLog" ? { commitLog: log } : { history: log }),
    ...(base !== undefined && { initialState: base }),
    ...(tree !== undefined && { executionTree: tree }),
    ...(input.record.subflowResults !== undefined && {
      subflowResults: input.record.subflowResults,
    }),
  };
  return {
    status: "accepted",
    sourceId: input.sourceId,
    source,
    evidence: {
      base: base === undefined ? "missing" : "recorded",
      reads: input.reads,
    },
  };
}
