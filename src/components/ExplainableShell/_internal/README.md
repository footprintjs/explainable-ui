# Selected-record tracing

The shell selects one invocation chain. `subflowInvocation` resolves exact paths
and runtime IDs and reports ambiguity; `subflowRecord` projects the chosen
record once and caches its rail and trace names. It filters Story by selected
runtime IDs. The shell owns the one timeline cursor and source-run change.
`tracePresentation` supplies internal card/copy metadata without changing the
published walk or card types. `dataTrace` and `traceWalk` still own traversal.

A missing `stageReads` is a normal no-read step. The read-tracking dial applies
to a whole run, so any recorded read in the root or its child trees establishes
that the dial was on. No recorded reads stays unknowable; this is evidence of
coverage, not a capture-completeness certificate or exact read attribution.
A mount has its own inner computation and never becomes a no-read origin.

The exact first mapper bundle belongs to the child input boundary. Current
records stamp it with the mount runtime ID; engines through 9.33 may use an
empty stamp. Both are excluded from the child's step rail and described in
card text, tooltips and copied stories as input mapping at that invocation.
The dev-only Foottrace parity test checks its start bookend and grouped stops.

Admission of new child evidence has one 100,000-item allowance, counting commits,
write names, tree nodes, child-list members and read names. It now admits normal
1,000-iteration histories. A refused budget says too-large and reports work
items observed, rather than calling the record incomplete. Names are capped at
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
The exported legacy snapshot adapter is unchanged.

When a direct nested path crosses repeated ancestors, the chooser carries one
explicit selection per ancestor path until the complete requested leaf opens.
Changing an ancestor never reuses a child projection from another invocation.
