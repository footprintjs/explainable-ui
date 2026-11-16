import { createContext, useContext, type ReactNode } from "react";
import type { NarrativeEntry, StageSnapshot } from "../../types";
import type { StageActivityTraceTarget, StageActivityView } from "../../trace/stageActivity";
import type { TraceIngredient, TraceWalk } from "../../trace/traceWalk";
import type { SubflowHandoffSource } from "../../trace/subflowHandoff";
import type { FootprintComponents, ThemeMode, ThemeTokens } from "../../theme";
import type { CommentaryPanelProps } from "../ExplainableView/CommentaryPanel";

/** Two presentations of the same recorded run and selected visit. */
export type LensView = "developer" | "story";

/** Recorded prose presentation; text and values still come from the recording. */
export type LensCommentaryOptions = Pick<CommentaryPanelProps,
  "title" | "maxLines" | "renderEntry" | "emptyMessage" | "presentation" | "followCursor" | "showEntryTypes" | "groupByStage"
>;

/** One design-system mapping for the complete Lens, including custom layouts. */
export interface LensTheme {
  mode?: ThemeMode;
  tokens?: ThemeTokens;
  components?: FootprintComponents;
}

/** Ready-made surfaces retain the Lens's exact visit, invocation and trace actions. */
export interface LensWorkbenchSurfaces {
  timeTravel: ReactNode;
  navigation: ReactNode;
  breadcrumb: ReactNode;
  chart: ReactNode;
  commentary: ReactNode;
  topology: ReactNode;
  inspector: ReactNode;
  developer: ReactNode;
  details: ReactNode;
  runData: ReactNode;
  result: ReactNode;
  timeline: ReactNode;
  compactTimeline: ReactNode;
}

export interface LensWorkbenchActions {
  selectIndex: (index: number) => void;
  selectStage: (runtimeStageId: string) => void;
  drillDown: (mountStageId: string) => void;
  returnToRoot: () => void;
  backtrack: (target: StageActivityTraceTarget) => void;
  exitBacktrack: () => void;
  followIngredient: (ingredient: TraceIngredient) => void;
  followHandoff: (source: SubflowHandoffSource) => void;
  returnToQuestion: (index: number) => void;
  showAllIngredients: () => void;
  selectActivityVariable: (variableId: string) => void;
}

/** Current state only. Bookmarks and returns are still validated by the Lens. */
export interface LensWorkbenchContextValue {
  readonly snapshots: readonly StageSnapshot[];
  readonly selectedIndex: number;
  readonly selectedSnapshot: StageSnapshot | undefined;
  readonly invocationPath: readonly string[];
  readonly activity: StageActivityView;
  readonly selectedActivityVariableId: string | undefined;
  /** The current scope's supplied recording; custom logs own cursor filtering. */
  readonly narrativeEntries: readonly NarrativeEntry[];
  /** False while a recording's known stale companion is withheld. */
  readonly narrativeAvailable?: boolean;
  /** The admitted narrative scope at the selected subflow level. */
  readonly narrativeScopeSubflowId?: string;
  readonly traceWalk: TraceWalk | null;
  readonly questionTrail: readonly { key: string; invocationPath: readonly string[] }[];
  readonly activityOrigin: {
    readonly stageLabel: string; readonly key: string; readonly kind: "read" | "write";
    readonly runtimeStageId: string; readonly invocationPath: readonly string[];
  } | null;
  readonly surfaces: LensWorkbenchSurfaces;
  readonly actions: LensWorkbenchActions;
}

export type LensWorkbenchLayout = (workbench: LensWorkbenchContextValue) => ReactNode;

/** Internal provider; a custom layout and its child components share this value. */
export const LensWorkbenchContext = createContext<LensWorkbenchContextValue | null>(null);

export function useLensWorkbench(): LensWorkbenchContextValue {
  const value = useContext(LensWorkbenchContext);
  if (!value) throw new Error("useLensWorkbench must be used inside ExplainableShell.");
  return value;
}
