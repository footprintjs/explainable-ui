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
export const START_SENTENCE = "recorded at invocation start; earlier origin unknown";
export function inputSentence(scope: TraceWalkScope | undefined, key: string): string {
  return scope?.startKeys?.includes(key)
    ? START_SENTENCE
    : "no recorded write; value unknown";
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
