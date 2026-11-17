/** @vitest-environment jsdom */
import * as React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LensControllerProvider, useLensController, LensReplayControls, CommentaryPanel, ExplainableShell, createRecordingSource } from '../../src';
import type { RecordingSource, RecordingSourceOptions } from '../../src';

const scenario = JSON.parse(readFileSync('examples/local-playground/recordings.json', 'utf8')).scenarios.find((item: { id: string }) => item.id === 'parallel');
const owned: RecordingSource[] = [];
function recording() {
  const source = createRecordingSource({ snapshot: scenario.runtimeSnapshot, graph: scenario.traceGraph, narrativeEntries: scenario.narrativeEntries } as RecordingSourceOptions);
  owned.push(source); return source;
}
afterEach(() => { cleanup(); owned.splice(0).forEach(source => source.dispose()); vi.useRealTimers(); });

it('two stock transport presentations share the headless clock and survive one view unmounting', () => {
  vi.useFakeTimers(); let showSecond!: (show: boolean) => void;
  function Views() {
    const [show, setShow] = React.useState(true); showSecond = setShow;
    const controller = useLensController();
    return <><output>{controller.selectedSnapshot?.runtimeStageId}</output><LensReplayControls />{show && <LensReplayControls />}</>;
  }
  const view = render(<LensControllerProvider source={recording()} replayControls={{ presentation: 'range', intervalMs: 200 }}><Views /></LensControllerProvider>);
  fireEvent.click(screen.getAllByRole('button', { name: 'Play' })[0]);
  expect(screen.getAllByRole('button', { name: 'Pause' })).toHaveLength(2);
  expect(vi.getTimerCount()).toBe(1);
  act(() => vi.advanceTimersByTime(200)); expect(screen.getByRole('status').textContent).toBe('run-calculations#1');
  act(() => showSecond(false)); expect(screen.getAllByRole('button', { name: 'Pause' })).toHaveLength(1);
  expect(vi.getTimerCount()).toBe(1);
  view.unmount(); expect(vi.getTimerCount()).toBe(0);
});

it('stock Commentary consumes the headless provider and follows its exact cursor', () => {
  function Jump() { const model = useLensController(); return <button onClick={() => model.actions.selectStage('combine#4')}>Read combined result</button>; }
  render(<LensControllerProvider source={recording()}><Jump /><CommentaryPanel presentation="current" /></LensControllerProvider>);
  const text = 'This step: Combine the two branch results.';
  expect(screen.queryByText(text, { exact: true })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Read combined result' }));
  expect(screen.getByText(text, { exact: true })).toBeTruthy();
  expect(document.querySelector('[data-fp="explainable-shell"]')).toBeNull();
});

it('Shell merges JSON range and visibility policy with explicit fields over one controller', () => {
  function Chart() { const model = useLensController(); return <output>{model.selectedSnapshot?.runtimeStageId}</output>; }
  render(<ExplainableShell source={recording()} renderFlowchart={() => <Chart />} replayControls={{ playPause: false }}
    layout={{ columns: '1fr', areas: [['timeTravel'], ['flowchart']], replayControls: { presentation: 'range', previousNext: false } }} />);
  expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Previous stage' })).toBeNull();
  expect(document.querySelector('[data-fp="tt-tick"]')).toBeNull();
  fireEvent.change(screen.getByRole('slider', { name: 'Replay position' }), { target: { value: '4' } });
  expect(screen.getByRole('status').textContent).toBe('combine#4');
});
