/**
 * Same-Rail Rewind (tracing mode) — the rail's AXIS never changes, only its
 * stops do: every dependency was committed earlier than the value it fed, so
 * a backward slice is a sub-sequence of this same timeline. When `tracing`
 * is set, slice members stay landable ("stops"), everything else fades to
 * unlandable ticks, and prev/next walk stop-to-stop ("◀ earlier recorded step").
 * The cursor stays the ONE `selectedIndex` — no second position exists.
 *
 * THEMING: tracing mode recolors its chrome with ONE token, `--fp-tracing`
 * (default #0d9488 teal) — the TRACING badge, the rail's bottom border, the
 * stop ticks, the walk buttons, and Done — so the tracing rail is
 * unmistakably not normal time-travel. Consumers retheme by setting
 * `--fp-tracing` on any ancestor. Normal mode never reads the token.
 */
export interface TracingRail {
  /** The traced variable — rendered in the mode header. */
  tracedKey: string;
  /** Set while an ingredient filter is active ("▸ via key"). */
  viaKey?: string | null;
  /** Snapshot indices that are stops, ASCENDING. All other ticks become
   *  faint and unlandable (context, not destinations). */
  stopIndices: number[];
  /** 1-based position of the cursor in WALK order (newest first) + total —
   *  the "stop 2 of 6" label. */
  stopOrdinal: number;
  totalStops: number;
  /** Exit tracing (button / Escape). The host decides where to return. */
  onExit: () => void;
  /** Optional return destination; defaults to the legacy Done label. */
  exitLabel?: string;
  /** Accessible return action; defaults to Exit tracing. */
  exitAriaLabel?: string;
  /** Clear the via filter back to the full walk (breadcrumb's "show all"). */
  onShowAll?: () => void;
  /** Ingredient count at the CURRENT stop. At the earliest landable stop,
   *  >= 2 together with `onForkPrompt` offers "choose cause…" instead of a
   *  disabled button. Earlier recorded steps otherwise remain reachable in
   *  time order; following a particular input is a separate action. */
  forkCount?: number;
  /** Open the fork chooser at the earliest landable stop when `forkCount >= 2`
   *  (click or ArrowLeft on the walk-back control). */
  onForkPrompt?: () => void;
}

export interface ReplayControlsOptions {
  /** Native thumb or per-stage segments over the same discrete cursor. Default segmented. */
  presentation?: 'segmented' | 'range';
  /** Segment spacing by step, recorded duration, or log1p(duration in ms). Default steps.
   * This changes geometry, never playback pace or the selected recorded step. */
  scale?: 'steps' | 'duration' | 'log-duration';
  /** Show previous/next actions and enable their toolbar arrow shortcuts. Default true. */
  previousNext?: boolean;
  /** Show Play/Pause and allow manual or automatic playback. Default true. */
  playPause?: boolean;
  /** Show the position rail and its native range scrubbing control. Default true. */
  slider?: boolean;
  /** Fixed milliseconds per replay step, clamped to 200–10,000. Omit for proportional timing. */
  intervalMs?: number;
}

