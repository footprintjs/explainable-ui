# React model, controllers and presentation

The viewer keeps its interactive session in React. Context supplies the prepared
run and controlled cursor to composable surfaces; focused hooks own tracing,
navigation and playback. Each mounted viewer has its own session. There is no
module-level viewer store and no state-management dependency.

## Ownership

| Layer | Owner | Responsibilities |
| --- | --- | --- |
| Recorded model | `src/model/recording.ts`, adapters and `src/trace` | Parse mechanics, stage projection, structural/runtime translation and recorded evidence |
| Public input policy | Provider, TraceViewer and Shell | Admission, typed diagnostics, empty-run behavior and source/companion ownership |
| Composable session | `ExplainableProvider` | One controlled or uncontrolled cursor shared by its surfaces |
| Subflow navigation | `useSubflowNavigation` | Exact invocation selection, scope replacement and navigation notices |
| Trace session | `useTraceSessionState` and `useTraceSessionController` | Frozen questions, ingredient paths, tracing transitions and synchronized card/cone/rail models |
| Playback | `useTimeTravelPlayback` | Timers, one-shot autoplay, manual interruption and navigation commands |
| Presentation | Shell layout, chrome, recorder, right-panel and trace-panel components | Geometry, labels and rendering of supplied models and commands |
| Live recorder subscriptions | Existing translator handles and `useTranslator` | External non-React sources through `useSyncExternalStore` |

## Why React state here

The cursor and trace question are updated by React interactions and belong to one
viewer. A reducer makes coordinated trace transitions explicit; hooks isolate
effects and their cleanup. An external UI store would add another synchronization
boundary for host-controlled props and server rendering without a current need
for imperative non-React writes.

Zustand is a reasonable option if a later host needs independent imperative
control or profiling establishes a need for finer subscriptions. Any such store
must be created per viewer or request and injected through Context, rather than
shared globally. That decision is separate from the existing live recorder
stores, which already implement a subscription/version contract.

React's [external-store guidance](https://react.dev/reference/react/useSyncExternalStore)
and Zustand's [prop-initialized store guidance](https://zustand.docs.pmnd.rs/learn/guides/initialize-state-with-props)
describe these ownership boundaries.

## Contracts preserved by the split

- There is one timeline cursor. Tracing changes the question, not the cursor's
  owner; leaving tracing preserves its final position.
- A trace question keeps its recorded cutoff while the user scrubs. Source and
  exact invocation changes invalidate the previous question.
- The Shell retains autoplay's run-offer memory so remounting a layout or rail
  cannot replay over a user's Pause.
- Recording facades keep their established error wording and precedence. The
  model reports ready, empty or unreadable projections without choosing UI policy.
- The Shell keeps own-field admission, exact subflow-result filtering and stale
  companion quarantine before projecting the selected source.
- Host chart callbacks run only when their chart surface is visible. Layout
  components receive the actual container ref and cleanly mount their slots.
- Recorder shape detection stays memoized by data identity. Presentation changes
  do not introduce another evidence interpretation or traversal.

The refactor preserves the existing public component props and package entries.
