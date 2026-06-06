/**
 * dagreTraceLayout — professor-grade `TraceFlowLayout` backed by dagre.
 *
 * Replaces the hand-rolled BFS `defaultTraceFlowLayout` (which used FIXED
 * spacing constants — Y_STEP / X_SPREAD — and documented "first-wins"
 * convergence + no overlap detection). Dagre instead derives every
 * position from the STRUCTURE RELATIONS:
 *
 *   - **next** (sequential): y-delta = rank depth (longest path), so a
 *     convergence node lands at `max(incoming ranks) + 1` — not
 *     "deepest-branch-so-far".
 *   - **fork / selector** (N branches): x-delta = the measured SUBTREE
 *     WIDTH of each branch (a wide branch pushes its siblings further; a
 *     thin one barely shifts them) — scales cleanly for any N, no collisions.
 *   - **merge** (join): centered under the average of its real parents.
 *
 * Compound nesting: dagre is given `parentId` as a compound-parent link,
 * so group-container children (from `applyGroupLayout` / `wrapInMainChartBox`)
 * stay inside their box. Coordinates are returned parent-RELATIVE (xyflow
 * convention), matching what the box transforms expect.
 *
 * Ported from agentfootprint-lens's proven `dagreLayout` (same dagre core),
 * re-shaped to the `TraceFlowLayout` contract: `(TraceGraph) => TraceGraph`.
 * Pure — same graph in, same positions out; no React, no I/O.
 */

import dagre from "dagre";
import type { Edge } from "@xyflow/react";
import type { TraceGraph, TraceNode, TraceEdgeData } from "../traceStructureRecorder";
import type { TraceFlowLayout } from "../TraceFlow";

/** Explicit node footprint (px). */
export interface NodeFootprint {
  readonly width: number;
  readonly height: number;
}

/**
 * Consumer-supplied per-node size resolver. Receives the WHOLE node (all
 * recorder semantics: `data.isSubflow`, `data.icon`, `data.subflowId`,
 * `id`, …) and returns a footprint, or `undefined` to leave the node alone
 * (→ falls back to `style.width/height`, then the default footprint).
 *
 * The library imposes NO sizing rules — the consumer decides per node by
 * whatever criteria THEY choose. E.g. make one specific slot a slim bar
 * while another stays a full card; make the LLM-call node large; etc.
 */
export type NodeSizeResolver = (node: TraceNode) => NodeFootprint | undefined;

/** Consumer-supplied per-edge layout-weight resolver. Higher weight pulls
 *  the two endpoints into a tighter, straighter column (dagre `weight`).
 *  Return `undefined` for the default (1). */
export type EdgeWeightResolver = (edge: Edge<TraceEdgeData>) => number | undefined;

/** Consumer-supplied per-edge minimum rank-span resolver. `>1` STRETCHES an
 *  edge (pushes its target that many ranks down). Note dagre cannot make an
 *  edge SHORTER than one rank — `minlen` only increases. Return `undefined`
 *  for the default (1). */
export type EdgeMinLenResolver = (edge: Edge<TraceEdgeData>) => number | undefined;

/**
 * Consumer-supplied left-to-right ORDER for a node's fork/decider children.
 * Receives the source node id + its child target ids (in spec/edge-insertion
 * order); returns the SAME ids reordered left-to-right (index 0 = leftmost).
 * Ids omitted from the result keep their original relative order after the
 * listed ones. Return the input unchanged (or `undefined` from the resolver)
 * to leave a node alone.
 *
 * Use to place a specific branch on a chosen side — e.g. the looping branch on
 * the right margin where the loop-back curve lives, so the "iterate" path reads
 * as one side of the fork. This is a pure VISUAL/LAYOUT decision (it changes
 * which side a branch draws on, never the chart's behavior), so it belongs in
 * the renderer, not the chart spec.
 *
 * Mechanism: dagre seeds its sibling order from edge-insertion order and keeps
 * it as the tie-break for equal-barycenter siblings. We insert each source's
 * edges in the resolved order, so for the common symmetric N-branch decider the
 * result is deterministic. (For graphs where one ordering strictly reduces edge
 * crossings, dagre's crossing-minimizer may still override — best-effort, as
 * documented for any dagre ordering hint.)
 */
export type SiblingOrderResolver = (
  sourceId: string,
  childIds: readonly string[],
) => readonly string[];

