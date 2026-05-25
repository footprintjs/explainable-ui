/**
 * Branded types for translator key discipline.
 *
 * The footprintjs/trace contract uses two distinct identity strings:
 *
 *   - **StageId**: the stable identifier the user picks at build time
 *     (e.g. `'load-order'`, `'check-inventory'`). Identity per chart spec.
 *
 *   - **RuntimeStageId**: `[subflowPath/]stageId#executionIndex` — the
 *     per-execution identity. A loop visiting the same stage 3 times
 *     produces 3 distinct RuntimeStageIds with the same StageId base.
 *
 * Translator outputs index per-stage data by StageId (`Map<StageId, ...>`)
 * AND per-execution data by RuntimeStageId (`Map<RuntimeStageId, ...>`).
 * Both are `string` at runtime — TypeScript can't distinguish them
 * without help. Branded types make `byStageId.get(runtimeStageId)` a
 * **compile-time error** instead of a silent `undefined` at runtime.
 *
 * Why branded types over wrapper classes
 * ──────────────────────────────────────
 *   - Zero runtime cost (the brand exists only at the type level)
 *   - JSON-serializable as-is (no `toJSON` glue needed)
 *   - Interop with consumer code that uses raw `string` is one cast
 *     (`stageId as StageId`) when the consumer is sure of the source.
 *
 * Usage pattern
 * ─────────────
 * ```ts
 * import type { StageId, RuntimeStageId } from './_internal/keys';
 *
 * // In a translator, when accepting input from a footprintjs event:
 * const sid = event.stageId as StageId;
 * const rsid = event.traversalContext.runtimeStageId as RuntimeStageId;
 *
 * // In a consumer reading from the index:
 * const node = index.byStageId.get(stageId);          // typechecks
 * const node = index.byStageId.get(runtimeStageId);   // TS ERROR ✓
 * ```
 *
 * Helper to derive a StageId from a RuntimeStageId — strips `#N` suffix
 * and optional subflow path. **Use only for DISPLAY**, NEVER for matching
 * commitLog stageIds (see invariant I3 in `traceStructureRecorder.ts`).
 */

// String-literal brands (NOT `unique symbol`) — survive `.d.ts` emit
// across module boundaries. Unique-symbol brands get serialized as
// new local symbols when consumers compile their own .d.ts, causing
// "missing property [unique symbol]" errors. String literals stay
// nominal because the literal value is identical across builds.

/** Stable per-spec identifier (e.g. `'load-order'`). */
export type StageId = string & { readonly __brand: "StageId" };

/** Per-execution identifier (e.g. `'load-order#0'` or `'sf-foo/inner#3'`). */
export type RuntimeStageId = string & { readonly __brand: "RuntimeStageId" };

/**
 * Tag a raw string as a `StageId`. Use at translator boundaries when
 * ingesting from a footprintjs event payload (the source guarantees
 * the string IS a stage id). Zero runtime cost.
 */
export function asStageId(s: string): StageId {
  return s as StageId;
}

/**
 * Tag a raw string as a `RuntimeStageId`. Use at translator boundaries
 * when ingesting from a `traversalContext.runtimeStageId`. Zero
 * runtime cost.
 */
export function asRuntimeStageId(s: string): RuntimeStageId {
  return s as RuntimeStageId;
}
