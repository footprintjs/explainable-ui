/** Names-only admission for stored child trace evidence. Not a JS sandbox. */
export function ownDataField(value: unknown, key: PropertyKey): unknown {
  if (!value || typeof value !== "object") return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}
/** Optional means absent, never an accessor pretending to be absent. */
export function optionalOwnDataField(
  value: unknown,
  key: PropertyKey
): unknown {
  if (!value || typeof value !== "object") return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (descriptor && !("value" in descriptor))
    throw new TraceAdmissionError("malformed");
  return descriptor?.value;
}
export function isPlainRecord(
  value: unknown
): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
export const TRACE_WORK_LIMIT = 100_000;
export class TraceAdmissionError extends Error {
  constructor(
    readonly reason: "malformed" | "too-large",
    readonly items?: number
  ) {
    super(reason);
  }
}
export class WorkBudget {
  items = 0;
  constructor(readonly limit = TRACE_WORK_LIMIT) {}
  spend(count: number) {
    this.items += count;
    if (this.items > this.limit)
      throw new TraceAdmissionError("too-large", this.items);
  }
}
export function readOwnArray(value: unknown, budget: WorkBudget): unknown[] {
  const length = ownDataField(value, "length");
  if (
    !Array.isArray(value) ||
    typeof length !== "number" ||
    !Number.isInteger(length) ||
    length < 0
  )
    throw new TraceAdmissionError("malformed");
  budget.spend(length);
  const result: unknown[] = [];
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    if (!descriptor || !("value" in descriptor))
      throw new TraceAdmissionError("malformed");
    result.push(descriptor.value);
  }
  return result;
}
export function readName(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 4_096)
    throw new TraceAdmissionError("malformed");
  return value;
}

/** Error objects are untrusted too. Classification must never run their
 * accessors or prototype chain, and must itself always return fixed facts. */
export function classifyAdmissionFailure(error: unknown): {
  reason: "malformed" | "too-large";
  items?: number;
} {
  try {
    const reason = ownDataField(error, "reason");
    if (reason !== "too-large" && reason !== "malformed")
      return { reason: "malformed" };
    const items = ownDataField(error, "items");
    if (
      reason === "too-large" &&
      typeof items === "number" &&
      Number.isSafeInteger(items) &&
      items > 0
    )
      return { reason, items };
    return { reason: "malformed" };
  } catch {
    return { reason: "malformed" };
  }
}
