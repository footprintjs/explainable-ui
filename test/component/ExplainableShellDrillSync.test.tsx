/** @vitest-environment jsdom */
/**
 * ExplainableShell — ONE drill state across every entry path.
 *
 * Regression target (the reported bug): clicking a subflow in the Topology
 * tree rescoped the breadcrumb / story / timeline but left the CHART showing
 * the level above, because the chart kept a SECOND, private drill state that
 * nothing synced. Nested mounts made it worse: the drill was keyed by the
 * mount's LOCAL `subflowId`, which repeats when one child chart is mounted
 * twice, so a nested drill landed on the twin's stages — or on nothing.
 *
 * The shell now owns one drill key (the mount NODE id) and hands it to the
 * chart as `currentSubflowId`. These tests assert exactly that hand-off, for
 * each entry path, with a `renderFlowchart` spy — no xyflow involved.
 *
 * Fixture shape mirrors a real run: `pipeline` mounts `prepare`, and
 * footprintjs dual-keys `subflowResults` by both subflow PATH and
 * `runtimeStageId`.
 */
import { describe, expect, it } from 'vitest';
import { act, render, fireEvent } from '@testing-library/react';
import * as React from 'react';

import { ExplainableShell } from '../../src/components/ExplainableShell/ExplainableShell';
import type { TraceGraph } from '../../src/components/FlowchartView/traceStructureRecorder';

// ── Fixtures ──────────────────────────────────────────────────────────────
function runtimeNode(id: string, overrides: Record<string, unknown> = {}) {
  return { id, name: id, logs: {}, errors: {}, metrics: {}, evals: {}, ...overrides };
}

function treeContext(stageContexts: unknown) {
  return { globalContext: {}, history: [], stageContexts };
}

/**
 * root: seed → pipeline(sf) → report
 * pipeline: fetch → prepare(sf) → finish
 * prepare: clean → scale
 */
function makeRuntimeSnapshot() {
  return {
    sharedState: {},
    commitLog: [],
    executionTree: runtimeNode('seed', {
      runtimeStageId: 'seed#0',
      next: runtimeNode('pipeline', {
        runtimeStageId: 'pipeline#1',
        subflowId: 'pipeline',
        next: runtimeNode('report', { runtimeStageId: 'report#9' }),
      }),
    }),
    subflowResults: {
      pipeline: {
        subflowId: 'pipeline',
        subflowName: 'Pipeline',
        treeContext: treeContext(
          runtimeNode('pipeline/fetch', {
            runtimeStageId: 'pipeline/fetch#2',
            next: runtimeNode('pipeline/prepare', {
              runtimeStageId: 'pipeline/prepare#3',
              subflowId: 'pipeline/prepare',
              next: runtimeNode('pipeline/finish', { runtimeStageId: 'pipeline/finish#8' }),
            }),
          }),
        ),
      },
      'pipeline/prepare': {
        subflowId: 'pipeline/prepare',
        subflowName: 'Prepare',
        treeContext: treeContext(
          runtimeNode('pipeline/prepare/clean', {
            runtimeStageId: 'pipeline/prepare/clean#4',
            next: runtimeNode('pipeline/prepare/scale', {
              runtimeStageId: 'pipeline/prepare/scale#5',
            }),
          }),
        ),
      },
    },
  };
}

function graphNode(id: string, data: Record<string, unknown>) {
  return { id, type: 'stage', position: { x: 0, y: 0 }, data: { label: id, ...data } };
}

const GRAPH: TraceGraph = {
  nodes: [
    graphNode('seed', {}),
    graphNode('pipeline', { label: 'Pipeline', isSubflow: true, subflowId: 'pipeline' }),
    graphNode('pipeline/fetch', { subflowOf: 'pipeline' }),
    graphNode('pipeline/prepare', {
      label: 'Prepare',
      isSubflow: true,
      subflowId: 'prepare',
      subflowOf: 'pipeline',
    }),
    graphNode('pipeline/prepare/clean', { subflowOf: 'pipeline/prepare' }),
    graphNode('pipeline/prepare/scale', { subflowOf: 'pipeline/prepare' }),
    graphNode('pipeline/finish', { subflowOf: 'pipeline' }),
    graphNode('report', {}),
  ],
  edges: [{ id: 'e1', source: 'seed', target: 'pipeline', data: { kind: 'next' } }],
} as unknown as TraceGraph;

