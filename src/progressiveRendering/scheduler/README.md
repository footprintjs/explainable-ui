# Progressive scheduling

`../scheduler.ts` is the facade. Foreground work uses native prioritized tasks
when available, otherwise a timer task. Background work can use an idle callback,
with a 100ms timer competitor to avoid waiting exclusively for idle time. These
are scheduling choices, not deadlines: browser throttling or suspension still
applies. Every task has one invocation and idempotent pre-invocation cancellation.

`scheduleVisual` races one animation frame with a timer; hidden documents use a
timer directly. It publishes already-prepared cohorts and never performs heavy
projection/layout. Cancelled or superseded work cannot publish through a late
competitor. Native API absence is supported during SSR.

`yieldToHost` provides a cancellable foreground task boundary. It does not split
an indivisible converter; callers must divide their own work or use preparation
in a host-supplied worker. No engine/D3 runtime or scheduler global is installed.
