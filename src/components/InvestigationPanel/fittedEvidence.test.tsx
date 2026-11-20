/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GroupedFlowInvestigation } from '../GroupedFlowInvestigation/GroupedFlowInvestigation';
import type { FlowDiagramDefinition } from '../GroupedFlowDiagram/types';
import { InvestigationPanel } from './InvestigationPanel';
import type { InvestigationPort } from './types';
import type { VisualInvestigationResult } from './visualTypes';

vi.mock('../GroupedFlowDiagram/GroupedFlowDiagram', () => ({
  GroupedFlowDiagram: ({ definition, onSelectNode }: {
    definition: FlowDiagramDefinition; onSelectNode?: (id: string) => void;
  }) => <section aria-label="Diagram">
    {definition.nodes.map(node => <button key={node.id} type="button" onClick={() => onSelectNode?.(node.id)}>
      Select {node.label}
    </button>)}
  </section>,
}));

const selected = 'save';
const dependency = 'load';
const affected = 'deliver';
const definition: FlowDiagramDefinition = {
  nodes: [{ id: selected, label: 'Save' }, { id: dependency, label: 'Load' }, { id: affected, label: 'Deliver' }],
  edges: [],
};
const observation = { nodeStates: { [selected]: 'failed' as const } };
const mark = { kind: 'error', reason: 'ERROR_RECORDED' as const, evidence: ['record:attention'] };

function explanation(): VisualInvestigationResult {
  return {
    nodeId: selected, attention: [mark], path: [selected], alternatives: [], confidence: 'incomplete', gaps: [],
    impact: { nodes: [], confidence: 'incomplete', gaps: [] },
  };
}

function port(answer: VisualInvestigationResult): InvestigationPort {
  return {
    binding: {}, attention: { nodes: [{ nodeId: selected, attention: [mark] }], confidence: 'complete', gaps: [] },
    explain: () => answer,
  };
}

function edge(from: string, to: string) {
  return { from, to, kind: 'data' as const, attribution: 'recorded-read' as const, evidence: [] as string[] };
}

async function openExplanation() {
  fireEvent.click(screen.getByRole('button', { name: 'Investigate item 1' }));
  await screen.findByRole('heading', { name: 'Root cause unknown' });
  return screen.getByRole('region', { name: 'Selected explanation' });
}

const evidenceSummary = 'Recorded evidence references';

