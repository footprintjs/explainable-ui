import { componentStyles, FootprintBadge, FootprintCode, FootprintButton } from "../../theme";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dagre from "dagre";
import { useTraceMotion } from "../../_internal/useTraceMotion";
import { useIsomorphicLayoutEffect } from "../../_internal/useIsomorphicLayoutEffect";
import { traceNodeColors } from "../../trace/traceWorkflowOverlay";
import { theme } from "../../theme";
import type { BaseComponentProps, StageSnapshot } from "../../types";
import { buildTraceDependencyGraph, type TraceDependencyNode } from "../../trace/traceDependencyGraph";
import { recordedPathLabel, recordedValueAtPath, recordedValuePreview, type InspectedStageRead } from "../../trace/recordedValuePreview";
import { ownDataField } from "../../trace/safeRecordRead";
import { inputSentence } from "../../trace/tracePresentation";
import type { TraceIngredient, TraceWalk } from "../../trace/traceWalk";
import type { SubflowHandoffSource } from "../../trace/subflowHandoff";

interface TraceDependencyViewProps extends BaseComponentProps {
  walk: TraceWalk | null;
  cursorRuntimeStageId: string | null;
  snapshots: StageSnapshot[];
  onJumpToStop?: (runtimeStageId: string) => void;
  onFollowIngredient?: (ingredient: TraceIngredient) => void;
  onFollowHandoff?: (source: SubflowHandoffSource) => void;
  hasWorkflow?: boolean;
  questionTrail?: readonly { key: string; invocationPath: readonly string[]; stageReadCommitIdx?: number }[];
  inspectedStageRead?: InspectedStageRead;
  onReturnToQuestion?: (index: number) => void;
  /** Where an Activity-started investigation can return; no recorded values. */
  activityOrigin?: { stageLabel: string; key: string; kind: "read" | "write" };
  children: ReactNode;
}

const NODE_WIDTH = 218;
const NODE_HEIGHT = 104;

