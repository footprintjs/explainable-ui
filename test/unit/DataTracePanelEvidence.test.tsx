/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { DataTracePanel, type CausalFrame } from "../../src/components/DataTracePanel/DataTracePanel";

const frames: CausalFrame[] = [
  { runtimeStageId: "use#2", stageId: "use", stageName: "Use", keysWritten: ["answer"], linkedBy: "", depth: 0 },
  { runtimeStageId: "load#1", stageId: "load", stageName: "Load", keysWritten: ["data"], linkedBy: "data", depth: 1 },
];

describe.each([false, true])("DataTracePanel evidence language (unstyled=%s)", unstyled => {
  it("labels recorded reads and the end of the shown trace without asserting a value origin", () => {
    const onFrameClick = vi.fn();
    const view = render(<DataTracePanel frames={frames} fromStageName="Use" selectedStageId="use#2" onFrameClick={onFrameClick} unstyled={unstyled} />);
    expect(view.getByText("Recorded state reads link to earlier local writes; output derivation is not established.")).toBeTruthy();
    expect(view.getByText("← state read: data")).toBeTruthy();
    expect(view.getByText("(end of shown trace)")).toBeTruthy();
    expect(view.queryByText(/origin|derived from|influenced/i)).toBeNull();
    fireEvent.click(view.getByRole("button", { name: /Load/ }));
    expect(onFrameClick).toHaveBeenCalledExactlyOnceWith("load#1");
  });

  it("keeps unavailable or hidden evidence explicit without promising a complete chain", () => {
    const note = "Some recorded references are hidden; earlier sources remain unknown.";
    const view = render(<DataTracePanel frames={[]} note={note} unstyled={unstyled} />);
    expect(view.getByText("Backward state-read trace")).toBeTruthy();
    expect(view.getByText("Inspect recorded state reads and their earlier local writers.")).toBeTruthy();
    expect(view.getByText(note)).toBeTruthy();
    expect(view.queryByText(/everything upstream|created it|origin/i)).toBeNull();
  });
});
