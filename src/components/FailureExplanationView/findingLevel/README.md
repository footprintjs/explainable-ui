# Finding-level vocabulary

Integration imports `../findingLevel.ts`; that sealed facade exposes only the
membership guard and its native derived type. `vocabulary.ts` owns one private
frozen list: HIGH, MEDIUM, LOW and UNVERIFIED. It imports no parser or renderer,
and neither the list nor helper is a named package-root export.

`isFindingLevel` accepts only an exact primitive string from that list. It reads
no caller properties, invokes no coercion hooks and does not trim, normalize,
infer, rank or choose a default. In particular, absence is not UNVERIFIED.

The integration separately owns descriptor admission, retained-text charging,
whole-model refusal and the neutral host-declared badge/caption. This helper
does not authenticate the assessment or inspect finding evidence.

Dependency direction: integration → `findingLevel.ts` → `vocabulary.ts`.
Nearby tests enter through the facade and exercise membership and noncoercion;
the private list has no public observation or mutation surface.
