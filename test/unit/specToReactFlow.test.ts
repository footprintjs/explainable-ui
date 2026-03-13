import { describe, it, expect } from 'vitest';
import { specToReactFlow } from '../../src/components/FlowchartView/specToReactFlow';
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
