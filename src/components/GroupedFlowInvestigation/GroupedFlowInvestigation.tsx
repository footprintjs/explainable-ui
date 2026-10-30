import { useEffect, useMemo, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "../../_internal/useIsomorphicLayoutEffect";
import { theme } from "../../theme";
import { GroupedFlowDiagram } from "../GroupedFlowDiagram/GroupedFlowDiagram";
import { projectGroupedFlowDiagram } from "../GroupedFlowDiagram/layout";
import type { GroupedFlowDiagramModel } from "../GroupedFlowDiagram/types";
import { InvestigationPanel, InvestigationPanelView } from "../InvestigationPanel/InvestigationPanel";
import { admitVisualExplanation } from "../InvestigationPanel/admission";
import { useInvestigationQuery } from "../InvestigationPanel/useInvestigationQuery";
import type { InvestigationPort } from "../InvestigationPanel/types";
import { projectInvestigation } from "./projection";
import { DependencyEvidence } from "./DependencyEvidence";
import type { GroupedFlowInvestigationProps } from "./types";

const action = { font: "inherit", fontSize: 12, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "7px 12px", background: theme.bgElevated, color: theme.textPrimary, cursor: "pointer" };

/** User-initiated investigation over one host-bound recording. No graph storage or causal search lives here. */
export function GroupedFlowInvestigation(props: GroupedFlowInvestigationProps) {
  const admitted = useMemo(() => {
    return projectGroupedFlowDiagram(props.definition, { observation: props.observation });
  }, [props.definition, props.observation]);
  if (!admitted.model) return <GroupedFlowDiagram definition={props.definition} observation={props.observation} className={props.className} style={props.style} />;
  if (!props.port) return <section className={props.className} style={props.style}>
    <GroupedFlowDiagram definition={admitted.model.definition} observation={props.observation} direction={props.direction} />
    <InvestigationPanel port={null} />
  </section>;
  return <BoundGroupedFlowInvestigation {...props} port={props.port} admitted={admitted.model} />;
}

function BoundGroupedFlowInvestigation({ admitted, port, ...props }: GroupedFlowInvestigationProps & { admitted: GroupedFlowDiagramModel; port: InvestigationPort }) {
  const controller = useInvestigationQuery(port, admitVisualExplanation);
  const { owner, selected } = controller;
  const ready = selected?.status === "ready" ? selected : undefined;
  const wrapper = useRef<HTMLElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [expansion, setExpansion] = useState<{ owner: object; ids: readonly string[] }>({ owner, ids: [] });
  const [mode, setMode] = useState<{ request: AbortController; value: "cause" | "impact" }>();
  const [focusCommand, setFocusCommand] = useState<{ request: AbortController; phase: "cause" | "impact"; count: number }>();
  const phase = mode && mode.request === selected?.request ? mode.value : "cause";
  const diagramBindings = useRef(new WeakMap<object, number>());
  const nextDiagramBinding = useRef(0);
  const diagramBindingKey = useMemo(() => {
    let key = diagramBindings.current.get(owner);
    if (key === undefined) { key = nextDiagramBinding.current++; diagramBindings.current.set(owner, key); }
    // Reserving an identity for a speculative owner does not invalidate the
    // committed owner's key if that render is abandoned.
    return key;
  }, [owner]);
  const known = useMemo(() => new Map(admitted.definition.nodes.map(node => [node.id, node])), [admitted.definition]);
  const states = useMemo(() => new Map(Object.entries(admitted.nodeStates ?? {})), [admitted]);
  const projected = useMemo(() => ready ? projectInvestigation(admitted.definition, ready.result, phase) : undefined, [admitted.definition, ready, phase]);
  const currentIds = expansion.owner === owner ? expansion.ids : [];
  const automaticExpansion = useRef<{ request: AbortController; phase: "cause" | "impact" } | undefined>(undefined);
  const needsReveal = ready && (automaticExpansion.current?.request !== ready.request || automaticExpansion.current?.phase !== phase);
  const expandedGroupIds = needsReveal ? [...new Set([...currentIds, ...projected?.groupIds ?? []])] : currentIds;
  useIsomorphicLayoutEffect(() => {
    if (!ready || !needsReveal) return;
    automaticExpansion.current = { request: ready.request, phase };
    setExpansion({ owner, ids: expandedGroupIds });
  });
  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const measure = () => setNarrow(element.clientWidth > 0 && element.clientWidth < 600);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const selectedId = controller.selection && known.has(controller.selection) ? controller.selection : null;
  const activeFocusCommand = focusCommand?.request === ready?.request && focusCommand?.phase === phase ? focusCommand : undefined;
  const cameraKey = useMemo(() => ({ owner, request: ready?.request, phase, command: activeFocusCommand }), [owner, ready?.request, phase, activeFocusCommand]);
  let focusNodeIds = [...new Set([...(projected?.groupIds ?? []), ...(projected?.nodeIds ?? [])])];
  if (ready && (activeFocusCommand || narrow)) {
    const target = !activeFocusCommand && phase === "cause" && ready.result.rootCause && known.has(ready.result.rootCause) ? ready.result.rootCause : selectedId;
    focusNodeIds = target ? [target] : [];
  }
  const choose = (nodeId: string) => {
    if (!known.has(nodeId)) return;
    if (states.get(nodeId) === "failed") controller.query(nodeId);
    else controller.select(nodeId);
  };
  const root = ready?.result.rootCause;
  let mappedRoot = root && known.has(root) ? root : undefined;
  for (let id = mappedRoot; id !== undefined; id = known.get(id)?.parentId) {
    if (states.get(id) === "not-run") { mappedRoot = undefined; break; }
  }
  const summary = selected?.status === "loading" ? "Checking recorded evidence…"
    : ready && mappedRoot ? `Supported cause: ${known.get(mappedRoot)!.label}. ${phase === "cause" ? "The recorded path is highlighted below." : "Showing recorded affected items below."}`
    : ready && root && !known.has(root) ? "The supported cause is not shown in this diagram. No substitute card is labelled."
    : ready || selected?.status === "error" || selected?.status === "refused" ? "Cause unknown. The available evidence does not support a cause on this diagram."
    : "Select a failed item, or select another item and choose Investigate selected item.";
  return <section ref={wrapper} className={props.className} aria-label={props["aria-label"] ?? "Grouped flow investigation"}
    style={{ display: "grid", gap: 16, minWidth: 0, color: theme.textPrimary, fontFamily: theme.fontSans, ...props.style }}>
    <div role="status" aria-label="Cause summary" aria-live="polite" style={{ padding: "12px 16px", border: `1px solid ${theme.border}`, borderRadius: 10, background: theme.bgElevated }}>
      <strong>{summary}</strong>
    </div>
    <GroupedFlowDiagram key={diagramBindingKey} definition={admitted.definition} observation={props.observation} direction={props.direction}
      selectedNodeId={selectedId} onSelectNode={choose} expandedGroupIds={expandedGroupIds} onExpandedGroupIdsChange={ids => setExpansion({ owner, ids })}
      highlight={projected ? { nodeIds: projected.nodeIds, ...(phase === "cause" && mappedRoot ? { rootCauseId: mappedRoot } : {}) } : undefined} recordedRelationships={projected?.relationships}
      focusRequest={ready && focusNodeIds.length ? { key: cameraKey, nodeIds: focusNodeIds } : undefined} />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <button type="button" style={action} disabled={!selectedId || selected?.status === "loading"} onClick={() => { if (selectedId) controller.query(selectedId); }}>Investigate selected item</button>
      <button type="button" style={action} disabled={!ready} aria-pressed={phase === "cause"} onClick={() => { if (ready) setMode({ request: ready.request, value: "cause" }); }}>Why it happened</button>
      <button type="button" style={action} disabled={!ready} aria-pressed={phase === "impact"} onClick={() => { if (ready) setMode({ request: ready.request, value: "impact" }); }}>What it affected</button>
      <button type="button" style={action} disabled={!ready || !selectedId} onClick={() => { if (ready) setFocusCommand(previous => ({ request: ready.request, phase, count: (previous?.count ?? 0) + 1 })); }}>Back to selected item</button>
    </div>
    {projected && <div role="status">
      <p>{phase === "cause" ? "Dependency arrows point from an item toward its recorded source. They do not show execution order or prove how a value was used." : "Arrows show returned recorded relationships to linked items, not proof of harm or delivery."}</p>
      {!projected.relationshipsAvailable && <p>{phase === "cause" ? "Backward connections were not provided. References can be shown, but missing links remain unknown." : "Impact connections were not provided. The full effect of these references remains unknown."}</p>}
      {projected.confidence === "incomplete" && <p>Some evidence is missing. The highlighted references do not establish the full dependency picture.</p>}
      {projected.unmapped > 0 && <p>{projected.unmapped} recorded {projected.unmapped === 1 ? "item is" : "items are"} not shown in this diagram. No substitute item has been selected.</p>}
    </div>}
    <InvestigationPanelView port={port} controller={controller} showAttention={false} focusExternalRequests={false} />
    {ready && <DependencyEvidence result={ready.result} direction={phase} labels={port.labels} />}
  </section>;
}
