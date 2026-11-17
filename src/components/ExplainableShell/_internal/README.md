# Selected-record tracing

The shell selects one invocation chain. `subflowInvocation` resolves exact paths
and runtime IDs and reports ambiguity; `subflowRecord` projects the chosen
record once and caches its rail and trace names. It filters Story by selected
runtime IDs. `useSubflowNavigation` owns drill resolution, source replacement and transient
visit/notice state. These state owners now live in `src/workbench/internal`; the renderless provider keeps the single timeline cursor.
`SubflowNavigationStatus` renders that feedback separately. The shared pure
owners now live in `src/trace`; old shell-internal paths only re-export them.
`TraceWalkScope` is explicit serializable data on the walk, shared by cards
and non-UI callers. No hidden WeakMap or in-place walk mutation is involved.

## Default template and presentation ownership

With no valid explicit `defaultTab`, the initial lens is Inspector → Activity.
Valid existing IDs keep their destinations: `result` opens Result, `memory`
opens Inspector → State, and `narrative` or a recorder ID opens Run data. The
unstyled default is the Explainable composite with Activity. Visible labels
Run log, Metrics and State do not rename the public tab IDs. Initialization
does not change the selected invocation or turn a tab click into a scope reset.

`LensWorkbenchContextValue` is the complete shell layout contract. The renderless `LensControllerProvider`
owns recording preparation, exact-scope navigation, playback, cursor and
trace controllers. Shell owns presentation and consumes that shared model. `renderLayout(workbench)` receives those owners' ready-made
surfaces and actions; `useLensWorkbench` reads the same context below that
layout. The surfaces are `timeTravel`, `navigation`, `breadcrumb`, `chart`,
`topology`, `inspector`, `runData`, `result`, `timeline` and `compactTimeline`.
Current state includes `snapshots`, `selectedIndex`, `selectedSnapshot`,
`invocationPath`, `activity`, `selectedActivityVariableId`, `traceWalk`,
`questionTrail` and `activityOrigin`. The exposed `narrativeEntries` is the
current scope's full supplied recording; custom logs own cursor filtering.
Actions are `selectIndex`, `selectStage`, `drillDown`, `returnToRoot`,
`backtrack`, `exitBacktrack`, `followIngredient`, `followHandoff`,
`returnToQuestion`, `showAllIngredients` and `selectActivityVariable`.
Trace target admission and Activity return validation remain with the shared controller.
The basic `ExplainableProvider`/`ExplainableView` API is separate and does not
promise this full shell feature set.

`theme: LensTheme` supplies `mode`, `tokens` and native-compatible `components`.
Explicit tokens override the chosen mode. `FootprintTheme` merges each nested
token group and adapter registry, ignoring undefined overrides, and emits only
local CSS declarations so host variables continue to inherit. Token groups
cover typography, spacing, radii, borders, elevation, motion and controls, plus
foreground colors paired with semantic fills. Legacy `radius` seeds component
radii unless a specific radius is supplied.
The shell uses `FootprintTheme asChild` to retain the host's actual root box
and direct-child layout relationship. Standalone hosts can use the same option
with one non-Fragment child that forwards className/style. Theme variables are
merged beneath child-authored style without replacing its ref or events.

`componentStyles(size)` is the shared CSS recipe; numeric sizing helpers stay
available for geometry calculations. Primitives delegate Button, Tab, Input,
Checkbox, Badge, Code, Tooltip and Icon to host adapters that preserve refs,
native events/state and accessibility attributes. Internal `defaultStyle`
never reaches a host adapter. Explicit `style` wins for native fallbacks;
unstyled or explicitly undefined `defaultStyle` suppresses fallback paint.
The migration covers core Lens presentation rather than every exported
component. Custom layouts, unstyled semantics and custom chart renderers let a
host own presentation while retaining the same behavior owners.

