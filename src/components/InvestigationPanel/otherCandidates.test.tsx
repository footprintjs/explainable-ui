/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InvestigationPanel } from './InvestigationPanel';
import { GroupedFlowInvestigation } from '../GroupedFlowInvestigation/GroupedFlowInvestigation';
import { checkInvestigationExplanation } from './admission';
import type { InvestigationPort, InvestigationResult } from './types';
import type { FlowDiagramDefinition, FlowDiagramHighlight } from '../GroupedFlowDiagram/types';

vi.mock('../GroupedFlowDiagram/GroupedFlowDiagram', () => ({
  GroupedFlowDiagram: (props: {
    definition: FlowDiagramDefinition;
    selectedNodeId?: string | null;
    highlight?: FlowDiagramHighlight;
    onSelectNode?: (id: string) => void;
  }) => <section data-testid="candidate-diagram"
    data-selected={props.selectedNodeId ?? ''}
    data-highlighted={JSON.stringify(props.highlight?.nodeIds ?? [])}
    data-root={props.highlight?.rootCauseId ?? ''}>
    {props.definition.nodes.map(node => <button key={node.id} type="button"
      aria-label={`Select diagram ${node.id}`} onClick={() => props.onSelectNode?.(node.id)}>{node.label}</button>)}
  </section>,
}));

const selected = 'run:left/load#0';
const sameNameOther = 'run:right/load#0';
const firstOther = 'run:third/load#0';
const membership = 'The selected item is included in the supplied candidate list.';
const noOthers = 'No other candidates were supplied. This does not establish one root cause.';
const gap = { code: 'not-collected' as const, evidence: ['record:missing'] };
const mark = { kind: 'error', reason: 'ERROR_RECORDED' as const, evidence: ['record:selected-error'] };
const labels = { [selected]: 'Shared name', [sameNameOther]: 'Shared name', [firstOther]: 'Earlier candidate' };

function uncertain(alternatives: readonly string[], incomplete = true): InvestigationResult {
  return {
    nodeId: selected, attention: [mark], path: [selected], alternatives,
    confidence: incomplete ? 'incomplete' : 'complete', gaps: incomplete ? [gap] : [],
    impact: { nodes: [], confidence: incomplete ? 'incomplete' : 'complete', gaps: incomplete ? [gap] : [] },
  };
}
function selfRoot(nodeId = selected): InvestigationResult {
  return { nodeId, attention: [mark], rootCause: nodeId, path: [nodeId], alternatives: [],
    confidence: 'complete', gaps: [], impact: { nodes: [], confidence: 'complete', gaps: [] } };
}
function makePort(answer: InvestigationResult, explain = vi.fn<InvestigationPort['explain']>(async () => answer)): InvestigationPort & { explain: typeof explain } {
  return { binding: {}, labels, attention: { nodes: [{ nodeId: selected, attention: [mark] }], confidence: 'complete', gaps: [] }, explain };
}
function open() {
  const trigger = screen.getByRole('button', { name: 'Investigate item 1' });
  trigger.focus(); fireEvent.click(trigger);
}
const explanation = () => screen.getByRole('region', { name: 'Selected explanation' });
const related = () => within(explanation()).queryAllByRole('button', { name: /^Investigate related item / });

function assertCanonicalCandidates(value: InvestigationResult, ids: readonly string[]) {
  expect(value.alternatives).toEqual(ids);
  for (const profile of ['text', 'relationships'] as const) {
    const checked = checkInvestigationExplanation(value, selected, profile);
    expect(checked.ok).toBe(true);
    if (!checked.ok) throw new Error('Expected existing canonical candidate admission');
    expect(checked.value.alternatives).toEqual(ids);
  }
}

