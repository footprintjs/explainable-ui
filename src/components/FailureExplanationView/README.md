# Failure explanation display

Standalone opt-in view over a host-admitted presentation. `types.ts` owns the UI
projection; `admission.ts` selects detached own data fields; the component renders
canonical wording, optional supplementary business guidance and mandatory
uncertainty. There is no diagnosis, template matching, storage loading, action or
graph selection here. Existing viewers do not change.

The host binds the formatted result to the exact selected recording and item,
and replaces or clears it whenever that selection changes. Blueprint's formatted
explanation is structurally assignable without introducing a runtime dependency.
Canonical text is always visible; configured wording does not replace evidence.
Reference strings appear only in disclosure text, never as links or actions.

The entire view is refused when a required field is missing, inconsistent,
accessor-backed or over budget: 262,144 retained UTF-16 text code units total,
1,024 entries per list and 4,096 code units per reference/unknown. Refusal keeps
the cause and outcome unknown and tells the host to supply an admitted result.
Only known own data fields are read; unrelated fields, input iterators and input
array methods are ignored. JavaScript Proxy reflection is not sandboxed.

Adjacent tests cover visible canonical wording/unknowns, supplementary labels,
text escaping, no actions, selection replacement, fixed bounds and inert reads.
