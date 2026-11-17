# Synthetic investigation evidence

`recorded.ts` supplies recorded relationship examples. `wordingCases.ts` supplies
bounded synthetic input and gathers actual display/checker observations.
`wording-parity.json` freezes those observations from unchanged parent8bc4f0c,
before the wording/mark-label wiring. The nearby unit test compares complete
legacy/directional markup, parser DTOs, diagnostics and exact usage counts. This
baseline is evidence of previous behavior; it is not a generated sentence bank.
