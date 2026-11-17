---
type: changed
bump: major
---

- Add optional host-declared HIGH, MEDIUM, LOW and UNVERIFIED finding levels, shown as neutral badges without inferring confidence, verification or ranking findings.

Migration: `level` is now a recognized own data field on canonical display findings. An own invalid value or accessor that was previously ignored now refuses the whole explanation. Supply an exact supported host level, omit unsupported metadata or keep it outside this recognized field. Missing, own-undefined and inherited-only levels retain the previous unlabelled DTO, markup and usage.

Accepted level strings now consume their UTF-16 length under the existing aggregate text budget, including repeated occurrences. A formerly accepted model near that limit may therefore refuse after adding a level that was previously ignored. Keep the complete model within the unchanged limits; this change does not raise budgets, truncate evidence or partially display a refused model.
