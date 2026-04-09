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

/** Structured narrative entry — preserves type info for semantic rendering. */
export interface NarrativeEntry {
  type: 'stage' | 'step' | 'condition' | 'fork' | 'selector' | 'subflow' | 'loop' | 'break' | 'error' | 'pause' | 'resume';
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
