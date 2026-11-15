/** @vitest-environment jsdom */
import * as React from "react";
import { forwardRef } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompactTimeline } from "../../src/components/CompactTimeline/CompactTimeline";
import { SubflowBreadcrumb } from "../../src/components/FlowchartView/SubflowBreadcrumb";
import { SubflowTree } from "../../src/components/FlowchartView/SubflowTree";
import { MemoryPanel } from "../../src/components/MemoryPanel/MemoryPanel";
import { MemoryInspector } from "../../src/components/MemoryInspector/MemoryInspector";
import { ResultPanel } from "../../src/components/ResultPanel/ResultPanel";
import { ScopeDiff } from "../../src/components/ScopeDiff/ScopeDiff";
import { GanttTimeline } from "../../src/components/GanttTimeline/GanttTimeline";
import { FootprintTheme } from "../../src/theme";
import type { StageSnapshot } from "../../src/types";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";

const snapshots: StageSnapshot[] = [
  { stageName: "Seed", stageLabel: "Seed", runtimeStageId: "seed#0", memory: { input: 1 }, narrative: "", startMs: 0, durationMs: 10 },
  { stageName: "Prepare", stageLabel: "Prepare", runtimeStageId: "prepare#1", memory: { input: 1, output: 2 }, narrative: "", startMs: 10, durationMs: 30 },
  { stageName: "Finish", stageLabel: "Finish", runtimeStageId: "finish#2", memory: { output: 2 }, narrative: "", startMs: 40, durationMs: 60 },
];
const graph: TraceGraph = {
  nodes: [
    { id: "first", type: "stageNode", data: { label: "Prepare", isSubflow: true, subflowId: "prepare", isDecider: false, isFork: false, isStreaming: false, prevIds: [], nextIds: [] }, position: { x: 0, y: 0 } },
    { id: "second", type: "stageNode", data: { label: "Prepare", isSubflow: true, subflowId: "prepare", isDecider: false, isFork: false, isStreaming: false, prevIds: [], nextIds: [] }, position: { x: 0, y: 0 } },
  ], edges: [],
};

const HostButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function HostButton(props, ref) {
  return <button {...props} ref={ref} data-host="button" />;
});

describe("Core Lens surface theme and unstyled parity", () => {
  it("keeps the collapsed timeline toggle and expanded timeline content without paint", () => {
    const view = render(<CompactTimeline snapshots={snapshots} selectedIndex={1} unstyled />);
    const toggle = view.container.querySelector('[data-fp="compact-timeline-toggle"]') as HTMLButtonElement;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(view.container.querySelectorAll('[data-fp="compact-timeline-dot"]')).toHaveLength(3);
    expect(view.container.querySelector('[data-fp="compact-timeline-dot"][data-selected="true"]')).toBeTruthy();
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("listbox", { name: "Execution timeline" })).toBeTruthy();
    expect(screen.getByText("100.0ms")).toBeTruthy();
    expect(view.container.querySelectorAll("[style]")).toHaveLength(0);
  });

  it("keeps unstyled breadcrumb navigation and does not add styles on hover", () => {
    const navigate = vi.fn();
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const view = render(<SubflowBreadcrumb breadcrumbs={[{ label: "Run" }, { label: "Prepare" }]} onNavigate={navigate} unstyled />);
    const back = screen.getByRole("button", { name: "Run" });
    fireEvent.mouseEnter(back);
    fireEvent.mouseLeave(back);
    fireEvent.click(back);
    expect(navigate).toHaveBeenCalledWith(0);
    expect(view.container.textContent).toContain("Prepare");
    expect(view.container.querySelectorAll("[style]")).toHaveLength(0);
    warning.mockRestore();
  });

  it("keeps exact repeated-mount navigation and labels in an unstyled tree", () => {
    const choose = vi.fn();
    const view = render(<SubflowTree graph={graph} activeStage="Prepare" onNodeSelect={choose} unstyled />);
    expect(view.container.textContent).toContain("Subflows");
    const choices = screen.getAllByRole("button", { name: /Prepare/ });
    fireEvent.mouseEnter(choices[1]);
    fireEvent.mouseLeave(choices[1]);
    fireEvent.click(choices[1]);
    expect(choose).toHaveBeenCalledWith("Prepare", true, "second");
    expect(choices[1].getAttribute("aria-current")).toBe("step");
    expect(view.container.querySelectorAll("[style]")).toHaveLength(0);
  });

  it("does not write library hover paint into host tree or breadcrumb buttons", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const view = render(<FootprintTheme components={{ Button: HostButton }}>
      <SubflowTree graph={graph} />
      <SubflowBreadcrumb breadcrumbs={[{ label: "Run" }, { label: "Child" }]} onNavigate={() => {}} />
    </FootprintTheme>);
    for (const button of view.container.querySelectorAll<HTMLElement>('[data-host="button"]')) {
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      expect(button.getAttribute("style")).toBeNull();
    }
    warning.mockRestore();
  });

  it("retains Gantt collapse and keyboard stage selection in unstyled mode", () => {
    const choose = vi.fn();
    const view = render(<GanttTimeline snapshots={snapshots} selectedIndex={1} maxVisibleRows={1} onSelect={choose} unstyled />);
    const more = screen.getByRole("button", { name: "2 more..." });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(more);
    expect(screen.getByRole("button", { name: "Collapse" }).getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(screen.getByRole("option", { name: "Finish, 60ms" }), { key: "Enter" });
    expect(choose).toHaveBeenCalledWith(2);
    const first = screen.getByRole("option", { name: "Seed, 10ms" });
    expect(first.getAttribute("data-left-pct")).toBe("0");
    expect(first.getAttribute("data-width-pct")).toBe("10");
    expect(view.container.querySelectorAll("[style]")).toHaveLength(0);
  });

  it("uses micro tokens in state and result surfaces while retaining current data", () => {
    const view = render(<>
      <MemoryPanel snapshots={snapshots} selectedIndex={2} />
      <ResultPanel data={{ output: 2 }} logs={["Finished"]} />
    </>);
    const memory = screen.getByRole("region", { name: "Memory state" });
    expect(memory.getAttribute("style")).toContain("--fp-space-md");
    expect(memory.textContent).not.toContain('"input"');
    expect(memory.textContent).toContain('"output"');
    const result = view.container.querySelector('[data-fp="result-panel"] pre') as HTMLElement;
    expect(result.getAttribute("style")).toContain("--fp-font-size-body");
    expect(result.getAttribute("style")).toContain("--fp-radius-panel");
    expect(result.textContent).toContain('"output": 2');
    expect(screen.getByText("Finished")).toBeTruthy();
  });

  it("keeps state types, empty-diff messages and result contents in unstyled mode", () => {
    const view = render(<>
      <MemoryInspector data={{ count: 2 }} showTypes unstyled />
      <ScopeDiff previous={{ count: 2 }} current={{ count: 2 }} hideUnchanged unstyled />
      <ResultPanel data={null} unstyled />
    </>);
    expect(within(screen.getByRole("region", { name: "Memory state" })).getByText("number")).toBeTruthy();
    expect(screen.getByText("No changes")).toBeTruthy();
    expect(screen.getByText("No data")).toBeTruthy();
    expect(screen.getByText("No console output")).toBeTruthy();
    expect(view.container.querySelectorAll("[style]")).toHaveLength(0);
  });
});
