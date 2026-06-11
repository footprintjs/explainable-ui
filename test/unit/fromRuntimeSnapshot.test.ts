import { describe, it, expect } from 'vitest';
import { toVisualizationSnapshots, createSnapshots, mergeWritePatch } from '../../src/adapters/fromRuntimeSnapshot';

function makeRuntimeNode(name: string, overrides?: Record<string, unknown>) {
  return {
    id: name,
    name,
    logs: {},
    errors: {},
    metrics: {},
    evals: {},
    ...overrides,
  };
}

function makeRuntime(tree: ReturnType<typeof makeRuntimeNode>) {
  return {
    sharedState: {},
    executionTree: tree,
    commitLog: [],
  };
}

describe('toVisualizationSnapshots', () => {
  it('extracts description from runtime node', () => {
    const tree = makeRuntimeNode('ValidateCard', { description: 'Verify card details' });
    const snaps = toVisualizationSnapshots(makeRuntime(tree));
    expect(snaps).toHaveLength(1);
    expect(snaps[0].description).toBe('Verify card details');
  });

  it('extracts subflowId from runtime node', () => {
    const tree = makeRuntimeNode('ChargeCard', { subflowId: 'sf-payment' });
    const snaps = toVisualizationSnapshots(makeRuntime(tree));
    expect(snaps[0].subflowId).toBe('sf-payment');
  });

  it('omits description/subflowId when not present', () => {
    const tree = makeRuntimeNode('PlainStage');
    const snaps = toVisualizationSnapshots(makeRuntime(tree));
    expect(snaps[0].description).toBeUndefined();
    expect(snaps[0].subflowId).toBeUndefined();
  });

  it('propagates description through linear chain', () => {
    const tree = makeRuntimeNode('A', {
      description: 'First step',
      next: makeRuntimeNode('B', { description: 'Second step' }),
    });
    const snaps = toVisualizationSnapshots(makeRuntime(tree));
    expect(snaps[0].description).toBe('First step');
    expect(snaps[1].description).toBe('Second step');
  });

  it('propagates description through fork children', () => {
    const tree = makeRuntimeNode('Fork', {
      children: [
        makeRuntimeNode('Left', { description: 'Left branch' }),
        makeRuntimeNode('Right', { subflowId: 'sf-right' }),
      ],
    });
    const snaps = toVisualizationSnapshots(makeRuntime(tree));
    const left = snaps.find((s) => s.stageName === 'Left');
    const right = snaps.find((s) => s.stageName === 'Right');
    expect(left?.description).toBe('Left branch');
    expect(right?.subflowId).toBe('sf-right');
  });

  it('preserves all existing fields alongside new ones', () => {
    const tree = makeRuntimeNode('Stage', {
      description: 'desc',
      subflowId: 'sf-1',
      stageWrites: { key: 'value' },
      metrics: { durationMs: 42 },
    });
    const snaps = toVisualizationSnapshots(makeRuntime(tree));
    expect(snaps[0].stageName).toBe('Stage');
    expect(snaps[0].memory).toEqual({ key: 'value' });
    expect(snaps[0].durationMs).toBe(42);
    expect(snaps[0].description).toBe('desc');
    expect(snaps[0].subflowId).toBe('sf-1');
    expect(snaps[0].status).toBe('done');
  });

  it('builds cumulative memory from stageWrites across linear chain', () => {
    const tree = makeRuntimeNode('A', {
      stageWrites: { creditScore: 720 },
      next: makeRuntimeNode('B', {
        stageWrites: { decision: 'approved' },
      }),
    });
    const snaps = toVisualizationSnapshots(makeRuntime(tree));
    // Stage A: only creditScore
    expect(snaps[0].memory).toEqual({ creditScore: 720 });
    // Stage B: cumulative — both creditScore and decision
    expect(snaps[1].memory).toEqual({ creditScore: 720, decision: 'approved' });
  });

  it('does not include diagnostic logs in memory', () => {
    const tree = makeRuntimeNode('Stage', {
      logs: { deciderRationale: 'some debug info' },
    });
    const snaps = toVisualizationSnapshots(makeRuntime(tree));
    // logs should NOT appear in memory — only stageWrites do
    expect(snaps[0].memory).toEqual({});
  });

  it('handles value deletion (undefined) in stageWrites', () => {
    const tree = makeRuntimeNode('A', {
      stageWrites: { temp: 'data', keep: true },
      next: makeRuntimeNode('B', {
        stageWrites: { temp: undefined },
      }),
    });
    const snaps = toVisualizationSnapshots(makeRuntime(tree));
    expect(snaps[0].memory).toEqual({ temp: 'data', keep: true });
    expect(snaps[1].memory).toEqual({ keep: true });
  });
});

