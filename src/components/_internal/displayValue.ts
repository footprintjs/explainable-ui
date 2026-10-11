import { deepEqual } from "foottrace";
import { previewValue } from "../../record/preview";

/** JSON presentation remains unchanged for ordinary JSON data. Otherwise use
 * the existing bounded preview, without executing getters or toJSON hooks. */
function isJsonData(value: unknown, ancestors = new Set<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  if (
    (!Array.isArray(value) && proto !== Object.prototype && proto !== null) ||
    "toJSON" in value ||
    ancestors.has(value)
  )
    return false;
  ancestors.add(value);
  try {
    for (const key of Object.keys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        !descriptor ||
        !("value" in descriptor) ||
        !isJsonData(descriptor.value, ancestors)
      )
        return false;
    }
    return true;
  } finally {
    ancestors.delete(value);
  }
}

function jsonText(value: unknown, indent?: number): string | undefined {
  try {
    return isJsonData(value) ? JSON.stringify(value, null, indent) : undefined;
  } catch {
    return undefined;
  }
}

export function displayValue(value: unknown, indent?: number): string {
  if (typeof value === "string") return `"${value}"`;
  if (value === null || typeof value !== "object")
    return typeof value === "bigint" ? previewValue(value) : String(value);
  return jsonText(value, indent) ?? previewValue(value);
}

export function displayValuesEqual(a: unknown, b: unknown): boolean {
  const aJson = jsonText(a),
    bJson = jsonText(b);
  return aJson !== undefined && bJson !== undefined
    ? aJson === bJson
    : deepEqual(a, b);
}
