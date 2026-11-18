# Scoped Backtrack

The record reader and the Shell use this folder to answer “which recorded step wrote the source of this value?” In the Payment recording, the output mapper links the parent’s `receipt` to the child’s `txnId`. Even though the parent also wrote a `txnId`, the mapper’s child log address and cutoff select the Charge step.

A query identifies one invocation path, state key and exclusive commit index. The path is a chain of runtime mount IDs, so repeated visits to the same subflow have separate histories. A writer address includes the run, invocation path, local commit index, runtime stage ID and key. Local commit indexes include the child’s seed. The result gives the selected writer, its directly recorded sources and any gaps. A partial record can supply both a navigable source and a gap.

- [nativeGraphScopes.ts](./nativeGraphScopes.ts) admits the root and exact child histories. It binds capture notes, scalar read sources and mapper observations to the log that owns them.
- [graph.ts](./graph.ts) asks Foottrace for the writer and its direct data parents. It checks the source key at the recorded mapper cutoff before exposing a cross-scope destination. The caller owns replay navigation.
- [load.ts](./load.ts) lets the Shell request the optional `foottrace` and `foottrace/cause` entries when a scoped question needs them. Hosts using the recording entry can call the reader directly. [Record reader usage](../record/README.md)

## Gap codes

Each gap carries its invocation path, code and display sentence. A *bound note* here means a recognized v1 or v2 in-memory root capture note whose run ID, log address and full commit interval agree with the recorded root. Only that root can use its coverage. For example, default Payment records explicitly set write provenance to `off` and omit the output-handoff descriptor. At the mount, Backtrack therefore returns both `prefix-off` and `output-unknown`.

| Code | Display sentence | Evidence or query condition |
| --- | --- | --- |
| `untracked-input` | The record does not identify an earlier writer. | Foottrace finds no writer for the selected key before the cutoff and reports no redaction, or returns this gap for a source read. |
| `nested-rows` | This step wrote only part of the selected value. | Foottrace identifies a write inside the selected key with the `nested-rows` basis. The write covers a member of the requested value. |
| `ambiguous` | The recorded read has more than one possible writer. | The read window contains multiple candidate commits, counting the writer before the window and writes during it. |
| `writer-address-unverified` | The exact recorded writer address could not be verified. | The writer lookup or graph edge cannot be matched to the exact scope, commit, runtime stage and key. Also used for an unverified view-based write, a legacy path encoding, or a read window that cannot establish the proposed parent. |
| `no-match` | No matching recorded read in this interval. | The root log and tree pass validation. Its bound note records a completed interval, full reads, captured reads and writes, read prefixes, and the supported modes and limitations. The selected key has one trace row with an explicitly empty read prefix and the stage has no listed reads. No direct parent or competing gap was found. |
| `collection-unknown` | Read collection unknown. | An empty answer lacks the coverage needed for `no-match`. Also used for an unrecognized fan-out inventory, or supplied root scalar-source evidence whose ownership or contents cannot be admitted. |
| `reads-off` | Stage reads were not collected. | The bound note marks stage reads disabled. |
| `writes-off` | State writes were not collected. | The bound note marks writes disabled. |
| `sources-off` | Read sources were not collected. | The bound note or the scalar-source observation bound to this address and interval marks the source channel disabled. |
| `prefix-off` | Per-write reads were not collected. | This scope’s effective write provenance is `off` and the selected write has no recorded read prefix. |
| `reads-partial` | Stage read capture was partial. | The bound note marks stage reads partial. |
| `writes-partial` | Write capture was partial. | The bound note marks writes partial. |
| `partial` | Read source capture was partial. | The bound note or bound scalar-source observation marks read sources partial. |
| `failed` | Evidence capture failed. | The bound note marks reads failed. A capture limitation can also report `source-capture-failed`, `read-retention-failed` or `commit-retention-failed`. A `failed-slot` or `capture-failed` reason produces this gap too. |
| `writes-failed` | Write capture failed. | The bound note marks writes failed. |
| `sources-failed` | Read source capture failed. | The bound note or bound scalar-source observation marks read sources failed. |
| `redacted` | Privacy settings withheld recorded evidence. | Foottrace reports redaction for the selected key at the query cutoff or for a mapper source at its own cutoff. A graph or capture limitation can also report privacy or redaction, including `privacy-active`, `redaction-active`, `redacted-export` and a bound `redacted-source-export`. |
| `budget` | Capture budget limit reached. | Capture reports `budget-exhausted` or `branches-truncated`, the adapter reaches its admission budget, or Foottrace reports `truncated`, `node-limit`, `edge-limit`, `depth-limit` or `call-limit`. |
| `missing-child` | Missing child record at the subflow boundary. | The requested scope is absent, a recorded mount lacks a child history with the matching run and exact invocation path, or a collection reports `missing-child-record`. |
| `output-unknown` | Output handoff collection unknown. | The child history is available but its mount has no output-handoff descriptor. |
| `input-unknown` | Input handoff collection unknown. | The selected write is the child’s seed at commit zero and its mount has no input-handoff descriptor. |
| `scope-boundary` | The record does not establish this subflow handoff. | The selected output descriptor yields no verified foreign writer, a partial input descriptor is missing its limitation, or a required mapper cutoff cannot be verified. Foottrace can also report a scope boundary. |
| `fanout` | Fan-out slot has no recorded key mapping. | The collection identifies the selected parent commit, runtime stage and key. Foottrace reports a scope boundary for the collection without an invalid-data refusal. |
| `unavailable` | Some recorded sources are unavailable. | Foottrace reports missing or unavailable source evidence while opening or inspecting the graph. |
| `invalid-data` | The recorded evidence could not be read. | The query cutoff is outside the scope or conflicts with a pinned visit, a scope or graph record fails validation, or the reader fails without a more specific code. |
| `unsupported` | The recording uses an unsupported evidence format. | Foottrace rejects an unsupported source format or feature. An unrecognized native capture-note version supplies no coverage for `no-match`. |
| `cancelled` | The Backtrack query was cancelled. | The query’s abort signal fired, or Foottrace reported cancellation. |

