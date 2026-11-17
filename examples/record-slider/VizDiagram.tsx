import type { SourceView } from './recordings';

interface Props {
  reader: SourceView['reader'];
  step: number;
  onStepChange: (step: number) => void;
}

export function VizDiagram({ reader, step, onStepChange }: Props) {
  const model = reader.at(step);
  if (model.status === 'refused') return <p role="alert">{model.refusal.message}</p>;
  const { amountVals, cluster_id: groups } = model.folded.state;
  const values = Array.isArray(amountVals) && amountVals.every(value => typeof value === 'number')
    ? amountVals as number[] : [];
  const max = Math.max(1, ...values);

  return <section className="diagram" aria-labelledby="viz-title">
    <h2 id="viz-title">Amount clusters</h2>
    <div className="viz-actions">{reader.stops.filter(stop => stop.kind === 'commit').map(stop =>
      <button key={stop.step} type="button" aria-current={stop.step === step ? 'step' : undefined}
        onClick={() => onStepChange(stop.step)}>{stop.label}</button>)}</div>
    {values.length ? <ul className="plot" aria-label="Recorded amounts and cluster assignments">
      {values.map((amount, index) => {
        const group: unknown = Array.isArray(groups) ? groups[index] : undefined;
        return <li key={index}>
          <b>{amount}</b><span aria-hidden="true" className="bar" style={{ width: `${100 * amount / max}%` }} />
          <span>{typeof group === 'number' ? `Cluster ${group}` : 'Unassigned'}</span>
        </li>;
      })}
    </ul> : <p>No amounts have been loaded at this stop.</p>}
  </section>;
}
