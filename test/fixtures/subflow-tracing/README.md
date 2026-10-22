# Scoped tracing recordings

These are actual public FootprintJS **10.3.0** runs. Ordinary tests replay JSON
and never import or call the producer. The library's development dependency and
older golden recordings are deliberately unchanged.

- `nested`: a root and two child scopes write the same keys. `prepare` and
  `pipeline/prepare` run the same child chart with different inputs.
- `repeated`: a loop invokes `prepare` twice. The path alias names the last
  invocation; the runtime-stage keys retain the two separate histories.

The checked-in generator only needs a tooling directory resolving the exact
published package. It installs nothing and makes no network or model call:

```sh
node test/fixtures/subflow-tracing/generate.mjs \
  --producer-root /path/to/tooling-with-footprintjs-10.3.0 \
  --out /path/to/scratch
```

`provenance.json` records the producer version and recording hash. Real producer
run IDs and timestamps are retained, so regeneration need not be byte-identical.
Review source-shape or semantic changes before replacing these fixtures; do not
regenerate them simply to make a test pass.

Child tracing uses the child's own history and stops at its input boundary.
These recordings do not supply exact cross-scope read-source provenance, and
these tests do not claim it.

`review-recordings.json` adds real 10.3.0 seedless, reads-off, redacted, nested
loop and three-branch fan-out runs. Its separate `review-provenance.json` pins
the bytes, so the original nested/repeated fixture remains untouched. Generate
only that corpus with `generate-review.mjs` and the same two directory options.
Ordinary tests need no producer installation or network. The dev-only Foottrace
parity suite checks exact drill IDs, grouped commit rails, legacy/current mapper
bookends and run-wide recorded-read coverage on the same saved records.
