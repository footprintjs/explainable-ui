# Recorded scope loading and preparation

`../progressiveRendering.ts` is the public facade. A source binds one immutable root recording, its graph and exact invocation cache. `source/` owns delivery/publication; `prepare/` admits child data before the existing converter; `scheduler/` chooses task/idle/frame boundaries; `worker/` is an optional explicit preparation transport. These modules have no engine runtime or D3 dependency.

The host supplies a complete child unit per request. Optional host preparation is trusted executable code and must preserve the supplied recording. The matching built-in worker handler calls the canonical preparation path. Loading a scope does not attest its provenance: the existing Backtrack readers still admit history, addresses and output handoffs independently.

Scope count and per-unit admission are bounded. A full retained cache refuses new scopes rather than evicting Backtrack return data. The owner creates/disposes the source; a view releases only its own interests. Tests are in `test/unit/recordingSource*`, `progressiveScheduling*`, `preparationWorker*` and `test/component/ExplainableShellLazy*`.
