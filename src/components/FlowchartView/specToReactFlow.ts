/**
 * Converts a SerializedPipelineStructure (from builder.toSpec()) into
 * ReactFlow nodes and edges with auto-layout.
 *
 * Two-phase approach for performance:
 * 1. `specToLayout(spec)` — tree walk + positioning (expensive, cached on spec)
 * 2. `applyOverlay(layout, overlay)` — color nodes/edges (cheap, runs per slider tick)
 *
 * `specToReactFlow(spec, overlay)` combines both for convenience.
 */
import { MarkerType } from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import { rawDefaults } from "../../theme/tokens";

export interface SpecNode {
  name: string;
  id?: string;
  type?: "stage" | "decider" | "selector" | "fork" | "streaming";
  /** Semantic icon hint — rendered by StageNode. Common values:
   *  "llm", "tool", "rag", "search", "parse", "start", "end", "loop",
   *  "agent", "swarm", "guard", "stream", "memory" */
  icon?: string;
  description?: string;
  children?: SpecNode[];
  next?: SpecNode;
  branchIds?: string[];
  hasDecider?: boolean;
  hasSelector?: boolean;
  loopTarget?: string;
  isSubflowRoot?: boolean;
  subflowId?: string;
  subflowName?: string;
  subflowStructure?: SpecNode;
  /** True when this subflow uses lazy resolution (deferred until execution). */
  isLazy?: boolean;
}

export interface ExecutionOverlay {
  /** Names of stages that have completed (before the active one) */
  doneStages: Set<string>;
  /** Name of the currently active stage */
  activeStage: string | null;
  /** Names of all stages that were executed (done + active) */
  executedStages: Set<string>;
  /** Ordered list of executed stage names (for step numbering) */
  executionOrder?: string[];
}

/** Colors for the flowchart — consumer provides these to match their theme */
export interface FlowchartColors {
  edgeDefault: string;
  edgeExecuted: string;
  edgeActive: string;
  edgeLoop: string;
  labelDefault: string;
  labelExecuted: string;
  labelLoop: string;
  pathGlow: string;
}

/** Default colors derived from raw theme defaults. Consumer can override per-call. */
const DEFAULT_COLORS: FlowchartColors = {
  edgeDefault: rawDefaults.colors.textMuted,
  edgeExecuted: rawDefaults.colors.success,
  edgeActive: rawDefaults.colors.primary,
  edgeLoop: rawDefaults.colors.warning,
  labelDefault: rawDefaults.colors.textSecondary,
  labelExecuted: rawDefaults.colors.success,
  labelLoop: rawDefaults.colors.warning,
  pathGlow: `${rawDefaults.colors.success}4D`, // ~30% opacity hex
};

// ---------------------------------------------------------------------------
// Phase 1: Static layout (expensive — depends only on spec)
// ---------------------------------------------------------------------------

/** A positioned node with all static info, before overlay is applied. */
export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  label: string;
  isDecider: boolean;
  isFork: boolean;
  description?: string;
  icon?: string;
  subflowId?: string;
  isSubflow: boolean;
  isLazy?: boolean;
}

/** A positioned edge with source/target info. */
export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  isLoop: boolean;
}

/** Static layout output — positions + structure, no execution state. */
export interface SpecLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  /** Maps stage ID → node id for resolving loopTarget references. */
  idToName: Map<string, string>;
}

const Y_STEP = 100;
const X_SPREAD = 200;

function nid(n: SpecNode): string {
  return n.id || n.name || `spec-${Math.random()}`;
}

interface WalkState {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  edgeCounter: number;
  seen: Set<string>;
  idToName: Map<string, string>;
}

function registerNode(state: WalkState, node: SpecNode): void {
  if (node.id && node.name) {
    state.idToName.set(node.id, node.name);
  }
}

