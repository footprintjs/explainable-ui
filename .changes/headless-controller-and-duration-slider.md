### Added

- Expose one shared React controller for custom replay views, the default Shell and optional bound transport/Commentary pieces, retaining exact-scope Backtrack, lazy loading and live selection.
- Configure native range or segmented replay controls through props and JSON. Optional duration and logarithmic duration spacing share the same cursor, disclose missing timing and cache geometry between cursor moves. Reading pace remains independent of recorded execution time.
- Include consumer and app/agent action examples. These additive APIs require a minor release; they are not included in npm 1.0.1.
