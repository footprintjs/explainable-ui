# Record Lens — source pilot

This is an experimental source module, **not a published entry point**. Existing
`footprint-explainable-ui` imports, required peers, runtime dependencies and Node
support are unchanged. There is no installable `footprint-explainable-ui/record`
export yet. The pilot runs on Node 22+ with Foottrace 1.0.0 as a development-only
dependency; choosing a supported public package contract requires a separate review.

## Boundary

The host supplies one explicitly selected Foottrace `TimeTravelSource`, a stable
source label, its numeric stop, and optionally `KeysReadSource` and a `StateKey`.
`buildRecordLensModel` calls Foottrace's public cursor, fold, equality, slice and
formatter functions. It does not replay patches, infer branch structure, inspect
an agent, walk an execution tree, or implement another causal algorithm.

`RecordLens` is a read-only React facade over that model. Step/key callbacks are
navigation intentions, not application actions. The host owns the selection,
including switching to a nested source and supplying the matching read evidence.
There is no implicit source discovery, background model request, or rerun.

## Honest display

- An invalid cursor refuses; it never selects a neighbouring state silently.
- An empty source displays its available base without inventing a recorded step.
- Missing starting state, redaction and skipped rows remain visible.
- Causal queries validate the selected prefix, preserving original row addresses.
  A gap refuses the explanation; a future gap cannot affect an earlier question.
- Missing read evidence remains unknown. Even supplied evidence does not establish
  that every dependency was captured. Foottrace's explanation and notes are retained.
- Top-level changes use Foottrace equality; value previews are abbreviated display
  text, not serialized evidence. Special values and cycles do not become empty data.

The viewer uses the existing theme tokens. Existing snapshot-based panels remain
unchanged: they have their own input contracts and JSON-only presentation, so this
pilot does not pass arbitrary record values through those adapters.

## Verification

See `../../pilots/record-lens/README.md` for independent fixture, browser-bundle,
declaration and normal-package checks. Pilot outputs are built in scratch space,
not added to the package's two existing build entries or its shipped `dist`.

Not included: nested-source discovery, HCI action dispatch, agent features, Viz
branch merging, export/video generation, public versioning or consumer migration.
