/** @vitest-environment jsdom */
import { createElement } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InvestigationPanel } from './InvestigationPanel';
import { GroupedFlowInvestigation } from '../GroupedFlowInvestigation/GroupedFlowInvestigation';
import type { InvestigationPanelProps, InvestigationPort, InvestigationResult } from './types';
import type { VisualInvestigationResult } from './visualTypes';
import type { GroupedFlowInvestigationProps } from '../GroupedFlowInvestigation/types';
import type { FlowDiagramDefinition } from '../GroupedFlowDiagram/types';
import { checkInvestigationAttention, checkInvestigationExplanation } from './admission';

vi.mock('../GroupedFlowDiagram/GroupedFlowDiagram', () => ({
  GroupedFlowDiagram: (props: { definition: FlowDiagramDefinition; selectedNodeId?: string | null; onSelectNode?: (id: string) => void }) =>
    <section data-testid="mark-label-diagram" data-selected={props.selectedNodeId ?? ''}>
      {props.definition.nodes.map(node => <button key={node.id} type="button"
        onClick={() => props.onSelectNode?.(node.id)}>Select {node.id}</button>)}
    </section>,
}));

const selected = 'opaque:run-left/check#2', customKind = 'R20-HIGH';
const defaultNames = [
  ['error', 'Recorded error'], ['unknown-effect', 'Outcome unknown'], ['gave-up', 'Stopped retrying'],
  ['timeout', 'Timed out'], ['retried', 'Retried'], ['quality-drop', 'Quality changed'],
  ['not-collected', 'Evidence unavailable'], ['outlier', 'Unusual result'],
] as const;
const mark = (kind: string): InvestigationResult['attention'][number] => ({ kind, reason: 'ERROR_RECORDED', evidence: ['opaque:record-ref'] });
const marks = [mark('error'), mark(customKind)];
function answer(attention: InvestigationResult['attention'] = marks): VisualInvestigationResult {
  return { nodeId: selected, attention, path: [selected], alternatives: [], confidence: 'complete', gaps: [],
    backward: { nodes: [selected], edges: [], confidence: 'complete', gaps: [] },
    impact: { nodes: [], confidence: 'complete', gaps: [] } };
}
type QueryMock = ReturnType<typeof vi.fn<InvestigationPort['explain']>>;
function port(attention: InvestigationResult['attention'] = marks, explain?: QueryMock): InvestigationPort & { explain: QueryMock } {
  return { binding: {}, labels: { [selected]: 'Exact selected item' },
    attention: { nodes: [{ nodeId: selected, attention }], confidence: 'complete', gaps: [] },
    explain: explain ?? vi.fn<InvestigationPort['explain']>(async () => answer(attention)) };
}
// Carry only the new runtime presentation prop on the old base. These casts are not public type proof.
const panel = (source: InvestigationPort, markLabels?: unknown) =>
  createElement(InvestigationPanel, { port: source, markLabels } as InvestigationPanelProps);
const definition: FlowDiagramDefinition = { nodes: [{ id: selected, label: 'Exact selected item' }], edges: [] };
const grouped = (source: InvestigationPort, markLabels?: unknown) => createElement(GroupedFlowInvestigation,
  { definition, observation: { nodeStates: { [selected]: 'failed' } }, port: source, markLabels } as GroupedFlowInvestigationProps);
const attentionRow = () => screen.getByRole('button', { name: 'Investigate item 1' }).closest('li')!;
const explanation = () => screen.getByRole('region', { name: 'Selected explanation' });
function open() {
  const trigger = screen.getByRole('button', { name: 'Investigate item 1' });
  trigger.focus(); fireEvent.click(trigger);
}
function fallbackBadges() {
  expect(within(attentionRow()).getByText('Recorded error')).toBeTruthy();
  expect(within(attentionRow()).getByText(customKind)).toBeTruthy();
}

function deferred() {
  let resolve!: (value: InvestigationResult) => void;
  const promise = new Promise<InvestigationResult>(done => { resolve = done; });
  return { promise, resolve };
}

