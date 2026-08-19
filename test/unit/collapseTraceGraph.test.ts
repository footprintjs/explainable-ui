/**
 * collapseTraceGraph — node collapse with edge contraction (unit).
 *
 * The five rules from the module header, each pinned:
 *   1. matched nodes removed + listed;
 *   2. a removed card takes its drill-internals with it (transitively), and
 *      those are NOT listed;
 *   3. paths through removed nodes survive (chains contract fully; no
 *      self-loops; duplicates deduped);
 *   4. a loop leg keeps the contracted edge a loop;
 *   5. nothing matched → the ORIGINAL graph reference, empty hidden list.
 */
import { describe, expect, it } from 'vitest';

import { collapseTraceGraph } from '../../src/components/FlowchartView/_internal/collapseGraph';
import type { TraceGraph } from '../../src/components/FlowchartView/traceStructureRecorder';

function node(id: string, data: Record<string, unknown> = {}) {
  return { id, type: 'stage', position: { x: 0, y: 0 }, data: { label: id, ...data } };
}
function edge(source: string, target: string, kind = 'next') {
  return { id: `${source}->${target}`, source, target, data: { kind } };
}

/** A linear chart with two plumbing stages in a row, one of them a subflow
 *  card with internals, and a loop back through a plumbing stage. */
const CHART: TraceGraph = {
  nodes: [
    node('seed'),
    node('plumb-a', { flavour: 'plumbing', isSubflow: true, subflowId: 'plumb-a' }),
    node('plumb-a/inner', { subflowOf: 'plumb-a' }),
    node('plumb-a/deeper', { isSubflow: true, subflowId: 'deeper', subflowOf: 'plumb-a' }),
    node('plumb-a/deeper/leaf', { subflowOf: 'plumb-a/deeper' }),
    node('plumb-b', { flavour: 'plumbing' }),
    node('work'),
    node('loop-plumb'),
    node('done'),
  ],
  edges: [
    edge('seed', 'plumb-a'),
    edge('plumb-a', 'plumb-b'),
    edge('plumb-b', 'work'),
    edge('work', 'loop-plumb'),
    edge('loop-plumb', 'seed', 'loop'),
    edge('work', 'done'),
    edge('plumb-a/inner', 'plumb-a/deeper'),
  ],
} as unknown as TraceGraph;

/** The caller's own judgement, keyed on the caller's own data — no id
 *  convention. Deliberately does NOT match the internals: rule 2 must remove
 *  them by scope, not because the predicate happened to. */
const hidePlumbing = (n: TraceGraph['nodes'][number]): boolean => n.data?.flavour === 'plumbing';

const edgePairs = (g: TraceGraph): string[] => g.edges.map((e) => `${e.source}->${e.target}`);

