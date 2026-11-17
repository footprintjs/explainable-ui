# Deployment shapes and lazy server recordings

A consumer example for `footprint-explainable-ui@1.0.1`: a router, a switch and
two server nodes in a recorded **local simulation**. Nothing contacts, configures
or deploys infrastructure. Device roles come from an explicit host mapping;
execution and Backtrack facts come from the recording.

The seven-stage overview is fetched first (about 25 KB). Opening Server A or B
fetches its separate three-step recording (about 13 KB each). The child payloads
are URL assets, not eager JSON imports. The static build disables asset inlining.
Reopening a detail uses the source's retained evidence.

## Run from this repository

With the repository dependencies available:

```sh
npx vite --config examples/deployment-shapes/vite.config.ts
```

Open `http://127.0.0.1:5317/`. This example uses its own port, leaving an existing
5314 preview alone. The Vite development aliases resolve public package imports
to this repository's source. The example uses existing public 1.0.1 APIs and
does not introduce a library shape registry or a new package release.

The Pages workflow builds this example into `demo-dist/deployment-shapes/` after
the gallery and seven-workflow preview. Once the change is merged and deployed,
its address is `https://footprintjs.github.io/explainable-ui/deployment-shapes/`.

## Explore

1. Replay the overview. The host chooses device silhouettes; recorded
   `active`, `done`, `error`, step and trace fields choose the execution paint.
2. Open a server from a node, Topology or the example buttons. All routes use
   the Shell's drill action and shared replay cursor. While fetching, the root
   stays usable; Cancel keeps the current scope and position.
3. The optional **800 ms delivery delay** is an asynchronous storage simulation,
   unrelated to recorded execution time. Queue one storage failure to try the
   themed error state and Retry. Reset explicitly clears this example's cache.
4. At `CheckHealth`, inspect the written `deploymentReady` value and Backtrack.
   It reads both `serverAHealthy` and `serverBHealthy`. Follow either ingredient
   to its mount, load missing evidence when offered, then follow the recorded
   output handoff to that child's `healthy` writer. Done restores the original
   question/cursor through the existing Shell behavior.
5. Switch Paper light/dark, Flat/Isometric and Skeleton/Spinner/Text. Flat opens
   first for readable device labels. Use +/−, fit and canvas panning to inspect
   the optional Isometric layout. Developer
   and Commentary share the same chart and position; Commentary uses the
   original recorded messages, grouped by stage.

## Adapt the shapes

`shape-map.json` is **host-owned configuration**, mapping exact graph stage IDs
to `router`, `switch` or `server`. Unknown IDs/kinds fall back to a card. It does
not change recorded stage kinds, branch decisions, readiness or errors.

`InfrastructureChart.tsx` replaces `ExplainableShell.renderFlowchart` with the
public `TracedFlow` component and a stable
`nodeTypes={{ stageNode: InfrastructureStageNode }}` registry. It keeps graph
nodes as recorded `type: 'stage'`, forwards Shell navigation/trace callbacks,
selects the graph by the exact invocation path and maps the selected recorded
runtime ID to its overlay position. There is no second selection controller.

`deviceGeometry.ts` owns each node's footprint, drawing/content bounds and edge
ports. The same footprint goes to `layoutOptions.nodeSize`; the node refreshes
XYFlow handles when its geometry revision changes. Add a new kind there and in
`device-drawing.tsx`, then map its exact stage IDs in the host JSON. Both layouts
use these intrinsic SVG silhouettes; Isometric changes the layout and edge
projection rather than replacing the custom node with the default tile.

Paint uses public `--fp-*` theme tokens and the existing passed execution/trace
fields. Parent ReactFlow retains node interaction and keyboard ownership.

## Delivery and scheduling boundary

`recordingDelivery.ts` creates one creator-owned `createRecordingSource` with a
`loadSubflow` callback. It matches the full captured run, invocation path, mount
runtime ID and subflow ID before fetching a detail. Abort signals reach both
the demonstration delay and fetch. The source owns admission, preparation,
deduplication, cancellation, coherent publication and retained Backtrack facts.

This example uses `rendering={{ loadingIndicator, prefetch: 'none' }}`. Existing
JSON layouts can express the same policy as `layout.rendering`; explicit props
take precedence. `prefetch: 'idle'` is available for optional background loading.
Live producers can call `source.update()` with complete cumulative same-run
cohorts; they must retain earlier commits/events. The source batches visual
publication. A host preparation worker is optional through `prepareSubflow`.

Segment large recordings at complete invocation boundaries rather than cutting
arbitrary JSON fragments into the viewer. Fetching is asynchronous, but JSON
parsing, root admission/projection and each graph's layout still involve
synchronous main-thread work here. This small example demonstrates actual
on-demand delivery, **not** a large-data benchmark or fully incremental root
layout. Drill zoom/fade transition strategies are a separate future layer;
this example uses current navigation behavior.

## Recording provenance

`record.mjs` runs the actual public `footprintjs@13.0.0`, `foottrace@2.0.0` and
`footprint-explainable-ui@1.0.1` APIs with full/nested reads, `reads-prefix`
write provenance and captured output handoffs. It reads both branch outputs
into locals before deriving `deploymentReady`.

Use a separate capture directory with a normal `package.json`/lockfile and
those exact packages installed, plus their React/ReactDOM/XYFlow peers. Then:

```sh
DEPLOYMENT_CAPTURE_PACKAGES=/absolute/path/to/capture-directory \
  node examples/deployment-shapes/record.mjs
```

The producer refuses the repository's older development engine/Foottrace
versions rather than silently producing another cohort. It validates native
parent/child writers, loads both split children through the published source
API and repeats the simulation to check the outcome and public graph.

The checked-in manifest records registry versions/integrities, child hashes and
exact captured requests. Runtime IDs, timestamps and parallel interleaving are
capture facts and may change on regeneration. The fixed seed repeats the
simulation's state and graph, not byte-identical timestamps.

The overview retains native root state/tree/commits and 30 root narrative
entries. Each child retains its complete native result/graph and 15 scoped
entries: all 60 original entries are retained once. Aggregate Narrative/Metrics
recorder payloads are omitted and disclosed in the manifest so the overview
does not embed child details. No timing explanation is invented to replace them.

Focused checks:

```sh
npx tsc -p examples/deployment-shapes/tsconfig.json
npx vitest run test/component/DeploymentShapesNodes.test.tsx test/component/DeploymentDelivery.test.ts
```
