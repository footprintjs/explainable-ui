# M5 — canonical variable tracing (unreleased)

This is the approved R2/R3 continuation of M4 on the unpublished major branch.
All 131 root and 125 `/flowchart` names and existing required public fields
remain. `mergeWritePatch`, package version, dependencies, entry points, peers,
CI and all 40 goldens/11 producer fixtures are unchanged. No release is part
of this work.

## Ownership and positions

`traceSource` selects an explicit source and exclusive prefix; omission in the
retained positional `buildTraceWalk` API means the full supplied source. Its
official guard checks every selected row without filtering or renumbering.
Zero is valid; fractional, negative, nonfinite and outside bounds refuse.
Future malformed rows do not poison an earlier explicit query. Whole saved
tree validation remains Foottrace's responsibility and can refuse malformed
tree evidence even when the log prefix is valid.

`sliceForKey` owns the root writer and causal slice, with explicit stage
attribution, depth 10 and 50 nodes. `flattenCausalDAG` owns graph flattening;
`buildCommitIndex` supplies each execution's first/read anchor. Each keyed
edge composes `findLastWriter` before that child's read anchor and retains
the returned bundle's exact source-local index. There is no Lens replay,
path parser, writer scan, read-tree walk or BFS fallback.

One stage can contribute `x` at row 1 and `y` at continuation row 3. One stage
can even contribute `x` at two different rows to different children. Optional
`readCommitIdx` and `contributedWrites` preserve those facts while required
`commitIdx` stays the stage's representative address (the anchor uses its
exact writer). These are not interchangeable with the grouped rail stop.
Navigating to A still visits A, even if A's later contribution is physically
within B's grouped stop. Card/copy label the actual rows explicitly. Loop
pass numbering and the existing stage navigation callback are preserved.

## Honest display, copy and previews

Canonical read coverage, depth/node truncation, unknown origins, untracked
sources, nested contributions and redaction reach the shared presentation.
No writer means no *recorded* writer in this prefix, not a known input.
Missing reads cannot establish independence. A separately validated whole
record `keyTimeline` may supply a labelled future first-write hint; failure
of that optional query does not invalidate the historical answer.

`commitValueAtWithBasis` reads each contribution at its exact recorded row,
using only a genuine `initialState` if supplied. The Shell never borrows
current rail memory or final sharedState for the preview. Optional
`valueBasis` preserves the official qualifiers. Qualified values suppress
an exact `=` preview; multiple same-key writer rows also suppress a scalar
and list the ambiguity. For distinct keys the displayed first-key preview
is explicitly named. Card and Copy story use the same qualification and
position sentences; Foottrace's older absence prose is not reinterpreted as
proof of an input. Value formatting uses the existing bounded presenter,
without invoking payload getters or `toJSON`. Optional host preview errors
are contained. Clipboard rejection is visible and stale completions cannot
claim success for a replacement walk.

Investigation resolved without an owner fix: Foottrace's established object
record convention treats own `undefined` as a full-mode deletion spelling.
Its fold can retain a physical own key while its value query reports
`deleted`. Paired tests preserve both facts, and presentation says
"deleted/undefined value (record convention)" rather than asserting physical
property absence. No record bytes or record-owner semantics changed.

## Session contract

The Shell freezes the recording reference and the selected canonical bound.
Normal scrubbing does not move the question. Follow accepts only an ingredient
from the exact active query; show-all restores the original question; exit
keeps the cursor. A shared session-ownership check rejects old/foreign
callbacks. Replacing a same-length recording with identical IDs invalidates
the session before old callbacks can act. Drilling into a child ends root
tracing; it never reuses root evidence for colliding child IDs. Source labels
are not authenticated provenance. Hosts supplying both explicit snapshots and
a recording remain responsible for pairing them consistently and replacing
the recording object when its contents change.

The existing unstyled Shell has no Inspector/Data Trace entry point. M5 does
not add one. Direct Card tests cover both presentations; real Shell session
tests cover its existing styled path and source/style replacement.

## Evidence

- Six new regressions failed against the untouched M4 production source before
  implementation: own/repeat address, per-key continuation address, missing
  origin, depth truncation, malformed future row and source-session reuse.
- `canonicalTraceWalk.test.ts`: real unchanged fork plus exact synthetic
  continuation and same-key fan-in oracles, stronger interleaving that changes
  the read key between own and repeat rows, boundaries/gaps, literal paths,
  stage ceiling, budgets and canonical value/read qualifiers.
- `ExplainableShellTraceSession.test.tsx` and existing tracing tests: exact
  continuation preview versus rail address, zero/mismatched bounds, stale and
  foreign callbacks, replacement and retained follow/show-all/exit navigation.
- `TraceWalkEvidence.test.tsx`: both Card styles, shared copy qualifiers,
  ambiguous/qualified values, off-walk frozen preview, bounded non-JSON values,
  callback failure and delayed/rejected clipboard outcomes.
- Historical diagnostic assertions change only under named R2/R3 corrections;
  old observations remain in `corrections.json`. No immutable golden or
  producer file is regenerated.

Independent review and all unchanged Node 22/24, coverage, build, pilot
isolation/size and packaging gates remain required before a checked merge.
