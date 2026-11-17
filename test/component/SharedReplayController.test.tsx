/** @vitest-environment jsdom */
import { useRef, useState } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimeTravelRail } from '../../src/components/TimeTravelControls/TimeTravelControls';
import { useTimeTravelPlayback } from '../../src/replay/useTimeTravelPlayback';
import type { StageSnapshot } from '../../src/types';

const snapshots: StageSnapshot[] = ['Seed', 'Load', 'Total'].map((name, index) => ({
  stageName: name, stageLabel: name, runtimeStageId: `${name}#${index}`, memory: {}, narrative: '', startMs: index, durationMs: 1,
}));

describe('stock rail with one external replay controller', () => {
  afterEach(() => { vi.useRealTimers(); });
  it('shares Play/Pause, programmatic stop and the existing clock with its host', () => {
    vi.useFakeTimers();
    function Host() {
      const [selectedIndex, onIndexChange] = useState(0), offered = useRef<unknown>(undefined);
      const props = { snapshots, selectedIndex, onIndexChange, offered,
        replayControls: { presentation: 'range' as const, intervalMs: 500 } };
      const playback = useTimeTravelPlayback(props);
      return <><button onClick={playback.togglePlay}>Host play</button><button onClick={playback.stopPlaying}>Host stop</button>
        <output aria-label="Host cursor">{selectedIndex}</output><output aria-label="Host playback">{playback.playing ? 'playing' : 'paused'}</output>
        <TimeTravelRail {...props} playback={playback} /></>;
    }
    const view = render(<Host />);
    fireEvent.click(view.getByRole('button', { name: 'Host play' }));
    expect(view.getByRole('button', { name: 'Pause' })).toBeTruthy();
    expect(vi.getTimerCount()).toBe(1);
    act(() => { vi.advanceTimersByTime(500); });
    expect(view.getByLabelText('Host cursor').textContent).toBe('1');
    expect((view.getByRole('slider') as HTMLInputElement).value).toBe('1');
    fireEvent.click(view.getByRole('button', { name: 'Pause' }));
    expect(view.getByLabelText('Host playback').textContent).toBe('paused'); expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(view.getByRole('button', { name: 'Play' }));
    expect(view.getByLabelText('Host playback').textContent).toBe('playing'); expect(vi.getTimerCount()).toBe(1);
    fireEvent.click(view.getByRole('button', { name: 'Host stop' }));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(view.getByLabelText('Host cursor').textContent).toBe('1'); expect(vi.getTimerCount()).toBe(0);
  });
});
