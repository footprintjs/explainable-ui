/**
 * subflowDrill — drill SCOPE resolution (unit).
 *
 * Regression target: a drill was keyed by the mount's LOCAL `data.subflowId`.
 * That id is the child chart's own, so mounting one chart twice — at the top
 * level AND inside another subflow — gave both mounts the same key. Drilling
 * the nested one then showed the OTHER mount's stages, and when there was no
 * top-level twin it showed nothing at all.
 *
 * Drills are now keyed by the mount NODE id, which is unique, and the child
 * scope is resolved from the graph — matching either producer's spelling of
 * `subflowOf` (the mount PATH, or the mount's local id).
 */
import { describe, expect, it } from 'vitest';

import {
  filterGraphForDrill,
  buildSubflowBreadcrumb,
  resolveDrillScope,
  findMountNode,
} from '../../src/components/FlowchartView/_internal/subflowDrill';
import type { TraceGraph, TraceNode, TraceNodeData, TraceEdge } from '../../src/components/FlowchartView/traceStructureRecorder';

// ── Fixtures ──────────────────────────────────────────────────────────────
// These fixtures build graph SHAPE (mount/subflowOf tagging) by hand — no
// recorder in the loop — so `isDecider`/`isFork`/`isStreaming`/`prevIds`/
// `nextIds` are irrelevant to what's under test here and default to their
// honest "nothing special" values; callers override only `isSubflow` /
// `subflowId` / `subflowOf`, which is what every test actually varies.
function node(id: string, data: Partial<TraceNodeData> = {}): TraceNode {
  return {
    id,
    type: 'stage',
    position: { x: 0, y: 0 },
    data: {
      label: id,
      isDecider: false,
      isFork: false,
      isStreaming: false,
      isSubflow: false,
      prevIds: [],
      nextIds: [],
      ...data,
    },
  };
}
function edge(source: string, target: string): TraceEdge {
  return { id: `${source}->${target}`, source, target, data: { kind: 'next' } };
}

/**
 * `prepare` is mounted TWICE: once at the top level and once inside
 * `pipeline`. `verify` is mounted ONLY inside `pipeline` (no twin at all).
 * Children carry the mount PATH in `subflowOf` — eui's own recorder spelling.
 */
const NESTED: TraceGraph = {
  nodes: [
    node('seed', {}),
    node('prepare', { isSubflow: true, subflowId: 'prepare' }),
    node('prepare/clean', { subflowOf: 'prepare' }),
    node('prepare/scale', { subflowOf: 'prepare' }),
    node('pipeline', { isSubflow: true, subflowId: 'pipeline' }),
    node('pipeline/fetch', { subflowOf: 'pipeline' }),
    node('pipeline/prepare', { isSubflow: true, subflowId: 'prepare', subflowOf: 'pipeline' }),
    node('pipeline/prepare/clean', { subflowOf: 'pipeline/prepare' }),
    node('pipeline/prepare/scale', { subflowOf: 'pipeline/prepare' }),
    node('pipeline/verify', { isSubflow: true, subflowId: 'verify', subflowOf: 'pipeline' }),
    node('pipeline/verify/tally', { subflowOf: 'pipeline/verify' }),
  ],
  edges: [
    edge('seed', 'prepare'),
    edge('prepare/clean', 'prepare/scale'),
    edge('pipeline/fetch', 'pipeline/prepare'),
    edge('pipeline/prepare/clean', 'pipeline/prepare/scale'),
  ],
};

/**
 * The other producer spelling: internals tagged with the mount's LOCAL id
 * while the mount node's id is path-qualified. Matching the key against
 * `subflowOf` alone finds nothing here.
 */
const LOCAL_TAGGED: TraceGraph = {
  nodes: [
    node('run/sf-agent', { isSubflow: true, subflowId: 'sf-agent' }),
    node('run/sf-agent/think', { subflowOf: 'sf-agent' }),
    node('run/sf-agent/act', { subflowOf: 'sf-agent' }),
  ],
  edges: [edge('run/sf-agent/think', 'run/sf-agent/act')],
};