## Forwarded limitations

The following codes retain the reason supplied by the mapper, collection or Foottrace. They share the fallback sentence in the display column. The last row also covers future reason strings.

| Code | Display sentence | Evidence or query condition |
| --- | --- | --- |
| `explicit-output` | Recorded evidence is incomplete. | The child supplied an explicit output to the mapper, or a fan-out slot supplied an explicit output. The observation does not map that value to child state keys. |
| `output-mutated` | Recorded evidence is incomplete. | The output mapper mutated the child state view during observation. |
| `commit-time-read` | Recorded evidence is incomplete. | The handoff records a read during commit. |
| `parent-log-advanced` | Recorded evidence is incomplete. | The parent log advanced after the input mapper’s captured cutoff. |
| `resume-seed` | Recorded evidence is incomplete. | A resumed run supplied the child seed. |
| `selector-reads-unavailable` | Recorded evidence is incomplete. | The generated input’s selector had no usable read prefix. |
| `timeout` | Recorded evidence is incomplete. | Foottrace reports that the graph operation timed out. |
| `cycle` | Recorded evidence is incomplete. | Foottrace reports a cycle. |
| `strategy-failed` | Recorded evidence is incomplete. | Foottrace reports a failed evidence strategy. |
| `not-checked` | Recorded evidence is incomplete. | Foottrace reports that the evidence was not checked. |
| `stale` | Recorded evidence is incomplete. | Foottrace reports stale evidence. |
| `incompatible` | Recorded evidence is incomplete. | Foottrace reports incompatible evidence. |
| `not-permitted` | Recorded evidence is incomplete. | Foottrace reports that access to the evidence was not permitted. |
| Other forwarded code | Recorded evidence is incomplete. | A selected handoff limitation or reader refusal supplies a code without a dedicated sentence. |

Foottrace’s general graph reasons `not-collected` and `conservative` are filtered when reading graph gaps. Channel-specific capture facts, mapper descriptors and the coverage check determine the displayed answer. At a mount, the adapter also replaces the graph’s general `scope-boundary` reason with the available handoff evidence.
