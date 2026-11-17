import { describe, expect, expectTypeOf, it } from 'vitest';
import { isFindingLevel, type FindingLevel } from '../findingLevel';

describe('finding-level vocabulary', () => {
  it.each(['HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'] as const)('accepts exact host level %s', level => {
    const value: unknown = level;
    expect(isFindingLevel(value)).toBe(true);
    if (isFindingLevel(value)) expectTypeOf(value).toEqualTypeOf<FindingLevel>();
  });

  it.each([
    '', 'high', 'medium', 'low', 'unverified', 'High', 'UNKNOWN', 'CRITICAL',
    ' HIGH', 'HIGH ', 'HIGH\n', 'HIGH\r\n', 'HIGH\u2028', 'HIGH\u0000',
    'ＨＩＧＨ', 'HΙGH', 'HIGHER', 'x'.repeat(513),
  ])('rejects nonmember string %j without normalization', value => {
    expect(isFindingLevel(value)).toBe(false);
  });

  it.each([
    undefined, null, true, false, 0, 1, NaN, Infinity, 1n, Symbol('HIGH'),
    [], ['HIGH'], {}, { level: 'HIGH' }, new String('HIGH'),
    Object.create({ level: 'HIGH' }), Object.create(String.prototype),
    Object.prototype, String.prototype, Function.prototype, Array.prototype,
    () => 'HIGH',
  ].map(value => ({ value })))('rejects a nonprimitive input at case %#', ({ value }) => {
    expect(isFindingLevel(value)).toBe(false);
  });

  it('does not inspect inherited or own coercion hooks', () => {
    let reads = 0;
    const rejectRead = () => { reads++; throw new Error('caller hook must remain unread'); };
    const prototype = Object.create(null);
    for (const key of ['level', 'toString', 'valueOf', Symbol.toPrimitive]) {
      Object.defineProperty(prototype, key, { get: rejectRead });
    }
    const inherited = Object.create(prototype);
    const own = Object.create(null);
    for (const key of ['level', 'toString', 'valueOf', Symbol.toPrimitive]) {
      Object.defineProperty(own, key, { get: rejectRead });
    }
    expect(isFindingLevel(inherited)).toBe(false);
    expect(isFindingLevel(own)).toBe(false);
    expect(reads).toBe(0);
  });

  it('does not execute any reflection or coercion trap on a caller Proxy', () => {
    let traps = 0;
    const rejectTrap = () => { traps++; throw new Error('caller trap must remain unused'); };
    const value = new Proxy(Object.create(null), {
      get: rejectTrap, getPrototypeOf: rejectTrap, getOwnPropertyDescriptor: rejectTrap,
      ownKeys: rejectTrap, has: rejectTrap,
    });
    expect(isFindingLevel(value)).toBe(false);
    expect(traps).toBe(0);
  });

  it('rejects a revoked Proxy without reflection', () => {
    const value = Proxy.revocable({}, {});
    value.revoke();
    expect(isFindingLevel(value.proxy)).toBe(false);
  });

  it('does not infer a level from an object carrying finding data', () => {
    const value = { code: 'HIGH', summary: 'HIGH', level: 'HIGH' };
    expect(isFindingLevel(value)).toBe(false);
    expect(value).toEqual({ code: 'HIGH', summary: 'HIGH', level: 'HIGH' });
  });
});
