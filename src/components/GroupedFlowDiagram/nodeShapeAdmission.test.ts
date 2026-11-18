import { describe, expect, it } from "vitest";
import { projectGroupedFlowDiagram } from './layout';

function project(details: object) {
  return projectGroupedFlowDiagram({ nodes: [{ id: 'n', label: 'A recorded step', ...details }], edges: [] });
}

describe('host-selected diagram shapes', () => {
  it.each([
    ['decision', 'diamond', 248, 184], ['step', 'parcel', 212, 164], ['step', 'document', 194, 164],
  ] as const)('preserves %s with a %s outline and its measured layout space', (kind, shape, width, height) => {
    const model = project({ kind, shape }).model!;
    expect(model.definition.nodes[0]).toMatchObject({ kind, shape });
    expect(model.nodes[0]).toMatchObject({ width, height, state: 'unknown' });
    expect(model.edges).toHaveLength(0);
  });
  it.each(["LR", "TB"] as const)("lays out two diamonds at different positions in %s", direction => {
    const nodes = ["first", "second"].map(id => ({ id, label: id, kind: "decision" as const, shape: "diamond" as const }));
    const definition = { nodes, edges: [{ id: "next", source: "first", target: "second" }] };
    const [first, second] = projectGroupedFlowDiagram(definition, { direction }).model!.nodes;
    if (direction === "LR") expect(second!.position.x).toBeGreaterThanOrEqual(first!.position.x + first!.width);
    else expect(second!.position.y).toBeGreaterThanOrEqual(first!.position.y + first!.height);
  });
  it('keeps the original decision card dimensions if the host omits a shape', () => {
    expect(project({ kind: 'decision' }).model?.nodes[0]).toMatchObject({ width: 180, height: 172 });
  });
  it.each([{ kind: 'step', shape: 'diamond' }, { kind: 'decision', shape: 'parcel' }, { kind: 'group', shape: 'document' }, { shape: 'url(example)' }])('gives repair instructions for incompatible shapes', details => {
    expect(project(details).error).toMatch(/omit the shape/i);
  });
  it('declines an accessor without invoking it', () => {
    let calls = 0;
    const node = { id: 'n', label: 'Example', get shape() { calls++; return 'document' as const; } };
    expect(projectGroupedFlowDiagram({nodes: [node], edges: []}).error).toMatch(/omit the shape/i);
    expect(calls).toBe(0);
  });
});
