# Record Lens behavior and packed-package proof

The original source pilot is now the `/record` entry in an **unpublished 1.0.0
candidate**. This is not a release. The original 86 pilot cases and their saved
Flow/HCI fixtures remain unchanged. Their Foottrace 1.0.0 producer metadata is
historical evidence; the candidate reads those same bytes using its required
Foottrace `^1.0.3` dependency. Both the exact supported floor and the latest
permitted registry resolution are installed and tested separately.

After the normal build, run on Node 22 or 24:

```sh
npm run test:record-pilot
```

The retained source demonstration is optional:

```sh
npx vite --config pilots/record-lens/browser/vite.config.ts
```

It serves `http://localhost:5320` from source and is not the packaging proof.

## What the package proof checks

`verify-package.mjs` packs the actual candidate exactly once, then tests that
archive—not a synthetic facade or separately rebuilt model:

1. Its manifest has exactly root, `/flowchart` and `/record`, with ESM/CJS
   declarations and legacy `typesVersions` paths. The two historical export
   surfaces and every required field remain intact. The new additive ledger
   does not rewrite the historical 0.38.0 ledger.
2. A clean ordinary `npm install --strict-peer-deps` resolves the archive and
   React, with React's type support as development tooling. Foottrace is first
   pinned to the supported 1.0.3 floor, then separately resolved by the
   candidate's normal `^1.0.3` range. The complete installed tree must contain no
   XYFlow, Dagre, ReactDOM, engine, agent, HCI, Viz or unexpected runtime.
   Nothing is omitted, pruned, copied from repository `node_modules`, linked,
   forced or overridden. Graph peers are optional metadata, never
   `optionalDependencies`.
3. Both runtime formats load the installed `/record` and explain the unchanged
   saved Flow/HCI fixtures at every canonical stop. NodeNext ESM/CJS and bundler
   declaration checks use `strict: true`, `skipLibCheck: false`, no aliases or
   ambient stubs and no repository type resolution. The TypeScript compiler's
   own standard libraries are the only permitted files outside the consumer.
4. The installed browser import graph permits only React/Foottrace. All record
   exports and transitive chunks count toward the unchanged **50,000-byte
   minified** budget excluding those vendors. Foottrace-inclusive and gzip-9
   sizes are reported separately; neither is a whole-application savings claim.
5. The original 18 runtime/declaration leak controls remain and extend to
   Dagre, ReactDOM, HCI and Viz: **42 negative controls** total. A separate
   test-only contract suite proves optional-peer, fixed-floor, alias and
   nested-install-tree refusals. Injected files are restored and every installed
   package file is compared byte-for-byte with the archive afterward.
6. A separate ordinary installation provides the documented graph peers and
   type support for root and `/flowchart`. Their ESM/CJS runtime export names
   match the original ledger; all three strict declaration modes pass. Their
   whole-entry browser sizes count transitive chunks under the recorded M5
   comparison conditions. These are not startup measurements.
7. Packed paths, source maps and source digests are audited. No source trees,
   fixtures, tests, private data, deep public aliases or extra package doors
   ship. Source-map source contents must exactly match the candidate sources.

`npm run test:lazy-browser` is the separate actual-browser gate: it installs the
same kind of packed candidate with graph peers, observes emitted chunks and
network requests, and exercises the composite shell before/after graph use.
The direct `/flowchart` entry intentionally selects graph functionality.

Pass `--keep` directly to `verify-package.mjs` to retain consumer manifests,
installation logs, the archive and `verification.json` for review. Scratch
outputs never modify tracked `dist`. See the migration package contract and
import guide under `test/migration/`; Why bridge, consumer rehearsal and owner
release review remain later gates. Viz remains private.
