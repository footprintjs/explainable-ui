/** @vitest-environment jsdom */
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { createEvent, fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TimeTravelControls, type ReplayControlsOptions } from '../../src/components/TimeTravelControls';
import { FootprintTheme } from '../../src/theme';
import type { StageSnapshot } from '../../src/types';

const snapshots = (length: number): StageSnapshot[] => Array.from({ length }, (_, index) => ({
  runtimeStageId: `stage#${index}`, stageName: `Stage ${index}`, stageLabel: `Stage ${index}`,
  startMs: index * 100, durationMs: index ? 3 : 100, memory: {}, narrative: '',
}));
// Runtime input allows the old parent to reach the genuine rendering assertions.
const range = { presentation: 'range' } as unknown as ReplayControlsOptions;

describe('normal range replay presentation', () => {
  it.each([false, true])('renders one visible range and no per-stage tick DOM; unstyled=%s', unstyled => {
    const view = render(<TimeTravelControls snapshots={snapshots(7)} selectedIndex={2} onIndexChange={vi.fn()}
      replayControls={range} unstyled={unstyled} />);
    const slider = view.getByRole('slider', { name: 'Replay position' }) as HTMLInputElement;
    expect(view.container.querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(0);
    expect(view.container.querySelector('[data-fp="tt-ticks"]')).toBeNull();
    expect(slider.style.opacity).not.toBe('0');
    expect(slider.min).toBe('0'); expect(slider.max).toBe('6'); expect(slider.step).toBe('1');
    expect(slider.getAttribute('aria-valuetext')).toBe('Step 3 of 7: Stage 2');
    if (unstyled) expect(view.container.querySelector('[style]')).toBeNull();
  });

  it('keeps the range DOM count constant as the recorded stage count grows', () => {
    const change = vi.fn();
    const view = render(<TimeTravelControls snapshots={snapshots(4)} selectedIndex={1} onIndexChange={change} replayControls={range} />);
    const count = view.container.querySelectorAll('*').length;
    view.rerender(<TimeTravelControls snapshots={snapshots(400)} selectedIndex={1} onIndexChange={change} replayControls={range} />);
    expect(view.container.querySelectorAll('*')).toHaveLength(count);
    expect(view.container.querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(0);
    expect((view.getByRole('slider') as HTMLInputElement).max).toBe('399');
  });

  it('preserves the segmented default and accepts independent visibility settings', () => {
    const values = snapshots(5), change = vi.fn();
    const view = render(<TimeTravelControls snapshots={values} selectedIndex={1} onIndexChange={change} />);
    expect(view.container.querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(5);
    view.rerender(<TimeTravelControls snapshots={values} selectedIndex={1} onIndexChange={change}
      replayControls={{ ...range, previousNext: false, playPause: false }} />);
    expect(view.queryByRole('button', { name: 'Previous stage' })).toBeNull();
    expect(view.queryByRole('button', { name: 'Play' })).toBeNull();
    fireEvent.change(view.getByRole('slider'), { target: { value: '4' } });
    expect(change).toHaveBeenLastCalledWith(4);
    view.rerender(<TimeTravelControls snapshots={values} selectedIndex={1} onIndexChange={change}
      replayControls={{ ...range, slider: false }} />);
    expect(view.queryByRole('slider')).toBeNull();
    expect(view.getByRole('button', { name: 'Previous stage' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Play' })).toBeTruthy();
  });

  it('uses the same controlled cursor and native keyboard event once through a themed Input adapter', () => {
    const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => <input {...props} ref={ref} data-host-range="true" />);
    function Host() {
      const [selected, select] = useState(1);
      return <TimeTravelControls snapshots={snapshots(5)} selectedIndex={selected} onIndexChange={select} replayControls={range} />;
    }
    const view = render(<FootprintTheme components={{ Input }}><Host /></FootprintTheme>);
    const slider = view.getByRole('slider') as HTMLInputElement;
    expect(slider.dataset.hostRange).toBe('true'); expect(slider.dataset.fpPart).toBe('time-travel-slider');
    expect(slider.style.opacity).not.toBe('0');
    const key = createEvent.keyDown(slider, { key: 'ArrowRight', bubbles: true, cancelable: true });
    fireEvent(slider, key); expect(key.defaultPrevented).toBe(false); expect(slider.value).toBe('1');
    fireEvent.change(slider, { target: { value: '2' } });
    expect(slider.value).toBe('2'); expect(slider.getAttribute('aria-valuetext')).toBe('Step 3 of 5: Stage 2');
  });

  it('retains Backtrack stop snapping, sparse keyboard movement, previous/next and Return', () => {
    const change = vi.fn(), exit = vi.fn();
    const view = render(<TimeTravelControls snapshots={snapshots(7)} selectedIndex={1} onIndexChange={change} replayControls={range}
      tracing={{ tracedKey: 'total', stopIndices: [1, 6], stopOrdinal: 2, totalStops: 2, onExit: exit }} />);
    const slider = view.getByRole('slider', { name: 'Trace position' });
    expect(view.container.querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(0);
    fireEvent.change(slider, { target: { value: '3' } }); expect(change).toHaveBeenLastCalledWith(1);
    change.mockClear(); fireEvent.keyDown(slider, { key: 'ArrowRight' }); fireEvent.change(slider, { target: { value: '2' } });
    expect(change).toHaveBeenCalledExactlyOnceWith(6); fireEvent.keyUp(slider, { key: 'ArrowRight' });
    fireEvent.click(view.getByRole('button', { name: 'Later recorded step' })); expect(change).toHaveBeenLastCalledWith(6);
    fireEvent.keyDown(slider, { key: 'Escape' }); expect(exit).toHaveBeenCalledOnce();
    fireEvent.click(view.getByRole('button', { name: 'Exit tracing' })); expect(exit).toHaveBeenCalledTimes(2);
  });

  it('keeps the trace exit reachable with all transport options hidden', () => {
    const exit = vi.fn(), view = render(<TimeTravelControls snapshots={snapshots(3)} selectedIndex={1} onIndexChange={vi.fn()}
      replayControls={{ ...range, previousNext: false, playPause: false, slider: false }}
      tracing={{ tracedKey: 'total', stopIndices: [1], stopOrdinal: 1, totalStops: 1, onExit: exit }} />);
    expect(view.queryByRole('slider')).toBeNull(); expect(view.container.querySelector('[data-fp="tt-tick"]')).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'Exit tracing' })); expect(exit).toHaveBeenCalledOnce();
  });
});
