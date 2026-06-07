/** @vitest-environment jsdom */
/**
 * useChartAutoRefit — re-fit triggers.
 *
 * The hook keeps an xyflow chart fitted to its container. Two triggers:
 *   1. container resize (ResizeObserver / window resize) — pre-existing.
 *   2. `refitKey` change (drill in/out swaps the visible subgraph) — added so a
 *      drilled subflow recenters/rezooms instead of keeping the parent's
 *      pan/zoom (which left it cramped in a corner).
 *
 * rAF is stubbed to run synchronously so the (double-rAF) refit fires within the
 * test tick; ResizeObserver is stubbed (jsdom has none by default).
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactFlowInstance } from '@xyflow/react';
import { useChartAutoRefit } from '../../src/components/FlowchartView/_internal/useChartAutoRefit';

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

function makeInstance(): ReactFlowInstance & { fitView: ReturnType<typeof vi.fn> } {
  return { fitView: vi.fn() } as unknown as ReactFlowInstance & { fitView: ReturnType<typeof vi.fn> };
}

describe('useChartAutoRefit — refitKey', () => {
  it('re-fits when refitKey changes (drill in/out)', () => {
    const wrapperRef = { current: document.createElement('div') };
    const inst = makeInstance();
    const { rerender } = renderHook(
      ({ key }: { key: string }) => useChartAutoRefit(wrapperRef, inst, { refitKey: key }),
      { initialProps: { key: 'top-level' } },
    );
    inst.fitView.mockClear();
    rerender({ key: 'sf-injection-engine' }); // drilled in
    expect(inst.fitView).toHaveBeenCalled();
  });

  it('does NOT re-fit when refitKey is unchanged across re-renders', () => {
    const wrapperRef = { current: document.createElement('div') };
    const inst = makeInstance();
    const { rerender } = renderHook(
      ({ key }: { key: string }) => useChartAutoRefit(wrapperRef, inst, { refitKey: key }),
      { initialProps: { key: 'stable' } },
    );
    inst.fitView.mockClear();
    rerender({ key: 'stable' });
    expect(inst.fitView).not.toHaveBeenCalled();
  });

  it('is a no-op (no throw) when the instance is null', () => {
    const wrapperRef = { current: document.createElement('div') };
    expect(() =>
      renderHook(() => useChartAutoRefit(wrapperRef, null, { refitKey: 'x' })),
    ).not.toThrow();
  });
});
