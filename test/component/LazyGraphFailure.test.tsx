/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExplainableProvider, FlowchartPanel, TimeTravelBar, useExplainableRun, type ExplainableRecording } from "../../src/components/ExplainableView";

vi.mock("../../src/components/FlowchartView/TracedFlow", async () => { throw new Error("graph module unavailable"); });
const recording: ExplainableRecording = { snapshot: { sharedState: { x: 2 },
  executionTree: { id: "a", runtimeStageId: "a#0", next: { id: "b", runtimeStageId: "b#1" } },
  commitLog: ["a", "b"].map((stage, index) => ({ stage, stageId: stage, runtimeStageId: `${stage}#${index}`, overwrite: { x: index + 1 }, updates: {}, redactedPaths: [], trace: [{ path: "x", verb: "set" }] })),
}, structure: { id: "a", name: "a", next: { id: "b", name: "b" } } };
function Cursor() {
  return <output data-testid="cursor">{useExplainableRun().selectedIndex}</output>;
}

describe("M6 graph load refusal", () => {
  it("reports an accessible failure without replacing the graph or disabling other surfaces", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const host = render(<ExplainableProvider recording={recording}><TimeTravelBar /><Cursor /><FlowchartPanel /></ExplainableProvider>);
      expect((await screen.findByRole("alert", { name: "Graph unavailable" })).textContent).toContain("could not be loaded or rendered");
      expect(screen.queryByText("Loading flowchart…")).toBeNull();
      expect(host.container.querySelector(".react-flow")).toBeNull();
      fireEvent.click(screen.getByLabelText("Next stage"));
      expect(screen.getByTestId("cursor").textContent).toBe("1");
      fireEvent.click(screen.getByLabelText("Previous stage"));
      expect(screen.getByTestId("cursor").textContent).toBe("0");
      expect(screen.getByRole("alert").textContent).toContain("reload the page");
    } finally { error.mockRestore(); }
  });
});
