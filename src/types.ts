/** Snapshot of a single pipeline stage — the core data shape for all components. */
export interface StageSnapshot {
  /** Internal stage identifier */
  stageName: string;
  /** Human-readable label */
  stageLabel: string;
  /** Unique per-execution-step identifier. Format: [subflowPath/]stageId#executionIndex. Key for recorder Map lookup. */
  runtimeStageId?: string;
  /** Accumulated memory state after this stage ran */
  memory: Record<string, unknown>;
  /** Narrative text describing what happened */
  narrative: string;
  /** When this stage started (ms from pipeline start) */
  startMs: number;
  /** How long this stage took (ms) */
  durationMs: number;
  /** Execution status */
  status?: "pending" | "active" | "done" | "error";
  /** Human-readable description of what this stage does */
  description?: string;
  /** Subflow identifier (when this stage is inside a subflow) */
  subflowId?: string;
  /** Subflow execution result — present on stages that ran a subflow. */
  subflowResult?: unknown;
}

/**
 * The narrative entry kinds this package renders with a badge of its own.
 * Closed on purpose: `StoryNarrative` keys its badge map by this union, so a
 * kind added here without a badge is a compile error.
 */
export type KnownNarrativeEntryType =
  | 'stage'
  | 'step'
  | 'condition'
  | 'fork'
  | 'selector'
  | 'subflow'
  | 'loop'
  | 'break'
  | 'error'
  | 'pause'
  | 'resume'
  | 'emit'
  /** One failed attempt at a stage that declares a `retry` policy — the
   *  stage is about to run again. Attempt telemetry, not an outcome: the
   *  stage may still succeed, so this is warning-weight, not error-weight.
   *  Emitted by footprintjs 9.15–10.0, nested inside its own stage; later
   *  releases narrate `attempt` lines instead. */
  | 'retry'
  /** One attempt of a stage that declares a `retry` policy — its outcome,
   *  how long it took, its cause and the retry-or-stop decision, one line per
   *  attempt. Emitted by footprintjs >= 10.1, nested inside its own stage
   *  (beneath the `error` line when the stage failed for good). */
  | 'attempt';

/**
 * A narrative entry's kind: one this package knows, or ANY other string.
 *
 * Open on purpose. footprintjs adds entry kinds in minor releases (`retry` in
 * 9.15, `attempt` in 10.1); while this type was a closed union, each addition
 * made every app that hands `executor.getNarrativeEntries()` to a component
 * here fail to compile. A kind this release does not know renders with a plain
 * generic badge and its text as written. `(string & {})` keeps editor
 * completion for the known kinds.
 */
export type NarrativeEntryType = KnownNarrativeEntryType | (string & {});

/** Structured narrative entry — preserves type info for semantic rendering. */
export interface NarrativeEntry {
  type: NarrativeEntryType;
  text: string;
  depth: number;
  stageName?: string;
  /** Stable stage identifier (matches spec node id). Primary key for UI sync. */
  stageId?: string;
  /** Unique per-execution-step identifier. Format: [subflowPath/]stageId#executionIndex.
   *  Used for exact time-travel sync (preferred over stageId for progressive reveal). */
  runtimeStageId?: string;
  /** Subflow ID when this entry was generated inside a subflow. */
  subflowId?: string;
  /** Direction for subflow entries: 'entry' when entering, 'exit' when leaving. */
  direction?: 'entry' | 'exit';
  stepNumber?: number;
  /** Scope key that was read or written. Only present on 'step' entries. */
  key?: string;
  /** Raw value from the scope event. Only present on 'step' entries. */
  rawValue?: unknown;
}

/** Component size variants */
export type Size = "compact" | "default" | "detailed";

/** Common props shared by all visualization components */
export interface BaseComponentProps {
  /** Size variant */
  size?: Size;
  /** Strip all built-in styles — bring your own */
  unstyled?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}
