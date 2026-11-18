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

  function read(byId: Map<string, DiagramAppearanceChange[]>, step: number) {
    const result: Record<string, DiagramObjectAppearance> = Object.create(null);
    for (const [id, history] of byId) {
      const appearance = lastAt(history, step);
      if (appearance) result[id] = appearance;
    }
    return result;
  }

  let previousStep = -1;
  let previous = EMPTY;
  return {
    at(step) {
      if (!Number.isSafeInteger(step) || step < 0) return EMPTY;
      if (step !== previousStep) {
        previous = { nodes: read(histories.node, step), edges: read(histories.edge, step) };
        previousStep = step;
      }
      return previous;
    },
  };
}
