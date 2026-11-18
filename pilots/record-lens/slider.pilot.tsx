/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RecordTimeSlider } from "../../src/record";
import type { Stop } from "../../src/record";

afterEach(cleanup);

const stops: Stop[] = ["Load", "Price", "Deliver"].map((label, step) => ({
  kind: "commit", label, step, stageId: label, runtimeStageId: label + "#0",
  commitIdx: step * 3, lastCommitIdx: step * 3 + 2,
}));

describe("Foottrace stop slider", () => {
  it("uses canonical steps for all scales and both presentations", () => {
    const onStepChange = vi.fn();
    const durationForStop = vi.fn((stop: Stop) => [32, 1, 16][stop.step]);
    const props = { stops, step: 1, onStepChange, durationForStop };
    const { rerender, container } = render(<RecordTimeSlider {...props} />);
    const input = () => screen.getByRole("slider");
    expect(input().getAttribute("aria-valuetext")).toContain("2 of 3: Price");
    expect(durationForStop).not.toHaveBeenCalled();
    fireEvent.change(input(), { target: { value: "2" } });
    expect(onStepChange).toHaveBeenLastCalledWith(2);
    for (const scale of ["duration", "log-duration"] as const) {
      rerender(<RecordTimeSlider {...props} scale={scale} presentation="segmented" />);
      const ticks = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-fp="tt-tick"]'));
      expect(ticks).toHaveLength(3);
      const relative = Number(ticks[2].style.flexGrow) / Number(ticks[0].style.flexGrow);
      expect(relative).toBeCloseTo(scale === "duration" ? 16 / 32 : Math.log1p(16) / Math.log1p(32));
      fireEvent.keyDown(input(), { key: "ArrowLeft" });
      expect(onStepChange).toHaveBeenLastCalledWith(0);
      fireEvent.keyDown(input(), { key: "End" });
      expect(onStepChange).toHaveBeenLastCalledWith(2);
    }
    expect(durationForStop).toHaveBeenCalledTimes(stops.length);
    rerender(<RecordTimeSlider {...props} step={2} scale="duration" />);
    expect(durationForStop).toHaveBeenCalledTimes(stops.length);
    expect(input().getAttribute("aria-valuetext")).toContain("Deliver, 16 ms");
    expect(container.querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(0);
  });

  it.each([{ source: [] }, { source: stops.slice(0, 1) }])("keeps a disabled segmented track inert", ({ source }) => {
    const change = vi.fn();
    const { container } = render(<RecordTimeSlider stops={source} step={0} scale="duration" presentation="segmented" onStepChange={change} />);
    const track = container.querySelector<HTMLElement>('[data-fp="tt-position-axis"]')!;
    const capture = vi.fn();
    track.setPointerCapture = capture;
    track.getBoundingClientRect = () => ({ left: 0, width: 100 }) as DOMRect;
    const event = new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 50 });
    fireEvent(track, event);
    expect(capture).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
  });

  it("discloses missing timings and never replaces a rejected cursor with a valid stop", () => {
    const change = vi.fn();
    const { rerender } = render(<RecordTimeSlider stops={stops} step={1} scale="duration" onStepChange={change} />);
    expect(screen.getByText(/equal step spacing/i)).toBeTruthy();
    rerender(<RecordTimeSlider stops={stops} step={8} onStepChange={change} />);
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.getByRole("alert")).toBeTruthy();
    rerender(<RecordTimeSlider stops={[]} step={0} onStepChange={change} />);
    expect(screen.getByRole("slider")).toHaveProperty("disabled", true);
    expect(change).not.toHaveBeenCalled();
  });
});

it('groups long timelines while weighted selection still addresses each original stop', () => {
  const count = 10_002;
  const many: Stop[] = Array.from({ length: count }, (_, step) => ({
    kind: 'commit', step, label: 'Stage ' + step, stageId: 'A', runtimeStageId: 'A#' + step,
    commitIdx: step, lastCommitIdx: step,
  }));
  const change = vi.fn(), measured = () => 1;
  const view = render(<RecordTimeSlider stops={many} step={5011} onStepChange={change}
    presentation="segmented" scale="duration" durationForStop={measured} />);
  const ticks = view.container.querySelectorAll<HTMLButtonElement>('[data-fp="tt-tick"]');
  expect(ticks).toHaveLength(128);
  expect(ticks[64].dataset.active).toBe('true');
  const marker = view.container.querySelector<HTMLElement>('[data-fp="tt-current-position"]')!;
  const firstCoordinate = Number.parseFloat(marker.style.left);
  view.rerender(<RecordTimeSlider stops={many} step={5012} onStepChange={change}
    presentation="segmented" scale="duration" durationForStop={measured} />);
  expect(Number.parseFloat(marker.style.left)).toBeGreaterThan(firstCoordinate);
  // Every stage has the same positive duration, so aggregated width is its original stage count.
  expect([...ticks].reduce((sum, tick) => sum + Number(tick.style.flexGrow), 0)).toBe(count);
  fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
  expect(change).toHaveBeenLastCalledWith(5013);
  fireEvent.change(screen.getByRole('slider'), { target: { value: String(7013 / (count - 1)) } });
  expect(change).toHaveBeenLastCalledWith(7013);
  view.rerender(<RecordTimeSlider stops={many} step={5011} onStepChange={change} presentation="range" />);
  expect(view.container.querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(0);
});
