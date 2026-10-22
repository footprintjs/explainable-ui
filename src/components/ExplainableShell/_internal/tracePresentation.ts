import type { TraceWalk } from "./traceWalk";
import type { TraceScope } from "./traceScope";
/** Internal rendering metadata keeps the published walk/card types unchanged. */
export interface TracePresentation {
  invocationPath: readonly string[];
  mountLabels: ReadonlyMap<string, string>;
}
const presentations = new WeakMap<TraceWalk, TracePresentation>();
export function presentScopedWalk(
  walk: TraceWalk,
  scope: TraceScope,
): TraceWalk {
  walk.readsAvailable = scope.readsAvailable;
  presentations.set(walk, {
    invocationPath: scope.invocationPath,
    mountLabels: scope.mountLabels,
  });
  return walk;
}
export function tracePresentation(
  walk: TraceWalk,
): TracePresentation | undefined {
  return presentations.get(walk);
}
export function scopeSentence(
  presentation: TracePresentation | undefined,
): string | undefined {
  return presentation?.invocationPath.length
    ? `Tracing subflow invocation ${presentation.invocationPath.join(" → ")}. Parent ancestry is unknown.`
    : undefined;
}
export function inputSentence(
  presentation: TracePresentation | undefined,
): string {
  const path = presentation?.invocationPath;
  return path?.length
    ? `received at the subflow boundary (input mapping of ${path[path.length - 1]})`
    : "run input — never written";
}
