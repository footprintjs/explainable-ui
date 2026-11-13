import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dagre from "dagre";
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
  children: ReactNode;
}

const NODE_WIDTH = 218;
const NODE_HEIGHT = 104;

/** A variable/read view of one admitted scope; execution order stays a separate view. */
export function TraceDependencyView({
  walk, cursorRuntimeStageId, snapshots, onJumpToStop, onFollowIngredient,
  onFollowHandoff, children, unstyled = false, className, style,
}: TraceDependencyViewProps) {
  const [view, setView] = useState<"variables" | "execution">("variables");
  const canvasRef = useRef<HTMLDivElement>(null);
  const markerId = `trace-read-${useId().replace(/:/g, "")}`;
  const question = JSON.stringify([walk?.key, walk?.scope?.invocationPath]);
  useEffect(() => {
    setView("variables");
    if (canvasRef.current) { canvasRef.current.scrollTop = 0; canvasRef.current.scrollLeft = 0; }
  }, [question]);
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;
  const graph = useMemo(() => walk ? buildTraceDependencyGraph(walk) : null, [walk]);
  const memories = useMemo(() => new Map(snapshots.map(snapshot => [
    ownDataField(snapshot, "runtimeStageId"), ownDataField(snapshot, "memory"),
  ])), [snapshots]);
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

  if (!walk || !graph || walk.missing || !layout) return <>{children}</>;
  const anchor = graph.nodes.find(node => node.isAnchor);
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
    ? inputSentence(walk.scope, node.key)
    : node.kind === "outside-view" ? "Earlier reads outside this view" : node.stageName ?? "Recorded write";

  return <section data-fp="trace-dependency-view" aria-label="Variable investigation" className={className}
    style={{ ...sx({ display: "flex", flexDirection: "column", minHeight: 0, height: "100%", overflow: "hidden", color: theme.textPrimary, background: theme.bgPrimary }), ...style }}>
    <div style={sx({ flexShrink: 0, display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", padding: "12px 16px", borderBottom: `1px solid ${theme.border}` })}>
      <div>
        <div aria-live="polite" style={sx({ fontWeight: 700, fontSize: 16 })}>Why <code>{recordedPathLabel(walk.key)}</code>{anchorValue !== null ? ` = ${anchorValue}` : ""}?</div>
      </div>
      <div role="group" aria-label="Investigation view" style={sx({ display: "flex", gap: 3, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 3, background: theme.bgSecondary })}>
        {(["variables", "execution"] as const).map(mode => <button key={mode} type="button" aria-pressed={view === mode}
          onClick={() => setView(mode)} style={sx({ padding: "6px 10px", borderRadius: 5, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
            color: view === mode ? theme.textPrimary : theme.textSecondary, background: view === mode ? theme.bgPrimary : "transparent" })}>
          {mode === "variables" ? "Variables" : "Execution"}
        </button>)}
      </div>
    </div>
    {view === "execution" ? <div style={sx({ flex: 1, minHeight: 0, position: "relative" })}>{children}</div> : <>
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
            <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--fp-accent, #6366f1)" /></marker></defs>
            {graph.edges.map(edge => {
              const points = layout.g.edge(edge.source, edge.target)?.points ?? [];
              if (!points.length) return null;
              const middle = points[Math.floor(points.length / 2)];
              return <g key={edge.id} data-fp="trace-read-edge" data-source={edge.source} data-target={edge.target}>
                <path d={points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ")} fill="none" stroke="var(--fp-accent, #6366f1)" strokeWidth="1.8" markerEnd={`url(#${markerId})`} />
                <rect x={middle.x - 35} y={middle.y - 8} width="70" height="16" rx="4" fill={theme.bgSecondary} />
                <text x={middle.x} y={middle.y + 4} textAnchor="middle" fill={theme.textSecondary} fontSize="10">stage read</text>
              </g>;
            })}
          </svg>}
          {graph.nodes.map((node, nodeIndex) => {
            const position = layout.g.node(node.id);
            const selected = node.runtimeStageId === cursorRuntimeStageId;
            const value = preview(node);
            const enabled = node.runtimeStageId !== null && (node.isAnchor ? !!onJumpToStop : !!onFollowIngredient);
            const nodeText = <>
              <span style={sx({ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: selected ? "var(--fp-accent, #6366f1)" : theme.textSecondary })}>
                <span>{node.isAnchor ? "Investigating" : node.kind === "unresolved" ? "Source unknown" : "Recorded value"}</span>
                {selected && <span>Selected</span>}
              </span>
              <code style={sx({ display: "block", marginTop: 6, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{recordedPathLabel(node.key)}</code>
              <span style={sx({ display: "block", marginTop: 3, fontFamily: theme.fontMono, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: theme.textPrimary })}>{value ?? "Value not recorded"}</span>
              <span style={sx({ display: "block", marginTop: 6, fontSize: 11, color: theme.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{note(node)}</span>
            </>;
            const box = sx({ position: "absolute", boxSizing: "border-box", left: position.x - NODE_WIDTH / 2, top: position.y - NODE_HEIGHT / 2,
              width: NODE_WIDTH, height: NODE_HEIGHT, textAlign: "left", padding: "10px 12px", borderRadius: 10, lineHeight: 1.3,
              border: `${selected ? 2 : 1}px ${node.kind === "unresolved" ? "dashed" : "solid"} ${selected || node.isAnchor ? "var(--fp-accent, #6366f1)" : theme.border}`,
              color: theme.textPrimary, background: theme.bgPrimary, boxShadow: selected ? `0 2px 12px color-mix(in srgb, ${theme.accent} 12%, transparent)` : "0 1px 3px rgba(0,0,0,.04)", cursor: enabled ? "pointer" : "default" });
            return <button key={node.id} data-fp="trace-variable-node" data-variable={node.key} data-kind={node.kind} data-current={selected || undefined}
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
      {!!walk.stops.find(stop => stop.runtimeStageId === cursorRuntimeStageId)?.handoffSources?.length && <div style={sx({ flexShrink: 0, padding: "10px 16px", borderTop: `1px solid ${theme.border}`, fontSize: 12 })}>
        <div style={sx({ color: theme.textSecondary, marginBottom: 6 })}>This subflow recorded child output reads:</div>
        {walk.stops.find(stop => stop.runtimeStageId === cursorRuntimeStageId)!.handoffSources!.map(source => <button key={`${source.mountRuntimeStageId}:${source.key}`} type="button"
          disabled={!onFollowHandoff} onClick={() => onFollowHandoff?.(source)} style={sx({ border: `1px solid ${theme.border}`, borderRadius: 6, background: theme.bgPrimary, color: theme.textPrimary, padding: "6px 10px", marginRight: 6, cursor: "pointer" })}>
          Open child source <code>{source.key}</code>
        </button>)}
      </div>}
    </>}
  </section>;
}
