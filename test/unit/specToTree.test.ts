import { describe, it, expect } from 'vitest';
import { specToTree } from '../../src/components/FlowchartView/SubflowTree';
import type { SpecNode } from '../../src/components/FlowchartView/specToReactFlow';

function makeNode(name: string, overrides?: Partial<SpecNode>): SpecNode {
  return { name, ...overrides };
}

describe('specToTree', () => {
  it('converts a single node', () => {
    const tree = specToTree(makeNode('A'));
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('A');
    expect(tree[0].isSubflow).toBe(false);
  });

  it('follows linear .next chain', () => {
    const spec = makeNode('A', {
      next: makeNode('B', { next: makeNode('C') }),
    });
    const tree = specToTree(spec);
    expect(tree.map((e) => e.name)).toEqual(['A', 'B', 'C']);
  });

  it('walks fork children', () => {
    const spec = makeNode('Root', {
      children: [makeNode('BranchA'), makeNode('BranchB')],
    });
    const tree = specToTree(spec);
    expect(tree.map((e) => e.name)).toEqual(['Root', 'BranchA', 'BranchB']);
  });

  it('handles fork children followed by .next', () => {
    const spec = makeNode('Fork', {
      children: [makeNode('Left'), makeNode('Right')],
      next: makeNode('Merge'),
    });
    const tree = specToTree(spec);
    expect(tree.map((e) => e.name)).toEqual(['Fork', 'Left', 'Right', 'Merge']);
  });

  it('preserves description and subflowId', () => {
    const spec = makeNode('Stage', {
      description: 'Does things',
      subflowId: 'sf-1',
    });
    const tree = specToTree(spec);
    expect(tree[0].description).toBe('Does things');
    expect(tree[0].subflowId).toBe('sf-1');
  });

  it('marks subflow roots and recurses into subflowStructure', () => {
    const innerSpec = makeNode('Inner', { next: makeNode('InnerNext') });
    const spec = makeNode('Outer', {
      next: makeNode('SubflowNode', {
        isSubflowRoot: true,
        subflowStructure: innerSpec,
        next: makeNode('After'),
      }),
    });
    const tree = specToTree(spec);

    // Outer level: Outer → SubflowNode → After
    expect(tree.map((e) => e.name)).toEqual(['Outer', 'SubflowNode', 'After']);
    expect(tree[1].isSubflow).toBe(true);

    // SubflowNode has children from recursion
    expect(tree[1].children).toBeDefined();
    expect(tree[1].children!.map((c) => c.name)).toEqual(['Inner', 'InnerNext']);
  });

  it('does not crash on graphs with loopTarget (cycle guard)', () => {
    // Simulate a loop: A → B → C, where C.next points back to A
    const nodeA = makeNode('A');
    const nodeC = makeNode('C', { loopTarget: 'A' });
    const nodeB = makeNode('B', { next: nodeC });
    nodeA.next = nodeB;
    // Create the cycle: C.next = A (this would infinite-loop without a seen guard)
    nodeC.next = nodeA;

    const tree = specToTree(nodeA);
    // Should visit A, B, C — and stop (not revisit A)
    expect(tree.map((e) => e.name)).toEqual(['A', 'B', 'C']);
  });

  it('handles empty subflowStructure gracefully', () => {
    const spec = makeNode('Sub', {
      isSubflowRoot: true,
      subflowStructure: undefined,
    });
    const tree = specToTree(spec);
    expect(tree[0].isSubflow).toBe(true);
    expect(tree[0].children).toBeUndefined();
  });

  it('handles deeply nested subflows', () => {
    const level2 = makeNode('L2Stage');
    const level1 = makeNode('L1Sub', {
      isSubflowRoot: true,
      subflowStructure: level2,
    });
    const root = makeNode('Root', {
      next: makeNode('TopSub', {
        isSubflowRoot: true,
        subflowStructure: level1,
      }),
    });

    const tree = specToTree(root);
    expect(tree[1].children![0].name).toBe('L1Sub');
    expect(tree[1].children![0].children![0].name).toBe('L2Stage');
  });

  it('deduplicates nodes that appear in multiple branches', () => {
    // Fork with both branches pointing to same merge node
    const merge = makeNode('Merge');
    const spec = makeNode('Fork', {
      children: [
        makeNode('Left', { next: merge }),
        makeNode('Right', { next: merge }),
      ],
    });
    const tree = specToTree(spec);
    const names = tree.map((e) => e.name);
    // Merge should appear only once
    expect(names.filter((n) => n === 'Merge')).toHaveLength(1);
  });
});
