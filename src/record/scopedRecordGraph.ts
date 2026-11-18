import { commitValueAtWithBasis, findLastWriterWithBasis, findReadSources } from "foottrace";
import { createRecordGraph } from "foottrace/cause";
import { createNativeGraph } from "../scopedBacktrack/graph";

export type { ScopedRecordGraph, ScopedGap, ScopedWriter, ScopedBacktrack } from "../scopedBacktrack/graph";

/** Prepare native log addresses for Backtrack using the installed Foottrace peer. */
export function createScopedRecordGraph(snapshot: unknown) {
  return createNativeGraph(snapshot, { commitValueAtWithBasis, findLastWriterWithBasis, findReadSources, createRecordGraph });
}
