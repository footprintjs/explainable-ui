import type { StageSnapshot } from "../../../types";
export type InvocationResolution =
  | {
      kind: "found";
      snapshot: StageSnapshot;
      index: number;
      visit: number;
      total: number;
    }
  | {
      kind: "ambiguous";
      visits: Array<{
        runtimeStageId: string;
        step: number;
        visit: number;
        total: number;
      }>;
    }
  | { kind: "missing" };
/** Only exact mount paths and invocation IDs identify visits; labels never do. */
export function resolveSubflowInvocation(
  snapshots: StageSnapshot[],
  mountKey: string,
  cursorId?: string,
  requestedId?: string,
): InvocationResolution {
  const candidates = snapshots
    .map((snapshot, index) => ({ snapshot, index }))
    .filter(
      ({ snapshot }) =>
        snapshot.subflowId === mountKey ||
        snapshot.runtimeStageId?.split("#")[0] === mountKey,
    );
  const ids = candidates.flatMap(({ snapshot }) =>
    snapshot.runtimeStageId ? [snapshot.runtimeStageId] : [],
  );
  if (new Set(ids).size !== ids.length) return { kind: "missing" };
  const selected = requestedId
    ? candidates.find(({ snapshot }) => snapshot.runtimeStageId === requestedId)
    : (candidates.find(
        ({ snapshot }) => snapshot.runtimeStageId === cursorId,
      ) ?? (candidates.length === 1 ? candidates[0] : undefined));
  if (selected && !selected.snapshot.subflowResult) return { kind: "missing" };
  if (selected)
    return {
      kind: "found",
      ...selected,
      visit: candidates.indexOf(selected) + 1,
      total: candidates.length,
    };
  if (candidates.length > 1)
    return {
      kind: "ambiguous",
      visits: candidates.flatMap(({ snapshot, index }, visit) =>
        snapshot.runtimeStageId
          ? [
              {
                runtimeStageId: snapshot.runtimeStageId,
                step: index + 1,
                visit: visit + 1,
                total: candidates.length,
              },
            ]
          : [],
      ),
    };
  return { kind: "missing" };
}
export function pathMountChain(path: string): string[] {
  return path
    .split("/")
    .map((_, index, parts) => parts.slice(0, index + 1).join("/"));
}