describe('createSnapshots', () => {
  it('passes through description and subflowId', () => {
    const snaps = createSnapshots([
      { name: 'A', description: 'Does A', subflowId: 'sf-a' },
      { name: 'B' },
    ]);
    expect(snaps[0].description).toBe('Does A');
    expect(snaps[0].subflowId).toBe('sf-a');
    expect(snaps[1].description).toBeUndefined();
    expect(snaps[1].subflowId).toBeUndefined();
  });

  it('does not add description key when not provided', () => {
    const snaps = createSnapshots([{ name: 'X' }]);
    expect('description' in snaps[0]).toBe(false);
    expect('subflowId' in snaps[0]).toBe(false);
  });

  it('preserves timing accumulation with new fields', () => {
    const snaps = createSnapshots([
      { name: 'A', durationMs: 10, description: 'First' },
      { name: 'B', durationMs: 20, subflowId: 'sf-b' },
    ]);
    expect(snaps[0].startMs).toBe(0);
    expect(snaps[1].startMs).toBe(10);
    expect(snaps[1].subflowId).toBe('sf-b');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mergeWritePatch — the cumulative-memory deep-merge helper
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeWritePatch', () => {
  it('deep-merges nested object patches, retaining base siblings per level', () => {
    const base = { name: 'Ada', address: { zip: '90210', city: 'LA' } };
    const patch = { address: { zip: '94016' } };
    expect(mergeWritePatch(base, patch)).toEqual({
      name: 'Ada',
      address: { zip: '94016', city: 'LA' },
    });
  });

  it('patch keys win on conflicts; primitives replace', () => {
    expect(mergeWritePatch({ a: 1, b: 2 }, { a: 9 })).toEqual({ a: 9, b: 2 });
    expect(mergeWritePatch({ a: { x: 1 } }, { a: 'scalar' })).toEqual({ a: 'scalar' });
    expect(mergeWritePatch('scalar', { a: 1 })).toEqual({ a: 1 });
    expect(mergeWritePatch({ a: 1 }, null)).toBeNull();
    expect(mergeWritePatch({ a: 1 }, 7)).toBe(7);
  });

  it('arrays REPLACE (documented divergence from engine union-merge)', () => {
    expect(mergeWritePatch([1, 2, 3], [4])).toEqual([4]);
    expect(mergeWritePatch({ tags: ['a', 'b'] }, { tags: ['c'] })).toEqual({ tags: ['c'] });
    // empty array clears (consistent with replace semantics)
    expect(mergeWritePatch({ tags: ['a'] }, { tags: [] })).toEqual({ tags: [] });
    // array/object kind mismatch: patch wins
    expect(mergeWritePatch({ a: [1, 2] }, { a: { x: 1 } })).toEqual({ a: { x: 1 } });
    expect(mergeWritePatch({ a: { x: 1 } }, { a: [1] })).toEqual({ a: [1] });
  });

  it('summary markers are atomic — passed through, never recursed into', () => {
    const marker = { __writeSummary: true, type: 'object', size: 3 };
    // marker patch replaces wholesale
    expect(mergeWritePatch({ a: { deep: 1 } }, { a: marker })).toEqual({ a: marker });
    // nothing merges INTO a marker — patch replaces it
    expect(mergeWritePatch({ a: marker }, { a: { deep: 2 } })).toEqual({ a: { deep: 2 } });
    // read markers honored too
    const readMarker = { __readSummary: true, type: 'string', size: 5 };
    expect(mergeWritePatch({ a: 1 }, { a: readMarker })).toEqual({ a: readMarker });
  });

  it('never mutates base or patch (pure)', () => {
    const base = { keep: { x: 1 }, addr: { zip: 'old' } };
    const patch = { addr: { zip: 'new' } };
    const out = mergeWritePatch(base, patch) as Record<string, unknown>;
    expect(base.addr.zip).toBe('old');
    expect(patch.addr.zip).toBe('new');
    // untouched branches may share refs (copy-on-write happens on the
    // mutating side), but the merged branch is a fresh object
    expect(out.addr).not.toBe(base.addr);
    expect(out.addr).not.toBe(patch.addr);
  });

  it('ignores prototype-pollution keys in patches', () => {
    const evil = JSON.parse('{"__proto__": {"polluted": true}, "ok": 1}');
    const out = mergeWritePatch({}, evil) as Record<string, unknown>;
    expect(out.ok).toBe(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cumulative memory — commit-bundle replay + stageWrites fallback
// ─────────────────────────────────────────────────────────────────────────────

describe('toVisualizationSnapshots — cumulative memory accumulation', () => {
  const DELIM = '\u001F';

  it('replays set-then-merge commit bundles so deep-write patches keep siblings', () => {
    const tree = makeRuntimeNode('enrich', {
      runtimeStageId: 'enrich#0',
      // collapsed stageWrites (last write per key) — the lossy shape
      stageWrites: { applicant: { address: { zip: '94016' } } },
    });
    const runtime = {
      sharedState: {},
      executionTree: tree,
      commitLog: [
        {
          runtimeStageId: 'enrich#0',
          overwrite: { applicant: { name: 'Ada', address: { zip: '90210' } } },
          updates: { applicant: { address: { zip: '94016' } } },
          trace: [
            { path: 'applicant', verb: 'set' },
            { path: 'applicant', verb: 'merge' },
          ],
        },
      ],
    };
    const snaps = toVisualizationSnapshots(runtime);
    expect(snaps[0].memory.applicant).toEqual({ name: 'Ada', address: { zip: '94016' } });
  });

  it('honors trace ORDER — a set after a merge wins outright', () => {
    const tree = makeRuntimeNode('s', { runtimeStageId: 's#0' });
    const runtime = {
      sharedState: {},
      executionTree: tree,
      commitLog: [
        {
          runtimeStageId: 's#0',
          overwrite: { cfg: { fresh: true } },
          updates: { cfg: { stale: 1 } },
          trace: [
            { path: 'cfg', verb: 'merge' },
            { path: 'cfg', verb: 'set' },
          ],
        },
      ],
    };
    const snaps = toVisualizationSnapshots(runtime);
    expect(snaps[0].memory.cfg).toEqual({ fresh: true }); // no stale re-merge
  });

  it('replays deep delimited trace paths (fork-child namespaced writes)', () => {
    const tree = makeRuntimeNode('branch', { runtimeStageId: 'branch#2' });
    const runtime = {
      sharedState: {},
      executionTree: tree,
      commitLog: [
        {
          runtimeStageId: 'branch#2',
          overwrite: { runs: { branch: { risk: 'high' } } },
          updates: {},
          trace: [{ path: `runs${DELIM}branch${DELIM}risk`, verb: 'set' }],
        },
      ],
    };
    const snaps = toVisualizationSnapshots(runtime);
    expect(snaps[0].memory.runs).toEqual({ branch: { risk: 'high' } });
  });

  it('applies every bundle for a runtimeStageId in log order (multi-commit executions)', () => {
    const tree = makeRuntimeNode('mount', { runtimeStageId: 'mount#1' });
    const runtime = {
      sharedState: {},
      executionTree: tree,
      commitLog: [
        {
          runtimeStageId: 'mount#1',
          overwrite: { text: 'hello' },
          updates: {},
          trace: [{ path: 'text', verb: 'set' }],
        },
        // empty boundary bundle (real engine emits these) — must be a no-op
        { runtimeStageId: 'mount#1', overwrite: {}, updates: {}, trace: [] },
      ],
    };
    const snaps = toVisualizationSnapshots(runtime);
    expect(snaps[0].memory).toEqual({ text: 'hello' });
  });

  it('commit replay never corrupts an earlier stage snapshot (copy-on-write)', () => {
    const tree = makeRuntimeNode('a', {
      runtimeStageId: 'a#0',
      next: makeRuntimeNode('b', { runtimeStageId: 'b#1' }),
    });
    const runtime = {
      sharedState: {},
      executionTree: tree,
      commitLog: [
        {
          runtimeStageId: 'a#0',
          overwrite: { obj: { deep: { v: 1 } } },
          updates: {},
          trace: [{ path: 'obj', verb: 'set' }],
        },
        {
          runtimeStageId: 'b#1',
          overwrite: { obj: { deep: { v: 2 } } },
          updates: {},
          trace: [{ path: `obj${DELIM}deep${DELIM}v`, verb: 'set' }],
        },
      ],
    };
    const snaps = toVisualizationSnapshots(runtime);
    expect((snaps[0].memory.obj as any).deep.v).toBe(1); // untouched by b's deep set
    expect((snaps[1].memory.obj as any).deep.v).toBe(2);
  });

  it('falls back to stageWrites with deep-merge when no commit bundle matches', () => {
    const tree = makeRuntimeNode('a', {
      stageWrites: { applicant: { name: 'Ada', address: { zip: '90210' } } },
      next: makeRuntimeNode('b', {
        stageWrites: { applicant: { address: { zip: '94016' } } },
      }),
    });
    const snaps = toVisualizationSnapshots(makeRuntime(tree));
    // cross-stage deep-write patch no longer erases the sibling
    expect(snaps[1].memory.applicant).toEqual({ name: 'Ada', address: { zip: '94016' } });
  });

  it('stageWrites fallback: undefined still deletes; markers pass through', () => {
    const marker = { __writeSummary: true, type: 'object', size: 2 };
    const tree = makeRuntimeNode('a', {
      stageWrites: { gone: 'soon', big: { real: 'data' } },
      next: makeRuntimeNode('b', { stageWrites: { gone: undefined, big: marker } }),
    });
    const snaps = toVisualizationSnapshots(makeRuntime(tree));
    expect('gone' in snaps[1].memory).toBe(false);
    expect(snaps[1].memory.big).toEqual(marker);
  });

  it('subflow drill-down histories without runtimeStageIds keep working (fallback path)', () => {
    // mirrors subflowResultToSnapshots: history bundles carry runtimeStageId ''
    const tree = makeRuntimeNode('inner', {
      stageWrites: { text: 'hello' },
    });
    const runtime = {
      sharedState: {},
      executionTree: tree,
      commitLog: [
        { runtimeStageId: '', overwrite: { text: 'hello' }, updates: {}, trace: [{ path: 'text', verb: 'set' }] },
      ],
    };
    const snaps = toVisualizationSnapshots(runtime);
    expect(snaps[0].memory).toEqual({ text: 'hello' });
  });
});
