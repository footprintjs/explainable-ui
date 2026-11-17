# Public wording consumers

`check-investigation-wording-package.mjs` copies these fixtures into an isolated
consumer of the actual npm archive built by CI. The runtime checks public CJS/ESM
sentence access, escaped custom badges and focus-preserving label updates. The
type fixture runs as NodeNext `.mts`/`.cts` and Bundler `.tsx`, with no installed
Foottrace or source aliases. These files are proof inputs, not published APIs.
