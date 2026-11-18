# Foottrace recording reader

Import this entry from `footprint-explainable-ui/record`. It accepts one explicitly
selected Foottrace 2 `TimeTravelSource`, including a saved commit log or a selected
child history. Supply its recorded initial state and source-local read evidence when
available. Foottrace constructs the stops, folds state and explains recorded writes.
The host supplies labels, timing, diagrams and a controlled numeric step.

## Read one revision

```tsx
import { createRecordLensReader, RecordLens } from "footprint-explainable-ui/record";

const reader = createRecordLensReader({ sourceId, source, reads });
const model = reader.at(step, selectedKey);
const stop = model.selected; // Pass this same stop to the host diagram.
<RecordLens reader={reader} step={step} selectedKey={selectedKey}
  onStepChange={setStep} onKeyChange={setSelectedKey} />;
```

Build the reader once per immutable source revision and reuse its `stops` array
while scrubbing. Build a fresh reader when the source, read evidence or grouping
strategy changes. A live producer can batch appends and publish one revision per
batch. If it mutates the source in place, its revision or notification must
trigger reader construction. Stop numbers are local to the selected source
and grouping strategy. The host chooses the new selection when either changes.

`buildRecordLensModel({ sourceId, source, step, reads, selectedKey })` reads the
current source in one call. `RecordLens` accepts these source props directly or
accepts a prepared `reader`. Its buttons request navigation through host
callbacks. Use `RecordTimeSlider` with the same stops and step for a custom
composition. Keep the stop-to-duration mapping stable for the same timing data
and replace it when the host receives revised measurements. A stage's timing
belongs to the source and stop for which it was measured. A diagram can render
any topology and select a recorded stop through the same host callback.

## Canonical state and Backtrack

The default stops include Foottrace's run bookends and phase groups. An optional
Foottrace `strategy`, such as `tagStops(["review"])`, can group the same history
by a producer's recorded tags. The state at a stop includes rows through its
`lastCommitIdx`. A filtered start can include a recorded prologue. Numeric
steps select canonical stops. A raw commit index can differ from that step.

The model refuses an invalid step. An empty source exposes its available base.
Missing base state, skipped rows and redacted values remain visible. Backtrack
uses the selected fold boundary, validates each row in that prefix and retains
the original commit addresses. A gap in that prefix makes the causal query
unavailable. A later gap cannot change an earlier answer. Foottrace owns the
returned slice and its prose. Missing read evidence remains unknown.
A prepared reader retains a small window of canonical folds for reverse playback
and recent compact answers keyed by stop and recorded path. Large causal
graphs, large writer values and native payloads are returned directly from the
canonical query and recomputed on the next request. A new reader starts with
empty caches. An uncached historical question still uses the exact prefix at
the selected stop. Top-level change detection uses Foottrace's equality operation.

With a prepared reader and controlled step/key callbacks, a viewer can follow a
recorded ingredient writer and return to the original question. For example, a
recorded `total = 35` can point to the Items amount of 30 and the Delivery amount
of 5. Link admission requires a direct Foottrace data edge, the queried write's
own read evidence, one exact writer row, and a canonical stop showing its value.
The host can also read these destinations from `model.writerStops`. A qualified
edge, an ambiguous writer, or a grouped stop that folds later writes retains
Foottrace's explanation. Returning restores the host's original step and key and
focuses the Follow button. Changing reader revisions discards the return address.

### Follow a write into a subflow

Pass the native snapshot, including its child logs, to `createRecordLensReader`.
A scope is the path of **runtime mount IDs**. A child and its parent can both
have a step numbered 1. Keep the scope, step and selected key together when
following a writer. The slider and diagram can read the same position:

```tsx
const [cursor, setCursor] = useState<RecordBacktrackPosition>({
  invocationPath: [], step: 0, key: ["receipt"],
});
const scoped = cursor.invocationPath.length ? reader.forScope?.(cursor.invocationPath) : reader;
const move = (step: number) => setCursor(current => ({ ...current, step }));

return <>
  {scoped && <RecordTimeSlider stops={scoped.stops} step={cursor.step} onStepChange={move} />}
  <RecordLens reader={reader} step={cursor.step} invocationPath={cursor.invocationPath}
    selectedKey={cursor.key} onStepChange={move} onPositionChange={setCursor} />
</>;
```

`onPositionChange` receives the complete address for both Follow and Return.
A headless host can call `await scoped.backtrack(step, key)` and map each returned
writer to a replay stop with `reader.positionOf(writer)`. For a scope-aware reader,
`at()` gives the synchronous state and local slice. The scoped query returns
direct `writers`, optional stage-read `candidates`, optional mapper `handoffs`, and `gaps`. Each candidate
identifies the commit that supplied a read. Its presence alone cannot establish
which write used that read. The UI lists candidates under “Recorded stage reads”. A selectable candidate opens its own question on the shared cursor.
A mapper read includes its exact source address. RecordLens shows it under
“Recorded handoff reads” and lets the host follow the address across scopes.
A covered payment recording can link the parent’s `receipt` to the `Charge`
step that wrote the child’s `txnId`, even if the parent has its own `txnId`.
A policy marked off reads “not collected”. A missing collection note reads
“collection unknown”. Missing child data, redaction and incomplete evidence
remain visible at the boundary.

The [fixture and package checks](../../pilots/record-lens/README.md) exercise
saved Flow and HCI records and both JavaScript module formats.
