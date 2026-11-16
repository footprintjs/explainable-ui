import type { CSSProperties, ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FootprintIcon, useFootprintTheme, theme, v } from "../../theme";
import type { StageNodeData } from "../StageNode";
import { isoStyles, isoPaint } from "./styles";
import { recordedPathLabel } from "../../trace/recordedValuePreview";

// Drawing changes geometry only; recording and replay state stay with the chart. These
// points are also the layout's connection contract; no CSS perspective moves
// the visual ports away from xyflow's measured coordinates.
const TOP = "M26 50 82 22Q88 19 94 22L150 50Q156 53 150 56L94 84Q88 87 82 84L26 56Q20 53 26 50Z";
const LEFT_SIDE = "M20 53 88 87V95L24 63Q20 61 20 57Z";
const RIGHT_SIDE = "M88 87 156 53V57Q156 61 152 63L88 95Z";

function FallbackIcon({ name, data }: { name: string; data: StageNodeData }) {
  let drawing: ReactNode;
  if (data.isDecider || name === "decision") {
    drawing = <><path d="m12 3 9 9-9 9-9-9 9-9Z" /><path d="M12 8v5m0 3h.01" /></>;
  } else if (data.isFork || name === "parallel") {
    drawing = <><path d="M12 3v5M5 13V8h14v5M5 17v4m14-4v4" /><rect x="2" y="13" width="6" height="4" rx="1" /><rect x="16" y="13" width="6" height="4" rx="1" /></>;
  } else if (data.isSubflow || name === "agent") {
    drawing = <><rect x="3" y="3" width="18" height="18" rx="3" /><rect x="6" y="6" width="5" height="5" rx="1" /><rect x="13" y="13" width="5" height="5" rx="1" /><path d="M8.5 11v4.5H13" /></>;
  } else if (name === "rag" || name === "search") {
    drawing = <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6M7 8h6m-6 4h4" /></>;
  } else if (name === "loop") {
    drawing = <><path d="M19 7a8 8 0 1 0 1 8M19 3v5h-5" /><path d="m10 8 5 4-5 4V8Z" /></>;
  } else if (name === "start") {
    drawing = <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" /></>;
  } else if (name === "end") {
    drawing = <><path d="M13 3H5v18h14V9l-6-6Zm0 0v6h6" /><path d="m8 15 3 3 5-6" /></>;
  } else if (name === "guard") {
    drawing = <><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>;
  } else if (name === "parse") {
    drawing = <><path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" /></>;
  } else if (name === "memory") {
    drawing = <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M8 7h8M8 11h8M8 15h5" /></>;
  } else {
    // Neutral stage glyph: unknown recorded icon names do not become an
    // invented database, cloud service or other infrastructure resource.
    drawing = <><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 9h8M8 13h5" /></>;
  }
  return <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{drawing}</svg>;
}

