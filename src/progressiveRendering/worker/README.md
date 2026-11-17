# Explicit preparation worker

`../worker.ts` exposes `createSubflowWorkerPreparation(worker)` and
`attachSubflowWorker(port)`. The first returns a callable preparation adapter with
an owner-controlled `dispose()`. The host constructs its browser worker and calls
the second inside that worker; no worker URL, engine runtime or background
process is created automatically. Each end disposes only its own listeners and
jobs. The host retains worker termination ownership.

The handler calls the actual `prepareSubflow` implementation, not a second
projection. The port is trusted host computation, like a custom renderer. Its
plain data crosses the browser's structured-clone boundary; the RecordingSource
still owns exact scope matching, evidence admission and retained snapshot bounds.
Functions/DOM objects are not a worker payload; clone/worker failures produce
fixed messages without foreign error details.

Request IDs are distinct across bridge lifetimes in this module. Abort sends a
matching cancel, rejects that request and ignores late results. Disposal rejects
pending work; new calls throw. Worker error/messageerror settles pending requests
and makes that bridge unavailable; replace a failed worker/bridge to retry.
Protocol/unknown messages do not acquire recording or selection authority.

Cancellation is cooperative: it cannot preempt one synchronous converter. Moving
that indivisible work into the supplied worker protects the main thread; the
default task-scheduled fallback remains an indivisible conversion. No transfer of
the host's buffers or normalization of original evidence occurs here.
