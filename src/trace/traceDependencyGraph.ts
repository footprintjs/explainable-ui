/** A bounded variable view of recorded stage reads, not expression-level derivation. */
import type { TraceIngredient, TraceStop, TraceWalk } from "./traceWalk";

export interface TraceDependencyNode {
  id: string;
  key: string;
  runtimeStageId: string | null;
  stageName: string | null;
  commitIdx: number | null;
  kind: "recorded" | "unresolved" | "outside-view";
  isAnchor: boolean;
}

export interface TraceDependencyEdge {
  id: string;
  source: string;
  target: string;
  readKey: string;
}

export interface TraceDependencyGraph {
  nodes: TraceDependencyNode[];
  edges: TraceDependencyEdge[];
  truncated: boolean;
}

const MAX_NODES = 60;
const MAX_EDGES = 120;
const MAX_STOPS = 512;
const MAX_INSPECTIONS = 8_192;
const MAX_NAME = 4_096;

const name = (value: unknown): value is string => typeof value === "string" && value.length <= MAX_NAME;
const position = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const stopId = (runtimeStageId: string, commitIdx: number) => JSON.stringify([runtimeStageId, commitIdx]);

/**
 * Each written key is a separate node, identified by its actual writer visit.
 * Expand from the anchor, so unrelated stops never consume the drawing budget.
 * An unresolved read belongs to its reader; a known excluded writer stays a
 * boundary node. Neither one is called an origin. The supplied walk is already
 * admitted evidence; these extra limits bound this presentation projection.
 */
export function buildTraceDependencyGraph(walk: TraceWalk): TraceDependencyGraph {
  const nodes: TraceDependencyNode[] = [];
  const edges: TraceDependencyEdge[] = [];
  let truncated = walk.truncated;
  let remaining = MAX_INSPECTIONS;
  const inspect = () => {
    if (remaining-- > 0) return true;
    truncated = true;
    return false;
  };
  if (!name(walk.key)) return { nodes, edges, truncated: true };

  const stops = new Map<string, TraceStop>();
  const stopCount = Math.min(walk.stops.length, MAX_STOPS);
  if (walk.stops.length > stopCount) truncated = true;
  for (let at = 0; at < stopCount && inspect(); at++) {
    const stop = walk.stops[at];
    if (name(stop.runtimeStageId) && stop.runtimeStageId.length > 0 && position(stop.commitIdx)) {
      const id = stopId(stop.runtimeStageId, stop.commitIdx);
      if (!stops.has(id)) stops.set(id, stop);
    } else truncated = true;
  }

  const byId = new Map<string, TraceDependencyNode>();
  const seenEdges = new Set<string>();
  const queue: Array<{ node: TraceDependencyNode; stop: TraceStop }> = [];
  const add = (node: TraceDependencyNode, stop?: TraceStop) => {
    const existing = byId.get(node.id);
    if (existing) return existing;
    if (nodes.length >= MAX_NODES) {
      truncated = true;
      return undefined;
    }
    nodes.push(node);
    byId.set(node.id, node);
    if (stop) queue.push({ node, stop });
    return node;
  };

  const first = walk.missing ? undefined : walk.stops[0];
  const anchor = first && stops.get(stopId(first.runtimeStageId, first.commitIdx));
  if (!anchor) {
    add({
      id: JSON.stringify(["unresolved", "anchor", walk.key]),
      key: walk.key, runtimeStageId: null, stageName: null, commitIdx: null,
      kind: "unresolved", isAnchor: true,
    });
    return { nodes, edges, truncated };
  }
  add({
    id: JSON.stringify(["recorded", anchor.runtimeStageId, anchor.commitIdx, walk.key]),
    key: walk.key, runtimeStageId: anchor.runtimeStageId,
    stageName: name(anchor.stageName) ? anchor.stageName : null,
    commitIdx: anchor.commitIdx, kind: "recorded", isAnchor: true,
  }, anchor);

  const sourceFor = (ingredient: TraceIngredient, reader: TraceStop) => {
    const known = name(ingredient.writerRuntimeStageId) && ingredient.writerRuntimeStageId.length > 0
      && position(ingredient.writerCommitIdx) && ingredient.writerCommitIdx < reader.commitIdx;
    if (!known) {
      return {
        node: {
          id: JSON.stringify(["unresolved", reader.runtimeStageId, reader.commitIdx, ingredient.key]),
          key: ingredient.key, runtimeStageId: null, stageName: null, commitIdx: null,
          kind: "unresolved" as const, isAnchor: false,
        },
      };
    }
    const runtimeStageId = ingredient.writerRuntimeStageId!;
    const commitIdx = ingredient.writerCommitIdx!;
    const stop = stops.get(stopId(runtimeStageId, commitIdx));
    const kind = stop ? "recorded" as const : "outside-view" as const;
    if (!stop) truncated = true;
    return {
      node: {
        id: JSON.stringify([kind, runtimeStageId, commitIdx, ingredient.key]),
        key: ingredient.key, runtimeStageId,
        stageName: name(stop?.stageName) ? stop.stageName : name(ingredient.writerStageName) ? ingredient.writerStageName : null,
        commitIdx, kind, isAnchor: false,
      },
      stop,
    };
  };

  for (let at = 0; at < queue.length; at++) {
    const { node: target, stop } = queue[at];
    for (let index = 0; index < stop.ingredients.length; index++) {
      if (!inspect()) return { nodes, edges, truncated };
      const ingredient = stop.ingredients[index];
      if (!name(ingredient.key)) {
        truncated = true;
        continue;
      }
      const source = sourceFor(ingredient, stop);
      const id = JSON.stringify([source.node.id, target.id, ingredient.key]);
      if (seenEdges.has(id)) continue;
      if (edges.length >= MAX_EDGES) {
        truncated = true;
        break;
      }
      const retained = add(source.node, source.stop);
      if (!retained) continue;
      edges.push({ id, source: retained.id, target: target.id, readKey: ingredient.key });
      seenEdges.add(id);
    }
  }
  return { nodes, edges, truncated };
}
