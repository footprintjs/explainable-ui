import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { BaseComponentProps, StageSnapshot } from "../../../types";
import { componentStyles, FootprintButton, theme } from "../../../theme";
import {
  detectKeyedSteps, projectKeyedRecorder, readRecorderNumber, recorderMetricColumn,
  type RecorderMetricColumn,
} from "../../../model/recorderView";
import { ownDataField } from "../../../trace/safeRecordRead";

export interface KeyedRecorderViewProps extends BaseComponentProps {
  data: unknown;
  description?: string;
  preferredOperation?: "translate" | "accumulate" | "aggregate";
  snapshots: StageSnapshot[];
  selectedIndex: number;
  scopeLabel?: string;
  /** Set only for the built-in metrics recorder; custom recorders stay generic. */
  presentation?: "generic" | "metrics";
}

function formatNumber(value: number | null): string {
  if (value === null) return "—";
  if (value !== 0 && Math.abs(value) < 0.000001) return value.toExponential(2);
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function rawRecorderText(data: unknown): string {
  if (typeof data === "string") return data;
  try {
    const seen = new WeakSet<object>();
    const text = JSON.stringify(data, (_key, value: unknown) => {
      if (value && typeof value === "object") {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      return value;
    }, 2) ?? "No recorder data.";
    return text.length > 100_000 ? `${text.slice(0, 100_000)}\n[Additional recorder data omitted]` : text;
  } catch { return "Recorder data could not be displayed."; }
}

export function KeyedRecorderView({
  data, description, preferredOperation = "accumulate", snapshots, selectedIndex,
  scopeLabel = "Current flow", presentation = "generic", size = "default", unstyled = false, className, style,
}: KeyedRecorderViewProps) {
  const [showTotal, setShowTotal] = useState(false);
  useEffect(() => { setShowTotal(false); }, [data, snapshots]);
  const detected = useMemo(() => detectKeyedSteps(data), [data]);
  const projected = useMemo(() => projectKeyedRecorder(data, detected, snapshots, selectedIndex), [data, detected, snapshots, selectedIndex]);
  const ui = componentStyles(size);
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;
  const rootStyle = { ...sx({ overflow: "auto", height: "100%", fontSize: ui.body, lineHeight: ui.lineHeight,
    color: theme.textPrimary, padding: ui.padding }), ...style };
  const cell = sx({ textAlign: "right", padding: `${ui.spaceSm} ${ui.spaceMd}`, borderBottom: `${ui.borderWidth} solid ${theme.border}`,
    fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" });
  const labelCell = sx({ ...cell, textAlign: "left", fontWeight: ui.weightMedium });
  const muted = sx({ fontSize: ui.small, color: theme.textMuted, margin: `${ui.spaceSm} 0`, lineHeight: ui.lineHeight });
  const sectionTitle = sx({ fontSize: ui.label, fontWeight: ui.weightStrong, margin: `${ui.spaceLg} 0 ${ui.spaceSm}` });
  const number = (value: number | null, label: string) => <span title={value === null ? `${label}: unavailable or not safely totalled` : undefined}>{formatNumber(value)}</span>;

  if (!projected) {
    return <div data-fp="keyed-recorder" data-mode={presentation} className={className} style={rootStyle}>
      <p style={muted}>{scopeLabel} · Recorder output has no readable per-visit numeric table.</p>
      {presentation !== "metrics" && <pre style={sx({ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: theme.fontMono, fontSize: ui.small })}>{rawRecorderText(data)}</pre>}
    </div>;
  }

  const { steps, numFieldKey, scopeEntries, visibleEntries, unscopedEntries, runningTotal, currentScopeTotal,
    selectedEntryKey, columns, visibleTotals, currentScopeTotals, keyType, unmatchedCount, ambiguousCount, isAtEnd } = projected;
  const metrics = presentation === "metrics";
  // Only the built-in recorder establishes the unit of its legacy `duration`
  // field. An arbitrary custom recorder may use another unit.
  const displayColumn = (column: RecorderMetricColumn) => !metrics && column.key === "duration"
    ? { ...column, label: "Duration" } : column;
  const displayColumns = (metrics || !numFieldKey ? columns : [recorderMetricColumn(numFieldKey)]).map(displayColumn);
  const selected = selectedEntryKey ? ownDataField(steps, selectedEntryKey) : undefined;
  const selectedSnapshot = snapshots[selectedIndex];
  const selectedLabel = selectedSnapshot?.stageLabel || selectedSnapshot?.stageName || "Unavailable visit";
  const selectedStepNumber = snapshots.length ? Math.min(snapshots.length, Math.max(0, selectedIndex + 1)) : 0;
  const totalHeading = preferredOperation === "aggregate" ? "Flow total" : "Total through this step";
  const total = preferredOperation === "aggregate" ? currentScopeTotal : runningTotal;
  const renderValue = (row: unknown, column: RecorderMetricColumn) => number(readRecorderNumber(row, column.key), column.label);

  if (keyType === "stageName") {
    return <div data-fp="keyed-recorder" data-mode={presentation} className={className} style={rootStyle}>
      <h3 style={sx({ fontSize: ui.title, fontWeight: ui.weightStrong, margin: `0 0 ${ui.spaceSm}` })}>Legacy stage totals</h3>
      <p style={muted}>Entire recorder output · Stage-name records have no exact invocation or visit association.</p>
      <p role="note" style={muted}>Current view: {scopeLabel}. Selected-step and flow totals are unavailable for these legacy records.</p>
      {!metrics && description && <p style={muted}>{description}</p>}
      <div style={sx({ overflowX: "auto" })}>
        <table aria-label="Legacy stage totals" style={sx({ width: "100%", borderCollapse: "collapse", fontSize: ui.small })}>
          <thead><tr><th scope="col" style={labelCell}>Recorded stage</th>{displayColumns.map(column => <th key={column.key} scope="col" style={cell}>{column.label}</th>)}</tr></thead>
          <tbody>{unscopedEntries.map(key => <tr key={key} data-fp="recorder-row">
            <th scope="row" style={labelCell}>{key}</th>
            {displayColumns.map(column => <td key={column.key} style={cell}>{renderValue(ownDataField(steps, key), column)}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </div>;
  }

  return <div data-fp="keyed-recorder" data-mode={presentation} className={className} style={rootStyle}>
    <h3 style={sx({ fontSize: ui.title, fontWeight: ui.weightStrong, margin: `0 0 ${ui.spaceSm}` })}>{metrics ? "Recorded metrics" : "Recorded values"}</h3>
    <p data-fp="recorder-scope" style={muted}>{scopeLabel} · Step {selectedStepNumber} of {snapshots.length} · {visibleEntries.length} of {scopeEntries.length} matched visits shown.</p>
    {metrics ? <p style={muted}>Recorded counts and durations for this flow. — means unavailable; zero is a recorded value.</p>
      : description && <p style={muted}>{description}</p>}
    {unmatchedCount > 0 && <p role="note" style={muted}>Other recorder rows are outside this flow or cannot be matched uniquely.{ambiguousCount > 0 ? ` ${ambiguousCount} ambiguous rows are excluded.` : ""}</p>}

    {metrics && columns.length > 0 && <>
      <div style={sectionTitle}>Selected step · {selectedLabel}</div>
      <div style={sx({ overflowX: "auto" })}>
        <table aria-label="Metrics summary" style={sx({ width: "100%", borderCollapse: "collapse", fontSize: ui.small })}>
          <thead><tr><th scope="col" style={labelCell}>Metric</th><th scope="col" style={cell}>Selected step</th><th scope="col" style={cell}>Through step {selectedStepNumber}</th><th scope="col" style={cell}>Whole flow</th></tr></thead>
          <tbody>{columns.map(column => <tr key={column.key}>
            <th scope="row" style={labelCell}>{column.label}</th>
            <td style={cell}>{renderValue(selected, column)}</td>
            <td style={cell}>{number(visibleTotals[column.key] ?? null, column.label)}</td>
            <td style={cell}>{number(currentScopeTotals[column.key] ?? null, column.label)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p style={muted}>Whole flow includes all matched visits in {scopeLabel}. Only recorded counts and durations are summed.</p>
      {columns.some(column => column.kind === "duration") && <p style={muted}>Stage durations may overlap; their sum is recorded stage time, not elapsed runtime.</p>}
    </>}

    {!metrics && preferredOperation !== "translate" && numFieldKey && <div style={sx({ margin: `${ui.spaceMd} 0`, padding: ui.padding,
      background: theme.bgSecondary, borderRadius: ui.radiusPanel, border: `${ui.borderWidth} solid ${theme.border}` })}>
      {preferredOperation === "aggregate" && !showTotal && isAtEnd
        ? <FootprintButton unstyled={unstyled} densitySize={size} onClick={() => setShowTotal(true)} part="recorder-total"
            defaultStyle={{ padding: ui.controlPadding, borderRadius: ui.radiusControl, fontSize: ui.body,
              border: `${ui.borderWidth} solid ${theme.border}`, background: theme.bgSecondary, color: theme.textPrimary, cursor: "pointer" }}>
            Show flow total
          </FootprintButton>
        : preferredOperation === "aggregate" && !isAtEnd
          ? <p style={muted}>Move to the last step to view the total for this flow.</p>
          : <><div style={sectionTitle}>{totalHeading} · {displayColumn(recorderMetricColumn(numFieldKey)).label}</div>
              <strong style={sx({ fontSize: ui.title, fontWeight: ui.weightStrong, fontVariantNumeric: "tabular-nums" })}>{number(total, numFieldKey)}</strong></>}
    </div>}

    <h4 style={sectionTitle}>Recorded visits through step {selectedStepNumber}</h4>
    {visibleEntries.length > 0 ? <div style={sx({ overflowX: "auto" })}>
      <table aria-label="Recorded visit metrics" style={sx({ width: "100%", borderCollapse: "collapse", fontSize: ui.small })}>
        <thead><tr><th scope="col" style={labelCell}>Stage / visit</th>{displayColumns.map(column => <th key={column.key} scope="col" style={cell}>{column.label}</th>)}</tr></thead>
        <tbody>{visibleEntries.map(key => {
          const row = ownDataField(steps, key);
          const name = ownDataField(row, "stageName");
          const current = key === selectedEntryKey;
          return <tr key={key} aria-current={current ? "step" : undefined} data-fp="recorder-row" data-current={current || undefined}
            style={sx({ background: current ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : undefined })}>
            <th scope="row" style={labelCell}><div>{typeof name === "string" ? name : key}</div>
              {key !== name && <div style={sx({ color: theme.textMuted, fontFamily: theme.fontMono, fontSize: ui.small, overflowWrap: "anywhere" })}>{key}</div>}</th>
            {displayColumns.map(column => <td key={column.key} style={cell}>{renderValue(row, column)}</td>)}
          </tr>;
        })}</tbody>
      </table>
    </div> : <p style={muted}>No recorder rows match the stage visits through this step.</p>}
  </div>;
}
