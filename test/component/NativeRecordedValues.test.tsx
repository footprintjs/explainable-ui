// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryPanel } from '../../src/components/MemoryPanel/MemoryPanel';
import { MemoryInspector } from '../../src/components/MemoryInspector/MemoryInspector';
import { ScopeDiff } from '../../src/components/ScopeDiff/ScopeDiff';
import { StageDetailPanel } from '../../src/components/StageDetailPanel/StageDetailPanel';
import { ResultPanel } from '../../src/components/ResultPanel/ResultPanel';
import { NarrativePanel } from '../../src/components/NarrativePanel/NarrativePanel';
import { KeyedRecorderView } from '../../src/components/ExplainableShell/_internal/KeyedRecorderView';
import { CommitInspector } from '../../src/components/FlowchartView/CommitInspector';
import { createCommitFlowRecorder } from '../../src/components/FlowchartView/createCommitFlowRecorder';
import { createTraceStructureRecorder } from '../../src/components/FlowchartView/traceStructureRecorder';
import { asRuntimeStageId } from '../../src/components/FlowchartView/_internal/keys';
import { createRecordingSource } from '../../src/progressiveRendering/source';
import { projectRuntimeSnapshot } from '../../src/model/recording';
import { recordedValuePreview } from '../../src/trace/recordedValuePreview';
import type { StageSnapshot } from '../../src/types';

afterEach(cleanup);
const snapshot = (memory: Record<string, unknown>): StageSnapshot => ({ stageName: 'Write', stageLabel: 'Write', runtimeStageId: 'write#1',
  memory, narrative: 'Recorded write', startMs: 0, durationMs: 0 });

