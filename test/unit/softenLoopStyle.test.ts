/**
 * softenLoopStyle — the loop-back "soft return" styling.
 *
 * A loop-back runs the full chart height down the right margin; a solid
 * full-weight line reads as a wall. softenLoopStyle dashes it and caps its
 * opacity so it registers as a soft "control returns to the top" path, while
 * letting the renderer's color/state (and any further dimming) flow through.
 */
import { describe, expect, it } from 'vitest';
import { softenLoopStyle } from '../../src/components/LoopBackEdge/LoopBackEdge';

describe('softenLoopStyle', () => {
  it('adds a dash when none is supplied', () => {
    expect(softenLoopStyle({ stroke: '#abc' }).strokeDasharray).toBe('5 5');
  });

  it('respects a caller-supplied dash (does not override)', () => {
    expect(softenLoopStyle({ strokeDasharray: '2 2' }).strokeDasharray).toBe('2 2');
  });

  it('caps strokeOpacity at the soft cap (0.55) so the loop never reads as a hard wall', () => {
    expect(softenLoopStyle({ strokeOpacity: 1 }).strokeOpacity).toBe(0.55);
    expect(softenLoopStyle(undefined).strokeOpacity).toBe(0.55);
  });

  it('lets the edge dim FURTHER than the cap when out of scrub scope', () => {
    expect(softenLoopStyle({ strokeOpacity: 0.3 }).strokeOpacity).toBe(0.3);
  });

  it('thins the stroke (1.5) so the long return is lighter than a spine edge', () => {
    expect(softenLoopStyle({ strokeWidth: 2 }).strokeWidth).toBe(1.5);
  });

  it('preserves the renderer-supplied stroke color/state', () => {
    expect(softenLoopStyle({ stroke: '#ff0', strokeWidth: 2 }).stroke).toBe('#ff0');
  });
});
