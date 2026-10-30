import dagre from "dagre";
import type {
  FlowDiagramDefinition,
  FlowDiagramEdge,
  FlowDiagramEdgeState,
  FlowDiagramNode,
  FlowDiagramNodeState,
  GroupedFlowDiagramModelOptions,
  GroupedFlowDiagramModelResult,
  PositionedFlowDiagramEdge,
  PositionedFlowDiagramNode,
} from "./types";

const MAX_NODES = 512;
const MAX_EDGES = 1024;
const MAX_GROUP_DEPTH = 16;
const PADDING = 24;
const HEADER_HEIGHT = 72;
const CANVAS_PADDING = 24;
const STEP_WIDTH = 180;
const STEP_HEIGHT = 148;
const DECISION_HEIGHT = 172;
const GROUP_MIN_WIDTH = 220;
const GROUP_MIN_HEIGHT = 168;

const ERROR = {
  definition: "Provide a diagram with plain data objects and bounded node and edge arrays.",
  nodes: "Provide up to 512 nodes with unique IDs, short labels, and valid node details.",
  edges: "Provide up to 1024 edges with unique IDs, short labels, and existing node endpoints.",
  hierarchy: "Use existing groups as parents, remove parent cycles, and limit nesting to 16 groups.",
  options: "Provide plain diagram options with a supported direction and bounded ID lists.",
  expansion: "Expand only group IDs declared in this diagram.",
  selection: "Select a node ID declared in this diagram.",
  observation: "Provide valid recorded states only for node and edge IDs declared in this diagram.",
  contradiction: "Resolve conflicting recorded states: an observed connection cannot touch a step marked not run, and a group marked not run cannot contain recorded activity.",
  highlight: "Highlight only node and edge IDs declared in this diagram.",
  layout: "Simplify the diagram structure and try arranging it again.",
} as const;

const admissionMessages = new WeakMap<object, string>();
class AdmissionError extends Error {
  constructor(message: string) {
    super(message);
    admissionMessages.set(this, message);
  }
}
type DataRecord = Record<string, unknown>;

/** Inspect own descriptors before reading host data, so ordinary accessors never run. */
function record(value: unknown, message: string): DataRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new AdmissionError(message);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new AdmissionError(message);
  return value as DataRecord;
}

function field(object: object, key: string, message: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (!descriptor) return undefined;
  if (!("value" in descriptor)) throw new AdmissionError(message);
  return descriptor.value;
}

function array(value: unknown, limit: number, message: string): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new AdmissionError(message);
  const length = field(value, "length", message);
  if (typeof length !== "number" || !Number.isInteger(length) || length > limit) throw new AdmissionError(message);
  const result: unknown[] = [];
  for (let i = 0; i < length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
    if (!descriptor || !("value" in descriptor)) throw new AdmissionError(message);
    result.push(descriptor.value);
  }
  return result;
}

function text(value: unknown, limit: number, message: string, allowEmpty = false): string {
  if (typeof value !== "string" || value.length > limit || (!allowEmpty && !value.trim()) || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new AdmissionError(message);
  }
  return value;
}

function optionalText(value: unknown, limit: number, message: string): string | undefined {
  return value === undefined ? undefined : text(value, limit, message, true);
}

interface AdmittedDefinition {
  nodes: FlowDiagramNode[];
  edges: FlowDiagramEdge[];
  byId: Map<string, FlowDiagramNode>;
  edgeIds: Set<string>;
  ancestors: Map<string, readonly string[]>;
  children: Map<string | undefined, FlowDiagramNode[]>;
}

