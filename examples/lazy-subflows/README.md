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

A source owns its complete recording/graph/narrative cohort; inline `runtimeSnapshot`, `snapshots`, `traceGraph`, overlay and narrative companion props are ignored when a source is supplied. Keep the source stable for **one run**, including live revisions. Its creator calls `dispose()` after its consumers unmount; individual views do not dispose a shared source. A different run needs a new source. Create these resources in the host lifecycle, not as a side effect of rendering a React component.

## Live updates for one run

A child loader is optional. For a live run that already supplies its recording and graph, create a source with just `{ snapshot, graph }`. The following uses an existing `createTraceBundle()` attached to the executor before its events arrive:

```ts
import { connectLiveExample } from './LazySubflowExample';

const live = connectLiveExample(bundle, () => executor.getSnapshot(), reportRecordingError);
// Mount <ExplainableShell source={live.source} />.
// After executor.run() settles, capture final recorder fields and await their publication.
await live.capture();
// After the last consumer unmounts:
live.dispose();
```

The example passes a callback to `source.requestUpdate(readCohort)` on each commit or structure notification. The source calls the latest reader once at the next frame (with a timer fallback) and publishes in the same callback. All notifications in the batch share a promise. The reader must return the complete same-run snapshot and graph, including every commit in its original order. Include `narrativeEntries` when your host supplies commentary separately. Transient information that the recorder omits from its cumulative snapshot must be recorded at the producer.

If a snapshot has already arrived (for example, from a transport), `source.update({ snapshot, graph, narrativeEntries })` still admits it synchronously and supersedes an earlier unread signal. Each capture is checked against the most recently admitted cohort for rewritten or shrinking history, missing runtime visits and changed run identity. Reader and admission failures reject the shared promise and leave previously admitted evidence available. Disposing the source cancels an unread capture. Use a new source for a different run.

Root projection is cached once per published cohort. Live arrivals preserve the shared inspection and Backtrack cursor. One large complete capture can still take synchronous main-thread time.

`source.canLoadSubflows` is false without a loader. Supply `loadSubflow` only when exact recorded child units need fetching; live updates and lazy child loading can share the same source.

`layout.rendering` accepts the same JSON-only `loadingIndicator` (`skeleton`, `spinner`, `text`) and `prefetch` (`none`, `idle`) fields. Explicit `rendering` fields override JSON fields. Defaults are skeleton and no prefetch. Loading functions and workers stay in props/source objects. `FootprintTheme.components.LoadStatus` replaces loading/error presentation; existing Button adapters supply Retry/Cancel. The native fallback uses theme tokens, accessible status/error roles and reduced-motion support. No placeholder becomes an evidence node.

Root projection is cached per published cohort; selected child conversion and complete ready cohorts are published separately. A source batches ready visual notifications per frame with a timer fallback, schedules requested preparation as foreground work, and uses idle time only for optional prefetch. Stable node IDs remain the visual identity. A wholly unchanged graph can reuse its published reference; changing graph data may replace node objects. Loading does not advance replay or dismiss Backtrack. Cancel, cursor movement, tabs and source replacement invalidate an outstanding navigation intent. The same source layer supports Standard, Isometric and custom Lens layouts.

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

Footprintjs 13.0.0 data is accepted without an engine runtime dependency within this explicit data-only boundary: enumerable string-keyed plain objects, standard arrays, finite numbers, strings, booleans, null/undefined, BigInt, valid standard Dates and standard Maps/Sets. Native values are detached without JSON conversion; collection order, keys/values and shared aliases within each copied unit are preserved. Cycles, custom classes/subclasses, native objects with extra own properties, accessors, symbols, functions, RegExp/Error, invalid Dates, ArrayBuffer, typed views and SharedArrayBuffer are refused rather than silently normalized or dropped. Collection slots share the existing 100,000-item work allowance before scratch collection. Proxy reflection remains observable host code, not a sandbox.

Treat all returned data as read-only. Freezing a Map, Set or Date cannot freeze its internal slots; these detached native copies still expose JavaScript mutators, so consumers must not mutate them. Live-prefix checks compare native values and alias topology instead of treating empty own-key lists as equality. D3's stable keyed identity and calculation/presentation separation informed the design; no D3 dependency is added.
