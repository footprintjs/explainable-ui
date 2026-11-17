/** A recorded-duration axis is presentation geometry, never another replay cursor. */
export type ReplayAxisScale = 'steps' | 'duration' | 'log-duration';
export interface ReplayAxisStage { readonly durationMs?: unknown }
export interface ReplayAxis {
  readonly scale: ReplayAxisScale;
  readonly availability: 'equal' | 'recorded' | 'partial' | 'fallback';
  readonly fallbackReason?: 'no-positive-duration';
  readonly positiveDurationCount: number;
  /** A zero may be recorded or an adapter's missing-timing default; it proves neither. */
  readonly zeroDurationCount: number;
  readonly unavailableDurationCount: number;
  /** Weights below the geometric floor are raised only to retain selectable stages. */
  readonly clampedWeightCount: number;
  /** Admitted own-data milliseconds, shared by geometry and presentation labels. Zero remains ambiguous. */
  readonly durations: readonly (number | undefined)[];
  /** Positive relative flex weights, bounded to [0.000001, 1]. */
  readonly weights: readonly number[];
  /** Centers within the full weighted segmented bar, including its end half-segments. */
  readonly centers: readonly number[];
  /** Centers rescaled from first..last to 0..1 for the native input's coordinate range. */
  readonly positions: readonly number[];
  readonly firstCenter: number;
  readonly lastCenter: number;
  /** Painted segment at a normalized input coordinate; boundary ties choose the earlier stage. */
  indexAt(position: number): number;
  /** Invalid semantic indexes have no coordinate. */
  positionAt(index: number): number | undefined;
}

const MIN_WEIGHT = 1e-6;
// Untimed stages need a usable destination without pretending that width was measured.
const UNAVAILABLE_WEIGHT = 0.01;
const cache = new WeakMap<readonly ReplayAxisStage[], Map<ReplayAxisScale, ReplayAxis>>();

function durationOf(stage: ReplayAxisStage): number | undefined {
  if (!stage || typeof stage !== 'object') return undefined;
  try {
    const field = Object.getOwnPropertyDescriptor(stage, 'durationMs');
    if (!field || !('value' in field)) return undefined;
    const value: unknown = field.value;
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
  } catch { return undefined; }
}

/**
 * Default steps creation/navigation is O(1); its array/metrics views materialize lazily.
 * Weighted axes are O(n) once per immutable snapshots reference/scale, then O(log n) lookup.
 * A live update supplies a new array and gets a new axis. Never mutate a cached input.
 * Logarithmic weights use log1p(recorded milliseconds), preserving small positive times.
 */
export function projectReplayAxis(snapshots: readonly ReplayAxisStage[], scale: ReplayAxisScale = 'steps'): ReplayAxis {
  const prior = cache.get(snapshots)?.get(scale);
  if (prior) return prior;
  const axis = scale === 'steps' ? createStepAxis(snapshots) : buildReplayAxis(snapshots, scale);
  const projections = cache.get(snapshots) ?? new Map<ReplayAxisScale, ReplayAxis>();
  projections.set(scale, axis);
  cache.set(snapshots, projections);
  return axis;
}

function createStepAxis(snapshots: readonly ReplayAxisStage[]): ReplayAxis {
  const total = snapshots.length;
  let materialized: ReplayAxis | undefined;
  const full = () => materialized ??= buildReplayAxis(snapshots, 'steps');
  return Object.freeze({
    scale: 'steps' as const,
    availability: 'equal' as const,
    clampedWeightCount: 0,
    firstCenter: total ? 1 / (2 * total) : 0,
    lastCenter: total ? (total - 0.5) / total : 0,
    get positiveDurationCount() { return full().positiveDurationCount; },
    get zeroDurationCount() { return full().zeroDurationCount; },
    get unavailableDurationCount() { return full().unavailableDurationCount; },
    get durations() { return full().durations; },
    get weights() { return full().weights; },
    get centers() { return full().centers; },
    get positions() { return full().positions; },
    indexAt(position: number) {
      if (!total || Number.isNaN(position)) return -1;
      const coordinate = Math.max(0, Math.min(position, 1));
      // Equal painted edges are halfway between discrete step positions.
      return Math.max(0, Math.min(total - 1,
        Math.ceil((coordinate - Number.EPSILON * 4) * (total - 1) - 0.5)));
    },
    positionAt(index: number) {
      return Number.isSafeInteger(index) && index >= 0 && index < total
        ? total < 2 ? 0 : index / (total - 1) : undefined;
    },
  });
}

function buildReplayAxis(snapshots: readonly ReplayAxisStage[], scale: ReplayAxisScale): ReplayAxis {
  let positiveDurationCount = 0, zeroDurationCount = 0, unavailableDurationCount = 0;
  let maximum = 0;
  const durations = Object.freeze(snapshots.map(durationOf));
  const values = durations.map(duration => {
    if (duration === undefined) unavailableDurationCount++;
    else if (duration === 0) zeroDurationCount++;
    else positiveDurationCount++;
    const value = duration === undefined ? 0 : scale === 'log-duration' ? Math.log1p(duration) : duration;
    maximum = Math.max(maximum, value);
    return value;
  });
  const fallback = scale !== 'steps' && positiveDurationCount === 0;
  let clampedWeightCount = 0;
  const weights = Object.freeze(values.map(value => {
    if (scale === 'steps' || fallback) return 1;
    const relative = value / maximum;
    const minimum = value === 0 ? UNAVAILABLE_WEIGHT : MIN_WEIGHT;
    if (relative < minimum) clampedWeightCount++;
    return Math.max(minimum, relative);
  }));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let prefix = 0;
  const ends: number[] = [];
  const centers = Object.freeze(weights.map(weight => {
    const center = (prefix + weight / 2) / total;
    prefix += weight;
    ends.push(prefix / total);
    return center;
  }));
  const firstCenter = centers[0] ?? 0, lastCenter = centers.at(-1) ?? 0;
  const span = lastCenter - firstCenter;
  const positions = Object.freeze(centers.map((center, index) => index === 0 ? 0
    : scale === 'steps' || fallback ? index / (centers.length - 1)
      : index === centers.length - 1 ? 1 : (center - firstCenter) / span));
  // Normalize painted edges once instead of round-tripping each input through
  // full-bar coordinates. Selection below tolerates arithmetic boundary rounding.
  const boundaries = Object.freeze(ends.slice(0, -1).map((end, index) => scale === 'steps' || fallback
    ? (index + 0.5) / (centers.length - 1) : (end - firstCenter) / span));
  const axis: ReplayAxis = Object.freeze({
    scale,
    availability: scale === 'steps' ? 'equal' : fallback ? 'fallback'
      : unavailableDurationCount || zeroDurationCount ? 'partial' : 'recorded',
    ...(fallback ? { fallbackReason: 'no-positive-duration' as const } : {}),
    positiveDurationCount, zeroDurationCount, unavailableDurationCount, clampedWeightCount,
    durations, weights, centers, positions, firstCenter, lastCenter,
    indexAt(position: number) {
      if (!positions.length || Number.isNaN(position)) return -1;
      const coordinate = Math.max(0, Math.min(position, 1));
      let low = 0, high = positions.length - 1;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (coordinate - boundaries[middle] > Number.EPSILON * 4) low = middle + 1;
        else high = middle;
      }
      return low;
    },
    positionAt(index: number) { return Number.isSafeInteger(index) ? positions[index] : undefined; },
  });
  return axis;
}
