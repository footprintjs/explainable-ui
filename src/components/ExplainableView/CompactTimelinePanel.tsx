import * as React from "react";

import { theme } from "../../theme";
import type { BaseComponentProps } from "../../types";
import { CompactTimeline } from "../CompactTimeline/CompactTimeline";
import { useExplainableRun } from "./ExplainableContext";

export interface CompactTimelinePanelProps extends BaseComponentProps {
  readonly defaultExpanded?: boolean;
}

export function CompactTimelinePanel({
  defaultExpanded = false,
  unstyled = false,
  className,
  style,
}: CompactTimelinePanelProps) {
  const { snapshots, selectedIndex, selectIndex } = useExplainableRun();

  if (unstyled) {
    return (
      <div className={className} data-fp="compact-timeline-panel" style={style}>
        {snapshots.map((snapshot, index) => (
          <button
            aria-current={index === selectedIndex ? "step" : undefined}
            key={snapshot.runtimeStageId}
            onClick={() => selectIndex(index)}
            type="button"
          >
            {snapshot.stageLabel}
          </button>
        ))}
      </div>
    );
  }

  return (
    <section
      className={className}
      data-fp="compact-timeline-panel"
      style={{
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        background: theme.bgPrimary,
        color: theme.textPrimary,
        ...style,
      }}
    >
      <CompactTimeline
        snapshots={snapshots}
        selectedIndex={selectedIndex}
        defaultExpanded={defaultExpanded}
      />
    </section>
  );
}
