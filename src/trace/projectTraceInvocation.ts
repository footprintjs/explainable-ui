/** Exact recorded-invocation projection for both UI and non-UI clients.
 * No path aliases, stage-label fallback, values, engine or storage access. */
import {
  childTraceScope,
  rootMountLabels,
  runHasRecordedReads,
  type TraceAvailability,
} from "./traceScope";
import {
  classifyAdmissionFailure,
  isPlainRecord,
  ownDataField,
  readName,
  readOwnArray,
  WorkBudget,
} from "./safeRecordRead";
import type { TraceWalkScope } from "./traceWalk";

export interface TraceInvocationOptions {
  /** Optional exact outer-to-inner invocation stamps. No ancestor is inferred. */
  invocationPath?: readonly string[];
}
export interface TraceInvocationProjection {
  readonly availability:
    | TraceAvailability
    | {
        ok: false;
        reason: "invocation-not-recorded" | "ancestor-not-recorded";
      };
  readonly commitLog: unknown[];
  readonly executionTree: unknown;
  readonly scope: TraceWalkScope;
}
export function projectTraceInvocation(
  snapshot: unknown,
  exactMountId: string,
  options?: TraceInvocationOptions
): TraceInvocationProjection {
  const unavailable = (
    availability: TraceInvocationProjection["availability"]
  ): TraceInvocationProjection => ({
    availability,
    commitLog: [],
    executionTree: undefined,
    scope: Object.freeze({
      invocationPath: Object.freeze([]),
      readsAvailable: false,
    }),
  });
  try {
    const targetId = readName(exactMountId);
    // A runtime stamp is exact; an unscoped path alone cannot identify a visit.
    if (!targetId.includes("#"))
      return unavailable({ ok: false, reason: "invocation-not-recorded" });
    const budget = new WorkBudget();
    const pathValue = ownDataField(options, "invocationPath");
    const path =
      pathValue === undefined
        ? [targetId]
        : readOwnArray(pathValue, budget).map(readName);
    if (
      path.length === 0 ||
      path.length > 128 ||
      path.join("").length > 8_192 ||
      path[path.length - 1] !== targetId
    )
      return unavailable({ ok: false, reason: "ancestor-not-recorded" });
    const results = ownDataField(snapshot, "subflowResults");
    if (!isPlainRecord(results))
      return unavailable({ ok: false, reason: "invocation-not-recorded" });
    const root = rootMountLabels(
      ownDataField(snapshot, "executionTree"),
      ownDataField(snapshot, "commitLog") as unknown[] | undefined
    );
    if (!root.availability.ok) return unavailable(root.availability);
    const readsAvailable = root.hasTree && runHasRecordedReads(snapshot);
    let parents = root.labels;
    for (let index = 0; index < path.length; index++) {
      // Only a supplied ancestry chain makes an ancestor claim. A direct
      // exact lookup deliberately leaves parent ancestry unknown.
      if (path.length > 1 && !parents.has(path[index]))
        return unavailable({ ok: false, reason: "ancestor-not-recorded" });
      const result = ownDataField(results, path[index]);
      if (result === undefined)
        return unavailable({
          ok: false,
          reason:
            index === path.length - 1
              ? "invocation-not-recorded"
              : "ancestor-not-recorded",
        });
      const selected = childTraceScope(
        result,
        path.slice(0, index + 1),
        readsAvailable
      );
      if (!selected.availability.ok) return unavailable(selected.availability);
      parents = selected.mountLabels;
      if (index === path.length - 1) {
        return {
          availability: selected.availability,
          commitLog: selected.commitLog,
          executionTree: selected.executionTree,
          scope: Object.freeze({
            invocationPath: Object.freeze([...path]),
            mountLabels: Object.freeze(
              Object.fromEntries(selected.mountLabels)
            ),
            readsAvailable: selected.readsAvailable,
            startKeys: selected.startKeys,
          }),
        };
      }
    }
    return unavailable({ ok: false, reason: "invocation-not-recorded" });
  } catch (error) {
    return unavailable({ ok: false, ...classifyAdmissionFailure(error) });
  }
}
