# Non-shipping record Lens pilot

This is source-level design evidence, not a public `footprint-explainable-ui/record`
entry point. The package's two existing exports, runtime dependencies, mandatory
peers and Node >=18 consumer contract remain unchanged. Foottrace 1.0.0 is a
development prerequisite only; running this pilot requires Node >=22.

Run the normal build first, then:

```sh
npm run test:record-pilot
```

For the source-only browser demonstration, run:

```sh
npx vite --config pilots/record-lens/browser/vite.config.ts
```

Open `http://localhost:5320`. This demonstration imports the local pilot source;
it does not use or create a published `/record` entry point.

The dedicated `*.pilot.ts[x]` suite is not part of the existing Node 20 test lane.
Its explicit Node 22 CI step is required evidence, not a skipped test reported as
a pass. `typecheck:record-pilot` checks the source with library checking enabled.

`verify-package.mjs` does four separate jobs in one temporary directory:

1. Packs the normal library and checks its current installation contract, two
   doors and all twelve dist files. The pilot and Foottrace must not appear in
   shipped runtime, declarations or source maps.
2. Builds an explicitly private synthetic package exposing only `/record`. Its
   isolated consumer contains Foottrace, React and React's declaration support;
   it has no repository aliases or shared `node_modules` link. ESM/CJS execution
   and NodeNext ESM/CJS plus bundler declaration checks must pass with
   `skipLibCheck: false`. Both runtime formats also read the real saved Flow and
   HCI fixtures at every canonical stop, without either producer installed.
3. Checks a browser dependency allowlist and a provisional 50,000-byte minified
   budget excluding Foottrace/React. It also reports the Foottrace-inclusive
   browser size separately. Neither is a claimed saving or whole-app size.
4. Injects engine, agent and graph references into runtime and emitted
   declarations. Every negative control must be rejected by the same isolated
   checks; a fixture that can resolve an undeclared domain dependency is a fail.

Scratch outputs never enter tracked `dist`. Pass `--keep` directly to the verifier
to retain its temporary package, type consumers and `verification.json` for
review.

The approved direction for a future Lens major is Node >=22 with optional domain
and ReactFlow dependencies. Those changes belong together in a separately
reviewed compatibility migration, not in this pilot. No normal release, new
export, peer change or Node floor change is authorized by these proofs. Viz
remains private; its source must not move into a public Lens without separate
explicit approval.
