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
