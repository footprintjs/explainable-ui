/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DiagramAppearanceExample } from '../../examples/diagram-appearance/DiagramAppearanceExample';

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => {});
});
afterEach(() => vi.unstubAllGlobals());

function choose(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
function row(name: string) {
  return within(screen.getByRole('rowheader', { name }).closest('tr')!);
}

it('draws the plan and rewinds the same node and relationship in both views', () => {
  const { container } = render(<DiagramAppearanceExample />);
  const review = () => container.querySelector('.react-flow__node[data-id="review"]');
  const original = review();
  expect(original).toBeTruthy();
  expect(original?.querySelector('[data-sheet-view="flat"]')).toBeTruthy();
  expect(screen.queryByRole('slider')).toBeNull();
  choose('Source', 'saved');
  choose('Saved step', '5');
  expect(row('Review node').getByText('removed')).toBeTruthy();
  expect(row('Handoff edge').getByText('removed')).toBeTruthy();
  choose('Renderer', 'isometric');
  expect(review()).toBe(original);
  expect(original?.querySelector('[data-sheet-view="isometric"]')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  expect(row('Review node').getByText('removing')).toBeTruthy();
  expect(row('Handoff edge').getByText('present')).toBeTruthy();
  choose('Saved step', '3');
  expect(row('Review node').getByText('3 / 8 pages')).toBeTruthy();
  expect(row('Review node').getByText('Needs attention')).toBeTruthy();
  expect(row('Handoff edge').getByText('1 / 4 files')).toBeTruthy();
  choose('Saved step', '1');
  expect(row('Review node').getByText('Unreported')).toBeTruthy();
  choose('Node drawing', 'standard');
  expect(review()?.querySelector('[data-sheet-view]')).toBeNull();
  choose('Node drawing', 'sheet');
  expect(review()?.querySelector('[data-sheet-view="isometric"]')).toBeTruthy();
});

it('applies live counts and health independently of confirmed relationship removal', () => {
  render(<DiagramAppearanceExample />);
  choose('Source', 'live');
  fireEvent.click(screen.getByRole('button', { name: 'Begin creation' }));
  expect(row('Review node').getByText('creating')).toBeTruthy();
  expect(row('Review node').getByText('Unreported')).toBeTruthy();
  choose('Completed', '2');
  fireEvent.click(screen.getByRole('button', { name: 'Report progress' }));
  fireEvent.click(screen.getByRole('button', { name: 'Flag health' }));
  expect(row('Review node').getByText('2 / 8 pages')).toBeTruthy();
  expect(row('Review node').getByText('Needs attention')).toBeTruthy();
  choose('Apply to', 'edge');
  expect((screen.getByRole('button', { name: 'Confirm removal' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Begin removal' }));
  expect(row('Handoff edge').getByText('removing')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));
  expect(row('Handoff edge').getByText('removed')).toBeTruthy();
  expect(row('Review node').getByText('2 / 8 pages')).toBeTruthy();
});
