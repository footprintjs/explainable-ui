import type { CSSProperties } from "react";
import type { StageSnapshot } from "../../../types";
import { theme } from "../../../theme";
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
}

const chipStyle: CSSProperties = {
  border: "1px solid var(--fp-accent, #6366f1)", background: "transparent",
  color: "var(--fp-accent, #6366f1)", borderRadius: 12, padding: "2px 10px",
  margin: "0 6px 6px 0", fontSize: 11, fontWeight: 600, fontFamily: "monospace", cursor: "pointer",
};

/** Render an admitted trace question and commands without interpreting its history. */
export function TraceSessionPanel({ availability, scopeLabel, snapshot, selectedIndex, view }: TraceSessionPanelProps) {
  if (!availability.ok) return <TraceUnavailableNote availability={availability} scopeLabel={scopeLabel} />;
  if (view.tracing && view.traceWalk) {
    return <TraceWalkCard
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
      forkChooserOpen={view.forkChooserOpen}
      onContinueTimeOrder={view.handleContinueTimeOrder}
      canContinueTimeOrder={view.traceStopIndices.some(index => index < selectedIndex)}
    />;
  }
  const query = view.traceSearch.trim().toLowerCase();
  const matchedKeys = query ? view.allTracedKeys.filter(key => key.toLowerCase().includes(query)) : view.allTracedKeys;
  const shownKeys = matchedKeys.slice(0, 12);
  return <>
    {(view.shellDataTrace.frames[0]?.keysWritten?.length ?? 0) > 0 && <div data-fp="trace-entry" style={{ padding: "10px 14px 0", fontSize: 12 }}>
      <span style={{ color: theme.textMuted, marginRight: 6 }}>This step wrote:</span>
      {view.shellDataTrace.frames[0].keysWritten.map(key => <button
        key={key} data-fp="trace-entry-chip" onClick={() => view.handleStartTracing(key)}
        title={`Where did ${key} come from? Walk its causes on the timeline.`} style={chipStyle}
      >{key}</button>)}
    </div>}
    {view.allTracedKeys.length > 0 && <div data-fp="trace-any" style={{ padding: "6px 14px 0", fontSize: 12 }}>
      <div style={{ color: theme.textMuted, marginBottom: 4 }}>Trace any variable:</div>
      <input data-fp="trace-search" value={view.traceSearch} onChange={event => view.setTraceSearch(event.target.value)} placeholder="search any variable..." style={{
        display: "block", width: "100%", boxSizing: "border-box", background: theme.bgTertiary,
        border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.textPrimary,
        fontSize: 11, fontFamily: "monospace", padding: "4px 8px", marginBottom: 6,
      }} />
      {shownKeys.map(key => <button key={key} data-fp="trace-any-chip" onClick={() => view.handleStartTracing(key)} title={`Where did ${key} come from? Walk its causes on the timeline.`} style={chipStyle}>{key}</button>)}
      {query === "" && matchedKeys.length > shownKeys.length && <span style={{ color: theme.textMuted, fontSize: 11 }}>+{matchedKeys.length - shownKeys.length} more — type to search</span>}
    </div>}
    <DataTracePanel frames={view.shellDataTrace.frames}
      note={view.shellDataTrace.readsAvailable ? undefined : "⚠ reads were not recorded (readTracking off) — dependencies are unknowable, not absent."}
      selectedStageId={snapshot?.runtimeStageId} onFrameClick={view.navigateToStage} fromStageName={snapshot?.stageName}
    />
  </>;
}