describe('collapseTraceGraph', () => {
  it('removes matched nodes and lists exactly them, in graph order', () => {
    const { graph, hiddenNodeIds } = collapseTraceGraph(CHART, hidePlumbing);
    expect(hiddenNodeIds).toEqual(['plumb-a', 'plumb-b']);
    const ids = graph.nodes.map((n) => n.id);
    expect(ids).not.toContain('plumb-a');
    expect(ids).not.toContain('plumb-b');
    expect(ids).toContain('seed');
    expect(ids).toContain('work');
  });

  it('takes a removed card’s internals with it, transitively — without listing them', () => {
    const { graph, hiddenNodeIds } = collapseTraceGraph(CHART, hidePlumbing);
    const ids = graph.nodes.map((n) => n.id);
    expect(ids).not.toContain('plumb-a/inner');
    expect(ids).not.toContain('plumb-a/deeper');
    expect(ids).not.toContain('plumb-a/deeper/leaf');
    // The honest count is the count of CARDS someone could have seen.
    expect(hiddenNodeIds).toEqual(['plumb-a', 'plumb-b']);
  });

  it('contracts paths through removed nodes — chains contract fully', () => {
    const { graph } = collapseTraceGraph(CHART, hidePlumbing);
    // seed → plumb-a → plumb-b → work becomes seed → work.
    expect(edgePairs(graph)).toContain('seed->work');
    // No surviving edge touches a removed node.
    for (const e of graph.edges) {
      expect(e.source.startsWith('plumb')).toBe(false);
      expect(e.target.startsWith('plumb')).toBe(false);
    }
  });

  it('keeps a loop a loop when a loop leg is contracted', () => {
    const { graph } = collapseTraceGraph(CHART, (n) => n.id === 'loop-plumb');
    // work → loop-plumb → (loop) seed becomes work → seed, still kind 'loop'.
    const contracted = graph.edges.find((e) => e.source === 'work' && e.target === 'seed');
    expect(contracted).toBeTruthy();
    expect(contracted!.data?.kind).toBe('loop');
  });

  it('never fabricates a self-loop and dedupes contracted duplicates', () => {
    // a → x → b and a → y → b: hiding x AND y must give ONE a → b, and hiding
    // a middle node between a node and itself must give no a → a.
    const diamond: TraceGraph = {
      nodes: [node('a'), node('x'), node('y'), node('b')],
      edges: [edge('a', 'x'), edge('x', 'b'), edge('a', 'y'), edge('y', 'b')],
    } as unknown as TraceGraph;
    const { graph } = collapseTraceGraph(diamond, (n) => n.id === 'x' || n.id === 'y');
    expect(edgePairs(graph)).toEqual(['a->b']);

    const selfish: TraceGraph = {
      nodes: [node('a'), node('mid')],
      edges: [edge('a', 'mid'), edge('mid', 'a')],
    } as unknown as TraceGraph;
    const collapsed = collapseTraceGraph(selfish, (n) => n.id === 'mid');
    expect(collapsed.graph.edges).toEqual([]);
  });

  it('returns the ORIGINAL graph reference when nothing matches', () => {
    const { graph, hiddenNodeIds } = collapseTraceGraph(CHART, () => false);
    expect(graph).toBe(CHART);
    expect(hiddenNodeIds).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 4b — contracted edges remember what they contracted through (`via`)
// ─────────────────────────────────────────────────────────────────────────────

describe('collapseTraceGraph — via (what a contracted edge stands in for)', () => {
  const hide = (n: { data?: { flavour?: unknown } }) => n.data?.flavour === 'plumbing';

  it('stamps via with the hidden node a contraction passed through', () => {
    const { graph } = collapseTraceGraph(CHART, hide);
    // seed → work contracted through plumb-a AND plumb-b (a chain): one edge,
    // both ids remembered.
    const contracted = graph.edges.find((e) => e.source === 'seed' && e.target === 'work');
    expect(contracted).toBeDefined();
    expect([...(contracted!.data!.via as string[])].sort()).toEqual(['plumb-a', 'plumb-b']);
  });

  it('a removed card carries its internals into via too (the cursor may stand on an inner id)', () => {
    const { graph } = collapseTraceGraph(CHART, hide);
    const contracted = graph.edges.find((e) => e.source === 'seed' && e.target === 'work');
    // plumb-a/inner has its own edge into plumb-a/deeper (both removed with the
    // card); those internal-only paths vanish entirely — but the MAIN path's
    // via must never claim less than the nodes it actually replaced.
    expect(contracted!.data!.via).toContain('plumb-a');
  });

  it('original (untouched) edges carry no via', () => {
    const { graph } = collapseTraceGraph(CHART, hide);
    const untouched = graph.edges.find((e) => e.source === 'work' && e.target === 'done');
    expect(untouched).toBeDefined();
    expect(untouched!.data!.via).toBeUndefined();
  });

  it('duplicate contractions union their via lists instead of dropping one', () => {
    // A diamond: seed → (x | y) → work, both x and y hidden. Contraction yields
    // seed→work twice; the survivor must stand in for BOTH x and y.
    const diamond = {
      nodes: [node('seed'), node('x', { flavour: 'plumbing' }), node('y', { flavour: 'plumbing' }), node('work')],
      edges: [edge('seed', 'x'), edge('x', 'work'), edge('seed', 'y'), edge('y', 'work')],
    } as unknown as TraceGraph;
    const { graph } = collapseTraceGraph(diamond, hide);
    const survivors = graph.edges.filter((e) => e.source === 'seed' && e.target === 'work');
    expect(survivors).toHaveLength(1);
    expect([...(survivors[0]!.data!.via as string[])].sort()).toEqual(['x', 'y']);
  });

  it('a duplicate that collides with an ORIGINAL edge folds its via into it', () => {
    // seed → work exists directly AND through hidden x. The original edge wins
    // the dedupe, but it must still say it stands in for x.
    const parallel = {
      nodes: [node('seed'), node('x', { flavour: 'plumbing' }), node('work')],
      edges: [edge('seed', 'work'), edge('seed', 'x'), edge('x', 'work')],
    } as unknown as TraceGraph;
    const { graph } = collapseTraceGraph(parallel, hide);
    const survivors = graph.edges.filter((e) => e.source === 'seed' && e.target === 'work');
    expect(survivors).toHaveLength(1);
    expect(survivors[0]!.id).toBe('seed->work'); // the original edge survived
    expect(survivors[0]!.data!.via).toEqual(['x']); // and remembers the hidden path
  });
});
