import { ExplainableShell, FootprintTheme, createRecordingSource, themePresets } from 'footprint-explainable-ui';
import type { RecordingSource, RecordingSourceOptions, RecordingSourceUpdate } from 'footprint-explainable-ui';
import type { TraceBundle } from 'footprint-explainable-ui/flowchart';

/** Create outside React rendering; the host owns source.dispose() after all consumers unmount. */
export function createLazyExampleSource(options: Pick<RecordingSourceOptions, 'snapshot' | 'graph' | 'loadSubflow'>) {
  return createRecordingSource(options);
}
/** Attach the bundle to a single run before subscribing. The executor supplies cumulative history. */
export function connectLiveExample(
  bundle: TraceBundle,
  readSnapshot: () => RecordingSourceUpdate['snapshot'],
  onError: (error: unknown) => void,
) {
  const read = () => ({ snapshot: readSnapshot(), graph: bundle.structure.getGraph() });
  const source = createRecordingSource(read());
  const capture = () => source.requestUpdate(read);
  let observed: Promise<void> | undefined;
  let disposed = false;
  function notify() {
    const publication = capture();
    if (observed === publication) return;
    observed = publication;
    void publication.catch(error => { if (!disposed) onError(error); });
  }
  const stopCommits = bundle.commitFlow.subscribe(notify);
  const stopStructure = bundle.structure.subscribe(notify);
  return {
    source,
    capture,
    dispose() {
      disposed = true;
      stopCommits();
      stopStructure();
      source.dispose();
    },
  };
}

export function LazySubflowExample({ source }: { source: RecordingSource }) {
  return <FootprintTheme tokens={themePresets.paperLight}>
    <ExplainableShell source={source} layout={{
      columns: 'minmax(0, 1.5fr) minmax(280px, 1fr)',
      areas: [['timeTravel', 'timeTravel'], ['flowchart', 'details'], ['timeline', 'timeline']],
      flowchart: { renderer: 'isometric' },
      rendering: { loadingIndicator: 'skeleton', prefetch: 'idle' },
    }} />
  </FootprintTheme>;
}