export function IsometricStageNode({ data: input }: NodeProps) {
  const data = input as unknown as StageNodeData;
  const tokens = useFootprintTheme();
  const { active, done, error, isSubflow, isDecider, isFork, traceWorkflow, traceContext, unstyled = false } = data;
  const label = typeof data.label === "string" ? data.label : "Recorded step";
  const description = typeof data.description === "string" ? data.description : "";
  const hero = data.emphasis === "hero";
  const fill = active ? theme.nodeCursor : done ? hero ? theme.nodeMain : theme.nodeVisited
    : error ? theme.error : hero ? `color-mix(in srgb, ${theme.nodeMain} 12%, ${theme.bgSecondary})` : theme.bgSecondary;
  const foreground = active ? theme.onNodeCursor : done ? hero ? theme.onNodeMain : theme.onNodeVisited
    : error ? theme.onNodeError : theme.textPrimary;
  const outline = v("--fp-node-border-color", theme.border);
  const outlineWidth = v("--fp-node-border-width", "1.25px");
  const declaredStyle = tokens.nodes?.borderStyle;
  const dash = data.isLazy && !active && !done || declaredStyle === "dashed" ? "4 3"
    : declaredStyle === "dotted" ? "1 3" : undefined;
  const status = active ? traceWorkflow || traceContext ? "VIEWING" : "NOW" : done ? "VISITED" : error ? "FAILED" : undefined;
  const retries = typeof data.retryAttempts === "number" && data.retryAttempts > 1 ? data.retryAttempts : undefined;
  const retryLabel = retries ? `retried, attempt ${retries} of ${retries} ${error ? "failed" : "succeeded"}` : undefined;
  const steps = data.stepNumbers?.filter(Number.isFinite) ?? [];
  const icon = typeof data.icon === "string" ? data.icon : isSubflow ? "agent" : isDecider ? "decision" : isFork ? "parallel" : "stage";
  const role = traceWorkflow?.role === "question" ? "Question" : traceWorkflow?.role === "input" ? "Recorded input" : "Upstream read";
  const traceValues = traceWorkflow?.values.map(value => `${recordedPathLabel(value.key)}${value.preview === null ? " · preview unavailable" : ` = ${value.preview}`}`).join("; ");
  const facts = [label, description, isSubflow && "Subflow", isDecider && "Decision step", isFork && "Parallel branch point",
    active && "Selected step", done && "Recorded executed step", error && "Recorded failure", retryLabel,
    steps.length > 0 && `Execution steps ${steps.join(", ")}`,
    traceWorkflow && `${role}${traceValues ? `: ${traceValues}` : ""}`,
    traceContext === "outside" && "Outside displayed trace. Recorded execution status is shown independently."].filter(Boolean).join(". ");
  const rootPaint: CSSProperties = unstyled ? {} : { color: foreground, fontFamily: theme.fontSans };
  const badgePaint: CSSProperties = unstyled ? {} : { color: foreground, background: fill, border: `1px solid ${outline}`,
    boxShadow: v("--fp-node-badge-shadow", "none"), fontFamily: theme.fontMono };

  return <div className="fp-isometric-stage iso-stage" data-fp="isometric-stage-node" data-active={active || undefined}
    data-done={done || undefined} data-error={error || undefined} data-dimmed={data.dimmed || undefined}
    data-unstyled={unstyled || undefined} data-trace-role={traceWorkflow?.role} data-trace-context={traceContext}
    style={{ ...isoStyles.root, ...rootPaint }} role="group" aria-label={facts} title={facts}>
    <Handle type="target" position={Position.Left} className="iso-stage__handle"
      style={{ left: 46, top: 40, width: 0, height: 0, minWidth: 0, minHeight: 0, border: 0, transform: "none", opacity: 0 }} />
    <Handle type="source" position={Position.Right} className="iso-stage__handle"
      style={{ left: 122, right: "auto", top: 78, width: 0, height: 0, minWidth: 0, minHeight: 0, border: 0, transform: "none", opacity: 0 }} />
    <svg className="iso-stage__slab" viewBox="0 0 168 100" aria-hidden="true" focusable="false"
      style={{ ...isoStyles.slab, ...(!unstyled && { filter: v("--fp-node-shape-shadow", `drop-shadow(1px 3px 1px color-mix(in srgb, ${theme.border} 20%, transparent))`) }) }}>
      <g stroke={unstyled ? "currentColor" : outline} strokeWidth={unstyled ? undefined : outlineWidth}
        strokeLinejoin="round" strokeDasharray={unstyled ? undefined : dash}>
        <path d={LEFT_SIDE} fill={unstyled ? "none" : `color-mix(in srgb, ${fill} 88%, ${outline})`} />
        <path d={RIGHT_SIDE} fill={unstyled ? "none" : `color-mix(in srgb, ${fill} 76%, ${outline})`} />
        <path d={TOP} fill={unstyled ? "none" : fill} />
      </g>
      {traceWorkflow && <path d={TOP} fill="none" stroke={unstyled ? "currentColor" : traceWorkflow.color}
        strokeWidth="3" strokeLinejoin="round" transform="translate(-5 -3) scale(1.06)" />}
      <circle cx="46" cy="40" r="2.2" fill={unstyled ? "currentColor" : outline} />
      <circle cx="122" cy="78" r="2.2" fill={unstyled ? "currentColor" : outline} />
    </svg>
    <div className="iso-stage__icon" aria-hidden="true" style={isoStyles.icon}>
      <FootprintIcon part="stage-icon" name={icon} unstyled={unstyled} defaultStyle={undefined}
        style={{ display: "inline-flex", width: 22, height: 22 }}><FallbackIcon name={icon} data={data} /></FootprintIcon>
    </div>
    {steps.length > 0 && (active || done) && <div className="iso-stage__steps" aria-hidden="true" style={isoStyles.steps}>
      {steps.map((step, index) => <span key={`${index}:${step}`} className="iso-stage__step" style={{ ...isoStyles.step, ...badgePaint, ...(!unstyled && isoPaint.step) }}>{step}</span>)}
    </div>}
    {status && <span className="iso-stage__status" style={{ ...isoStyles.status, ...badgePaint, ...(!unstyled && isoPaint.status) }} aria-hidden="true">{status}</span>}
    {retries && <span className="iso-stage__retry" style={{ ...isoStyles.retry, ...(!unstyled && { ...isoPaint.step, color: theme.warning, background: theme.bgSecondary,
      border: `1px solid ${theme.warning}`, boxShadow: v("--fp-node-badge-shadow", "none") }) }}
      role="img" aria-label={retryLabel} title={retryLabel}>↻ ×{retries}</span>}
    <span className="iso-stage__label" style={{ ...isoStyles.label, ...(!unstyled && { ...isoPaint.label, color: theme.textPrimary }) }} aria-hidden="true">{label}</span>
    {traceWorkflow && <span className="iso-stage__trace" data-fp="trace-workflow-caption" title={`${role}${traceValues ? `: ${traceValues}` : ""}`}
      style={{ ...isoStyles.trace, ...(!unstyled && { ...isoPaint.trace, color: traceWorkflow.color, background: theme.bgSecondary, border: `1px solid ${traceWorkflow.color}`, fontFamily: theme.fontMono }) }}>
      <strong>{role}</strong>{traceValues && ` · ${traceValues}`}
    </span>}
    {traceContext === "outside" && <span className="iso-stage__trace" data-fp="trace-context-caption"
      style={{ ...isoStyles.trace, ...(!unstyled && { ...isoPaint.trace, color: theme.textSecondary, background: theme.bgSecondary, border: `1px solid ${theme.border}`, fontFamily: theme.fontMono }) }}>
      Outside displayed trace
    </span>}
  </div>;
}
