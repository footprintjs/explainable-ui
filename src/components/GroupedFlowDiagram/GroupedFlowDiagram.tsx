import { useContext, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Background, Controls, MarkerType, ReactFlow, type Edge } from "@xyflow/react";
import { theme } from "../../theme";
import { ChartAutoRefit } from "../FlowchartView/_internal/useChartAutoRefit";
import { diagramNodeTypes, type DiagramReactNode } from "./DiagramNodes";
import { getFlowDiagramAncestors, projectGroupedFlowDiagram } from "./layout";
import type { FlowDiagramDefinition, FlowDiagramHighlight, FlowDiagramObservation, FlowDiagramFocusRequest, FlowDiagramRecordedRelationship } from "./types";
import { admitFocusRequest, projectRecordedRelationships } from "./relationships";
import { recordedRelationshipEdgeTypes } from "./RecordedRelationshipEdge";
import { recordedVisualBounds, routeRecordedRelationships } from "./recordedRouting";
import { RecordedFocusContext, visibleRecordedFitTargets } from "./presentation";
import type { RecordedPort } from "./recordedRouting";

export interface GroupedFlowDiagramProps {
  readonly definition: FlowDiagramDefinition;
  readonly observation?: FlowDiagramObservation;
  readonly highlight?: FlowDiagramHighlight;
  readonly recordedRelationships?: readonly FlowDiagramRecordedRelationship[];
  readonly focusRequest?: FlowDiagramFocusRequest;
  readonly selectedNodeId?: string | null;
  readonly onSelectNode?: (nodeId: string) => void;
  readonly expandedGroupIds?: readonly string[];
  readonly defaultExpandedGroupIds?: readonly string[];
  readonly onExpandedGroupIdsChange?: (groupIds: readonly string[]) => void;
  readonly direction?: "LR" | "TB";
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly "aria-label"?: string;
}

const buttonStyle: CSSProperties = { font: "inherit", fontSize: 12, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "7px 12px", background: theme.bgElevated, color: theme.textPrimary, cursor: "pointer" };

