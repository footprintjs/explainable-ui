# Backtrack read-prefix fixtures

`legacy-parallel.snapshot.json` is the unchanged `parallel` runtime snapshot
from `examples/local-playground/recordings.json` at explainable-ui main
`dda3d39113372c0c51a7c17ca76c318d2d69b5f9`. It captured only the root `runs`
read for Combine. It remains coarse and is isolated from future preview
recording regeneration. Contract tests clone it before adding synthetic
per-write prefixes; those clones are not new producer captures.

`parallel35-canonical.snapshot.json` is an actual capture through the public
built CJS entry of the unreleased engine and Foottrace source builds listed
in `parallel35-canonical.metadata.json`. The metadata records exact source
commits, engine file hashes, options and the untouched snapshot SHA-256.
`capture-parallel.mjs.source.txt` preserves the exact generator source. To
reproduce it, place the generator beside an `engine` checkout with the listed
source build and Foottrace dependency, name it `capture-parallel.mjs`, and run
it with Node. Runtime timestamps/run IDs vary on recapture.

The Combine expression is unchanged:

```js
scope.total = scope.runs.items.amount + scope.runs.delivery.amount;
```

The opt-in capture records canonical per-write prefixes and the explicit
`nestedReadTracking: true` discriminator. It retains root and intermediate
reads as well as exact leaf reads. Backtrack may follow exact leaf writers,
but those links are recorded prior reads, not expression-level taint or proof
of complete derivation. Root/intermediate reads without an exact writer stay
unresolved. UI changes cannot repair missing evidence in immutable historical
recordings. Dot-joined `stageReads` labels never establish canonical paths.
