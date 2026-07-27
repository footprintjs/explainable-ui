/** @vitest-environment jsdom */
/**
 * TraceViewer — renders a saved recording, and says why when it can't.
 *
 * Two things this file pins that the old component got wrong:
 *
 * 1. **It draws the chart.** A recording carrying `structure` renders chart
 *    nodes. The old viewer accepted a `spec` prop, ignored it, and never
 *    passed `traceGraph` or `runtimeOverlay` to the shell — so a valid
 *    recording produced ZERO chart nodes, every time.
 * 2. **It never fails to nothing.** An unreadable snapshot and a run with no
 *    stages both reach `onError` with a typed reason. The old viewer
 *    swallowed the adapter's throw and rendered `fallback ?? null` in
 *    silence.
 *
 * (The API it was named for — `agentfootprint.exportTrace()` — does not
 * exist; the shape here is the `Recording` that `agentfootprint-lens`'
 * `observeRecording` reads, so one saved file drives both viewers.)
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import * as React from 'react';
import { flowChart } from 'footprintjs';
import { TraceViewer } from '../../src/components/TraceViewer/TraceViewer';
import type { TraceParseError } from '../../src/components/TraceViewer/TraceViewer';

const noop = async () => {};

/** A real two-stage chart, so `structure` is the engine's own serialization. */
const CHART = flowChart('Alpha', noop, 'alpha').addFunction('Beta', noop, 'beta').build();

const SNAPSHOT = {
  sharedState: { total: 3 },
  commitLog: [
    { idx: 0, stage: 'Alpha', stageId: 'alpha', runtimeStageId: 'alpha#0', trace: [], overwrite: {}, updates: {} },
    { idx: 1, stage: 'Beta', stageId: 'beta', runtimeStageId: 'beta#1', trace: [], overwrite: {}, updates: {} },
  ],
  executionTree: {
    id: 'alpha',
    name: 'Alpha',
    runtimeStageId: 'alpha#0',
    logs: {},
    errors: {},
    metrics: {},
    evals: {},
    next: {
      id: 'beta',
      name: 'Beta',
      runtimeStageId: 'beta#1',
      logs: {},
      errors: {},
      metrics: {},
      evals: {},
    },
  },
};

const RECORDING = { snapshot: SNAPSHOT, structure: CHART.buildTimeStructure, events: [] };

afterEach(cleanup);

// ── Unit ────────────────────────────────────────────────────

describe('TraceViewer — unit', () => {
  it('renders fallback when no recording is provided', () => {
    const { container } = render(
      React.createElement(TraceViewer, {
        recording: null,
        fallback: React.createElement('div', { 'data-testid': 'fb' }, 'empty'),
      }),
    );
    expect(container.querySelector('[data-testid="fb"]')).not.toBeNull();
  });

  it('reports invalid-json for whitespace input', () => {
    const onError = vi.fn();
    render(React.createElement(TraceViewer, { recording: '   ', onError }));
    expect((onError.mock.calls[0]?.[0] as TraceParseError).kind).toBe('invalid-json');
  });

  it('accepts a parsed recording object', () => {
    const onError = vi.fn();
    render(React.createElement(TraceViewer, { recording: RECORDING as never, onError }));
    expect(onError).not.toHaveBeenCalled();
  });

  it('parses a JSON string — the paste-a-run workflow', () => {
    const onError = vi.fn();
    render(React.createElement(TraceViewer, { recording: JSON.stringify(RECORDING), onError }));
    expect(onError).not.toHaveBeenCalled();
  });

  it('still reads the former `trace` prop name', () => {
    const onError = vi.fn();
    render(React.createElement(TraceViewer, { trace: RECORDING as never, onError }));
    expect(onError).not.toHaveBeenCalled();
  });
});

// ── Integration — the chart the old viewer never drew ───────

describe('TraceViewer — draws the recorded chart', () => {
  it('renders one chart node per stage in the saved structure', async () => {
    const { container } = render(React.createElement(TraceViewer, { recording: RECORDING as never }));
    await waitFor(() =>
      expect(container.querySelectorAll('.react-flow__node').length).toBe(2),
    );
    expect(container.querySelector('.react-flow__node[data-id="alpha"]')).toBeTruthy();
    expect(container.querySelector('.react-flow__node[data-id="beta"]')).toBeTruthy();
  });

  it('lights the executed path — the overlay is rebuilt from the commit log', async () => {
    // Only alpha ran; beta must fade rather than sit at its base colour.
    const oneStage = {
      ...RECORDING,
      snapshot: { ...SNAPSHOT, commitLog: [SNAPSHOT.commitLog[0]] },
    };
    const { container } = render(React.createElement(TraceViewer, { recording: oneStage as never }));
    await waitFor(() => expect(container.querySelectorAll('.react-flow__node').length).toBe(2));
    await waitFor(() =>
      expect(
        container.querySelector<HTMLElement>('.react-flow__node[data-id="beta"]')!.style.opacity,
      ).toBe('0.35'),
    );
  });

  it('reads `blueprint` when that is the name the run was frozen under', async () => {
    const { blueprint: _none, structure, ...rest } = RECORDING as Record<string, unknown>;
    const { container } = render(
      React.createElement(TraceViewer, { recording: { ...rest, blueprint: structure } as never }),
    );
    await waitFor(() => expect(container.querySelectorAll('.react-flow__node').length).toBe(2));
  });

  it('a recording without structure still shows the run, and names what is missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      React.createElement(TraceViewer, { recording: { snapshot: SNAPSHOT } as never }),
    );
    expect(container.querySelectorAll('.react-flow__node').length).toBe(0);
    await waitFor(() =>
      expect(container.querySelector('[data-fp="shell-missing-chart"]')).toBeTruthy(),
    );
    warn.mockRestore();
  });
});

