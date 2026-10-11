# Flow record input seam — M2, source only

Current use: the unpublished M3 major-preparation branch calls this seam from
its canonical state adapter. The M2 contract below is unchanged: this module
only selects/validates the envelope; Foottrace interprets the record. See
`test/migration/M3-STATE-MIGRATION.md` for the approved state corrections.

`adaptFlowRecord` recognizes an explicitly selected source envelope and hands its
record fields to Foottrace. It does not replay, query causes, choose a cursor,
discover a child, or replace any existing Flow view. It is not exported from the
package. Every existing root and `/flowchart` name, including `mergeWritePatch`,
remains unchanged.

## Contract

- The caller supplies a nonempty `sourceId`, chooses `snapshot` (`commitLog`),
  `subtree` (the public subtree snapshot's `history` / `executionTree`), or
  `tree-context` (a selected subflow result's `history` / `stageContexts`), and
  passes that source object. If both log fields exist,
  only the explicitly chosen field reaches Foottrace. No fallback or joining.
- `initialState` is the only recorded base. Its object reference is retained;
  omission remains omission and is labelled `missing`. An explicit `{}` remains
  a recorded base. `sharedState`, a tree context's final `globalContext`, stage writes and another source's state are
  never used as substitutes. Malformed base objects are refused.
- The selected array and each row retain their identity and positions. There is
  no row validation, filtering, renumbering, filling sparse holes or early fold.
  Foottrace's public readers qualify gaps when the selected prefix crosses them;
  a corrupt future row must not invalidate an earlier state query.
- Reads must explicitly be `unknown` or a supplied official `KeysReadSource`.
  The strategy and its optional `ReadsCoverage` are retained verbatim. Counts of
  steps with reads are telemetry, **not proof of complete capture**, and supplied
  empty reads do not establish independence. No tree walk extracts reads here.
  The host must supply read evidence from the same selected source, including
  zero-write readers. The adapter cannot prove that caller assertion.
- No complete-log claim is inferred from length or a last row. If the host knows
  a recording is truncated, that qualification must remain visible in its view.
- `executionTree` and `subflowResults` remain the same unknown structural values
  accepted by Foottrace's public `TimeTravelSource`; they are not claimed to be
  validated trees. Foottrace owns cursor interpretation/refusal. Selecting a
  subtree means passing its own source, not borrowing a root tree or log.

`accepted` means only **an accepted envelope**, not a valid or complete record.
Any consumer must preserve the canonical `FoldedState.basis`, `skipped`,
redaction and causal honesty fields and expose canonical reader refusals. It
must not turn a row with a missing verb into `set`, or a missing writer into a
known input. Per-write evidence stays on the untouched rows; supplied stage
reads never replace it.

## Supported evidence and limits

The checked-in real Flow 10 root/child, interleaved fork, HCI 3 and Flow 9.15.1
linear and raw subflow recordings exercise the seam. The older ones have no base and stay `log-only`;
this is not a claim to understand every historical recording. A `stageWrites`-
only envelope has no usable log and is refused, not replayed by another engine.
An explicitly empty array is distinguishable from an absent log.

Foottrace 1.0.1's cursor currently refuses sparse arrays, while `stateAt` can
report those holes. Tests preserve that limitation and the original row address;
no Lens workaround normalizes it. Malformed descendants in a stored tree are
likewise not validated here. Adding a robust canonical tree/row reader belongs
in Foottrace before a production consumer can claim support for those cases.

Run `npm run test:record-pilot` on Node 22+. Focused seam checks are in
`pilots/record-lens/record-input.pilot.ts`. M2 changes no exports, dependencies,
package version, Node floor, fixtures, existing algorithms or release policy.
