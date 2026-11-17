import type { NarrativeEntry, StageSnapshot } from '../types';
import type { RuntimeSnapshotInput } from '../model/recording';
import type { TraceGraph } from '../components/FlowchartView/traceStructureRecorder';
import type { RuntimeOverlay } from '../components/FlowchartView/createTraceRuntimeOverlay';
import type { RecordingSource, ProgressiveRenderingOptions, SubflowLoadRequest } from '../progressiveRendering';
import type { ReplayControlsOptions, TracingRail } from '../model/replayControls';
import type { StageActivityTraceTarget, StageActivityView } from '../trace/stageActivity';
import type { TraceIngredient, TraceWalk } from '../trace/traceWalk';
import type { TraceWorkflowOverlay } from '../trace/traceWorkflowOverlay';
import type { SubflowHandoffSource } from '../trace/subflowHandoff';
import type { ActivityTraceOrigin } from './internal/useTraceSession';
import type { ReplayAxis } from '../replay/replayAxis';

/** Recording inputs shared by the renderless controller and the default Shell. */
export interface LensRecordingInput {
  source?: RecordingSource;
  runtimeSnapshot?: RuntimeSnapshotInput | null;
  snapshots?: StageSnapshot[];
  narrativeEntries?: NarrativeEntry[];
  traceGraph?: TraceGraph | null;
  runtimeOverlay?: RuntimeOverlay | null;
  resultData?: Record<string, unknown> | null;
}
export interface LensControllerOptions extends LensRecordingInput {
  autoPlay?: boolean;
  replayControls?: ReplayControlsOptions;
  rendering?: ProgressiveRenderingOptions;
}
/** A semantic request; a view chooses its own panel expansion and DOM focus. */
export interface LensPresentationRequest {
  readonly id: number;
  readonly kind: 'trace' | 'activity';
  readonly origin?: ActivityTraceOrigin;
}
export interface LensControllerActions {
  /** Explicit context selection, independent of hidden transport controls. */
  selectIndex(index: number): void;
  selectStage(runtimeStageId: string): void;
  drillDown(mountStageId: string): void;
  returnToRoot(): void;
  chooseInvocation(runtimeStageId: string): void;
  backtrack(target: StageActivityTraceTarget): void;
  exitBacktrack(): void;
  followIngredient(ingredient: TraceIngredient): void;
  followHandoff(source: SubflowHandoffSource): void;
  returnToQuestion(index: number): void;
  showAllIngredients(): void;
  openForkChooser(): void;
  continueTimeOrder(): void;
  setTraceSearch(value: string): void;
  selectActivityVariable(variableId: string): void;
  previous(): void;
  next(): void;
  play(): void;
  pause(): void;
  togglePlay(): void;
  /** Transport scrub: applies the same landable-stop policy as the stock range. */
  scrubTo(index: number): void;
  cancelPending(): void;
  retryPending(): void;
  loadEvidence(mountRuntimeStageId: string): void;
}
export interface LensRecordingStatus {
  readonly status: 'waiting' | 'empty' | 'ready' | 'error';
  readonly reason?: 'no-recording' | 'no-stages' | 'unreadable' | 'identity-unavailable';
}
/** Public headless React model: data and commands, without rendered surfaces. */
export interface LensController {
  readonly replayAxis: ReplayAxis;
  readonly recordingStatus: LensRecordingStatus;
  readonly resultData: Readonly<Record<string, unknown>> | null;
  readonly snapshots: readonly StageSnapshot[];
  readonly selectedIndex: number;
  readonly selectedSnapshot: StageSnapshot | undefined;
  readonly invocationPath: readonly string[];
  readonly activity: StageActivityView;
  readonly selectedActivityVariableId: string | undefined;
  readonly narrativeEntries: readonly NarrativeEntry[];
  readonly narrativeAvailable: boolean;
  readonly narrativeScopeSubflowId: string | undefined;
  readonly traceWalk: TraceWalk | null;
  readonly forkChooserOpen: boolean;
  readonly traceSearch: string;
  readonly questionTrail: readonly { key: string; invocationPath: readonly string[] }[];
  readonly activityOrigin: ActivityTraceOrigin | null;
  readonly graph: TraceGraph | null | undefined;
  readonly overlay: RuntimeOverlay | null | undefined;
  readonly traceWorkflow: TraceWorkflowOverlay | null;
  readonly tracingRail: TracingRail | null;
  readonly pendingLoad: { readonly request: SubflowLoadRequest; readonly status: 'loading' | 'preparing' | 'error' } | null;
  readonly visitChoice: { readonly mountStageId: string; readonly visits: readonly { runtimeStageId: string; step: number; visit: number; total: number }[] } | null;
  readonly navigationNotice: string;
  readonly presentationRequest: LensPresentationRequest | null;
  readonly playback: { readonly playing: boolean; readonly canPlay: boolean; readonly canPrevious: boolean; readonly canNext: boolean };
  readonly actions: LensControllerActions;
}
