/**
 * One-time, dev-only deprecation notices.
 *
 * A `@deprecated` JSDoc tag only reaches someone reading the types in an
 * editor. Plenty of consumers copied a snippet years ago and never look
 * again — so a deprecated export also SAYS so at runtime, once, in dev.
 *
 * Rules this file keeps:
 *   - **Dev only.** Production builds print nothing (`devWarn` is a no-op
 *     there), so a deprecation never costs a shipped app a console line.
 *   - **Once per name, per process.** A deprecated component rendering
 *     inside a 200-row list must not print 200 warnings. The `announced`
 *     set is module-level, so re-rendering is free after the first notice.
 *   - **Names its replacement.** A notice that only says "don't use this"
 *     leaves the reader where they started.
 */
import { devWarn } from "../components/FlowchartView/_internal/devWarn";

const announced = new Set<string>();

/**
 * Warn once that `what` is deprecated, naming what to use instead.
 *
 * @param what        The deprecated export's name (e.g. `"TimeTravelDebugger"`).
 * @param useInstead  A full sentence naming the replacement.
 */
export function warnDeprecated(what: string, useInstead: string): void {
  if (announced.has(what)) return;
  announced.add(what);
  devWarn(
    () =>
      `[footprint-explainable-ui] ${what} is deprecated and will be removed in ` +
      `the next major. ${useInstead}`,
  );
}

/**
 * Forget which notices have been printed. TEST ONLY — the "once per
 * process" rule is exactly what a test of the notice needs to undo
 * between cases. Not exported from any entry point.
 */
export function resetDeprecationNoticesForTests(): void {
  announced.clear();
}
