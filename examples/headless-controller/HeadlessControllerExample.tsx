import { useId, useState } from 'react';
import { CommentaryPanel, ExplainableShell, FootprintTheme, LensReplayControls, paperDark, paperLight, useLensController } from 'footprint-explainable-ui';
import type { LensController, ReplayControlsOptions } from 'footprint-explainable-ui';

export type ExampleRecording = 'parallel' | 'retry';
interface ExampleProps {
  recording: ExampleRecording;
  onRecordingChange: (recording: ExampleRecording) => void;
  presentation: NonNullable<ReplayControlsOptions['presentation']>;
  onPresentationChange: (presentation: NonNullable<ReplayControlsOptions['presentation']>) => void;
  scale: NonNullable<ReplayControlsOptions['scale']>;
  onScaleChange: (scale: NonNullable<ReplayControlsOptions['scale']>) => void;
}

type Variable = LensController['activity']['writes'][number];
function preview(value: Variable['value'] | undefined): string {
  return value?.state === 'recorded' ? value.preview ?? 'Preview unavailable'
    : value?.state === 'absent' ? 'Not present' : 'Unavailable';
}
const pathLabel = (key: string) => key.split('\u001f').join('.');

/** Native controls act on the same controller/clock used by the optional default Shell. */
function PlainTransport() {
  const controller = useLensController();
  const { snapshots, selectedIndex, selectedSnapshot, playback, actions, tracingRail, replayAxis } = controller;
  const noteId = useId();
  const text = snapshots.length ? `Step ${selectedIndex + 1} of ${snapshots.length}: ${selectedSnapshot?.stageLabel ?? 'Recorded stage'}` : 'No recorded stages';
  const timingNote = replayAxis.scale === 'steps' ? 'Equal step spacing.' : replayAxis.availability === 'fallback'
    ? 'No positive recorded timing is available in this recording: equal step spacing is used.'
    : `${replayAxis.scale === 'log-duration' ? 'Logarithmic' : 'Linear'} recorded-duration spacing. This is a stage sequence, not elapsed wall-clock time.`;
  return <section className="headless-card" aria-labelledby="headless-transport-title">
    <h2 id="headless-transport-title">A custom transport</h2>
    <div className="headless-transport">
      <button onClick={actions.previous} disabled={!playback.canPrevious}>Previous</button>
      <button onClick={actions.togglePlay} disabled={!playback.canPlay}>{playback.playing ? 'Pause' : 'Play'}</button>
      <button onClick={actions.next} disabled={!playback.canNext}>Next</button>
      <input type="range" min={0} max={1} step="any" value={replayAxis.positionAt(selectedIndex) ?? 0}
        disabled={snapshots.length < 2 || (!!tracingRail && tracingRail.stopIndices.length === 0)}
        aria-label="Custom recorded position" aria-valuetext={text} aria-describedby={noteId}
        onChange={event => actions.scrubTo(replayAxis.indexAt(event.currentTarget.valueAsNumber))}
        onKeyDown={event => {
          if (['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            if (event.key === 'Home') actions.scrubTo(0);
            else if (event.key === 'End') actions.scrubTo(snapshots.length - 1);
            else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') actions.next(); else actions.previous();
          } else if (event.key === 'Escape' && tracingRail) { event.preventDefault(); actions.exitBacktrack(); }
        }} />
      <output aria-live="polite">{text}</output>
    </div>
    <p id={noteId}>{timingNote} Axis availability: <strong>{replayAxis.availability}</strong>.
      {' '}Zero/default duration entries: {replayAxis.zeroDurationCount}; unavailable duration entries: {replayAxis.unavailableDurationCount}; minimum-width entries: {replayAxis.clampedWeightCount}.</p>
    <p>The custom thumb and stock controls share this axis and the same semantic stage index. The configured 700 ms interval is reading pace, not elapsed execution time.</p>
    <div className="headless-stage-links" aria-label="Select a recorded stage">
      {snapshots.map((stage, index) => <button key={stage.runtimeStageId ?? index}
        aria-pressed={selectedIndex === index} disabled={!stage.runtimeStageId}
        onClick={() => { if (stage.runtimeStageId) actions.selectStage(stage.runtimeStageId); }}>{stage.stageLabel}</button>)}
    </div>
  </section>;
}

function VariableList({ kind, values }: { kind: 'Reads' | 'Writes'; values: readonly Variable[] }) {
  const { actions } = useLensController();
  return <div><h3>{kind}</h3>{!values.length ? <p>No {kind.toLowerCase()} displayed for this recorded stage.</p> : <ul>
    {values.map(variable => <li key={variable.id}>
      <strong>{variable.label}</strong>{' = '}<code>{preview(kind === 'Writes' ? variable.after ?? variable.value : variable.value)}</code>
      <small>{variable.valueLabel}</small>
      <button disabled={!variable.traceTarget} onClick={() => {
        // Consume a target from this rendered/current model, never a fabricated variable address.
        if (variable.traceTarget) actions.backtrack(variable.traceTarget);
      }}>Backtrack {variable.label}</button>
    </li>)}
  </ul>}</div>;
}

function TraceSummary() {
  const controller = useLensController();
  const { traceWalk, selectedSnapshot, activityOrigin, actions, questionTrail } = controller;
  if (!traceWalk) return null;
  const current = traceWalk.stops.find(stop => stop.runtimeStageId === selectedSnapshot?.runtimeStageId);
  return <aside className="headless-trace" aria-labelledby="headless-trace-title">
    <h3 id="headless-trace-title">Backtrack: {pathLabel(traceWalk.key)}</h3>
    {activityOrigin && <p>Return destination: <strong>{activityOrigin.stageLabel}</strong>, {activityOrigin.kind} <code>{pathLabel(activityOrigin.key)}</code>.</p>}
    {traceWalk.missing && <p>This question has no safely bound recorded writer at this position.</p>}
    {traceWalk.truncated && <p>The trace reports incomplete coverage.</p>}
    <ol>{traceWalk.stops.map(stop => <li key={`${stop.runtimeStageId}:${stop.commitIdx}`}>
      <button onClick={() => actions.selectStage(stop.runtimeStageId)}>{stop.stageName}</button>{' · recorded commit '}{stop.commitIdx}
    </li>)}</ol>
    {!!current?.ingredients.length && <><h4>Recorded reads at {current.stageName}</h4><ul>
      {current.ingredients.map(ingredient => <li key={ingredient.key}>
        <code>{pathLabel(ingredient.key)}</code>{' · '}{ingredient.writerStageName ?? 'Prior local writer unavailable'}{' '}
        {ingredient.writerRuntimeStageId && <button onClick={() => actions.followIngredient(ingredient)}>Follow {pathLabel(ingredient.key)}</button>}
      </li>)}
    </ul></>}
    {questionTrail.length > 1 && <div aria-label="Earlier Backtrack questions">{questionTrail.slice(0, -1).map((question, index) =>
      <button key={`${index}:${question.key}`} onClick={() => actions.returnToQuestion(index)}>Return to question: {pathLabel(question.key)}</button>)}</div>}
    {controller.tracingRail?.viaKey && <><button onClick={actions.showAllIngredients}>Show all recorded ingredients</button>{' '}</>}
    <button onClick={actions.exitBacktrack}>Return from Backtrack</button>
  </aside>;
}

function PlainSummary() {
  const controller = useLensController();
  const { activity, invocationPath, pendingLoad, visitChoice, actions, recordingStatus } = controller;
  return <section className="headless-card" aria-labelledby="headless-summary-title">
    <h2 id="headless-summary-title">A custom evidence summary</h2>
    <p role="status">Recording status: <strong>{recordingStatus.status}</strong>{recordingStatus.reason ? ` · ${recordingStatus.reason}` : ''}.</p>
    <p>Selected visit: <code>{activity.identity.runtimeStageId ?? 'Unavailable'}</code> · Scope: <code>{invocationPath.length ? invocationPath.join(' → ') : 'root'}</code></p>
    <div className="headless-variables"><VariableList kind="Reads" values={activity.reads} /><VariableList kind="Writes" values={activity.writes} /></div>
    {activity.notes.map((note, index) => <p key={index}>{note}</p>)}
    <TraceSummary />
    {controller.navigationNotice && <p role="status">{controller.navigationNotice}</p>}
    {pendingLoad && <div role="status">Recorded detail: {pendingLoad.status}{' '}
      {pendingLoad.status === 'error' ? <button onClick={actions.retryPending}>Retry</button> : <button onClick={actions.cancelPending}>Cancel</button>}
    </div>}
    {visitChoice && <fieldset><legend>Choose an exact recorded invocation</legend>{visitChoice.visits.map(visit =>
      <button key={visit.runtimeStageId} onClick={() => actions.chooseInvocation(visit.runtimeStageId)}>Visit {visit.visit} of {visit.total}: {visit.runtimeStageId}</button>)}</fieldset>}
  </section>;
}

/** The provider is outside this component, so toggling the Shell cannot replace its owner. */
export function HeadlessControllerExample(props: ExampleProps) {
  const [showShell, setShowShell] = useState(true), [dark, setDark] = useState(false);
  const [showBoundPanels, setShowBoundPanels] = useState(false);
  return <FootprintTheme asChild tokens={dark ? paperDark : paperLight}><main className={`headless-example${dark ? ' headless-dark' : ''}`}>
    <header><p className="headless-eyebrow">ONE REACT CONTROLLER</p>
      <h1>One recorded position, two interfaces</h1>
      <p>The custom controls and summary below share a controller with the optional standard workbench. This is an existing engine recording; nothing is executed or re-executed.</p>
      <div className="headless-configuration">
        <label>Recorded workflow<select value={props.recording} onChange={event => {
          const value = event.currentTarget.value; if (value === 'parallel' || value === 'retry') props.onRecordingChange(value);
        }}><option value="parallel">Parallel total 35</option><option value="retry">Recorded retry timings</option></select></label>
        <label>Axis scale<select value={props.scale} onChange={event => {
          const value = event.currentTarget.value; if (value === 'steps' || value === 'duration' || value === 'log-duration') props.onScaleChange(value);
        }}><option value="steps">Equal steps</option><option value="log-duration">Recorded duration · logarithmic</option><option value="duration">Recorded duration · linear</option></select></label>
        <label>Stock transport appearance<select value={props.presentation} onChange={event => {
          const value = event.currentTarget.value; if (value === 'range' || value === 'segmented') props.onPresentationChange(value);
        }}><option value="range">Normal thumb</option><option value="segmented">Segments</option></select></label>
      </div>
      {props.recording === 'parallel' ? <p>Choose Combine, then Backtrack its recorded <code>total = 35</code> write. Follow the recorded item and delivery amounts back to their inputs.
        This recording has no positive stage durations, so weighted scales disclose an equal-spacing fallback.</p>
        : <p>This separate native recording includes measured retry timings. Choose Segments to view recorded-duration widths.
          It has one positive timing, so linear and logarithmic normalization produce the same relative widths here.
          A retry that recovers is the recorded scenario; no retry or new measurement is performed here.</p>}
      <label><input type="checkbox" checked={showShell} onChange={event => setShowShell(event.target.checked)} />Show the standard Shell</label>{' '}
      <label><input type="checkbox" checked={showBoundPanels} onChange={event => setShowBoundPanels(event.target.checked)} />Show bound transport and Commentary</label>{' '}
      <label><input type="checkbox" checked={dark} onChange={event => setDark(event.target.checked)} />Paper dark</label>
      <p>Hide and remount the Shell during playback or Backtrack: the provider retains the shared model and clock.</p>
    </header>
    <PlainTransport /><PlainSummary />
    {showBoundPanels && <section className="headless-card" aria-label="Stock panels bound to the shared controller">
      <h2>Stock panels without a Shell</h2>
      <LensReplayControls size="compact" />
      <CommentaryPanel title="Recorded Commentary" presentation="log" groupByStage followCursor maxLines={120} />
    </section>}
    {showShell && <section className="headless-shell" aria-label="Standard Shell on the shared controller">
      <ExplainableShell title="Shared standard workbench" theme={{ tokens: dark ? paperDark : paperLight }}
        flowchart={{ renderer: 'flat' }} defaultExpanded={{ timeline: false, details: true }} />
    </section>}
  </main></FootprintTheme>;
}