function walkLayout(
  node: SpecNode,
  state: WalkState,
  x: number,
  y: number,
): { lastIds: string[]; bottomY: number } {
  if (!node) return { lastIds: [], bottomY: y };
  registerNode(state, node);
  const id = nid(node);

  if (state.seen.has(id)) {
    return { lastIds: [id], bottomY: y };
  }
  state.seen.add(id);

  const isDecider = node.type === "decider" || node.type === "selector" || !!node.hasDecider || !!node.hasSelector;
  const isFork = node.type === "fork";

  state.nodes.push({
    id,
    x,
    y,
    label: node.name,
    isDecider,
    isFork,
    description: node.description,
    icon: node.icon,
    subflowId: node.subflowId,
    isSubflow: !!node.isSubflowRoot,
    isLazy: node.isLazy,
  });

  let lastIds = [id];
  let bottomY = y;

  // Handle children (fork/decider branches)
  if (node.children && node.children.length > 0) {
    const totalWidth = (node.children.length - 1) * X_SPREAD;
    const startX = x - totalWidth / 2;
    const childY = y + Y_STEP;
    const childResults: { lastIds: string[]; bottomY: number }[] = [];

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (!child) continue;
      const childX = startX + i * X_SPREAD;
      const edgeLabel = node.branchIds?.[i];
      state.edgeCounter++;
      state.edges.push({ id: `se${state.edgeCounter}`, source: id, target: nid(child), label: edgeLabel, isLoop: false });
      const result = walkLayout(child, state, childX, childY);
      childResults.push(result);
    }

    lastIds = childResults.flatMap((r) => r.lastIds);
    bottomY = Math.max(...childResults.map((r) => r.bottomY));
  }

  // Loop-back edge
  if (node.loopTarget) {
    // loopTarget is a stage ID — use it directly (ReactFlow node IDs = spec node IDs)
    state.edgeCounter++;
    state.edges.push({ id: `se${state.edgeCounter}`, source: id, target: node.loopTarget, label: "loop", isLoop: true });
  }

  // Linear continuation
  if (node.next) {
    const rawNextId = nid(node.next);
    const resolvedNextId = state.idToName.get(rawNextId) ?? rawNextId;
    const isLoopRef = node.loopTarget && state.seen.has(resolvedNextId);

    if (isLoopRef) {
      // Add dotted back-edge for the loop reference
      for (const lid of lastIds) {
        state.edgeCounter++;
        state.edges.push({ id: `se${state.edgeCounter}`, source: lid, target: resolvedNextId, label: "loop", isLoop: true });
      }
      return { lastIds, bottomY };
    }

    const nextY = bottomY + Y_STEP;
    for (const lid of lastIds) {
      state.edgeCounter++;
      state.edges.push({ id: `se${state.edgeCounter}`, source: lid, target: resolvedNextId, isLoop: false });
    }
    return walkLayout(node.next, state, x, nextY);
  }

  return { lastIds, bottomY };
}

/**
 * Phase 1: Compute static layout from spec. Cached on spec reference — only
 * recomputes when the pipeline structure changes, not on every slider tick.
 */
export function specToLayout(spec: SpecNode): SpecLayout {
  const state: WalkState = {
    nodes: [],
    edges: [],
    edgeCounter: 0,
    seen: new Set(),
    idToName: new Map(),
  };
  walkLayout(spec, state, 300, 0);
  return { nodes: state.nodes, edges: state.edges, idToName: state.idToName };
}

// ---------------------------------------------------------------------------
// Phase 2: Apply overlay (cheap — runs per slider tick)
// ---------------------------------------------------------------------------

/**
 * Phase 2: Apply execution overlay to static layout.
 * Produces ReactFlow nodes/edges with correct colors, step numbers, and glow.
 */
