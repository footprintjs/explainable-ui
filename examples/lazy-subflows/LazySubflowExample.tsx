import { ExplainableShell, FootprintTheme, createRecordingSource, themePresets } from 'footprint-explainable-ui';
import type { RecordingSource, RecordingSourceOptions } from 'footprint-explainable-ui';

/** Create outside React rendering; the host owns source.dispose() after all consumers unmount. */
export function createLazyExampleSource(options: Pick<RecordingSourceOptions, 'snapshot' | 'graph' | 'loadSubflow'>) {
  return createRecordingSource(options);
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
