import { operations, transitions } from './recordings';
import type { RecordingId, SourceView } from './recordings';

interface Props {
  recording: Exclude<RecordingId, 'viz'>;
  stops: SourceView['reader']['stops'];
  step: number;
  onStepChange: (step: number) => void;
}

const titles = { pricing: 'Pricing workflow', storefront: 'Storefront actions', go: 'Invoice calculation', combined: 'Parallel order calculation' };

function diagramRows(recording: Props['recording'], stops: Props['stops']) {
  if (recording === 'pricing') {
    // The pricing graph names operations, with one recorded visit each in this run.
    return operations.map(node => ({
      id: node.id, label: node.label, outcome: '', stop: stops.find(s => s.stageId === node.id),
    }));
  }
  if (recording === 'storefront') {
    // Each HCI transition retains its own visit ID, even when repeating an action.
    return transitions.map(action => ({
      id: action.id, label: action.id, outcome: action.outcome, stop: stops.find(s => s.runtimeStageId === action.id),
    }));
  }
  return stops.filter(stop => stop.kind === 'commit').map(stop => ({
    id: stop.runtimeStageId, label: stop.label, outcome: '', stop,
  }));
}

export function HostDiagram({ recording, stops, step, onStepChange }: Props) {
  const rows = diagramRows(recording, stops);
  return <section className="diagram" aria-labelledby="diagram-title">
    <h2 id="diagram-title">{titles[recording]}</h2>
    <ol className={recording === 'storefront' ? 'journey' : recording === 'combined' ? 'order-branches' : 'operations'}>{rows.map(row => {
      const target = row.stop;
      return <li key={row.id} data-stage={target?.stageId}>
        {target ? <button type="button" aria-current={target.step === step ? 'step' : undefined}
          onClick={() => onStepChange(target.step)}>
          {row.label}{row.outcome && <small>{row.outcome}</small>}
        </button> : <span>{row.label}<small>{row.outcome || 'No recorded stop'}</small></span>}
      </li>;
    })}</ol>
  </section>;
}
