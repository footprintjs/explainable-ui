import { createNativeGraph } from "./graph";

/** Graph-only hosts can load the Shell without a recording peer. Only an
 * addressed Backtrack question requests the two public Foottrace doors. */
export async function loadScopedRecordGraph(snapshot: unknown) {
  const [trace, cause] = await Promise.all([
    import("foottrace").catch(() => undefined),
    import("foottrace/cause").catch(() => undefined),
  ]);
  if (!trace || !cause) return undefined;
  return createNativeGraph(snapshot, {
    commitValueAtWithBasis: trace.commitValueAtWithBasis,
    findLastWriterWithBasis: trace.findLastWriterWithBasis,
    findReadSources: trace.findReadSources,
    createRecordGraph: cause.createRecordGraph,
  });
}
