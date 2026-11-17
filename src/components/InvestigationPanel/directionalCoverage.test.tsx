/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InvestigationPanel } from './InvestigationPanel';
import { GroupedFlowInvestigation } from '../GroupedFlowInvestigation/GroupedFlowInvestigation';
import type { InvestigationPort } from './types';
import type { VisualInvestigationResult } from './visualTypes';
import { checkInvestigationExplanation } from './admission';
import type { FlowDiagramDefinition, FlowDiagramHighlight } from '../GroupedFlowDiagram/types';

vi.mock('../GroupedFlowDiagram/GroupedFlowDiagram', () => ({
  GroupedFlowDiagram: (props: { definition: FlowDiagramDefinition; selectedNodeId?: string | null;
    highlight?: FlowDiagramHighlight; onSelectNode?: (id: string) => void }) =>
    <section data-testid="coverage-diagram" data-selected={props.selectedNodeId ?? ''}
      data-root={props.highlight?.rootCauseId ?? ''} data-nodes={JSON.stringify(props.highlight?.nodeIds ?? [])}>
      {props.definition.nodes.map(node => <button key={node.id} type="button"
        onClick={() => props.onSelectNode?.(node.id)}>Select {node.id}</button>)}
    </section>,
}));

const selected = 'exact:selected', root = 'exact:root';
const titles = { attention: 'Attention evidence coverage', backward: 'Backward evidence coverage',
  overall: 'Overall reported coverage; direction not supplied', impact: 'Affected-item coverage' } as const;
const gap = (nodeId: string, ...evidence: string[]) => ({ code: 'not-collected' as const, nodeId, evidence });
const mark = { kind: 'error', reason: 'ERROR_RECORDED' as const, evidence: ['attention-mark-ref'] };
const definition: FlowDiagramDefinition = { nodes: [{ id: selected, label: 'Selected' }, { id: root, label: 'Root' }], edges: [] };
const observation = { nodeStates: { [selected]: 'failed' as const } };

function uncertain(): VisualInvestigationResult {
  return { nodeId: selected, attention: [mark], path: [selected], alternatives: [], confidence: 'incomplete',
    gaps: [gap('aggregate-id', 'aggregate-ref')],
    backward: { nodes: [selected], edges: [], confidence: 'incomplete', gaps: [
      gap('backward-a', 'shared-ref', 'backward-ref'), gap('backward-b', 'shared-ref'),
    ] },
    impact: { nodes: [], confidence: 'incomplete', gaps: [gap('impact-id', 'impact-ref', 'shared-ref')] },
  };
}
function supported(): VisualInvestigationResult {
  return { ...uncertain(), rootCause: root, path: [selected, root], backward: {
    nodes: [selected, root], confidence: 'complete', gaps: [],
    edges: [{ from: selected, to: root, kind: 'data', attribution: 'recorded-read', evidence: ['recorded-link'] }],
  } };
}
function port(answer: VisualInvestigationResult): InvestigationPort & { explain: ReturnType<typeof vi.fn<InvestigationPort['explain']>> } {
  return { binding: {}, labels: { [selected]: 'Selected', [root]: 'Root' },
    attention: { nodes: [{ nodeId: selected, attention: [mark] }], confidence: 'incomplete', gaps: [gap('attention-id', 'attention-gap-ref')] },
    explain: vi.fn<InvestigationPort['explain']>(async () => answer),
  };
}
const open = () => fireEvent.click(screen.getByRole('button', { name: 'Investigate item 1' }));
const region = (context: keyof typeof titles) => screen.getByRole('region', { name: titles[context] });

