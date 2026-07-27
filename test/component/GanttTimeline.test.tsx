/** @vitest-environment jsdom */
/**
 * GanttTimeline — timed runs vs. runs nothing timed.
 *
 * A snapshot recorded without a metrics recorder has all-zero durations.
 * The old rendering drew every bar at the 1% minimum against a fabricated
 * 1ms axis and printed "0ms" on every row — it looked like a broken chart
 * rather than an unmeasured one. The degrade below shows the one thing
 * that IS known (the order stages ran) and says so.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GanttTimeline } from '../../src/components/GanttTimeline/GanttTimeline';
import type { StageSnapshot } from '../../src/types';

function snaps(durations: number[]): StageSnapshot[] {
  let startMs = 0;
  return durations.map((durationMs, i) => {
    const snap: StageSnapshot = {
      stageName: `stage-${i}`,
      stageLabel: `stage-${i}`,
      memory: {},
      narrative: '',
      startMs,
      durationMs,
      status: 'done',
    };
    startMs += durationMs;
    return snap;
  });
}

const bars = (container: HTMLElement) =>
  [...container.querySelectorAll('[role="option"] div > div')] as HTMLElement[];

describe('GanttTimeline — a run that WAS timed', () => {
  it('keeps the real time axis and per-row millisecond labels', () => {
    const { container } = render(
      <GanttTimeline snapshots={snaps([10, 30, 60])} selectedIndex={2} />,
    );
    expect(container.querySelector('[data-fp="gantt-timeline"]')?.getAttribute('data-timing')).toBe(
      null,
    );
    expect(screen.getByText('10ms')).toBeTruthy();
    expect(screen.getByText('100.0ms')).toBeTruthy(); // axis end = total wall time
    expect(container.querySelector('[data-fp="gantt-no-timing"]')).toBeNull();
  });

  it('bars stay proportional to duration', () => {
    const { container } = render(
      <GanttTimeline snapshots={snaps([10, 30, 60])} selectedIndex={2} />,
    );
    const widths = bars(container).map((b) => b.style.width);
    expect(widths).toEqual(['10%', '30%', '60%']);
  });

  it('a single measured stage among zeros still counts as timed', () => {
    const { container } = render(
      <GanttTimeline snapshots={snaps([0, 5, 0])} selectedIndex={2} />,
    );
    expect(container.querySelector('[data-fp="gantt-no-timing"]')).toBeNull();
    expect(screen.getAllByText('0ms').length).toBeGreaterThan(0);
  });
});

describe('GanttTimeline — a run nothing timed (all durations zero)', () => {
  it('says so once, in plain words, instead of drawing a fake axis', () => {
    const { container } = render(
      <GanttTimeline snapshots={snaps([0, 0, 0, 0])} selectedIndex={3} />,
    );
    const notes = container.querySelectorAll('[data-fp="gantt-no-timing"]');
    expect(notes).toHaveLength(1);
    expect(notes[0]!.textContent).toContain('No timing recorded');
    expect(container.querySelector('[data-fp="gantt-timeline"]')?.getAttribute('data-timing')).toBe(
      'none',
    );
    // The fabricated "0ms … 1.0ms" axis is gone.
    expect(screen.queryByText('1.0ms')).toBeNull();
    expect(screen.queryByText('0.5ms')).toBeNull();
  });

  it("shows '—' per row, never '0ms'", () => {
    render(<GanttTimeline snapshots={snaps([0, 0, 0])} selectedIndex={2} />);
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText('0ms')).toBeNull();
  });

  it('renders equal-width sequence bars — order is real, duration is not', () => {
    const { container } = render(
      <GanttTimeline snapshots={snaps([0, 0, 0, 0])} selectedIndex={3} />,
    );
    const rendered = bars(container);
    expect(rendered).toHaveLength(4);
    expect(rendered.map((b) => b.style.width)).toEqual(['25%', '25%', '25%', '25%']);
    // ...and they step across in execution order rather than piling up at 0%.
    expect(rendered.map((b) => b.style.left)).toEqual(['0%', '25%', '50%', '75%']);
  });

  it('never invents a duration: the row label reads as a step, not a time', () => {
    render(<GanttTimeline snapshots={snaps([0, 0])} selectedIndex={1} />);
    expect(screen.getByLabelText('stage-0, step 1 of 2, no timing recorded')).toBeTruthy();
  });

  it('degrades the same way in unstyled mode', () => {
    const { container } = render(
      <GanttTimeline snapshots={snaps([0, 0])} selectedIndex={1} unstyled />,
    );
    expect(container.querySelector('[data-fp="gantt-timeline"]')?.getAttribute('data-timing')).toBe(
      'none',
    );
    expect(container.querySelector('[data-fp="gantt-no-timing"]')).toBeTruthy();
    const durations = [...container.querySelectorAll('[data-fp="gantt-duration"]')].map(
      (d) => d.textContent,
    );
    expect(durations).toEqual(['—', '—']);
  });

  it('an empty timeline is left exactly as it was (nothing ran — nothing to explain)', () => {
    const { container } = render(<GanttTimeline snapshots={[]} selectedIndex={0} />);
    expect(container.querySelector('[data-fp="gantt-no-timing"]')).toBeNull();
    expect(container.querySelector('[data-fp="gantt-timeline"]')?.getAttribute('data-timing')).toBe(
      null,
    );
    expect(screen.getByText('0ms')).toBeTruthy(); // the axis renders as before
  });
});
