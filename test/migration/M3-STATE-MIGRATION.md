# M3: canonical Flow state (unpublished major preparation)

The owner approved the R1/R2/R3 correction direction before this step. M3
implements **state reconstruction only**; historical Why/cause tracing still
belongs to M4/M5. Nothing is released, no export is removed and `/record` is
still a source-only pilot. All 131 root and 125 `/flowchart` names and their
value/type kinds remain. `mergeWritePatch` and `createSnapshots` retain their
standalone caller-owned semantics.

## One owner per layer

- `recordInput` selects the supplied root snapshot or raw child `treeContext`.
  Missing history is not an empty run. Final `sharedState`/`globalContext` is
  never a fold base. Read capture is explicitly unknown in this step.
- `recordState` asks Foottrace for stops and folds. Lens has no replay, path
  operations, bundle grouping or state accumulator. Each stage has its exact
  source-local `commitIdx` and `lastCommitIdx`; its previous state is the
  preceding canonical stop, including a child's input-mapping prologue.
- The existing execution tree still owns presentation order, narrative, labels,
  timings and drill attachments. Tree order does not determine state or diffs.
- `recordStateDisplay` is the shared memory UI policy. It preserves both current
  and previous basis/redaction/gap evidence. Missing bases, skipped rows or
  redaction suppress change classifications and new-key highlights. An
  unavailable state has a reason and never renders as an empty object.

`StageSnapshot.recordState` is additive and optional. Its source label distinguishes
root and selected child scope, but historical child records do not contain a
unique parent execution identity. The label is selection-local, **not a global
run/iteration address**. Existing manual snapshots have no record evidence and
retain their caller-owned memory contract. For compatibility the required
`memory` field is `{}` when reconstruction is unavailable; consumers must check
`recordState` before displaying or using that placeholder.

## Named corrections, no rewritten evidence

The immutable 40 golden outputs and their five 9.15.1 input recordings remain
unchanged. All 23 historical stage rows retain their presentation fields. Exactly
two old memory outputs change:

1. `parallel-fork / obesity#3` includes the earlier hypertension branch write.
2. `parallel-fork / summarize#4` includes both hypertension and obesity branches.

The test names those two values explicitly, compares every other memory to the
old golden, checks every official current/previous boundary, then compares all
non-state fields to the unchanged file. All five old recordings lack a base,
so they now honestly show `basis: log-only` rather than imply complete state.
The real Flow 10 fork independently pins final Join to the producer's actual
`runs.b.x = 9` and `runs.a.y = 2`, not the old tree accumulator's `x = 1`.

Foottrace now owns ordered set/merge/append/delete semantics, including keeping
`set(undefined)` as an own data property, the actual initial base and canonical
array merging. Invalid verbs are not interpreted as sets. A corrupt row has no
invented stage stop; later folds expose its original skipped index and reason.
StageWrites-only and unaddressed records retain their narrative and timing, but
do not pretend that those patches prove a recorded state.

Foottrace 1.0.1 cannot construct its cursor over a sparse array. This step pins
an explicit `reader-refused` result and does not normalize gaps or renumber rows.
Dense invalid rows retain canonical gap qualification. Fixes to cursor support
belong to Foottrace, not a Lens fallback.

Ordinary JSON presentation stays unchanged. Dates, sets/maps, bigints, cycles
and other non-JSON values use the existing bounded record preview instead of
throwing or disappearing through JSON serialization. Previewing does not call
getters or `toJSON`; this is display handling, not a second serializer/reader.

The Shell also withholds its optional causal-card value hint when either state
is qualified, without changing the walk, callbacks or stop order. The card's
pre-existing JSON-ish Map/Set formatting is unchanged and remains a separate
M4/M5 presentation review item, not a second change in this state migration.

## Major preparation and remaining gates

The unpublished `next/lens-1` line now requires Node 22 and Foottrace `^1.0.1`
at runtime. CI runs Node 22/24. Package tests explicitly pin this approved
prerequisite change while retaining both public entries and unchanged peer
requirements. M6 still owns the actual major version, additive `/record` export,
optional dependencies, lazy views and final compatibility/release gates.

Validation: strict source/test types, full tests, immutable golden comparison,
record-pilot isolation and size gates, both module formats, declarations,
publint and attw. No release or baseline regeneration is authorized here.
