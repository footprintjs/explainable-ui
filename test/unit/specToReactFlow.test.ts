import { describe, it, expect } from 'vitest';
import { specToReactFlow, specToLayout } from '../../src/components/FlowchartView/specToReactFlow';
import type { SpecNode } from '../../src/components/FlowchartView/specToReactFlow';

function makeNode(name: string, overrides?: Partial<SpecNode>): SpecNode {
  return { name, ...overrides };
}

describe('specToReactFlow — description and subflowId', () => {
  it('passes description through to node data', () => {
    const spec = makeNode('Stage', { description: 'Validate input data' });
    const { nodes } = specToReactFlow(spec);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].data.description).toBe('Validate input data');
  });

  it('passes subflowId through to node data', () => {
    const spec = makeNode('Payment', { subflowId: 'sf-payment' });
    const { nodes } = specToReactFlow(spec);
    expect(nodes[0].data.subflowId).toBe('sf-payment');
  });

  it('sets isSubflow: true for subflow root nodes', () => {
    const spec = makeNode('Sub', {
      isSubflowRoot: true,
      subflowStructure: makeNode('Inner'),
    });
    const { nodes } = specToReactFlow(spec);
    expect(nodes[0].data.isSubflow).toBe(true);
  });

  it('preserves undefined when description/subflowId not set', () => {
    const spec = makeNode('Plain');
    const { nodes } = specToReactFlow(spec);
    expect(nodes[0].data.description).toBeUndefined();
    expect(nodes[0].data.subflowId).toBeUndefined();
  });

  it('handles chain with mixed description/subflowId', () => {
    const spec = makeNode('A', {
      description: 'First',
      next: makeNode('B', {
        subflowId: 'sf-b',
        next: makeNode('C', { description: 'Third', subflowId: 'sf-c' }),
      }),
    });
    const { nodes } = specToReactFlow(spec);
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n.data]));
    expect(byId['A'].description).toBe('First');
    expect(byId['A'].subflowId).toBeUndefined();
    expect(byId['B'].subflowId).toBe('sf-b');
    expect(byId['C'].description).toBe('Third');
    expect(byId['C'].subflowId).toBe('sf-c');
  });

  it('does not recurse into subflowStructure at the top level', () => {
    // specToReactFlow only renders the current level — subflowStructure
    // is used by useSubflowNavigation for drill-down
    const spec = makeNode('Sub', {
      isSubflowRoot: true,
      subflowStructure: makeNode('Inner'),
      next: makeNode('After'),
    });
    const { nodes } = specToReactFlow(spec);
    const names = nodes.map((n) => n.id);
    expect(names).toContain('Sub');
    expect(names).toContain('After');
    expect(names).not.toContain('Inner');
  });
});

describe('specToLayout — loop edges', () => {
  it('creates a loop edge when loopTarget is set', () => {
    const spec = makeNode('Init', {
      id: 'init',
      next: makeNode('Process', {
        id: 'process',
        next: makeNode('Evaluate', {
          id: 'evaluate',
          loopTarget: 'process',
          next: { name: 'process', id: 'process', type: 'stage' } as SpecNode,
        }),
      }),
    });
    const { edges } = specToLayout(spec);
    const loopEdges = edges.filter((e) => e.isLoop);
    expect(loopEdges.length).toBeGreaterThanOrEqual(1);
  });

  it('loop edge target uses stageId (not resolved name)', () => {
    const spec = makeNode('Init', {
      id: 'init',
      next: makeNode('CallAPI', {
        id: 'call-api',
        next: makeNode('EvaluateResult', {
          id: 'evaluate-result',
          loopTarget: 'call-api',
          next: { name: 'call-api', id: 'call-api', type: 'stage' } as SpecNode,
        }),
      }),
    });
    const { edges } = specToLayout(spec);
    const loopEdges = edges.filter((e) => e.isLoop);
    const targets = loopEdges.map((e) => e.target);
    expect(targets).toContain('call-api');
    expect(targets).not.toContain('CallAPI');
  });

  it('loop edge has isLoop: true and label "loop"', () => {
    const spec = makeNode('A', {
      id: 'a',
      next: makeNode('B', {
        id: 'b',
        loopTarget: 'a',
        next: { name: 'a', id: 'a', type: 'stage' } as SpecNode,
      }),
    });
    const { edges } = specToLayout(spec);
    const loopEdge = edges.find((e) => e.isLoop);
    expect(loopEdge).toBeDefined();
    expect(loopEdge!.label).toBe('loop');
    expect(loopEdge!.isLoop).toBe(true);
  });

  it('loop does not create excessive duplicate edges', () => {
    const spec = makeNode('A', {
      id: 'a',
      next: makeNode('B', {
        id: 'b',
        loopTarget: 'a',
        next: { name: 'a', id: 'a', type: 'stage' } as SpecNode,
      }),
    });
    const { edges } = specToLayout(spec);
    const loopEdges = edges.filter((e) => e.isLoop && e.target === 'a');
    expect(loopEdges.length).toBeGreaterThanOrEqual(1);
    expect(loopEdges.length).toBeLessThanOrEqual(2);
  });

  it('non-loop edges have isLoop: false', () => {
    const spec = makeNode('A', {
      id: 'a',
      next: makeNode('B', { id: 'b' }),
    });
    const { edges } = specToLayout(spec);
    expect(edges.length).toBe(1);
    expect(edges[0].isLoop).toBe(false);
  });

  it('three-node chain produces 2 non-loop edges', () => {
    const spec = makeNode('A', {
      id: 'a',
      next: makeNode('B', {
        id: 'b',
        next: makeNode('C', { id: 'c' }),
      }),
    });
    const { edges, nodes } = specToLayout(spec);
    expect(nodes).toHaveLength(3);
    expect(edges.filter((e) => !e.isLoop)).toHaveLength(2);
  });

  it('loop edge renders as dashed in specToReactFlow output', () => {
    const spec = makeNode('A', {
      id: 'a',
      next: makeNode('B', {
        id: 'b',
        loopTarget: 'a',
        next: { name: 'a', id: 'a', type: 'stage' } as SpecNode,
      }),
    });
    const { edges } = specToReactFlow(spec);
    // Loop edges should have sourceHandle: "loop-source"
    const loopEdge = edges.find((e) => e.sourceHandle === 'loop-source');
    expect(loopEdge).toBeDefined();
    expect(loopEdge!.target).toBe('a');
  });
});
