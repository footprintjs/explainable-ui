import * as react from 'react';
import { CSSProperties } from 'react';
import { TimeTravelSource, KeysReadSource, StateKey, Stop, FoldedState, VariableSlice } from 'foottrace';

/** A caller-selected source. This facade never discovers, joins or drills sources. */
interface RecordLensInput {
    readonly sourceId: string;
    readonly source: TimeTravelSource;
    /** A stop's numeric step, not its commit index. Empty sources accept only 0. */
    readonly step: number;
    /** Must describe reads from this same source; absent evidence stays unknown. */
    readonly reads?: KeysReadSource;
    readonly selectedKey?: StateKey;
}
/** Display projection only: Foottrace owns value equality and state reconstruction. */
interface RecordChange {
    readonly key: string;
    readonly kind: "added" | "changed" | "removed";
    readonly before?: unknown;
    readonly after?: unknown;
}
type RecordProvenance = {
    readonly status: "ready";
    /** Preserve the canonical result, including missing reasons and evidence notes. */
    readonly slice: VariableSlice;
    /** Foottrace's formatter output, never a Lens-written causal narrative. */
    readonly prose: string;
    readonly reads: "provided" | "unknown";
} | {
    readonly status: "unavailable";
    readonly reason: "log-gap" | "query-refused";
    readonly message: string;
};
interface RecordRefusal {
    readonly code: "invalid-source-id" | "invalid-step" | "read-refused";
    readonly message: string;
}
interface RecordLensPosition {
    readonly sourceId: string;
    readonly step: number;
    /** Canonical source-local stops, including phase ranges and bookends. */
    readonly stops: readonly Stop[];
}
type RecordLensModel = (RecordLensPosition & {
    readonly status: "ready" | "empty";
    /** Empty sources expose their base without inventing a cursor stop. */
    readonly selected: Stop | null;
    readonly folded: FoldedState;
    /** Previous stop, or the raw base before the first stop (including seed commits). */
    readonly previous: FoldedState;
    readonly changes: readonly RecordChange[];
    readonly provenance?: RecordProvenance;
}) | (RecordLensPosition & {
    readonly status: "refused";
    readonly selected: null;
    readonly refusal: RecordRefusal;
});

interface RecordLensProps extends RecordLensInput {
    /** Read-only navigation intent. The host owns and updates the selected step. */
    readonly onStepChange?: (step: number) => void;
    /** Exact top-level key segments; a dotted property name stays a single key. */
    readonly onKeyChange?: (key: StateKey) => void;
    readonly className?: string;
    readonly style?: CSSProperties;
}
/** Read-only record viewer. The host supplies the selected source and cursor. */
declare function RecordLens(props: RecordLensProps): react.JSX.Element;

/** Read one explicit source through Foottrace; never clamp or mutate the caller's cursor. */
declare function buildRecordLensModel(input: RecordLensInput): RecordLensModel;

export { type RecordChange, RecordLens, type RecordLensInput, type RecordLensModel, type RecordLensProps, type RecordProvenance, type RecordRefusal, buildRecordLensModel };
