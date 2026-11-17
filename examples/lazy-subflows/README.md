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
const readCohort = () => ({
  snapshot: executor.getSnapshot(),
  graph: bundle.structure.getGraph(),
});
const source = createRecordingSource(readCohort());
const publish = () => source.update(readCohort());
const unsubscribeCommits = bundle.commitFlow.subscribe(publish);
const unsubscribeStructure = bundle.structure.subscribe(publish);
// Mount consumers with this stable source; include narrativeEntries in the
// cohort when your host supplies narrative separately from the snapshot.
// Creator cleanup after those consumers unmount:
unsubscribeCommits(); unsubscribeStructure(); source.dispose();
```

Each `update({ snapshot, graph, narrativeEntries })` supplies a complete cumulative cohort, preserving the prior commit-history prefix, values and order. Never pass only the latest event or truncate history to save rendering work. The source compares detached admitted own-data prefixes, including values, read keys and timing, against the latest pending cohort and retains previously recorded runtime visit IDs. Rewritten/shrinking history, removed visits and changed/appearing/disappearing recorded run IDs refuse, even within one frame. This verifies consistency of the supplied data, not semantic truth or completeness of the recording; the host still supplies the complete coherent same-run cohort.

Updates are admitted synchronously, then the latest full cohort is published together per frame with hidden-tab/timer fallback. Intermediate visual notifications can be coalesced because the final cohort retains all prior commits; recorded events are not dropped. The legacy root projection is cached once per published cohort, rather than once forever. Live arrival does not automatically advance the shared cursor while inspecting or using Backtrack.

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
