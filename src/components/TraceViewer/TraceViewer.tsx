/**
 * TraceViewer — drop-in component that renders an `agentfootprint.exportTrace()`
 * JSON as a fully interactive Behind-the-Scenes view.
 *
 * The pattern:
 *   1. Producer side calls `agentfootprint.exportTrace(runner)` to capture
 *      a portable JSON `AgentfootprintTrace` (schemaVersion 1).
 *   2. The JSON is shipped anywhere — file, HTTP, clipboard, database.
 *   3. Consumer side passes it to `<TraceViewer trace={...} />` and gets
 *      the full BTS view: flowchart topology, narrative timeline, snapshot
 *      memory state, recorder data — without re-executing anything.
 *
 * Accepts EITHER a parsed object OR a raw JSON string. Validates
 * `schemaVersion === 1` and surfaces parse / validation errors via the
 * optional `onError` callback. When the trace is invalid, renders the
 * `fallback` prop (or nothing if not provided).
 *
 * @example
 * ```tsx
 * import { TraceViewer } from 'footprint-explainable-ui';
 *
 * function MyDebugPage({ trace }: { trace: unknown }) {
 *   return <TraceViewer trace={trace} />;
 * }
 * ```
 *
 * @example Paste-from-clipboard pattern (the playground viewer)
 * ```tsx
 * const [raw, setRaw] = useState('');
 * <textarea value={raw} onChange={(e) => setRaw(e.target.value)} />
 * <TraceViewer
 *   trace={raw}
 *   onError={(err) => setStatus(err)}
 *   fallback={<div>Paste a trace JSON to begin.</div>}
 * />
 * ```
 *
 * The component is a thin shell over `toVisualizationSnapshots` +
 * `<ExplainableShell />` — exactly the composition consumers would write
 * by hand. Source is short on purpose; read it as the reference.
 */
import * as React from 'react';
import { useMemo } from 'react';
import { ExplainableShell, type ExplainableShellProps, type ShellTab } from '../ExplainableShell';
import { toVisualizationSnapshots } from '../../adapters/fromRuntimeSnapshot';

/**
 * Schema-versioned trace shape produced by `agentfootprint.exportTrace`.
 * Pinned to `schemaVersion: 1`; future shape changes will bump the version
 * and TraceViewer will gain a multi-version dispatch table.
 */
export interface AgentfootprintTrace {
  readonly schemaVersion: 1;
  readonly exportedAt?: string;
  readonly redacted?: boolean;
  readonly snapshot?: unknown;
  readonly narrativeEntries?: unknown[];
  readonly spec?: unknown;
}

/**
 * Result of parsing + validating raw input. Internal — exposed via
 * `onError` so consumers can show their own error UI.
 */
export type TraceParseError =
  | { kind: 'invalid-json'; message: string }
  | { kind: 'not-object'; message: string }
  | { kind: 'missing-version'; message: string }
  | { kind: 'unsupported-version'; message: string; version: number };

export interface TraceViewerProps
  extends Pick<
    ExplainableShellProps,
    'tabs' | 'defaultTab' | 'hideTabs' | 'size' | 'panelLabels' | 'recorderViews' | 'renderFlowchart'
  > {
  /**
   * Trace to render. Accepts a parsed `AgentfootprintTrace` object or a
   * raw JSON string (the component parses + validates it). `null` /
   * `undefined` / empty-string render the `fallback`.
   */
  readonly trace?: AgentfootprintTrace | string | null;
  /**
   * Called on parse / validation errors. If you need to show your own
   * error UI, capture the error here and render alongside.
   */
  readonly onError?: (error: TraceParseError) => void;
  /** Element rendered when no valid trace is available. */
  readonly fallback?: React.ReactNode;
}

function parseTrace(input: TraceViewerProps['trace']): {
  ok: true;
  trace: AgentfootprintTrace;
} | { ok: false; error: TraceParseError } {
  if (input == null) {
    return {
      ok: false,
      error: { kind: 'invalid-json', message: 'No trace provided.' },
    };
  }

  let candidate: unknown = input;
  if (typeof input === 'string') {
    if (!input.trim()) {
      return { ok: false, error: { kind: 'invalid-json', message: 'Empty input.' } };
    }
    try {
      candidate = JSON.parse(input);
    } catch (err) {
      return {
        ok: false,
        error: { kind: 'invalid-json', message: (err as Error).message },
      };
    }
  }

  if (!candidate || typeof candidate !== 'object') {
    return {
      ok: false,
      error: { kind: 'not-object', message: 'Trace must be a JSON object.' },
    };
  }

  const t = candidate as AgentfootprintTrace;
  if (typeof t.schemaVersion !== 'number') {
    return {
      ok: false,
      error: {
        kind: 'missing-version',
        message: 'Trace is missing required field `schemaVersion`. Did you pass an exportTrace() output?',
      },
    };
  }
  if (t.schemaVersion !== 1) {
    return {
      ok: false,
      error: {
        kind: 'unsupported-version',
        message: `Unsupported schemaVersion ${t.schemaVersion}. This TraceViewer renders schemaVersion 1.`,
        version: t.schemaVersion as number,
      },
    };
  }

  return { ok: true, trace: t };
}

const DEFAULT_TABS: ShellTab[] = ['explainable'];

export function TraceViewer({
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
}: TraceViewerProps): React.ReactElement | null {
  const parsed = useMemo(() => parseTrace(trace), [trace]);

  // Surface errors via callback; render is determined by the validity below.
  React.useEffect(() => {
    if (!parsed.ok && onError) onError(parsed.error);
  }, [parsed, onError]);

  const snapshots = useMemo(() => {
    if (!parsed.ok || !parsed.trace.snapshot) return [];
    try {
      return toVisualizationSnapshots(
        parsed.trace.snapshot as Parameters<typeof toVisualizationSnapshots>[0],
        (parsed.trace.narrativeEntries as Parameters<typeof toVisualizationSnapshots>[1]) ?? undefined,
      );
    } catch {
      return [];
    }
  }, [parsed]);

  if (!parsed.ok || snapshots.length === 0) {
    return (fallback ?? null) as React.ReactElement | null;
  }

  return (
    <ExplainableShell
      snapshots={snapshots}
      narrativeEntries={parsed.trace.narrativeEntries as ExplainableShellProps['narrativeEntries']}
      tabs={tabs}
      defaultTab={defaultTab}
      hideTabs={hideTabs}
      size={size}
      panelLabels={panelLabels}
      recorderViews={recorderViews}
      renderFlowchart={renderFlowchart}
    />
  );
}
