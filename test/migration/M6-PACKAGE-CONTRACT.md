# M6 — record entry and optional graph installation (unreleased)

This prepares version 1.0.0 locally on the unpublished major branch. It does
not authorize a tag, release, npm publication or consumer upgrade. M7 must
prove a real Why Lens bridge against old and candidate packages before any
release review; the current Why peer range does not yet admit 1.0.0.

## Three doors, one package

The npm name remains `footprint-explainable-ui`. Root and `/flowchart` retain
all 131 and 125 existing names, including duplicate homes, deprecated names,
`mergeWritePatch`, and their required fields. No old export is removed. The
historical `fixtures/public-exports.json` remains immutable; the separate
`fixtures/record-package-additions.json` records only the new contract and
eight Lens-owned `/record` exports. There is no root alias, `/flow` synonym or
empty domain entry. Foottrace still owns record algorithms and record types.

The major groups the already-approved Node >=22 floor, required Foottrace
`^1.0.3`, new `/record` facade and optional graph installation. React remains a
required peer. Dagre `^0.8.5`, XYFlow `^12.0.0` and ReactDOM `>=18.0.0` have
declared peer ranges **and** optional-peer metadata. Dagre remains a development
dependency for graph tests. There are no `optionalDependencies` or unnecessary
engine/agent peer dependencies. The exact legacy Footprint dev pin remains
fixture-production evidence, not an installed runtime prerequisite.

## Build and lazy view boundary

One build owns all three entries and cleanup, with explicit ESM/CJS splitting
and the build tool's Rollup transform (`treeshake: true`). Its CJS import
transform preserves deferred graph loading; emitted
runtime behavior, not this configuration alone, is the gate. Runtime peers and
Foottrace stay external. Shared chunks and declarations must not pull graph
dependencies into `/record`; strict isolated installs fail if they do.

The first split-CJS build exposed a toolchain defect: the Sucrase forwarding
map named an absolute local generated file and omitted its source contents.
The map gate refused that artifact. The Rollup path fixes it without editing
generated files. Pure generated TracedFlow forwarders may have an empty map
(no sources and no mappings); every actual mapped source must remain relative,
inside `src`, and embedded byte-for-byte. Executable entry owners are required
in maps. Optimized-away re-export barrels keep their frozen hashes and actual
public export checks rather than fictional mappings. Negative map controls
pin the original refusal and this narrow empty-forwarder case.

The composite Shell and FlowchartPanel load their built-in graph view when it
is rendered. During loading there is an accessible “Loading flowchart…” status;
a failed import or render shows a “Graph unavailable” alert and asks the host
to repair dependencies and reload. Other surfaces remain usable. No fallback
graph implementation is introduced. The caller retains source, cursor and
theme, and custom Shell graph renderers bypass the built-in lazy module.

Composite server rendering may emit a loading fallback; a streaming renderer
may wait for the view. `/flowchart` remains direct and synchronous, and Why's
existing direct graph imports are not made lazy by this work. Retaining root
types/graph helpers does not make root a promised graph-free type facade. Use
`/record` for the isolated install/runtime/declaration guarantee.

## Evidence required before merging this step

- Normal source/test strict typechecks, the full existing suite and all 86
  pilot cases, unchanged coverage and the 40 golden/11 producer fixture hashes.
- Exact historical exports plus the additive record ledger; normal package
  lint and dual-format declaration checks.
- Actual packed archive installed normally in independent record-floor,
  record-latest and graph-enabled consumers. No forced or partial install,
  synthetic package, repository aliases, dependency pruning or source-only
  substitution.
- Record ESM/CJS execution against real Flow/HCI records, strict NodeNext
  ESM/CJS and bundler declarations, complete dependency allowlist, 42 runtime/
  declaration leak controls and the unchanged 50 KB vendor-excluded gate.
- Whole root/flow browser measurements under the exact M5 conditions, counting
  all chunks. No size limit may be raised simply to pass a failure; any genuine
  lazy-boundary overhead must be named and reviewed.
- Actual browser chunk/network proof with graph opens, current source/cursor/
  theme, reload/remount and error paths. Static syntax is not sufficient.
- A fresh CJS process proves importing root does not evaluate graph peers or
  the lazy graph chunk, then direct `/flowchart` loads the real graph renderer
  and peers. This does not narrow root's existing graph-aware type contract.
- Independent review, exact-head hosted checks and archived package digests.

The ordinary install proof includes Foottrace 1.0.3 and a separately resolved
latest permitted version. `npm ls --all` must pass and all installed candidate
files must match the original archive, before and after negative controls.
Any subsequent byte change invalidates the candidate evidence. M7–M9 remain
separate; no publication occurs here.

The existing full demo still imports the composite graph surface eagerly and
may emit its existing large-chunk warning. M6 makes no whole-demo or whole-app
startup-size claim; use the measured entry/chunk gates for their stated scope.
