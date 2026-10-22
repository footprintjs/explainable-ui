/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import * as React from 'react';
import { ExplainableShell } from '../../src/components/ExplainableShell/ExplainableShell';
import type { StageSnapshot } from '../../src/types';

function childResult(scope: string, seedKey = 'price', suffix = '') {
  const stages = [
    { name: 'Seed' + suffix, writes: [seedKey], reads: [] },
    { name: 'Sum' + suffix, writes: ['subtotal'], reads: [seedKey] },
    { name: 'Total' + suffix, writes: ['total'], reads: ['subtotal', seedKey] },
  ];
  const nodes = stages.map((stage, i) => ({
    id: `${scope}/${stage.name}`, name: `${scope}/${stage.name}`,
    runtimeStageId: `${scope}/${stage.name}#${i}`,
    stageReads: Object.fromEntries(stage.reads.map(key => [key, 1])),
    stageWrites: Object.fromEntries(stage.writes.map(key => [key, i + 1])),
    logs: {}, errors: {}, metrics: {}, evals: {},
    next: undefined as unknown,
  }));
  nodes[0].next = nodes[1] as never;
  nodes[1].next = nodes[2] as never;
  return {
    subflowId: scope, subflowName: scope,
    treeContext: {
      globalContext: {}, stageContexts: nodes[0],
      history: stages.map((stage, i) => ({
        stage: stage.name, stageId: `${scope}/${stage.name}`,
        runtimeStageId: nodes[i].runtimeStageId,
        trace: stage.writes.map(path => ({ path })),
      })),
    },
  };
}
function mount(key: string, result: unknown, invocation = 0): StageSnapshot {
  return { stageName: key, stageLabel: key, runtimeStageId: `${key}#${invocation}`,
    subflowId: key, subflowResult: result, memory: {}, narrative: '', startMs: invocation, durationMs: 1 };
}
function setup(mounts: StageSnapshot[]) {
  const controls: { onNodeClick?: (id: number | string) => void } = {};
  const props = {
    title: 'Run', snapshots: mounts,
    runtimeSnapshot: { sharedState: {}, commitLog: [{ stage: 'Parent', stageId: 'Parent', runtimeStageId: 'Parent#0', trace: [{ path: 'parentOnly' }, { path: 'total' }] }], executionTree: { runtimeStageId: 'Parent#0', stageReads: {} }, subflowResults: {} } as never,
    traceGraph: { nodes: [], edges: [] } as never,
    renderFlowchart: (flowProps: { onNodeClick?: (id: number | string) => void }) => { controls.onNodeClick = flowProps.onNodeClick; return React.createElement('div', { 'data-testid': 'chart' }); },
  };
  const ui = render(React.createElement(ExplainableShell, props));
  fireEvent.click(screen.getByText('Inspector'));
  fireEvent.click(screen.getByText('Data Trace'));
  return Object.assign((key: string) => act(() => controls.onNodeClick?.(key)), {
    replace(nextMounts: StageSnapshot[]) {
      ui.rerender(React.createElement(ExplainableShell, {
        ...props, snapshots: nextMounts,
        runtimeSnapshot: { sharedState: {}, commitLog: [], executionTree: {}, subflowResults: {} } as never,
      }));
    },
  });
}
function keys() { return [...document.querySelectorAll('[data-fp="trace-any-chip"]')].map(el => el.textContent); }
function trace(key = 'total') {
  fireEvent.click([...document.querySelectorAll('[data-fp="trace-any-chip"]')].find(el => el.textContent === key)!);
}
function next(times = 1) { for (let i = 0; i < times; i++) fireEvent.click(screen.getByLabelText('Next stage')); }

describe('ExplainableShell selected subflow tracing', () => {
  it('uses the child log for search, follows child ingredients on its rail and keeps Done in place', () => {
    const drill = setup([mount('quote', childResult('quote'))]);
    drill('quote');
    expect(keys()).toEqual(['price', 'subtotal', 'total']);
    expect(keys()).not.toContain('parentOnly');
    next(2);
    trace();
    expect(within(screen.getByRole('toolbar')).getByText(/stop 1 of 3/)).toBeTruthy();
    const card = document.querySelector('[data-fp="trace-walk-card"]') as HTMLElement;
    fireEvent.click(within(card).getAllByTitle(/Follow /).find(el => el.textContent?.includes('subtotal'))!);
    expect(screen.getByText(/Step 2 ·/)).toBeTruthy();
    fireEvent.click(screen.getByText('show all ingredients'));
    fireEvent.click(screen.getByLabelText('Earlier cause'));
    fireEvent.click(within(screen.getByRole('toolbar')).getByLabelText('Exit tracing'));
    expect(screen.getByRole('toolbar').getAttribute('data-tracing')).toBeNull();
    next();
    expect(screen.getAllByText(/Total/).length).toBeGreaterThan(0);
  });

  it('isolates repeated mount invocations with identical local step and variable names', () => {
    const first = childResult('quote', 'firstOnly');
    const second = childResult('quote', 'secondOnly');
    const drill = setup([mount('quote', first, 1), mount('quote', second, 9)]);
    next();
    drill('quote');
    expect(keys()).toEqual(['secondOnly', 'subtotal', 'total']);
    expect(keys()).not.toContain('firstOnly');
  });

  it('shows unavailable child evidence rather than borrowing the parent log', () => {
    const partial = childResult('quote');
    delete (partial.treeContext as { history?: unknown }).history;
    const drill = setup([mount('quote', partial)]);
    drill('quote');
    expect(keys()).toEqual([]);
    expect(screen.getByText(/child trace evidence is unavailable/i)).toBeTruthy();
    expect(document.body.textContent).not.toContain('arrived with the run');
  });

  it('refuses partial child read tracking instead of calling an unrecorded stage an origin', () => {
    const partial = childResult('quote');
    delete (partial.treeContext.stageContexts as { stageReads?: unknown }).stageReads;
    const drill = setup([mount('quote', partial)]);
    drill('quote');
    expect(keys()).toEqual([]);
    expect(screen.getByText(/child trace evidence is unavailable/i)).toBeTruthy();
  });

  it('does not reuse an open child record after its source run is replaced', () => {
    const drill = setup([mount('quote', childResult('quote', 'oldPrivateKey'))]);
    drill('quote');
    expect(keys()).toContain('oldPrivateKey');
    next(2);
    trace();
    drill.replace([mount('quote', childResult('quote', 'newKey'))]);
    expect(screen.getByRole('toolbar').getAttribute('data-tracing')).toBeNull();
    expect(keys()).toEqual([]);
    expect(screen.getByText(/child trace evidence is unavailable/i)).toBeTruthy();
    expect(document.querySelector('[data-fp="trace-walk-card"]')).toBeNull();
    expect(document.querySelector('[data-fp="trace-unavailable"]')?.textContent).not.toContain('oldPrivateKey');
  });

  it('resets child tracing and search when navigating back with a breadcrumb', () => {
    const drill = setup([mount('quote', childResult('quote'))]);
    drill('quote');
    next(2);
    trace();
    // The shell breadcrumb returns the selected invocation to its parent rail.
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(screen.getByRole('toolbar').getAttribute('data-tracing')).toBeNull();
    expect(keys()).toEqual(['parentOnly', 'total']);
    drill('quote');
    const search = document.querySelector('[data-fp="trace-search"]') as HTMLInputElement;
    expect(search.value).toBe('');
  });
});