// ── Boundary — every silent path now speaks ────────────────

describe('TraceViewer — boundary', () => {
  it('reports invalid-json on malformed string input', () => {
    const onError = vi.fn();
    render(React.createElement(TraceViewer, { recording: '{not valid json', onError }));
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0]?.[0] as TraceParseError).kind).toBe('invalid-json');
  });

  it('reports not-object for primitives and arrays', () => {
    const onError = vi.fn();
    render(React.createElement(TraceViewer, { recording: '42', onError }));
    expect((onError.mock.calls[0]?.[0] as TraceParseError).kind).toBe('not-object');
    onError.mockClear();
    render(React.createElement(TraceViewer, { recording: '[]', onError }));
    expect((onError.mock.calls[0]?.[0] as TraceParseError).kind).toBe('not-object');
  });

  it('reports missing-snapshot and says what a recording is', () => {
    const onError = vi.fn();
    render(React.createElement(TraceViewer, { recording: { events: [] } as never, onError }));
    const err = onError.mock.calls[0]?.[0] as TraceParseError;
    expect(err.kind).toBe('missing-snapshot');
    expect(err.message).toContain('buildTimeStructure');
  });

  it('reports unsupported-version for a stamped version it cannot read', () => {
    const onError = vi.fn();
    render(
      React.createElement(TraceViewer, {
        recording: { schemaVersion: 99, snapshot: SNAPSHOT } as never,
        onError,
      }),
    );
    const err = onError.mock.calls[0]?.[0] as TraceParseError;
    expect(err.kind).toBe('unsupported-version');
    expect(err.kind === 'unsupported-version' && err.version).toBe(99);
  });

  it('reports unreadable-snapshot instead of rendering nothing', () => {
    const onError = vi.fn();
    render(
      React.createElement(TraceViewer, {
        // `recorders` must be a list of recorder snapshots; a number is not
        // something this library can read, and it used to be swallowed.
        recording: { snapshot: { ...SNAPSHOT, recorders: 42 } } as never,
        onError,
        fallback: React.createElement('div', null, 'nothing'),
      }),
    );
    const err = onError.mock.calls[0]?.[0] as TraceParseError;
    expect(err.kind).toBe('unreadable-snapshot');
    expect(err.message).toContain('Could not read this snapshot');
  });

  it('reports no-stages when the run never executed anything', () => {
    const onError = vi.fn();
    render(
      React.createElement(TraceViewer, {
        recording: { snapshot: { sharedState: {}, commitLog: [], executionTree: null } } as never,
        onError,
      }),
    );
    expect((onError.mock.calls[0]?.[0] as TraceParseError).kind).toBe('no-stages');
  });
});

// ── Scenario ────────────────────────────────────────────────

describe('TraceViewer — scenario', () => {
  it('switching from invalid to valid fires onError once, then clears', () => {
    const onError = vi.fn();
    const { rerender } = render(React.createElement(TraceViewer, { recording: '{', onError }));
    expect(onError).toHaveBeenCalledTimes(1);
    rerender(React.createElement(TraceViewer, { recording: RECORDING as never, onError }));
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

// ── Property ────────────────────────────────────────────────

describe('TraceViewer — property', () => {
  it('every onError call carries a kind from the documented union', () => {
    const onError = vi.fn();
    const inputs: unknown[] = [
      '',
      '{not json',
      '42',
      '"string"',
      '[]',
      { events: [] },
      { schemaVersion: 99, snapshot: SNAPSHOT },
      { snapshot: { sharedState: {}, commitLog: [], executionTree: null } },
      { snapshot: { ...SNAPSHOT, recorders: 42 } },
    ];
    for (const recording of inputs) {
      render(React.createElement(TraceViewer, { recording: recording as never, onError }));
    }
    const allowed = new Set([
      'invalid-json',
      'not-object',
      'unsupported-version',
      'missing-snapshot',
      'unreadable-snapshot',
      'no-stages',
    ]);
    expect(onError.mock.calls.length).toBe(inputs.length);
    for (const call of onError.mock.calls) {
      expect(allowed.has((call[0] as TraceParseError).kind)).toBe(true);
      expect((call[0] as TraceParseError).message).toMatch(/\S/);
    }
  });
});

// ── Security ────────────────────────────────────────────────

describe('TraceViewer — security', () => {
  it('does not throw on adversarial JSON shapes', () => {
    const adversarial: unknown[] = [
      JSON.stringify({ snapshot: { __proto__: { evil: true } } }),
      JSON.stringify({
        snapshot: Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`k${i}`, i])),
      }),
      JSON.stringify({ snapshot: SNAPSHOT, structure: { id: 'x' } }),
    ];
    for (const recording of adversarial) {
      expect(() => render(React.createElement(TraceViewer, { recording }))).not.toThrow();
    }
  });
});
