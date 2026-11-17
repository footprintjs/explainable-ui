# Investigation display admission

`checkInvestigationAttention(value)` and
`checkInvestigationExplanation(value, requestedNodeId, projection?)` use the same
detached parser as the existing internal admit wrappers and components. A success
returns its admitted `value` and exact parser-counted `usage` (`textCodeUnits`,
`listItems`). A refusal returns one bounded schema-only diagnostic, no partial
value and no claimed complete cost. Diagnostics never contain opaque IDs,
references, input values or foreign exception details; logging remains host-owned.

The default `text` profile intentionally leaves `backward` and `impact.edges`
unread and absent. The explicit `relationships` overload preserves and validates
only supplied bounded visual data, including membership, path adjacency and the
existing supported-root consistency rules. It does not discover links or rewrite
root/confidence when forward coverage is incomplete. Existing public display
props, host binding, query budgets and generic refusal wording remain unchanged.

The frozen `investigationDisplayLimits` supplies the actual parser caps: 65,536
retained UTF-16 units total, 2,048 per free-text string, 256 per nodes/path/alternative
list, 16 marks per item, 32 references per evidence list, 128 gaps per gap list and 512
edges per visual edge list. Investigation has no aggregate list-item cap.
Repeated retained occurrences count again; validated fixed enum values do not
consume the free-text budget. Query limits do not guarantee a result fits display
limits. No trimming, list deduplication or automatic logging is performed.

`checkTypes.ts` describes only the UI fields that each profile retains; it does
not add an external graph/resolver type or duplicate the separate declaration
boundary fix. The canonical gap bank lives behind `wording.ts`. Host node-label lookup
keeps its prior node-ID fallback, separate from explanation refusal diagnostics.
# Other candidates

The shared standalone/grouped view omits the selected item's exact ID only from
the rendered **Other candidates** navigation list. It preserves every other ID's
order and explicitly notes supplied selected-item membership. Selected-only and
originally empty lists stay distinct; neither establishes a root cause. Canonical
`alternatives`, checker projections, admission limits, attention, gaps and graph
membership are unchanged. Labels and namespace basenames never determine identity.

## Optional directional coverage

`coverageMode` accepts `overall` (default) or `directional` on both investigation
components. Standalone directional mode reuses relationships admission; overall
keeps backward/impact-edge fields unread. Grouped already admits relationships.
The host supplies evidence; presentation does not query or manufacture it.

The private coverage facade separates attention, backward, impact and unscoped
overall contexts, retaining every gap occurrence/reference under the original
caps and checker accounting. Complete flags cannot hide gaps. Missing backward
coverage labels a root as reported, withholding a supported badge without changing
its identity, path or graph membership. No grouping changes root eligibility.

The controller binds committed admission identity alongside the host binding.
A standalone strategy change clears pending and ready projections, cancels old
work and requires an explicit new query. Switching back cannot revive an older
result; speculative renders leave the committed request intact. Grouped changes
only presentation, retaining its existing request, result and selection.

## Canonical wording and host mark labels

`wording.ts` is the facade for the sealed `wording/` bank, sentence lookup and
used-label resolver. Admission and both overall/directional gap renderers share
that single bank. Root-only `investigationGapMessage(code)` returns its exact
sentence or undefined; no mutable wording table is public.

Both investigation props accept readonly `markLabels`, keyed by exact admitted
mark kind. This is separate from node-ID names in `port.labels`. Used own data
strings of 1–512 UTF16 units replace badge text; missing, inherited, accessor,
invalid, overlong or unreadable entries preserve the built-in name or raw kind.
No trimming, truncation, callbacks, HTML, map enumeration, mutation or retention.
A label equal to the raw kind is still a valid override. Changing the map changes
only text, leaving query/binding, selection, focus and canonical evidence intact.

The existing limits derive a conservative 16*(256+1) used-descriptor reads per
render, normally reduced by pagination; accepted host text is additional display
copy outside canonical parser usage. Readonly is a type contract: hosts replace
the map for updates. Proxy descriptor traps can run/throw, so this is not a
sandbox or a time guarantee. Failed lookups fall back without inspecting foreign
errors. A host label never establishes verification, severity or a cause.
