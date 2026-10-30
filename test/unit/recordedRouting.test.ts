import { expect, it } from "vitest";
import { recordedRoutePath, recordedVisualBounds, routeRecordedRelationships } from "../../src/components/GroupedFlowDiagram/recordedRouting";
import { projectGroupedFlowDiagram } from "../../src/components/GroupedFlowDiagram/layout";
import { projectRecordedRelationships } from "../../src/components/GroupedFlowDiagram/relationships";
import type { GroupedFlowDiagramModel, PositionedFlowDiagramNode } from "../../src/components/GroupedFlowDiagram/types";

const item = (id: string, x: number, y: number, width = 180, height = 148, extra: Partial<PositionedFlowDiagramNode> = {}): PositionedFlowDiagramNode => ({
  node: { id, label: id }, position: { x, y }, width, height, state: "completed", expanded: false, childCount: 0,
  recordedIssueCount: 0, containsSelection: false, highlighted: false, ...extra,
});
const model = (nodes: PositionedFlowDiagramNode[], direction: "LR" | "TB" = "LR"): GroupedFlowDiagramModel => ({
  definition: { nodes: nodes.map(item => item.node), edges: [] }, nodeStates: Object.fromEntries(nodes.map(item => [item.node.id, item.state])),
  nodes, edges: [], direction, width: 900, height: 600, expandedGroupIds: nodes.filter(item => item.expanded).map(item => item.node.id),
});
const link = (id = "link", source = "source", target = "root") => ({ relationship: { id, source, target, kind: "data" as const,
  attribution: "recorded-read" as const, direction: "backward" as const, evidence: ["proof"] }, source, target, collapsed: false });
type Box = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };
function crosses(a: Point, b: Point, box: Box) {
  return a.x === b.x ? a.x > box.x && a.x < box.x + box.width && Math.max(a.y, b.y) > box.y && Math.min(a.y, b.y) < box.y + box.height
    : a.y === b.y && a.y > box.y && a.y < box.y + box.height && Math.max(a.x, b.x) > box.x && Math.min(a.x, b.x) < box.x + box.width;
}
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
function assertClear(route: { points: readonly Point[]; label: Point & { width: number; height: number } }, obstacles: Box[]) {
  expect(route.points.length).toBeGreaterThan(2);
  for (let index = 1; index < route.points.length; index++) {
    const a = route.points[index - 1]!, b = route.points[index]!;
    expect(a.x === b.x || a.y === b.y).toBe(true);
    for (const box of obstacles) expect(crosses(a, b, box)).toBe(false);
  }
  const label = { x: route.label.x - route.label.width / 2, y: route.label.y - route.label.height / 2, width: route.label.width, height: route.label.height };
  for (const box of obstacles) expect(overlaps(label, box)).toBe(false);
}

it.each(["LR", "TB"] as const)("routes %s backward connections around real intervening card rectangles, not through their text", direction => {
  const nodes = [item("root", 20, 160), item("blocker", 300, 100, 180, 250), item("source", 620, 160)];
  if (direction === "TB") for (const node of nodes) Object.assign(node, { position: { x: node.position.y, y: node.position.x }, width: node.height, height: node.width });
  const source = model(nodes, direction), before = JSON.stringify(source), planned = routeRecordedRelationships([link()], source);
  expect(planned.undrawn).toBe(0); const route = planned.routes.get("link")!; expect(route).toBeTruthy();
  assertClear(route, nodes.map(node => ({ ...node.position, width: node.width, height: node.height })));
  expect(JSON.stringify(source)).toBe(before);
});

it("reserves expanded-group headers and supported-cause badges while using absolute nested child positions", () => {
  const group = item("group", 100, 50, 700, 350, { node: { id: "group", label: "Work", kind: "group" }, expanded: true, childCount: 3 });
  const root = item("root", 20, 110, 180, 148, { node: { id: "root", label: "Rates", parentId: "group" }, parentId: "group", isRootCause: true });
  const source = item("source", 460, 110, 180, 148, { node: { id: "source", label: "Failed", parentId: "group" }, parentId: "group" });
  const obstacle = item("blocker", 240, 110, 180, 148, { node: { id: "blocker", label: "Other", parentId: "group" }, parentId: "group" });
  const planned = routeRecordedRelationships([link()], model([group, root, obstacle, source])); expect(planned.undrawn).toBe(0);
  const route = planned.routes.get("link")!; expect(route.sourceSide).not.toBe("top"); expect(route.targetSide).not.toBe("top");
  assertClear(route, [{ x: 100, y: 38, width: 700, height: 96 }, { x: 130, y: 148, width: 135, height: 28 },
    ...[root, source, obstacle].map(node => ({ x: node.position.x + 100, y: node.position.y + 50, width: node.width, height: node.height }))]);
});

it("allocates ID-stable separate fan-in/out and parallel captions without discarding evidence identity", () => {
  const source = model([item("root", 20, 160), item("other", 20, 400), item("source", 500, 260)]);
  const links = [link("read"), { ...link("rule"), relationship: { ...link("rule").relationship, kind: "control" as const, attribution: "recorded-control" as const } }, link("other", "source", "other")];
  const first = routeRecordedRelationships(links, source), reversed = routeRecordedRelationships([...links].reverse(), source);
  expect(first.undrawn).toBe(0); expect([...first.routes]).toEqual([...reversed.routes]);
  const routes = [...first.routes.values()]; expect(new Set(routes.map(route => JSON.stringify(route.points))).size).toBe(3);
  for (let index = 0; index < routes.length; index++) for (let other = index + 1; other < routes.length; other++) {
    const a = routes[index]!.label, b = routes[other]!.label;
    expect(overlaps({ x: a.x - a.width / 2, y: a.y - a.height / 2, width: a.width, height: a.height }, { x: b.x - b.width / 2, y: b.y - b.height / 2, width: b.width, height: b.height })).toBe(false);
  }
});

