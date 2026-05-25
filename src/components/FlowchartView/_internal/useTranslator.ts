/**
 * `useTranslator(handle, getSnapshot)` — React adapter for any translator
 * exposing the standard `subscribe()` + `version()` shape.
 *
 * Wraps `useSyncExternalStore` so consumers don't repeat the boilerplate
 * for every translator. The `version` is the snapshot identity — when it
 * changes, React re-renders; `getSnapshot` then returns the consumer-
 * chosen view (full graph, slice, etc.).
 *
 * @example
 * ```tsx
 * const trace = useMemo(() => createTraceStructureRecorder(), []);
 * const graph = useTranslator(trace, () => trace.getGraph());
 * return <TraceFlow graph={graph} />;
 * ```
 *
 * **Why a hook (vs each component wiring `useSyncExternalStore` itself)**:
 * three reasons. (1) Reduces 4 lines of `useSyncExternalStore + useMemo`
 * boilerplate to one line. (2) Standardises the snapshot-identity
 * convention (version int) — consumers can't accidentally pass a getter
 * whose return identity changes every call (which would re-render
 * forever). (3) Stable subscribe/getVersion refs via memoization on the
 * handle identity — no re-subscribe on parent re-renders.
 */

import { useMemo, useSyncExternalStore } from "react";

export interface TranslatorHandleLike {
  subscribe(listener: () => void): () => void;
  version(): number;
}

/**
 * Subscribe to a translator + return a typed snapshot computed by the
 * caller. The snapshot recomputes whenever `version()` changes.
 *
 * `getSnapshot` is called inside a `useMemo` keyed on the version
 * integer — so consumers can return fresh objects from `getSnapshot`
 * (e.g., `handle.getGraph()` returns a defensive copy) without
 * triggering infinite re-renders.
 */
export function useTranslator<T>(
  handle: TranslatorHandleLike,
  getSnapshot: () => T,
): T {
  const subscribe = useMemo(() => handle.subscribe.bind(handle), [handle]);
  const getVersion = useMemo(() => handle.version.bind(handle), [handle]);
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getSnapshot(), [version, getSnapshot]);
}
