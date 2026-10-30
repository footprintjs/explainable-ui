import { getSmoothStepPath, Position } from "@xyflow/react";
import type { GroupedFlowDiagramModel, PositionedFlowDiagramNode } from "./types";
import type { ProjectedRecordedRelationship } from "./relationships";

type Point = { x: number; y: number };
type Box = Point & { width: number; height: number; owner?: string };
export type RecordedSide = "left" | "right" | "top" | "bottom";
export interface RecordedPort { readonly id: string; readonly type: "source" | "target"; readonly side: RecordedSide; readonly offset: number }
export interface RecordedRoute {
  readonly points: readonly Point[];
  readonly sourceSide: RecordedSide;
  readonly targetSide: RecordedSide;
  readonly sourcePort: RecordedPort;
  readonly targetPort: RecordedPort;
  readonly label: Point & { width: number; height: number };
}
const SIDE = { left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom };
const HALO = 16, STUB = 18, MAX_WORK = 2_000_000, MAX_VISITS = 100_000;
const intersects = (a: Box, b: Box) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const point = (box: Box, side: RecordedSide, offset?: number): Point => ({ x: side === "left" ? box.x : side === "right" ? box.x + box.width : box.x + (offset ?? box.width / 2),
  y: side === "top" ? box.y : side === "bottom" ? box.y + box.height : box.y + (offset ?? box.height / 2) });
const escape = (p: Point, side: RecordedSide): Point => ({ x: p.x + (side === "left" ? -STUB : side === "right" ? STUB : 0), y: p.y + (side === "top" ? -STUB : side === "bottom" ? STUB : 0) });
const crossing = (a: Point, b: Point, box: Box) => a.x === b.x
  ? a.x > box.x && a.x < box.x + box.width && Math.max(a.y, b.y) > box.y && Math.min(a.y, b.y) < box.y + box.height
  : a.y > box.y && a.y < box.y + box.height && Math.max(a.x, b.x) > box.x && Math.min(a.x, b.x) < box.x + box.width;
const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
type Search = { at: number; direction: number; cost: number; score: number; key: number };
/** Stable binary heap; no locale, random or previous-render allocation state. */
class Queue {
  private items: Search[] = [];
  private before(a: Search, b: Search) { return a.score < b.score || a.score === b.score && a.key < b.key; }
  push(value: Search) { let at = this.items.length; this.items.push(value); while (at) { const parent = (at - 1) >> 1; if (!this.before(value, this.items[parent]!)) break; this.items[at] = this.items[parent]!; at = parent; } this.items[at] = value; }
  pop() { const result = this.items[0], last = this.items.pop(); if (!this.items.length || !last) return result;
    let at = 0; while (at * 2 + 1 < this.items.length) { let child = at * 2 + 1; if (child + 1 < this.items.length && this.before(this.items[child + 1]!, this.items[child]!)) child++; if (!this.before(this.items[child]!, last)) break; this.items[at] = this.items[child]!; at = child; } this.items[at] = last; return result; }
}