/** A flowchart spy that records the drill props the shell hands down. */
function makeFlowchartSpy() {
  const ref: {
    currentSubflowId?: string | null;
    onSubflowChange?: (id: string | null) => void;
    onNodeClick?: (id: number | string) => void;
  } = {};
  const renderFlowchart = (props: {
    currentSubflowId?: string | null;
    onSubflowChange?: (id: string | null) => void;
    onNodeClick?: (id: number | string) => void;
  }) => {
    ref.currentSubflowId = props.currentSubflowId;
    ref.onSubflowChange = props.onSubflowChange;
    ref.onNodeClick = props.onNodeClick;
    return React.createElement('div', { 'data-testid': 'fc-marker' });
  };
  return { ref, renderFlowchart };
}

function renderShell() {
  const spy = makeFlowchartSpy();
  const utils = render(
    React.createElement(ExplainableShell, {
      traceGraph: GRAPH,
      runtimeSnapshot: makeRuntimeSnapshot() as never,
      renderFlowchart: spy.renderFlowchart,
      defaultExpanded: { topology: true },
    }),
  );
  return { spy, ...utils };
}

/** The Topology tree rows, in render order. */
function treeRows(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[data-fp="subflow-tree-node"]'));
}

// ── Tests ─────────────────────────────────────────────────────────────────
describe('ExplainableShell — Topology tree drills the CHART too (REGRESSION)', () => {
  it('a tree click hands the chart the drilled scope', () => {
    const { spy, container } = renderShell();
    expect(spy.ref.currentSubflowId).toBeNull(); // root

    const pipelineRow = treeRows(container).find((r) => r.textContent?.includes('Pipeline'))!;
    act(() => { fireEvent.click(pipelineRow); });

    expect(spy.ref.currentSubflowId).toBe('pipeline');
  });

  it('a tree click on a NESTED mount drills through its ancestors', () => {
    const { spy, container } = renderShell();
    const prepareRow = treeRows(container).find((r) => r.textContent?.includes('Prepare'))!;
    act(() => { fireEvent.click(prepareRow); });

    // The chart is scoped to the nested mount — NOT to the bare 'prepare' id,
    // which is what the old drill would have sent.
    expect(spy.ref.currentSubflowId).toBe('pipeline/prepare');
    // ...and the breadcrumb names both levels, so the user can step back out.
    expect(container.textContent).toContain('pipeline');
    expect(container.textContent).toContain('prepare');
  });
});

describe('ExplainableShell — chart and shell stay in step (INTEGRATION)', () => {
  it('a chart drill moves the shell, and the shell echoes it back to the chart', () => {
    const { spy, container } = renderShell();
    act(() => { spy.ref.onSubflowChange?.('pipeline'); });
    expect(spy.ref.currentSubflowId).toBe('pipeline');
    expect(container.textContent).toContain('pipeline');

    act(() => { spy.ref.onSubflowChange?.('pipeline/prepare'); });
    expect(spy.ref.currentSubflowId).toBe('pipeline/prepare');
  });

  it('popping to a level already on the stack navigates instead of re-drilling', () => {
    const { spy } = renderShell();
    act(() => { spy.ref.onSubflowChange?.('pipeline/prepare'); });
    expect(spy.ref.currentSubflowId).toBe('pipeline/prepare');

    act(() => { spy.ref.onSubflowChange?.('pipeline'); });
    expect(spy.ref.currentSubflowId).toBe('pipeline');
  });

  it('null pops all the way back to the top level', () => {
    const { spy } = renderShell();
    act(() => { spy.ref.onSubflowChange?.('pipeline/prepare'); });
    act(() => { spy.ref.onSubflowChange?.(null); });
    expect(spy.ref.currentSubflowId).toBeNull();
  });

  it('the node-click channel drills the same way (mount ids arrive there too)', () => {
    const { spy } = renderShell();
    act(() => { spy.ref.onNodeClick?.('pipeline'); });
    expect(spy.ref.currentSubflowId).toBe('pipeline');
  });
});

describe('ExplainableShell — a nested level resolves its own data (FUNCTIONAL)', () => {
  it('drilling twice rescopes the timeline to the INNER subflow stages', () => {
    const { spy, container } = renderShell();
    act(() => { spy.ref.onSubflowChange?.('pipeline'); });
    act(() => { spy.ref.onSubflowChange?.('pipeline/prepare'); });
    // `prepare` has exactly two stages — the level resolved, so the panels
    // rescoped with the chart rather than silently staying on `pipeline`.
    expect(container.textContent).toContain('2 stages');
  });
});
