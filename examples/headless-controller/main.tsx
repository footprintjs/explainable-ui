/// <reference types="vite/client" />
import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LensControllerProvider, createRecordingSource } from 'footprint-explainable-ui';
import type { RecordingSourceOptions, ReplayControlsOptions } from 'footprint-explainable-ui';
import { HeadlessControllerExample } from './HeadlessControllerExample';
import type { ExampleRecording } from './HeadlessControllerExample';
import recording from './recording.json';
import retryRecording from './recording-retry.json';
import configuration from './controller-options.json';
import '@xyflow/react/dist/style.css';
import './style.css';

const { presentation, scale, intervalMs } = configuration.replayControls;
if ((presentation !== 'range' && presentation !== 'segmented') ||
  (scale !== 'steps' && scale !== 'duration' && scale !== 'log-duration') || !Number.isFinite(intervalMs)) {
  throw new Error('Invalid example replay configuration.');
}
const initial: ReplayControlsOptions = { presentation, scale, intervalMs };
// The creator owns these stable sources, outside React rendering and all optional views.
// JSON cannot retain TypeScript's branded IDs/enum literals. The public source
// constructor still admits/copies the supplied recording at this typed boundary.
const sourceFor = (input: unknown) => createRecordingSource(input as Pick<RecordingSourceOptions, 'snapshot' | 'graph' | 'narrativeEntries'>);
const sources = { parallel: sourceFor(recording), retry: sourceFor(retryRecording) };

/** Changing presentation options keeps both sources and this provider owner alive. */
function ExampleOwner() {
  const [scenario, setScenario] = useState<ExampleRecording>('parallel');
  const [selectedPresentation, setPresentation] = useState<NonNullable<ReplayControlsOptions['presentation']>>(initial.presentation!);
  const [selectedScale, setScale] = useState<NonNullable<ReplayControlsOptions['scale']>>(initial.scale!);
  const replayControls = useMemo(() => ({ presentation: selectedPresentation, scale: selectedScale, intervalMs }), [selectedPresentation, selectedScale]);
  return <LensControllerProvider source={sources[scenario]} replayControls={replayControls}>
    <HeadlessControllerExample recording={scenario} onRecordingChange={setScenario}
      presentation={selectedPresentation} onPresentationChange={setPresentation} scale={selectedScale} onScaleChange={setScale} />
  </LensControllerProvider>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<ExampleOwner />);

let disposed = false;
function dispose() {
  if (disposed) return;
  disposed = true;
  root.unmount(); Object.values(sources).forEach(source => source.dispose()); window.removeEventListener('pagehide', onPageHide);
}
function onPageHide(event: PageTransitionEvent) { if (!event.persisted) dispose(); }
window.addEventListener('pagehide', onPageHide);
import.meta.hot?.dispose(dispose);
