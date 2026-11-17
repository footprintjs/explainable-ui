import { attentionNames } from "./banks";

/** Presentation only, for one admitted kind. Never enumerate or retain the host map. */
export function resolveInvestigationMarkLabel(labels: unknown, kind: string): string {
  const fallback = Object.prototype.hasOwnProperty.call(attentionNames, kind)
    ? attentionNames[kind as keyof typeof attentionNames]
    : kind;
  if (!labels || typeof labels !== "object") return fallback;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(labels, kind);
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, "value")) return fallback;
    const value: unknown = descriptor.value;
    return typeof value === "string" && value.length > 0 && value.length <= 512 ? value : fallback;
  } catch {
    return fallback;
  }
}
