import * as React from "react";
import { useCallback, useMemo } from "react";

import { theme } from "../../theme";
import type { BaseComponentProps } from "../../types";
import { TracedFlow, type TracedFlowColors } from "../FlowchartView/TracedFlow";
import { useExplainableRun } from "./ExplainableContext";

export interface FlowchartPanelProps extends BaseComponentProps {
  readonly title?: string;
  readonly colors?: Partial<TracedFlowColors>;
}

function baseStageId(runtimeStageId: string): string {
  const hashIndex = runtimeStageId.indexOf("#");
  return hashIndex >= 0 ? runtimeStageId.slice(0, hashIndex) : runtimeStageId;
}

export function FlowchartPanel({
  title = "Flowchart",
  colors,
  unstyled = false,
  className,
  style,
}: FlowchartPanelProps) {
  const {
    traceGraph,
    runtimeOverlay,
    snapshots,
    selectedIndex,
    selectIndex,
    flowchartColors,
  } = useExplainableRun();
  const scrubIndex = useMemo(() => {
    const runtimeStageId = snapshots[selectedIndex]?.runtimeStageId;
    if (!runtimeStageId) return selectedIndex;
    const match = runtimeOverlay.executionOrder.findIndex(
      (step) => step.runtimeStageId === runtimeStageId,
    );
    return match >= 0 ? match : selectedIndex;
  }, [runtimeOverlay.executionOrder, selectedIndex, snapshots]);
  const handleNodeClick = useCallback(
    (stageId: string) => {
      const candidates = snapshots
        .map((snapshot, index) => ({
          index,
          stageId: baseStageId(snapshot.runtimeStageId ?? snapshot.stageName),
        }))
        .filter((candidate) => candidate.stageId === stageId);
      const next =
        candidates.find((candidate) => candidate.index >= selectedIndex) ??
        candidates[candidates.length - 1];
      if (next) selectIndex(next.index);
    },
    [selectedIndex, selectIndex, snapshots],
  );

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="flowchart-panel">
        {traceGraph.nodes.map((node) => <button key={node.id} onClick={() => handleNodeClick(node.id)}>{String(node.data.label)}</button>)}
      </div>
    );
  }

  return (
    <section
      className={className}
      data-fp="flowchart-panel"
      style={{
        display: "flex",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgPrimary,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        ...style,
      }}
    >
      <header style={{ padding: "10px 12px", borderBottom: `1px solid ${theme.border}` }}>
        <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</strong>
        <span style={{ marginLeft: 8, color: theme.textMuted, fontSize: 10 }}>
          {traceGraph.nodes.length} nodes · click to move the cursor
        </span>
      </header>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {traceGraph.nodes.length ? (
          <TracedFlow
            graph={traceGraph}
            overlay={runtimeOverlay}
            scrubIndex={scrubIndex}
            colors={{ ...flowchartColors, ...colors }}
            onNodeClick={handleNodeClick}
          />
        ) : (
          <p style={{ padding: 18, color: theme.textMuted, fontSize: 12 }}>
            This recording carried no structure, so there is no chart to draw.
          </p>
        )}
      </div>
    </section>
  );
}
