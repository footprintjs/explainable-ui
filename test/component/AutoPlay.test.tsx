/** @vitest-environment jsdom */
/**
 * autoPlay: a saved run plays by itself, once, on the ONE cursor.
 *
 * What is being pinned:
 * 1. One shot per recording. A re-render never restarts it, a new recording
 *    plays again, and "the same recording" means the same RUN at the shell, so
 *    a subflow drill swapping the rail's array is not a new recording.
 * 2. A person's input wins, for good: Pause, scrubbing, arrows, space, a move
 *    from another surface, a drill or a trace. Arrow keys matter most, because
 *    manual Play ignores them.
 * 3. It stays out of the way: reduced motion, `autoPlayable={false}`, tracing
 *    and short runs leave the cursor exactly where it was.
 * 4. Without the prop nothing changes, including manual Play's own rules.
 *
 * jsdom draws no animation: these tests pin the cursor and the timers only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';

import { ExplainableShell } from '../../src/components/ExplainableShell/ExplainableShell';
import { TimeTravelControls } from '../../src/components/TimeTravelControls/TimeTravelControls';
import type { TracingRail } from '../../src/components/TimeTravelControls/TimeTravelControls';
import { TraceViewer } from '../../src/components/TraceViewer/TraceViewer';
import type { StageSnapshot } from '../../src/types';

// ── Fixtures ──────────────────────────────────────────────────────────────
const snap = (label: string): StageSnapshot => ({
  stageName: label.toLowerCase(),
  stageLabel: label,
  runtimeStageId: `${label.toLowerCase()}#0`,
  memory: {},
  narrative: '',
  startMs: 0,
  durationMs: 1,
});
const FIVE = ['A', 'B', 'C', 'D', 'E'].map(snap);
const LAST = FIVE.length - 1;

const TRACING: TracingRail = {
  tracedKey: 'total',
  stopIndices: [0, 2],
  stopOrdinal: 1,
  totalStops: 2,
  onExit: () => {},
};

type RailProps = Partial<React.ComponentProps<typeof TimeTravelControls>>;

/** A parent that owns the one cursor, and logs every move the rail asks for. */
function railHarness(initial = 0) {
  const asked: number[] = [];
  let moveCursor: (index: number) => void = () => {};
  function Rail(props: RailProps) {
    const [index, setIndex] = React.useState(initial);
    moveCursor = setIndex;
    return (
      <TimeTravelControls
        snapshots={FIVE}
        selectedIndex={index}
        onIndexChange={(i) => {
          asked.push(i);
          setIndex(i);
        }}
        {...props}
      />
    );
  }
  return { Rail, asked, moveCursorFromElsewhere: (i: number) => act(() => moveCursor(i)) };
}

function cursor(): number {
  return [...document.querySelectorAll('[data-fp="tt-tick"]')].findIndex(
    (tick) => tick.getAttribute('data-active') === 'true',
  );
}

/** One act per step: the next timer is armed only when the last step commits. */
function advance(steps = 1) {
  for (let i = 0; i < steps; i++) {
    act(() => {
      vi.advanceTimersByTime(2000);
    });
  }
}
const playOut = () => advance(FIVE.length + 2);

function reducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({ matches: reduce && query.includes('prefers-reduced-motion: reduce'), media: query }),
  });
}

/** A runtime snapshot with `names` as its stages, in order. */
function runSnapshot(names: string[], extra: Record<string, unknown> = {}) {
  const tree = names.reduceRight<Record<string, unknown> | undefined>(
    (next, name, i) => ({
      id: name,
      name,
      runtimeStageId: `${name}#${i}`,
      logs: {},
      errors: {},
      metrics: {},
      evals: {},
      ...(next ? { next } : {}),
    }),
    undefined,
  );
  return { sharedState: {}, commitLog: [], executionTree: tree, ...extra };
}

