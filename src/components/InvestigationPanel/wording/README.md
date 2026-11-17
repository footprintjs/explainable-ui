# Investigation wording owner

Only `../wording.ts` is the consumer facade. `banks.ts` owns the unchanged 23 gap
sentences and eight default mark names in private frozen primitive banks.
`gapMessage.ts` rejects runtime nonstrings and strings beyond the longest fixed
key before own-key lookup; unknown codes return `undefined`. The package root
selectively exports only `investigationGapMessage`, never either bank or the
private mark resolver. Wording has no dependency on admission.

`markLabel.ts` resolves one used admitted kind with at most one own descriptor
lookup. Nonempty data strings up to 512 UTF-16 units replace the default, even
when equal to the raw kind. Every other entry keeps the exact built-in/raw-kind
fallback. There is no trimming, coercion, map enumeration/retention, getter call,
callback, cache or foreign-error inspection. Proxy descriptor traps remain host
code and can execute or fail; this is not a sandbox or a time bound.

Host map replacement affects text only. It does not change canonical marks,
evidence, parser/checker accounting, source binding, selection or query ownership.
The 4,112-lookups-per-render ceiling follows existing mark/list caps; it is a
derived maximum, not measured work or a whole-map bound. Integration proof and
both badge sites are owned separately; these pure helpers do not render HTML.
