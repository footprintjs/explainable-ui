import { useMemo, useState } from "react";
import type { StageSnapshot } from "../../../types";
import { theme } from "../../../theme";
import { detectKeyedSteps, projectKeyedRecorder } from "../../../model/recorderView";

export function KeyedRecorderView({
  data,
  description,
  preferredOperation = "accumulate",
  snapshots,
  selectedIndex,
}: {
  data: unknown;
  description?: string;
  preferredOperation?: "translate" | "accumulate" | "aggregate";
  snapshots: StageSnapshot[];
  selectedIndex: number;
}) {
  const [showAggregate, setShowAggregate] = useState(false);

  const detected = useMemo(() => detectKeyedSteps(data), [data]);
  const projected = useMemo(() => projectKeyedRecorder(data, detected, snapshots, selectedIndex), [data, detected, snapshots, selectedIndex]);

  if (!projected) {
    // Fallback: raw JSON for non-keyed data
    return (
      <div style={{ padding: 12, fontFamily: theme.fontMono, fontSize: 11, whiteSpace: "pre-wrap", overflow: "auto", height: "100%" }}>
        {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
      </div>
    );
  }

  const { steps, numFieldKey, allKeys, visibleEntries, runningTotal, grandTotal, isAtEnd } = projected;

  return (
    <div style={{ overflow: "auto", height: "100%", display: "flex", flexDirection: "column" }}>
      {description && (
        <div style={{ padding: "6px 12px", fontSize: 11, color: theme.textMuted, fontStyle: "italic", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          {description}
        </div>
      )}

      <div style={{ padding: 12, flex: 1, overflow: "auto" }}>
        {/* ── Primary: depends on preferredOperation ── */}

        {preferredOperation === "aggregate" ? (
          /* AGGREGATE: collect silently during scrub, button at end to reveal total */
          <>
            {isAtEnd ? (
              <div style={{ marginBottom: 16 }}>
                {!showAggregate ? (
                  <button
                    onClick={() => setShowAggregate(true)}
                    style={{
                      background: theme.primary, color: "#fff", border: "none", borderRadius: 8,
                      padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit", width: "100%",
                    }}
                  >
                    Aggregate — Show Grand Total
                  </button>
                ) : (
                  <div style={{ padding: "14px 16px", background: `color-mix(in srgb, ${theme.success} 12%, transparent)`, borderRadius: 8, border: `1px solid ${theme.success}44` }}>
                    <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>
                      Aggregate — grand total
                    </div>
                    {numFieldKey && (
                      <div style={{ fontSize: 26, fontWeight: 700, color: theme.success }}>
                        {grandTotal < 1 ? grandTotal.toFixed(3) : grandTotal.toFixed(1)}
                        <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 400, marginLeft: 8 }}>{numFieldKey} &middot; {allKeys.length} steps</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "10px 14px", background: `color-mix(in srgb, ${theme.textMuted} 6%, transparent)`, borderRadius: 6, marginBottom: 16, border: `1px dashed ${theme.border}` }}>
                <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                  Collecting data...
                </div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                  {visibleEntries.length} of {allKeys.length} steps collected. Scrub to end to aggregate.
                </div>
              </div>
            )}
            <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>
              Per-step detail
            </div>
          </>
        ) : preferredOperation === "accumulate" ? (
          /* ACCUMULATE: running total grows with slider — IS the total at end, no button */
          <>
            {numFieldKey && visibleEntries.length > 0 && (
              <div style={{ padding: "10px 14px", background: `color-mix(in srgb, ${theme.primary} 8%, transparent)`, borderRadius: 6, marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600 }}>
                  Accumulate — running total up to this step
                </div>
                <span style={{ fontWeight: 700, fontSize: 18, color: theme.primary }}>
                  {runningTotal < 1 ? runningTotal.toFixed(3) : runningTotal.toFixed(1)}
                </span>
                <span style={{ color: theme.textMuted, marginLeft: 8, fontSize: 10 }}>
                  {numFieldKey} &middot; {visibleEntries.length} of {allKeys.length} steps
                </span>
              </div>
            )}
            <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>
              Per-step detail
            </div>
          </>
        ) : (
          /* TRANSLATE: per-step entries prominent, no totals */
          <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>
            Translate — per-step detail
          </div>
        )}

        {/* ── Per-step entries (always shown) ── */}
        {visibleEntries.map((key) => {
          const entry = steps[key];
          const label = (entry.stageName as string) ?? key;
          const numVal = numFieldKey ? (entry[numFieldKey] as number) : undefined;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", padding: "4px 0", fontSize: 12, fontFamily: theme.fontMono, borderBottom: `1px solid ${theme.border}22` }}>
              <span style={{ color: theme.textMuted, width: 140, flexShrink: 0, fontSize: 10 }}>{key}</span>
              <span style={{ fontWeight: 600, flex: 1 }}>{label}</span>
              {numVal !== undefined && (
                <span style={{ color: theme.primary, fontWeight: 700, marginLeft: 8 }}>
                  {numVal < 1 ? numVal.toFixed(3) : numVal.toFixed(1)}
                </span>
              )}
            </div>
          );
        })}

        {visibleEntries.length === 0 && (
          <div style={{ color: theme.textMuted, fontSize: 11, fontStyle: "italic", padding: "8px 0" }}>
            Scrub the slider to reveal entries...
          </div>
        )}

      </div>
    </div>
  );
}
