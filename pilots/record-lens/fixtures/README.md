# Real producer fixtures (source-only pilot)

These are small **actual API recordings**, not example CommitBundles invented for the view. `generate.mjs` runs the public producer APIs without a browser, network, model or private implementation import. It writes only this folder (or a caller-supplied scratch `--out`). Ordinary pilot tests read the checked-in JSON; they do not load either producer.

- `flow.json`: footprintjs **10.0.0** with foottrace **1.0.0**. Root has five commit rows, including one real `review#2` mount/exit pair. The child has its own two-row history, with the inputMapper seed as a commit. Inputs are obtained from `getSnapshot()` and public `getSubtreeSnapshot(snapshot, 'review')`, never found by a viewer tree walk. The fixture intentionally keeps the selected source's log and base only. `keysReadFromExecutionTree` captures the producer's read evidence outside the viewer; the saved map is restored using Foottrace `keysReadFromMap`.
- `hci.json`: hcifootprint **3.0.0**, foottrace **1.0.0**; this existing built checkout uses footprintjs **9.48.3** for its schema/filter helpers (a supported HCI combination). Public `buildNavigationGraph().createSession`, observed human `fire`, and app `updateState` calls produce four committed transitions. A fifth add stays pending and does not become a commit. Same-page `sync('home')` is a genuine no-op and is not fabricated into a stop. `Session.commitLog()` and `Session.readsByStep()` are saved; no flowchart/execution tree is invented. The initial state is the fixture app's own permitted pre-session baseline, not current state mislabeled as initial. The private note is absent from saved data because the producer already redacted it.

Caller labels `flow:root`, `flow:review`, and `hci:storefront` are explicit local source identities, **not** fabricated producer run IDs. No timestamps or run IDs are replaced to make bytes deterministic: only the documented source/read fields are selected. `provenance.json` records actual package versions, fixture hashes and the canonical stops observed during generation; it is not an expected-output implementation.

## Reproduce

Use directories that already resolve the named exact packages (an isolated tooling project with those versions, or an existing verified checkout). This generator neither installs nor alters dependencies. Producer packages are not added to this library's runtime or development dependencies.

```sh
node pilots/record-lens/fixtures/generate.mjs \
  --flow-root /path/to/tooling-with-footprintjs-10 \
  --hci-root /path/to/hcifootprint-3 \
  --out /path/to/fresh-scratch-directory
```

Compare the two JSON fixture hashes with `provenance.json`. Review an intentional producer-semantic change before updating fixtures; never regenerate simply to make a failing test green.

The original generation used the already public-package-verified FootPrint10 install at `/private/tmp/npm-signature-procedure.Rl9mcj/postpublish-LAZgAa` and HCI's clean built checkout at `work/security-consumer-updates/hcifootprint`. HCI checkout `3a9815233e737078d4cf79e72ae45f877b52b593` has the same tree as released main `6b717047077f1c47a421713a182a5b65cd9dd6c1` (`add16fe33bb993776b6efc4d65076508626ec4f9`). Temporary generation paths are local provenance, not dependencies of the checked-in tests.

`records.ts` is the test consumer: JSON source + optional `KeysReadSource`, no producer object. `producers.pilot.ts` proves the same model handles both producers, source-local child history, actual grouping, canonical read evidence, missing reads, historical cutoff, append reconstruction, redaction and observational/non-mutating navigation. Pending interaction history is deliberately not presented as state-commit history.