/** Geometry-only overlay routing. The admitted structural layout and evidence are never rewritten. */
export function routeRecordedRelationships(links: readonly ProjectedRecordedRelationship[], model: GroupedFlowDiagramModel) {
  const routes = new Map<string, RecordedRoute>(), decorations = new Map<string, Box>(); let work = 0, visits = 0;
  const outcome = () => ({ routes, decorations, undrawn: links.length - routes.size, work });
  if (model.nodes.length > 512 || model.edges.length > 1024 || links.length > 512) return outcome();
  const byId = new Map(model.nodes.map(item => [item.node.id, item])), boxes = new Map<string, Box>();
  const absolute = (item: PositionedFlowDiagramNode, depth = 0): Box => {
    if (depth > 16) throw new Error(); const cached = boxes.get(item.node.id); if (cached) return cached;
    const parent = item.parentId ? byId.get(item.parentId) : undefined;
    if (item.parentId && !parent) throw new Error(); const origin = parent ? absolute(parent, depth + 1) : { x: 0, y: 0 };
    const box = { x: item.position.x + origin.x, y: item.position.y + origin.y, width: item.width, height: item.height, owner: item.node.id };
    if (![box.x, box.y, box.width, box.height].every(Number.isFinite) || Math.max(Math.abs(box.x), Math.abs(box.y), box.width, box.height) > 1_000_000 || box.width <= 0 || box.height <= 0) throw new Error();
    boxes.set(item.node.id, box); return box;
  };
  try { for (const item of model.nodes) absolute(item); } catch { return outcome(); }
  for (const item of model.nodes) if (item.isRootCause || item.containsRootCause) {
    const box = boxes.get(item.node.id)!; decorations.set(item.node.id, { x: box.x, y: box.y - 16, width: box.width + 18, height: box.height + 16 });
  }
  const obstacles: Box[] = model.nodes.map(item => {
    const box = boxes.get(item.node.id)!;
    return { x: box.x - HALO, y: box.y - (item.isRootCause || item.containsRootCause ? 28 : HALO), width: box.width + HALO * 2,
      height: (item.expanded ? 72 : box.height) + HALO + (item.isRootCause || item.containsRootCause ? 28 : HALO), owner: box.owner };
  });
  // xyflow supplies the same label centre used by the unchanged structural edges.
  for (const edge of model.edges) {
    if (!edge.edge.label) continue; const a = boxes.get(edge.source), b = boxes.get(edge.target); if (!a || !b) continue;
    const horizontal = model.direction === "LR", source = point(a, horizontal ? "right" : "bottom"), target = point(b, horizontal ? "left" : "top");
    const [, x, y] = getSmoothStepPath({ sourceX: source.x, sourceY: source.y, targetX: target.x, targetY: target.y,
      sourcePosition: horizontal ? Position.Right : Position.Bottom, targetPosition: horizontal ? Position.Left : Position.Top });
    const width = Math.min(180, edge.edge.label.length * 8 + 24); obstacles.push({ x: x - width / 2, y: y - 20, width, height: 40 });
  }
  const ordered = [...links].sort((a, b) => a.relationship.id < b.relationship.id ? -1 : a.relationship.id > b.relationship.id ? 1 : 0);
  const candidates = new Map<string, { sourceSide: RecordedSide; targetSide: RecordedSide; sourcePort: RecordedPort; targetPort: RecordedPort; source: Point; target: Point; start: Point; end: Point }[]>();
  const facingSources = new Map<string, RecordedSide>();
  const slots = (id: string, side: RecordedSide, type: "source" | "target", remote: Box, remotePort?: Point) => {
    const box = boxes.get(id)!, item = byId.get(id)!, length = side === "top" || side === "bottom" ? box.width : box.height;
    const count = Math.min(6, Math.floor((length - 56) / 24) + 1), offsets = Array.from({ length: Math.max(0, count) }, (_, index) => 28 + (length - 56) * index / Math.max(1, count - 1))
      .filter(offset => Math.abs(offset - length / 2) >= 20 && !(item.expanded && (side === "left" || side === "right") && offset < 96));
    const neighbour = side === "top" || side === "bottom" ? (remotePort?.x ?? remote.x + remote.width / 2) - box.x : (remotePort?.y ?? remote.y + remote.height / 2) - box.y;
    return offsets.sort((a, b) => Math.abs(a - neighbour) - Math.abs(b - neighbour) || (type === "source" ? a - b : b - a));
  };
  const xs = new Set<number>(), ys = new Set<number>();
  for (const box of obstacles) for (const offset of [-18, 0, 18]) { xs.add(box.x + offset); xs.add(box.x + box.width + offset); ys.add(box.y + offset); ys.add(box.y + box.height + offset); }
  for (const [ordinal, link] of ordered.entries()) {
    const a = boxes.get(link.source), b = boxes.get(link.target); if (!a || !b) continue;
    const backward = link.relationship.direction === "backward";
    const fallback: [RecordedSide, RecordedSide][] = link.source === link.target ? [["bottom", "right"], ["right", "top"], ["left", "bottom"]]
      : model.direction === "LR" ? (backward ? [["bottom", "bottom"], ["top", "top"], ["left", "right"]] : [["top", "top"], ["bottom", "bottom"], ["right", "left"]])
      : backward ? [["right", "right"], ["left", "left"], ["top", "bottom"]] : [["left", "left"], ["right", "right"], ["bottom", "top"]];
    // Face the actual neighbour first when both normal stubs fit in the gap.
    // Obstacle and occupied-lane checks still decide whether that route is usable.
    const facing: [RecordedSide, RecordedSide] | undefined = link.source === link.target ? undefined
      : model.direction === "LR" ? b.x + b.width + STUB * 2 <= a.x ? ["left", "right"] : a.x + a.width + STUB * 2 <= b.x ? ["right", "left"] : undefined
      : b.y + b.height + STUB * 2 <= a.y ? ["top", "bottom"] : a.y + a.height + STUB * 2 <= b.y ? ["bottom", "top"] : undefined;
    if (facing) facingSources.set(link.relationship.id, facing[0]);
    const pairs = facing ? [facing, ...fallback.filter(pair => pair[0] !== facing[0] || pair[1] !== facing[1])] : fallback;
    const options = pairs.filter(([sourceSide, targetSide]) => !(sourceSide === "top" && (byId.get(link.source)?.expanded || byId.get(link.source)?.isRootCause || byId.get(link.source)?.containsRootCause))
      && !(targetSide === "top" && (byId.get(link.target)?.expanded || byId.get(link.target)?.isRootCause || byId.get(link.target)?.containsRootCause)))
      .flatMap(([sourceSide, targetSide]) => slots(link.source, sourceSide, "source", b).flatMap(sourceOffset => slots(link.target, targetSide, "target", a, point(a, sourceSide, sourceOffset)).map(targetOffset => {
        const source = point(a, sourceSide, sourceOffset), target = point(b, targetSide, targetOffset), start = escape(source, sourceSide), end = escape(target, targetSide);
        for (const p of [start, end]) { xs.add(p.x); ys.add(p.y); }
        return { sourceSide, targetSide, source, target, start, end,
          sourcePort: { id: `recorded-${ordinal}-source`, type: "source" as const, side: sourceSide, offset: sourceOffset },
          targetPort: { id: `recorded-${ordinal}-target`, type: "target" as const, side: targetSide, offset: targetOffset } };
      }))); candidates.set(link.relationship.id, options);
  }
  const fanGroups = new Map<string, ProjectedRecordedRelationship[]>(), fans = new Map<string, { key: string; side: RecordedSide; offset: number }>();
  for (const link of ordered) {
    const side = facingSources.get(link.relationship.id), relationship = link.relationship;
    if (!side || link.collapsed || link.source !== relationship.source || link.target !== relationship.target || !relationship.direction) continue;
    const key = JSON.stringify([relationship.source, relationship.direction, side, relationship.attribution === "stage"]);
    const group = fanGroups.get(key) ?? []; group.push(link); fanGroups.set(key, group);
  }
  for (const [key, group] of fanGroups) {
    if (group.length < 2 || new Set(group.map(link => link.target)).size !== group.length) continue;
    const side = facingSources.get(group[0]!.relationship.id)!, box = boxes.get(group[0]!.source)!, length = side === "left" || side === "right" ? box.height : box.width;
    let common: Set<number> | undefined;
    for (const link of group) {
      const offsets = new Set((candidates.get(link.relationship.id) ?? []).filter(option => option.sourceSide === side).map(option => option.sourcePort.offset));
      common = common ? new Set([...common].filter(offset => offsets.has(offset))) : offsets;
    }
    const offset = [...common!].sort((a, b) => Math.abs(a - length / 2) - Math.abs(b - length / 2) || a - b)[0];
    if (offset !== undefined) for (const link of group) fans.set(link.relationship.id, { key, side, offset });
  }
  const columns = [...xs].sort((a, b) => a - b), rows = [...ys].sort((a, b) => a - b), width = columns.length;
  if (!width || !rows.length) return outcome();
  const position = (at: number): Point => ({ x: columns[at % width]!, y: rows[Math.floor(at / width)]! });
  const index = (p: Point) => rows.indexOf(p.y) * width + columns.indexOf(p.x);
  const occupied = new Map<string, number>(), occupiedVertices = new Map<number, number>(), checked = new Map<string, boolean>(), labels: Box[] = [], usedPorts = new Map<string, string>();
  const portKey = (id: string, port: RecordedPort) => JSON.stringify([id, port.side, port.offset]);
  const segmentKey = (a: number, b: number) => a < b ? `${a}:${b}` : `${b}:${a}`;
  const clear = (a: Point, b: Point, boxes: readonly Box[], ignore?: string) => {
    for (const box of boxes) { if (work >= MAX_WORK) return false; work++; if ((ignore === undefined || box.owner !== ignore) && crossing(a, b, box)) return false; } return true;
  };
  const search = (start: Point, end: Point): { points: Point[]; segments: string[] } | undefined => {
    const from = index(start), to = index(end); if (from === to) return undefined;
    const queue = new Queue(), costs = new Map<number, number>(), parents = new Map<number, number>();
    queue.push({ at: from, direction: 0, cost: 0, score: distance(start, end), key: from * 3 }); costs.set(from * 3, 0);
    let local = 0, current: Search | undefined;
    while ((current = queue.pop()) && ++local <= 12_000 && ++visits <= MAX_VISITS && work < MAX_WORK) {
      if (costs.get(current.key) !== current.cost) continue;
      if (current.at === to) {
        const points: Point[] = [], segments: string[] = []; let key: number | undefined = current.key;
        while (key !== undefined) { const at: number = Math.floor(key / 3), previous: number | undefined = parents.get(key); points.push(position(at)); if (previous !== undefined) segments.push(segmentKey(at, Math.floor(previous / 3))); key = previous; }
        return { points: points.reverse(), segments };
      }
      const x = current.at % width, y = Math.floor(current.at / width), a = position(current.at);
      for (const next of [x > 0 ? current.at - 1 : -1, x + 1 < width ? current.at + 1 : -1, y > 0 ? current.at - width : -1, y + 1 < rows.length ? current.at + width : -1]) {
        if (next < 0) continue; const b = position(next), edge = segmentKey(current.at, next); let free = checked.get(edge);
        if (free === undefined) { free = clear(a, b, obstacles); checked.set(edge, free); }
        if (!free || !clear(a, b, labels)) continue;
        const direction = a.y === b.y ? 1 : 2, cost = current.cost + distance(a, b) + (current.direction && current.direction !== direction ? 20 : 0)
          + (occupied.get(edge) ?? 0) * (100 + distance(a, b) * 4) + (occupiedVertices.get(next) ?? 0) * 500;
        const key = next * 3 + direction; if (cost >= (costs.get(key) ?? Infinity)) continue;
        costs.set(key, cost); parents.set(key, current.key); queue.push({ at: next, direction, cost, score: cost + distance(b, end), key });
      }
    }
    return undefined;
  };
  const labelFor = (points: readonly Point[]) => {
    const segments = points.slice(1).map((b, at) => ({ a: points[at]!, b, length: distance(points[at]!, b) })).sort((a, b) => b.length - a.length);
    for (const { a, b, length } of segments) {
      if (length < 28) continue;
      for (const fraction of [.5, .25, .75, .125, .875]) for (const offset of [0, 20, -20, 38, -38]) {
        const horizontal = a.y === b.y, x = a.x + (b.x - a.x) * fraction + (horizontal ? 0 : offset), y = a.y + (b.y - a.y) * fraction + (horizontal ? offset : 0);
        const box = { x: x - 28, y: y - 15, width: 56, height: 30 };
        if ([...obstacles, ...labels].every(other => { if (work >= MAX_WORK) return false; work++; return !intersects(box, other); })) return { x, y, width: 48, height: 22, box };
      }
    }
    return undefined;
  };
  for (const link of ordered) {
    if (work >= MAX_WORK || visits > MAX_VISITS) break;
    const fan = fans.get(link.relationship.id), options = candidates.get(link.relationship.id) ?? [];
    const shared = (option: typeof options[number]) => fan !== undefined && option.sourceSide === fan.side && option.sourcePort.offset === fan.offset;
    // A common exit is presentation only: separate edges/handles retain their
    // evidence. No junction or ownership is inferred from a collapsed proxy.
    const preferred = fan ? [...options.filter(shared), ...options.filter(option => !shared(option))] : options;
    for (const option of preferred) {
      const sourceKey = portKey(link.source, option.sourcePort), targetKey = portKey(link.target, option.targetPort);
      const sourceOwner = usedPorts.get(sourceKey);
      if (sourceOwner !== undefined && (!shared(option) || sourceOwner !== fan?.key) || usedPorts.has(targetKey) || sourceKey === targetKey) continue;
      if (!clear(option.source, option.start, obstacles, link.source) || !clear(option.end, option.target, obstacles, link.target)
        || !clear(option.source, option.start, labels) || !clear(option.end, option.target, labels)) continue;
      const found = search(option.start, option.end); if (!found) continue;
      const corners = found.points.filter((p, at, all) => !at || at === all.length - 1 || (all[at - 1]!.x === p.x) !== (p.x === all[at + 1]!.x));
      const points = [option.source, ...corners, option.target], label = labelFor(points); if (!label) continue;
      labels.push(label.box); for (const segment of found.segments) occupied.set(segment, (occupied.get(segment) ?? 0) + 1);
      for (const p of found.points) { const at = index(p); occupiedVertices.set(at, (occupiedVertices.get(at) ?? 0) + 1); }
      usedPorts.set(sourceKey, shared(option) ? fan!.key : ""); usedPorts.set(targetKey, "");
      routes.set(link.relationship.id, { points, sourceSide: option.sourceSide, targetSide: option.targetSide, sourcePort: option.sourcePort, targetPort: option.targetPort,
        label: { x: label.x, y: label.y, width: label.width, height: label.height } }); break;
    }
  }
  return outcome();
}

