import { vizPlot } from './recordings';
import type { SourceView } from './recordings';

interface Props {
  stops: SourceView['reader']['stops'];
  step: number;
  onStepChange: (step: number) => void;
}

export function VizDiagram({ stops, step, onStepChange }: Props) {
  // These plot values and visit IDs come from Viz. The host controls visibility
  // of its own plot, while RecordLens owns the canonical state and explanation.
  const stop = stops[step];
  const assigned = stop?.runtimeStageId === vizPlot.clusterVisit || stop?.kind === 'end';
  const loaded = assigned || stop?.runtimeStageId === vizPlot.loadVisit;
  const values = loaded ? vizPlot.amounts : [];
  const max = Math.max(1, ...values);

  return <section className="diagram" aria-labelledby="viz-title">
    <h2 id="viz-title">Amount clusters</h2>
    <div className="viz-actions">{stops.filter(stop => stop.kind === 'commit').map(stop =>
      <button key={stop.step} type="button" aria-current={stop.step === step ? 'step' : undefined}
        onClick={() => onStepChange(stop.step)}>{stop.label}</button>)}</div>
    {values.length ? <ul className="plot" aria-label="Recorded amounts and cluster assignments">
      {values.map((amount, index) => {
        const group = assigned ? vizPlot.assignments[index] : undefined;
        return <li key={index}>
          <b>{amount}</b><span aria-hidden="true" className="bar" style={{ width: `${100 * amount / max}%` }} />
          <span>{typeof group === 'number' ? `Cluster ${group}` : 'Unassigned'}</span>
        </li>;
      })}
    </ul> : <p>No amounts have been loaded at this stop.</p>}
  </section>;
}