describe('fitted investigation evidence notices', () => {
  it('keeps the ordinary evidence disclosure markup byte-for-byte', async () => {
    render(<InvestigationPanel port={port(explanation())} />);
    const panel = await openExplanation();
    expect(within(panel).getByText(evidenceSummary).closest('details')?.outerHTML).toBe(
      '<details><summary>Recorded evidence references</summary><ul><li>record:attention</li></ul></details>',
    );
    expect(within(panel).queryByText(/more references? not shown/)).toBeNull();
  });

  it('discloses the total of the visible mark and gap cuts before the references are expanded', async () => {
    const original = explanation();
    const answer: VisualInvestigationResult = {
      ...original,
      attention: [{ ...mark, omittedReferences: 5 }],
      gaps: [{ code: 'not-collected', evidence: [], occurrences: 130, omittedReferences: 2 }],
      impact: { ...original.impact, gaps: [{ code: 'timeout', evidence: ['record:impact'], omittedReferences: 3 }] },
    };
    render(<InvestigationPanel port={port(answer)} />);
    const panel = await openExplanation();
    const summary = within(panel).getByText(evidenceSummary);
    const details = summary.closest('details')!;
    expect(details.open).toBe(false);
    expect(within(panel).getByText('10 more references not shown')).toBeVisible();
    expect(within(panel).getByText('130 supplied entries')).toBeVisible();
    fireEvent.click(summary);
    expect(details.open).toBe(true);
    expect(within(details).getAllByRole('listitem').map(item => item.textContent)).toEqual(['record:attention', 'record:impact']);
  });

  it('keeps gap occurrence and omission counts in their original coverage groups', async () => {
    const original = explanation();
    const answer: VisualInvestigationResult = {
      ...original,
      gaps: [
        { code: 'not-collected', nodeId: 'gap-a', occurrences: 129, evidence: [], omittedReferences: 12 },
        { code: 'not-collected', nodeId: 'gap-b', evidence: ['record:gap-b'] },
      ],
      impact: { ...original.impact, gaps: [{ code: 'not-collected', nodeId: 'gap-c', evidence: [] }] },
    };
    render(<InvestigationPanel port={port(answer)} coverageMode="directional" />);
    await openExplanation();
    const overall = screen.getByRole('region', { name: 'Overall reported coverage; direction not supplied' });
    const impact = screen.getByRole('region', { name: 'Affected-item coverage' });
    const groupSummary = within(overall).getByText('View supplied entries for not-collected');
    const groupDetails = groupSummary.closest('details')!;
    expect(groupDetails.open).toBe(false);
    expect(within(overall).getByText('130 supplied entries')).toBeVisible();
    expect(within(overall).getAllByText('12 more references not shown').filter(item => !item.closest('details'))).toHaveLength(1);
    expect(within(impact).getByText('1 supplied entry')).toBeVisible();
    expect(within(impact).queryByText(/more references not shown/)).toBeNull();
    expect(within(impact).getByText('No evidence references were supplied for this entry.')).toBeTruthy();
    fireEvent.click(groupSummary);
    expect(within(groupDetails).getByText('gap-a')).toBeVisible();
    expect(within(groupDetails).getByText('12 more references not shown')).toBeVisible();
    expect(within(groupDetails).getByText('record:gap-b')).toBeVisible();
    expect(within(groupDetails).queryByText('No evidence references were supplied for this entry.')).toBeNull();
  });

  it('discloses edge-only omissions in standalone directional mode and keeps overall text scoped', async () => {
    const original = explanation();
    const answer: VisualInvestigationResult = {
      ...original,
      backward: { nodes: [selected, dependency], confidence: 'incomplete', gaps: [], edges: [
        { ...edge(selected, dependency), omittedReferences: 4 },
      ] },
      impact: { ...original.impact, nodes: [affected], edges: [{ ...edge(selected, affected), omittedReferences: 1 }] },
    };
    const directional = render(<InvestigationPanel port={port(answer)} coverageMode="directional" />);
    const panel = await openExplanation();
    expect(within(panel).getByText('Backward relationships · 4 more references not shown')).toBeVisible();
    expect(within(panel).getByText('Affected-item relationships · 1 more reference not shown')).toBeVisible();
    directional.unmount();

    const readHidden = vi.fn(() => { throw Error('Hidden graph evidence'); });
    Object.defineProperty(answer, 'backward', { get: readHidden });
    Object.defineProperty(answer.impact, 'edges', { get: readHidden });
    render(<InvestigationPanel port={port(answer)} />);
    const overall = await openExplanation();
    expect(within(overall).queryByText(/more references? not shown/)).toBeNull();
    expect(readHidden).not.toHaveBeenCalled();
  });

  it.each(['overall', 'directional'] as const)('counts parallel edges once per direction outside grouped %s disclosures', async coverageMode => {
    const original = explanation();
    const fromSelected = edge(selected, dependency);
    const answer: VisualInvestigationResult = {
      ...original,
      backward: { nodes: [selected, dependency], confidence: 'incomplete', gaps: [], edges: [
        { ...fromSelected, omittedReferences: 2 },
        ...Array.from({ length: 63 }, () => ({ ...fromSelected })),
        { ...fromSelected, omittedReferences: 3 },
      ] },
      impact: { ...original.impact, nodes: [affected], edges: [{ ...edge(selected, affected), omittedReferences: 6 }] },
    };
    render(<GroupedFlowInvestigation definition={definition} observation={observation} port={port(answer)} coverageMode={coverageMode} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select Save' }));
    await screen.findByRole('heading', { name: 'Root cause unknown' });
    const backwardLabel = 'Backward relationships · 5 more references not shown';
    const impactLabel = 'Affected-item relationships · 6 more references not shown';
    expect(screen.getByText(backwardLabel)).toBeVisible();
    expect(screen.getByText(impactLabel)).toBeVisible();
    const backwardSummary = screen.getByText('Recorded dependency evidence (65)');
    const backwardDetails = backwardSummary.closest('details')!;
    expect(backwardDetails.open).toBe(false);
    fireEvent.click(backwardSummary);
    expect(within(backwardDetails).getByText('2 more references not shown')).toBeVisible();
    expect(within(backwardDetails).queryByText('3 more references not shown')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'What it affected' }));
    expect(screen.getAllByText(backwardLabel)).toHaveLength(1);
    expect(screen.getAllByText(impactLabel)).toHaveLength(1);
    expect(screen.getByText('Recorded dependency evidence (1)')).toBeVisible();
  });
});