// ── Tests ─────────────────────────────────────────────────────────────────
describe('filterGraphForDrill — nested mounts (REGRESSION)', () => {
  it('drills the NESTED mount into its OWN stages, not its top-level twin\'s', () => {
    const out = filterGraphForDrill(NESTED, 'pipeline/prepare');
    expect(out.nodes.map((n) => n.id)).toEqual([
      'pipeline/prepare/clean',
      'pipeline/prepare/scale',
    ]);
  });

  it('drills a mount that exists ONLY nested (no twin) instead of blanking', () => {
    const out = filterGraphForDrill(NESTED, 'pipeline/verify');
    expect(out.nodes.map((n) => n.id)).toEqual(['pipeline/verify/tally']);
  });

  it('still drills the top-level mount into its own stages', () => {
    const out = filterGraphForDrill(NESTED, 'prepare');
    expect(out.nodes.map((n) => n.id)).toEqual(['prepare/clean', 'prepare/scale']);
  });

  it('keeps edges whose endpoints both survive the filter', () => {
    const out = filterGraphForDrill(NESTED, 'pipeline/prepare');
    expect(out.edges.map((e) => e.id)).toEqual(['pipeline/prepare/clean->pipeline/prepare/scale']);
  });

  it('null scope shows the top level only', () => {
    const out = filterGraphForDrill(NESTED, null);
    expect(out.nodes.map((n) => n.id)).toEqual(['seed', 'prepare', 'pipeline']);
  });
});

describe('filterGraphForDrill — producer spellings (PROPERTY)', () => {
  it('works when internals are tagged with the mount NODE id', () => {
    expect(filterGraphForDrill(NESTED, 'pipeline').nodes.map((n) => n.id)).toEqual([
      'pipeline/fetch',
      'pipeline/prepare',
      'pipeline/verify',
    ]);
  });

  it('works when internals are tagged with the mount LOCAL id', () => {
    expect(filterGraphForDrill(LOCAL_TAGGED, 'run/sf-agent').nodes.map((n) => n.id)).toEqual([
      'run/sf-agent/think',
      'run/sf-agent/act',
    ]);
  });

  it('an unknown key yields an empty scope, never the whole graph', () => {
    expect(filterGraphForDrill(NESTED, 'no-such-mount').nodes).toEqual([]);
  });
});

describe('resolveDrillScope / findMountNode (UNIT)', () => {
  it('resolves a node-id key to itself when children carry the path', () => {
    expect(resolveDrillScope(NESTED, 'pipeline/prepare')).toBe('pipeline/prepare');
  });

  it('falls back to the local subflow id when children carry that instead', () => {
    const graph: TraceGraph = {
      nodes: [
        node('a/sf', { isSubflow: true, subflowId: 'sf' }),
        node('a/sf/one', { subflowOf: 'sf' }),
      ],
      edges: [],
    };
    expect(resolveDrillScope(graph, 'a/sf')).toBe('sf');
  });

  it('finds a mount by node id, and by local id for legacy keys', () => {
    expect(findMountNode(NESTED, 'pipeline/prepare')?.id).toBe('pipeline/prepare');
    expect(findMountNode(NESTED, 'pipeline')?.id).toBe('pipeline');
    // A bare, ambiguous id still resolves — to the first matching mount.
    expect(findMountNode(NESTED, 'verify')?.id).toBe('pipeline/verify');
  });
});