`TracedFlow` separately exposes renderer registries, default measured
`layoutOptions`, background/breadcrumb overrides and camera ownership. A
supplied `layout` owns its own options. Controlled `viewport` or `autoFit=false`
turns off the automatic fitter. Unstyled graph rendering retains geometry,
ports, interaction and authored host styles while omitting built-in paint.
Authored edge types, styles and markers take precedence over system defaults.

## Run log and recorder scope

The shell requests `NarrativePanel`'s `presentation="visits"`; standalone
NarrativePanel and StoryNarrative default to `entries`. Visit groups preserve
full recorded text and initially collapse operation details. Exact runtime IDs
establish a selected-invocation prefix through the cursor. Missing, unmatched
or ambiguous IDs produce an explicit unsynchronized view of all supplied
entries in the scope, without selected-visit attribution. Fallback snapshot
lines are revealed by the snapshot that supplied them, never estimated from
text length. Reading does not scroll automatically: `defaultFollowCursor` is
false. Copying with a runtime snapshot is labelled **Copy full run debug
bundle**, including other scopes and future entries from the supplied run.

`projectKeyedRecorder` admits only uniquely matched runtime rows for a scoped
metrics table. Selected visit, through-cursor totals and current-flow totals
stay separate. A source-wide `grandTotal` is retained as source metadata and
never borrowed as the drilled invocation's total. Strings, missing/non-finite
values and invalid negative counts/durations stay unavailable. Stage-name
legacy tables are unscoped and receive no selected-step/current-flow totals.
The built-in Metrics view uses recorded count/duration columns; custom
recorders retain generic presentation.

## Variables and execution

### Exact-visit Activity

The shell projects the selected scope, snapshot and paired narrative through
`projectStageActivity`. Inspector opens in Activity; State and Data Trace remain
available. The same projection feeds the stage panel and
`formatStageActivitySummary`, without another lineage walker. Narrow and
unstyled surfaces use this same selected-visit model.

Activity preserves the narrative's within-visit sequence. It does not merge
that sequence with execution-tree branch messages into a global order across
parallel stages. A legacy operation label is admitted only when the standard
text's step number, operation wording and key agree with the narrative fields;
it remains labelled as reported narrative, not typed scope-event capture.
Stored predicate expressions, source files and algorithm reconstruction are
not inferred from that wording.

Read keys come from the exact tree visit or admitted narrative. Their bounded
previews belong to the earlier writer's end snapshot, not to the read call.
If the narrative reports reading a key after an in-stage write, the generic
read for that key withholds its preview, writer and trace target. Even an
available pre-stage writer cannot establish the origin of that later read.
Committed changes compare snapshots around the selected commit; the first
before-state stays unknown when no previous snapshot exists. These are net
committed changes, not every local assignment. Only exact-runtime-linked logs
are stage logs; the shell's run-level console input is not attributed here.

Activity trace targets contain names, the exact invocation and runtime visit,
and an exclusive commit cutoff. A read uses the selected commit index; a write
uses that index plus one. The shell revalidates the current evidence before
dispatching to its existing trace controller, so reading and writing the same
key do not collapse onto the later value. Selecting a recorded writer changes
the existing scope's cursor.

Starting a trace from Activity also records an origin bookmark: source
identity, exact invocation/runtime address and the selected read/write variable
identity. It retains no snapshot values. The primary **Back to … · Activity**
action ends that investigation and restores the validated origin, selected
variable and Activity lens. Escape and selecting the Activity tab take the
same route. This is separate from the variable-question trail's return to an
earlier question. A stale or withdrawn recording cannot revive an old origin.
Legacy Data Trace starts carry no Activity bookmark; their Done action keeps
the existing current-cursor behavior.
The shell handles Escape for Activity-origin investigations even when an
unknown writer leaves no tracing rail. This handler is scoped to the shell
and defers to an already handled rail key. Entry/return focus follows the
return action and the restored variable where those controls are available.

