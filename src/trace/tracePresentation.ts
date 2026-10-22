import type { TraceWalkScope } from "./traceWalk";
/** Scope is explicit serializable data, shared by cards and plain-text clients. */
export function scopeSentence(
  scope: TraceWalkScope | undefined
): string | undefined {
  return scope?.invocationPath.length
    ? `Tracing subflow invocation ${scope.invocationPath.join(
        " → "
      )}. Parent ancestry is unknown.`
    : undefined;
}
export function inputSentence(scope: TraceWalkScope | undefined): string {
  const path = scope?.invocationPath;
  return path?.length
    ? `present when invocation ${
        path[path.length - 1]
      } started (input mapping, or state restored on resume)`
    : "run input — never written";
}
/** Only the exact invocation stamp (or its legacy empty stamp) is a start boundary. */
export function isInvocationStart(
  scope: TraceWalkScope | undefined,
  runtimeStageId: string
): boolean {
  return (
    !!scope?.invocationPath.length &&
    (runtimeStageId === scope.invocationPath[scope.invocationPath.length - 1] ||
      runtimeStageId === "")
  );
}
export function mountLabel(
  scope: TraceWalkScope | undefined,
  runtimeStageId: string
): string | undefined {
  if (!scope?.mountLabels) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(
    scope.mountLabels,
    runtimeStageId
  );
  return descriptor &&
    "value" in descriptor &&
    typeof descriptor.value === "string"
    ? descriptor.value
    : undefined;
}
