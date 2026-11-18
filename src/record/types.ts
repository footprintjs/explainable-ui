import type {
  FoldedState,
  KeysReadSource,
  StateKey,
  Stop,
  TimeTravelSource,
  TimeTravelStrategy,
  VariableSlice,
} from "foottrace";

import type { ScopedBacktrack, ScopedWriter } from "./scopedRecordGraph";

/** One caller-selected Foottrace source and its captured evidence. */
export interface RecordReaderInput<TMeta = unknown> {
  readonly sourceId: string;
  readonly source: TimeTravelSource;
  /** Must describe reads from this same source; absent evidence stays unknown. */
  readonly reads?: KeysReadSource;
  /** Foottrace owns stop grouping and each stop's commit boundaries. */
  readonly strategy?: TimeTravelStrategy<TMeta>;
}

export interface RecordLensInput<TMeta = unknown> extends RecordReaderInput<TMeta> {
  /** Source-local numeric stop. Empty sources accept only zero. */
  readonly step: number;
  readonly selectedKey?: StateKey;
}

export interface RecordBacktrackPosition {
  readonly invocationPath: readonly string[];
  readonly step: number;
  readonly key: readonly string[];
}

/** Cursor data for one immutable revision. The host owns its selected stop. */
export interface RecordLensReader<TMeta = unknown> {
  readonly sourceId: string;
  readonly stops: readonly Stop<TMeta>[];
  readonly backtrack?: (step: number, key: StateKey, signal?: AbortSignal) => Promise<ScopedBacktrack>;
  readonly forScope?: (invocationPath: readonly string[]) => RecordLensReader<TMeta> | undefined;
  readonly positionOf?: (writer: ScopedWriter) => (RecordBacktrackPosition & { readonly value: unknown }) | undefined;
  readonly at: (step: number, selectedKey?: StateKey) => RecordLensModel<TMeta>;
}

/** A direct recorded dependency whose producing stop shows this exact value. */
export interface RecordWriterStop {
  readonly step: number;
  readonly key: readonly string[];
  readonly stageName: string;
  readonly value: unknown;
}

/** Top-level changes use Foottrace equality and state reconstruction. */
export interface RecordChange {
  readonly key: string;
  readonly kind: "added" | "changed" | "removed";
  readonly before?: unknown;
  readonly after?: unknown;
}

export type RecordProvenance =
  | {
      readonly status: "ready";
      /** Preserve the canonical result, including missing reasons and evidence notes. */
      readonly slice: VariableSlice;
      /** Foottrace's formatter output, never a Lens-written causal narrative. */
      readonly prose: string;
      readonly reads: "provided" | "unknown";
    }
  | {
      readonly status: "unavailable";
      readonly reason: "log-gap" | "query-refused";
      readonly message: string;
    };

export interface RecordRefusal {
  readonly code: "invalid-source-id" | "invalid-step" | "read-refused";
  readonly message: string;
}

interface RecordLensPosition<TMeta> {
  readonly sourceId: string;
  readonly step: number;
  /** Canonical source-local stops, including phase ranges and bookends. */
  readonly stops: readonly Stop<TMeta>[];
}

export type RecordLensModel<TMeta = unknown> =
  | (RecordLensPosition<TMeta> & {
      readonly status: "ready" | "empty";
      /** Empty sources expose their base without inventing a cursor stop. */
      readonly selected: Stop<TMeta> | null;
      readonly folded: FoldedState;
      /** Previous stop, or the raw base before the first stop (including seed commits). */
      readonly previous: FoldedState;
      readonly changes: readonly RecordChange[];
      readonly provenance?: RecordProvenance;
      /** Direct writes with an exact, landable stop in this recording. */
      readonly writerStops?: readonly RecordWriterStop[];
    })
  | (RecordLensPosition<TMeta> & {
      readonly status: "refused";
      readonly selected: null;
      readonly refusal: RecordRefusal;
    });
