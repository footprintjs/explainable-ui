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
boundary fix. `gapMessages` remains the existing wording table. Host label lookup
keeps its prior node-ID fallback, separate from explanation refusal diagnostics.
# Other candidates

The shared standalone/grouped view omits the selected item's exact ID only from
the rendered **Other candidates** navigation list. It preserves every other ID's
order and explicitly notes supplied selected-item membership. Selected-only and
originally empty lists stay distinct; neither establishes a root cause. Canonical
`alternatives`, checker projections, admission limits, attention, gaps and graph
membership are unchanged. Labels and namespace basenames never determine identity.
