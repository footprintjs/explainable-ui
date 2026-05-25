/**
 * `createNotifier` — shared pub-sub + monotonic version + microtask
 * batching, extracted from `traceStructureRecorder` and
 * `createTraceRuntimeOverlay` (which duplicated this pattern).
 *
 * Every translator needs the same shape to integrate with React's
 * `useSyncExternalStore`:
 *   - `subscribe(listener)` returns unsubscribe
 *   - `version()` returns monotonic int (snapshot identity)
 *   - `notify()` bumps version + fires listeners (error-isolated)
 *
 * Microtask batching
 * ──────────────────
 *   A single stage execution fires multiple recorder events (Structure
 *   `onStageAdded` + `onEdgeAdded` for each edge; Flow `onStageExecuted`;
 *   Scope `onCommit`). With 3+ translators subscribed, that's 6+ React
 *   re-renders per stage. The batcher coalesces all `notify()` calls
 *   within one microtask into a SINGLE listener fire — version still
 *   bumps per event (so consumers that poll `version()` from outside
 *   React see every change), but listener invocations are deduplicated.
 *
 *   Trade-off: listeners observe the FINAL state after a microtask
 *   batch, not every intermediate state. Acceptable for UI consumers
 *   (React renders the final state anyway). Non-React consumers that
 *   need every event should call `getSnapshot()` from inside event
 *   handlers, not rely on the listener for granularity.
 *
 * Error isolation
 * ───────────────
 *   A throwing listener is caught + warned in dev. Other listeners
 *   still fire. Mirrors footprintjs's recorder dispatcher pattern.
 */

import { devWarn } from "./devWarn";

export interface Notifier {
  /** Subscribe a listener; returns unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** Monotonic version counter — bumps once per `notify()` call. */
  version(): number;
  /** Bump version + schedule a listener flush (coalesced via microtask). */
  notify(): void;
  /** Force-flush any pending coalesced notification immediately. Used
   *  by tests that need synchronous observation. */
  flushPending(): void;
  /** Reset the notifier — clears listeners is NOT done (consumers
   *  manage their own subscriptions). Only the pending-flush flag
   *  and version stay as-is (no consumer should observe a version
   *  rollback). */
  // (intentionally no reset for version — monotonicity is load-bearing
  //  for useSyncExternalStore snapshot equality)
}

export function createNotifier(label = "notifier"): Notifier {
  const listeners = new Set<() => void>();
  let v = 0;
  let pending = false;

  function flush(): void {
    if (!pending) return;
    pending = false;
    // Snapshot listeners into an array BEFORE iteration. A listener
    // that synchronously subscribes/unsubscribes another listener
    // would otherwise leave Set-iteration semantics implementation-
    // defined. Array snapshot guarantees: every listener registered
    // AT THIS FLUSH-START fires exactly once; listeners added during
    // a callback wait for the next notify cycle.
    const snapshot = Array.from(listeners);
    for (const l of snapshot) {
      try {
        l();
      } catch (err) {
        devWarn(
          () =>
            `[${label}] subscribe() listener threw — isolated; other subscribers continue.`,
          err,
        );
      }
    }
  }

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    version(): number {
      return v;
    },
    notify(): void {
      v += 1;
      if (pending) return;
      pending = true;
      // Coalesce within a single microtask. `queueMicrotask` is
      // available in every supported runtime (Node 11+, all browsers).
      queueMicrotask(flush);
    },
    flushPending(): void {
      flush();
    },
  };
}
