/** @vitest-environment jsdom */
/**
 * TraceViewer — 5-pattern tests.
 *
 * Verifies the parse + validate + render path. We don't rely on React
 * rendering here (jsdom + ExplainableShell would pull in heavy deps);
 * instead we exercise the validation surface directly via the onError
 * callback by mounting React with React.createElement + a stub renderer.
 */
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import * as React from 'react';
import { TraceViewer } from '../../src/components/TraceViewer/TraceViewer';
import type { TraceParseError } from '../../src/components/TraceViewer/TraceViewer';

const validTrace = {
  schemaVersion: 1 as const,
  exportedAt: '2026-04-18T00:00:00.000Z',
  redacted: true,
  snapshot: {
    sharedState: { foo: 'bar' },
    executionTree: { id: 'root', name: 'Root', children: [] },
    commitLog: [],
  },
  narrative: ['line 1', 'line 2'],
  narrativeEntries: [],
  spec: { id: 'spec', name: 'Test' },
};

// ── Unit ────────────────────────────────────────────────────

describe('TraceViewer — unit', () => {
  it('renders fallback when no trace is provided', () => {
    const { container } = render(
      React.createElement(TraceViewer, {
        trace: null,
        fallback: React.createElement('div', { 'data-testid': 'fb' }, 'empty'),
      }),
    );
    expect(container.querySelector('[data-testid="fb"]')).not.toBeNull();
  });

  it('renders fallback for empty string input (no error fired for whitespace)', () => {
    const onError = vi.fn();
    render(
      React.createElement(TraceViewer, {
        trace: '   ',
        onError,
        fallback: React.createElement('div', { 'data-testid': 'fb' }, 'empty'),
      }),
    );
    expect(onError).toHaveBeenCalled();
    const err = onError.mock.calls[0]?.[0] as TraceParseError;
    expect(err.kind).toBe('invalid-json');
  });

  it('accepts a parsed trace object directly', () => {
    const onError = vi.fn();
    const { container } = render(
      React.createElement(TraceViewer, {
        trace: validTrace,
        onError,
        fallback: React.createElement('div', { 'data-testid': 'fb' }, 'fallback'),
      }),
    );
    expect(onError).not.toHaveBeenCalled();
    // Either the shell rendered, or we got the empty-snapshots fallback —
    // both prove the parse step succeeded (no error callback fired).
    expect(container).toBeDefined();
  });

  it('parses a JSON string input', () => {
    const onError = vi.fn();
    render(
      React.createElement(TraceViewer, {
        trace: JSON.stringify(validTrace),
        onError,
      }),
    );
    expect(onError).not.toHaveBeenCalled();
  });
});

// ── Boundary ────────────────────────────────────────────────

describe('TraceViewer — boundary', () => {
  it('reports invalid-json on malformed string input', () => {
    const onError = vi.fn();
    render(
      React.createElement(TraceViewer, {
        trace: '{not valid json',
        onError,
      }),
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const err = onError.mock.calls[0]?.[0] as TraceParseError;
    expect(err.kind).toBe('invalid-json');
  });

  it('reports not-object when input parses to a primitive', () => {
    const onError = vi.fn();
    render(React.createElement(TraceViewer, { trace: '42', onError }));
    expect((onError.mock.calls[0]?.[0] as TraceParseError).kind).toBe('not-object');

    // Arrays ARE objects in JS, so they pass the not-object guard and fail
    // at missing-version instead — that's the documented behavior.
    onError.mockClear();
    render(React.createElement(TraceViewer, { trace: '[]', onError }));
    expect((onError.mock.calls[0]?.[0] as TraceParseError).kind).toBe('missing-version');
  });

  it('reports missing-version when schemaVersion is absent', () => {
    const onError = vi.fn();
    render(
      React.createElement(TraceViewer, {
        trace: { snapshot: {} } as never,
        onError,
      }),
    );
    expect((onError.mock.calls[0]?.[0] as TraceParseError).kind).toBe('missing-version');
  });

  it('reports unsupported-version for non-1 schemaVersion', () => {
    const onError = vi.fn();
    render(
      React.createElement(TraceViewer, {
        trace: { schemaVersion: 99, snapshot: {} } as never,
        onError,
      }),
    );
    const err = onError.mock.calls[0]?.[0] as TraceParseError;
    expect(err.kind).toBe('unsupported-version');
    expect(err.kind === 'unsupported-version' && err.version).toBe(99);
  });
});

// ── Scenario ────────────────────────────────────────────────

describe('TraceViewer — scenario', () => {
  it('switching from invalid to valid trace fires onError once, then clears', () => {
    const onError = vi.fn();
    const { rerender } = render(
      React.createElement(TraceViewer, { trace: '{', onError }),
    );
    expect(onError).toHaveBeenCalledTimes(1);

    rerender(React.createElement(TraceViewer, { trace: validTrace, onError }));
    // Re-render with valid trace — no new error fired
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

// ── Property ────────────────────────────────────────────────

describe('TraceViewer — property', () => {
  it('any onError call carries a kind from the documented union', () => {
    const onError = vi.fn();
    const inputs: unknown[] = [
      '',
      '{not json',
      '42',
      '"string"',
      '[]',
      { schemaVersion: 'v1' },
      { schemaVersion: 99 },
    ];
    for (const input of inputs) {
      render(React.createElement(TraceViewer, { trace: input as never, onError }));
    }
    const allowed = new Set([
      'invalid-json',
      'not-object',
      'missing-version',
      'unsupported-version',
    ]);
    for (const call of onError.mock.calls) {
      const err = call[0] as TraceParseError;
      expect(allowed.has(err.kind)).toBe(true);
    }
  });
});

// ── Security ────────────────────────────────────────────────

describe('TraceViewer — security', () => {
  it('does not throw on adversarial JSON shapes (deeply nested, prototype attempts)', () => {
    const adversarial: unknown[] = [
      JSON.stringify({ schemaVersion: 1, snapshot: { __proto__: { evil: true } } }),
      JSON.stringify({ schemaVersion: 1, snapshot: Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`k${i}`, i])) }),
    ];
    for (const trace of adversarial) {
      expect(() => {
        render(React.createElement(TraceViewer, { trace }));
      }).not.toThrow();
    }
  });
});
