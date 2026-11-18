import { useMemo } from "react";
import type { Stop } from "foottrace";
import { ReplayPosition } from "../replay/ReplayPosition";
import type { ReplayAxisScale } from "../replay/replayAxis";

export interface RecordTimeSliderProps<TMeta = unknown> {
  /** The complete ordered stops of one Foottrace cursor. Replace on source revision. */
  readonly stops: readonly Stop<TMeta>[];
  /** The host's zero-based canonical stop, shared with the reader and diagram. */
  readonly step: number;
  readonly onStepChange: (step: number) => void;
  readonly scale?: ReplayAxisScale;
  readonly presentation?: "range" | "segmented";
  /** Measured milliseconds for this stop. Replace the callback when its timing data changes. */
  readonly durationForStop?: (stop: Stop<TMeta>) => number | undefined;
  readonly "aria-label"?: string;
}

/** A controlled transport over one source. Scrubbing requests a stop without replaying the producer. */
export function RecordTimeSlider<TMeta = unknown>({
  stops, step, onStepChange, scale = "steps", presentation = "range",
  durationForStop, "aria-label": ariaLabel = "Recorded stop",
}: RecordTimeSliderProps<TMeta>) {
  const weighted = scale !== "steps";
  const timing = weighted ? durationForStop : undefined;
  const positions = useMemo(
    () => weighted ? stops.map(stop => ({ label: stop.label, durationMs: timing?.(stop) })) : stops,
    [stops, timing, weighted],
  );
  if (stops.length ? stops[step]?.step !== step : step !== 0) {
    return <span role="alert">The selected stop is outside this recording.</span>;
  }
  return <ReplayPosition snapshots={positions} selectedIndex={step} selectIndex={onStepChange}
    presentation={presentation} scale={scale} tracing={null} stopSet={null}
    size="default" unstyled={false} ariaLabel={ariaLabel} />;
}
