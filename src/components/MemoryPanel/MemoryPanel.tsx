/**
 * MemoryPanel — Commit-history based view of pipeline state.
 *
 * Shows accumulated memory at the selected snapshot + what changed.
 * Data source: Scope Recorder (transactional state from SharedMemory).
 *
 * This is a thin composition of MemoryInspector + ScopeDiff — no logic
 * of its own, just correct data derivation from snapshots + index.
 */
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme } from "../../theme";
import { MemoryInspector } from "../MemoryInspector";
import { ScopeDiff } from "../ScopeDiff";
import { recordStateDisplay } from "../_internal/recordStateDisplay";

export interface MemoryPanelProps extends BaseComponentProps {
  snapshots: StageSnapshot[];
  selectedIndex: number;
}

export function MemoryPanel({
  snapshots,
  selectedIndex,
  size = "default",
  unstyled = false,
  className,
  style,
}: MemoryPanelProps) {
  const view = recordStateDisplay(
    snapshots[selectedIndex],
    snapshots[selectedIndex - 1]
  );

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="memory-panel">
        <MemoryInspector
          snapshots={snapshots}
          selectedIndex={selectedIndex}
          unstyled
        />
        {view.canCompare && view.memory !== null && (
          <ScopeDiff previous={view.previous} current={view.memory} unstyled />
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
      data-fp="memory-panel"
    >
      <MemoryInspector
        snapshots={snapshots}
        selectedIndex={selectedIndex}
        size={size}
      />
      {view.canCompare && view.memory !== null && (
        <div style={{ borderTop: `1px solid ${theme.border}` }}>
          <ScopeDiff
            previous={view.previous}
            current={view.memory}
            hideUnchanged
            size={size}
          />
        </div>
      )}
    </div>
  );
}
