/**
 * Converts a SerializedPipelineStructure (from builder.toSpec()) into
 * ReactFlow nodes and edges with auto-layout.
 *
 * Supports two modes:
 * 1. Build-time only (no executionState) — all nodes gray
 * 2. With execution overlay — executed nodes colored, active node highlighted,
 *    unvisited nodes stay gray
 */
import type { Node, Edge } from "@xyflow/react";
import { rawDefaults } from "../../theme/tokens";

export interface SpecNode {
  name: string;
  id?: string;
  type?: "stage" | "decider" | "fork" | "streaming";
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

interface LayoutState {
  nodes: Node[];
  edges: Edge[];
  edgeCounter: number;
  seen: Set<string>;
  overlay: ExecutionOverlay | null;
  colors: FlowchartColors;
  /** Maps stage ID → stage name for resolving loopTarget references. */
  idToName: Map<string, string>;
}

const Y_STEP = 100;
const X_SPREAD = 200;

function nid(n: SpecNode): string {
  return n.name || n.id || `spec-${Math.random()}`;
}

/** Collect id→name mappings during the first pass of walk (no separate traversal). */
function registerNode(state: LayoutState, node: SpecNode): void {
  if (node.id && node.name) {
    state.idToName.set(node.id, node.name);
  }
}

function addEdge(
  state: LayoutState,
  source: string,
  target: string,
  label?: string,
  isLoop?: boolean
) {
  state.edgeCounter++;
  const o = state.overlay;
  const c = state.colors;
  const executed =
    o && o.executedStages.has(source) && o.executedStages.has(target);
  const isLeadingEdge = o && source === o.activeStage && !o.doneStages.has(target);

  // Loop edges — route via right-side handles so they don't overlap center edges
  // Only mark as executed when the loop has actually fired:
  // the target must appear AFTER the source in executionOrder
  if (isLoop) {
    let loopExecuted = false;
    if (o?.executionOrder) {
      const lastSourceIdx = o.executionOrder.lastIndexOf(source);
      if (lastSourceIdx >= 0) {
        loopExecuted = o.executionOrder.slice(lastSourceIdx + 1).includes(target);
      }
    }

    state.edges.push({
      id: `se${state.edgeCounter}`,
      source,
      target,
      sourceHandle: "loop-source",
      targetHandle: "loop-target",
      label: label ?? "loop",
      type: "smoothstep",
      pathOptions: { offset: 40, borderRadius: 16 },
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
    return;
  }

  if (executed) {
    // "Google Maps route" — thick glowing path for executed edges
    // Background glow layer (subtle, behind the route line)
    state.edges.push({
      id: `se${state.edgeCounter}-glow`,
      source,
      target,
      style: {
        stroke: c.pathGlow,
        strokeWidth: 8,
        opacity: 0.4,
      },
      zIndex: 0,
      selectable: false,
      focusable: false,
    });
    // Foreground path (solid route line)
    state.edges.push({
      id: `se${state.edgeCounter}`,
      source,
      target,
      label,
      style: {
        stroke: isLeadingEdge ? c.edgeActive : c.edgeExecuted,
        strokeWidth: 3.5,
      },
      labelStyle: { fontSize: 10, fontWeight: 600, fill: c.labelExecuted },
      animated: !!isLeadingEdge,
      zIndex: 1,
    });
  } else {
    // Non-executed — thin, faded base map edge
    state.edges.push({
      id: `se${state.edgeCounter}`,
      source,
      target,
      label,
      style: {
        stroke: c.edgeDefault,
        strokeWidth: 1.5,
        opacity: o ? 0.3 : 1,
      },
      labelStyle: { fontSize: 10, fill: c.labelDefault },
    });
  }
}

function walk(
  node: SpecNode,
  state: LayoutState,
  x: number,
  y: number
): { lastIds: string[]; bottomY: number } {
  // Register id→name during traversal (no separate tree walk)
  registerNode(state, node);
  const id = nid(node);

  if (state.seen.has(id)) {
    return { lastIds: [id], bottomY: y };
  }
  state.seen.add(id);

  const isDecider = node.type === "decider" || node.hasDecider;
  const isFork = node.type === "fork";
  const o = state.overlay;

  const isDone = o ? o.doneStages.has(id) : false;
  const isActive = o ? o.activeStage === id : false;
  const wasExecuted = o ? o.executedStages.has(id) : false;
  // When overlay is present, dim unvisited nodes
  const dimmed = o && !wasExecuted;

  // Step numbers for executed nodes (1-based) — multiple when revisited via loops
  let stepNumbers: number[] | undefined;
  if (o?.executionOrder) {
    const nums: number[] = [];
    for (let i = 0; i < o.executionOrder.length; i++) {
      if (o.executionOrder[i] === id) nums.push(i + 1);
    }
    if (nums.length > 0) stepNumbers = nums;
  }

  state.nodes.push({
    id,
    position: { x, y },
    data: {
      label: node.name,
      active: isActive,
      done: isDone,
      error: false,
      isDecider,
      isFork,
      description: node.description,
      icon: node.icon,
      subflowId: node.subflowId,
      dimmed,
      stepNumbers,
      isSubflow: !!node.isSubflowRoot,
    },
    type: "stage",
    style: dimmed ? { opacity: 0.35 } : undefined,
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
      const childX = startX + i * X_SPREAD;
      const edgeLabel = node.branchIds?.[i];
      addEdge(state, id, nid(child), edgeLabel);
      const result = walk(child, state, childX, childY);
      childResults.push(result);
    }

    lastIds = childResults.flatMap((r) => r.lastIds);
    bottomY = Math.max(...childResults.map((r) => r.bottomY));
  }

  // Handle loop-back edge — visually distinct dashed orange arrow
  // Must be added before processing `next`, since `next` returns early
  if (node.loopTarget) {
    // loopTarget stores stage ID (e.g., "call-llm"), resolve to node name used by nid()
    const resolvedTarget = state.idToName.get(node.loopTarget) ?? node.loopTarget;
    addEdge(state, id, resolvedTarget, "loop", true);
  }

  // Handle linear continuation
  if (node.next) {
    // If this is a loop reference (next points back to an existing stage by ID),
    // resolve to the actual node name and skip creating a duplicate node
    const rawNextId = nid(node.next);
    const resolvedNextId = state.idToName.get(rawNextId) ?? rawNextId;
    const isLoopRef = node.loopTarget && state.seen.has(resolvedNextId);

    if (isLoopRef) {
      // Loop reference — don't walk further, edges already handled by loopTarget
      return { lastIds, bottomY };
    }

    const nextY = bottomY + Y_STEP;
    for (const lid of lastIds) {
      addEdge(state, lid, resolvedNextId);
    }
    const result = walk(node.next, state, x, nextY);
    return result;
  }

  return { lastIds, bottomY };
}

/**
 * Convert a pipeline spec to ReactFlow graph.
 * Pass `overlay` to color nodes/edges by execution state.
 */
export function specToReactFlow(
  spec: SpecNode,
  overlay?: ExecutionOverlay,
  colors?: Partial<FlowchartColors>
): {
  nodes: Node[];
  edges: Edge[];
} {
  const state: LayoutState = {
    nodes: [],
    edges: [],
    edgeCounter: 0,
    seen: new Set(),
    overlay: overlay ?? null,
    colors: { ...DEFAULT_COLORS, ...colors },
    idToName: new Map(),
  };

  walk(spec, state, 300, 0);

  return { nodes: state.nodes, edges: state.edges };
}
