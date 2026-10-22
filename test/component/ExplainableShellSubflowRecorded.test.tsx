/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { ExplainableShell } from '../../src/components/ExplainableShell/ExplainableShell';
import { createTraceStructureRecorder } from '../../src/components/FlowchartView/traceStructureRecorder';

type ShellProps = React.ComponentProps<typeof ExplainableShell>;
interface RecordedRun {
  runtimeSnapshot: NonNullable<ShellProps['runtimeSnapshot']>;
  narrativeEntries: NonNullable<ShellProps['narrativeEntries']>;
  structureEvents: Array<{ method: string; event: unknown }>;
}
const bytes = readFileSync(resolve('test/fixtures/subflow-tracing/recordings.json'), 'utf8');
const recordings = JSON.parse(bytes) as { nested: RecordedRun; repeated: RecordedRun };
const provenance = JSON.parse(readFileSync(resolve('test/fixtures/subflow-tracing/provenance.json'), 'utf8')) as {
  producer: { footprintjs: string }; sha256: string;
};

function renderRecording(recording: RecordedRun) {
  const structure = createTraceStructureRecorder();
  const recorder = structure.recorder as unknown as Record<string, unknown>;
  for (const { method, event } of recording.structureEvents) {
    const handler = recorder[method];
    if (typeof handler === 'function') handler.call(recorder, event);
  }
  const ref: { changeScope?: (key: string | null) => void } = {};
  const renderFlowchart: NonNullable<ShellProps['renderFlowchart']> = props => {
    ref.changeScope = props.onSubflowChange;
    return React.createElement('div', { 'data-testid': 'recorded-chart' });
  };
  const utils = render(React.createElement(ExplainableShell, {
    runtimeSnapshot: recording.runtimeSnapshot,
    narrativeEntries: recording.narrativeEntries,
    traceGraph: structure.getGraph(),
    renderFlowchart,
  }));
  return { ...utils, drill: (key: string | null) => act(() => ref.changeScope?.(key)) };
}

function move(count: number) {
  for (let i = 0; i < count; i++) fireEvent.click(screen.getByLabelText('Next stage'));
}
function traceTotal() {
  move(3); // child Seed → Sum → Audit → Total
  fireEvent.click(screen.getByText('Inspector'));
  fireEvent.click(screen.getByText('Data Trace'));
  const chip = [...document.querySelectorAll('[data-fp="trace-any-chip"]')]
    .find(node => node.textContent === 'total');
  expect(chip, 'the selected child exposes its own written keys').toBeTruthy();
  fireEvent.click(chip!);
  const card = document.querySelector('[data-fp="trace-walk-card"]') as HTMLElement;
  expect(card).toBeTruthy();
  expect(screen.getByRole('toolbar').getAttribute('data-tracing')).toBe('true');
  return card;
}

describe('scoped tracing against recorded FootprintJS 10.3.0 runs', () => {
  it('pins the real producer and unchanged recording bytes', () => {
    expect(provenance.producer.footprintjs).toBe('10.3.0');
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(provenance.sha256);
  });

  it.each([
    { path: 'prepare', expected: 24 },
    { path: 'pipeline/prepare', expected: 44 },
  ])('uses the selected $path child, excluding same-key root and sibling writes', ({ path, expected }) => {
    const before = JSON.stringify(recordings.nested);
    const ui = renderRecording(recordings.nested);
    ui.drill(path);
    const card = traceTotal();
    expect(card.textContent).toContain(`= ${expected}`);
    expect(card.textContent).not.toContain('Root Seed');
    expect(card.textContent).not.toContain('Root Report');
    const itinerary = [...card.querySelectorAll('[data-fp="twc-itinerary-row"]')].map(row => row.textContent).join(' ');
    expect(itinerary).toMatch(/Child Sum/);
    expect(itinerary).not.toMatch(/Child Audit/);
    expect(JSON.stringify(recordings.nested)).toBe(before);
  });

  it.each([
    { rootSteps: 2, expected: 24 },
    { rootSteps: 5, expected: 44 },
  ])('uses the invocation at root step $rootSteps rather than the latest path alias', ({ rootSteps, expected }) => {
    const before = JSON.stringify(recordings.repeated);
    const ui = renderRecording(recordings.repeated);
    move(rootSteps);
    ui.drill('prepare');
    const card = traceTotal();
    expect(card.textContent).toContain(`= ${expected}`);
    expect(card.textContent).not.toContain(`= ${expected === 24 ? 44 : 24}`);
    fireEvent.click(screen.getByLabelText('Earlier cause'));
    expect(card.querySelector('[data-fp="twc-stop-headline"]')?.textContent).toMatch(/Child Sum/);
    ui.drill(null);
    expect(screen.getByRole('toolbar').getAttribute('data-tracing')).toBeNull();
    expect(document.querySelector('[data-fp="trace-walk-card"]')).toBeNull();
    expect(JSON.stringify(recordings.repeated)).toBe(before);
  });
});
