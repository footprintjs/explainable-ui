import { useMemo } from 'react';
import { TracedFlow } from '../../FlowchartView/TracedFlow';
import type { TraceGraph } from '../../FlowchartView/traceStructureRecorder';
import type { RuntimeOverlay } from '../../FlowchartView/createTraceRuntimeOverlay';
import type { FlowchartRenderer } from '../../../model/flowchart';
import type { ExplainableShellProps, TraceTheme } from '../ShellProps';

export interface DefaultFlowchartOptions {
  activeGraph: TraceGraph | null | undefined;
  activeRuntimeOverlay: RuntimeOverlay | null | undefined;
  traceTheme?: TraceTheme;
  flowchartRenderer: FlowchartRenderer;
}

/** Stock chart presentation over the Shell/controller's existing scope and cursor. */
export function useDefaultFlowchart({ activeGraph, activeRuntimeOverlay, traceTheme, flowchartRenderer }: DefaultFlowchartOptions): ExplainableShellProps['renderFlowchart'] {
  return useMemo(() => {
    if (!activeGraph) return undefined;
    return ({ selectedIndex, snapshots, onNodeClick, sliceCone, traceWorkflow, currentSubflowId, onSubflowChange, diagramGeometry, diagramDrawings, diagramAppearance, unstyled: chartUnstyled }: Parameters<NonNullable<ExplainableShellProps['renderFlowchart']>>[0]) => {
      // The shell's `selectedIndex` indexes into `snapshots[]` (which
      // may be filtered to a drill-down subset). The overlay's
      // `executionOrder` is the FULL execution timeline (all stages
      // including subflow internals). When the two arrays have
      // different lengths, passing selectedIndex straight through
      // misaligns the chart's active highlight.
      //
      // Translate: take the runtimeStageId at snapshots[selectedIndex]
      // and find the matching position in overlay.executionOrder.
      // Fall back to selectedIndex when no overlay or no match
      // (charts without subflows have aligned indexes anyway).
      const activeRsid = snapshots[selectedIndex]?.runtimeStageId;
      let overlayIdx = selectedIndex;
      if (activeRsid && activeRuntimeOverlay) {
        let i = activeRuntimeOverlay.executionOrder.findIndex(
          (s) => s.runtimeStageId === activeRsid,
        );
        // Drilled-in subflow snapshots carry PREFIX-STRIPPED runtimeStageIds
        // (e.g. "gather#8" vs the overlay's "sf-injection-engine/gather#8"),
        // so the exact match misses and we'd fall back to the raw subflow-local
        // index — mixing index spaces and mis-coloring the whole run as "done".
        // Re-match by suffix so the subflow-local cursor maps to the correct
        // whole-run overlay position (Bug 2).
        if (i < 0) {
          i = activeRuntimeOverlay.executionOrder.findIndex(
            (s) => s.runtimeStageId?.endsWith("/" + activeRsid),
          );
        }
        if (i >= 0) overlayIdx = i;
      }
      // Map the shell's 2-colour Trace theme onto TracedFlow's colour model:
      // `visited → done`, `current → active`, and a neutral base per mode. The
      // flowchart background stays transparent (inherits the container), so it
      // follows the consumer's dark/light automatically.
      const traceColors = traceTheme && {
        ...(traceTheme.visited !== undefined && { done: traceTheme.visited }),
        ...(traceTheme.current !== undefined && { active: traceTheme.current }),
        ...(traceTheme.mode !== undefined && { default: traceTheme.mode === "dark" ? "#94a3b8" : "#64748b" }),
      };
      return (
        <TracedFlow
          renderer={flowchartRenderer}
          diagramGeometry={diagramGeometry} diagramDrawings={diagramDrawings} diagramAppearance={diagramAppearance}
          graph={activeGraph}
          overlay={activeRuntimeOverlay ?? undefined}
          sliceCone={sliceCone ?? undefined}
          traceWorkflow={traceWorkflow}
          unstyled={chartUnstyled}
          colors={traceColors || undefined}
          scrubIndex={overlayIdx}
          onNodeClick={(stageId) => onNodeClick?.(stageId)}
          // CONTROLLED drill: the shell owns the scope, the chart renders it.
          // Every gesture — a mount card here, a row in the Topology tree, the
          // breadcrumb — moves the same one value, so the chart can never show
          // a different level than the panels around it.
          currentSubflowId={currentSubflowId ?? null}
          onSubflowChange={(mountId) => onSubflowChange?.(mountId)}
        />
      );
    };
  }, [activeGraph, activeRuntimeOverlay, traceTheme, flowchartRenderer]);
}
