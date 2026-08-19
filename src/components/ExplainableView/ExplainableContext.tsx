import * as React from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { graphFromStructure } from "../../adapters/graphFromStructure";
import {
  narrativeFromSnapshot,
  toVisualizationSnapshots,
} from "../../adapters/fromRuntimeSnapshot";
import { overlayFromSnapshot } from "../../adapters/overlayFromSnapshot";
import type { TraceGraph } from "../FlowchartView/traceStructureRecorder";
import type { RuntimeOverlay } from "../FlowchartView/createTraceRuntimeOverlay";
import type { RuntimeSnapshotInput } from "../ExplainableShell";
import type { NarrativeEntry, StageSnapshot } from "../../types";
import {
  FootprintTheme,
  themeModeVars,
  type ThemeMode,
  type ThemeTokens,
} from "../../theme";
import type { TracedFlowColors } from "../FlowchartView/TracedFlow";

export interface ExplainableRecording {
  readonly snapshot: RuntimeSnapshotInput;
  readonly structure?: unknown;
  readonly blueprint?: unknown;
  readonly narrativeEntries?: NarrativeEntry[];
  readonly resultData?: Record<string, unknown> | null;
  readonly logs?: readonly string[];
  readonly schemaVersion?: number;
  readonly [key: string]: unknown;
}

export type ExplainableRecordingInput = ExplainableRecording | string | null | undefined;

export interface ExplainableViewTheme {
  /** Built-in light/dark palette. Omit to inherit the consumer's CSS variables. */
  readonly mode?: ThemeMode;
  /** Fine-grained design tokens. These override the selected mode. */
  readonly tokens?: ThemeTokens;
  /** Flowchart state colors. These override both mode and tokens for chart nodes. */
  readonly flowchart?: Partial<TracedFlowColors>;
}

export interface ExplainableRunContextValue {
  readonly recording: ExplainableRecording | null;
  readonly snapshots: StageSnapshot[];
  readonly selectedIndex: number;
  readonly selectedSnapshot: StageSnapshot | undefined;
  readonly selectIndex: (index: number) => void;
  readonly traceGraph: TraceGraph;
  readonly runtimeOverlay: RuntimeOverlay;
  readonly narrativeEntries: NarrativeEntry[];
  readonly resultData: Record<string, unknown> | null;
  readonly logs: string[];
  readonly flowchartColors: Partial<TracedFlowColors> | undefined;
  readonly error: string | null;
}

export interface ExplainableProviderProps {
  readonly recording: ExplainableRecordingInput;
  readonly selectedIndex?: number;
  readonly defaultSelectedIndex?: number;
  readonly onSelectedIndexChange?: (index: number) => void;
  readonly theme?: ExplainableViewTheme;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

const ExplainableRunContext = createContext<ExplainableRunContextValue | null>(null);

function parseRecording(input: ExplainableRecordingInput): {
  recording: ExplainableRecording | null;
  error: string | null;
} {
  if (input == null || input === "") {
    return { recording: null, error: "No recording provided." };
  }

  let candidate: unknown = input;
  if (typeof input === "string") {
    try {
      candidate = JSON.parse(input);
    } catch (error) {
      return {
        recording: null,
        error: `Could not parse recording JSON: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { recording: null, error: "A recording must be a JSON object." };
  }

  const recording = candidate as ExplainableRecording;
  if (!recording.snapshot || typeof recording.snapshot !== "object") {
    return { recording: null, error: "The recording is missing its `snapshot`." };
  }
  if (recording.schemaVersion !== undefined && recording.schemaVersion !== 1) {
    return {
      recording: null,
      error: `Unsupported recording schemaVersion ${String(recording.schemaVersion)}.`,
    };
  }
  return { recording, error: null };
}

export function ExplainableProvider({
  recording: input,
  selectedIndex: controlledIndex,
  defaultSelectedIndex = 0,
  onSelectedIndexChange,
  theme,
  children,
  className,
  style,
}: ExplainableProviderProps) {
  const parsed = useMemo(() => parseRecording(input), [input]);
  const prepared = useMemo(() => {
    if (!parsed.recording) {
      return {
        snapshots: [] as StageSnapshot[],
        narrativeEntries: [] as NarrativeEntry[],
        traceGraph: graphFromStructure(undefined),
        runtimeOverlay: overlayFromSnapshot(undefined),
        error: parsed.error,
      };
    }

    const narrativeEntries =
      parsed.recording.narrativeEntries ??
      narrativeFromSnapshot(parsed.recording.snapshot) ??
      [];
    const runtimeSnapshot = parsed.recording.snapshot as Parameters<
      typeof toVisualizationSnapshots
    >[0];
    try {
      return {
        snapshots: toVisualizationSnapshots(runtimeSnapshot, narrativeEntries),
        narrativeEntries,
        traceGraph: graphFromStructure(
          parsed.recording.structure ?? parsed.recording.blueprint,
        ),
        runtimeOverlay: overlayFromSnapshot(parsed.recording.snapshot, { narrativeEntries }),
        error: null,
      };
    } catch (error) {
      return {
        snapshots: [] as StageSnapshot[],
        narrativeEntries,
        traceGraph: graphFromStructure(
          parsed.recording.structure ?? parsed.recording.blueprint,
        ),
        runtimeOverlay: overlayFromSnapshot(parsed.recording.snapshot, { narrativeEntries }),
        error: `Could not read recording snapshot: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }, [parsed]);

  const [uncontrolledIndex, setUncontrolledIndex] = useState(defaultSelectedIndex);
  const requestedIndex = controlledIndex ?? uncontrolledIndex;
  const selectedIndex = Math.max(
    0,
    Math.min(requestedIndex, Math.max(0, prepared.snapshots.length - 1)),
  );
  const selectIndex = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(
        0,
        Math.min(nextIndex, Math.max(0, prepared.snapshots.length - 1)),
      );
      if (controlledIndex === undefined) setUncontrolledIndex(clamped);
      onSelectedIndexChange?.(clamped);
    },
    [controlledIndex, onSelectedIndexChange, prepared.snapshots.length],
  );

  const value = useMemo<ExplainableRunContextValue>(
    () => ({
      recording: parsed.recording,
      snapshots: prepared.snapshots,
      selectedIndex,
      selectedSnapshot: prepared.snapshots[selectedIndex],
      selectIndex,
      traceGraph: prepared.traceGraph,
      runtimeOverlay: prepared.runtimeOverlay,
      narrativeEntries: prepared.narrativeEntries,
      resultData:
        parsed.recording?.resultData ?? parsed.recording?.snapshot.sharedState ?? null,
      logs: parsed.recording?.logs ? [...parsed.recording.logs] : [],
      flowchartColors: theme?.flowchart,
      error: prepared.error,
    }),
    [parsed.recording, prepared, selectedIndex, selectIndex, theme?.flowchart],
  );

  return (
    <ExplainableRunContext.Provider value={value}>
      <div
        className={className}
        data-fp="explainable-provider"
        style={{ ...themeModeVars(theme?.mode), display: "contents", ...style }}
      >
        <FootprintTheme tokens={theme?.tokens}>{children}</FootprintTheme>
      </div>
    </ExplainableRunContext.Provider>
  );
}

export function useExplainableRun(): ExplainableRunContextValue {
  const value = useContext(ExplainableRunContext);
  if (!value) {
    throw new Error("Explainable components must be rendered inside <ExplainableProvider>.");
  }
  return value;
}
