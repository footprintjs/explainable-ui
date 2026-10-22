import { useState } from "react";
import { sourceRunKey } from "./traceScope";
/** A host owns cohort association. Only known unchanged references can be
 * quarantined; a freshly copied but wrongly paired input cannot be proven. */
function hasPayload(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    (!Array.isArray(value) || value.length > 0)
  );
}
export function useRunCompanions<T extends Record<string, unknown>>(
  source: unknown,
  inputs: T
): { values: Partial<T>; staleKeys: Array<keyof T> } {
  const sourceKey = sourceRunKey(source);
  // Legacy sources without a recorded ID keep the established root append
  // behavior; there is no durable identity with which to certify a cohort.
  const runId = typeof sourceKey === "string" ? sourceKey : undefined;
  const [cohort, setCohort] = useState(() => ({
    runId,
    refs: inputs,
    quarantined: {} as Partial<T>,
  }));
  let current = cohort;
  const keys = Object.keys(inputs) as Array<keyof T>;
  if (cohort.runId !== runId) {
    const quarantined: Partial<T> = {};
    for (const key of keys)
      if (hasPayload(inputs[key]) && inputs[key] === cohort.refs[key])
        quarantined[key] = inputs[key];
    current = { runId, refs: inputs, quarantined };
  } else if (keys.some((key) => inputs[key] !== cohort.refs[key]))
    current = { ...cohort, refs: inputs };
  // Render-phase derived state is committed with this source; no effect-sized
  // frame can render facts known to belong to the previous run.
  if (current !== cohort) setCohort(current);
  const values: Partial<T> = {};
  const staleKeys: Array<keyof T> = [];
  for (const key of keys) {
    if (hasPayload(inputs[key]) && inputs[key] === current.quarantined[key])
      staleKeys.push(key);
    else values[key] = inputs[key];
  }
  return { values, staleKeys };
}
