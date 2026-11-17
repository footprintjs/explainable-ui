import { useCallback, useEffect, useRef, useState } from 'react';
import type { RecordingSource, RecordingSourceSnapshot, SubflowLoadRequest } from '../../progressiveRendering';
export interface PendingSubflow {
  request: SubflowLoadRequest;
  status: 'loading' | 'preparing' | 'error';
  retry: () => void;
  cancel: () => void;
}
/** User intent is independent of cache lifetime; a completed cache never moves a cancelled cursor. */
export function useLazySubflowRequest(source: RecordingSource | undefined, state: RecordingSourceSnapshot | null, resetKey: string) {
  const generation = useRef(0);
  const active = useRef<AbortController | null>(null);
  const [intent, setIntent] = useState<{ source: RecordingSource; generation: number; request: SubflowLoadRequest; resume?: () => void; error?: boolean } | null>(null);
  const cancel = useCallback(() => {
    generation.current++;
    active.current?.abort();
    active.current = null;
    setIntent(null);
  }, []);
  useEffect(() => { cancel(); return () => { generation.current++; active.current?.abort(); }; }, [source, resetKey, cancel]);
  const load = useCallback((request: SubflowLoadRequest, resume?: () => void) => {
    if (!source) return;
    active.current?.abort();
    const current = ++generation.current;
    const controller = new AbortController();
    active.current = controller;
    setIntent({ source, generation: current, request, resume });
    source.load(request, { signal: controller.signal }).catch(() => {
      if (!controller.signal.aborted && current === generation.current) setIntent({ source, generation: current, request, resume, error: true });
    });
  }, [source]);
  const item = intent && source && intent.source === source ? state?.scopes.get(source.getKey(intent.request.invocationPath)) : undefined;
  useEffect(() => {
    if (!intent || intent.source !== source || intent.generation !== generation.current || item?.status !== 'ready') return;
    setIntent(null);
    active.current = null;
    intent.resume?.();
  }, [intent, source, item]);
  const pending: PendingSubflow | null = intent && intent.source === source ? {
    request: intent.request,
    status: intent.error || item?.status === 'error' ? 'error' : item?.status === 'preparing' ? 'preparing' : 'loading',
    retry: () => load(intent.request, intent.resume), cancel,
  } : null;
  return { load, cancel, pending };
}