it("routes collapsed representatives with the original relationship ID and leaves the structural model untouched", () => {
  const definition = { nodes: [{ id: "group", label: "Work", kind: "group" as const }, { id: "root", label: "Rates", parentId: "group" }, { id: "source", label: "Failed" }], edges: [] };
  const source = projectGroupedFlowDiagram(definition).model!, links = projectRecordedRelationships([link().relationship], source)!;
  const before = JSON.stringify(source), planned = routeRecordedRelationships(links, source);
  expect(planned.routes.has("link")).toBe(true); expect(planned.undrawn).toBe(0); expect(JSON.stringify(source)).toBe(before);
  expect(links[0]).toMatchObject({ source: "source", target: "group", collapsed: true, relationship: { id: "link", target: "root" } });
});

it("stops safely at the admitted geometry/cost caps without inventing a fallback path", () => {
  const invalid = model([item("source", Number.NaN, 0), item("root", 20, 160)]);
  expect(routeRecordedRelationships([link()], invalid)).toMatchObject({ undrawn: 1 });
  const tooMany = Array.from({ length: 513 }, (_, index) => link(`edge-${index}`));
  const refused = routeRecordedRelationships(tooMany, model([item("source", 500, 0), item("root", 20, 160)]));
  expect(refused.routes.size).toBe(0); expect(refused.undrawn).toBe(513); expect(refused.work).toBeLessThanOrEqual(2_000_000);
});

it("keeps self-links and reverse-pair arrows directed, distinct and outside their card bodies", () => {
  const nodes = [item("root", 20, 160, 180, 148, { isRootCause: true }), item("source", 500, 260)];
  const links = [link("self", "root", "root"), link("backward"), link("reverse", "root", "source")];
  const planned = routeRecordedRelationships(links, model(nodes)); expect(planned.undrawn).toBe(0);
  expect(new Set([...planned.routes.values()].map(route => JSON.stringify(route.points))).size).toBe(3);
  for (const route of planned.routes.values()) assertClear(route, nodes.map(node => ({ ...node.position, width: node.width, height: node.height })));
  const self = planned.routes.get("self")!; expect(self.sourceSide).not.toBe(self.targetSide);
  expect(self.sourceSide).not.toBe("top"); expect(self.targetSide).not.toBe("top");
});

it("bounds work for a dense admitted graph and reports undrawn links as presentation limits only", () => {
  const nodes = Array.from({ length: 64 }, (_, index) => item(`item-${index}`, index % 8 * 240, Math.floor(index / 8) * 220));
  const links = Array.from({ length: 512 }, (_, index) => link(`link-${String(index).padStart(3, "0")}`, `item-${index % 64}`, `item-${(index * 13 + 7) % 64}`));
  const source = model(nodes), before = JSON.stringify(source), planned = routeRecordedRelationships(links, source);
  expect(planned.work).toBeLessThanOrEqual(2_000_000); expect(planned.undrawn).toBeGreaterThan(0);
  expect(planned.routes.size + planned.undrawn).toBe(512); expect(JSON.stringify(source)).toBe(before);
});

it.each(["LR", "TB"] as const)("preserves normal-facing %s endpoint stubs when measured handles independently differ from a shared-axis plan", direction => {
  const points = [{ x: 400, y: 80 }, { x: 382, y: 80 }, { x: 118, y: 80 }, { x: 100, y: 80 }];
  if (direction === "TB") for (const p of points) [p.x, p.y] = [p.y, p.x];
  const source = direction === "LR" ? { x: 400.5, y: 80.5 } : { x: 80.5, y: 400.5 }, target = direction === "LR" ? { x: 99.5, y: 79.5 } : { x: 79.5, y: 99.5 };
  const path = recordedRoutePath({ points, sourceSide: direction === "LR" ? "left" : "top", targetSide: direction === "LR" ? "right" : "bottom", label: { x: 250, y: 80, width: 48, height: 22 } }, source, target);
  const commands = [...path.matchAll(/([MLQ])([^MLQ]+)/g)].map(match => ({ type: match[1], coordinates: match[2]!.trim().split(/[ ,]+/).map(Number) }));
  const first = commands[1]!.coordinates, last = commands[commands.length - 2]!.coordinates.slice(-2);
  if (direction === "LR") { expect(first[1]).toBe(source.y); expect(last[1]).toBe(target.y); }
  else { expect(first[0]).toBe(source.x); expect(last[0]).toBe(target.x); }
  expect(path).not.toContain("NaN");
});

it("fits route/caption paint for overview or both endpoint targets while a single-root focus keeps only its badge", () => {
  const nodes = [item("root", 20, 160, 180, 148, { isRootCause: true }), item("source", 500, 260)], links = [link()];
  const plan = routeRecordedRelationships(links, model(nodes)), route = plan.routes.get("link")!;
  const overview = recordedVisualBounds(plan, links)!, together = recordedVisualBounds(plan, links, ["source", "root"]);
  expect(together).toEqual(overview);
  expect(overview.y + overview.height).toBeGreaterThanOrEqual(route.label.y + route.label.height / 2 + 6);
  expect(recordedVisualBounds(plan, links, ["root"])).toEqual({ x: 20, y: 144, width: 198, height: 164 });
  expect(recordedVisualBounds(plan, links, ["source"])).toBeUndefined();
});