export interface DagreTraceLayoutOptions {
  /** Layout direction. `'TB'` (top-to-bottom) is the default — matches the
   *  "Seed → … → answer" reading order. */
  readonly direction?: "TB" | "BT" | "LR" | "RL";
  /** Vertical spacing between rank layers (px). Surfaced as a knob — the
   *  rank-gap delta. Default 80. */
  readonly rankSep?: number;
  /** Horizontal spacing between siblings within a rank (px). The
   *  sibling-gap delta dagre adds ON TOP of measured subtree widths.
   *  Default 60. */
  readonly nodeSep?: number;
  /** Spacing between edges (px). Default 20. */
  readonly edgeSep?: number;
  /** Fallback node footprint when a node carries no explicit size. dagre
   *  needs real dimensions or arrows collapse to a point. */
  readonly nodeWidth?: number;
  readonly nodeHeight?: number;
  /** Per-node size resolver — consumer decides each node's footprint. See
   *  `NodeSizeResolver`. Resolution order: resolver → `node.style` → default. */
  readonly nodeSize?: NodeSizeResolver;
  /** Per-edge pull (dagre `weight`). See `EdgeWeightResolver`. */
  readonly edgeWeight?: EdgeWeightResolver;
  /** Per-edge stretch (dagre `minlen`). See `EdgeMinLenResolver`. */
  readonly edgeMinLen?: EdgeMinLenResolver;
  /** Per-node fork/decider child ordering. See `SiblingOrderResolver`. */
  readonly siblingOrder?: SiblingOrderResolver;
}

export const DEFAULT_NODE_W = 200;
export const DEFAULT_NODE_H = 80;

/**
 * Resolve a node's render size. Order: consumer `nodeSize` resolver (if it
 * returns a footprint) → explicit `style.width/height` (set by the
 * group/main-box transforms) → configured fallback footprint.
 *
 * GROUP-CONTAINER EXCEPTION — style WINS over the resolver. A node flagged
 * `data.isGroupContainer` has been STAMPED with its true box footprint on
 * `style.width/height` by `applyGroupLayout` PASS 2 (or `wrapInMainChartBox`).
 * That footprint is authoritative: it is the size the box actually RENDERS at,
 * so dagre must reserve exactly it or post-container siblings rank inside the
 * box and overlap it. A consumer `nodeSize` resolver that sizes by recorder
 * semantics (e.g. "any subflow → a 38px slim bar") would otherwise out-rank
 * the stamp — dagre would be told 38px while the box paints ~794px, and the
 * `route`/`tool-calls`/`final` siblings would land on top of it. So for a
 * group container the resolution order flips to: `style` → resolver → default.
 *
 * Exported so the post-layout `snapLinearSuccessors` pass reconstructs each
 * node's center from the IDENTICAL width dagre placed it at, keeping snapped
 * centers geometry-exact.
 */
export function sizeOf(
  node: TraceNode,
  fallbackW: number,
  fallbackH: number,
  resolver?: NodeSizeResolver,
): { width: number; height: number } {
  const style = (node.style ?? {}) as { width?: unknown; height?: unknown };
  const styleW = typeof style.width === "number" ? style.width : undefined;
  const styleH = typeof style.height === "number" ? style.height : undefined;

  // A stamped group container's footprint is authoritative — style beats the
  // resolver so dagre reserves the box's REAL rendered height (no sibling
  // overlap). Both dimensions must be present to use the stamp; otherwise fall
  // through to the normal order.
  if (node.data?.isGroupContainer && styleW !== undefined && styleH !== undefined) {
    return { width: styleW, height: styleH };
  }

  const resolved = resolver?.(node);
  if (resolved) return { width: resolved.width, height: resolved.height };
  return {
    width: styleW ?? fallbackW,
    height: styleH ?? fallbackH,
  };
}

/**
 * Reorder edges so each source node's forward (non-loop) children are fed to
 * dagre in `siblingOrder`'s left-to-right order. dagre seeds sibling order from
 * edge-insertion order (and keeps it as the equal-barycenter tie-break), so
 * inserting in the resolved order biases each fork's left-to-right layout.
 *
 * Pure. Loop edges are dropped (they never shape layout — the caller skips them
 * anyway). Sources keep first-seen order; within a source, children follow the
 * resolver, and any children the resolver omits keep their original order after
 * the listed ones. Single-child sources are returned untouched.
 */
function reorderSiblingEdges<E extends { source: string; target: string; data?: { kind?: string } }>(
  edges: readonly E[],
  siblingOrder: SiblingOrderResolver,
): E[] {
  const bySource = new Map<string, E[]>();
  for (const e of edges) {
    if (e.data?.kind === "loop") continue;
    const arr = bySource.get(e.source);
    if (arr) arr.push(e);
    else bySource.set(e.source, [e]);
  }
  const out: E[] = [];
  for (const [src, group] of bySource) {
    if (group.length < 2) {
      out.push(...group);
      continue;
    }
    const ordered = siblingOrder(src, group.map((e) => e.target));
    const byTarget = new Map(group.map((e) => [e.target, e]));
    const used = new Set<string>();
    for (const t of ordered) {
      const e = byTarget.get(t);
      if (e && !used.has(t)) {
        out.push(e);
        used.add(t);
      }
    }
    for (const e of group) if (!used.has(e.target)) out.push(e); // resolver omissions
  }
  return out;
}