An explicit `exit` or `repeat` phase is a bookkeeping row only when its trace,
overwrite, updates and redactions are absent or demonstrably empty. Such a row
does not become a duplicate visit or a committed write. Primary identity and
before-state lookup skip it, while trace targets retain the original raw log
index; the controller validates that exact current target and raw address.
It does not re-canonicalize or renumber commit history independently. A row
with values, unreadable payload fields or redactions remains subject to the
normal ambiguity checks.

`InspectorPanel` keeps `tab`/`onTabChange` as `"state" | "trace"` for existing
consumers. Its optional Activity selection is controlled separately with
`activitySelected`/`onActivitySelect`; omitting an activity model preserves the
legacy two-tab panel. Stage logic and full-flow exports remain separate work.
`StageActivityPanel.selectedVariableId`/`onVariableSelect` and the wrapping
Inspector's `selectedActivityVariableId`/`onActivityVariableSelect` optionally
lift the selected variable. The shell owns that identity across an
Activity-origin trace and return, while the panel keeps its local fallback
for standalone uncontrolled use.
Switching narrow Inspector/recorder tabs keeps the selected invocation and
cursor. Stage-anchored Data Trace dimming follows the visible Inspector surface
and is absent from hidden or unstyled Inspector chrome.

### Backtracking views

During an active admitted walk, `TraceDependencyView` opens the central pane in
**Execution**, retaining the workflow context. The built-in renderer overlays
the admitted question's recorded writers and reads; **Variables** is an optional
view of the same question. Its bounded `buildTraceDependencyGraph` projection
identifies each variable by its key and exact recorded writer visit, with
unresolved reads and writers outside the view represented explicitly. Arrows
describe **recorded stage reads**. The existing walk considers all of a stage's reads, so these edges
are conservative evidence rather than exact per-write or expression-level
derivation. This projection does not add another causal walker.

The traced execution view keeps surrounding nodes readable as workflow
context. StageNode's **VIEWING** badge marks the recorded cursor rather than
live execution. This context treatment is separate from run status and does
not assert completion for future steps on the selected rail.

Value previews come from the `StageSnapshot.memory` associated with the named
writer visit, not from whichever cursor moment is currently selected.
`recordedValuePreview` keeps previews bounded and reads inert own data;
missing or unavailable values remain labelled rather than inferred.
The ordinary or consumer-supplied execution chart stays mounted when the reader
switches views, preserving its local state without changing the question or
cursor. Without a usable walk, that chart and the existing missing-evidence
presentation remain in place.

One question-local palette identifies exact variable/writer visits consistently
across the variable map, workflow overlay and read chips. Colors are reading
aids, not additional evidence or a claim that the same key has one writer across
visits. Position and emphasis changes use short 240 ms transitions while
retaining the selected context. `useTraceMotion` observes the live reduced-motion
preference through modern or legacy media-query listeners, with cleanup on
unmount. Motion stays off during server rendering and in unsupported hosts.

The rail uses **Earlier recorded step** and **Later recorded step** for its
one-cursor movement. The walk remains newest-first; moving earlier visits
stops in reverse commit order, including both recorded parents of a fork.
Following a particular input is an explicit variable-node or read-chip action.
The timeline's ordering never chooses that branch implicitly.

A missing `stageReads` means no state reads are listed for that step in this
record. It is presented as **No recorded state reads**, not a proved origin.
The read-tracking dial applies to a whole run, so any recorded read in the root
or child trees establishes that the dial was on. With no recorded reads,
coverage stays unknown; it is not a capture-completeness certificate or exact
read attribution. A mount remains an explicit child-record boundary.

## Following and returning to questions

`useTraceSession` retains the investigation trail as recorded questions, each
with its key, invocation scope, frozen commit cutoff and cursor runtime ID.
Local source follows and admitted child-source hops append the prior question.
Choosing an earlier trail entry restores its question and cursor after checking
the current record still supports them. A changed source, unavailable visit or
withdrawn handoff cannot be revived through an old return callback. This trail
does not create another live cursor or combine the logs. Child-source questions
keep a parent-context pill and **Back** action in the header, so the originating
question remains visible while the child scope is selected.

