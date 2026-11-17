# Lazy recorded subflows

`LazySubflowExample.tsx` shows the public source contract. Supply the root recording and its real graph first. `loadSubflow` receives the exact outer-to-inner invocation stamps and an AbortSignal; fetch a complete recorded child result from your own storage, with optional qualified child graph and narrative. The host owns authentication and API routes. This example does not assume an existing server endpoint.

```tsx
const source = createRecordingSource({
  snapshot: root.snapshot,
  graph: graphFromStructure(root.structure),
  async loadSubflow(request, { signal }) {
    return storage.readRecordedSubflow(request.invocationPath, { signal });
    // { result: actualEngineSubflowResult, graph?, narrativeEntries? }
  },
});
<ExplainableShell source={source} rendering={{ loadingIndicator: 'spinner', prefetch: 'none' }} />
// Or <TraceViewer source={source} rendering={...} />.
```

A source owns its complete recording/graph/narrative cohort; inline `runtimeSnapshot`, `snapshots`, `traceGraph`, overlay and narrative companion props are ignored when a source is supplied. Keep the source stable for one recording revision. Create a new source when replacing the recording; its creator calls `dispose()` after its consumers unmount. Individual views do not dispose a shared source.

`layout.rendering` accepts the same JSON-only `loadingIndicator` (`skeleton`, `spinner`, `text`) and `prefetch` (`none`, `idle`) fields. Explicit `rendering` fields override JSON fields. Defaults are skeleton and no prefetch. Loading functions and workers stay in props/source objects. `FootprintTheme.components.LoadStatus` replaces loading/error presentation; existing Button adapters supply Retry/Cancel. The native fallback uses theme tokens, accessible status/error roles and reduced-motion support. No placeholder becomes an evidence node.

Root projection is cached; selected child conversion and complete ready cohorts are published separately. A source batches ready visual notifications per frame with a timer fallback, schedules requested preparation as foreground work, and uses idle time only for optional prefetch. Unchanged graph nodes retain identity. Loading does not advance replay or dismiss Backtrack. Cancel, cursor movement, tabs and source replacement invalidate an outstanding navigation intent. The same source layer supports Standard, Isometric and custom Lens layouts.

Backtrack initially reports only loaded evidence. For an exact known subflow stop, “Load recorded subflow evidence” fetches the child while retaining the question; validated recorded output handoffs then supply the existing Follow child source actions. Missing or malformed history never becomes an invented dependency. The default cache retains up to64 child scopes and refuses new scopes when full rather than evicting Backtrack return data; `maxCachedSubflows` configures that separate source resource bound from1 through64.

## Optional worker preparation

The main-thread fallback still converts each complete child synchronously after yielding; one huge child can block. A worker moves child projection off the UI thread; bounded own-data admission still runs on the main thread. Supply a host-owned Worker so your bundler owns its URL:

```ts
// recording.worker.ts
import { attachSubflowWorker } from 'footprint-explainable-ui';
attachSubflowWorker(self);

// application
const worker = new Worker(new URL('./recording.worker.ts', import.meta.url), { type: 'module' });
const prepareSubflow = createSubflowWorkerPreparation(worker);
const source = createRecordingSource({ snapshot, graph, loadSubflow, prepareSubflow });
// Creator cleanup, after consumers unmount:
source.dispose(); prepareSubflow.dispose(); worker.terminate();
```

The preparation port is trusted executable host code and must preserve the recording. The built-in worker handler runs the same canonical converter and admission path as the fallback. Cancellation suppresses stale results; it cannot interrupt a conversion already running inside a worker. The host owns worker replacement after a transport failure. This feature does not move existing Dagre layout into a worker or split a giant root JSON response; send smaller root/child units and measure representative recordings before claiming a performance gain.

Footprintjs13.0.0 recording data is supported without an engine runtime dependency. D3's stable keyed identity and calculation/presentation separation informed the design; no D3 dependency is added.
