import { FootprintButton, FootprintInput } from "../../../theme";
import type { CSSProperties } from "react";
import type { Size, StageSnapshot } from "../../../types";
import { componentStyles, theme } from "../../../theme";
import { DataTracePanel } from "../../DataTracePanel/DataTracePanel";
import { TraceWalkCard } from "../../DataTracePanel/TraceWalkCard";
import { TraceUnavailableNote } from "./TraceUnavailableNote";
import type { TraceScope } from "./traceScope";
import type { useTraceSessionController } from "./useTraceSession";
import { recordedValueAtPath } from "../../../trace/recordedValuePreview";

interface TraceSessionPanelProps {
  availability: TraceScope["availability"];
  scopeLabel: "Root" | "Child";
  snapshot?: StageSnapshot;
  selectedIndex: number;
  view: ReturnType<typeof useTraceSessionController>;
  unstyled?: boolean;
  size?: Size;
}

/** Render an admitted trace question and commands without interpreting its history. */
export function TraceSessionPanel({ availability, scopeLabel, snapshot, selectedIndex, view, unstyled = false, size = "default" }: TraceSessionPanelProps) {
  const sx = (style: CSSProperties): CSSProperties | undefined => unstyled ? undefined : style;
  const ui = componentStyles(size);
  const chipStyle: CSSProperties = {
    border: `${ui.borderWidth} solid ${theme.accent}`, background: "transparent", color: theme.accent,
    borderRadius: ui.radiusBadge, padding: ui.controlPadding, margin: `0 ${ui.controlGap} ${ui.controlGap} 0`,
    fontSize: ui.label, fontWeight: ui.weightStrong, fontFamily: theme.fontMono, cursor: "pointer",
  };
  if (!availability.ok) return <TraceUnavailableNote availability={availability} scopeLabel={scopeLabel} unstyled={unstyled} />;
  if (view.tracing && view.traceWalk) {
    return <TraceWalkCard
      unstyled={unstyled}
      size={size}
      walk={view.traceWalk}
      cursorRuntimeStageId={snapshot?.runtimeStageId ?? null}
      viaKey={view.activeViaKey}
      stepNumberOf={view.stepNumberOf}
      previewValueOf={key => recordedValueAtPath(snapshot?.memory, key)}
      onFollowIngredient={view.handleFollowIngredient}
      onFollowHandoff={view.handleFollowHandoff}
      questionTrail={view.questionTrail}
      onReturnToQuestion={view.handleReturnToQuestion}
      onJumpToStop={view.navigateToStage}
      onShowAll={view.activeViaKey ? view.handleShowAllIngredients : undefined}
      onExit={view.handleExitTracing}
      exitLabel={view.activityOrigin ? `Back to ${view.activityOrigin.stageLabel} · Activity` : undefined}
      exitAriaLabel={view.activityOrigin ? `Return to ${view.activityOrigin.stageLabel} activity` : undefined}
      forkChooserOpen={view.forkChooserOpen}
      onContinueTimeOrder={view.handleContinueTimeOrder}
      canContinueTimeOrder={view.traceStopIndices.some(index => index < selectedIndex)}
    />;
  }
  const query = view.traceSearch.trim().toLowerCase();
  const matchedKeys = query ? view.allTracedKeys.filter(key => key.toLowerCase().includes(query)) : view.allTracedKeys;
  const shownKeys = matchedKeys.slice(0, 12);
  return <>
    {(view.shellDataTrace.frames[0]?.keysWritten?.length ?? 0) > 0 && <div data-fp="trace-entry" style={sx({ padding: ui.padding, fontSize: ui.body })}>
      <span style={sx({ color: theme.textMuted, marginRight: 6 })}>This step wrote:</span>
      {view.shellDataTrace.frames[0].keysWritten.map(key => <FootprintButton
        key={key} type="button" data-fp="trace-entry-chip" onClick={() => view.handleStartTracing(key)}
        title={`Where did ${key} come from? Walk its causes on the timeline.`} defaultStyle={sx(chipStyle)}
      >{key}</FootprintButton>)}
    </div>}
    {view.allTracedKeys.length > 0 && <div data-fp="trace-any" style={sx({ padding: ui.padding, fontSize: ui.body })}>
      <div style={sx({ color: theme.textMuted, marginBottom: 4 })}>Trace any variable:</div>
      <FootprintInput part="trace-search" data-fp="trace-search" value={view.traceSearch} onChange={event => view.setTraceSearch(event.target.value)} placeholder="search any variable..."
        style={unstyled ? undefined : { display: "block", width: "100%", boxSizing: "border-box" }} defaultStyle={sx({
        background: theme.bgTertiary, border: `${ui.borderWidth} solid ${theme.border}`, borderRadius: ui.radiusControl, color: theme.textPrimary,
        fontSize: ui.label, fontFamily: theme.fontMono, padding: ui.controlPadding, marginBottom: ui.controlGap,
      })} />
      {shownKeys.map(key => <FootprintButton key={key} type="button" data-fp="trace-any-chip" onClick={() => view.handleStartTracing(key)} title={`Where did ${key} come from? Walk its causes on the timeline.`} defaultStyle={sx(chipStyle)}>{key}</FootprintButton>)}
      {query === "" && matchedKeys.length > shownKeys.length && <span style={sx({ color: theme.textMuted, fontSize: ui.label })}>+{matchedKeys.length - shownKeys.length} more — type to search</span>}
    </div>}
    <DataTracePanel frames={view.shellDataTrace.frames} unstyled={unstyled} size={size}
      note={view.shellDataTrace.readsAvailable ? undefined : "⚠ reads were not recorded (readTracking off) — dependencies are unknowable, not absent."}
      selectedStageId={snapshot?.runtimeStageId} onFrameClick={view.navigateToStage} fromStageName={snapshot?.stageName}
    />
  </>;
}
