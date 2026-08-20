/** @vitest-environment jsdom */
/**
 * Deprecated exports SAY they are deprecated — once, in dev, naming the
 * replacement.
 *
 * A `@deprecated` JSDoc tag only reaches someone reading the types in an
 * editor. Most consumers copied a snippet once and never look again, so
 * three exports that are going away in the next major also print one line
 * to the console the first time they run.
 *
 * "Once" is load-bearing: a deprecated component inside a 200-row list
 * must not print 200 warnings, or the notice becomes noise people mute
 * — and then the removal is a surprise.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, renderHook } from '@testing-library/react';

import { resetDeprecationNoticesForTests } from '../../src/_internal/deprecate';
import { TimeTravelDebugger } from '../../src/components/TimeTravelDebugger';
import { SubflowBreadcrumb } from '../../src/components/FlowchartView/SubflowBreadcrumb';
import { useSubflowNavigation } from '../../src/components/FlowchartView/useSubflowNavigation';
import type { TraceGraph } from '../../src/components/FlowchartView/traceStructureRecorder';

const EMPTY_GRAPH: TraceGraph = { nodes: [], edges: [] };

beforeEach(() => {
  resetDeprecationNoticesForTests();
});

describe('deprecation notices', () => {
  it('TimeTravelDebugger warns once, and names what to use instead', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // `snapshots={[]}` renders the placeholder — the notice must not
    // depend on the component reaching its full render path.
    render(<TimeTravelDebugger snapshots={[]} graph={EMPTY_GRAPH} />);

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain('TimeTravelDebugger is deprecated');
    expect(message).toContain('next major');
    expect(message).toMatch(/SnapshotPanel|ExplainableShell|footprint-viewer/);

    // Rendering it again is free — one notice per process, not per render.
    render(<TimeTravelDebugger snapshots={[]} graph={EMPTY_GRAPH} />);
    expect(warn).toHaveBeenCalledTimes(1);

    warn.mockRestore();
  });

  it('useSubflowNavigation warns once, naming the modern drill', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { rerender } = renderHook(() => useSubflowNavigation(EMPTY_GRAPH));
    rerender();

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain('useSubflowNavigation is deprecated');
    // The REASON travels with the notice: the key it emits is not unique.
    expect(message).toContain('subflowId');
    expect(message).toMatch(/TracedFlow|filterGraphForDrill/);

    warn.mockRestore();
  });

  it('SubflowBreadcrumb warns once, even when it renders nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // One crumb = no trail to draw (it returns null). The notice is about
    // the import, not about what got painted.
    render(<SubflowBreadcrumb breadcrumbs={[{ label: 'Flowchart' }]} onNavigate={() => {}} />);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('SubflowBreadcrumb is deprecated');

    warn.mockRestore();
  });

  it('each notice is separate — one deprecated export does not silence another', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<TimeTravelDebugger snapshots={[]} graph={EMPTY_GRAPH} />);
    render(<SubflowBreadcrumb breadcrumbs={[{ label: 'Flowchart' }]} onNavigate={() => {}} />);

    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
