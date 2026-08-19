/**
 * aggregateMountStatus — projecting subflow-internal status onto mount nodes.
 *
 * Regression focus: a mount whose materialised internals are merely PAST-DONE
 * (e.g. a looping subflow's earlier iteration) must NOT steal "active" from the
 * real top-level live node. It only becomes active when the live node is
 * genuinely inside it.
 */
import { describe, expect, it } from 'vitest';
import { aggregateMountStatus } from '../../src/components/FlowchartView/_internal/overlayProjection';
import type { TraceGraph } from '../../src/components/FlowchartView/traceStructureRecorder';

// Graph: a subflow mount `sf-inj` with internals gather/route, plus a top-level
// `tool-calls` node (the live one).
const graph = {
  nodes: [
    { id: 'sf-inj', position: { x: 0, y: 0 }, data: { isSubflow: true, subflowId: 'sf-inj', label: 'IE' } },
    { id: 'gather', position: { x: 0, y: 0 }, data: { subflowOf: 'sf-inj', label: 'Gather' } },
    { id: 'route', position: { x: 0, y: 0 }, data: { subflowOf: 'sf-inj', label: 'Route' } },
    { id: 'tool-calls', position: { x: 0, y: 0 }, data: { label: 'ToolCalls' } },
  ],
  edges: [],
} as unknown as TraceGraph;

const slice = (done: string[], active: string | null) => ({
  doneStageIds: new Set(done),
  activeStageId: active,
  executedStageIds: new Set([...done, ...(active ? [active] : [])]),
  executedOrderIds: [...done, ...(active ? [active] : [])],
  errors: new Map<string, string>(),
});

describe('aggregateMountStatus', () => {
  it('does NOT let a past-done subflow steal active from the top-level live node', () => {
    // gather+route done (the subflow ran earlier), tool-calls is the live node.
    const out = aggregateMountStatus(slice(['gather', 'route'], 'tool-calls'), graph, null);
    expect(out.activeStageId).toBe('tool-calls'); // NOT 'sf-inj'
    expect(out.doneStageIds.has('sf-inj')).toBe(true); // allDone → mount done
  });

  it('promotes active to the mount when the live node is genuinely inside it', () => {
    const out = aggregateMountStatus(slice(['gather'], 'route'), graph, null);
    expect(out.activeStageId).toBe('sf-inj'); // route is a member → mount active
  });

  it('does not promote when drilled into a subflow (active stays on the real stage)', () => {
    const out = aggregateMountStatus(slice(['gather'], 'route'), graph, 'sf-inj');
    expect(out.activeStageId).toBe('route');
  });

  it('marks the mount done only when ALL its internals are done', () => {
    const partial = aggregateMountStatus(slice(['gather'], 'tool-calls'), graph, null);
    expect(partial.doneStageIds.has('sf-inj')).toBe(false); // route not done yet
    expect(partial.activeStageId).toBe('tool-calls'); // and no active theft
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Nearest-visible-ancestor fallback + cursor stand-ins (collapse-aware cursor)
// ─────────────────────────────────────────────────────────────────────────────

import { cursorStandInIds, edgeCarriesCursor } from '../../src/components/FlowchartView/_internal/overlayProjection';

describe('aggregateMountStatus — nearest-visible-ancestor fallback', () => {
  it('promotes an active id the graph does not contain to its nearest visible path ancestor', () => {
    // The graph shows the mount but its internals were never materialised —
    // an active inner id must light the mount, not go dark.
    const bare = {
      nodes: [
        { id: 'sf-inj', position: { x: 0, y: 0 }, data: { isSubflow: true, subflowId: 'sf-inj', label: 'IE' } },
        { id: 'tool-calls', position: { x: 0, y: 0 }, data: { label: 'ToolCalls' } },
      ],
      edges: [],
    } as unknown as TraceGraph;
    const out = aggregateMountStatus(slice([], 'sf-inj/gather'), bare, null);
    expect(out.activeStageId).toBe('sf-inj');
  });

  it('walks PAST a hidden mount to a deeper visible ancestor', () => {
    const nested = {
      nodes: [{ id: 'outer', position: { x: 0, y: 0 }, data: { label: 'Outer' } }],
      edges: [],
    } as unknown as TraceGraph;
    const out = aggregateMountStatus(slice([], 'outer/inner/leaf'), nested, null);
    expect(out.activeStageId).toBe('outer');
  });

  it('leaves the active id untouched when it has no visible ancestor (top-level hidden node)', () => {
    const collapsed = {
      nodes: [{ id: 'work', position: { x: 0, y: 0 }, data: { label: 'Work' } }],
      edges: [],
    } as unknown as TraceGraph;
    const out = aggregateMountStatus(slice([], 'sf-hidden'), collapsed, null);
    expect(out.activeStageId).toBe('sf-hidden'); // the EDGE stand-in takes over (edgeCarriesCursor)
  });

  it('never fires for an id the graph does contain', () => {
    const out = aggregateMountStatus(slice(['gather', 'route'], 'tool-calls'), graph, null);
    expect(out.activeStageId).toBe('tool-calls');
  });
});

describe('cursorStandInIds / edgeCarriesCursor', () => {
  it('stand-ins are the active id plus every path ancestor', () => {
    expect([...cursorStandInIds('a/b/c')].sort()).toEqual(['a', 'a/b', 'a/b/c']);
    expect([...cursorStandInIds('top')]).toEqual(['top']);
    expect(cursorStandInIds(null).size).toBe(0);
  });

  it('an edge carries the cursor when its via intersects the stand-ins', () => {
    const standIns = cursorStandInIds('sf-inj/gather');
    expect(edgeCarriesCursor(['sf-inj'], standIns)).toBe(true); // mount hidden, cursor inside it
    expect(edgeCarriesCursor(['sf-inj/gather'], standIns)).toBe(true); // the id itself
    expect(edgeCarriesCursor(['sf-other'], standIns)).toBe(false);
    expect(edgeCarriesCursor(undefined, standIns)).toBe(false);
    expect(edgeCarriesCursor(['sf-inj'], cursorStandInIds(null))).toBe(false);
  });
});
