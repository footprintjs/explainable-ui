/**
 * TraceViewer — renders a saved recording. No live executor, no re-run.
 *
 * A recording is three things, and each one lights a different surface:
 *
 *   ```ts
 *   const recording = {
 *     snapshot:  executor.getSnapshot(),      // memory, story, timeline, colouring
 *     structure: chart.buildTimeStructure,    // the CHART. Nothing else can draw it.
 *     events:    [...],                       // the agent view (agentfootprint-lens)
 *   };
 *   fs.writeFileSync('run.json', JSON.stringify(recording));
 *   ```
 *
 *   ```tsx
 *   <TraceViewer recording={JSON.parse(raw)} onError={(e) => setStatus(e.message)} />
 *   ```
 *
 * This is the same `Recording` shape `observeRecording` takes in
 * `agentfootprint-lens` — one saved file, two viewers. `events` is read by
 * Lens, not here; a recording with only two of the three fields still works,
 * and the missing surface says which piece it wanted.
 *
 * Accepts a parsed object OR a raw JSON string (the paste-a-run workflow).
 * Everything that can go wrong goes to `onError` with a typed reason —
 * including the two that used to render nothing at all: a snapshot this
 * library cannot read, and a recording whose run has no stages.
 *
 * The component is a thin composition over `graphFromStructure` +
 * `overlayFromSnapshot` + `<ExplainableShell />` — exactly what a consumer
 * would write by hand. Source is short on purpose; read it as the reference.
 */
import * as React from 'react';
import { useMemo } from 'react';
import { ExplainableShell, type ExplainableShellProps, type ShellTab } from '../ExplainableShell';
import { toVisualizationSnapshots } from '../../adapters/fromRuntimeSnapshot';
import { graphFromStructure } from '../../adapters/graphFromStructure';
import { overlayFromSnapshot } from '../../adapters/overlayFromSnapshot';
import type { ThemeModeProps } from '../../theme';

/**
 * One frozen run. Field-for-field the shape `agentfootprint-lens`'
 * `observeRecording` reads, so the same file drives both viewers.
 */
export interface Recording {
  /** The run's footprintjs snapshot (`executor.getSnapshot()`). Required —
   *  without it there is no run to show. */
  readonly snapshot?: unknown;
  /** The chart's build-time structure (`chart.buildTimeStructure`). The only
   *  thing that can draw the flowchart; a snapshot cannot. */
  readonly structure?: unknown;
  /** The same chart under the name many recordings were frozen with. Read
   *  when `structure` is absent, so an existing file drops straight in. */
  readonly blueprint?: unknown;
  /** The run's event log. Read by `<Lens>`; ignored here. */
  readonly events?: readonly unknown[];
  /** Narrative entries, when the producer captured them separately. Usually
   *  unnecessary — a run recorded with footprintjs's narrative recorder
   *  carries its story inside the snapshot. */
  readonly narrativeEntries?: unknown[];
  /** Optional producer version stamp. Anything other than 1 is refused
   *  loudly rather than half-rendered. */
  readonly schemaVersion?: number;
  /** When the producer stamped extra fields, they ride along untouched. */
  readonly [key: string]: unknown;
}

/**
 * Why a recording could not be shown. Every branch reports one of these —
 * the viewer never renders `fallback` without saying why.
 */
export type TraceParseError =
  | { kind: 'invalid-json'; message: string }
  | { kind: 'not-object'; message: string }
  | { kind: 'unsupported-version'; message: string; version: number }
  | { kind: 'missing-snapshot'; message: string }
  | { kind: 'unreadable-snapshot'; message: string }
  | { kind: 'no-stages'; message: string };

export interface TraceViewerProps
  extends Pick<
    ExplainableShellProps,
    'tabs' | 'defaultTab' | 'hideTabs' | 'size' | 'panelLabels' | 'recorderViews' | 'renderFlowchart' | 'traceTheme'
    >,
    ThemeModeProps {
  /**
   * The recording to render — a parsed object or a raw JSON string.
   * `null` / `undefined` / empty-string render the `fallback`.
   */
  readonly recording?: Recording | string | null;
  /** Former name for `recording`. Still read; prefer `recording`. */
  readonly trace?: Recording | string | null;
  /**
   * Called with the typed reason whenever nothing can be rendered. Show it:
   * every one of these is actionable, and half of them name a missing
   * ingredient rather than a corrupt file.
   */
  readonly onError?: (error: TraceParseError) => void;
  /** Element rendered when no valid recording is available. */
  readonly fallback?: React.ReactNode;
}

type ParseResult =
  | { ok: true; recording: Recording }
  | { ok: false; error: TraceParseError };

