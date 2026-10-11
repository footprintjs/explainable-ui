// src/record/preview.ts
function previewValue(value) {
  const seen = /* @__PURE__ */ new WeakSet();
  let remaining = 100;
  const quote = (text) => JSON.stringify(text.length > 300 ? `${text.slice(0, 300)}\u2026` : text);
  const own = (object, key, depth) => {
    const property = Object.getOwnPropertyDescriptor(object, key);
    if (!property) return "[absent]";
    return "value" in property ? show(property.value, depth) : "[accessor not read]";
  };
  const show = (item, depth) => {
    if (--remaining < 0 || depth > 4) return "[preview limit]";
    if (item === null) return "null";
    if (item === void 0) return "[undefined]";
    if (typeof item === "string") return quote(item);
    if (typeof item === "bigint") return `${item}n`;
    if (typeof item === "number" || typeof item === "boolean")
      return String(item);
    if (typeof item !== "object") return `[${typeof item}]`;
    if (seen.has(item)) return "[repeated reference]";
    seen.add(item);
    if (item instanceof Date) {
      return Number.isNaN(Date.prototype.getTime.call(item)) ? "[Invalid Date]" : `Date(${Date.prototype.toISOString.call(item)})`;
    }
    if (item instanceof Map || item instanceof Set) {
      const prototype2 = item instanceof Map ? Map.prototype : Set.prototype;
      const size = Object.getOwnPropertyDescriptor(
        prototype2,
        "size"
      )?.get?.call(item);
      return `[${item instanceof Map ? "Map" : "Set"}: ${size} entries]`;
    }
    if (item instanceof RegExp) return "[RegExp]";
    if (ArrayBuffer.isView(item)) return "[TypedArray or DataView]";
    if (item instanceof ArrayBuffer) return "[ArrayBuffer]";
    if (Array.isArray(item)) {
      const length = Object.getOwnPropertyDescriptor(item, "length")?.value ?? 0;
      const parts2 = Array.from(
        { length: Math.min(length, 10) },
        (_, index) => own(item, String(index), depth + 1)
      );
      if (length > 10) parts2.push("\u2026");
      return `[${parts2.join(", ")}]`;
    }
    const prototype = Object.getPrototypeOf(item);
    if (prototype !== null && prototype !== Object.prototype)
      return "[Object preview unavailable]";
    const parts = [];
    for (const key in item) {
      if (!Object.prototype.hasOwnProperty.call(item, key)) continue;
      if (parts.length === 10 || remaining <= 0) {
        parts.push("\u2026");
        break;
      }
      parts.push(`${quote(key)}: ${own(item, key, depth + 1)}`);
    }
    return `{${parts.join(", ")}}`;
  };
  try {
    const text = show(value, 0);
    return text.length > 800 ? `${text.slice(0, 800)}\u2026` : text;
  } catch {
    return "[preview unavailable]";
  }
}

export { previewValue };
//# sourceMappingURL=chunk-QDHBS46D.js.map
//# sourceMappingURL=chunk-QDHBS46D.js.map