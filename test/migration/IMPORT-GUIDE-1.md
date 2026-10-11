# Lens 1.0 import guide (unreleased candidate)

Do not install a claimed 1.0 release from these notes: this is a candidate
review guide. The npm package is still named `footprint-explainable-ui`.
The future major requires Node >=22. Existing installations on 0.x remain
unchanged until their owners choose to migrate.

| Current use | First-major import | Installation responsibility |
| --- | --- | --- |
| Themes, Shell, TraceViewer and existing root helpers/types | Keep `footprint-explainable-ui` | React; graph views additionally need the graph peers below |
| Existing graph renderers, recorders and `/flowchart` types | Keep `footprint-explainable-ui/flowchart` | React, ReactDOM, XYFlow and Dagre |
| Generic read-only record viewer/model | New `footprint-explainable-ui/record` | React; Foottrace is the package's required dependency |
| Foottrace readers and record types | Keep `foottrace` | Import from their owning package, never via a Lens alias |
| Foottrace writers/path helpers | Keep `foottrace/write` / `foottrace/paths` | Unchanged |
| Why Lens entries | Keep `agentfootprint-lens` | Wait for the separately tested compatibility bridge |

Every historical root and `/flowchart` name remains, including duplicate
homes, `mergeWritePatch` and deprecated graph helpers. Deprecation is still
advice to prefer the replacement, not a removal in this major.

For an existing graph application, explicitly install the peers it actually
uses: `@xyflow/react` in `^12.0.0`, `dagre` in `^0.8.5`, and `react-dom` in a
version compatible with the application's React (React and ReactDOM accept
`>=18.0.0`). TypeScript graph consumers may also need the normal `@types/react`,
`@types/react-dom` and `@types/dagre` development packages. Those graph peers
are optional at the package level, not auto-installed for a record-only user.

The new entry can be used without either producer runtime:

```tsx
import { RecordLens, type RecordLensInput } from "footprint-explainable-ui/record";

export function SavedRecord(props: RecordLensInput) {
  return <RecordLens {...props} />;
}
```

The host supplies one selected record, its actual starting state when known,
the source-local cursor, and matching read evidence when available. It does
not pass the final shared state as a fabricated starting state. Record gaps,
unknown reads and redaction remain qualified; the viewer does not infer
missing evidence or combine unrelated records. The pure model builder is
`buildRecordLensModel` from the same entry. None of these new names is exported
again from the root.

The composite graph view is lazy, so loading and graph-unavailable states are
now explicit; its SSR may produce a loading fallback. Direct `/flowchart`
imports retain synchronous graph behavior. Existing custom graph renderers
remain supported. State and causal-answer corrections are separately named
in the migration correction ledger and M3–M5 notes; this guide does not hide
them as packaging changes.

Before release: prove the Why bridge on Flow 0.34.0, 0.38.0 and this exact
candidate, then rehearse each consumer independently. No consumer range is
widened or package published by M6. Viz remains private.