/** A run with a drillable mount `sf-x` as its second stage. */
function runWithSubflow(extra: Record<string, unknown> = {}) {
  const inner = {
    id: 'sf-x/inner',
    name: 'inner',
    runtimeStageId: 'sf-x/inner#9',
    logs: {},
    errors: {},
    metrics: {},
    evals: {},
  };
  const result = {
    subflowId: 'sf-x',
    subflowName: 'sf-x',
    treeContext: { globalContext: {}, history: [], stageContexts: inner },
  };
  const node = (id: string, i: number, more: Record<string, unknown> = {}) => ({
    id,
    name: id,
    runtimeStageId: `${id}#${i}`,
    logs: {},
    errors: {},
    metrics: {},
    evals: {},
    ...more,
  });
  return {
    sharedState: {},
    commitLog: [],
    executionTree: node('root', 0, {
      next: node('sf-x', 1, { subflowId: 'sf-x', next: node('c', 2, { next: node('d', 3) }) }),
    }),
    subflowResults: { 'sf-x': result, 'sf-x#1': result },
    ...extra,
  };
}

const chartSpy = () => {
  const ref: { onNodeClick?: (id: number | string) => void } = {};
  const renderFlowchart = (props: { onNodeClick?: (id: number | string) => void }) => {
    ref.onNodeClick = props.onNodeClick;
    return null;
  };
  return { ref, renderFlowchart };
};

const GRAPH = {
  nodes: [
    { id: 'root', type: 'stage', position: { x: 0, y: 0 }, data: { label: 'root' } },
    { id: 'sf-x', type: 'stage', position: { x: 0, y: 0 }, data: { label: 'sf-x', isSubflow: true, subflowId: 'sf-x' } },
    { id: 'sf-x/inner', type: 'stage', position: { x: 0, y: 0 }, data: { label: 'inner', subflowOf: 'sf-x' } },
  ],
  edges: [{ id: 'e1', source: 'root', target: 'sf-x', data: { kind: 'next' } }],
} as never;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

