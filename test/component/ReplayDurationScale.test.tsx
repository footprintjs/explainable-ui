/** @vitest-environment jsdom */
import * as React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TimeTravelControls } from '../../src';
import type { StageSnapshot } from '../../src';
afterEach(cleanup);
const stages: StageSnapshot[] = [1, 9, 99].map((durationMs, index) => ({ stageName: `stage-${index}`, stageLabel: `Stage ${index}`, runtimeStageId: `stage-${index}#${index}`, startMs: 0, durationMs, memory: {}, narrative: '' }));
function Controlled({ tracing = false, unstyled = false, snapshots = stages, presentation = 'segmented' }: { tracing?: boolean; unstyled?: boolean; snapshots?: StageSnapshot[]; presentation?: 'range' | 'segmented' }) {
  const [index, select] = React.useState(0);
  return <><output>{index}</output><TimeTravelControls snapshots={snapshots} selectedIndex={index} onIndexChange={select} unstyled={unstyled}
    replayControls={{ scale: 'log-duration', presentation }} tracing={tracing ? { tracedKey: 'amount', stopIndices: [0, 2], stopOrdinal: index === 0 ? 2 : 1, totalStops: 2, onExit() {} } : null} /></>;
}
it('uses logarithmic duration widths and the same axis for pointer selection', () => {
  const { container } = render(<Controlled />);
  const ticks = [...container.querySelectorAll<HTMLElement>('[data-fp="tt-tick"]')];
  const weights = ticks.map(tick => Number(tick.style.flexGrow || tick.style.flex.split(' ')[0]));
  expect(weights[2] / weights[1]).toBeCloseTo(2, 8);
  expect(weights[1] / weights[0]).toBeCloseTo(Math.log(10) / Math.log(2), 8);
  const range = screen.getByRole('slider', { name: 'Replay position' });
  fireEvent.change(range, { target: { value: '0.4' } });
  expect(screen.getByRole('status').textContent).toBe('1');
  expect(range.getAttribute('aria-valuetext')).toContain('9 ms');
  expect(screen.getByText(/Logarithmic recorded duration/)).toBeTruthy();
});
it.each([false, true])('keyboard walks exact trace stops on a duration axis, unstyled=%s', unstyled => {
  render(<Controlled tracing unstyled={unstyled} />);
  const range = screen.getByRole('slider', { name: 'Trace position' });
  fireEvent.keyDown(range, { key: 'ArrowRight' });
  expect(screen.getByRole('status').textContent).toBe('2');
  fireEvent.keyDown(range, { key: 'ArrowLeft' });
  expect(screen.getByRole('status').textContent).toBe('0');
});
it('falls back honestly for untimed recordings and range mode keeps no per-stage DOM', () => {
  const { container } = render(<Controlled presentation="range" snapshots={stages.map(stage => ({ ...stage, durationMs: 0 }))} />);
  expect(container.querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(0);
  expect(screen.getByText(/No positive timing recorded/)).toBeTruthy();
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).not.toContain('0 ms');
});
it('keeps an empty live range controlled when its first recorded stages arrive', () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const view = render(<Controlled snapshots={[]} presentation="range" />);
    expect(screen.getByRole('slider').getAttribute('value')).toBe('0');
    view.rerender(<Controlled snapshots={stages} presentation="range" />);
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/uncontrolled|controlled/i);
  } finally { errors.mockRestore(); }
});
it('never invokes an unavailable timing accessor while drawing labels', () => {
  const getter = vi.fn(() => 999);
  const unsafe = { ...stages[0] };
  Object.defineProperty(unsafe, 'durationMs', { get: getter, enumerable: true });
  render(<Controlled snapshots={[unsafe, stages[1]]} />);
  expect(getter).not.toHaveBeenCalled();
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toContain('zero or unavailable timing');
});
