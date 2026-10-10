/** Display text only: no toJSON/getter execution, serialization or record semantics.
 * Ordinary data is supported; deliberately hostile proxies are not a sandbox.
 */
export function previewValue(value: unknown): string {
  const seen = new WeakSet<object>();
  let remaining = 100;
  const quote = (text: string) =>
    JSON.stringify(text.length > 300 ? `${text.slice(0, 300)}…` : text);
  const own = (object: object, key: string, depth: number): string => {
    const property = Object.getOwnPropertyDescriptor(object, key);
    if (!property) return "[absent]";
    return "value" in property
      ? show(property.value, depth)
      : "[accessor not read]";
  };
  const show = (item: unknown, depth: number): string => {
    if (--remaining < 0 || depth > 4) return "[preview limit]";
    if (item === null) return "null";
    if (item === undefined) return "[undefined]";
    if (typeof item === "string") return quote(item);
    if (typeof item === "bigint") return `${item}n`;
    if (typeof item === "number" || typeof item === "boolean")
      return String(item);
    if (typeof item !== "object") return `[${typeof item}]`;
    if (seen.has(item)) return "[repeated reference]";
    seen.add(item);
    if (item instanceof Date) {
      return Number.isNaN(Date.prototype.getTime.call(item))
        ? "[Invalid Date]"
        : `Date(${Date.prototype.toISOString.call(item)})`;
    }
    if (item instanceof Map || item instanceof Set) {
      const prototype = item instanceof Map ? Map.prototype : Set.prototype;
      const size = Object.getOwnPropertyDescriptor(
        prototype,
        "size"
      )?.get?.call(item);
      return `[${item instanceof Map ? "Map" : "Set"}: ${size} entries]`;
    }
    if (item instanceof RegExp) return "[RegExp]";
    if (ArrayBuffer.isView(item)) return "[TypedArray or DataView]";
    if (item instanceof ArrayBuffer) return "[ArrayBuffer]";
    if (Array.isArray(item)) {
      const length =
        Object.getOwnPropertyDescriptor(item, "length")?.value ?? 0;
      const parts = Array.from({ length: Math.min(length, 10) }, (_, index) =>
        own(item, String(index), depth + 1)
      );
      if (length > 10) parts.push("…");
      return `[${parts.join(", ")}]`;
    }
    const prototype = Object.getPrototypeOf(item);
    if (prototype !== null && prototype !== Object.prototype)
      return "[Object preview unavailable]";
    const parts: string[] = [];
    // Enumerate names without reading values. Stop before inspecting another child.
    for (const key in item) {
      if (!Object.prototype.hasOwnProperty.call(item, key)) continue;
      if (parts.length === 10 || remaining <= 0) {
        parts.push("…");
        break;
      }
      parts.push(`${quote(key)}: ${own(item, key, depth + 1)}`);
    }
    return `{${parts.join(", ")}}`;
  };
  try {
    const text = show(value, 0);
    return text.length > 800 ? `${text.slice(0, 800)}…` : text;
  } catch {
    return "[preview unavailable]";
  }
}
