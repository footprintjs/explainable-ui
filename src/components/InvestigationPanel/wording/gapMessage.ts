import { gapMessages } from "./banks";

// Enumerate only our frozen fixed bank at initialization, never a caller's data.
const longestGapCode = Math.max(...Object.keys(gapMessages).map(code => code.length));

/** Exact canonical sentence only; unknown/runtime nonstring inputs have no sentence. */
export function investigationGapMessage(code: string): string | undefined {
  if (typeof code !== "string" || code.length > longestGapCode) return undefined;
  return Object.prototype.hasOwnProperty.call(gapMessages, code)
    ? gapMessages[code as keyof typeof gapMessages]
    : undefined;
}