export function applyOverlay(
  layout: SpecLayout,
  overlay?: ExecutionOverlay,
  colors?: Partial<FlowchartColors>,
): { nodes: Node[]; edges: Edge[] } {
  const c = { ...DEFAULT_COLORS, ...colors };
  const o = overlay ?? null;

  // Nodes
  const nodes: Node[] = layout.nodes.map((ln) => {
    const isDone = o ? o.doneStages.has(ln.id) : false;
    const isActive = o ? o.activeStage === ln.id : false;
    const wasExecuted = o ? o.executedStages.has(ln.id) : false;
    const dimmed = o && !wasExecuted;

    let stepNumbers: number[] | undefined;
    if (o?.executionOrder) {
      const nums: number[] = [];
      for (let i = 0; i < o.executionOrder.length; i++) {
        if (o.executionOrder[i] === ln.id) nums.push(i + 1);
      }
      if (nums.length > 0) stepNumbers = nums;
    }

    return {
      id: ln.id,
      position: { x: ln.x, y: ln.y },
      data: {
        label: ln.label,
        active: isActive,
        done: isDone,
        error: false,
        isDecider: ln.isDecider,
        isFork: ln.isFork,
        description: ln.description,
        icon: ln.icon,
        subflowId: ln.subflowId,
        dimmed,
        stepNumbers,
        isSubflow: ln.isSubflow,
        isLazy: ln.isLazy,
      },
      type: "stage" as const,
      style: dimmed ? { opacity: 0.35 } : undefined,
    };
  });

  // Edges
  const edges: Edge[] = [];
  for (const le of layout.edges) {
    const executed = o && o.executedStages.has(le.source) && o.executedStages.has(le.target);
    const isLeadingEdge = o && le.source === o.activeStage && !o.doneStages.has(le.target);

    if (le.isLoop) {
      let loopExecuted = false;
      if (o?.executionOrder) {
        const lastSourceIdx = o.executionOrder.lastIndexOf(le.source);
        if (lastSourceIdx >= 0) {
          loopExecuted = o.executionOrder.slice(lastSourceIdx + 1).includes(le.target);
        }
      }
      edges.push({
        id: le.id,
        source: le.source,
        target: le.target,
        sourceHandle: "loop-source",
        targetHandle: "loop-target",
        label: le.label ?? "loop",
        type: "smoothstep",
        pathOptions: { offset: 100, borderRadius: 24 },
        markerEnd: { type: MarkerType.ArrowClosed, color: c.edgeLoop, width: 16, height: 16 },
        style: {
          stroke: c.edgeLoop,
          strokeWidth: loopExecuted ? 3 : 2,
          strokeDasharray: "6 3",
          opacity: o && !loopExecuted ? 0.35 : 1,
        },
        labelStyle: { fontSize: 10, fontWeight: 700, fill: c.labelLoop },
        animated: loopExecuted,
        zIndex: 2,
      } as Edge);
    } else if (executed) {
      // Glow layer
      edges.push({
        id: `${le.id}-glow`,
        source: le.source,
        target: le.target,
        style: { stroke: c.pathGlow, strokeWidth: 8, opacity: 0.4 },
        zIndex: 0,
        selectable: false,
        focusable: false,
      });
      // Route line
      edges.push({
        id: le.id,
        source: le.source,
        target: le.target,
        label: le.label,
        style: {
          stroke: isLeadingEdge ? c.edgeActive : c.edgeExecuted,
          strokeWidth: 3.5,
        },
        labelStyle: { fontSize: 10, fontWeight: 600, fill: c.labelExecuted },
        animated: !!isLeadingEdge,
        zIndex: 1,
      });
    } else {
      edges.push({
        id: le.id,
        source: le.source,
        target: le.target,
        label: le.label,
        style: {
          stroke: c.edgeDefault,
          strokeWidth: 1.5,
          opacity: o ? 0.3 : 1,
        },
        labelStyle: { fontSize: 10, fill: c.labelDefault },
      });
    }
  }

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Convenience: combined single-call (backwards compatible)
// ---------------------------------------------------------------------------

/**
 * Convert a pipeline spec to ReactFlow graph.
 * Pass `overlay` to color nodes/edges by execution state.
 */
export function specToReactFlow(
  spec: SpecNode,
  overlay?: ExecutionOverlay,
  colors?: Partial<FlowchartColors>,
): { nodes: Node[]; edges: Edge[] } {
  const layout = specToLayout(spec);
  return applyOverlay(layout, overlay, colors);
}
