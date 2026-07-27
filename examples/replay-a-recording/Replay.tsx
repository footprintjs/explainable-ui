/**
 * Replay — STEP 2 of the replay story: show a saved run.
 *
 * This is the whole integration. Two props carry the run, and one word
 * carries the theme:
 *
 *   runtimeSnapshot   what happened — memory, story, timeline, and (since the
 *                     shell derives the overlay from its commit log) the
 *                     chart's colouring
 *   traceGraph        the chart itself, rebuilt from the saved structure
 *   traceTheme        light or dark, in one word
 *
 * There is no `runtimeOverlay` here on purpose: the shell rebuilds it from
 * the snapshot. Pass one only when you have a LIVE recorder handle.
 */
import { ExplainableShell, graphFromStructure } from 'footprint-explainable-ui';
import recording from './run.json';

/** The saved file, exactly as `record.mjs` wrote it. */
export interface SavedRecording {
  snapshot: unknown;
  structure: unknown;
  /** Present only when this run's engine could not carry its story inside
   *  the snapshot — see the note in record.mjs. */
  narrativeEntries?: unknown;
}

export function Replay({ run = recording as SavedRecording }: { run?: SavedRecording }) {
  return (
    <div style={{ height: '100vh' }}>
      <ExplainableShell
        runtimeSnapshot={run.snapshot as never}
        traceGraph={graphFromStructure(run.structure)}
        narrativeEntries={run.narrativeEntries as never}
        traceTheme={{ mode: 'light' }}
        title="Quoting pipeline (recorded)"
        defaultExpanded={{ details: true }}
      />
    </div>
  );
}