/**
 * Lay out a `TraceGraph` with dagre. Returns a NEW graph with each node's
 * `position` set (top-left, parent-relative for nested nodes). Edges pass
 * through unchanged — xyflow routes them once nodes are placed.
 *
 * Loop back-edges (`kind: 'loop'`) are EXCLUDED from the dagre graph: they
 * are visual annotations only (invariant I1) and would otherwise create
 * cycles that distort ranking.
 */
export function dagreTraceLayout(
  graph: TraceGraph,
  options: DagreTraceLayoutOptions = {},
): TraceGraph {
  if (graph.nodes.length === 0) return graph;

  const direction = options.direction ?? "TB";
  const rankSep = options.rankSep ?? 80;
  const nodeSep = options.nodeSep ?? 60;
  const edgeSep = options.edgeSep ?? 20;
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H;

  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep, edgesep: edgeSep });
  g.setDefaultEdgeLabel(() => ({}));

  const sizes = new Map<string, { width: number; height: number }>();
  // Sizes the consumer resolver supplied — applied to the node's `style` so
  // xyflow RENDERS at the same footprint dagre laid out for (layout/paint
  // parity). Style-derived + default sizes are layout-only (the node already
  // renders at them), so we don't override their style.
  const resolvedStyleSizes = new Map<string, NodeFootprint>();
  for (const node of graph.nodes) {
    const resolved = options.nodeSize?.(node);
    const size = sizeOf(node, fallbackW, fallbackH, options.nodeSize);
    sizes.set(node.id, size);
    // Only re-stamp the node's `style` from the resolver when `sizeOf` actually
    // USED the resolver — i.e. the dagre size equals the resolved footprint. A
    // stamped group container ignores the resolver (style wins, see sizeOf), so
    // we must NOT overwrite its authoritative box footprint with the resolver's
    // value (that would shrink the rendered box back to e.g. a 38px slim bar).
    if (resolved && resolved.width === size.width && resolved.height === size.height) {
      resolvedStyleSizes.set(node.id, resolved);
    }
    g.setNode(node.id, { width: size.width, height: size.height });
    if (node.parentId) {
      g.setParent(node.id, node.parentId);
    }
  }

  // When a sibling order is requested, feed each fork's child edges to dagre in
  // that order (opt-in; the default path keeps edges byte-identical to before).
  // `reorderSiblingEdges` returns FORWARD edges only (loop edges are dropped —
  // they never shape layout, and the `kind === "loop"` skip below is the no-op
  // for that case). The graph's edges are returned UNCHANGED from this function
  // (see the final `return` — loop edges still reach the renderer intact).
  const layoutEdges = options.siblingOrder
    ? reorderSiblingEdges(graph.edges, options.siblingOrder)
    : graph.edges;
  for (const e of layoutEdges) {
    if (e.data?.kind === "loop") continue; // visual-only — never shapes layout
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      // Per-edge pull (weight) + stretch (minlen) — consumer-controlled.
      const label: { weight?: number; minlen?: number } = {};
      const weight = options.edgeWeight?.(e);
      const minlen = options.edgeMinLen?.(e);
      if (typeof weight === "number") label.weight = weight;
      if (typeof minlen === "number") label.minlen = minlen;
      g.setEdge(e.source, e.target, label);
    }
  }

  dagre.layout(g);

  // dagre returns CENTER coords; xyflow wants TOP-LEFT. Nested children get
  // coords RELATIVE to their parent's top-left (xyflow convention).
  const positioned: TraceNode[] = graph.nodes.map((node) => {
    const laidOut = g.node(node.id);
    if (!laidOut) return node; // unreached (orphan) — keep original position
    const size = sizes.get(node.id)!;
    let x = laidOut.x - size.width / 2;
    let y = laidOut.y - size.height / 2;
    if (node.parentId) {
      const parent = g.node(node.parentId);
      const parentSize = sizes.get(node.parentId);
      if (parent && parentSize) {
        x -= parent.x - parentSize.width / 2;
        y -= parent.y - parentSize.height / 2;
      }
    }
    // Apply consumer-resolved size to `style` so xyflow RENDERS at the same
    // footprint dagre placed (paint matches layout). Only for resolver-set
    // sizes — style/default-sized nodes already render correctly.
    const styleSize = resolvedStyleSizes.get(node.id);
    if (styleSize) {
      return {
        ...node,
        position: { x, y },
        style: { ...(node.style ?? {}), width: styleSize.width, height: styleSize.height },
      };
    }
    return { ...node, position: { x, y } };
  });

  return { nodes: positioned, edges: graph.edges };
}

/**
 * Build a `TraceFlowLayout` from dagre options. Pass to
 * `<TraceFlow layout={...}>` / `<TracedFlow layout={...}>`, or use it as a
 * `baseLayout` for the group/main-box transforms.
 */
export function createDagreTraceLayout(
  options: DagreTraceLayoutOptions = {},
): TraceFlowLayout {
  return (graph: TraceGraph) => dagreTraceLayout(graph, options);
}
