import { FootprintCode } from "../../theme";
import { useMemo } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, componentStyles } from "../../theme";
import { formatRecordedValue } from "../../recordedValues";

function ownEntries(memory: Record<string, unknown>) {
  try { return Object.entries(Object.getOwnPropertyDescriptors(memory)).filter(([, descriptor]) => descriptor.enumerable); }
  catch { return null; }
}

export interface MemoryInspectorProps extends BaseComponentProps {
  /** A memory object to show as-is. Takes precedence over `snapshots`. */
  data?: Record<string, unknown>;
  /** When using snapshots mode, pass these instead of data */
  snapshots?: StageSnapshot[];
  /** Which step's state to show (for time-travel). Each snapshot's `memory`
   *  is already the accumulated state after that stage — including its
   *  deletions — so this reads that step, it does not re-accumulate. */
  selectedIndex?: number;
  /** Show data types alongside values */
  showTypes?: boolean;
  /** Highlight keys that are new at this step */
  highlightNew?: boolean;
}

/**
 * Displays pipeline memory state as formatted JSON.
 * Supports both static (data prop) and time-travel (snapshots + selectedIndex) modes.
 */
export function MemoryInspector({
  data,
  snapshots,
  selectedIndex = 0,
  showTypes = false,
  highlightNew = true,
  size = "default",
  unstyled = false,
  className,
  style,
}: MemoryInspectorProps) {
  const { memory, newKeys } = useMemo(() => {
    if (data) {
      return { memory: data, newKeys: new Set<string>() };
    }
    if (!snapshots || snapshots.length === 0) {
      return { memory: {}, newKeys: new Set<string>() };
    }

    const safeIdx = Math.min(selectedIndex, snapshots.length - 1);

    // A snapshot's `memory` IS the accumulated state after that stage ran
    // (see `StageSnapshot.memory`) — the adapter has already replayed every
    // commit onto it, deletes included. So the state at this step is simply
    // this step's memory.
    //
    // This used to `Object.assign` every earlier snapshot's memory on top of
    // each other, which can only ever ADD keys back: a key the run DELETED
    // was resurrected from the step before it, and the ScopeDiff composed
    // right beside this panel (MemoryPanel) reported that same key "removed"
    // in the very same view. Deleted stays deleted.
    const merged = snapshots[safeIdx]?.memory ?? {};

    const nk = new Set<string>();
    if (highlightNew) {
      const prev = safeIdx > 0 ? snapshots[safeIdx - 1]?.memory ?? {} : {};
      for (const k of Object.keys(merged)) {
        if (!Object.prototype.hasOwnProperty.call(prev, k)) nk.add(k);
      }
    }

    return { memory: merged, newKeys: nk };
  }, [data, snapshots, selectedIndex, highlightNew]);

  const entries = ownEntries(memory);
  const ui = componentStyles(size);
  if (!entries) return <div className={className} style={style} data-fp="memory-inspector" role="region" aria-label="Memory state"><pre>[Unavailable]</pre></div>;

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="memory-inspector" role="region" aria-label="Memory state">
        <div data-fp="memory-label">Memory State</div>
        <pre data-fp="memory-json">
          <FootprintCode defaultStyle={undefined}>{formatRecordedValue(memory, { indent: 2 })}</FootprintCode>
        </pre>
        {showTypes && <dl data-fp="memory-types">{entries.map(([key, descriptor]) => <div key={key}>
          <dt>{key}</dt><dd>{'value' in descriptor ? typeof descriptor.value : 'unavailable'}</dd>
        </div>)}</dl>}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        padding: ui.padding,
        fontFamily: theme.fontSans,
        ...style,
      }}
      data-fp="memory-inspector"
      role="region"
      aria-label="Memory state"
    >
      <span
        style={{
          fontSize: ui.label,
          fontWeight: ui.weightStrong,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Memory State
      </span>
      <div
        style={{
          marginTop: ui.spaceSm,
          background: theme.bgSecondary,
          border: `${ui.borderWidth} solid ${theme.border}`,
          borderRadius: ui.radiusPanel,
          padding: `${ui.padding} calc(${ui.padding} + ${ui.spaceXs})`,
          fontFamily: theme.fontMono,
          fontSize: ui.body,
          lineHeight: ui.lineHeight,
        }}
      >
        <span style={{ color: theme.textMuted }}>{"{"}</span>
        {entries.length === 0 && (
          <div
            style={{
              paddingLeft: ui.spaceLg,
              color: theme.textMuted,
              fontStyle: "italic",
            }}
          >
            {"// empty"}
          </div>
        )}
        {entries.map(([key, descriptor], i) => {
          const isNew = newKeys.has(key);
          const isLast = i === entries.length - 1;
          return (
            <div
              key={key}
              style={{
                paddingLeft: ui.spaceLg,
                background: isNew
                  ? `color-mix(in srgb, ${theme.success} 10%, transparent)`
                  : "transparent",
                borderRadius: ui.radiusControl,
                marginLeft: `calc(-1 * ${ui.spaceXs})`,
                marginRight: `calc(-1 * ${ui.spaceXs})`,
                paddingRight: ui.spaceXs,
              }}
            >
              <span style={{ color: theme.primary }}>&quot;{key}&quot;</span>
              <span style={{ color: theme.textMuted }}>: </span>
              <span style={{ color: theme.success }}>
                <FootprintCode defaultStyle={undefined}>{'value' in descriptor ? formatRecordedValue(descriptor.value) : '[Unavailable]'}</FootprintCode>
              </span>
              {showTypes && (
                <span
                  style={{
                    color: theme.textMuted,
                    fontSize: ui.small,
                    marginLeft: ui.spaceSm,
                    opacity: 0.6,
                  }}
                >
                  ({'value' in descriptor ? typeof descriptor.value : 'unavailable'})
                </span>
              )}
              {!isLast && <span style={{ color: theme.textMuted }}>,</span>}
            </div>
          );
        })}
        <span style={{ color: theme.textMuted }}>{"}"}</span>
      </div>
    </div>
  );
}
