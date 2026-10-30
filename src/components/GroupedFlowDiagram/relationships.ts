import type { FlowDiagramFocusRequest, FlowDiagramRecordedRelationship, GroupedFlowDiagramModel } from "./types";

function field(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") throw new Error();
  const item = Object.getOwnPropertyDescriptor(value, key);
  if (!item) return undefined;
  if (!("value" in item)) throw new Error();
  return item.value;
}
function plain(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error();
}
function list(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new Error();
  const length = field(value, "length");
  if (typeof length !== "number" || !Number.isInteger(length) || length < 0 || length > max) throw new Error();
  return Array.from({ length }, (_, index) => {
    const item = Object.getOwnPropertyDescriptor(value, String(index));
    if (!item || !("value" in item)) throw new Error();
    return item.value;
  });
}
function text(value: unknown, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new Error();
  return value;
}
export interface ProjectedRecordedRelationship {
  readonly relationship: FlowDiagramRecordedRelationship;
  readonly source: string;
  readonly target: string;
  readonly collapsed: boolean;
}
/** Project only visible endpoints. This never participates in layout or invents a missing link. */
export function projectRecordedRelationships(value: unknown, model: GroupedFlowDiagramModel): readonly ProjectedRecordedRelationship[] | undefined {
  try {
    if (!model.nodeStates) return undefined;
    const nodeStates = model.nodeStates;
    const nodes = new Map(model.definition.nodes.map(node => [node.id, node]));
    const used = new Set(model.definition.edges.map(edge => edge.id));
    const expanded = new Set(model.expandedGroupIds);
    const notRun = (id: string) => {
      let current: string | undefined = id;
      while (current !== undefined) {
        if (nodeStates[current] === "not-run") return true;
        current = nodes.get(current)?.parentId;
      }
      return false;
    };
    let remaining = 65_536;
    const readText = (value: unknown, maximum: number) => { const result = text(value, maximum); remaining -= result.length; if (remaining < 0) throw new Error(); return result; };
    const representative = (id: string) => {
      const ancestors: string[] = [];
      let parent = nodes.get(id)?.parentId;
      while (parent !== undefined) { ancestors.unshift(parent); parent = nodes.get(parent)?.parentId; }
      return ancestors.find(ancestor => !expanded.has(ancestor)) ?? id;
    };
    const admitted = list(value, 512).map(entry => {
      plain(entry);
      const id = readText(field(entry, "id"), 256), source = readText(field(entry, "source"), 256), target = readText(field(entry, "target"), 256);
      const kind = field(entry, "kind"), attribution = field(entry, "attribution"), direction = field(entry, "direction");
      if (used.has(id) || !nodes.has(source) || !nodes.has(target) || notRun(source) || notRun(target) || (kind !== "data" && kind !== "control")
        || !["per-write", "stage", "recorded-control", "recorded-read"].includes(attribution as string)
        || (direction !== undefined && direction !== "backward" && direction !== "forward")) throw new Error();
      used.add(id);
      return { id, source, target, kind, attribution: attribution as FlowDiagramRecordedRelationship["attribution"],
        evidence: list(field(entry, "evidence"), 32).map(value => readText(value, 2048)), ...(direction !== undefined ? { direction } : {}) } satisfies FlowDiagramRecordedRelationship;
    });
    return admitted.flatMap(relationship => {
      const source = representative(relationship.source), target = representative(relationship.target);
      const collapsed = source !== relationship.source || target !== relationship.target;
      return collapsed && source === target ? [] : [{ relationship, source, target, collapsed }];
    });
  } catch { return undefined; }
}

export function admitFocusRequest(value: unknown, model: GroupedFlowDiagramModel): FlowDiagramFocusRequest | undefined {
  try {
    plain(value);
    const known = new Set(model.definition.nodes.map(node => node.id));
    const nodeIds = list(field(value, "nodeIds"), 512).map(value => text(value, 256));
    if (nodeIds.some(id => !known.has(id))) return undefined;
    return { key: field(value, "key"), nodeIds: [...new Set(nodeIds)] };
  } catch { return undefined; }
}
