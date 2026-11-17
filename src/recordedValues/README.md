# Shared recorded values

The internal `recordedValues.ts` facade serves synchronous and progressive views;
it is not a package export. The copy/equality algorithms moved here unchanged.
Copies detach bounded plain own data and standard Date/Map/Set/BigInt values,
preserving aliases and rejecting cycles, accessors, native custom properties,
unsupported classes and buffers. Equality compares ordered collections, Date
epochs and alias topology. Native internal slots remain mutable despite freezing;
consumers must treat copied native leaves as readonly.

`formatRecordedValue` produces presentation text, not a serialization. Ordinary
small JSON keeps compact or indented JSON text. Undefined, BigInt, Date, Map and
Set have explicit representations; cycles, unavailable values and omitted work
have fixed markers. Captured native intrinsics and own-data descriptors avoid
recorded getters, iterators, methods, coercion and error inspection. A plain object
with its own callable/accessor `toJSON` is wholly unavailable: making that hook
inert must not expose fields a previous JSON redaction view hid. Proxy traps
remain observable; this is not a JavaScript sandbox.

Defaults are 10,000 characters, 200 visited items, depth 8 and compact output.
Options clamp to 16–500,000 characters, 1–10,000 items, depth 0–64 and indent 0–8.
Collection size is checked before collecting entries; an oversized Map/Set shows
its type/size plus `[Truncated]`. Character truncation is explicit and may leave
an incomplete JSON-like preview; never parse it or replace canonical evidence
with it. This bounds preview work; it does not make synchronous admission or
arbitrarily large input inspection nonblocking.

`compareRecordedValues` is the display-only three-way comparison. It validates
both complete input graphs using bounded detached copies before reporting
`equal` or `different`; unsupported nested data reports `unavailable` even when
an earlier primitive field differs. Each copy keeps the existing 100,000-item
work allowance. This allocates temporary bounded copies; it is not an incremental
or nonblocking comparison. `sameOwnedData` retains its existing admitted-data
boolean semantics for cumulative source history.
