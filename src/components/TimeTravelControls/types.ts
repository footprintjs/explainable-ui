import type { StageSnapshot, BaseComponentProps } from "../../types";

import type { ReplayControlsOptions, TracingRail } from '../../model/replayControls';
export type { ReplayControlsOptions, TracingRail } from '../../model/replayControls';

export interface TimeTravelControlsProps extends BaseComponentProps {
  /** Stage snapshots */
  snapshots: StageSnapshot[];
  /** Currently selected stage index */
  selectedIndex: number;
  /** Callback when selected index changes */
  onIndexChange: (index: number) => void;
  /** Enable auto-play with Gantt-proportional timing */
  autoPlayable?: boolean;
  /** Same-Rail Rewind session — when set, the rail is in tracing mode. */
  tracing?: TracingRail | null;
  /**
   * Play the recording by itself, once: the cursor goes to the first stage and
   * walks to the last on the Play loop, then stops. Pause, scrubbing, arrow
   * keys, space, or any other move of the cursor stop it for good. It does not
   * start under `prefers-reduced-motion: reduce`, with `autoPlayable={false}`,
   * in tracing mode, or with fewer than two stages. Default false.
   */
  autoPlay?: boolean;
  /**
   * What counts as a new recording for `autoPlay`. Default: the `snapshots`
   * array itself, so keep it stable across renders or pass a run id here.
   */
  autoPlayKey?: unknown;
  /** Optional transport visibility and readable replay pacing over the same cursor. */
  replayControls?: ReplayControlsOptions;
}

