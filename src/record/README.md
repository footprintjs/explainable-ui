# Record facade

`footprint-explainable-ui/record` is the isolated record-view entry in the
unpublished 1.0.0 candidate. It exports only the Lens-owned viewer, model builder
and their input/output types. It is not re-exported from the root or `/flowchart`.
Foottrace's reader, writer, path and record types keep their existing Foottrace
entry points; this directory does not create aliases or another record engine.

The host selects one `TimeTravelSource`, gives it a source-local label and owns
the numeric cursor step. An optional `KeysReadSource` must describe that same
source. The facade never discovers, combines or drills into sources. It uses
Foottrace for stops, state, equality and provenance, preserving missing bases,
unreadable rows and redaction evidence. Its small value preview is bounded and
does not execute getters or `toJSON`.

Runtime dependencies of this entry are React and Foottrace only. No graph
renderer, engine, agent, HCI or private Viz code is imported. Do not import the
root barrel from here: it is a different, composite surface. Changes to the
entry must pass the actual packed-package installation and declaration checks
in `pilots/record-lens/verify-package.mjs`, including the unchanged 50 KB
vendor-excluded budget and dependency-leak negative controls.

The original source pilot and its 86 behavior tests remain. M6 changes the
installation/export boundary, not its record-reading semantics. Provenance
prose still delegates to Foottrace's formatter; it is not the Flow Lens's
stage-attributed narrative. See `test/migration/M6-PACKAGE-CONTRACT.md` for the
unpublished-major contract and remaining release gates.