function parseRecording(input: TraceViewerProps['recording']): ParseResult {
  if (input == null) {
    return { ok: false, error: { kind: 'invalid-json', message: 'No recording provided.' } };
  }

  let candidate: unknown = input;
  if (typeof input === 'string') {
    if (!input.trim()) {
      return { ok: false, error: { kind: 'invalid-json', message: 'Empty input.' } };
    }
    try {
      candidate = JSON.parse(input);
    } catch (err) {
      return { ok: false, error: { kind: 'invalid-json', message: (err as Error).message } };
    }
  }

  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return {
      ok: false,
      error: { kind: 'not-object', message: 'A recording must be a JSON object.' },
    };
  }

  const rec = candidate as Recording;
  if (rec.schemaVersion !== undefined && rec.schemaVersion !== 1) {
    return {
      ok: false,
      error: {
        kind: 'unsupported-version',
        message: `Unsupported schemaVersion ${String(rec.schemaVersion)}. This viewer reads version 1.`,
        version: Number(rec.schemaVersion),
      },
    };
  }
  if (!rec.snapshot || typeof rec.snapshot !== 'object') {
    return {
      ok: false,
      error: {
        kind: 'missing-snapshot',
        message:
          'This recording has no `snapshot`. A recording is { snapshot: executor.getSnapshot(), structure: chart.buildTimeStructure }.',
      },
    };
  }
  return { ok: true, recording: rec };
}

/** Everything the shell needs, or the reason we cannot build it. */
type Prepared =
  | { ok: true; recording: Recording; snapshotCount: number }
  | { ok: false; error: TraceParseError };

function prepare(input: TraceViewerProps['recording']): Prepared {
  const parsed = parseRecording(input);
  if (!parsed.ok) return parsed;

  // Read the snapshot HERE so a failure is reported instead of swallowed —
  // an empty render used to be indistinguishable from "no data yet".
  try {
    const snapshots = toVisualizationSnapshots(
      parsed.recording.snapshot as Parameters<typeof toVisualizationSnapshots>[0],
      (parsed.recording.narrativeEntries as Parameters<typeof toVisualizationSnapshots>[1]) ?? undefined,
    );
    if (snapshots.length === 0) {
      return {
        ok: false,
        error: {
          kind: 'no-stages',
          message:
            "This recording's snapshot has no executed stages — its `executionTree` is empty. Was the snapshot taken before run() finished?",
        },
      };
    }
    return { ok: true, recording: parsed.recording, snapshotCount: snapshots.length };
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: 'unreadable-snapshot',
        message: `Could not read this snapshot: ${err instanceof Error ? err.message : String(err)}`,
      },
    };
  }
}

const DEFAULT_TABS: ShellTab[] = ['explainable'];

export function TraceViewer({
  recording,
  trace,
  onError,
  fallback,
  tabs = DEFAULT_TABS,
  defaultTab = 'narrative',
  hideTabs,
  size,
  panelLabels,
  recorderViews,
  renderFlowchart,
  traceTheme,
  theme: themeMode,
}: TraceViewerProps): React.ReactElement | null {
  const input = recording ?? trace;
  const prepared = useMemo(() => prepare(input), [input]);

  // Surface errors via callback; render is determined by the validity below.
  React.useEffect(() => {
    if (!prepared.ok && onError) onError(prepared.error);
  }, [prepared, onError]);

  // The chart comes from the recording's structure — the one ingredient the
  // snapshot cannot supply. Missing structure leaves `traceGraph` undefined,
  // and the shell then says which piece is missing on screen.
  const traceGraph = useMemo(() => {
    if (!prepared.ok) return undefined;
    const structure = prepared.recording.structure ?? prepared.recording.blueprint;
    const graph = graphFromStructure(structure);
    return graph.nodes.length > 0 ? graph : undefined;
  }, [prepared]);

  // The chart's colouring, rebuilt from the run's own commit log.
  const runtimeOverlay = useMemo(
    () =>
      prepared.ok
        ? overlayFromSnapshot(prepared.recording.snapshot as never, {
            // Retry attempts live in the narrative, never in the commit log —
            // a discarded attempt commits nothing.
            narrativeEntries: prepared.recording.narrativeEntries as
              | readonly { type?: unknown; runtimeStageId?: unknown }[]
              | undefined,
          })
        : undefined,
    [prepared],
  );

  if (!prepared.ok) {
    return (fallback ?? null) as React.ReactElement | null;
  }

  return (
    <ExplainableShell
      runtimeSnapshot={prepared.recording.snapshot as ExplainableShellProps['runtimeSnapshot']}
      traceGraph={traceGraph}
      runtimeOverlay={runtimeOverlay}
      narrativeEntries={prepared.recording.narrativeEntries as ExplainableShellProps['narrativeEntries']}
      tabs={tabs}
      defaultTab={defaultTab}
      hideTabs={hideTabs}
      size={size}
      panelLabels={panelLabels}
      recorderViews={recorderViews}
      renderFlowchart={renderFlowchart}
      // One word re-themes the whole viewer; `traceTheme` stays the finer
      // control (it also carries the two node-state colours).
      traceTheme={traceTheme ?? (themeMode ? { mode: themeMode } : undefined)}
    />
  );
}
