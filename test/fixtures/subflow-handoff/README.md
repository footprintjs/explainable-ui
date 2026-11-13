# Output handoff recording

`recording.json` is untouched JSON output from the FootPrint source candidate
that adds `captureOutputHandoff`. It was recorded with
`captureOutputHandoff: true`, `writeProvenance: 'reads-prefix'` and
`readTracking: 'full'`, with the real `createTraceBundle` attached.

The chart loops twice through `child`. That child mounts `inner`, which writes
`localOutput`; output mappings rename it to `middleOutput`, then `renamed`.
The parent reads `renamed` into `final`. Each invocation has its own retained
history, log address and output handoff. The two inner values are 2 and 4.

The component regression consumes the saved snapshot without adding causal
edges, flattening histories or replacing recorded runtime IDs.

Regenerate after building this package, using a FootPrint module with the
handoff implementation. For a source checkout:

```sh
npm run build
node --import /path/to/footPrint/node_modules/tsx/dist/loader.mjs \
  test/fixtures/subflow-handoff/record.mjs /path/to/footPrint/src/index.ts
```

For an installed supporting release, pass `footprintjs` instead of a source
path and omit the TypeScript loader. The generator refuses an engine that
does not capture all four exact invocations.
