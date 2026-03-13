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
      logs: { key: 'value' },
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