describe('explicit directional evidence coverage', () => {
  it('keeps every gap occurrence and reference in its supplied context without cross-direction merging', async () => {
    const raw = uncertain(), source = port(raw);
    render(<InvestigationPanel port={source} coverageMode="directional" />);
    expect(source.explain).not.toHaveBeenCalled();
    open(); await screen.findByText('Root cause unknown');
    for (const context of ['attention', 'overall', 'backward', 'impact'] as const) {
      expect(within(region(context)).getAllByText('Some evidence was not collected.')).toHaveLength(1);
    }
    expect(within(region('backward')).getAllByText('2 supplied entries').length).toBeGreaterThan(0);
    expect(within(region('backward')).getByText('backward-a')).toBeTruthy();
    expect(within(region('backward')).getByText('backward-b')).toBeTruthy();
    expect(within(region('backward')).getAllByText('shared-ref')).toHaveLength(2);
    expect(within(region('backward')).getByText('backward-ref')).toBeTruthy();
    expect(within(region('backward')).queryByText('impact-ref')).toBeNull();
    expect(within(region('impact')).getByText('impact-ref')).toBeTruthy();
    expect(within(region('overall')).getByText('aggregate-ref')).toBeTruthy();
    expect(within(region('attention')).getByText('attention-gap-ref')).toBeTruthy();
    const checked = checkInvestigationExplanation(raw, selected, 'relationships');
    expect(checked.ok).toBe(true);
    if (!checked.ok) throw Error('Expected existing relationships admission');
    expect(checked.value.backward?.gaps).toEqual(raw.backward?.gaps);
    expect(checked.value.gaps).toEqual(raw.gaps);
    expect(source.explain).toHaveBeenCalledTimes(1);
  });

  it('keeps a supported backward root when only aggregate and impact coverage are incomplete', async () => {
    render(<InvestigationPanel port={port(supported())} coverageMode="directional" />);
    open(); await screen.findByText('Supported root cause');
    expect(region('backward').textContent).toContain('complete');
    expect(region('backward').textContent).not.toContain('incomplete');
    expect(region('impact').textContent).toContain('incomplete');
    expect(region('overall').textContent).toContain('incomplete');
    expect(screen.queryByText('Root cause unknown')).toBeNull();
  });

  it('uses existing relationships refusal for a root paired with incomplete backward evidence', async () => {
    const raw = supported();
    const inconsistent = { ...raw, backward: { ...raw.backward!, confidence: 'incomplete' as const } };
    render(<InvestigationPanel port={port(inconsistent)} coverageMode="directional" />);
    open(); await screen.findByText('This explanation could not be verified.');
    expect(screen.queryByText('Supported root cause')).toBeNull();
    expect(screen.queryByRole('region', { name: titles.backward })).toBeNull();
  });

  it('keeps original list ceilings even when every gap would form a single rendered group', async () => {
    const raw = uncertain();
    const oversized = { ...raw, gaps: Array.from({ length: 129 }, () => gap('same', 'same-ref')) };
    render(<InvestigationPanel port={port(oversized)} coverageMode="directional" />);
    open(); await screen.findByText('This explanation could not be verified.');
    expect(screen.queryByRole('region', { name: titles.overall })).toBeNull();
  });

  it('keeps the default text projection and ignored graph getters unchanged', async () => {
    let reads = 0;
    const value = supported();
    Object.defineProperty(value, 'backward', { get() { reads++; throw Error('ignored backward'); } });
    Object.defineProperty(value.impact, 'edges', { get() { reads++; throw Error('ignored edges'); } });
    const source = port(value);
    render(<InvestigationPanel port={source} />);
    open(); await screen.findByText('Supported root cause');
    expect(reads).toBe(0);
    expect(screen.queryByRole('region', { name: titles.backward })).toBeNull();
    expect(source.explain).toHaveBeenCalledTimes(1);
  });

  it.each(['sideways', null, {}])('refuses an invalid runtime mode without offering an investigation: %s', value => {
    const source = port(uncertain());
    render(<InvestigationPanel port={source} coverageMode={value as never} />);
    expect(source.explain).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Investigate item 1' })).toBeNull();
    expect(screen.getByText(/unavailable|could not/i)).toBeTruthy();
  });

  it('reports absent backward coverage without manufacturing a supported root', async () => {
    const source = port({ ...supported(), backward: undefined });
    render(<InvestigationPanel port={source} coverageMode="directional" />);
    open(); await screen.findByText('Reported root cause');
    expect(region('backward').textContent).toMatch(/not supplied/i);
    expect(screen.queryByText('Supported root cause')).toBeNull();
    expect(region('overall').textContent).toContain('aggregate-ref');
    expect(source.explain).toHaveBeenCalledTimes(1);
  });

  it('changes grouped presentation using the same admitted request, root identity and graph selection', async () => {
    const source = port(supported());
    const view = render(<GroupedFlowInvestigation definition={definition} observation={observation} port={source} />);
    fireEvent.click(screen.getByRole('button', { name: `Select ${selected}` }));
    await screen.findByText('Supported root cause');
    view.rerender(<GroupedFlowInvestigation definition={definition} observation={observation} port={source} coverageMode="directional" />);
    expect(region('backward').textContent).toContain('complete');
    expect(source.explain).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('coverage-diagram').getAttribute('data-selected')).toBe(selected);
    expect(screen.getByTestId('coverage-diagram').getAttribute('data-root')).toBe(root);
  });

  it('uses reported-root copy and no supported badge in grouped directional mode when backward is absent', async () => {
    const source = port({ ...supported(), backward: undefined });
    render(<GroupedFlowInvestigation definition={definition} observation={observation} port={source} coverageMode="directional" />);
    fireEvent.click(screen.getByRole('button', { name: `Select ${selected}` }));
    await screen.findByText('Reported root cause');
    expect(screen.getByRole('status', { name: 'Cause summary' }).textContent).toContain('Reported cause:');
    const diagram = screen.getByTestId('coverage-diagram');
    expect(diagram.getAttribute('data-root')).toBe('');
    expect(JSON.parse(diagram.getAttribute('data-nodes')!)).toContain(root);
    expect(diagram.getAttribute('data-selected')).toBe(selected);
    expect(region('backward').textContent).toMatch(/not supplied/i);
    expect(source.explain).toHaveBeenCalledTimes(1);
  });
});