describe('accepted recorded native values in consumer panels', () => {
  it.each([false, true])('renders source→snapshot adapter→MemoryPanel without dropping native values (unstyled=%s)', unstyled => {
    const memory = { nested: { amount: 1n }, date: new Date('2026-11-17T00:00:00.000Z'), map: new Map([['price', 30n]]), set: new Set([5n]) };
    const source = createRecordingSource({ snapshot: { sharedState: memory,
      executionTree: { id: 'write', name: 'Write', runtimeStageId: 'write#1', stageWrites: memory },
      commitLog: [{ stage: 'Write', stageId: 'write', runtimeStageId: 'write#1', trace: Object.keys(memory).map(path => ({ path })), overwrite: memory }] },
      graph: { nodes: [], edges: [] } });
    try {
      const projection = projectRuntimeSnapshot(source.getSnapshot().snapshot);
      expect(projection.kind).toBe('ready');
      const view = render(<MemoryPanel snapshots={projection.snapshots} selectedIndex={0} unstyled={unstyled} />);
      const text = view.container.textContent!;
      for (const expected of ['1n', '30n', '5n', 'Date', 'Map', 'Set', '2026-11-17']) expect(text).toContain(expected);
      expect(memory.map.get('price')).toBe(30n); expect([...memory.set]).toEqual([5n]); expect(memory.date.getUTCFullYear()).toBe(2026);
    } finally { source.dispose(); }
  });

  it('shows changed Map/Set content and leaves equal native content unchanged', () => {
    const previous = { map: new Map([['x', 1n]]), set: new Set([1n]), date: new Date(0) };
    const current = { map: new Map([['x', 2n]]), set: new Set([2n]), date: new Date(0) };
    const view = render(<ScopeDiff previous={previous} current={current} unstyled hideUnchanged />);
    expect(Array.from(view.container.querySelectorAll('[data-type="changed"] [data-fp="diff-key"]'), node => node.textContent)).toEqual(['map', 'set']);
    expect(view.container.textContent).toContain('1n'); expect(view.container.textContent).toContain('2n');
    view.rerender(<ScopeDiff previous={previous} current={{ map: new Map([['x', 1n]]), set: new Set([1n]), date: new Date(0) }} unstyled hideUnchanged />);
    expect(view.getByText('No changes')).toBeTruthy();
  });

  it('uses the same native equality and typed values in the stage memory ledger', () => {
    const states = [snapshot({ map: new Map([['x', 1n]]), set: new Set([1n]) }), snapshot({ map: new Map([['x', 2n]]), set: new Set([2n]) })];
    const view = render(<StageDetailPanel snapshots={states} selectedIndex={1} mode="dev" unstyled />);
    expect(view.container.querySelectorAll('[data-type="updated"]')).toHaveLength(2);
    expect(view.container.textContent).toContain('Map'); expect(view.container.textContent).toContain('Set');
  });

  it.each([0n, 0, false])('renders a recorded falsey result %s instead of No data', data => {
    // Runtime robustness for older/raw consumers; the public scope prop remains an object.
    const view = render(<ResultPanel data={data as unknown as React.ComponentProps<typeof ResultPanel>['data']} unstyled />);
    expect(view.container.textContent).not.toContain('No data'); expect(view.container.textContent).toContain(typeof data === 'bigint' ? '0n' : String(data));
  });

  it.each([false, true])('does not invoke legacy accessors or toJSON (unstyled=%s)', unstyled => {
    let reads = 0; const data: Record<string, unknown> = { amount: 1n, safe: { redacted: 'hidden', toJSON() { reads++; throw Error('must not run'); } } };
    Object.defineProperty(data, 'secret', { enumerable: true, get() { reads++; throw Error('private'); } });
    const view = render(<MemoryInspector data={data} unstyled={unstyled} />);
    expect(reads).toBe(0); expect(view.container.textContent).toContain('[Unavailable]'); expect(view.container.textContent).toContain('1n');
    expect(view.container.textContent).not.toContain('hidden');
    expect(Object.getOwnPropertyDescriptor(data, 'secret')?.get).toBeDefined(); expect(Object.isFrozen(data)).toBe(false);
  });

  it('does not turn unavailable legacy getter fields into changed/unchanged diff evidence', () => {
    let reads = 0; const previous: Record<string, unknown> = {}, current: Record<string, unknown> = {};
    for (const data of [previous, current]) Object.defineProperty(data, 'secret', { enumerable: true, get() { reads++; throw Error('private'); } });
    const view = render(<ScopeDiff previous={previous} current={current} unstyled />);
    expect(reads).toBe(0); expect(view.container.textContent).toContain('[Unavailable]'); expect(view.queryByText('No changes')).toBeNull();
    expect(view.container.querySelectorAll('[data-fp="diff-entry"]')).toHaveLength(0);
  });

  it('shows unavailable stage ledger fields without executing getters or inventing a change', () => {
    let reads = 0; const before: Record<string, unknown> = {}, after: Record<string, unknown> = { secret: 1n };
    Object.defineProperty(before, 'secret', { enumerable: true, get() { reads++; throw Error('private'); } });
    const view = render(<StageDetailPanel snapshots={[snapshot(before), snapshot(after)]} selectedIndex={1} mode="dev" unstyled />);
    expect(reads).toBe(0); expect(view.container.querySelector('[data-fp="memory-unavailable"]')?.textContent).toContain('[Unavailable]');
    expect(view.container.querySelectorAll('[data-fp="memory-change"]')).toHaveLength(0);
  });

  it('renders recorder fallback and commit update payloads with typed native values', () => {
    const native = { amount: 1n, map: new Map([['x', 2n]]), set: new Set([3n]), date: new Date(0) };
    const view = render(<KeyedRecorderView data={native} snapshots={[]} selectedIndex={0} unstyled />);
    expect(view.container.textContent).toContain('1n'); expect(view.container.textContent).toContain('Map');
    const structure = createTraceStructureRecorder();
    structure.recorder.onStageAdded!({ stageId: 'Write', name: 'Write', type: 'stage', spec: { id: 'Write', name: 'Write', type: 'stage' } });
    const flow = createCommitFlowRecorder({ structure }); flow.recorder.onCommit!({ stage: 'Write', runtimeStageId: 'Write#0', updates: native, reads: [] });
    view.rerender(<CommitInspector index={flow.getIndex()} selectedRuntimeStageId={asRuntimeStageId('Write#0')} />);
    for (const value of ['1n', 'Map', 'Set', 'Date']) expect(view.container.textContent).toContain(value);
  });

  it('copies bounded native debug values without evaluating toJSON or leaking stringify errors', async () => {
    let calls = 0; const writeText = vi.fn().mockResolvedValue(undefined);
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    try {
      const view = render(<NarrativePanel snapshots={[snapshot({})]} selectedIndex={0} runtimeSnapshot={{ sharedState: {
        amount: 1n, map: new Map([['x', 2n]]), value: { toJSON() { calls++; throw Error('must not call'); } },
      } }} unstyled />);
      fireEvent.click(view.getByRole('button', { name: 'Copy full run debug bundle' })); await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
      const text = writeText.mock.calls[0][0] as string; expect(text).toContain('1n'); expect(text).toContain('Map'); expect(text).toContain('[Unavailable]');
      expect(text).not.toContain('stringify error'); expect(calls).toBe(0); expect(text.length).toBeLessThan(501_000);
    } finally { if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard); else delete (navigator as unknown as { clipboard?: unknown }).clipboard; }
  });

  it('extends native trace previews while preserving ordinary preview spelling and cap', () => {
    expect(recordedValuePreview({ value: 1 })).toBe('{value: 1}');
    expect(recordedValuePreview(1n)).toBe('1n'); expect(recordedValuePreview(new Map([['x', 1n]]))).toContain('Map');
    expect(recordedValuePreview(new Set([1n]))).toContain('Set'); expect(recordedValuePreview(new Date(0))).toContain('Date');
    expect(recordedValuePreview(new Map(Array.from({ length: 20 }, (_, i) => [String(i), BigInt(i)])))!.length).toBeLessThanOrEqual(100);
  });
});
