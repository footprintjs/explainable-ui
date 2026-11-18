# Recording reader verification

The public `footprint-explainable-ui/record` entry reads Foottrace 2 records on
Node 22+. The Node 22 CI lane runs these narrow reader tests and then checks the
built package from isolated consumers. The saved Flow and HCI fixtures include
their original producer versions and hashes. The tests read their existing bytes
at every Foottrace stop, including the separate child history, and assert known
states, historical writers, redaction and missing evidence.

Run the full package build, then run `npm run test:record-pilot`.
`npm run typecheck:record-pilot` checks source and fixtures with library type
checking enabled. The package gate checks the actual packed archive, both ESM and
CommonJS, and declarations under NodeNext and bundler resolution. The isolated
record-only consumer excludes engine and diagram dependencies.

`shared-reader.pilot.ts` exercises both branches of the saved total of 35,
a tagged stop strategy with a prologue, and source updates. The UI tests cover
controlled step and key callbacks. The recording [examples and source
contract](../../src/record/README.md) show how to reuse the reader across views.

For the basic saved Flow/HCI browser fixture, run
`npx vite --config pilots/record-lens/browser/vite.config.ts` and open
`http://localhost:5320`. Its Vite configuration resolves the source checkout.
