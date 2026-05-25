/** @vitest-environment jsdom */
/**
 * L8.5 — `<RunSlider>` component test matrix.
 *
 * Scenarios:
 *   - empty index → slider disabled, "No commits yet" label
 *   - single commit → slider disabled (no scrub range)
 *   - many commits → slider enabled; value === cursor's commitIdx
 *   - cursor === null with commits → slider at 0
 *   - cursor === unknown rsid → slider at 0 (defensive fallback)
 *   - moving slider fires onCursorChange with the right rsid
 *   - custom renderLabel hook used when provided
 *   - a11y: slider has role + aria-value* + aria-label
 *   - new commits arriving (growing length) expand max bound
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RunSlider } from "../../src/components/FlowchartView/RunSlider";
import { createTraceStructureRecorder } from "../../src/components/FlowchartView/traceStructureRecorder";
import { createCommitFlowRecorder } from "../../src/components/FlowchartView/createCommitFlowRecorder";
import { asRuntimeStageId } from "../../src/components/FlowchartView/_internal/keys";

const spec = (id: string, name: string) => ({ id, name, type: "stage" as const });

function buildIndex(stages: string[]) {
  const trace = createTraceStructureRecorder();
  const r = trace.recorder;
  for (const s of stages) {
    r.onStageAdded!({ stageId: s, name: s, type: "stage", spec: spec(s, s) });
  }
  for (let i = 0; i < stages.length - 1; i++) {
    r.onEdgeAdded!({ from: stages[i]!, to: stages[i + 1]!, kind: "next" });
  }
  const cf = createCommitFlowRecorder({ structure: trace });
  for (let i = 0; i < stages.length; i++) {
    cf.recorder.onCommit!({
      stage: stages[i]!,
      runtimeStageId: `${stages[i]}#${i}`,
      updates: {},
      reads: [],
    });
  }
  return cf;
}

describe("<RunSlider>", () => {
  it("empty index — slider disabled, 'No commits yet' label", () => {
    const trace = createTraceStructureRecorder();
    const cf = createCommitFlowRecorder({ structure: trace });
    const { container } = render(
      <RunSlider index={cf.getIndex()} cursorRuntimeStageId={null} onCursorChange={() => {}} />,
    );
    expect(container.textContent).toContain("No commits yet");
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    expect(slider.disabled).toBe(true);
  });

  it("single commit — slider disabled (no scrub range)", () => {
    const cf = buildIndex(["only"]);
    const { container } = render(
      <RunSlider index={cf.getIndex()} cursorRuntimeStageId={null} onCursorChange={() => {}} />,
    );
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    expect(slider.disabled).toBe(true);
  });

  it("many commits — slider enabled; value === cursor's commitIdx", () => {
    const cf = buildIndex(["A", "B", "C", "D"]);
    const { container } = render(
      <RunSlider
        index={cf.getIndex()}
        cursorRuntimeStageId={asRuntimeStageId("C#2")}
        onCursorChange={() => {}}
      />,
    );
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    expect(slider.disabled).toBe(false);
    expect(slider.max).toBe("3");
    expect(slider.value).toBe("2");
    expect(container.textContent).toContain("#3 / 4");
    expect(container.textContent).toContain("C#2");
  });

  it("cursor === null with commits — slider at 0", () => {
    const cf = buildIndex(["A", "B", "C"]);
    const { container } = render(
      <RunSlider index={cf.getIndex()} cursorRuntimeStageId={null} onCursorChange={() => {}} />,
    );
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    expect(slider.value).toBe("0");
  });

  it("cursor === unknown rsid — slider at 0 (defensive fallback)", () => {
    const cf = buildIndex(["A", "B"]);
    const { container } = render(
      <RunSlider
        index={cf.getIndex()}
        cursorRuntimeStageId={asRuntimeStageId("ghost#99")}
        onCursorChange={() => {}}
      />,
    );
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    expect(slider.value).toBe("0");
  });

  it("moving slider fires onCursorChange with the right rsid", () => {
    const cf = buildIndex(["A", "B", "C", "D"]);
    const onCursorChange = vi.fn();
    const { container } = render(
      <RunSlider
        index={cf.getIndex()}
        cursorRuntimeStageId={asRuntimeStageId("A#0")}
        onCursorChange={onCursorChange}
      />,
    );
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "2" } });
    expect(onCursorChange).toHaveBeenCalledWith("C#2");
  });

  it("renderLabel hook overrides the default label", () => {
    const cf = buildIndex(["A", "B", "C"]);
    const { container } = render(
      <RunSlider
        index={cf.getIndex()}
        cursorRuntimeStageId={asRuntimeStageId("B#1")}
        onCursorChange={() => {}}
        renderLabel={({ commitIdx, total, runtimeStageId }) => (
          <span data-testid="custom-label">
            CUSTOM {commitIdx}/{total - 1} {runtimeStageId}
          </span>
        )}
      />,
    );
    expect(container.querySelector("[data-testid=custom-label]")?.textContent).toContain(
      "CUSTOM 1/2 B#1",
    );
  });

  it("a11y — slider exposes role, aria-label, aria-value*, aria-valuetext", () => {
    const cf = buildIndex(["A", "B", "C"]);
    const { container } = render(
      <RunSlider
        index={cf.getIndex()}
        cursorRuntimeStageId={asRuntimeStageId("B#1")}
        onCursorChange={() => {}}
      />,
    );
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    expect(slider.getAttribute("aria-label")).toBe("Commit time cursor");
    expect(slider.getAttribute("aria-valuemin")).toBe("0");
    expect(slider.getAttribute("aria-valuemax")).toBe("2");
    expect(slider.getAttribute("aria-valuenow")).toBe("1");
    expect(slider.getAttribute("aria-valuetext")).toBe("commit 2 of 3");
  });

  it("PROPERTY — cursor↔value round-trip holds for any commit in the index (sizes 2..20)", () => {
    for (let size = 2; size <= 20; size++) {
      const stages = Array.from({ length: size }, (_, i) => `S${i}`);
      const cf = buildIndex(stages);
      const index = cf.getIndex();
      // For each commit, render with that cursor → assert slider value === commitIdx.
      for (let i = 0; i < size; i++) {
        const rsid = index.commits[i]!.runtimeStageId;
        const onCursorChange = vi.fn();
        const { container, unmount } = render(
          <RunSlider
            index={index}
            cursorRuntimeStageId={rsid}
            onCursorChange={onCursorChange}
          />,
        );
        const slider = container.querySelector("input[type=range]") as HTMLInputElement;
        expect(slider.value).toBe(String(i));
        // Scrub to value → fires onCursorChange with commits[value].runtimeStageId.
        const targetIdx = (i + 1) % size;
        fireEvent.change(slider, { target: { value: String(targetIdx) } });
        expect(onCursorChange).toHaveBeenCalledWith(
          index.commits[targetIdx]!.runtimeStageId,
        );
        unmount();
      }
    }
  });

  it("bidirectional movement — slider scrubs left and right correctly", () => {
    const cf = buildIndex(["A", "B", "C", "D", "E"]);
    const onCursorChange = vi.fn();
    const { container } = render(
      <RunSlider
        index={cf.getIndex()}
        cursorRuntimeStageId={asRuntimeStageId("D#3")}
        onCursorChange={onCursorChange}
      />,
    );
    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "1" } }); // left
    expect(onCursorChange).toHaveBeenLastCalledWith("B#1");
    fireEvent.change(slider, { target: { value: "0" } }); // far left (commit 0)
    expect(onCursorChange).toHaveBeenLastCalledWith("A#0");
    fireEvent.change(slider, { target: { value: "4" } }); // far right
    expect(onCursorChange).toHaveBeenLastCalledWith("E#4");
  });

  it("growing index — re-render with more commits expands max bound", () => {
    const cf = buildIndex(["A", "B"]);
    const { container, rerender } = render(
      <RunSlider
        index={cf.getIndex()}
        cursorRuntimeStageId={asRuntimeStageId("B#1")}
        onCursorChange={() => {}}
      />,
    );
    let slider = container.querySelector("input[type=range]") as HTMLInputElement;
    expect(slider.max).toBe("1");

    // Add 2 more commits.
    cf.recorder.onCommit!({ stage: "C", runtimeStageId: "C#2", updates: {}, reads: [] });
    cf.recorder.onCommit!({ stage: "D", runtimeStageId: "D#3", updates: {}, reads: [] });
    rerender(
      <RunSlider
        index={cf.getIndex()}
        cursorRuntimeStageId={asRuntimeStageId("B#1")}
        onCursorChange={() => {}}
      />,
    );
    slider = container.querySelector("input[type=range]") as HTMLInputElement;
    expect(slider.max).toBe("3");
    // Cursor is still at B#1 (didn't auto-jump).
    expect(slider.value).toBe("1");
  });
});
