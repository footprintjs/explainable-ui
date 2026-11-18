// A bounded inspection before speculating on a fold or cloning a query DAG.
// Count each container once, but charge for every edge, key and string. Wide
// sparse arrays and native objects cannot hide a large allocation in the cache.
export function fitsReaderCache(value: unknown): boolean {
  let budget = 4096;
  const pending: unknown[] = [value];
  const seen = new Set<object>();
  while (pending.length) {
    const item = pending.pop();
    if (typeof item === "string") budget -= item.length;
    if (budget < 0 || typeof item === "bigint" || typeof item === "symbol" || typeof item === "function") return false;
    if (!item || typeof item !== "object" || seen.has(item)) continue;
    seen.add(item);
    if (Array.isArray(item)) {
      if (item.length > 256) return false;
      budget -= 8 * item.length;
      if (budget < 0) return false;
    } else {
      const proto = Object.getPrototypeOf(item);
      if (proto !== Object.prototype && proto !== null) return false;
    }
    for (const key in item) {
      const property = Object.getOwnPropertyDescriptor(item, key);
      if (!property) continue;
      budget -= 16 + key.length;
      if (budget < 0 || !("value" in property)) return false;
      pending.push(property.value);
    }
  }
  return true;
}
