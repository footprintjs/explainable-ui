import { useState } from 'react';
import {
  TraceFlow, type DiagramAppearance, type DiagramObjectAppearance, type FlowchartRenderer,
} from 'footprint-explainable-ui/flowchart';
import { drawings } from './SheetDrawing';
import { geometry, graph, handoffId, layouts, reader, reviewId, stepNames } from './observations';

type Mode = 'design' | 'live' | 'saved';
type Target = 'node' | 'edge';

function LiveInput({ appearance, onChange }: { appearance: DiagramAppearance; onChange: (next: DiagramAppearance) => void }) {
  const [target, setTarget] = useState<Target>('node');
  const [completed, setCompleted] = useState('3');
  const [total, setTotal] = useState('8');
  const key = target === 'node' ? 'nodes' : 'edges';
  const id = target === 'node' ? reviewId : handoffId;
  const current = appearance[key]?.[id];
  const unit = target === 'node' ? 'pages' : 'files';
  function report(facts: DiagramObjectAppearance) {
    onChange({ ...appearance, [key]: { ...appearance[key], [id]: facts } });
  }
  return <section className="editor" aria-label="Live observations">
    <label>Apply to <select value={target} onChange={event => setTarget(event.target.value as Target)}>
      <option value="node">Review node</option><option value="edge">Handoff edge</option>
    </select></label>
    <div className="actions">
      <button onClick={() => report({ activity: 'creating', presence: 'present' })}>Begin creation</button>
      <button onClick={() => report({ ...current, health: 'Needs attention' })}>Flag health</button>
      <button onClick={() => report({ activity: 'removing', presence: 'present' })}>Begin removal</button>
      <button disabled={current?.activity !== 'removing'} onClick={() => report({ presence: 'removed' })}>Confirm removal</button>
    </div>
    <form onSubmit={event => {
      event.preventDefault();
      report({ ...current, presence: 'present', activity: 'updating', progress: { completed: Number(completed), total: Number(total), unit } });
    }}>
      <label>Completed <input type="number" required min="0" max={total} value={completed}
        onChange={event => setCompleted(event.target.value)} /></label>
      <label>Total {unit} <input type="number" required min="1" value={total}
        onChange={event => setTotal(event.target.value)} /></label>
      <button type="submit">Report progress</button>
    </form>
  </section>;
}

function FactRow({ label, facts }: { label: string; facts?: DiagramObjectAppearance }) {
  const count = facts?.progress;
  return <tr><th scope="row">{label}</th><td>{facts?.activity ?? '—'}</td><td>{facts?.presence ?? '—'}</td>
    <td>{count ? `${count.completed} / ${count.total} ${count.unit}` : 'Unreported'}</td><td>{facts?.health ?? '—'}</td></tr>;
}

export function DiagramAppearanceExample() {
  const [mode, setMode] = useState<Mode>('design');
  const [renderer, setRenderer] = useState<FlowchartRenderer>('flat');
  const [custom, setCustom] = useState(true);
  const [step, setStep] = useState(0);
  const [live, setLive] = useState<DiagramAppearance>({});
  const appearance = mode === 'saved' ? reader.at(step) : mode === 'live' ? live : undefined;
  const last = stepNames.length - 1;

  return <main className="appearance-example">
    <header><h1>Document handoff</h1>
      <p>Explore a two-step plan, report live observations, or rewind a saved example.</p></header>
    <div className="settings">
      <label>Source <select value={mode} onChange={event => setMode(event.target.value as Mode)}>
        <option value="design">Design time</option><option value="live">Live input</option><option value="saved">Saved events</option>
      </select></label>
      <label>Renderer <select value={renderer} onChange={event => setRenderer(event.target.value as FlowchartRenderer)}>
        <option value="flat">Flat</option><option value="isometric">Isometric</option>
      </select></label>
      <label>Node drawing <select value={custom ? 'sheet' : 'standard'} onChange={event => setCustom(event.target.value === 'sheet')}>
        <option value="sheet">Folded sheet</option><option value="standard">Built-in stage</option>
      </select></label>
    </div>
    {mode === 'live' && <LiveInput appearance={live} onChange={setLive} />}
    {mode === 'saved' && <section className="transport" aria-label="Saved observations">
      <output aria-live="polite">Step {step} of {last} · {stepNames[step]}</output>
      <button onClick={() => setStep(step - 1)} disabled={step === 0}>Previous</button>
      <input type="range" aria-label="Saved step" min={0} max={last} value={step}
        aria-valuetext={stepNames[step]} onChange={event => setStep(Number(event.target.value))} />
      <button onClick={() => setStep(step + 1)} disabled={step === last}>Next</button>
    </section>}
    <section className="canvas" aria-label="Document handoff diagram">
      <TraceFlow graph={graph} renderer={renderer} layout={layouts[renderer]} diagramAppearance={appearance}
        diagramGeometry={custom ? geometry : undefined} diagramDrawings={custom ? drawings : undefined} />
    </section>
    {mode !== 'design' && <div className="observations"><table>
      <caption>Current observations</caption>
      <thead><tr>{['Object', 'Activity', 'Presence', 'Progress', 'Health'].map(name => <th scope="col" key={name}>{name}</th>)}</tr></thead>
      <tbody><FactRow label="Review node" facts={appearance?.nodes?.[reviewId]} />
        <FactRow label="Handoff edge" facts={appearance?.edges?.[handoffId]} /></tbody>
    </table></div>}
  </main>;
}
