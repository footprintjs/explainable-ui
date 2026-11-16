/** @vitest-environment jsdom */
import { forwardRef, useState, type ComponentProps, type InputHTMLAttributes } from "react";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimeTravelControls } from "../../src/components/TimeTravelControls";
import { FootprintTheme } from "../../src/theme";
import type { StageSnapshot } from "../../src/types";

const snapshots: StageSnapshot[] = ["Seed", "Clean", "Audit", "Scale", "Total"].map((name, index) => ({
  runtimeStageId: `${name.toLowerCase()}#${index}`, stageName: name, stageLabel: name, memory: {}, narrative: "", startMs: index, durationMs: 1,
}));
const defaults = { snapshots, selectedIndex: 1, onIndexChange: vi.fn() };

function CursorHost(props: Partial<ComponentProps<typeof TimeTravelControls>>) {
  const [selectedIndex, setSelectedIndex] = useState(1);
  return <TimeTravelControls snapshots={snapshots} selectedIndex={selectedIndex} onIndexChange={setSelectedIndex} {...props} />;
}

describe("configurable replay controls", () => {
  it("keeps each transport control independently optional and hides an empty normal rail", () => {
    const view = render(<TimeTravelControls {...defaults} />);
    expect(screen.getByRole("button", { name: "Previous stage" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next stage" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Replay position" })).toBeTruthy();
    view.rerender(<TimeTravelControls {...defaults} replayControls={{ previousNext: false }} />);
    expect(screen.queryByRole("button", { name: "Previous stage" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Next stage" })).toBeNull();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
    expect(screen.getByRole("slider")).toBeTruthy();
    view.rerender(<TimeTravelControls {...defaults} replayControls={{ playPause: false, slider: false }} />);
    expect(screen.getByRole("button", { name: "Previous stage" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
    expect(view.container.querySelector('[data-fp="tt-tick"]')).toBeNull();
    view.rerender(<TimeTravelControls {...defaults} replayControls={{ previousNext: false, playPause: false, slider: false }} />);
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("honors the legacy Play veto and keeps tracing return when every transport option is hidden", () => {
    const exit = vi.fn();
    const view = render(<TimeTravelControls {...defaults} autoPlayable={false} replayControls={{ playPause: true }} />);
    expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
    view.rerender(<TimeTravelControls {...defaults} replayControls={{ previousNext: false, playPause: false, slider: false }}
      tracing={{ tracedKey: "total", stopIndices: [1, 4], stopOrdinal: 1, totalStops: 2, onExit: exit }} />);
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.queryByRole("button", { name: "Earlier recorded step" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Exit tracing" }));
    fireEvent.keyDown(screen.getByRole("toolbar"), { key: "Escape" });
    expect(exit).toHaveBeenCalledTimes(2);
  });

  it("scrubs one cursor on the existing axis with one range tab stop and a visible focus outline", () => {
    const view = render(<CursorHost />);
    const slider = screen.getByRole("slider", { name: "Replay position" }) as HTMLInputElement;
    expect(slider.min).toBe("0"); expect(slider.max).toBe("4"); expect(slider.step).toBe("1");
    expect(slider.value).toBe("1");
    expect(slider.getAttribute("aria-valuetext")).toBe("Step 2 of 5: Clean");
    const ticks = [...view.container.querySelectorAll('[data-fp="tt-tick"]')];
    expect(ticks).toHaveLength(5);
    expect(ticks.every(tick => tick.getAttribute("aria-hidden") === "true" && tick.getAttribute("tabindex") === "-1")).toBe(true);
    fireEvent.change(slider, { target: { value: "3" } });
    expect(slider.value).toBe("3");
    expect(slider.getAttribute("aria-valuetext")).toBe("Step 4 of 5: Scale");
    expect(ticks[3].getAttribute("data-active")).toBe("true");
    fireEvent.focus(slider);
    expect(view.container.querySelector<HTMLElement>('[data-fp="tt-position-axis"]')!.style.outline).toContain("--fp-focus-width");
    fireEvent.blur(slider);
    expect(view.container.querySelector<HTMLElement>('[data-fp="tt-position-axis"]')!.style.outline).toBe("");
  });

  it("leaves range arrow defaults intact without also stepping the toolbar", () => {
    const change = vi.fn();
    render(<TimeTravelControls {...defaults} onIndexChange={change} />);
    const slider = screen.getByRole("slider");
    const key = createEvent.keyDown(slider, { key: "ArrowRight", bubbles: true, cancelable: true });
    fireEvent(slider, key);
    expect(key.defaultPrevented).toBe(false);
    expect(change).not.toHaveBeenCalled();
    fireEvent.change(slider, { target: { value: "2" } });
    expect(change).toHaveBeenCalledExactlyOnceWith(2);
  });

  it("snaps trace scrubbing to stops and lets native arrow changes cross sparse gaps", () => {
    const change = vi.fn(), exit = vi.fn();
    render(<TimeTravelControls {...defaults} onIndexChange={change}
      tracing={{ tracedKey: "total", stopIndices: [1, 4], stopOrdinal: 2, totalStops: 2, onExit: exit }} />);
    const slider = screen.getByRole("slider", { name: "Trace position" });
    fireEvent.change(slider, { target: { value: "2" } });
    expect(change).toHaveBeenLastCalledWith(1);
    change.mockClear();
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.change(slider, { target: { value: "2" } });
    expect(change).toHaveBeenCalledExactlyOnceWith(4);
    fireEvent.keyUp(slider, { key: "ArrowRight" });
    fireEvent.keyDown(slider, { key: "Escape" });
    expect(exit).toHaveBeenCalledOnce();
  });

  it("forwards native range geometry to host Inputs and keeps unstyled controls free of library paint", () => {
    const HostInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => <input {...props} ref={ref} data-host="input" />);
    const change = vi.fn();
    const view = render(<FootprintTheme components={{ Input: HostInput }}>
      <TimeTravelControls {...defaults} onIndexChange={change} />
    </FootprintTheme>);
    const slider = screen.getByRole("slider");
    expect(slider.getAttribute("data-host")).toBe("input");
    expect(slider.getAttribute("data-fp-part")).toBe("time-travel-slider");
    expect(slider.style.position).toBe("absolute");
    expect(slider.style.width).toBe("100%");
    expect(slider.style.opacity).toBe("0");
    expect(slider.style.border).toBe("");
    fireEvent.change(slider, { target: { value: "4" } });
    expect(change).toHaveBeenCalledExactlyOnceWith(4);
    view.rerender(<TimeTravelControls {...defaults} unstyled />);
    expect(screen.getAllByRole("slider")).toHaveLength(1);
    expect(view.container.querySelector("[style]")).toBeNull();
    expect(view.container.querySelector('[data-fp="tt-ticks"]')?.hasAttribute("hidden")).toBe(true);
  });

  it("bounds and disables a range without enough recorded positions", () => {
    const view = render(<TimeTravelControls snapshots={[]} selectedIndex={Number.NaN} onIndexChange={vi.fn()} />);
    const slider = screen.getByRole("slider") as HTMLInputElement;
    expect(slider.min).toBe("0"); expect(slider.max).toBe("0"); expect(slider.disabled).toBe(true);
    expect(slider.getAttribute("aria-valuetext")).toBe("No recorded stages");
    view.rerender(<TimeTravelControls snapshots={snapshots.slice(0, 1)} selectedIndex={999} onIndexChange={vi.fn()} />);
    expect(slider.value).toBe("0");
    expect(slider.disabled).toBe(true);
  });
});
