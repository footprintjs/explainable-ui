import { FootprintBadge, FootprintButton, FootprintCode } from "../../theme";
import { useRef, useState, type CSSProperties } from "react";
import type { BaseComponentProps } from "../../types";
import { componentStyles, theme } from "../../theme";
import { useIsomorphicLayoutEffect } from "../../_internal/useIsomorphicLayoutEffect";
import type {
  StageActivityEvent,
  StageActivityTraceTarget,
  StageActivityValue,
  StageActivityVariable,
  StageActivityView,
} from "../../trace/stageActivity";

export interface StageActivityPanelProps extends BaseComponentProps {
  /** A projection of one exact recorded visit, not an aggregate stage name. */
  activity: StageActivityView;
  /** The host validates this recorded target before entering the existing walk. */
  onTraceVariable?: (target: StageActivityTraceTarget) => void;
  /** Explicitly inspect the recorded writer without changing the read's identity. */
  onNavigateToStage?: (runtimeStageId: string) => void;
  /** A variable id from this exact visit. Omit to keep selection local. */
  selectedVariableId?: string;
  /** Fires for an explicit variable selection, including controlled instances. */
  onVariableSelect?: (id: string) => void;
}

/** A stage remains the context while its recorded reads and changes are inspected. */
export function StageActivityPanel({
  activity, onTraceVariable, onNavigateToStage, selectedVariableId, onVariableSelect,
  size = "default", unstyled = false, className, style,
}: StageActivityPanelProps) {
  const ui = componentStyles(size);
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;
  const identity = JSON.stringify([activity.identity.invocationPath, activity.identity.runtimeStageId, activity.identity.commitIdx]);
  const [selection, setSelection] = useState<{ identity: string; variableId: string } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const variables = [...activity.reads, ...activity.writes];
  const selectedId = selectedVariableId ?? (selection?.identity === identity ? selection.variableId : undefined);
  const selected = variables.find(variable => variable.id === selectedId)
    || activity.writes[0] || activity.reads[0] || null;
  const variableById = new Map(variables.map(variable => [variable.id, variable]));
  const select = (variable: StageActivityVariable) => {
    setSelection({ identity, variableId: variable.id });
    onVariableSelect?.(variable.id);
  };
  useIsomorphicLayoutEffect(() => {
    if (!selection || selection.identity !== identity || unstyled) return;
    const content = contentRef.current?.getBoundingClientRect();
    const inspector = inspectorRef.current;
    if (!content || !inspector) return;
    const bounds = inspector.getBoundingClientRect();
    // A narrow details surface stacks the inspector beneath the activity.
    // Reveal an explicit selection there without scrolling on initial load.
    if (Math.abs(bounds.left - content.left) < 1 && bounds.top > content.top) inspector.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [selection, identity, unstyled]);
  const scope = activity.identity.invocationPath.length ? activity.identity.invocationPath.join(" / ") : "Root";
  const heading = (text: string) => <h4 style={sx({ margin: `0 0 ${ui.spaceSm}`, fontSize: ui.small, fontWeight: ui.weightStrong, color: theme.textSecondary })}>{text}</h4>;
  const keyButton = (variable: StageActivityVariable, context: "list" | "sequence") => <FootprintButton unstyled={unstyled} densitySize={size} part="activity-variable"
    type="button" data-fp="stage-activity-variable" data-variable-kind={variable.kind} data-variable-key={variable.key}
    aria-label={`Inspect ${variable.kind} ${variable.label}${context === "sequence" ? " from recorded activity" : ""}`}
    aria-pressed={selected?.id === variable.id} onClick={() => select(variable)}
    defaultStyle={sx({ border: `${ui.borderWidth} solid ${selected?.id === variable.id ? theme.accent : theme.border}`, borderRadius: ui.radiusControl,
      color: theme.textPrimary, background: selected?.id === variable.id ? theme.accentBg : theme.bgPrimary,
      padding: ui.controlPadding, minHeight: ui.controlHeight, fontFamily: theme.fontMono, fontSize: ui.body, textAlign: "left", overflowWrap: "anywhere", cursor: "pointer" })}>
    {variable.label}
  </FootprintButton>;
  const eventLabel = (event: StageActivityEvent) => event.reportedOperation
    ? `${event.reportedOperation.toUpperCase()} · narrative`
    : event.kind === "decision" ? "RECORDED DECISION"
      : event.kind === "error" ? "ERROR" : event.kind === "log" ? "STAGE LOG" : event.kind === "event" ? "RECORDED EVENT" : "NARRATIVE STEP";
  const renderEvent = (event: StageActivityEvent) => {
    const variable = event.variableId ? variableById.get(event.variableId) : undefined;
    const color = event.kind === "error" ? theme.error : event.kind === "decision" ? theme.warning
      : event.reportedOperation === "read" ? theme.primary : event.reportedOperation ? theme.success : theme.textSecondary;
    return <li key={event.id} data-fp="stage-activity-event" data-event-kind={event.kind}
      style={sx({ padding: `${ui.spaceSm} 0`, borderBottom: `${ui.borderWidth} solid ${theme.border}`, overflowWrap: "anywhere" })}>
      <div style={sx({ display: "flex", alignItems: "center", gap: ui.spaceSm, flexWrap: "wrap", marginBottom: ui.spaceXs })}>
        <FootprintBadge unstyled={unstyled} densitySize={size} part="activity-event-kind" defaultStyle={sx({ fontSize: ui.small, color, background: "transparent", padding: 0 })}>
          {eventLabel(event)}
        </FootprintBadge>
        {variable && keyButton(variable, "sequence")}
      </div>
      <div style={sx({ fontSize: ui.body, lineHeight: ui.lineHeight, whiteSpace: "pre-wrap" })}>{event.text}</div>
    </li>;
  };
  const eventIds = new Set(activity.events.map(event => event.id));
  const additionalDecisions = activity.decisions.filter(event => !eventIds.has(event.id));
  const additionalLogs = activity.logs.filter(event => !eventIds.has(event.id));

  return <section data-fp="stage-activity-panel" aria-label="Stage activity" className={className}
    style={{ ...sx({ padding: ui.padding, color: theme.textPrimary, fontFamily: theme.fontSans, fontSize: ui.body, lineHeight: ui.lineHeight, fontWeight: ui.weightNormal }), ...style }}>
    <header style={sx({ marginBottom: ui.spaceLg, overflowWrap: "anywhere" })}>
      <h3 style={sx({ margin: 0, fontSize: ui.body, fontWeight: ui.weightStrong })}>{activity.identity.stageLabel || activity.identity.stageName || "Selected stage"}</h3>
      <div style={sx({ marginTop: ui.spaceXs, fontSize: ui.small, color: theme.textSecondary })}>{scope}</div>
      <FootprintCode unstyled={unstyled} densitySize={size} part="activity-visit" data-fp="stage-activity-visit" defaultStyle={sx({ fontFamily: theme.fontMono, display: "block", marginTop: ui.spaceXs, fontSize: ui.small, color: theme.textSecondary, overflowWrap: "anywhere" })}>
        {activity.identity.runtimeStageId ?? "Exact visit not recorded"}
      </FootprintCode>
    </header>
    {!activity.availability.ok ? <p role="status" data-fp="stage-activity-unavailable" style={sx({ margin: 0, lineHeight: ui.lineHeight })}>
      Activity is unavailable for this exact visit. {activity.availability.reason}
    </p> : <>
      <div style={sx({ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: `calc(${ui.spaceLg} + ${ui.spaceXs})`, alignItems: "start" })}>
        <div ref={contentRef} data-fp="stage-activity-content" style={sx({ minWidth: 0 })}>
          {heading("Recorded activity")}
          {activity.events.length ? <ol data-fp="stage-activity-sequence" style={sx({ listStyle: "none", padding: 0, margin: `0 0 ${ui.spaceLg}` })}>
            {activity.events.map(renderEvent)}
          </ol> : <p style={sx({ margin: `0 0 ${ui.spaceLg}`, color: theme.textSecondary, lineHeight: ui.lineHeight })}>
            {activity.coverage.narrative === "unavailable" ? "Recorded narrative is unavailable for this visit." : "No ordered narrative steps recorded for this visit."}
          </p>}
          {heading("Recorded read keys")}
          {activity.reads.length ? <ul style={sx({ listStyle: "none", padding: 0, margin: `0 0 ${ui.spaceLg}`, display: "flex", flexWrap: "wrap", gap: ui.controlGap })}>
            {activity.reads.map(variable => <li key={variable.id}>{keyButton(variable, "list")}</li>)}
          </ul> : <p style={sx({ margin: `0 0 ${ui.spaceLg}`, color: theme.textSecondary })}>
            {activity.coverage.reads === "unknown" ? "Read coverage is unknown for this visit." : "No state reads recorded for this visit."}
          </p>}
          {heading("Committed changes")}
          {activity.writes.length ? <ul data-fp="stage-activity-writes" style={sx({ listStyle: "none", padding: 0, margin: `0 0 ${ui.spaceLg}` })}>
            {activity.writes.map(variable => <li key={variable.id} style={sx({ padding: `${ui.controlGap} 0`, overflowWrap: "anywhere" })}>
              {keyButton(variable, "list")}
              <span style={sx({ marginLeft: ui.spaceSm, fontSize: ui.small, color: theme.textSecondary })}>{changeLabel(variable.change)}</span>
            </li>)}
          </ul> : <p style={sx({ margin: `0 0 ${ui.spaceLg}`, color: theme.textSecondary })}>
            {activity.coverage.writes === "unavailable" ? "Committed-write evidence is unavailable." : "No committed state changes recorded for this visit."}
          </p>}
          {heading("Decisions")}
          {additionalDecisions.length ? <ol style={sx({ listStyle: "none", padding: 0, margin: `0 0 ${ui.spaceLg}` })}>{additionalDecisions.map(renderEvent)}</ol>
            : <p style={sx({ margin: `0 0 ${ui.spaceLg}`, color: theme.textSecondary })}>{activity.decisions.length ? "Recorded decisions appear in the activity above." : "No decision recorded for this visit."}</p>}
          {heading("Stage events and logs")}
          {additionalLogs.length ? <ol style={sx({ listStyle: "none", padding: 0, margin: 0 })}>{additionalLogs.map(renderEvent)}</ol>
            : <p style={sx({ margin: 0, color: theme.textSecondary })}>{activity.logs.length ? "Stage-scoped events appear in the activity above." : "No stage-scoped logs captured. Run-level console logs remain separate."}</p>}
        </div>
        <aside ref={inspectorRef} data-fp="stage-activity-inspector" aria-label="Variable inspector" aria-live="polite"
          style={sx({ minWidth: 0, padding: ui.padding, border: `${ui.borderWidth} solid ${theme.border}`, borderRadius: ui.radiusPanel, boxShadow: ui.shadowPanel, background: theme.bgSecondary, overflowWrap: "anywhere" })}>
          {heading("Variable inspector")}
          {selected ? <VariableDetail key={selected.id} variable={selected} activity={activity} onTrace={onTraceVariable}
            onNavigateToStage={onNavigateToStage} unstyled={unstyled} size={size} />
            : <p style={sx({ margin: 0, color: theme.textSecondary })}>No recorded state key is available to inspect.</p>}
        </aside>
      </div>
      {activity.coverage.truncated && <p role="status" style={sx({ margin: `${ui.spaceMd} 0 0`, fontSize: ui.small, color: theme.textSecondary })}>This view is limited. Some recorded activity may be omitted.</p>}
      {activity.notes.length > 0 && <details data-fp="stage-activity-notes" style={sx({ marginTop: ui.spaceLg, borderTop: `${ui.borderWidth} solid ${theme.border}`, paddingTop: ui.padding, fontSize: ui.small, color: theme.textSecondary, lineHeight: ui.lineHeight })}>
        <summary style={sx({ cursor: "pointer" })}>Evidence details</summary>
        <div style={sx({ marginTop: ui.spaceSm })}>{activity.notes.map((note, index) => <p key={index} style={sx({ margin: `0 0 ${ui.controlGap}` })}>{note}</p>)}</div>
      </details>}
    </>}
  </section>;
}

function valueText(value: StageActivityValue | undefined): string {
  if (!value || value.state === "unavailable") return "Value preview unavailable";
  if (value.state === "absent") return "Absent in this recorded state";
  return value.preview ?? "Preview unavailable";
}

function changeLabel(change: StageActivityVariable["change"]): string {
  switch (change) {
    case "added": return "Added";
    case "updated": return "Updated";
    case "removed": return "Removed";
    case "unchanged": return "Same value after stage";
    case "written": return "Recorded write";
    default: return "Change details unavailable";
  }
}

function VariableDetail({ variable, activity, onTrace, onNavigateToStage, size, unstyled }: {
  variable: StageActivityVariable;
  activity: StageActivityView;
  onTrace: StageActivityPanelProps["onTraceVariable"];
  onNavigateToStage: StageActivityPanelProps["onNavigateToStage"];
  size: NonNullable<BaseComponentProps["size"]>;
  unstyled: boolean;
}) {
  const ui = componentStyles(size);
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;
  const textStyle: CSSProperties = { whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: theme.fontMono, fontSize: ui.body, margin: `${ui.controlGap} 0 calc(${ui.spaceSm} + 2px)` };
  return <>
    <h4 style={sx({ margin: `0 0 ${ui.spaceSm}`, fontSize: `calc(${ui.body} + 1px)`, fontWeight: ui.weightStrong, overflowWrap: "anywhere" })}>
      <span style={sx({ display: "block", fontSize: ui.small, color: theme.textSecondary, fontWeight: ui.weightNormal })}>{variable.kind === "read" ? "Read key" : "Written key"}</span>
      <FootprintCode unstyled={unstyled} densitySize={size} part="activity-variable-name" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{variable.label}</FootprintCode>
    </h4>
    {variable.kind === "read" && <>
      <div data-fp="stage-activity-value-source" style={sx({ fontSize: ui.small, color: theme.textSecondary, lineHeight: ui.lineHeight })}>{variable.valueLabel}</div>
      <pre data-fp="stage-activity-value" style={sx(textStyle)}>{valueText(variable.value)}</pre>
    </>}
    <div style={sx({ display: "flex", gap: ui.controlGap, flexWrap: "wrap", marginTop: ui.spaceSm })}>
      <FootprintButton unstyled={unstyled} densitySize={size} part="activity-backtrack" type="button" data-fp="stage-activity-backtrack" disabled={!onTrace || !variable.traceTarget}
        onClick={() => { if (variable.traceTarget) onTrace?.(variable.traceTarget); }}
        defaultStyle={sx({ padding: ui.controlPadding, minHeight: ui.controlHeight, border: `${ui.borderWidth} solid ${theme.accent}`, borderRadius: ui.radiusControl, background: theme.bgPrimary,
          color: theme.textPrimary, fontSize: ui.body, cursor: onTrace && variable.traceTarget ? "pointer" : "default" })}>
        Backtrack {variable.kind === "read" ? "read" : "write"} {variable.label}
      </FootprintButton>
      {onNavigateToStage && variable.writer && variable.writer.runtimeStageId !== activity.identity.runtimeStageId && <FootprintButton unstyled={unstyled} densitySize={size} part="activity-open-writer"
        type="button" onClick={() => onNavigateToStage(variable.writer!.runtimeStageId)}
        defaultStyle={sx({ padding: ui.controlPadding, minHeight: ui.controlHeight, border: `${ui.borderWidth} solid ${theme.border}`, borderRadius: ui.radiusControl, background: theme.bgPrimary,
          color: theme.textPrimary, fontSize: ui.body, cursor: "pointer" })}>Open writer</FootprintButton>}
    </div>
    {variable.traceTarget && <div data-fp="stage-activity-trace-moment" style={sx({ marginTop: ui.controlGap, fontSize: ui.small, color: theme.textSecondary })}>
      {variable.kind === "read" ? "Traces the state before this stage committed." : "Traces the value committed by this stage."}
    </div>}
    {!variable.traceTarget && <p style={sx({ fontSize: ui.small, color: theme.textSecondary, margin: `${ui.spaceSm} 0 0` })}>The recording does not provide an exact trace target for this key.</p>}
    {variable.kind === "write" && <div data-fp="stage-activity-change" style={sx({ margin: `${ui.spaceMd} 0` })}>
      <div style={sx({ fontSize: ui.small, color: theme.textSecondary })}>Before stage</div>
      <pre style={sx(textStyle)}>{valueText(variable.before)}</pre>
      <div style={sx({ fontSize: ui.small, color: theme.textSecondary })}>After stage</div>
      <pre data-fp="stage-activity-value" style={sx(textStyle)}>{valueText(variable.after)}</pre>
      <div style={sx({ fontSize: ui.small, color: theme.textSecondary })}>Committed result · {changeLabel(variable.change)}</div>
    </div>}
    <div style={sx({ fontSize: ui.small, color: theme.textSecondary, marginTop: ui.spaceMd })}>
      {variable.writer ? variable.kind === "write" && variable.writer.runtimeStageId === activity.identity.runtimeStageId
        ? "Recorded writer: this stage"
        : <>{variable.kind === "read" ? "Prior recorded writer" : "Recorded writer"}: {variable.writer.stageName}
          <FootprintCode unstyled={unstyled} densitySize={size} part="activity-writer-visit" defaultStyle={sx({ fontFamily: theme.fontMono, display: "block", marginTop: ui.spaceXs, overflowWrap: "anywhere" })}>{variable.writer.runtimeStageId}</FootprintCode></>
        : variable.kind === "read" ? "This read's origin is not established." : "Recorded writer information is unavailable."}
    </div>
  </>;
}
