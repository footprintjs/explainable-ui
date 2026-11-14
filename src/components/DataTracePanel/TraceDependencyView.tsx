import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dagre from "dagre";
import { useTraceMotion, TRACE_MOTION_MS } from "../../_internal/useTraceMotion";
import { useIsomorphicLayoutEffect } from "../../_internal/useIsomorphicLayoutEffect";
import { traceNodeColors } from "../../trace/traceWorkflowOverlay";
import { theme } from "../../theme";
import type { BaseComponentProps, StageSnapshot } from "../../types";
import { buildTraceDependencyGraph, type TraceDependencyNode } from "../../trace/traceDependencyGraph";
import { recordedPathLabel, recordedValueAtPath, recordedValuePreview } from "../../trace/recordedValuePreview";
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
  questionTrail?: readonly { key: string; invocationPath: readonly string[] }[];
  onReturnToQuestion?: (index: number) => void;
  children: ReactNode;
}

const NODE_WIDTH = 218;
const NODE_HEIGHT = 104;

/** A variable/read view of one admitted scope; execution order stays a separate view. */
export function TraceDependencyView({
  walk, cursorRuntimeStageId, snapshots, onJumpToStop, onFollowIngredient,
  onFollowHandoff, children, hasWorkflow = true, questionTrail, onReturnToQuestion, unstyled = false, className, style,
}: TraceDependencyViewProps) {
  const [view, setView] = useState<"variables" | "execution">("execution");
  const motion = useTraceMotion() && !unstyled;
  const canvasRef = useRef<HTMLDivElement>(null);
  const markerId = `trace-read-${useId().replace(/:/g, "")}`;
  const question = JSON.stringify([walk?.key, walk?.scope?.invocationPath]);
  useEffect(() => { if (!walk) setView("execution"); }, [walk]);
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;
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
  const preview = (node: TraceDependencyNode) => node.runtimeStageId
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
    ? inputSentence(walk?.scope, node.key)
    : node.kind === "outside-view" ? "Earlier reads outside this view" : node.stageName ?? "Recorded write";

  const sources = walk?.stops.find(stop => stop.runtimeStageId === cursorRuntimeStageId)?.handoffSources ?? [];
  const previous = questionTrail && questionTrail.length > 1 ? questionTrail[questionTrail.length - 2] : undefined;

  return <section data-fp="trace-dependency-view" data-tracing={active || undefined} data-motion={motion ? "on" : "off"} aria-label={active ? "Variable investigation" : undefined} className={className}
    style={{ ...sx({ display: "flex", flexDirection: "column", minHeight: 0, height: "100%", overflow: "hidden", color: theme.textPrimary, background: active ? theme.bgPrimary : "transparent" }), ...style }}>
    <div hidden={!active} style={sx({ flexShrink: 0, display: active ? "flex" : "none", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", padding: "12px 16px", borderBottom: `1px solid ${theme.border}` })}>
      <div style={sx({ minWidth: 0, flex: 1 })}>
        <div aria-live="polite" style={sx({ fontWeight: 700, fontSize: 16 })}>Why <code>{recordedPathLabel(walk?.key ?? "")}</code>{anchorValue !== null ? ` = ${anchorValue}` : ""}?</div>
      {previous && <div data-fp="trace-context-bridge" style={sx({ display: "flex", alignItems: "center", gap: 6, marginTop: 5, fontSize: 12, color: theme.textSecondary })}>
        <span>Following</span>
        <button type="button" disabled={!onReturnToQuestion} onClick={() => onReturnToQuestion?.(questionTrail!.length - 2)}
          style={sx({ border: "none", background: "transparent", color: theme.accent, padding: 0, cursor: "pointer", fontFamily: theme.fontMono })}>
          {recordedPathLabel(previous.key)}
        </button><span aria-hidden="true">→</span><code>{recordedPathLabel(walk?.key ?? "")}</code>
      </div>}
      </div>
      <div role="group" aria-label="Investigation view" style={sx({ display: "flex", flexShrink: 0, gap: 3, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 3, background: theme.bgSecondary })}>
        {(["execution", "variables"] as const).map(mode => <button key={mode} type="button" aria-pressed={mode === "execution" ? showExecution : showVariables} disabled={mode === "execution" && !hasWorkflow}
          onClick={() => setView(mode)} style={sx({ padding: "6px 10px", borderRadius: 5, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
            color: (mode === "execution" ? showExecution : showVariables) ? theme.textPrimary : theme.textSecondary, background: (mode === "execution" ? showExecution : showVariables) ? theme.bgPrimary : "transparent" })}>
          {mode === "variables" ? "Variables" : "Execution"}
        </button>)}
      </div>
    </div>
    {!unstyled && <style>{`
      @keyframes fp-trace-source-enter { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
      @media (prefers-reduced-motion: reduce) {
        [data-fp="trace-dependency-view"] *, [data-fp="trace-dependency-view"] *::before, [data-fp="trace-dependency-view"] *::after {
          animation: none !important; transition: none !important; scroll-behavior: auto !important;
        }
      }
    `}</style>}
    <div style={sx({ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" })}>
      <TraceViewLayer visible={showExecution} motion={motion} unstyled={unstyled} name="execution">{children}</TraceViewLayer>
      <TraceViewLayer visible={showVariables} motion={motion} unstyled={unstyled} name="variables">
      {active && walk && graph && layout && <>
      <div style={sx({ flexShrink: 0, padding: "9px 16px", fontSize: 12, lineHeight: 1.5, color: theme.textSecondary, borderBottom: `1px solid ${theme.border}` })}>
        <details>
          <summary style={sx({ cursor: "pointer" })}>Recorded stage reads · writer snapshots</summary>
          <div style={sx({ marginTop: 5 })}>Arrows show <b>recorded stage reads</b>, not execution order or proof of exact derivation. Values are snapshots after the named writer.</div>
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
                <path d={points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ")} fill="none" stroke={colors.get(edge.source) ?? theme.accent} strokeWidth="1.8" markerEnd={`url(#${markerId}-${graph.nodes.findIndex(node => node.id === edge.source)})`} />
                <rect x={middle.x - 35} y={middle.y - 8} width="70" height="16" rx="4" fill={theme.bgSecondary} />
                <text x={middle.x} y={middle.y + 4} textAnchor="middle" fill={theme.textSecondary} fontSize="10">stage read</text>
              </g>;
            })}
          </svg>}
          {graph.nodes.map((node, nodeIndex) => {
            const position = layout.g.node(node.id);
            const selected = node.runtimeStageId === cursorRuntimeStageId;
            const nodeColor = colors.get(node.id) ?? theme.textMuted;
            const value = preview(node);
            const enabled = node.runtimeStageId !== null && (node.isAnchor ? !!onJumpToStop : !!onFollowIngredient);
            const nodeText = <>
              <span style={sx({ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: nodeColor })}>
                <span>{node.isAnchor ? "Investigating" : node.kind === "unresolved" ? "Source unknown" : "Recorded value"}</span>
                {selected && <span>Selected</span>}
              </span>
              <code style={sx({ display: "block", marginTop: 6, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{recordedPathLabel(node.key)}</code>
              <span style={sx({ display: "block", marginTop: 3, fontFamily: theme.fontMono, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: theme.textPrimary })}>{value ?? "Value not recorded"}</span>
              <span style={sx({ display: "block", marginTop: 6, fontSize: 11, color: theme.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{note(node)}</span>
            </>;
            const box = sx({ position: "absolute", boxSizing: "border-box", left: position.x - NODE_WIDTH / 2, top: position.y - NODE_HEIGHT / 2,
              width: NODE_WIDTH, height: NODE_HEIGHT, textAlign: "left", padding: "10px 12px", borderRadius: 10, lineHeight: 1.3,
              border: `${selected ? 2 : 1}px ${node.kind === "unresolved" ? "dashed" : "solid"} ${node.kind === "unresolved" ? theme.border : nodeColor}`,
              color: theme.textPrimary, background: theme.bgPrimary, boxShadow: selected ? `0 2px 12px color-mix(in srgb, ${theme.accent} 12%, transparent)` : "0 1px 3px rgba(0,0,0,.04)", cursor: enabled ? "pointer" : "default",
              transition: motion ? `left ${TRACE_MOTION_MS}ms ease, top ${TRACE_MOTION_MS}ms ease, border-color ${TRACE_MOTION_MS}ms ease, box-shadow ${TRACE_MOTION_MS}ms ease` : undefined,
              animation: motion ? `fp-trace-source-enter ${TRACE_MOTION_MS}ms ease both` : undefined,
              animationDelay: motion ? `${Math.min(nodeIndex * 20, 80)}ms` : undefined,
            });
            return <button key={node.id} data-fp="trace-variable-node" data-variable={node.key} data-kind={node.kind} data-current={selected || undefined} data-anchor={node.isAnchor || undefined}
              type="button" disabled={!enabled} onClick={() => follow(node)} title={`${node.key}: ${value ?? "value not recorded"}. ${note(node)}`}
              aria-label={enabled ? `${node.isAnchor ? "Show" : "Follow"} ${recordedPathLabel(node.key)} at ${node.stageName}` : `${recordedPathLabel(node.key)}: ${note(node)}`}
              aria-describedby={`${markerId}-node-${nodeIndex}`}
              style={box}>{nodeText}</button>;
          })}
        </div>
        <dl style={unstyled ? undefined : { position: "absolute", width: 1, height: 1, padding: 0, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>
          {graph.nodes.map((node, index) => <div key={node.id}>
            <dt>{recordedPathLabel(node.key)}</dt>
            <dd id={`${markerId}-node-${index}`}>
              {preview(node) ?? "Value not recorded"}. {note(node)}.
              {graph.edges.some(edge => edge.target === node.id) && <> Recorded stage reads: {graph.edges.filter(edge => edge.target === node.id).map(edge => edge.readKey).join(", ")}.</>}
            </dd>
          </div>)}
        </dl>
      </div>
      </>}
      </TraceViewLayer>
    </div>
    {active && sources.length > 0 && <div data-fp="trace-workflow-handoff" style={sx({ flexShrink: 0, padding: "10px 16px", borderTop: `1px solid ${theme.border}`, fontSize: 12 })}>
      <div style={sx({ color: theme.textSecondary, marginBottom: 6 })}>Recorded child sources for this output:</div>
      {sources.map(source => <button key={`${source.mountRuntimeStageId}:${source.key}`} type="button"
        disabled={!onFollowHandoff} onClick={() => onFollowHandoff?.(source)} style={sx({ border: `1px solid ${theme.border}`, borderRadius: 6, background: theme.bgPrimary, color: theme.textPrimary, padding: "6px 10px", marginRight: 6, cursor: "pointer" })}>
        Open child source <code>{recordedPathLabel(source.key)}</code>
      </button>)}
    </div>}

  </section>;
}

/** Keep both renderer instances alive; hidden content cannot receive keyboard focus. */
function TraceViewLayer({ visible, motion, unstyled, name, children }: {
  visible: boolean; motion: boolean; unstyled: boolean; name: string; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useIsomorphicLayoutEffect(() => { if (ref.current) ref.current.inert = !visible; }, [visible]);
  return <div ref={ref} data-fp={`trace-${name}-layer`} aria-hidden={visible ? undefined : true}
    hidden={unstyled ? !visible : undefined}
    style={unstyled ? undefined : {
      position: "absolute", inset: 0, display: "flex", flexDirection: "column", minHeight: 0,
      opacity: visible ? 1 : 0, visibility: visible ? "visible" : "hidden", pointerEvents: visible ? "auto" : "none",
      transition: motion ? `opacity ${TRACE_MOTION_MS}ms ease, visibility 0s linear ${visible ? 0 : TRACE_MOTION_MS}ms` : undefined,
    }}>
    {children}
  </div>;
}
