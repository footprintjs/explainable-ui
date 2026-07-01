/** @vitest-environment jsdom */
/**
 * ExplainableShell — drill-down chart rendering (5-pattern tests).
 *
 * Regression target: drilling a subflow via the RECORDER/runtime path
 * (`resolveSubflowFromRuntime`) must keep the flowchart visible. The chart was
 * once gated on `activeSpec` alone — so a subflow drill (which has no spec)
 * blanked the chart while the slider/story/breadcrumb still rescoped. The chart
 * now renders from `traceGraph`, and `spec` has been removed entirely
 * (v0.26 — the FlowChart-into-SpecNode footgun is gone), so these tests pass
 * NO spec at all: the recorder path is the only path.
 *
 * The flowchart is replaced by a lightweight `renderFlowchart` spy so these
 * tests never pull in xyflow — they assert the GATE, not the chart internals.
 */
import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import * as React from 'react';

import { ExplainableShell } from '../../src/components/ExplainableShell/ExplainableShell';
import type { TraceGraph } from '../../src/components/FlowchartView/traceStructureRecorder';

// ── Fixtures ──────────────────────────────────────────────────────────────
function runtimeNode(name: string, overrides: Record<string, unknown> = {}) {
  return { id: name, name, logs: {}, errors: {}, metrics: {}, evals: {}, ...overrides };
}

/** Runtime snapshot whose `sf-x` stage carries a resolvable `subflowResult`. */
function makeRuntimeSnapshot(subflowId: string) {
  return {
    sharedState: {},
    commitLog: [],
    executionTree: runtimeNode('root', {
      runtimeStageId: 'root#0',
      next: runtimeNode(subflowId, { runtimeStageId: `${subflowId}#1`, subflowId }),
    }),
    subflowResults: {
      [subflowId]: {
        subflowId,
        subflowName: subflowId,
        treeContext: {
          globalContext: {},
          history: [],
          stageContexts: runtimeNode(`${subflowId}/inner`, { runtimeStageId: `${subflowId}/inner#2` }),
        },
      },
    },
  };
}

function makeTraceGraph(subflowId: string): TraceGraph {
  return {
    nodes: [
      { id: 'root', type: 'stage', position: { x: 0, y: 0 }, data: { label: 'root' } },
      { id: subflowId, type: 'stage', position: { x: 0, y: 0 }, data: { label: subflowId, isSubflow: true, subflowId } },
      { id: `${subflowId}/inner`, type: 'stage', position: { x: 0, y: 0 }, data: { label: 'inner', subflowOf: subflowId } },
    ],
    edges: [{ id: 'e1', source: 'root', target: subflowId, data: { kind: 'next' } }],
  } as unknown as TraceGraph;
}

/** A flowchart spy: records each render + exposes the latest onNodeClick. */
function makeFlowchartSpy() {
  let calls = 0;
  const ref: { onNodeClick?: (id: number | string) => void } = {};
  const renderFlowchart = (props: { onNodeClick?: (id: number | string) => void }) => {
    calls++;
    ref.onNodeClick = props.onNodeClick;
    return React.createElement('div', { 'data-testid': 'fc-marker' });
  };
  return { get calls() { return calls; }, ref, renderFlowchart };
}

function renderShell(spy: ReturnType<typeof makeFlowchartSpy>, opts: { subflowId?: string } = {}) {
  const subflowId = opts.subflowId ?? 'sf-x';
  return render(
    React.createElement(ExplainableShell, {
      traceGraph: makeTraceGraph(subflowId),
      runtimeSnapshot: makeRuntimeSnapshot(subflowId) as never,
      renderFlowchart: spy.renderFlowchart,
    }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────
describe('ExplainableShell — drill chart rendering (REGRESSION)', () => {
  it('keeps the flowchart visible after drilling a subflow (recorder path, no spec)', () => {
    const spy = makeFlowchartSpy();
    renderShell(spy);
    expect(screen.getByTestId('fc-marker')).toBeTruthy(); // root: chart visible
    act(() => spy.ref.onNodeClick?.('sf-x'));
    expect(screen.getByTestId('fc-marker')).toBeTruthy(); // drilled: STILL visible (the fix)
  });
});

describe('ExplainableShell — chart gate (UNIT)', () => {
  it('renders the flowchart from traceGraph with no spec prop at all', () => {
    const spy = makeFlowchartSpy();
    renderShell(spy);
    expect(screen.getByTestId('fc-marker')).toBeTruthy();
  });
});

describe('ExplainableShell — drill rescopes together (INTEGRATION)', () => {
  it('after drilling, the chart AND the subflow breadcrumb are both present', () => {
    const spy = makeFlowchartSpy();
    const { container } = renderShell(spy);
    act(() => spy.ref.onNodeClick?.('sf-x'));
    expect(screen.getByTestId('fc-marker')).toBeTruthy();
    expect(container.textContent).toContain('sf-x'); // breadcrumb proves we drilled
  });
});

describe('ExplainableShell — drill chart rendering (PROPERTY)', () => {
  it.each(['sf-cache', 'sf-injection-engine', 'sf-tools'])(
    'renders the drilled chart for any runtime-path subflow: %s',
    (subflowId) => {
      const spy = makeFlowchartSpy();
      renderShell(spy, { subflowId });
      act(() => spy.ref.onNodeClick?.(subflowId));
      expect(screen.getByTestId('fc-marker')).toBeTruthy();
    },
  );
});

describe('ExplainableShell — root→drill (FUNCTIONAL)', () => {
  it('the renderer is invoked at root and re-invoked while drilled', () => {
    const spy = makeFlowchartSpy();
    renderShell(spy);
    const callsAtRoot = spy.calls;
    expect(callsAtRoot).toBeGreaterThan(0);
    act(() => spy.ref.onNodeClick?.('sf-x'));
    expect(spy.calls).toBeGreaterThan(callsAtRoot); // re-rendered while drilled
    expect(screen.getByTestId('fc-marker')).toBeTruthy();
  });
});
