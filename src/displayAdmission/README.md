# Shared bounded display reader

Internal support for the Investigation and FailureExplanation display schema parsers. The package root exposes their public checks, immutable primitive limits and display result types; it does not expose this reader or its refusal machinery.

Each parser preserves its own field order, ignored fields and consistency rules. Text uses UTF-16 code units and counts repeated retained occurrences. A per-field text limit is checked before debiting the aggregate text budget. Array length is captured from its own descriptor and charged before visiting entries. Lists are copied without caller iterators/methods; missing entries stay undefined for the existing schema callback to refuse at the same point. Investigation arrays remain owned mutable copies; the Failure parser freezes its own outputs.

Success freezes the result and exact parser usage. Refusal contains one frozen diagnostic/path and no partial value or usage. Paths have at most8 closed schema segments, with array indices0..1024. Invalid internal paths or metadata fall back to one fixed unreadable-input diagnostic. Diagnostics never include source values, IDs, references or foreign error details.

Deliberate refusal tokens are identified solely by a module-private WeakMap. Catching a foreign object/function/revoked Proxy performs no property, prototype, instanceof or string conversion. Own-descriptor reflection can still invoke JavaScript Proxy traps; this is not a JavaScript sandbox.

No automatic trimming, limit increases, graph traversal, logging, text-part interpretation, severity inference or causal authentication lives here. Future fields remain ignored unless their owning schema explicitly opts in through a separately approved change.
