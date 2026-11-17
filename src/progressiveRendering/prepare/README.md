# Per-scope preparation

`prepare.ts` is the canonical adapter over the existing engine `SubflowResult`
converter. It takes a task boundary before its indivisible synchronous work.
The worker transport uses this same adapter. It does not promise that an
arbitrarily large unit becomes nonblocking.

`data.ts` detaches bounded own JSON-like data without invoking stored accessors;
cycles/non-plain values are refused. `admission.ts` reuses child trace admission,
checks scoped graph ownership, and checks prepared snapshot order/IDs against
the supplied recorded tree. A host preparation port is trusted executable code,
like a custom renderer: structural admission does not independently verify the
truth of values that host code returns. It must preserve the supplied recording.
Errors crossing this boundary are fixed messages, never inspected host errors.