// ── The rail ──────────────────────────────────────────────────────────────
describe('TimeTravelControls autoPlay: plays once', () => {
  it('plays from the first stage to the last, one step at a time, then stops', () => {
    const { Rail, asked } = railHarness();
    render(<Rail autoPlay />);
    expect(screen.getByLabelText('Pause')).toBeTruthy();
    playOut();
    expect(asked).toEqual([1, 2, 3, 4]);
    expect(cursor()).toBe(LAST);
    expect(screen.getByLabelText('Play')).toBeTruthy();
  });

  it('brings a cursor that starts elsewhere back to the first stage', () => {
    const { Rail, asked } = railHarness(LAST);
    render(<Rail autoPlay />);
    expect(asked[0]).toBe(0);
    playOut();
    expect(asked).toEqual([0, 1, 2, 3, 4]);
  });

  it('keeps the play loop timing: a stage waits its share of the run', () => {
    const { Rail } = railHarness();
    render(<Rail autoPlay />);
    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(cursor()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(cursor()).toBe(1);
  });

  it('does not restart on a parent re-render, mid-run or at the end', () => {
    const { Rail, asked } = railHarness();
    const { rerender } = render(<Rail autoPlay />);
    advance(2);
    rerender(<Rail autoPlay />);
    expect(cursor()).toBe(2);
    playOut();
    rerender(<Rail autoPlay />);
    playOut();
    expect(asked).toEqual([1, 2, 3, 4]);
    expect(cursor()).toBe(LAST);
  });

  it('plays a new recording again, from the first stage', () => {
    const { Rail, asked } = railHarness();
    const { rerender } = render(<Rail autoPlay />);
    playOut();
    asked.length = 0;
    rerender(<Rail autoPlay snapshots={['P', 'Q', 'R'].map(snap)} />);
    expect(cursor()).toBe(0);
    playOut();
    expect(asked).toEqual([0, 1, 2]);
  });

  it('a new recording that may not play ends the run on the last one', () => {
    const { Rail, asked } = railHarness();
    const { rerender } = render(<Rail autoPlay />);
    advance(2);
    reducedMotion(true);
    asked.length = 0;
    rerender(<Rail autoPlay snapshots={['P', 'Q', 'R', 'S', 'T'].map(snap)} />);
    playOut();
    expect(asked).toEqual([]);
    expect(screen.getByLabelText('Play')).toBeTruthy();
  });

  it('autoPlayKey says what is new: a fresh array under one key is the same recording', () => {
    const { Rail, asked } = railHarness();
    const { rerender } = render(<Rail autoPlay autoPlayKey="run-1" />);
    playOut();
    asked.length = 0;
    rerender(<Rail autoPlay autoPlayKey="run-1" snapshots={[...FIVE]} />);
    playOut();
    expect(asked).toEqual([]);
    rerender(<Rail autoPlay autoPlayKey="run-2" snapshots={[...FIVE]} />);
    playOut();
    expect(asked).toEqual([0, 1, 2, 3, 4]);
  });

  it('plays once under StrictMode, whose double effects replay the mount', () => {
    const { Rail, asked } = railHarness();
    render(
      <React.StrictMode>
        <Rail autoPlay />
      </React.StrictMode>,
    );
    playOut();
    expect(asked).toEqual([1, 2, 3, 4]);
    expect(cursor()).toBe(LAST);
  });

  it('turning the prop on later does not take the cursor from the reader', () => {
    const { Rail, asked } = railHarness(2);
    const { rerender } = render(<Rail />);
    rerender(<Rail autoPlay />);
    playOut();
    expect(asked).toEqual([]);
    expect(cursor()).toBe(2);
  });
});

describe('TimeTravelControls autoPlay: a person wins, for good', () => {
  /** Whatever stopped it, it must stay stopped through time and re-renders. */
  function expectStoppedForGood(rerender: () => void, at: number) {
    expect(screen.getByLabelText('Play')).toBeTruthy();
    playOut();
    rerender();
    playOut();
    expect(cursor()).toBe(at);
    expect(screen.getByLabelText('Play')).toBeTruthy();
  }

  it('Pause', () => {
    const { Rail } = railHarness();
    const { rerender } = render(<Rail autoPlay />);
    advance(1);
    fireEvent.click(screen.getByLabelText('Pause'));
    expectStoppedForGood(() => rerender(<Rail autoPlay />), 1);
  });

  it('scrubbing', () => {
    const { Rail } = railHarness();
    const { rerender } = render(<Rail autoPlay />);
    advance(1);
    fireEvent.click(document.querySelectorAll('[data-fp="tt-tick"]')[3]);
    expectStoppedForGood(() => rerender(<Rail autoPlay />), 3);
  });

  it('space', () => {
    const { Rail } = railHarness();
    const { rerender } = render(<Rail autoPlay />);
    advance(1);
    fireEvent.keyDown(screen.getByRole('toolbar'), { key: ' ' });
    expectStoppedForGood(() => rerender(<Rail autoPlay />), 1);
  });

  it.each([
    ['ArrowRight', 2],
    ['ArrowLeft', 0],
  ])('%s stops the run and takes its step', (key, at) => {
    const { Rail } = railHarness();
    const { rerender } = render(<Rail autoPlay />);
    advance(1);
    fireEvent.keyDown(screen.getByRole('toolbar'), { key });
    expectStoppedForGood(() => rerender(<Rail autoPlay />), at);
  });

  it('ArrowLeft stops the run even on the first stage, with nowhere to step', () => {
    const { Rail } = railHarness();
    const { rerender } = render(<Rail autoPlay />);
    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowLeft' });
    expectStoppedForGood(() => rerender(<Rail autoPlay />), 0);
  });

  it('a move from another surface (timeline, chart) takes the one cursor', () => {
    const { Rail, moveCursorFromElsewhere } = railHarness();
    const { rerender } = render(<Rail autoPlay />);
    advance(1);
    moveCursorFromElsewhere(3);
    expectStoppedForGood(() => rerender(<Rail autoPlay />), 3);
  });

  it('a trace that opens mid-run ends it: the walk works, and Done does not resume', () => {
    const { Rail } = railHarness();
    const { rerender } = render(<Rail autoPlay />);
    advance(2);
    rerender(<Rail autoPlay tracing={TRACING} />);
    expect((screen.getByLabelText('Earlier cause') as HTMLButtonElement).disabled).toBe(false);
    rerender(<Rail autoPlay />);
    expectStoppedForGood(() => rerender(<Rail autoPlay />), 2);
  });

  it('after a stop, Play is the ordinary manual Play again', () => {
    const { Rail, asked } = railHarness();
    render(<Rail autoPlay />);
    advance(1);
    fireEvent.click(screen.getByLabelText('Pause'));
    asked.length = 0;
    fireEvent.click(screen.getByLabelText('Play'));
    playOut();
    expect(asked).toEqual([2, 3, 4]);
  });
});

describe('TimeTravelControls autoPlay: stays out of the way', () => {
  function expectUntouched(asked: number[], at: number) {
    playOut();
    expect(asked).toEqual([]);
    expect(cursor()).toBe(at);
    expect(screen.getByRole('toolbar').querySelector('[aria-label="Pause"]')).toBeNull();
  }

  it('reduced motion: never starts, and the cursor stays where it was', () => {
    reducedMotion(true);
    const { Rail, asked } = railHarness(2);
    render(<Rail autoPlay />);
    expectUntouched(asked, 2);
  });

  it('a browser with no matchMedia still plays', () => {
    const { Rail, asked } = railHarness();
    render(<Rail autoPlay />);
    playOut();
    expect(asked).toEqual([1, 2, 3, 4]);
  });

  it('autoPlayable={false}', () => {
    const { Rail, asked } = railHarness(2);
    render(<Rail autoPlay autoPlayable={false} />);
    expectUntouched(asked, 2);
  });

  it('tracing, and it does not start when the trace ends', () => {
    const { Rail, asked } = railHarness(2);
    const { rerender } = render(<Rail autoPlay tracing={TRACING} />);
    expectUntouched(asked, 2);
    rerender(<Rail autoPlay />);
    expectUntouched(asked, 2);
  });

  it('fewer than two stages', () => {
    const { Rail, asked } = railHarness();
    render(<Rail autoPlay snapshots={[snap('Only')]} />);
    expectUntouched(asked, 0);
  });

  it('without the prop it stays still', () => {
    const { Rail, asked } = railHarness(2);
    render(<Rail />);
    expectUntouched(asked, 2);
  });

  it('without the prop manual Play keeps its rules: arrows wait, other moves do not stop it', () => {
    const { Rail, asked, moveCursorFromElsewhere } = railHarness();
    render(<Rail />);
    fireEvent.click(screen.getByLabelText('Play'));
    advance(1);
    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowLeft' });
    expect(cursor()).toBe(1);
    moveCursorFromElsewhere(2);
    expect(screen.getByLabelText('Pause')).toBeTruthy();
    playOut();
    expect(asked).toEqual([1, 3, 4]);
  });
});

// ── The viewer ────────────────────────────────────────────────────────────
describe('TraceViewer autoPlay', () => {
  const recording = (...names: string[]) => ({ snapshot: runSnapshot(names) }) as never;
  const renderFlowchart = () => null;
  const ONE = recording('a', 'b', 'c');

  it('plays a saved run to its last stage, once, and a re-render does not restart it', () => {
    const { rerender } = render(<TraceViewer recording={ONE} autoPlay renderFlowchart={renderFlowchart} />);
    expect(cursor()).toBe(0);
    advance(1);
    expect(cursor()).toBe(1);
    rerender(<TraceViewer recording={ONE} autoPlay renderFlowchart={renderFlowchart} />);
    expect(cursor()).toBe(1);
    playOut();
    expect(cursor()).toBe(2);
    expect(screen.getByLabelText('Play')).toBeTruthy();
    rerender(<TraceViewer recording={ONE} autoPlay renderFlowchart={renderFlowchart} />);
    playOut();
    expect(cursor()).toBe(2);
  });

  it('a new recording plays again from the first stage', () => {
    const { rerender } = render(<TraceViewer recording={ONE} autoPlay renderFlowchart={renderFlowchart} />);
    playOut();
    rerender(<TraceViewer recording={recording('x', 'y', 'z', 'w')} autoPlay renderFlowchart={renderFlowchart} />);
    expect(cursor()).toBe(0);
    playOut();
    expect(cursor()).toBe(3);
  });

  it('the same JSON string across renders is the same recording', () => {
    const raw = JSON.stringify({ snapshot: runSnapshot(['a', 'b', 'c']) });
    const { rerender } = render(<TraceViewer recording={raw} autoPlay renderFlowchart={renderFlowchart} />);
    playOut();
    rerender(<TraceViewer recording={raw} autoPlay renderFlowchart={renderFlowchart} />);
    expect(cursor()).toBe(2);
    expect(screen.getByLabelText('Play')).toBeTruthy();
  });

  it('Pause stops it for good', () => {
    const { rerender } = render(<TraceViewer recording={ONE} autoPlay renderFlowchart={renderFlowchart} />);
    fireEvent.click(screen.getByLabelText('Pause'));
    rerender(<TraceViewer recording={ONE} autoPlay renderFlowchart={renderFlowchart} />);
    playOut();
    expect(cursor()).toBe(0);
  });

  it('reduced motion does not start', () => {
    reducedMotion(true);
    render(<TraceViewer recording={ONE} autoPlay renderFlowchart={renderFlowchart} />);
    playOut();
    expect(cursor()).toBe(0);
    expect(screen.getByLabelText('Play')).toBeTruthy();
  });

  it('a one-stage run does nothing; without the prop it stays still', () => {
    const { unmount } = render(<TraceViewer recording={recording('a')} autoPlay renderFlowchart={renderFlowchart} />);
    expect(screen.getByLabelText('Play')).toBeTruthy();
    unmount();
    render(<TraceViewer recording={ONE} renderFlowchart={renderFlowchart} />);
    playOut();
    expect(cursor()).toBe(0);
    expect(screen.getByLabelText('Play')).toBeTruthy();
  });
});

// ── The shell: the run, not the rail's array, is the recording ─────────────
describe('ExplainableShell autoPlay', () => {
  it('the same runId in a fresh snapshot object is the same run: no restart', () => {
    const { rerender } = render(
      <ExplainableShell runtimeSnapshot={runSnapshot(['a', 'b', 'c'], { runId: 'r1' }) as never} autoPlay />,
    );
    advance(1);
    rerender(<ExplainableShell runtimeSnapshot={runSnapshot(['a', 'b', 'c'], { runId: 'r1' }) as never} autoPlay />);
    expect(cursor()).toBe(1);
    playOut();
    rerender(<ExplainableShell runtimeSnapshot={runSnapshot(['a', 'b', 'c'], { runId: 'r1' }) as never} autoPlay />);
    expect(cursor()).toBe(2);
    rerender(<ExplainableShell runtimeSnapshot={runSnapshot(['a', 'b', 'c'], { runId: 'r2' }) as never} autoPlay />);
    expect(cursor()).toBe(0);
    expect(screen.getByLabelText('Pause')).toBeTruthy();
  });

  it('a drill stops the run for good, and coming back does not restart it', () => {
    const chart = chartSpy();
    const run = runWithSubflow();
    const { rerender } = render(
      <ExplainableShell runtimeSnapshot={run as never} traceGraph={GRAPH} renderFlowchart={chart.renderFlowchart} autoPlay />,
    );
    // On the first stage: the drill moves no cursor, so only the shell can tell.
    act(() => chart.ref.onNodeClick?.('sf-x'));
    expect(document.querySelector('[data-fp="tt-tick"]')?.getAttribute('title')).toBe('inner');
    expect(screen.getByLabelText('Play')).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button').find((b) => b.textContent?.includes('Flowchart'))!);
    expect(document.querySelectorAll('[data-fp="tt-tick"]').length).toBe(4);
    const mount = 1; // The breadcrumb hands the cursor back to the mount it left.
    expect(cursor()).toBe(mount);
    rerender(
      <ExplainableShell runtimeSnapshot={run as never} traceGraph={GRAPH} renderFlowchart={chart.renderFlowchart} autoPlay />,
    );
    playOut();
    expect(cursor()).toBe(mount);
    expect(screen.getByLabelText('Play')).toBeTruthy();
  });

  it('a chart click on another stage is a person moving the cursor', () => {
    const chart = chartSpy();
    render(
      <ExplainableShell runtimeSnapshot={runWithSubflow() as never} traceGraph={GRAPH} renderFlowchart={chart.renderFlowchart} autoPlay />,
    );
    advance(1);
    act(() => chart.ref.onNodeClick?.('c'));
    expect(cursor()).toBe(2);
    expect(screen.getByLabelText('Play')).toBeTruthy();
    playOut();
    expect(cursor()).toBe(2);
  });

  it.each([
    ['the same subflow is in the new run', () => runWithSubflow({ runId: 'r2' })],
    ['the subflow is gone from the new run', () => runSnapshot(['p', 'q', 'r'], { runId: 'r2' })],
  ])('a new run while drilled in plays from the root: %s', (_name, nextRun) => {
    const chart = chartSpy();
    const props = { traceGraph: GRAPH, renderFlowchart: chart.renderFlowchart, autoPlay: true };
    const { rerender } = render(<ExplainableShell runtimeSnapshot={runWithSubflow({ runId: 'r1' }) as never} {...props} />);
    advance(2);
    fireEvent.click(screen.getByLabelText('Pause'));
    act(() => chart.ref.onNodeClick?.('sf-x'));
    rerender(<ExplainableShell runtimeSnapshot={nextRun() as never} {...props} />);
    const root = document.querySelectorAll('[data-fp="tt-tick"]');
    expect(root.length).toBeGreaterThan(1);
    expect(root[0].getAttribute('title')).not.toBe('inner');
    expect(cursor()).toBe(0);
    expect(screen.getByLabelText('Pause')).toBeTruthy();
    playOut();
    expect(cursor()).toBe(root.length - 1);
  });

  it('reduced motion: a new run leaves the reader inside the subflow', () => {
    reducedMotion(true);
    const chart = chartSpy();
    const props = { traceGraph: GRAPH, renderFlowchart: chart.renderFlowchart, autoPlay: true };
    const { rerender } = render(<ExplainableShell runtimeSnapshot={runWithSubflow({ runId: 'r1' }) as never} {...props} />);
    act(() => chart.ref.onNodeClick?.('sf-x'));
    rerender(<ExplainableShell runtimeSnapshot={runWithSubflow({ runId: 'r2' }) as never} {...props} />);
    expect(document.querySelector('[data-fp="tt-tick"]')?.getAttribute('title')).toBe('inner');
  });

  it('unstyled: the rail leaves with its tab, and coming back does not restart the run', () => {
    render(<ExplainableShell unstyled runtimeSnapshot={runSnapshot(['a', 'b', 'c', 'd']) as never} autoPlay />);
    const tab = (name: string) =>
      [...document.querySelectorAll<HTMLElement>('[data-fp="shell-tab"]')].find((t) => t.textContent === name)!;
    const other = [...document.querySelectorAll<HTMLElement>('[data-fp="shell-tab"]')][0].textContent!;
    // The unstyled shell opens on a tab with no rail: it plays when first shown.
    fireEvent.click(tab('Explainable'));
    expect(screen.getByLabelText('Pause')).toBeTruthy();
    advance(1);
    fireEvent.click(tab(other));
    fireEvent.click(tab('Explainable'));
    expect(cursor()).toBe(1);
    expect(screen.getByLabelText('Play')).toBeTruthy();
    playOut();
    expect(cursor()).toBe(1);
  });
});
