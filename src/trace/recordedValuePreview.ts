import { isPlainRecord, ownDataField } from "./safeRecordRead";

/** Engine trace paths use UNIT SEPARATOR; dots inside a recorded key stay literal. */
export function recordedValueAtPath(memory: unknown, key: string): unknown {
  if (key.length > 4_096) return undefined;
  const parts = key.split("\u001f");
  if (parts.length > 128) return undefined;
  try {
    let value = memory;
    for (const part of parts) value = ownDataField(value, part);
    return value;
  } catch { return undefined; }
}

export const recordedPathLabel = (key: string): string => key.replace(/\u001f/g, " › ");

/** Small, inert snapshot previews: never call getters, toJSON or custom formatters. */
export function recordedValuePreview(value: unknown): string | null {
  if (value === undefined) return null;
  let remaining = 32;
  const seen = new Set<object>();
  function visit(item: unknown, depth: number): string {
    if (--remaining < 0) return "…";
    if (item === null) return "null";
    if (typeof item === "string") return JSON.stringify(item.length > 56 ? `${item.slice(0, 53)}…` : item);
    if (typeof item === "number" || typeof item === "boolean") return String(item);
    if (typeof item !== "object") return "[unavailable]";
    if (seen.has(item)) return "[circular]";
    if (depth >= 2) return Array.isArray(item) ? "[…]" : "{…}";
    seen.add(item);
    let result: string;
    if (Array.isArray(item)) {
      const length = ownDataField(item, "length");
      if (typeof length !== "number") return "[unavailable]";
      const count = Math.min(length, 5);
      const parts = Array.from({ length: count }, (_, index) => visit(ownDataField(item, index), depth + 1));
      result = `[${parts.join(", ")}${length > count ? ", …" : ""}]`;
    } else if (isPlainRecord(item)) {
      const keys = Object.keys(item);
      const parts = keys.slice(0, 3).map(key => `${key.length > 24 ? `${key.slice(0, 21)}…` : key}: ${visit(ownDataField(item, key), depth + 1)}`);
      result = `{${parts.join(", ")}${keys.length > 3 ? ", …" : ""}}`;
    } else result = "[unavailable]";
    seen.delete(item);
    return result;
  }
  try {
    const text = visit(value, 0);
    return text.length > 100 ? `${text.slice(0, 97)}…` : text;
  } catch {
    return null;
  }
}
