# Selected-record tracing

The shell selects one invocation chain. `subflowInvocation` resolves exact paths
and runtime IDs and reports ambiguity; `subflowRecord` projects the chosen
record once and caches its rail and trace names. It filters Story by selected
runtime IDs. `useSubflowNavigation` owns drill resolution, source replacement and transient
visit/notice state; the shell keeps the single timeline cursor.
`SubflowNavigationStatus` renders that feedback separately. The shared pure
owners now live in `src/trace`; old shell-internal paths only re-export them.
`TraceWalkScope` is explicit serializable data on the walk, shared by cards
and non-UI callers. No hidden WeakMap or in-place walk mutation is involved.

A missing `stageReads` is a normal no-read step. The read-tracking dial applies
to a whole run, so any recorded read in the root or its child trees establishes
that the dial was on. No recorded reads stays unknowable; this is evidence of
coverage, not a capture-completeness certificate or exact read attribution.
A mount has its own inner computation and never becomes a no-read origin.

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
  });
  const text = formatTraceWalk(walk, () => null);
}
```

The exact ID identifies one recorded invocation. A supplied chain must be
witnessed at every level; a direct exact lookup leaves ancestry unknown.
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