/** Keep xyflow's measured anchor pixels authoritative and round only the planned clear corridor. */
export function recordedRoutePath(route: Omit<RecordedRoute, "sourcePort" | "targetPort">, source: Point, target: Point) {
  const interior = route.points.slice(1, -1).map(p => ({ ...p }));
  const normalize = (anchor: Point, side: RecordedSide, reverse: boolean) => {
    const axis = side === "left" || side === "right" ? "y" : "x", from = reverse ? interior.length - 1 : 0;
    const expected = route.points[from + 1]![axis];
    if (Math.abs(expected - anchor[axis]) > .001) return;
    // Native transforms introduce tiny noise. Only the planned straight end
    // corridor follows it; exact measured anchors and larger offsets never snap.
    for (let at = from; at >= 0 && at < interior.length && route.points[at + 1]![axis] === expected; at += reverse ? -1 : 1) interior[at]![axis] = anchor[axis];
  };
  normalize(source, route.sourceSide, false); normalize(target, route.targetSide, true);
  const start = interior[0]!, end = interior[interior.length - 1]!;
  const bridge = (p: Point, actual: Point, side: RecordedSide) => side === "left" || side === "right" ? { x: p.x, y: actual.y } : { x: actual.x, y: p.y };
  // Preserve both planned stubs. Independently measured half-pixels must not
  // shift a whole straight corridor or turn the opposite arrival diagonal.
  const assembled = [source, bridge(start, source, route.sourceSide), ...interior, bridge(end, target, route.targetSide), target]
    .filter((p, at, all) => !at || p.x !== all[at - 1]!.x || p.y !== all[at - 1]!.y);
  const points: Point[] = [];
  for (const next of assembled) {
    // Remove only redundant monotonic points after measured-anchor bridges.
    // Real turns, reversals and independent anchor adjustments stay intact.
    while (points.length > 1) {
      const a = points[points.length - 2]!, middle = points[points.length - 1]!;
      const straight = a.x === middle.x && middle.x === next.x && middle.y >= Math.min(a.y, next.y) && middle.y <= Math.max(a.y, next.y)
        || a.y === middle.y && middle.y === next.y && middle.x >= Math.min(a.x, next.x) && middle.x <= Math.max(a.x, next.x);
      if (!straight) break; points.pop();
    }
    points.push(next);
  }
  let path = `M${source.x},${source.y}`;
  for (let at = 1; at < points.length - 1; at++) {
    const a = points[at - 1]!, p = points[at]!, b = points[at + 1]!;
    const radius = Math.min(16, distance(a, p) / 2, distance(p, b) / 2);
    const before = { x: p.x + Math.sign(a.x - p.x) * radius, y: p.y + Math.sign(a.y - p.y) * radius }, after = { x: p.x + Math.sign(b.x - p.x) * radius, y: p.y + Math.sign(b.y - p.y) * radius };
    path += ` L${before.x},${before.y} Q${p.x},${p.y} ${after.x},${after.y}`;
  }
  return `${path} L${target.x},${target.y}`;
}

/** Include paint extents only for the current camera's scope; a one-card focus remains readable. */
export function recordedVisualBounds(plan: ReturnType<typeof routeRecordedRelationships>, links: readonly ProjectedRecordedRelationship[], focus?: readonly string[]) {
  const selected = focus?.length ? new Set(focus) : undefined;
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  const include = (box: Box) => { left = Math.min(left, box.x); top = Math.min(top, box.y); right = Math.max(right, box.x + box.width); bottom = Math.max(bottom, box.y + box.height); };
  for (const [id, box] of plan.decorations) if (!selected || selected.has(id)) include(box);
  for (const link of links) {
    if (selected && (selected.size < 2 || !selected.has(link.source) || !selected.has(link.target))) continue;
    const route = plan.routes.get(link.relationship.id); if (!route) continue;
    for (const p of route.points) include({ x: p.x - 2, y: p.y - 2, width: 4, height: 4 });
    include({ x: route.label.x - route.label.width / 2 - 6, y: route.label.y - route.label.height / 2 - 6, width: route.label.width + 12, height: route.label.height + 12 });
  }
  return Number.isFinite(left) ? { x: left, y: top, width: right - left, height: bottom - top } : undefined;
}
