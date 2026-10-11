# M4 — canonical Data Trace (merged, unreleased)

This document preserves the scope at M4 merge. The subsequently approved
M5 replacements and tests are described in [M5-TRACE-WALK.md](./M5-TRACE-WALK.md).

The shared Data Trace helper now projects Foottrace's causalChain and
flattenCausalDAG. Its old BFS, writer scan and read-tree walker are deleted.
Both current callers use the replacement; there is no legacy fallback.

The private source adapter selects one M2 recording and an exclusive boundary.
It narrows every prefix position with the official isCommitBundle guard,
including holes. Refused rows inside the prefix make causality unavailable;
rows after an explicit boundary are not folded or validated. No rows are
filtered/reindexed. M3's canonical stop supplies the Shell boundary. Older
caller-owned snapshots without evidence need an official cursor to resolve
one; a cursor failure is visible, never a whole-log fallback.

Depth 10, 50 frames and stage attribution remain explicit. Invalid numeric
budgets are refused. Canonical graph/read coverage, truncation, untracked
sources, pre-run reads, nested edges and redaction are retained. Observed
reads do not establish completeness, even with positive coverage. Unknown
trees stay unknown; malformed trees are refused by the owner. Validation
covers the supplied whole tree: a future malformed tree node can still
refuse a query. There is no local walker that silently omits it.

Both panel callers share the qualification note. Neither the last BFS frame
nor missing edges prove an origin or independence. Child Shell selections
remain explicitly unsupported, not root-paired. Source IDs are local labels,
not authenticated recording identities. Replacement recordings are queried
afresh and out-of-range cached boundaries refuse. The runtime-only Shell path
recomputes its snapshots and positions when the recording changes, including
same-length recordings with repeated IDs at different positions. Hosts that
supply both explicit snapshots and a runtime recording must pair those inputs
consistently; a source label is not proof that arbitrary host inputs match.

The variable picker separately skips unreadable inventory rows so a future
gap cannot crash an earlier valid inspection. Causal queries still refuse
gaps in their own prefix. Four synthetic graph/navigation scenario builders
now include set verbs/payload containers; the untouched path-only input
remains an explicit refusal test. All 40 golden files and 11 producer
fixture/provenance files remain unchanged.

## Merge gate and deferred work

The separately reviewed and publicly verified Foottrace 1.0.3 fixes the saved
path guard defect found in 1.0.2. This branch requires the genuine registry
package at ^1.0.3. Focused regressions alter only the path of a real producer
row: missing/numeric paths are refused by the official guard before either
short- or indexed-log causal lookup; malformed future rows do not spoil an
explicit valid prefix. Both panel variants and the Shell show refusal rather
than an invented origin. No Lens path validator was added. Independent Lens
review and all unchanged release-branch gates still govern the M4 merge.

M5 still owns traceWalk's independent writer/ingredient/address inference,
formatter and non-JSON preview corrections. It currently discards canonical
status/notes/depth-truncation and retains its old unproven input wording.
That residual is not claimed fixed by M4.

DataTracePanel styled/unstyled qualification and callbacks are tested.
The existing unstyled Shell has no Inspector/Data Trace surface; adding one
would be a separate UI change, not a hidden addition here.

This is an unreleased major-branch draft. All public names and required public
fields remain; no publication, optional-peer or new-entry-point work is done.
