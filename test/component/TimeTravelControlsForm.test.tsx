/** @vitest-environment jsdom */
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import {
  TimeTravelControls,
  type TracingRail,
} from "../../src/components/TimeTravelControls/TimeTravelControls";
import type { StageSnapshot } from "../../src/types";

const snapshots: StageSnapshot[] = ["Seed", "Subtotal", "Total"].map(
  (stageLabel, index) => ({
    stageLabel,
    stageName: stageLabel.toLowerCase(),
    runtimeStageId: `${stageLabel.toLowerCase()}#${index}`,
    memory: {},
    narrative: "",
    startMs: index,
    durationMs: 1,
  }),
);

function renderInForm(
  unstyled: boolean,
  tracing?: TracingRail,
  initialIndex = 1,
) {
  const onSubmit = vi.fn();
  const onIndexChange = vi.fn();
  function HostForm() {
    const [selectedIndex, setSelectedIndex] = useState(initialIndex);
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <TimeTravelControls
          snapshots={snapshots}
          selectedIndex={selectedIndex}
          onIndexChange={(index) => {
            onIndexChange(index);
            setSelectedIndex(index);
          }}
          tracing={tracing}
          unstyled={unstyled}
        />
        <button type="submit">Submit host form</button>
      </form>
    );
  }
  return { ...render(<HostForm />), onSubmit, onIndexChange };
}

describe.each([false, true])(
  "TimeTravelControls inside a form (unstyled=%s)",
  (unstyled) => {
    it("navigates and plays without submitting the host form", () => {
      const view = renderInForm(unstyled);
      fireEvent.click(view.getByRole("button", { name: "Previous stage" }));
      expect(view.onIndexChange).toHaveBeenLastCalledWith(0);
      fireEvent.click(view.getByRole("button", { name: "Next stage" }));
      expect(view.onIndexChange).toHaveBeenLastCalledWith(1);

      const ticks = view.container.querySelectorAll('[data-fp="tt-tick"]');
      fireEvent.click(ticks[2]);
      expect(view.onIndexChange).toHaveBeenLastCalledWith(2);
      fireEvent.click(view.getByRole("button", { name: "Play" }));
      expect(view.onIndexChange).toHaveBeenLastCalledWith(0);
      fireEvent.click(view.getByRole("button", { name: "Pause" }));
      expect(view.onSubmit).not.toHaveBeenCalled();

      // The host form still submits through its own explicit action.
      fireEvent.click(view.getByRole("button", { name: "Submit host form" }));
      expect(view.onSubmit).toHaveBeenCalledTimes(1);
    });

    it("uses tracing controls without submitting the host form", () => {
      const onExit = vi.fn();
      const onShowAll = vi.fn();
      const view = renderInForm(unstyled, {
        tracedKey: "total",
        viaKey: "subtotal",
        stopIndices: [0, 1, 2],
        stopOrdinal: 2,
        totalStops: 3,
        onExit,
        onShowAll,
      });
      fireEvent.click(view.getByRole("button", { name: "Earlier cause" }));
      expect(view.onIndexChange).toHaveBeenLastCalledWith(0);
      fireEvent.click(view.getByRole("button", { name: "Toward result" }));
      expect(view.onIndexChange).toHaveBeenLastCalledWith(1);
      fireEvent.click(
        view.container.querySelectorAll('[data-fp="tt-tick"]')[2],
      );
      expect(view.onIndexChange).toHaveBeenLastCalledWith(2);
      fireEvent.click(view.getByRole("button", { name: "show all" }));
      expect(onShowAll).toHaveBeenCalledTimes(1);
      fireEvent.click(view.getByRole("button", { name: "Exit tracing" }));
      expect(onExit).toHaveBeenCalledTimes(1);
      expect(view.onSubmit).not.toHaveBeenCalled();
    });

    it("opens the cause chooser without submitting the host form", () => {
      const onForkPrompt = vi.fn();
      const view = renderInForm(
        unstyled,
        {
          tracedKey: "total",
          stopIndices: [0, 1, 2],
          stopOrdinal: 3,
          totalStops: 3,
          forkCount: 2,
          onExit: vi.fn(),
          onForkPrompt,
        },
        0,
      );
      fireEvent.click(view.getByRole("button", { name: "Choose cause" }));
      expect(onForkPrompt).toHaveBeenCalledTimes(1);
      expect(view.onIndexChange).not.toHaveBeenCalled();
      expect(view.onSubmit).not.toHaveBeenCalled();
    });
  },
);