describe('buildSubflowBreadcrumb — full ancestor chain (FUNCTIONAL)', () => {
  it('names every ancestor of a nested mount, outermost first', () => {
    expect(buildSubflowBreadcrumb(NESTED, 'pipeline/prepare')).toEqual([
      { subflowId: null, label: 'Chart' },
      { subflowId: 'pipeline', label: 'pipeline' },
      { subflowId: 'pipeline/prepare', label: 'pipeline/prepare' },
    ]);
  });

  it('is just the root at the top level', () => {
    expect(buildSubflowBreadcrumb(NESTED, null)).toEqual([{ subflowId: null, label: 'Chart' }]);
  });

  it('degrades to the raw key when the graph has no such mount', () => {
    expect(buildSubflowBreadcrumb(NESTED, 'ghost')).toEqual([
      { subflowId: null, label: 'Chart' },
      { subflowId: 'ghost', label: 'ghost' },
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 0.35.0 — the DOCUMENTED legacy key (a bare local `subflowId`) on a graph
// produced by eui's own recorder.
//
// `findMountNode` has always resolved that form, and `filterGraphForDrill`'s
// own docblock promises it ("`X` being the mount NODE id (preferred, unique)
// or its local `subflowId` (legacy)"). But `resolveDrillScope` never mapped it
// through the mount, so the scope stayed the bare id — which no child's
// `subflowOf` carries on a recorder graph — and the filter returned an EMPTY
// chart. The documented form drew nothing.
// ─────────────────────────────────────────────────────────────────────────────
describe('legacy drill key — a bare local subflowId', () => {
  /** One mount, node id `pipeline/prepare`, local subflowId `prepare`.
   *  Children are tagged with the mount NODE id (recorder spelling). */
  const RECORDER_GRAPH: TraceGraph = {
    nodes: [
      node('seed', {}),
      node('pipeline', { isSubflow: true, subflowId: 'pipeline' }),
      node('pipeline/prepare', { isSubflow: true, subflowId: 'prepare', subflowOf: 'pipeline' }),
      node('pipeline/prepare/clean', { subflowOf: 'pipeline/prepare' }),
      node('pipeline/prepare/scale', { subflowOf: 'pipeline/prepare' }),
    ],
    edges: [edge('pipeline/prepare/clean', 'pipeline/prepare/scale')],
  };

  it('resolves the bare local id to the mount node id the children carry', () => {
    expect(resolveDrillScope(RECORDER_GRAPH, 'prepare')).toBe('pipeline/prepare');
  });

  it('filterGraphForDrill returns that mount’s stages, not an empty graph', () => {
    const filtered = filterGraphForDrill(RECORDER_GRAPH, 'prepare');
    expect(filtered.nodes.map((n) => n.id)).toEqual([
      'pipeline/prepare/clean',
      'pipeline/prepare/scale',
    ]);
    expect(filtered.edges).toHaveLength(1);
  });

  it('agrees with findMountNode, which always resolved this form', () => {
    const mount = findMountNode(RECORDER_GRAPH, 'prepare');
    expect(mount?.id).toBe('pipeline/prepare');
    expect(resolveDrillScope(RECORDER_GRAPH, 'prepare')).toBe(mount?.id);
  });

  it('FIRST MOUNT WINS when a local id names more than one mount', () => {
    // A local subflowId is not unique — that ambiguity is exactly why the
    // mount node id is the preferred key. Document order is the only answer
    // available, so pin it rather than leave it to chance.
    const twoMounts: TraceGraph = {
      nodes: [
        node('first', { isSubflow: true, subflowId: 'shared' }),
        node('first/a', { subflowOf: 'first' }),
        node('second', { isSubflow: true, subflowId: 'shared' }),
        node('second/b', { subflowOf: 'second' }),
      ],
      edges: [],
    };
    expect(resolveDrillScope(twoMounts, 'shared')).toBe('first');
    expect(filterGraphForDrill(twoMounts, 'shared').nodes.map((n) => n.id)).toEqual(['first/a']);
  });

  it('an unrecorded mount still resolves to an honest empty scope', () => {
    // A lazy mount whose internals were never recorded has no children to
    // find. The key comes back unchanged and the chart is empty — which is
    // the truth, not the bug above.
    const lazy: TraceGraph = {
      nodes: [node('root', {}), node('lazyMount', { isSubflow: true, subflowId: 'never-ran' })],
      edges: [],
    };
    expect(resolveDrillScope(lazy, 'never-ran')).toBe('never-ran');
    expect(filterGraphForDrill(lazy, 'never-ran').nodes).toHaveLength(0);
  });
});