/** Reusable view of host-supplied structure and facts. It neither executes flows nor discovers causes. */
export function GroupedFlowDiagram(props: GroupedFlowDiagramProps) {
  const { focused: recordedFocus, fitNodeIds } = useContext(RecordedFocusContext);
  const [localExpanded, setLocalExpanded] = useState<readonly string[]>(props.defaultExpandedGroupIds ?? []);
  const [localSelected, setLocalSelected] = useState<string>();
  const wrapper = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [focusIds, setFocusIds] = useState<readonly string[]>();
  const [focusRequest, setFocusRequest] = useState(0);
  const initiallyFocused = useRef(false);
  const expanded = props.expandedGroupIds ?? localExpanded;
  const selected = props.selectedNodeId === undefined ? localSelected : props.selectedNodeId ?? undefined;
  const canToggle = props.expandedGroupIds === undefined || typeof props.onExpandedGroupIdsChange === "function";
  const result = useMemo(() => projectGroupedFlowDiagram(props.definition, { expandedGroupIds: expanded,
    observation: props.observation, highlight: props.highlight, selectedNodeId: selected, direction: props.direction }),
  [props.definition, expanded, props.observation, props.highlight, selected, props.direction]);
  const model = result.model;
  const overlay = useMemo(() => !model || props.recordedRelationships === undefined ? [] : projectRecordedRelationships(props.recordedRelationships, model), [model, props.recordedRelationships]);
  const routing = useMemo(() => model && overlay ? routeRecordedRelationships(overlay, model) : undefined, [model, overlay]);
  const visualBounds = useMemo(() => routing && overlay ? recordedVisualBounds(routing, overlay, focusIds) : undefined, [routing, overlay, focusIds]);
  const fitTargets = useMemo(() => model && recordedFocus ? visibleRecordedFitTargets(fitNodeIds ?? [], model) : undefined, [model, recordedFocus, fitNodeIds]);
  const camera = useMemo(() => {
    if (!model || props.focusRequest === undefined) return undefined;
    const requested = admitFocusRequest(props.focusRequest, model);
    if (!requested || !recordedFocus || !requested.nodeIds.length) return requested;
    const visible = visibleRecordedFitTargets(requested.nodeIds, model);
    return visible ? { ...requested, nodeIds: visible } : undefined;
  }, [model, props.focusRequest, recordedFocus]);
  const lastCameraKey = useRef<unknown>(Symbol());
  const changeExpanded = (next: readonly string[]) => {
    if (props.expandedGroupIds === undefined) setLocalExpanded(next);
    props.onExpandedGroupIdsChange?.(next);
  };
  const select = (id: string) => {
    if (props.selectedNodeId === undefined) setLocalSelected(id);
    props.onSelectNode?.(id);
  };
  const requestFocus = (ids?: readonly string[]) => { setFocusIds(ids); setFocusRequest(value => value + 1); };
  // Read only the already-admitted definition. IDs remain identity; display labels may repeat.
  const names = useMemo(() => {
    if (!model) return new Map<string, string>();
    const groups = model.definition.nodes.filter(node => node.kind === "group");
    const groupIndex = new Map(groups.map((node, index) => [node.id, index + 1]));
    const counts = new Map<string, number>();
    const siblingCounts = new Map<string, number>();
    for (const node of model.definition.nodes) {
      counts.set(node.label, (counts.get(node.label) ?? 0) + 1);
      const key = JSON.stringify([node.parentId ?? null, node.label]);
      siblingCounts.set(key, (siblingCounts.get(key) ?? 0) + 1);
    }
    return new Map(model.definition.nodes.map((node, index) => {
      const duplicate = (counts.get(node.label) ?? 0) > 1;
      if (node.kind === "group" && duplicate) return [node.id, `Group ${groupIndex.get(node.id)}`];
      const context = node.parentId ? `Group ${groupIndex.get(node.parentId)}` : "";
      const siblingDuplicate = (siblingCounts.get(JSON.stringify([node.parentId ?? null, node.label])) ?? 0) > 1;
      return [node.id, [context, siblingDuplicate || (!node.parentId && duplicate) ? `Item ${index + 1}` : ""].filter(Boolean).join(" · ")];
    }));
  }, [props.definition, model]);
  const ports = new Map<string, RecordedPort[]>();
  for (const item of overlay ?? []) {
    const route = routing?.routes.get(item.relationship.id); if (!route) continue;
    ports.set(item.source, [...ports.get(item.source) ?? [], route.sourcePort]); ports.set(item.target, [...ports.get(item.target) ?? [], route.targetPort]);
  }
  const nodes: DiagramReactNode[] = model?.nodes.map(item => ({ id: item.node.id, type: item.expanded ? "flowDiagramGroup" : "flowDiagramItem",
    parentId: item.parentId, position: item.position, width: item.width, height: item.height,
    style: { width: item.width, height: item.height, pointerEvents: "all", ...(recordedFocus && !item.highlighted ? { opacity: .28 } : {}) }, draggable: false, selectable: false,
    data: { item, caption: names.get(item.node.id) ?? "", selected: item.node.id === selected,
      direction: model.direction, canToggle, recordedPorts: ports.get(item.node.id), onToggle: (id: string) => {
        requestFocus(narrow ? [id] : undefined);
        changeExpanded(model.expandedGroupIds.includes(id) ? model.expandedGroupIds.filter(value => value !== id) : [...model.expandedGroupIds, id]);
      }, onSelect: select },
  })) ?? [];
  const edges: Edge[] = model?.edges.map(item => {
    const color = item.highlighted ? theme.tracing : theme.textMuted;
    return { id: item.edge.id, source: item.source, target: item.target, type: "smoothstep", label: item.edge.label, ...(recordedFocus ? { hidden: true } : {}),
      className: `gfd-edge-${item.state}${item.highlighted ? " gfd-edge-highlighted" : ""}`,
      ariaLabel: `${item.edge.label ?? "Relationship"}. ${item.state === "observed" ? "Recorded" : item.state === "not-taken" ? "Not taken (recorded)" : "Not verified"}${item.collapsed ? ". Grouped view of the original relationship" : ""}.`,
      markerEnd: { type: MarkerType.ArrowClosed, color },
      style: { stroke: color, strokeWidth: item.highlighted ? 4 : 2, ...(item.state !== "observed" ? { strokeDasharray: "6 5" } : {}) },
      labelStyle: { fill: theme.textPrimary, fontSize: 12, fontWeight: 600 }, labelBgStyle: { fill: theme.bgElevated }, labelBgPadding: [7, 4],
    };
  }) ?? [];
  // Camera targets include a highlighted connection's visible endpoints without
  // promoting those endpoints to recorded/highlighted evidence. A hidden internal
  // connection is represented by its collapsed group. Expanded frames are a last
  // resort so ancestor emphasis does not overwhelm a more precise leaf target.
  const highlightFocusIds = new Set(model?.nodes.filter(node => node.highlighted && !node.expanded).map(node => node.node.id));
  for (const edge of model?.edges ?? []) {
    if (edge.highlighted) { highlightFocusIds.add(edge.source); highlightFocusIds.add(edge.target); }
  }
  if (!highlightFocusIds.size) for (const node of model?.nodes ?? []) if (node.highlighted) highlightFocusIds.add(node.node.id);
  const relationshipLabels = { "per-write": "Per-write link", stage: "Step-level link", "recorded-control": "Recorded control", "recorded-read": "Recorded read" };
  for (const item of overlay ?? []) {
    const relationship = item.relationship;
    const route = routing?.routes.get(relationship.id); if (!route) continue;
    const color = relationship.direction === "backward" ? theme.error : relationship.direction === "forward" ? theme.tracing : theme.textSecondary;
    edges.push({ id: relationship.id, source: item.source, target: item.target, type: "recordedRelationship",
      sourceHandle: route.sourcePort.id, targetHandle: route.targetPort.id,
      label: `${relationshipLabels[relationship.attribution]} · ${relationship.kind}`,
      ariaLabel: `${relationship.direction === "backward" ? "Backward source trail, not a failed step. " : relationship.direction === "forward" ? "Forward recorded impact. " : "Recorded dependency. "}${relationshipLabels[relationship.attribution]}. ${relationship.kind} dependency.${item.collapsed ? " Grouped view of the original relationship." : ""}`,
      data: { relationship, collapsed: item.collapsed, route }, className: "gfd-recorded-relationship",
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
      style: { stroke: color, strokeWidth: 1.8, ...(relationship.attribution === "stage" ? { strokeDasharray: "6 5" } : {}) },
      labelStyle: { fill: theme.textPrimary, fontSize: 12 }, labelBgStyle: { fill: theme.bgElevated }, labelBgPadding: [7, 4] });
  }
  useEffect(() => {
    if (!camera || Object.is(lastCameraKey.current, camera.key)) return;
    lastCameraKey.current = camera.key;
    requestFocus(camera.nodeIds.length ? camera.nodeIds : undefined);
  }, [Boolean(camera), camera?.key]);
  const geometry = model ? JSON.stringify(model.nodes.map(node => [node.node.id, node.parentId, node.position, node.width, node.height])) : "";
  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const measure = () => setNarrow(element.clientWidth > 0 && element.clientWidth < 600);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [Boolean(model)]);
  useEffect(() => {
    if (model && narrow && !initiallyFocused.current && selected && model.nodes.some(node => node.node.id === selected)) {
      initiallyFocused.current = true;
      requestFocus([selected]);
    }
  }, [model, selected, narrow]);

  if (!model || !overlay || (props.focusRequest !== undefined && !camera)) return <section role="alert" className={props.className} style={{ color: theme.textPrimary, fontFamily: theme.fontSans, ...props.style }}>
    <p>This diagram cannot be shown yet. Its saved information or grouping needs checking.</p>
    <details><summary>How to fix this diagram</summary><p>{result.error ?? (!overlay ? "Provide bounded recorded relationships with unique IDs, declared endpoints and supported attribution." : "Focus only declared diagram items using a bounded plain camera request.")}</p></details>
    {props.expandedGroupIds === undefined && props.selectedNodeId === undefined && <button type="button" style={buttonStyle} onClick={() => { setLocalExpanded([]); setLocalSelected(undefined); }}>Reset view</button>}
  </section>;

  return <section className={props.className} aria-label={props["aria-label"] ?? "Grouped flow diagram"}
    data-camera-focus={focusIds?.join(" ") ?? "overview"} data-narrow={narrow} data-direction={model.direction} data-investigation-focus={recordedFocus}
    style={{ display: "flex", flexDirection: "column", width: "100%", height: 560, minHeight: 320, minWidth: 0, fontFamily: theme.fontSans, color: theme.textPrimary, ...props.style }}>
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 0" }}>
      <button type="button" style={buttonStyle} disabled={recordedFocus && !fitTargets?.length} onClick={() => {
        if (recordedFocus) { if (fitTargets?.length) requestFocus(fitTargets); }
        else requestFocus();
      }}>{recordedFocus ? "Fit recorded view" : "Fit diagram"}</button>
      <button type="button" style={buttonStyle} disabled={!selected || !canToggle} onClick={() => {
        if (!selected) return;
        requestFocus([selected]);
        const next = [...new Set([...model.expandedGroupIds, ...getFlowDiagramAncestors(model.definition, selected)])];
        changeExpanded(next);
      }}>Reveal selection</button>
      <button type="button" style={buttonStyle} disabled={!highlightFocusIds.size} onClick={() => {
        if (highlightFocusIds.size) requestFocus([...highlightFocusIds]);
      }}>{recordedFocus ? "All recorded connections" : "Focus highlighted path"}</button>
      <span style={{ fontSize: 11, color: theme.textSecondary }}>Open a flow to see its steps. Missing information stays unknown.</span>
    </div>
    {recordedFocus && !fitTargets?.length && <p role="status">The recorded view cannot be fitted yet. Check its diagram mapping or expand the containing flow.</p>}
    <div ref={wrapper} style={{ flex: 1, minHeight: 220, minWidth: 0, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: "hidden", background: theme.bg }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={diagramNodeTypes} edgeTypes={recordedRelationshipEdgeTypes}
        nodesDraggable={false} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false} minZoom={.1} maxZoom={1.6} preventScrolling={false} proOptions={{ hideAttribution: true }}>
        <ChartAutoRefit wrapperRef={wrapper} refitKey={geometry} padding={.06} focusNodeIds={focusIds} focusRequestKey={focusRequest} maxAutoZoom={1} visualBounds={visualBounds} />
        <Background gap={24} color={theme.border} /><Controls showInteractive={false} />
      </ReactFlow>
    </div>
    {!!routing?.undrawn && <p role="status" data-routing-unavailable={routing.undrawn} style={{ margin: "8px 0 0", fontSize: 12 }}>
      {routing.undrawn} recorded {routing.undrawn === 1 ? "connection could" : "connections could"} not be drawn. Expand the flow or inspect the recorded evidence. The explanation is unchanged.
    </p>}
    <p style={{ margin: "8px 0 0", fontSize: 11, color: theme.textSecondary }}>✓ Completed step · × Failed step · ? Unknown · Dashed relationship: not verified or recorded as not taken{overlay.length > 0 ? " · Warm backward links: recorded sources, not failed steps · Teal forward links: recorded impact, not proof of harm" : ""}</p>
  </section>;
}
