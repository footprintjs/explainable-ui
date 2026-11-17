/** @vitest-environment jsdom */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Gap } from 'foottrace/cause';
import { CoverageSection } from '../coverage';

const titles = {
  attention: 'Attention evidence coverage',
  overall: 'Overall reported coverage; direction not supplied',
  backward: 'Backward evidence coverage',
  impact: 'Affected-item coverage',
} as const;

describe('private directional coverage presentation', () => {
  it('keeps same-code entries in four named contexts separate without merging references', () => {
    const contexts = ['attention', 'overall', 'backward', 'impact'] as const;
    render(<>{contexts.map(context => <CoverageSection key={context} context={context} coverage={{ confidence: 'incomplete',
      gaps: [{ code: 'not-collected', nodeId: `item:${context}`, evidence: [`ref:${context}`] }] }} />)}</>);
    for (const context of contexts) {
      const section = screen.getByRole('region', { name: titles[context] });
      expect(within(section).getByText('Source-reported confidence: incomplete.')).toBeTruthy();
      expect(within(section).getByText('1 supplied entry')).toBeTruthy();
      const disclosure = within(section).getByText('View supplied entries for not-collected').closest('details')!;
      expect(within(disclosure).getByText(`item:${context}`)).toBeTruthy();
      expect(within(disclosure).getByText(`ref:${context}`)).toBeTruthy();
      for (const other of contexts.filter(value => value !== context)) {
        expect(within(section).queryByText(`ref:${other}`)).toBeNull();
      }
    }
  });

  it('does not hide supplied gaps behind a complete flag and retains duplicate references as escaped disclosure text', () => {
    const rawId = '<img src=x onerror=alert(1)>', rawRef = 'javascript:alert(1)';
    const gaps: readonly Gap[] = Object.freeze([
      Object.freeze({ code: 'scope-boundary' as const, nodeId: rawId, evidence: Object.freeze(['ref:shared', 'ref:shared', rawRef]) }),
      Object.freeze({ code: 'not-collected' as const, evidence: Object.freeze(['ref:other']) }),
      Object.freeze({ code: 'scope-boundary' as const, evidence: Object.freeze(['ref:shared']) }),
    ]);
    const view = render(<CoverageSection context="overall" coverage={{ confidence: 'complete', gaps }} />);
    const section = screen.getByRole('region', { name: titles.overall });
    expect(within(section).getByText('Source-reported confidence: complete.')).toBeTruthy();
    const groups = within(section).getAllByRole('status').map(status => status.textContent);
    expect(groups).toEqual(['Evidence stops at an execution boundary.', 'Some evidence was not collected.']);
    expect(within(section).getByText('2 supplied entries')).toBeTruthy();
    expect(within(section).getByText('1 supplied entry')).toBeTruthy();
    const disclosure = within(section).getByText('View supplied entries for scope-boundary').closest('details')!;
    expect(within(disclosure).getByRole('list', { name: 'Supplied entries for scope-boundary', hidden: true }).children).toHaveLength(2);
    expect(within(disclosure).getAllByText('ref:shared')).toHaveLength(3);
    expect(within(disclosure).getByText(rawId)).toBeTruthy();
    expect(within(disclosure).getByText(rawRef)).toBeTruthy();
    expect(view.container.querySelector('img, script, a, button')).toBeNull();
    expect(gaps[0]!.evidence).toEqual(['ref:shared', 'ref:shared', rawRef]);
    expect(gaps).toHaveLength(3);
  });

  it('keeps absent backward unknown and an empty incomplete list distinct from a verified complete result', () => {
    render(<><CoverageSection context="backward" />
      <CoverageSection context="impact" coverage={{ confidence: 'incomplete', gaps: [] }} /></>);
    const backward = screen.getByRole('region', { name: titles.backward });
    expect(within(backward).getByText('Backward evidence was not supplied. Backward coverage remains unknown.')).toBeTruthy();
    expect(within(backward).queryByText(/Source-reported confidence/)).toBeNull();
    const impact = screen.getByRole('region', { name: titles.impact });
    expect(within(impact).getByText('Source-reported confidence: incomplete.')).toBeTruthy();
    expect(within(impact).getByText('The supplied coverage is incomplete. Unreported evidence remains unknown.')).toBeTruthy();
    expect(within(impact).getByText('No gap entries were supplied. This does not verify completeness.')).toBeTruthy();
    expect(within(impact).queryByText('Source-reported confidence: complete.')).toBeNull();
  });

  it('names repeated coverage sections with distinct heading IDs', () => {
    render(<><CoverageSection context="backward" coverage={{ confidence: 'complete', gaps: [] }} />
      <CoverageSection context="backward" /></>);
    const sections = screen.getAllByRole('region', { name: titles.backward });
    expect(sections).toHaveLength(2);
    const ids = sections.map(section => section.getAttribute('aria-labelledby'));
    expect(ids[0]).toBeTruthy(); expect(ids[1]).toBeTruthy(); expect(ids[0]).not.toBe(ids[1]);
    for (const [index, section] of sections.entries()) {
      expect(within(section).getByRole('heading', { name: titles.backward }).id).toBe(ids[index]);
    }
  });
});
