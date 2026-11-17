import { describe, expect, it } from 'vitest';
import { resolveLensLayout } from '../../src/model/lensLayout';

const layout = { columns: '1fr', areas: [['timeTravel'], ['flowchart']] };
const resolve = (replayControls: unknown) => resolveLensLayout({ ...layout, replayControls }).definition as unknown as Record<string, unknown>;

describe('JSON replay presentation configuration', () => {
  it('retains an owned range configuration with the existing independent visibility and pace fields', () => {
    const input = { presentation: 'range', previousNext: false, playPause: true, slider: true, intervalMs: 600 };
    const output = resolve(input).replayControls;
    expect(output).toEqual(input); expect(output).not.toBe(input);
    input.presentation = 'segmented'; expect((output as Record<string, unknown>).presentation).toBe('range');
  });

  it.each([null, [], 'range', { presentation: 'clock' }, { presentation: null }, { slider: 'false' }, { intervalMs: Infinity }].map(input => ({ input })))('refuses invalid replay configuration: $input', ({ input }) => {
    expect(() => resolve(input)).toThrow(/^Invalid replay controls:/);
  });

  it('rejects known accessors without invoking them and ignores unknown-field accessors', () => {
    let calls = 0;
    const known = Object.defineProperty({}, 'presentation', { get() { calls++; return 'range'; } });
    expect(() => resolve(known)).toThrow(/^Invalid replay controls:/);
    const ignored = Object.defineProperty({ presentation: 'range' }, 'unused', { get() { calls++; throw Error('unused'); } });
    expect(resolve(ignored).replayControls).toEqual({ presentation: 'range' }); expect(calls).toBe(0);
  });

  it('does not inherit replay fields and keeps the existing absent-layout output unchanged', () => {
    expect(resolveLensLayout(layout).definition).not.toHaveProperty('replayControls');
    expect(() => resolve(Object.create({ presentation: 'range' }))).toThrow(/^Invalid replay controls:/);
  });
});
