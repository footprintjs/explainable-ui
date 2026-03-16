/** Snapshot of a single pipeline stage — the core data shape for all components. */
export interface StageSnapshot {
  /** Internal stage identifier */
  stageName: string;
  /** Human-readable label */
  stageLabel: string;
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
  type: 'stage' | 'step' | 'condition' | 'fork' | 'subflow' | 'loop' | 'break' | 'error';
  text: string;
  depth: number;
  stageName?: string;
  stepNumber?: number;
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
