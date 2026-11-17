# Recording source

`source.ts` exposes the small creator-owned external store. `controller.ts`
owns exact request deduplication, caller leases, cancellation, immediate pending
and error notifications, and atomic frame-coalesced ready cohorts. Foreground
interest promotes a queued idle request. Every retained scope counts toward the
bounded cache; new work refuses instead of evicting Backtrack return evidence.

`request.ts` validates own metadata and exact recorded mount/parent identity.
`views.ts` creates one flat logical subflow result map for all trace readers,
while preserving `rootSnapshot` separately for source identity. Selected graph
layers follow only that invocation's ancestors. Child graph IDs stay strictly
below their requested mount's path and cannot replace unrelated root geometry.
An ambiguous repeated child stamp across distinct parents is refused rather
than silently overwritten in the flat engine map.

Root/source records are supplied immutable host facts. No host object is frozen
or mutated. A view unmount removes its subscription and request interest only;
the creator calls `dispose()` when the whole source is no longer needed.