/** A variable/read view of one admitted scope; execution order stays a separate view. */
export function TraceDependencyView({
  walk, cursorRuntimeStageId, snapshots, onJumpToStop, onFollowIngredient,
  inspectedStageRead, onFollowHandoff, children, hasWorkflow = true, questionTrail, onReturnToQuestion, activityOrigin, size = "default", unstyled = false, className, style,
}: TraceDependencyViewProps) {
  const [view, setView] = useState<"variables" | "execution">("execution");
  const motion = useTraceMotion() && !unstyled;
  const canvasRef = useRef<HTMLDivElement>(null);
  const markerId = `trace-read-${useId().replace(/:/g, "")}`;
  const question = JSON.stringify([walk?.key, walk?.scope?.invocationPath]);
  useEffect(() => { if (!walk) setView("execution"); }, [walk]);
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;
  const ui = componentStyles(size);
  const graph = useMemo(() => walk ? buildTraceDependencyGraph(walk) : null, [walk]);
  const colors = useMemo(() => graph ? traceNodeColors(graph) : new Map<string, string>(), [graph]);
  const memories = useMemo(() => {
    const result = new Map<unknown, unknown>();
    for (const snapshot of snapshots) {
      const id = ownDataField(snapshot, "runtimeStageId");
      result.set(id, result.has(id) ? undefined : ownDataField(snapshot, "memory"));
    }
    const commits = new Map<string, number>();
    for (const node of graph?.nodes ?? []) {
      if (node.runtimeStageId === null || node.commitIdx === null) continue;
      const previous = commits.get(node.runtimeStageId);
      if (previous !== undefined && previous !== node.commitIdx) result.set(node.runtimeStageId, undefined);
      commits.set(node.runtimeStageId, node.commitIdx);
    }
    return result;
  }, [snapshots, graph]);
  const preview = (node: TraceDependencyNode) => node.isAnchor && inspectedStageRead?.key === node.key
    ? recordedValuePreview(inspectedStageRead.value) : node.runtimeStageId
    ? recordedValuePreview(recordedValueAtPath(memories.get(node.runtimeStageId), node.key)) : null;
  const layout = useMemo(() => {
    if (!graph) return null;
    const g = new dagre.graphlib.Graph().setGraph({ rankdir: "BT", ranksep: 44, nodesep: 24, marginx: 16, marginy: 16 });
    g.setDefaultEdgeLabel(() => ({}));
    graph.nodes.forEach(node => g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
    graph.edges.forEach(edge => g.setEdge(edge.source, edge.target));
    dagre.layout(g);
    return { g, width: Math.max(g.graph().width ?? 0, NODE_WIDTH + 56), height: Math.max(g.graph().height ?? 0, 260) };
  }, [graph]);

  const active = !!walk && !!graph && !walk.missing && !!layout;
  const investigating = active || !!(walk && (activityOrigin || inspectedStageRead));
  const showExecution = !active || (hasWorkflow && view === "execution");
  const showVariables = active && !showExecution;
  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!showVariables || !canvas || unstyled) return;
    const anchor = canvas.querySelector<HTMLElement>('[data-anchor="true"]');
    if (!anchor || !canvas.clientHeight) return;
    const top = anchor.offsetTop, bottom = top + anchor.offsetHeight;
    if (top < canvas.scrollTop || bottom > canvas.scrollTop + canvas.clientHeight) {
      const target = Math.max(0, top - 16);
      if (typeof canvas.scrollTo === "function") canvas.scrollTo({ top: target, behavior: motion ? "smooth" : "auto" });
      else canvas.scrollTop = target;
    }
  }, [question, showVariables, motion, unstyled]);
  const anchor = graph?.nodes.find(node => node.isAnchor);
  const anchorValue = anchor ? preview(anchor) : null;
  const follow = (node: TraceDependencyNode) => {
    if (!node.runtimeStageId || node.commitIdx === null) return;
    if (node.isAnchor) onJumpToStop?.(node.runtimeStageId);
    else onFollowIngredient?.({
      key: node.key, writerRuntimeStageId: node.runtimeStageId,
      writerStageName: node.stageName, writerCommitIdx: node.commitIdx,
    });
  };
  const note = (node: TraceDependencyNode) => node.kind === "unresolved"
    ? inputSentence(walk?.scope, node.key, node.unresolvedReason)
    : node.kind === "outside-view" ? "Earlier reads outside this view" : node.stageName ?? "Recorded write";

  const sources = walk?.stops.find(stop => stop.runtimeStageId === cursorRuntimeStageId)?.handoffSources ?? [];
  const previous = questionTrail && questionTrail.length > 1 ? questionTrail[questionTrail.length - 2] : undefined;
  const cursorIndex = snapshots.findIndex(snapshot => snapshot.runtimeStageId === cursorRuntimeStageId);

  return <section data-fp="trace-dependency-view" data-tracing={investigating || undefined} data-motion={motion ? "on" : "off"} aria-label={investigating ? "Variable investigation" : undefined} className={className}
    style={{ ...sx({ display: "flex", flexDirection: "column", minHeight: 0, height: "100%", overflow: "hidden", color: theme.textPrimary,
      background: active ? theme.bgPrimary : "transparent", fontFamily: theme.fontSans, fontSize: ui.body, lineHeight: ui.lineHeight, fontWeight: ui.weightNormal }), ...style }}>
    <div hidden={!investigating} style={sx({ flexShrink: 0, display: investigating ? "flex" : "none", gap: ui.spaceMd, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", padding: `${ui.padding} ${ui.spaceLg}`, borderBottom: `${ui.borderWidth} solid ${theme.border}` })}>
      <div style={sx({ minWidth: 0, flex: 1 })}>
        {questionTrail?.at(-1)?.stageReadCommitIdx !== undefined && <div>Inspecting stage read · commit {questionTrail.at(-1)?.stageReadCommitIdx}</div>}
        {activityOrigin && <div data-fp="trace-activity-origin" style={sx({ marginBottom: ui.spaceXs, fontSize: ui.body, color: theme.textSecondary, overflowWrap: "anywhere" })}>
          From <b style={sx({ fontWeight: ui.weightStrong })}>{activityOrigin.stageLabel}</b> · {activityOrigin.kind} <FootprintCode unstyled={unstyled} densitySize={size} part="trace-origin-variable" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{recordedPathLabel(activityOrigin.key)}</FootprintCode>
        </div>}
        <div aria-live="polite" style={sx({ fontWeight: ui.weightStrong, fontSize: ui.title })}>Why <FootprintCode unstyled={unstyled} densitySize={size} part="trace-question-variable" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{recordedPathLabel(walk?.key ?? "")}</FootprintCode>{anchorValue !== null ? ` = ${anchorValue}` : ""}?</div>
        {inspectedStageRead?.gap && <div>{inspectedStageRead.gap}</div>}
        {cursorIndex >= 0 && <div data-fp="trace-view-position" style={sx({ marginTop: ui.spaceXs, fontSize: ui.body, color: theme.textSecondary })}>
          Viewing recorded step {cursorIndex + 1} of {snapshots.length}
        </div>}
      {previous && <div data-fp="trace-context-bridge" style={sx({ display: "flex", alignItems: "center", gap: ui.controlGap, marginTop: ui.spaceXs, fontSize: ui.body, color: theme.textSecondary })}>
        <span>Following</span>
        <FootprintButton unstyled={unstyled} densitySize={size} part="trace-return-question" type="button" disabled={!onReturnToQuestion} onClick={() => onReturnToQuestion?.(questionTrail!.length - 2)}
          defaultStyle={sx({ border: "none", background: "transparent", color: theme.accent, padding: 0, cursor: "pointer", fontFamily: theme.fontMono })}>
          {recordedPathLabel(previous.key)}
        </FootprintButton><span aria-hidden="true">→</span><FootprintCode unstyled={unstyled} densitySize={size} part="trace-followed-variable" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{recordedPathLabel(walk?.key ?? "")}</FootprintCode>
      </div>}
      </div>
      <div hidden={!active} role="group" aria-label="Investigation view" style={sx({ display: active ? "flex" : "none", flexShrink: 0, gap: ui.spaceXs, border: `${ui.borderWidth} solid ${theme.border}`, borderRadius: ui.radiusPanel, padding: ui.spaceXs, background: theme.bgSecondary })}>
        {(["execution", "variables"] as const).map(mode => <FootprintButton unstyled={unstyled} densitySize={size} part={`trace-view-${mode}`} key={mode} type="button" aria-pressed={mode === "execution" ? showExecution : showVariables} disabled={mode === "execution" && !hasWorkflow}
          onClick={() => setView(mode)} defaultStyle={sx({ padding: ui.controlPadding, minHeight: ui.controlHeight, borderRadius: ui.radiusControl, border: "none", cursor: "pointer", fontSize: ui.body, lineHeight: ui.lineHeight, fontWeight: ui.weightMedium,
            color: (mode === "execution" ? showExecution : showVariables) ? theme.textPrimary : theme.textSecondary, background: (mode === "execution" ? showExecution : showVariables) ? theme.bgPrimary : "transparent" })}>
          {mode === "variables" ? "Variables" : "Execution"}
        </FootprintButton>)}
      </div>
    </div>
    {active && showExecution && <div data-fp="trace-execution-legend" style={sx({ flexShrink: 0, padding: `${ui.spaceSm} ${ui.spaceLg}`, borderBottom: `${ui.borderWidth} solid ${theme.border}`, fontSize: ui.label, lineHeight: ui.lineHeight, color: theme.textSecondary })}>
      Highlight: recorded sources · Dashed: recorded read · Other steps: context
    </div>}
    {!unstyled && <style>{`
      @keyframes fp-trace-source-enter { from { opacity: 0; transform: translateY(${ui.spaceSm}); } to { opacity: 1; transform: translateY(0); } }
      @media (prefers-reduced-motion: reduce) {
        [data-fp="trace-dependency-view"] *, [data-fp="trace-dependency-view"] *::before, [data-fp="trace-dependency-view"] *::after {
          animation: none !important; transition: none !important; scroll-behavior: auto !important;
        }
      }
    `}</style>}
    <div style={sx({ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" })}>
      <TraceViewLayer visible={showExecution} motion={motion} unstyled={unstyled} size={size} name="execution">{children}</TraceViewLayer>
      <TraceViewLayer visible={showVariables} motion={motion} unstyled={unstyled} size={size} name="variables">
      {active && walk && graph && layout && <>
      <div style={sx({ flexShrink: 0, padding: `${ui.spaceSm} ${ui.spaceLg}`, fontSize: ui.body, lineHeight: ui.lineHeight, color: theme.textSecondary, borderBottom: `${ui.borderWidth} solid ${theme.border}` })}>
        <details>
          <summary style={sx({ cursor: "pointer" })}>Recorded stage reads · writer snapshots</summary>
          <div style={sx({ marginTop: ui.spaceXs })}>Arrows show <b style={sx({ fontWeight: ui.weightStrong })}>recorded stage reads</b>, not execution order or proof of exact derivation. Values are snapshots after the named writer.</div>
        </details>
        {!walk.readsAvailable && <div role="status">Read evidence is unavailable; only recorded writes can be shown.</div>}
        {(graph.truncated || walk.truncated) && <div role="status">This view is limited. Earlier recorded reads may be missing.</div>}
      </div>
      <div ref={canvasRef} data-fp="trace-dependency-canvas" style={sx({ flex: 1, minHeight: 0, overflow: "auto", background: theme.bgSecondary })}>
        <div style={sx({ position: "relative", width: layout.width, minHeight: layout.height, margin: "0 auto" })}>
          {!unstyled && <svg width={layout.width} height={layout.height} aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <defs>{graph.nodes.map((node, index) => <marker key={node.id} id={`${markerId}-${index}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={colors.get(node.id) ?? theme.accent} /></marker>)}</defs>
            {graph.edges.map(edge => {
              const points = layout.g.edge(edge.source, edge.target)?.points ?? [];
              if (!points.length) return null;
              const middle = points[Math.floor(points.length / 2)];
              return <g key={edge.id} data-fp="trace-read-edge" data-source={edge.source} data-target={edge.target}>
                <path d={points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ")} fill="none" stroke={colors.get(edge.source) ?? theme.accent} style={{ strokeWidth: `calc(${ui.borderWidth} * 1.8)` }} markerEnd={`url(#${markerId}-${graph.nodes.findIndex(node => node.id === edge.source)})`} />
                <rect x={middle.x - 35} y={middle.y - 8} width="70" height="16" style={{ rx: ui.radiusControl }} fill={theme.bgSecondary} />
                <text x={middle.x} y={middle.y + 4} textAnchor="middle" fill={theme.textSecondary} style={{ fontSize: ui.small, fontFamily: theme.fontSans, fontWeight: ui.weightNormal }}>stage read</text>
              </g>;
            })}
          </svg>}
          {graph.nodes.map((node, nodeIndex) => {
            const position = layout.g.node(node.id);
            const selected = node.runtimeStageId === cursorRuntimeStageId;
            const nodeColor = colors.get(node.id) ?? theme.textMuted;
            const value = preview(node);
            const missing = (node.isAnchor && inspectedStageRead?.gap) || "Value not recorded";
            const enabled = node.runtimeStageId !== null && (node.isAnchor ? !!onJumpToStop : !!onFollowIngredient);
            const nodeText = <>
              <span style={sx({ display: "flex", justifyContent: "space-between", gap: ui.spaceSm, fontSize: ui.small, fontWeight: ui.weightStrong, letterSpacing: ".5px", textTransform: "uppercase", color: nodeColor })}>
                <FootprintBadge unstyled={unstyled} densitySize={size} part="trace-variable-kind" defaultStyle={undefined}>{node.isAnchor ? "Investigating" : node.kind === "unresolved" ? "Source unknown" : "Recorded value"}</FootprintBadge>
                {selected && <FootprintBadge unstyled={unstyled} densitySize={size} part="trace-variable-selected" defaultStyle={undefined}>Selected</FootprintBadge>}
              </span>
              <FootprintCode unstyled={unstyled} densitySize={size} part="trace-node-variable" defaultStyle={sx({ display: "block", marginTop: ui.spaceXs, fontFamily: theme.fontMono, fontSize: ui.title, fontWeight: ui.weightStrong, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{recordedPathLabel(node.key)}</FootprintCode>
              <span style={sx({ display: "block", marginTop: ui.spaceXs, fontFamily: theme.fontMono, fontSize: ui.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: theme.textPrimary })}>{value ?? missing}</span>
              <span style={sx({ display: "block", marginTop: ui.spaceXs, fontSize: ui.label, color: theme.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{note(node)}</span>
            </>;
            const geometry = sx({ position: "absolute", boxSizing: "border-box", left: position.x - NODE_WIDTH / 2, top: position.y - NODE_HEIGHT / 2,
              width: NODE_WIDTH, height: NODE_HEIGHT });
            const box = sx({ textAlign: "left", padding: `${ui.spaceSm} ${ui.spaceMd}`, borderRadius: ui.radiusPanel, lineHeight: ui.lineHeight, fontFamily: theme.fontSans,
              border: `${selected ? ui.focusWidth : ui.borderWidth} ${node.kind === "unresolved" ? "dashed" : "solid"} ${node.kind === "unresolved" ? theme.border : nodeColor}`,
              color: theme.textPrimary, background: theme.bgPrimary, boxShadow: selected ? ui.shadowFocus : ui.shadowPanel, cursor: enabled ? "pointer" : "default",
              transition: motion ? `left ${ui.duration} ${ui.easing}, top ${ui.duration} ${ui.easing}, border-color ${ui.duration} ${ui.easing}, box-shadow ${ui.duration} ${ui.easing}` : undefined,
              animation: motion ? `fp-trace-source-enter ${ui.duration} ${ui.easing} both` : undefined,
              animationDelay: motion ? `calc(${ui.fastDuration} * ${Math.min(nodeIndex, 4)} / 6)` : undefined,
            });
            return <FootprintButton unstyled={unstyled} densitySize={size} part="trace-variable-node" key={node.id} data-fp="trace-variable-node" data-variable={node.key} data-kind={node.kind} data-current={selected || undefined} data-anchor={node.isAnchor || undefined}
              type="button" disabled={!enabled} onClick={() => follow(node)} title={`${recordedPathLabel(node.key)}: ${value ?? missing}. ${note(node)}`}
              aria-label={enabled ? `${node.isAnchor ? "Show" : "Follow"} ${recordedPathLabel(node.key)} at ${node.stageName}` : `${recordedPathLabel(node.key)}: ${note(node)}`}
              aria-describedby={`${markerId}-node-${nodeIndex}`}
              style={geometry} defaultStyle={box}>{nodeText}</FootprintButton>;
          })}
        </div>
        <dl style={unstyled ? undefined : { position: "absolute", width: 1, height: 1, padding: 0, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>
          {graph.nodes.map((node, index) => <div key={node.id}>
            <dt>{recordedPathLabel(node.key)}</dt>
            <dd id={`${markerId}-node-${index}`}>
              {preview(node) ?? (node.isAnchor && inspectedStageRead?.gap || "Value not recorded")}. {note(node)}.
              {graph.edges.some(edge => edge.target === node.id) && <> Recorded stage reads: {graph.edges.filter(edge => edge.target === node.id).map(edge => edge.readKey).join(", ")}.</>}
            </dd>
          </div>)}
        </dl>
      </div>
      </>}
      </TraceViewLayer>
    </div>
    {active && sources.length > 0 && <div data-fp="trace-workflow-handoff" style={sx({ flexShrink: 0, padding: `${ui.spaceSm} ${ui.spaceLg}`, borderTop: `${ui.borderWidth} solid ${theme.border}`, fontSize: ui.body })}>
      <div style={sx({ color: theme.textSecondary, marginBottom: ui.controlGap })}>Reads observed by the mapper</div>
      {sources.map(source => <FootprintButton unstyled={unstyled} densitySize={size} part="trace-child-source" key={JSON.stringify([source.invocationPath, source.beforeCommitIdx, source.key])} type="button"
        disabled={!onFollowHandoff} onClick={() => onFollowHandoff?.(source)} defaultStyle={sx({ border: `${ui.borderWidth} solid ${theme.border}`, borderRadius: ui.radiusControl, background: theme.bgPrimary, color: theme.textPrimary, padding: ui.controlPadding, minHeight: ui.controlHeight, marginRight: ui.controlGap, cursor: "pointer", fontSize: ui.body, lineHeight: ui.lineHeight })}>
        Open {source.direction ?? "child"} source <FootprintCode unstyled={unstyled} densitySize={size} part="trace-child-variable" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{recordedPathLabel(source.key)}</FootprintCode>
      </FootprintButton>)}
    </div>}

  </section>;
}

/** Keep both renderer instances alive; hidden content cannot receive keyboard focus. */
function TraceViewLayer({ visible, motion, unstyled, size, name, children }: {
  visible: boolean; motion: boolean; unstyled: boolean; size: NonNullable<BaseComponentProps["size"]>; name: string; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ui = componentStyles(size);
  useIsomorphicLayoutEffect(() => { if (ref.current) ref.current.inert = !visible; }, [visible]);
  return <div ref={ref} data-fp={`trace-${name}-layer`} aria-hidden={visible ? undefined : true}
    hidden={unstyled ? !visible : undefined}
    style={unstyled ? undefined : {
      position: "absolute", inset: 0, display: "flex", flexDirection: "column", minHeight: 0,
      opacity: visible ? 1 : 0, visibility: visible ? "visible" : "hidden", pointerEvents: visible ? "auto" : "none",
      transition: motion ? `opacity ${ui.duration} ${ui.easing}, visibility 0s linear ${visible ? "0ms" : ui.duration}` : undefined,
    }}>
    {children}
  </div>;
}
