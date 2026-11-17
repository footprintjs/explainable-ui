import { describe, expect, it } from 'vitest';
import { projectReplayAxis, type ReplayAxisStage } from './replayAxis';

const stages = (...durationMs: unknown[]): ReplayAxisStage[] => durationMs.map(durationMs => ({ durationMs }));

describe('recorded replay axis geometry', () => {
  it('creates and navigates the default axis without reading stage timing until arrays are requested', () => {
    let reads = 0;
    const input = stages(2, 10, 100).map(stage => new Proxy(stage, {
      getOwnPropertyDescriptor(target, key) { reads++; return Reflect.getOwnPropertyDescriptor(target, key); },
    }));
    const axis = projectReplayAxis(input);
    expect(axis.scale).toBe('steps');
    expect(axis.availability).toBe('equal');
    expect(axis.firstCenter).toBeCloseTo(1 / 6);
    expect(axis.lastCenter).toBeCloseTo(5 / 6);
    expect(axis.indexAt(0)).toBe(0);
    expect(axis.indexAt(0.25)).toBe(0);
    expect(axis.indexAt(0.25 + 1e-12)).toBe(1);
    expect(axis.indexAt(1)).toBe(2);
    expect(axis.positionAt(1)).toBe(0.5);
    expect(axis.positionAt(-1)).toBeUndefined();
    expect(reads).toBe(0);
    expect(projectReplayAxis(input)).toBe(axis);
    expect(axis.durations).toEqual([2, 10, 100]);
    expect(reads).toBe(3);
    expect(axis.durations).toBe(axis.durations);
    expect(axis.positions).toEqual([0, 0.5, 1]);
    expect(axis.positiveDurationCount).toBe(3);
    expect(reads).toBe(3);
    for (const value of [axis, axis.durations, axis.weights, axis.centers, axis.positions]) expect(Object.isFrozen(value)).toBe(true);
  });

  it('preserves equal-step default geometry and aligns segment centers with native positions', () => {
    const axis = projectReplayAxis(stages(1, 1000, 5));
    expect(axis.availability).toBe('equal');
    expect(axis.weights).toEqual([1, 1, 1]);
    expect(axis.positions).toEqual([0, 0.5, 1]);
    expect(axis.centers[0]).toBeCloseTo(1 / 6);
    expect(axis.centers[2]).toBeCloseTo(5 / 6);
    axis.positions.forEach((position, index) => {
      expect(axis.firstCenter + position * (axis.lastCenter - axis.firstCenter)).toBeCloseTo(axis.centers[index]);
      expect(axis.indexAt(position)).toBe(index);
    });
  });

  it('uses recorded duration ratios and logarithmic compression without changing stage indexes', () => {
    const input = stages(1, 9, 999);
    const duration = projectReplayAxis(input, 'duration'), log = projectReplayAxis(input, 'log-duration');
    expect(duration.weights[1] / duration.weights[0]).toBeCloseTo(9);
    expect(log.weights[1] / log.weights[0]).toBeCloseTo(Math.log1p(9) / Math.log1p(1));
    expect(log.weights[2] / log.weights[0]).toBeLessThan(duration.weights[2] / duration.weights[0]);
    expect(log.availability).toBe('recorded');
    log.positions.forEach((position, index) => {
      expect(log.indexAt(position)).toBe(index);
      expect(log.firstCenter + position * (log.lastCenter - log.firstCenter)).toBeCloseTo(log.centers[index]);
    });
  });

  it('discloses ambiguous zeros and unavailable durations while retaining selectable stages', () => {
    let calls = 0;
    const accessor = Object.defineProperty({}, 'durationMs', { get() { calls++; return 500; } });
    const axis = projectReplayAxis([...stages(100, 0, -1, NaN, Infinity, undefined, '10'), accessor], 'log-duration');
    expect(axis.availability).toBe('partial');
    expect(axis.positiveDurationCount).toBe(1);
    expect(axis.zeroDurationCount).toBe(1);
    expect(axis.unavailableDurationCount).toBe(6);
    expect(axis.clampedWeightCount).toBe(7);
    expect(calls).toBe(0);
    expect(axis.weights.every(weight => Number.isFinite(weight) && weight > 0)).toBe(true);
    expect(projectReplayAxis(stages(100, 0), 'duration').availability).toBe('partial');
  });

  it('shares admitted own-data durations with labels without invoking own or inherited getters', () => {
    let calls = 0;
    const inherited = Object.create({ get durationMs() { calls++; return 50; } });
    const accessor = Object.defineProperty({}, 'durationMs', { get() { calls++; return 100; } });
    const axis = projectReplayAxis([...stages(12, 0), inherited, accessor], 'log-duration');
    expect(axis.durations).toEqual([12, 0, undefined, undefined]);
    expect(axis.durations[0]).toBe(12);
    expect(calls).toBe(0);
    expect(Object.isFrozen(axis.durations)).toBe(true);
  });

  it.each(['duration', 'log-duration'] as const)('falls back honestly when %s has no positive recorded timing', scale => {
    const axis = projectReplayAxis(stages(0, -0, null, -10, Infinity), scale);
    expect(axis.availability).toBe('fallback');
    expect(axis.fallbackReason).toBe('no-positive-duration');
    expect(axis.zeroDurationCount).toBe(2);
    expect(axis.unavailableDurationCount).toBe(3);
    expect(axis.weights).toEqual([1, 1, 1, 1, 1]);
    expect(axis.positions).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(axis.clampedWeightCount).toBe(0);
  });

  it.each(['duration', 'log-duration'] as const)('keeps finite monotone geometry for %s across finite timing extremes', scale => {
    const axis = projectReplayAxis(stages(Number.MIN_VALUE, 0, Number.MAX_VALUE, 1, 1e200), scale);
    expect(axis.positiveDurationCount).toBe(4);
    for (let index = 0; index < axis.weights.length; index++) {
      expect(Number.isFinite(axis.weights[index])).toBe(true);
      expect(axis.weights[index]).toBeGreaterThan(0);
      expect(axis.weights[index]).toBeLessThanOrEqual(1);
      expect(Number.isFinite(axis.positions[index])).toBe(true);
      if (index) expect(axis.positions[index]).toBeGreaterThan(axis.positions[index - 1]);
      expect(axis.indexAt(axis.positions[index])).toBe(index);
    }
    expect(axis.positions[0]).toBe(0);
    expect(axis.positions.at(-1)).toBe(1);
  });

  it.each(['duration', 'log-duration'] as const)('hit-tests painted segment boundaries for unequal %s weights', scale => {
    const durations = [1, 9, 90];
    const axis = projectReplayAxis(stages(...durations), scale);
    const amounts = scale === 'duration' ? durations : durations.map(value => Math.log1p(value));
    const total = amounts.reduce((sum, value) => sum + value, 0);
    const first = amounts[0] / (2 * total), last = 1 - amounts.at(-1)! / (2 * total);
    for (let index = 0; index < amounts.length - 1; index++) {
      const fullBoundary = amounts.slice(0, index + 1).reduce((sum, value) => sum + value, 0) / total;
      const inputBoundary = (fullBoundary - first) / (last - first);
      expect(axis.indexAt(inputBoundary - 1e-10)).toBe(index);
      expect(axis.indexAt(inputBoundary + 1e-10)).toBe(index + 1);
    }
  });

  it('keeps equal-step midpoint ties on the earlier stage and clamps axis ends', () => {
    const axis = projectReplayAxis(stages(8, 1, 100, 3, 5), 'steps');
    for (let index = 0; index < axis.positions.length - 1; index++) {
      const middle = (axis.positions[index] + axis.positions[index + 1]) / 2;
      expect(axis.indexAt(middle)).toBe(index);
      expect(axis.indexAt(middle - 1e-12)).toBe(index);
      expect(axis.indexAt(middle + 1e-12)).toBe(index + 1);
    }
    expect(axis.indexAt(-Infinity)).toBe(0);
    expect(axis.indexAt(Infinity)).toBe(4);
    expect(axis.indexAt(NaN)).toBe(-1);
    expect(axis.positionAt(-1)).toBeUndefined();
    expect(axis.positionAt(1.5)).toBeUndefined();
    expect(axis.positionAt(5)).toBeUndefined();
  });

  it('assigns an exact painted weighted boundary to the earlier segment', () => {
    const axis = projectReplayAxis(stages(1, 3, 1), 'duration');
    expect(axis.indexAt(0.125)).toBe(0);
    expect(axis.indexAt(0.125 + 1e-12)).toBe(1);
    expect(axis.indexAt(0.875)).toBe(1);
    expect(axis.indexAt(0.875 + 1e-12)).toBe(2);
  });

  it('retains a visible relative floor for zero timing beside a measured stage', () => {
    const axis = projectReplayAxis(stages(0, 64, 0), 'log-duration');
    expect(axis.weights).toEqual([0.01, 1, 0.01]);
    expect(axis.availability).toBe('partial');
    expect(axis.clampedWeightCount).toBe(2);
  });

  it('has explicit empty/single-stage behavior without NaN geometry', () => {
    const empty = projectReplayAxis([], 'log-duration');
    expect(empty.positions).toEqual([]);
    expect(empty.firstCenter).toBe(0);
    expect(empty.lastCenter).toBe(0);
    expect(empty.indexAt(0.4)).toBe(-1);
    const single = projectReplayAxis(stages(0), 'log-duration');
    expect(single.positions).toEqual([0]);
    expect(single.centers).toEqual([0.5]);
    expect(single.indexAt(1)).toBe(0);
    expect(single.positionAt(0)).toBe(0);
  });

  it('reuses immutable projections by reference/scale and permits live append without owning selection', () => {
    const initial = Object.freeze(stages(2, 10, 100));
    const before = projectReplayAxis(initial, 'log-duration');
    const semanticIndex = 1;
    expect(projectReplayAxis(initial, 'log-duration')).toBe(before);
    expect(projectReplayAxis(initial, 'steps')).not.toBe(before);
    const updated = Object.freeze([...initial, { durationMs: 50 }]);
    const after = projectReplayAxis(updated, 'log-duration');
    expect(after).not.toBe(before);
    expect(before.positions).toHaveLength(3);
    expect(after.positions).toHaveLength(4);
    expect(after.indexAt(after.positionAt(semanticIndex)!)).toBe(semanticIndex);
    for (const value of [before, before.durations, before.weights, before.centers, before.positions]) expect(Object.isFrozen(value)).toBe(true);
  });
});
