import { markRecordedFrame } from "../components/DiagramAppearance/model";
import type { DiagramAppearance, DiagramObjectAppearance } from "../components/DiagramAppearance";
import type { DiagramGeometry, DiagramDrawings } from "../components/DiagramDrawing";

/** Presentation inputs shared by static graphs, replay graphs and consumer renderers. */
export interface DiagramVisualProps {
  readonly diagramGeometry?: DiagramGeometry;
  readonly diagramDrawings?: DiagramDrawings;
  readonly diagramAppearance?: DiagramAppearance;
}

/** A complete replacement for one graph object's appearance at a host-owned step. */
export interface DiagramAppearanceChange {
  readonly step: number;
  readonly target: "node" | "edge";
  readonly id: string;
  /** null clears the presentation. Confirmed removal uses { presence: "removed" }. */
  readonly appearance: DiagramObjectAppearance | null;
}

export interface DiagramAppearanceReader {
  /** Read the most recent observation for each object through this inclusive step. */
  at(step: number): DiagramAppearance;
}

const EMPTY: DiagramAppearance = Object.freeze({});

function lastAt(changes: readonly DiagramAppearanceChange[], step: number) {
  let lo = 0, hi = changes.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (changes[mid].step <= step) lo = mid + 1;
    else hi = mid;
  }
  return changes[lo - 1]?.appearance;
}

/**
 * Index observations for one immutable revision of one recording scope. The host
 * chooses what each observation means and the same cursor it uses for the chart.
 * Storage is proportional to supplied changes, even for very sparse step numbers.
 */
export function createDiagramAppearanceReader(changes: readonly DiagramAppearanceChange[]): DiagramAppearanceReader {
  const histories = { node: new Map<string, DiagramAppearanceChange[]>(), edge: new Map<string, DiagramAppearanceChange[]>() };
  for (const change of changes) {
    if (!Number.isSafeInteger(change.step) || change.step < 0 ||
        (change.target !== "node" && change.target !== "edge") || typeof change.id !== "string")
      throw new TypeError("A diagram change needs a nonnegative integer step, a node or edge target and a string ID.");
    const byId = histories[change.target];
    const history = byId.get(change.id);
    if (history) history.push(change);
    else byId.set(change.id, [change]);
  }
  // Stable order resolves multiple observations at one step to the last supplied.
  for (const byId of [histories.node, histories.edge])
    for (const history of byId.values()) history.sort((a, b) => a.step - b.step);

  function frameReader(byId: Map<string, DiagramAppearanceChange[]>) {
    const observations = new Map<number, Set<string>>();
    for (const [id, history] of byId) {
      for (const change of history) {
        let ids = observations.get(change.step);
        if (!ids) { ids = new Set(); observations.set(change.step, ids); }
        ids.add(id);
      }
    }
    const steps = [...observations.keys()].sort((a, b) => a - b);
    const order = new Map([...byId.keys()].map((id, i) => [id, i]));
    const scope = {};
    const current = new Map<string, DiagramObjectAppearance>();
    let sequence = 0, bucket = 0;
    let activeIds: string[] = [];
    let frame: Record<string, DiagramObjectAppearance> = Object.create(null);
    markRecordedFrame(frame, { scope, sequence });
    return (step: number) => {
      let low = 0, high = steps.length;
      while (low < high) {
        const mid = low + Math.floor((high - low) / 2);
        if (steps[mid] <= step) low = mid + 1;
        else high = mid;
      }
      if (bucket === low) return frame;
      const start = Math.min(bucket, low), end = Math.max(bucket, low);
      bucket = low;
      // Adjacent forward AND backward seeks touch only the objects observed
      // between their endpoints. For large jumps one lookup per object is cheaper.
      let crossed = 0;
      let changedIds: Set<string> | undefined = new Set();
      for (let i = start; i < end; i++) {
        const ids = observations.get(steps[i])!;
        crossed += ids.size;
        if (crossed > byId.size) { changedIds = undefined; break; }
        for (const id of ids) changedIds.add(id);
      }
      let changed = false, membershipChanged = false;
      for (const id of changedIds ?? byId.keys()) {
        const next = lastAt(byId.get(id)!, step) ?? undefined;
        const prior = current.get(id);
        if (prior === next) continue;
        changed = true;
        if (!prior || !next) membershipChanged = true;
        if (next) current.set(id, next);
        else current.delete(id);
      }
      if (!changed) return frame;
      // Keep the public own-key record immutable and its enumeration order
      // deterministic across clears and rewinds. No history is read in this copy.
      if (membershipChanged) activeIds = [...current.keys()].sort((a, b) => order.get(a)! - order.get(b)!);
      frame = Object.create(null);
      for (const id of activeIds) frame[id] = current.get(id)!;
      markRecordedFrame(frame, { scope, sequence: ++sequence, changedIds });
      return frame;
    };
  }

  const readNodes = frameReader(histories.node), readEdges = frameReader(histories.edge);
  let previous = EMPTY;
  return {
    at(step) {
      if (!Number.isSafeInteger(step) || step < 0) return EMPTY;
      const nodes = readNodes(step), edges = readEdges(step);
      if (previous.nodes !== nodes || previous.edges !== edges) previous = { nodes, edges };
      return previous;
    },
  };
}