function admitDefinition(input: unknown): AdmittedDefinition {
  const source = record(input, ERROR.definition);
  const nodeValues = array(field(source, "nodes", ERROR.definition), MAX_NODES, ERROR.nodes);
  const edgeValues = array(field(source, "edges", ERROR.definition), MAX_EDGES, ERROR.edges);
  const byId = new Map<string, FlowDiagramNode>();
  const nodes = nodeValues.map((value): FlowDiagramNode => {
    const item = record(value, ERROR.nodes);
    const id = text(field(item, "id", ERROR.nodes), 256, ERROR.nodes);
    const label = text(field(item, "label", ERROR.nodes), 160, ERROR.nodes);
    const kindValue = field(item, "kind", ERROR.nodes);
    if (kindValue !== undefined && kindValue !== "step" && kindValue !== "decision" && kindValue !== "group") throw new AdmissionError(ERROR.nodes);
    const parentValue = field(item, "parentId", ERROR.nodes);
    const parentId = parentValue === undefined ? undefined : text(parentValue, 256, ERROR.nodes);
    const description = optionalText(field(item, "description", ERROR.nodes), 320, ERROR.nodes);
    const icon = optionalText(field(item, "icon", ERROR.nodes), 32, ERROR.nodes);
    if (icon !== undefined && (!icon.length || /[<>&/\\:\s]/u.test(icon))) throw new AdmissionError(ERROR.nodes);
    if (byId.has(id)) throw new AdmissionError(ERROR.nodes);
    const node: FlowDiagramNode = {
      id, label, kind: kindValue ?? "step",
      ...(parentId !== undefined ? { parentId } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(icon !== undefined ? { icon } : {}),
    };
    byId.set(id, node);
    return node;
  });
  const edgeIds = new Set<string>();
  const edges = edgeValues.map((value): FlowDiagramEdge => {
    const item = record(value, ERROR.edges);
    const id = text(field(item, "id", ERROR.edges), 256, ERROR.edges);
    const sourceId = text(field(item, "source", ERROR.edges), 256, ERROR.edges);
    const target = text(field(item, "target", ERROR.edges), 256, ERROR.edges);
    const label = optionalText(field(item, "label", ERROR.edges), 160, ERROR.edges);
    if (edgeIds.has(id) || !byId.has(sourceId) || !byId.has(target)) throw new AdmissionError(ERROR.edges);
    edgeIds.add(id);
    return { id, source: sourceId, target, ...(label !== undefined ? { label } : {}) };
  });
  const ancestors = new Map<string, readonly string[]>();
  const children = new Map<string | undefined, FlowDiagramNode[]>();
  for (const node of nodes) {
    const path: string[] = [];
    const visited = new Set<string>([node.id]);
    let parentId = node.parentId;
    while (parentId !== undefined) {
      const parent = byId.get(parentId);
      if (!parent || parent.kind !== "group" || visited.has(parentId)) throw new AdmissionError(ERROR.hierarchy);
      visited.add(parentId);
      path.unshift(parentId);
      if (path.length + (node.kind === "group" ? 1 : 0) > MAX_GROUP_DEPTH) throw new AdmissionError(ERROR.hierarchy);
      parentId = parent.parentId;
    }
    ancestors.set(node.id, path);
    const siblings = children.get(node.parentId) ?? [];
    siblings.push(node);
    children.set(node.parentId, siblings);
  }
  return { nodes, edges, byId, edgeIds, ancestors, children };
}

function idList(value: unknown, limit: number, message: string): string[] {
  return value === undefined ? [] : array(value, limit, message).map((item) => text(item, 256, message));
}

function stateMap<T extends string>(value: unknown, ids: { has(id: string): boolean }, limit: number, states: readonly T[]): Map<string, T> {
  const result = new Map<string, T>();
  if (value === undefined) return result;
  const object = record(value, ERROR.observation);
  const keys = Object.getOwnPropertyNames(object);
  if (keys.length > limit || Object.getOwnPropertySymbols(object).length) throw new AdmissionError(ERROR.observation);
  for (const key of keys) {
    const state = field(object, key, ERROR.observation);
    if (!ids.has(key) || typeof state !== "string" || !states.includes(state as T)) throw new AdmissionError(ERROR.observation);
    result.set(key, state as T);
  }
  return result;
}

interface AdmittedOptions {
  expanded: Set<string>;
  direction: "LR" | "TB";
  selectedNodeId?: string;
  nodeStates: Map<string, FlowDiagramNodeState>;
  edgeStates: Map<string, FlowDiagramEdgeState>;
  highlightedNodes: Set<string>;
  highlightedEdges: Set<string>;
}

function admitOptions(value: unknown, definition: AdmittedDefinition): AdmittedOptions {
  const object = value === undefined ? {} : record(value, ERROR.options);
  const directionValue = field(object, "direction", ERROR.options);
  const direction = directionValue === undefined ? "LR" : directionValue;
  if (direction !== "LR" && direction !== "TB") throw new AdmissionError(ERROR.options);
  const expanded = new Set(idList(field(object, "expandedGroupIds", ERROR.options), MAX_NODES, ERROR.options));
  for (const id of expanded) if (definition.byId.get(id)?.kind !== "group") throw new AdmissionError(ERROR.expansion);
  const selected = field(object, "selectedNodeId", ERROR.options);
  const selectedNodeId = selected === undefined ? undefined : text(selected, 256, ERROR.selection);
  if (selectedNodeId !== undefined && !definition.byId.has(selectedNodeId)) throw new AdmissionError(ERROR.selection);
  const observationValue = field(object, "observation", ERROR.options);
  const observation = observationValue === undefined ? {} : record(observationValue, ERROR.observation);
  const nodeStates = stateMap(field(observation, "nodeStates", ERROR.observation), definition.byId, MAX_NODES, ["unknown", "running", "completed", "failed", "not-run"] as const);
  const edgeStates = stateMap(field(observation, "edgeStates", ERROR.observation), definition.edgeIds, MAX_EDGES, ["unknown", "observed", "not-taken"] as const);
  const notRunAtOrAbove = (id: string) => nodeStates.get(id) === "not-run"
    || definition.ancestors.get(id)!.some(parent => nodeStates.get(parent) === "not-run");
  for (const edge of definition.edges) {
    if (edgeStates.get(edge.id) === "observed" && (notRunAtOrAbove(edge.source) || notRunAtOrAbove(edge.target))) {
      throw new AdmissionError(ERROR.contradiction);
    }
  }
  for (const node of definition.nodes) {
    const state = nodeStates.get(node.id);
    if (state === "running" || state === "completed" || state === "failed") {
      if (definition.ancestors.get(node.id)!.some((id) => nodeStates.get(id) === "not-run")) throw new AdmissionError(ERROR.contradiction);
    }
  }
  const highlightValue = field(object, "highlight", ERROR.options);
  const highlight = highlightValue === undefined ? {} : record(highlightValue, ERROR.highlight);
  const highlightedNodes = new Set(idList(field(highlight, "nodeIds", ERROR.highlight), MAX_NODES, ERROR.highlight));
  const highlightedEdges = new Set(idList(field(highlight, "edgeIds", ERROR.highlight), MAX_EDGES, ERROR.highlight));
  for (const id of highlightedNodes) if (!definition.byId.has(id)) throw new AdmissionError(ERROR.highlight);
  for (const id of highlightedEdges) if (!definition.edgeIds.has(id)) throw new AdmissionError(ERROR.highlight);
  // Container emphasis reflects only supplied emphasis and containment. No arrow traversal.
  for (const id of [...highlightedNodes]) for (const parent of definition.ancestors.get(id)!) highlightedNodes.add(parent);
  for (const edge of definition.edges) {
    if (!highlightedEdges.has(edge.id)) continue;
    for (const id of [edge.source, edge.target]) {
      if (definition.byId.get(id)!.kind === "group") highlightedNodes.add(id);
      for (const parent of definition.ancestors.get(id)!) highlightedNodes.add(parent);
    }
  }
  return { expanded, direction, selectedNodeId, nodeStates, edgeStates, highlightedNodes, highlightedEdges };
}

/** Returns root-to-parent group instance IDs; invalid input never opens an arbitrary group. */
export function getFlowDiagramAncestors(definition: FlowDiagramDefinition, nodeId: string): readonly string[] {
  try {
    const admitted = admitDefinition(definition);
    return typeof nodeId === "string" ? [...(admitted.ancestors.get(nodeId) ?? [])] : [];
  } catch {
    return [];
  }
}

interface Size { width: number; height: number }
interface Position { x: number; y: number }

/**
 * Arrange supplied structure with the repository's dagre engine. Each expanded group
 * is sized inside out, then participates as one ordinary box in its parent's layout.
 * Recorded facts and host emphasis never create relationships or execution states.
 */
export function projectGroupedFlowDiagram(
  definition: FlowDiagramDefinition,
  options?: GroupedFlowDiagramModelOptions,
): GroupedFlowDiagramModelResult {
  try {
    const data = admitDefinition(definition);
    const config = admitOptions(options, data);
    const representative = (id: string): string => data.ancestors.get(id)!.find((parent) => !config.expanded.has(parent)) ?? id;
    const edges: PositionedFlowDiagramEdge[] = [];
    for (const edge of data.edges) {
      const source = representative(edge.source);
      const target = representative(edge.target);
      const collapsed = source !== edge.source || target !== edge.target;
      // Only a view-internal hidden relationship disappears. Never join its neighbors.
      if (collapsed && source === target) continue;
      edges.push({ edge, source, target, collapsed, state: config.edgeStates.get(edge.id) ?? "unknown", highlighted: config.highlightedEdges.has(edge.id) });
    }

    const positions = new Map<string, Position>();
    const sizes = new Map<string, Size>();
    const childAtLevel = (id: string, parentId?: string): string | undefined => {
      const path = data.ancestors.get(id)!;
      if (parentId === undefined) return path[0] ?? id;
      const parentIndex = path.indexOf(parentId);
      return parentIndex < 0 ? undefined : path[parentIndex + 1] ?? id;
    };

    const arrangeChildren = (parentId?: string): Size => {
      const children = data.children.get(parentId) ?? [];
      if (!children.length) return { width: 0, height: 0 };
      const graph = new dagre.graphlib.Graph({ multigraph: true });
      graph.setGraph({ rankdir: config.direction, ranksep: 40, nodesep: 44, edgesep: 20, ranker: "longest-path" });
      graph.setDefaultEdgeLabel(() => ({}));
      // Never pass host IDs into graphlib's object-backed key storage.
      const internalIds = new Map<string, string>();
      children.forEach((child, index) => {
        let size: Size;
        if (child.kind === "group" && config.expanded.has(child.id)) {
          const contents = arrangeChildren(child.id);
          size = {
            width: Math.max(GROUP_MIN_WIDTH, contents.width + PADDING * 2),
            height: Math.max(GROUP_MIN_HEIGHT, contents.height + PADDING * 2 + HEADER_HEIGHT),
          };
        } else size = child.kind === "group"
          ? { width: GROUP_MIN_WIDTH, height: GROUP_MIN_HEIGHT }
          : { width: STEP_WIDTH, height: child.kind === "decision" ? DECISION_HEIGHT : STEP_HEIGHT };
        sizes.set(child.id, size);
        const internalId = `n${index}`;
        internalIds.set(child.id, internalId);
        graph.setNode(internalId, size);
      });
      edges.forEach((edge, index) => {
        const source = childAtLevel(edge.source, parentId);
        const target = childAtLevel(edge.target, parentId);
        if (source === undefined || target === undefined || source === target) return;
        const internalSource = internalIds.get(source);
        const internalTarget = internalIds.get(target);
        if (internalSource !== undefined && internalTarget !== undefined) graph.setEdge(internalSource, internalTarget, {}, `e${index}`);
      });
      dagre.layout(graph);
      const raw = children.map((child) => {
        const placed = graph.node(internalIds.get(child.id)!);
        const size = sizes.get(child.id)!;
        if (!placed || !Number.isFinite(placed.x) || !Number.isFinite(placed.y)) throw new Error(ERROR.layout);
        return { child, size, x: placed.x - size.width / 2, y: placed.y - size.height / 2 };
      });
      const minX = Math.min(...raw.map((item) => item.x));
      const minY = Math.min(...raw.map((item) => item.y));
      const offsetX = parentId === undefined ? CANVAS_PADDING : PADDING;
      const offsetY = parentId === undefined ? CANVAS_PADDING : PADDING + HEADER_HEIGHT;
      let width = 0;
      let height = 0;
      for (const item of raw) {
        const x = item.x - minX;
        const y = item.y - minY;
        positions.set(item.child.id, { x: x + offsetX, y: y + offsetY });
        width = Math.max(width, x + item.size.width);
        height = Math.max(height, y + item.size.height);
      }
      return { width, height };
    };

    const canvas = arrangeChildren();
    const issueCounts = new Map<string, number>();
    for (const [id, state] of config.nodeStates) {
      if (state === "failed") for (const parent of data.ancestors.get(id)!) issueCounts.set(parent, (issueCounts.get(parent) ?? 0) + 1);
    }
    const selectedAncestors = new Set(config.selectedNodeId ? data.ancestors.get(config.selectedNodeId) : []);
    const nodes: PositionedFlowDiagramNode[] = [];
    const appendChildren = (parentId?: string) => {
      for (const node of data.children.get(parentId) ?? []) {
        const expanded = node.kind === "group" && config.expanded.has(node.id);
        nodes.push({
          node, ...(node.parentId !== undefined ? { parentId: node.parentId } : {}),
          position: positions.get(node.id)!, ...sizes.get(node.id)!,
          state: config.nodeStates.get(node.id) ?? "unknown", expanded,
          childCount: data.children.get(node.id)?.length ?? 0,
          recordedIssueCount: issueCounts.get(node.id) ?? 0,
          containsSelection: selectedAncestors.has(node.id), highlighted: config.highlightedNodes.has(node.id),
        });
        if (expanded) appendChildren(node.id);
      }
    };
    appendChildren();
    return {
      model: {
        definition: { nodes: data.nodes, edges: data.edges },
        nodes, edges, direction: config.direction,
        width: canvas.width ? canvas.width + CANVAS_PADDING * 2 : 0,
        height: canvas.height ? canvas.height + CANVAS_PADDING * 2 : 0,
        expandedGroupIds: data.nodes.filter((node) => config.expanded.has(node.id)).map((node) => node.id),
      },
    };
  } catch (error) {
    // A hostile proxy can throw another proxy from a reflection trap. WeakMap
    // lookup neither probes its prototype nor reads a potentially hostile message.
    const message = typeof error === "object" && error !== null ? admissionMessages.get(error) : undefined;
    return { error: message ?? ERROR.layout };
  }
}