describe('mark labels are bounded shared presentation data', () => {
  it('keeps every built-in name and unknown raw kind unchanged with no host map or eager query', async () => {
    const all = [...defaultNames.map(([kind]) => mark(kind)), mark(customKind)], source = port(all);
    render(panel(source));
    for (const [, name] of defaultNames) expect(within(attentionRow()).getByText(name)).toBeTruthy();
    expect(within(attentionRow()).getByText(customKind)).toBeTruthy();
    expect(source.explain).not.toHaveBeenCalled();
    open(); await screen.findByText('Root cause unknown');
    for (const [, name] of defaultNames) expect(within(explanation()).getByText(name)).toBeTruthy();
    expect(within(explanation()).getByText(customKind)).toBeTruthy();
    expect(source.explain).toHaveBeenCalledTimes(1);
  });

  it('uses exact known and unknown kind overrides at both badge sites, independently of node IDs and reasons', async () => {
    const source = port(), labels = { error: 'Host recorded error', [customKind]: 'Host domain condition',
      [selected]: 'WRONG NODE LABEL', ERROR_RECORDED: 'WRONG REASON LABEL' };
    const raw = answer(), before = checkInvestigationExplanation(raw, selected, 'relationships');
    const attentionBefore = checkInvestigationAttention(source.attention);
    render(panel(source, labels));
    expect(within(attentionRow()).getByText('Host recorded error')).toBeTruthy();
    expect(within(attentionRow()).getByText('Host domain condition')).toBeTruthy();
    expect(within(attentionRow()).getByText('Exact selected item')).toBeTruthy();
    expect(screen.queryByText('WRONG NODE LABEL')).toBeNull(); expect(screen.queryByText('WRONG REASON LABEL')).toBeNull();
    expect(source.explain).not.toHaveBeenCalled();
    open(); await screen.findByText('Root cause unknown');
    expect(within(explanation()).getByText('Host recorded error')).toBeTruthy();
    expect(within(explanation()).getByText('Host domain condition')).toBeTruthy();
    expect(within(explanation()).queryByText('Recorded error')).toBeNull();
    expect(checkInvestigationExplanation(raw, selected, 'relationships')).toEqual(before);
    expect(checkInvestigationAttention(source.attention)).toEqual(attentionBefore);
    expect(raw.attention).toEqual(marks); expect(Object.isFrozen(labels)).toBe(false);
  });

  it('accepts an override equal to the known raw kind rather than mistaking it for missing configuration', () => {
    const source = port(); render(panel(source, { error: 'error', [customKind]: customKind }));
    expect(within(attentionRow()).getByText('error')).toBeTruthy();
    expect(within(attentionRow()).queryByText('Recorded error')).toBeNull();
    expect(within(attentionRow()).getByText(customKind)).toBeTruthy();
    expect(source.explain).not.toHaveBeenCalled();
  });

  it('preserves leading and trailing whitespace in a valid host label', () => {
    const text = '  Host spaced label  ';
    render(panel(port(), { error: text }));
    expect(within(attentionRow()).getByText(text, { normalizer: value => value }).textContent).toBe(text);
  });

  it('accepts exactly512 UTF16 units and refuses513 without trimming or removing marks', () => {
    const accepted = '😀'.repeat(256), tooLong = accepted + 'x', source = port();
    const view = render(panel(source, { error: accepted, [customKind]: tooLong }));
    expect(accepted.length).toBe(512); expect(tooLong.length).toBe(513);
    expect(within(attentionRow()).getByText(accepted)).toBeTruthy();
    expect(within(attentionRow()).getByText(customKind)).toBeTruthy();
    expect(within(attentionRow()).queryByText(tooLong)).toBeNull();
    view.rerender(panel(source, { error: tooLong, [customKind]: accepted }));
    expect(within(attentionRow()).getByText('Recorded error')).toBeTruthy();
    expect(within(attentionRow()).getByText(accepted)).toBeTruthy();
    expect(source.explain).not.toHaveBeenCalled();
  });

  it.each([
    ['empty', ''], ['number', 42], ['null', null], ['boolean', false], ['object', {}],
    ['function', () => { throw Error('must not call labels'); }],
  ])('keeps exact built-in/raw fallbacks for an invalid used %s value', (_name, value) => {
    const source = port(); render(panel(source, { error: value, [customKind]: value }));
    fallbackBadges(); expect(source.explain).not.toHaveBeenCalled();
  });

  it('does not use inherited or accessor labels or invoke their getters', () => {
    let getters = 0;
    const inherited = Object.create(null, { error: { get() { getters++; throw Error('inherited'); } },
      [customKind]: { value: 'Inherited domain label' } });
    const labels = Object.create(inherited, { [customKind]: { get() { getters++; throw Error('own accessor'); } } });
    render(panel(port(), labels)); fallbackBadges(); expect(getters).toBe(0);
  });

  it('reads only used own descriptors without property reads, enumeration or unused getters', () => {
    let gets = 0, enumerations = 0, unused = 0;
    const descriptors: PropertyKey[] = [];
    const target = Object.defineProperty({ error: 'Descriptor label' }, 'unused', { get() { unused++; throw Error('unused'); } });
    const labels = new Proxy(target, {
      get() { gets++; throw Error('no property reads'); },
      ownKeys() { enumerations++; throw Error('no enumeration'); },
      getOwnPropertyDescriptor(value, key) { descriptors.push(key); return Reflect.getOwnPropertyDescriptor(value, key); },
    });
    render(panel(port(), labels));
    expect(within(attentionRow()).getByText('Descriptor label')).toBeTruthy();
    expect(within(attentionRow()).getByText(customKind)).toBeTruthy();
    expect(descriptors.every(key => key === 'error' || key === customKind)).toBe(true);
    expect(gets).toBe(0); expect(enumerations).toBe(0); expect(unused).toBe(0);
    expect(Object.isFrozen(target)).toBe(false);
  });

  it('falls back on throwing/revoked reflection without inspecting foreign errors or coercing nonobject maps', () => {
    let inspections = 0, conversions = 0;
    const trap = () => { inspections++; throw Error('PRIVATE_ERROR'); };
    const foreign = new Proxy({}, { get: trap, getPrototypeOf: trap, ownKeys: trap, getOwnPropertyDescriptor: trap });
    const throwing = new Proxy({}, { getOwnPropertyDescriptor() { throw foreign; } });
    const revoked = Proxy.revocable({}, {}); revoked.revoke();
    const callable = Object.assign(() => { conversions++; }, { error: 'Function object label' });
    const source = port(), view = render(panel(source, throwing)); fallbackBadges();
    for (const labels of [revoked.proxy, null, 12, 'host map', callable]) { view.rerender(panel(source, labels)); fallbackBadges(); }
    expect(inspections).toBe(0); expect(conversions).toBe(0); expect(source.explain).not.toHaveBeenCalled();
  });

  it('renders custom text escaped without adding label actions or markup', async () => {
    const text = '<img src=x onerror="throw 1"> & "host label"', source = port();
    render(panel(source, { error: text }));
    const badge = within(attentionRow()).getByText(text);
    expect(badge.querySelector('img,script,a,button')).toBeNull();
    open(); await screen.findByText('Root cause unknown');
    expect(within(explanation()).getByText(text).textContent).toBe(text);
    expect(within(explanation()).getByText(text).querySelector('img,script,a,button')).toBeNull();
  });

  it('replaces labels during pending and ready queries without cancelling, requerying or losing selection/focus', async () => {
    const pending = deferred(), query = vi.fn<InvestigationPort['explain']>(() => pending.promise), source = port(marks, query);
    const first = { error: 'First host label' }, second = { error: 'Second host label' }, third = { error: 'Third host label' };
    const view = render(panel(source, first));
    expect(within(attentionRow()).getByText('First host label')).toBeTruthy();
    open(); await waitFor(() => expect(query).toHaveBeenCalledTimes(1));
    const signal = query.mock.calls[0]![1].signal;
    expect(document.activeElement).toBe(explanation());
    view.rerender(panel(source, second));
    expect(signal.aborted).toBe(false); expect(query).toHaveBeenCalledTimes(1);
    expect(explanation().getAttribute('aria-busy')).toBe('true');
    expect(document.activeElement).toBe(explanation());
    await act(async () => pending.resolve(answer())); await screen.findByText('Root cause unknown');
    expect(within(explanation()).getByText('Second host label')).toBeTruthy();
    const path = screen.getByRole('button', { name: 'Show recorded path' }); path.focus();
    view.rerender(panel(source, third));
    expect(within(explanation()).getByText('Third host label')).toBeTruthy();
    expect(within(explanation()).getByRole('heading', { name: 'Exact selected item', level: 3 })).toBeTruthy();
    expect(document.activeElement).toBe(path); expect(signal.aborted).toBe(false); expect(query).toHaveBeenCalledTimes(1);
    expect(Object.isFrozen(first)).toBe(false); expect(Object.isFrozen(second)).toBe(false); expect(Object.isFrozen(third)).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Close investigation' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Investigate item 1' })); expect(signal.aborted).toBe(true);
  });

  it('forwards the same labels through grouped shared presentation without changing its query or selected diagram ID', async () => {
    const source = port(), view = render(grouped(source, { error: 'Grouped host label', [customKind]: 'Grouped domain label' }));
    expect(source.explain).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: `Select ${selected}` })); await screen.findByText('Root cause unknown');
    expect(within(explanation()).getByText('Grouped host label')).toBeTruthy();
    expect(within(explanation()).getByText('Grouped domain label')).toBeTruthy();
    expect(screen.getByTestId('mark-label-diagram').getAttribute('data-selected')).toBe(selected);
    view.rerender(grouped(source, { error: 'Replacement grouped label' }));
    expect(within(explanation()).getByText('Replacement grouped label')).toBeTruthy();
    expect(within(explanation()).getByText(customKind)).toBeTruthy();
    expect(screen.getByTestId('mark-label-diagram').getAttribute('data-selected')).toBe(selected);
    expect(source.explain).toHaveBeenCalledTimes(1);
  });
});
