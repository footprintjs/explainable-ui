import { describe, it, expect } from 'vitest';
import { specToTree } from '../../src/components/FlowchartView/SubflowTree';
import type { SpecNode } from '../../src/components/FlowchartView/specToReactFlow';

function makeNode(name: string, overrides?: Partial<SpecNode>): SpecNode {
  return { name, ...overrides };
}

describe('specToTree — boundary/edge cases', () => {
  it('handles node with empty name (uses id fallback)', () => {
    const spec: SpecNode = { name: '', id: 'node-1' };
    const tree = specToTree(spec);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('');
  });

  it('handles self-referential .next (immediate cycle)', () => {
    const spec = makeNode('Loop');
    spec.next = spec; // A → A
    const tree = specToTree(spec);
    // Should visit once, not infinite loop
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('Loop');
  });

  it('handles two-node cycle via .next', () => {
    const a = makeNode('A');
    const b = makeNode('B');
    a.next = b;
    b.next = a;
    const tree = specToTree(a);
    expect(tree.map((e) => e.name)).toEqual(['A', 'B']);
  });

  it('handles cycle through fork children', () => {
    const root = makeNode('Root');
    root.children = [makeNode('Child', { next: root })];
    const tree = specToTree(root);
    expect(tree.map((e) => e.name)).toEqual(['Root', 'Child']);
  });

  it('handles large linear chain without stack overflow', () => {
    let current = makeNode('node-0');
    const root = current;
    for (let i = 1; i < 500; i++) {
      const next = makeNode(`node-${i}`);
      current.next = next;
      current = next;
    }
    const tree = specToTree(root);
    expect(tree).toHaveLength(500);
    expect(tree[0].name).toBe('node-0');
    expect(tree[499].name).toBe('node-499');
  });

  it('handles diamond topology (fork → merge)', () => {
    //     Root
    //    /    \
    //  Left  Right
    //    \    /
    //    Merge
    const merge = makeNode('Merge');
    const spec = makeNode('Root', {
      children: [
        makeNode('Left', { next: merge }),
        makeNode('Right', { next: merge }),
      ],
    });
    const tree = specToTree(spec);
    // Merge appears only once
    const mergeEntries = tree.filter((e) => e.name === 'Merge');
    expect(mergeEntries).toHaveLength(1);
  });

  it('handles subflow whose inner structure has a loop', () => {
    const innerA = makeNode('InnerA');
    const innerB = makeNode('InnerB', { loopTarget: 'InnerA' });
    innerA.next = innerB;
    innerB.next = innerA; // cycle

    const spec = makeNode('Outer', {
      next: makeNode('Sub', {
        isSubflowRoot: true,
        subflowStructure: innerA,
      }),
    });

    const tree = specToTree(spec);
    expect(tree[1].children!.map((c) => c.name)).toEqual(['InnerA', 'InnerB']);
  });

  it('undefined children/next are safely skipped', () => {
    const spec = makeNode('Solo', {
      children: undefined,
      next: undefined,
    });
    const tree = specToTree(spec);
    expect(tree).toHaveLength(1);
  });

  it('empty children array is handled', () => {
    const spec = makeNode('Empty', { children: [] });
    const tree = specToTree(spec);
    expect(tree).toHaveLength(1);
  });
});
