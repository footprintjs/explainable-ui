import type { NarrativeEntry, StageSnapshot } from '../types';
import type { RuntimeSnapshotInput } from '../model/recording';
import type { TraceGraph } from '../components/FlowchartView/traceStructureRecorder';

/** Serializable presentation and optional-background-work policy. Functions stay in props. */
export interface ProgressiveRenderingOptions {
  readonly loadingIndicator?: 'skeleton' | 'spinner' | 'text';
  readonly prefetch?: 'none' | 'idle';
}
export interface SubflowLoadRequest {
  readonly invocationPath: readonly string[];
  readonly mountRuntimeStageId: string;
  readonly subflowId: string;
  /** Recorded identity when present; never synthesized for a legacy recording. */
  readonly runId?: string;
}
/** A complete recorded child unit. Graph IDs must be qualified below request.subflowId/. */
export interface LoadedSubflow {
  readonly result: unknown;
  readonly graph?: TraceGraph;
  readonly narrativeEntries?: readonly NarrativeEntry[];
}
export interface PreparedSubflow extends LoadedSubflow {
  readonly snapshots: StageSnapshot[];
}
export type SubflowLoadState =
  | { readonly status: 'loading' | 'preparing'; readonly request: SubflowLoadRequest }
  | { readonly status: 'ready'; readonly request: SubflowLoadRequest; readonly value: PreparedSubflow }
  | { readonly status: 'error'; readonly request: SubflowLoadRequest; readonly message: string };
export interface RecordingSourceSnapshot {
  readonly revision: number;
  /** Changes only when a cumulative root cohort publishes, including narrative-only updates. */
  readonly rootRevision: number;
  /** Immutable logical view: original root fields plus admitted exact child results. */
  readonly snapshot: RuntimeSnapshotInput;
  readonly narrativeEntries: NarrativeEntry[];
  readonly scopes: ReadonlyMap<string, SubflowLoadState>;
}
/** Complete cumulative live cohort for the same run; event history must not be truncated. */
export interface RecordingSourceUpdate {
  readonly snapshot: RuntimeSnapshotInput;
  readonly graph: TraceGraph;
  readonly narrativeEntries?: readonly NarrativeEntry[];
}
export interface RecordingSourceOptions {
  readonly snapshot: RuntimeSnapshotInput;
  readonly graph: TraceGraph;
  readonly narrativeEntries?: readonly NarrativeEntry[];
  readonly loadSubflow?: (request: SubflowLoadRequest, options: { signal: AbortSignal }) => LoadedSubflow | Promise<LoadedSubflow>;
  /** Optional host worker/preparation adapter. Cancellation and stale-result guards remain owned by the source. */
  readonly prepareSubflow?: (value: LoadedSubflow, request: SubflowLoadRequest, options: { signal: AbortSignal }) => PreparedSubflow | Promise<PreparedSubflow>;
  /** Bound retained evidence without evicting a Backtrack return location. Default64; new requests refuse when full. */
  readonly maxCachedSubflows?: number;
}
export interface RecordingSource {
  readonly rootSnapshot: RuntimeSnapshotInput;
  readonly rootGraph: TraceGraph;
  readonly canLoadSubflows: boolean;
  /** Queue a complete cumulative live cohort. Publication is batched; does not move the replay cursor. */
  update(value: RecordingSourceUpdate): void;
  getSnapshot(): RecordingSourceSnapshot;
  subscribe(listener: () => void): () => void;
  /** Exact-path key; labels and local array indices are never identities. */
  getKey(path: readonly string[]): string;
  /** Requests deduplicate per exact invocation. A caller abort only cancels that caller's interest. */
  load(request: SubflowLoadRequest, options?: { signal?: AbortSignal; background?: boolean }): Promise<PreparedSubflow>;
  /** Graph for one exact selected ancestry; another visit cannot overwrite its geometry. */
  getGraph(path: readonly string[]): TraceGraph;
  /** Owned by the creator, never automatically called when one view unmounts. */
  dispose(): void;
}
/** Source created by the library. Hosts implementing RecordingSource can keep the existing pull contract. */
export interface LiveRecordingSource extends RecordingSource {
  /** Read the latest complete same-run cohort once at the next publication. Concurrent requests
   * share one promise; it rejects if reading or admission fails, or if disposed before publication. */
  requestUpdate(read: () => RecordingSourceUpdate): Promise<void>;
}
export interface PreparationWorker {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  addEventListener(type: 'error' | 'messageerror', listener: (event: Event) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'error' | 'messageerror', listener: (event: Event) => void): void;
}
