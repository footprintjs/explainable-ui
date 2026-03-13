import { describe, it, expect } from 'vitest';
import { toVisualizationSnapshots, createSnapshots } from '../../src/adapters/fromRuntimeSnapshot';

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
