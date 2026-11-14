/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GroupedFlowDiagram } from './GroupedFlowDiagram';
import { RecordedFocusContext } from './presentation';

vi.mock('../FlowchartView/_internal/useChartAutoRefit', () => ({
  ChartAutoRefit: (props: any) => <output data-testid="camera" data-focus={props.focusNodeIds?.join(' ') ?? 'overview'} data-preserve={String(props.preserveViewport)} />,
}));
vi.mock('@xyflow/react', async original => ({ ...await original<typeof import('@xyflow/react')>(),
  ReactFlow: ({ children }: any) => <div>{children}</div>, Handle: () => null, Background: () => null, Controls: () => null,
}));
const definition = { nodes: [{ id: 'failed', label: 'Failure' }, { id: 'source', label: 'Source' }, { id: 'affected', label: 'Affected' }], edges: [] };
let width = 1024;
let measurements: Set<() => void>;
const focus = () => screen.getByTestId('camera').getAttribute('data-focus');
function resize(next: number) { act(() => { width = next; for (const measure of [...measurements]) measure(); }); }
function recorded(key: object, ids = ['failed', 'source']) {
  return <RecordedFocusContext.Provider value={{ focused: true, fitNodeIds: ids }}>
    <GroupedFlowDiagram definition={definition} selectedNodeId="failed" focusRequest={{ key, nodeIds: ids }} />
  </RecordedFocusContext.Provider>;
}
beforeEach(() => {
  width = 1024; measurements = new Set();
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
  vi.stubGlobal('ResizeObserver', class {
    constructor(private measure: () => void) { measurements.add(measure); }
    observe() {} disconnect() { measurements.delete(this.measure); }
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it.each([{ ids: ['failed', 'source'] }, { ids: ['failed', 'affected'] }])('retains the current recorded targets through the first desktop-to-phone crossing ($ids)', ({ ids }) => {
  render(recorded({}, ids)); expect(focus()).toBe(ids.join(' '));
  resize(390); expect(focus()).toBe(ids.join(' '));
  resize(1024); expect(focus()).toBe(ids.join(' '));
});
it('lets an explicit camera request win on the first narrow mount', () => {
  width = 390; render(recorded({})); expect(focus()).toBe('failed source');
});
it('does not turn the first later phone resize into an unrequested selection command', () => {
  render(<GroupedFlowDiagram definition={definition} selectedNodeId="failed" />);
  expect(focus()).toBe('overview'); resize(390); expect(focus()).toBe('overview');
});
it('still offers initial standalone phone framing and explicit Reveal/Fit controls', () => {
  width = 390; const key = {}, view = render(<GroupedFlowDiagram definition={definition} selectedNodeId="failed" />);
  expect(focus()).toBe('failed');
  view.rerender(recorded(key)); expect(focus()).toBe('failed source');
  fireEvent.click(screen.getByRole('button', { name: 'Reveal selection' })); expect(focus()).toBe('failed');
  fireEvent.click(screen.getByRole('button', { name: 'Fit recorded view' })); expect(focus()).toBe('failed source');
  view.rerender(recorded({}, ['source'])); expect(focus()).toBe('source');
});
it('uses the current selection when an initially hidden diagram becomes measurable', () => {
  width = 0;
  const view = render(<GroupedFlowDiagram definition={definition} selectedNodeId="failed" />);
  const staleCallbacks = [...measurements];
  view.rerender(<GroupedFlowDiagram definition={definition} selectedNodeId="source" />);
  act(() => { width = 390; for (const stale of staleCallbacks) stale(); });
  expect(focus()).toBe('overview');
  resize(390); expect(focus()).toBe('source');
});
it('does not invent a focus target for an invisible or absent selection', () => {
  width = 390;
  render(<GroupedFlowDiagram definition={definition} selectedNodeId="missing" />);
  expect(screen.getByRole('alert').textContent).toContain('Select a node ID declared in this diagram.');
  expect(screen.queryByTestId('camera')).toBeNull();
});
it('wires the existing measured-fitter manual-camera preservation policy', () => {
  render(recorded({})); expect(screen.getByTestId('camera').getAttribute('data-preserve')).toBe('true');
});

it('does not replace a recorded-focus context with selection when no camera targets are admitted yet', () => {
  width = 390;
  render(<RecordedFocusContext.Provider value={{ focused: true, fitNodeIds: [] }}>
    <GroupedFlowDiagram definition={definition} selectedNodeId="failed" />
  </RecordedFocusContext.Provider>);
  expect(focus()).toBe('overview');
  expect((screen.getByRole('button', { name: 'Fit recorded view' }) as HTMLButtonElement).disabled).toBe(true);
});
it('keeps an explicit local overview requested while the first container is hidden', () => {
  width = 0; render(<GroupedFlowDiagram definition={definition} selectedNodeId="failed" />);
  fireEvent.click(screen.getByRole('button', { name: 'Fit diagram' }));
  resize(390); expect(focus()).toBe('overview');
});