For recordings with `captureOutputHandoff: true`, `src/trace/subflowHandoff.ts`
admits optional engine-owned `outputHandoff` metadata. The independent
`writeProvenance: 'reads-prefix'` dial additionally retains child-write read
prefixes. Admission checks exact parent/child log
addresses, invocation ancestry, actual parent write rows and bounded child
cutoffs. Only captured handoffs without limitations expose source links.
Their observed-read prefix is conservative, not a claim of per-output
derivation. Missing, partial or invalid evidence leaves the boundary unknown.
Following a source resolves the direct exact child, changes the one selected
scope and re-anchors the question there. Raw cutoffs account for the child's
excluded seed bookend. No child key or commit is inserted into the parent's
rail. The card and copied story format the same admitted source names;
standalone `buildTraceWalk` continues to walk only its supplied scope.
Its optional `runtimeSnapshot` option applies the same native handoff admission
and per-stop cutoff as the shared controller. This adds detached, immutable
`handoffSources` targets, without adding child stops or joining histories. A
missing child unit, path-only alias, manifest entry or partial metadata cannot
supply a source. Without the option, the existing local-only result is unchanged.
Hosts must pair the snapshot with the supplied scope's log and execution tree;
the option does not authenticate or fetch a recording. Keep a frozen agent
question's input snapshot and returned walk together. Loading more evidence
does not mutate that walk; a new question may explicitly use the newly admitted
snapshot. The provider's existing fresh-evidence validation remains separate.
Foottrace's `causalChain` likewise does not automatically cross this boundary;
the host selects a child record explicitly instead of flattening its history
into the parent's log.

The exact first bundle belongs to invocation-start state. Current records
stamp it with the mount runtime ID; engines through 9.33 may use an empty
stamp. Both are excluded from the child's step rail. Card text, tooltips and
copied stories identify only keys actually recorded in the starting data;
neither claims a fresh origin or the writer of pre-pause state.
The dev-only Foottrace parity test checks its start bookend and grouped stops.

Admission of new child evidence has one 100,000-item allowance, counting commits,
write names, tree nodes, child-list members and read names. This is a work
allowance, not a guaranteed number of stages/iterations. A refused budget says
more than the limit was inspected, not the total size of the source. Iterative
rail conversion avoids call-stack exhaustion on long linear histories; any
conversion failure has a distinct drawing-failure notice. Names are capped at
4,096 characters and invocation chains at 128 components / 8,192 characters.
These are local viewer admission limits, not claims that producer data is lost.
Root mount metadata now uses the same bounded descriptor-only admission
helpers and item limit, including root commit/runtime-ID membership. A child
recorded read never certifies a missing root tree node. If that scan fails, all partial labels are discarded
and the root trace is withheld as unknown, so an uninspected mount cannot be
called an origin. The existing value adapter remains separate. Both root and
child walks retain the existing 50-frame / depth-10 traversal policy. A future
common record reader can unify admission rather than silently changing root
behavior in a scoped-navigation change.

Stored names are read from own data fields; values and error text are not
copied by the trace projection. Failed inspection, duplicates, cycles and absent
history remain explicit unknowns. This is not a JavaScript sandbox: Proxy traps
can execute during inspection, and hosts control authentication and the source.
The existing value adapter remains the owner of rail/state conversion.

The projection cache is weakly keyed by the child result, with invocation path
and run-wide read coverage as the selector. Source snapshots are immutable
records; mutating a selected result in place is not a supported update protocol.
An unchanged `runId` preserves the selected child question on a fresh host
snapshot; a different run re-resolves the exact selected chain before any panel
renders, pops unavailable levels, and clears the previous trace question.

