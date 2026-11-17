import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ExplainableShell, FootprintLoadStatus, FootprintTheme, paperDark, paperLight } from 'footprint-explainable-ui';
import type { ExplainableShellProps, RecordingSource } from 'footprint-explainable-ui';
import { InfrastructureChart } from './InfrastructureChart';
import { loadDeploymentRecording } from './recordingDelivery';
import type { DeliveryPolicy, DeploymentRecording } from './recordingDelivery';

function DeliveryStatus({ recording }: { recording: DeploymentRecording }) {
  const { source, overviewBytes } = recording;
  const cohort = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
  const ready = [...cohort.scopes.values()].filter(scope => scope.status === 'ready').length;
  return <p className="deployment-delivery" role="status">Overview: {(overviewBytes / 1024).toFixed(1)} KB · Server details loaded: {ready} / 2.
    {' '}Each detail recording is fetched only when requested. Reopening reuses retained evidence.</p>;
}

function Workbench({ source, dark, isometric, indicator }: {
  source: RecordingSource; dark: boolean; isometric: boolean; indicator: 'skeleton' | 'spinner' | 'text';
}) {
  const renderChart = useMemo<NonNullable<ExplainableShellProps['renderFlowchart']>>(() => props => <InfrastructureChart {...props} source={source} />, [source]);
  return <div className="deployment-workbench">
    <ExplainableShell source={source} title="Deployment simulation" renderFlowchart={renderChart}
      theme={{ tokens: dark ? paperDark : paperLight }} flowchart={{ renderer: isometric ? 'isometric' : 'flat' }}
      rendering={{ loadingIndicator: indicator, prefetch: 'none' }} showStageId
      commentary={{ presentation: 'log', groupByStage: true, followCursor: true }} />
  </div>;
}

export function DeploymentExample() {
  const [dark, setDark] = useState(false);
  const [isometric, setIsometric] = useState(false);
  const [indicator, setIndicator] = useState<'skeleton' | 'spinner' | 'text'>('skeleton');
  const [slow, setSlow] = useState(true);
  const [failedNext, setFailedNext] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<DeploymentRecording | null>(null);
  const [error, setError] = useState(false);
  const policy = useRef<DeliveryPolicy>({ delayMs: 800, failNext: false });
  useEffect(() => {
    const abort = new AbortController(); let owned: DeploymentRecording | null = null;
    setLoaded(null); setError(false); setFailedNext(false); policy.current.failNext = false;
    loadDeploymentRecording(policy.current, abort.signal).then(recording => {
      if (abort.signal.aborted) { recording.source.dispose(); return; }
      owned = recording; setLoaded(recording);
    }).catch(() => { if (!abort.signal.aborted) setError(true); });
    return () => { abort.abort(); owned?.source.dispose(); };
  }, [attempt]);
  return <FootprintTheme tokens={dark ? paperDark : paperLight}>
    <main className="deployment-page">
      <header className="deployment-header">
        <p className="deployment-eyebrow">CONSUMER EXAMPLE · RECORDED SIMULATION</p>
        <h1>A deployment, drawn as infrastructure</h1>
        <p>Router, switch and server shapes carry the same replay position and recorded Backtrack evidence.
          Open a server to fetch its three internal steps. No infrastructure is contacted or changed.</p>
        <a href="../local-playground/">Seven-workflow preview</a>{' · '}
        <a href="https://github.com/footprintjs/explainable-ui/tree/main/examples/deployment-shapes">Example source</a>
      </header>
      <section className="deployment-controls" aria-label="Example display and delivery options">
        <label>Theme<select value={dark ? 'dark' : 'light'} onChange={e => setDark(e.target.value === 'dark')}><option value="light">Paper light</option><option value="dark">Paper dark</option></select></label>
        <label>Chart layout<select value={isometric ? 'isometric' : 'flat'} onChange={e => setIsometric(e.target.value === 'isometric')}><option value="isometric">Isometric</option><option value="flat">Flat</option></select></label>
        <label>Loading state<select value={indicator} onChange={e => setIndicator(e.target.value as typeof indicator)}><option value="skeleton">Skeleton</option><option value="spinner">Spinner</option><option value="text">Text</option></select></label>
        <label className="deployment-check"><input type="checkbox" checked={slow} onChange={e => { setSlow(e.target.checked); policy.current.delayMs = e.target.checked ? 800 : 0; }} />Simulate 800 ms delivery delay</label>
        <button onClick={() => { policy.current.failNext = true; setFailedNext(true); }} disabled={!loaded}>Simulate next detail request failing</button>
        <button onClick={() => setAttempt(value => value + 1)}>Reset recording and cache</button>
      </section>
      {failedNext && <p className="deployment-hint">One storage failure simulation was queued for the next uncached detail request. Use Retry after it fails; reset to clear retained details.</p>}
      <details className="deployment-instructions"><summary>Explore this recording</summary>
        <ol><li>Replay the seven overview stages. Device shapes identify host-assigned roles; their outlines show recorded execution.</li>
          <li>Open Server A or B from its node, Topology or the example buttons. The overview stays usable during loading; Cancel keeps your position.</li>
          <li>At CheckHealth, inspect <code>deploymentReady</code> and Backtrack through both <code>serverAHealthy</code> and <code>serverBHealthy</code>. Load missing evidence, then follow the recorded child handoff to <code>healthy</code>.</li>
          <li>Done returns to your original replay position. Commentary follows the same cursor and uses recorded messages.</li>
          <li>Use the chart's + / − and fit buttons to inspect device shapes, or drag the canvas to pan. Flat opens first; Isometric is optional.</li></ol>
        <p>Large recordings should be split into complete invocation units. Fetching is asynchronous; JSON parsing and each admitted graph's preparation/layout still run on the main thread here. This small example is not a performance benchmark.</p>
      </details>
      {loaded ? <><DeliveryStatus recording={loaded} /><Workbench source={loaded.source} dark={dark} isometric={isometric} indicator={indicator} /></>
        : <div className="deployment-initial"><FootprintLoadStatus state={error ? 'error' : 'loading'} indicator={indicator}
          label={error ? 'The overview recording could not be loaded.' : 'Loading the small deployment overview…'}>
          {error && <button onClick={() => setAttempt(value => value + 1)}>Retry overview</button>}
        </FootprintLoadStatus></div>}
    </main>
  </FootprintTheme>;
}