describe('other candidates are a lossless presentation of admitted alternatives', () => {
  it.each([false, true])('keeps selected-only membership and root uncertainty without a self action (incomplete=%s)', async incomplete => {
    const input = uncertain(Object.freeze([selected]), incomplete), source = makePort(input);
    render(<InvestigationPanel port={source} />);
    expect(source.explain).not.toHaveBeenCalled();
    open(); await screen.findByText('Root cause unknown');
    expect(screen.getByRole('heading', { name: 'Other candidates' })).toBeTruthy();
    expect(screen.getByText(membership)).toBeTruthy();
    expect(screen.getByText(noOthers)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /(?:Show|Hide) other candidates/ })).toBeNull();
    expect(related()).toHaveLength(0);
    expect(within(explanation()).getByText('Recorded error')).toBeTruthy();
    expect(screen.getByText('The supplied evidence does not establish one root cause.')).toBeTruthy();
    expect(screen.queryByText('Supported root cause')).toBeNull();
    if (incomplete) expect(within(explanation()).getByText('Some evidence was not collected.')).toBeTruthy();
    expect(source.explain).toHaveBeenCalledTimes(1);
    assertCanonicalCandidates(input, [selected]);
  });

  it('preserves every other ID in order despite matching labels and namespace basenames, and follows its exact query with focus', async () => {
    const ids = Object.freeze([firstOther, selected, sameNameOther]);
    const input = uncertain(ids);
    const explain = vi.fn<InvestigationPort['explain']>(async id => id === selected ? input : selfRoot(id));
    const source = makePort(input, explain), view = render(<InvestigationPanel port={source} />);
    open(); await screen.findByText('Root cause unknown');
    expect(screen.getByText(membership)).toBeTruthy();
    expect(within(explanation()).getByText('Some evidence was not collected.')).toBeTruthy();
    expect(within(explanation()).getByText('Recorded error')).toBeTruthy();
    expect(related()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Show other candidates' }));
    const buttons = related(); expect(buttons).toHaveLength(2);
    expect(within(buttons[0]!.closest('li')!).getByText('Earlier candidate')).toBeTruthy();
    expect(within(buttons[1]!.closest('li')!).getByText('Shared name')).toBeTruthy();
    expect(screen.queryByText('Supported root cause')).toBeNull();
    assertCanonicalCandidates(input, [firstOther, selected, sameNameOther]);
    view.rerender(<InvestigationPanel port={{ ...source }} />);
    expect(source.explain).toHaveBeenCalledTimes(1);
    const next = related()[1]!; next.focus(); fireEvent.click(next);
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(2));
    expect(explain.mock.calls[1]?.[0]).toBe(sameNameOther);
    expect(document.activeElement).toBe(explanation());
    await screen.findByText('Supported root cause');
    expect(screen.queryByText(membership)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close investigation' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Investigate item 1' }));
    assertCanonicalCandidates(input, [firstOther, selected, sameNameOther]);
  });

  it('does not promote the sole other candidate after omitting the selected item', async () => {
    const input = uncertain(Object.freeze([selected, sameNameOther]), false);
    render(<InvestigationPanel port={makePort(input)} />);
    open(); await screen.findByText('Root cause unknown');
    expect(screen.getByText(membership)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show other candidates' }));
    expect(related()).toHaveLength(1);
    expect(screen.queryByText('Supported root cause')).toBeNull();
    expect(screen.getByText('These candidates remain uncertain.')).toBeTruthy();
    assertCanonicalCandidates(input, [selected, sameNameOther]);
  });

  it('shows an original other-only list collapsed without a selected-membership note or root promotion', async () => {
    const input = uncertain(Object.freeze([sameNameOther]));
    const source = makePort(input);
    render(<InvestigationPanel port={source} />);
    open(); await screen.findByText('Root cause unknown');
    expect(screen.getByRole('heading', { name: 'Other candidates' })).toBeTruthy();
    expect(screen.queryByText(membership)).toBeNull();
    expect(screen.queryByText(noOthers)).toBeNull();
    expect(related()).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Hide other candidates' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show other candidates' }));
    expect(related()).toHaveLength(1);
    expect(within(related()[0]!.closest('li')!).getByText('Shared name')).toBeTruthy();
    expect(screen.queryByText('Supported root cause')).toBeNull();
    expect(within(explanation()).getByText('Some evidence was not collected.')).toBeTruthy();
    expect(source.explain).toHaveBeenCalledTimes(1);
    assertCanonicalCandidates(input, [sameNameOther]);
  });

  it('resets the disclosure after following an exact other ID to another uncertain nonempty candidate result', async () => {
    const initial = uncertain(Object.freeze([selected, firstOther]));
    const next = { ...uncertain(Object.freeze([firstOther, sameNameOther])), nodeId: firstOther, path: [firstOther] };
    const explain = vi.fn<InvestigationPort['explain']>(async id => id === selected ? initial : id === firstOther ? next : selfRoot(id));
    const source = makePort(initial, explain);
    render(<InvestigationPanel port={source} />);
    open(); await screen.findByText('Root cause unknown');
    fireEvent.click(screen.getByRole('button', { name: 'Show other candidates' }));
    expect(related()).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Hide other candidates' })).toBeTruthy();
    const follow = related()[0]!; follow.focus(); fireEvent.click(follow);
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(2));
    expect(explain.mock.calls[1]?.[0]).toBe(firstOther);
    expect(document.activeElement).toBe(explanation());
    await waitFor(() => expect(explanation().getAttribute('aria-busy')).toBe('false'));
    expect(within(explanation()).getByRole('heading', { name: 'Earlier candidate', level: 3 })).toBeTruthy();
    expect(screen.getByText('Root cause unknown')).toBeTruthy();
    expect(screen.getByText(membership)).toBeTruthy();
    expect(related()).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Show other candidates' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Hide other candidates' })).toBeNull();
    expect(screen.queryByText('Supported root cause')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show other candidates' }));
    expect(related()).toHaveLength(1);
    expect(within(related()[0]!.closest('li')!).getByText('Shared name')).toBeTruthy();
    expect(explain).toHaveBeenCalledTimes(2);
    assertCanonicalCandidates(initial, [selected, firstOther]);
    for (const profile of ['text', 'relationships'] as const) {
      const checked = checkInvestigationExplanation(next, firstOther, profile);
      expect(checked.ok).toBe(true);
      if (!checked.ok) throw new Error('Expected unchanged next-question candidates');
      expect(checked.value.alternatives).toEqual([firstOther, sameNameOther]);
    }
    expect(next.alternatives).toEqual([firstOther, sameNameOther]);
    fireEvent.click(screen.getByRole('button', { name: 'Close investigation' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Investigate item 1' }));
  });

  it('keeps an originally empty candidate section absent without changing incomplete coverage', async () => {
    const input = uncertain([]);
    render(<InvestigationPanel port={makePort(input)} />);
    open(); await screen.findByText('Root cause unknown');
    expect(screen.queryByRole('heading', { name: 'Other candidates' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Alternative candidates' })).toBeNull();
    expect(screen.queryByText(membership)).toBeNull(); expect(screen.queryByText(noOthers)).toBeNull();
    expect(related()).toHaveLength(0);
    expect(within(explanation()).getByText('Recorded error')).toBeTruthy();
    expect(within(explanation()).getByText('Some evidence was not collected.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show affected items' }));
    expect(screen.getByText('Affected-item coverage is incomplete. Unlisted items remain unknown.')).toBeTruthy();
    expect(screen.queryByText('Supported root cause')).toBeNull();
  });

  it('keeps an explicitly supported selected item as a legitimate self root', async () => {
    const input = selfRoot();
    render(<InvestigationPanel port={makePort(input)} />);
    open(); await screen.findByText('Supported root cause');
    expect(screen.queryByText('Root cause unknown')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Other candidates' })).toBeNull();
    expect(screen.queryByText(membership)).toBeNull(); expect(related()).toHaveLength(0);
    assertCanonicalCandidates(input, []);
  });

  it.each(['raw list limit', 'root with alternatives'] as const)('still refuses %s before deriving other candidates', async reason => {
    const ids = reason === 'raw list limit' ? [selected, ...Array.from({ length: 256 }, (_, index) => `run:other/${index}`)] : [selected];
    const input = reason === 'raw list limit' ? uncertain(ids) : { ...selfRoot(), alternatives: ids };
    const checked = checkInvestigationExplanation(input, selected);
    expect(checked.ok).toBe(false);
    if (checked.ok) throw new Error('Expected unchanged canonical refusal');
    expect(checked.diagnostic.code).toBe(reason === 'raw list limit' ? 'limit-exceeded' : 'inconsistent-evidence');
    expect(checked.diagnostic.path).toEqual(reason === 'raw list limit' ? ['alternatives'] : ['rootCause']);
    render(<InvestigationPanel port={makePort(input)} />);
    open(); await screen.findByText('This explanation could not be verified.');
    expect(screen.queryByRole('heading', { name: 'Other candidates' })).toBeNull();
    expect(screen.queryByText(membership)).toBeNull(); expect(related()).toHaveLength(0);
    expect(screen.queryByText('Supported root cause')).toBeNull();
    expect(input.alternatives).toEqual(ids);
  });

  it('uses the same other-candidate presentation in grouped view while keeping selected graph membership', async () => {
    const ids = Object.freeze([selected, sameNameOther]);
    const input = { ...uncertain(ids), backward: { nodes: [selected, sameNameOther], edges: [], confidence: 'incomplete' as const, gaps: [gap] } };
    const source = makePort(input);
    const definition: FlowDiagramDefinition = { nodes: [{ id: selected, label: 'Failure' }, { id: sameNameOther, label: 'Other item' }], edges: [] };
    render(<GroupedFlowInvestigation definition={definition} observation={{ nodeStates: { [selected]: 'failed' } }} port={source} />);
    expect(source.explain).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: `Select diagram ${selected}` }));
    await screen.findByText('Root cause unknown');
    expect(screen.getByRole('heading', { name: 'Other candidates' })).toBeTruthy();
    expect(screen.getByText(membership)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show other candidates' }));
    expect(related()).toHaveLength(1);
    const diagram = screen.getByTestId('candidate-diagram');
    expect(JSON.parse(diagram.getAttribute('data-highlighted')!)).toEqual([selected, sameNameOther]);
    expect(diagram.getAttribute('data-selected')).toBe(selected);
    expect(diagram.getAttribute('data-root')).toBe('');
    expect(within(explanation()).getByText('Some evidence was not collected.')).toBeTruthy();
    expect(within(explanation()).getByText('Recorded error')).toBeTruthy();
    expect(source.explain).toHaveBeenCalledTimes(1);
    assertCanonicalCandidates(input, [selected, sameNameOther]);
  });
});