The hosting layer must provide a matching cohort of source, snapshots, Story,
result and overlay. `useRunCompanions` quarantines a companion reference known
to be unchanged from a different recorded run before rendering. Source-owned
data supplies the current rail/result/overlay; a source-owned Story wins over
a stale external companion. Without it Story stays explicitly unknown, with no
fallback to the old companion's copied snapshot text. Fresh paired references
restore the view. This is a reference-cohort guard, not cryptographic source
authentication: newly copied but wrongly paired inputs remain the host's
responsibility.

Exact invocation association is required before a child is opened. A result
map containing only a path alias is not proof, even if the visible part of a
record has one visit: the record may be partial. The shell never promotes that
alias to an invocation. Custom snapshot hosts may key results by the actual
mount runtime ID or attach the corresponding result to each `StageSnapshot`.
The old chart-sync synthetic fixtures now include their documented exact keys,
referencing the same objects as their path aliases; every original assertion
is preserved. Real 10.3.0 and legacy 9.15.1 fixture maps already had both keys.
The adapter keeps its prior lookup precedence but only accepts own result
properties; iterative traversal preserves valid-tree output, timing and memory.
Malformed child entries and cycles are refused, never silently shortened.

When a direct nested path crosses repeated ancestors, the chooser carries one
explicit selection per ancestor path until the complete requested leaf opens.
Changing an ancestor never reuses a child projection from another invocation.


## Public scoped trace text

Use the same projection and immutable scope for a human card and an agent tool:

```ts
import {projectTraceInvocation, buildTraceWalk, formatTraceWalk} from "footprint-explainable-ui";
const selected = projectTraceInvocation(snapshot, "pipeline/prepare#8", {
  invocationPath: ["pipeline#6", "pipeline/prepare#8"],
});
if (selected.availability.ok) {
  const walk = buildTraceWalk(selected.commitLog, selected.executionTree, "total", {
    scope: selected.scope,
    runtimeSnapshot: snapshot, // optional captured output handoffs, not a log join
  });
  const text = formatTraceWalk(walk, () => null);
}
```

The exact ID identifies one recorded invocation. A supplied containing chain
must be witnessed at every level; a direct exact lookup establishes the
selected invocation without validating that containing chain. Known breadcrumb
containment and the earlier sources of input data are separate questions.
An invocation's initial state may be input mapping or state restored after a
pause. Only non-undefined own data fields become names-only `startKeys` in the
projected scope. Their earlier origin remains unknown; an absent key is never
called an input. It is not proof of who wrote a value before that boundary. Passing a
scope explicitly to `formatTraceWalk` is also supported; callers using raw
child histories must provide the scope so a mount-stamped start is not called
an origin. Calls without scope derive root mount labels from the recorded tree. Missing
writers are unknown without separately recorded starting keys; absence alone
is never proof of input mapping.

## Navigation and source replacement

Ordinary chart IDs and labels containing slashes navigate the current rail;
only recorded mount metadata starts a drill. Exact runtime IDs select that
visit. Otherwise repeated ordinary steps choose the latest matching visit at
or before the cursor, or the earliest available visit. A new root run preserves
the cursor (clamped for rendering); a missing selected child returns to its
nearest recorded ancestor. Only an actual chain loss raises a notice. Cursor,
chart, breadcrumb and tab movement dismiss transient notices/visit choices.
Chooser buttons have `type="button"` and a Cancel action.

Only non-null object payloads can be known-stale companion references. An
explicit empty array is a host override, not evidence left from a previous run.
Null/primitive inputs do not trigger a banner. Freshly copied but wrongly
paired arrays remain the host's responsibility; this guard is not authentication.

## Offline package reproduction

After the normal build, run `node scripts/check-scoped-trace-package.mjs`.
It packs without scripts or network, replays actual public ESM/CommonJS doors,
and deletes only its private scratch directory. Do not run full suites, fresh
installs/build comparisons, record pilot or installed-type packaging checks
while a shared-host storage measurement is active. Focused development tests
use one worker, no file parallelism and low scheduling priority.
The packed check also replays the detached handoff suite through both public
module formats, using the unchanged real repeated/nested handoff recording.
