import { describe, expect, it } from 'vitest';
import baseline from '../fixtures/investigation/wording-parity.json';
import { wordingParityObservations } from '../fixtures/investigation/wordingCases';

describe('UI wording preserves recorded8bc parent behavior',()=>{
  const actual=wordingParityObservations();
  it.each(Object.keys(baseline.observations.checks) as (keyof typeof actual.checks)[])(
    'retains %s admission, DTO, diagnostic and exact usage',key=>{
      expect(actual.checks[key]).toEqual(baseline.observations.checks[key]);
    });
  it.each(['overall','directional'] as const)('retains every default sentence/name and complete %s markup',mode=>{
    expect(actual[mode]).toBe(baseline.observations[mode]);
  });
  it('keeps accessor refusal inert',()=>expect(actual.getterCalls).toBe(baseline.observations.getterCalls));
});
