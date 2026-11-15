/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StageActivityPanel } from "../../src/components/StageActivityPanel";
import { InspectorPanel } from "../../src/components/InspectorPanel/InspectorPanel";
import type { StageActivityTraceTarget, StageActivityVariable, StageActivityView } from "../../src/trace/stageActivity";
import type { StageSnapshot } from "../../src/types";
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { FootprintTheme } from "../../src/theme";

const HostButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => <button {...props} ref={ref} data-host="button" />);
const HostCode = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>((props, ref) => <code {...props} ref={ref} data-host="code" />);
const HostBadge = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>((props, ref) => <span {...props} ref={ref} data-host="badge" />);

const readTarget: StageActivityTraceTarget = { key: "count", kind: "read", runtimeStageId: "increment#1", beforeCommitIdx: 1, invocationPath: [] };
const writeTarget: StageActivityTraceTarget = { ...readTarget, kind: "write", beforeCommitIdx: 2 };
const read: StageActivityVariable = {
  id: "read-count", key: "count", label: "count", kind: "read", source: "stage-read",
  value: { state: "recorded", preview: "2" }, valueLabel: "After prior writer; read-time value not captured",
  change: "unknown", writer: { runtimeStageId: "seed#0", stageName: "Seed", commitIdx: 0 }, traceTarget: readTarget,
};
const write: StageActivityVariable = {
  id: "write-count", key: "count", label: "count", kind: "write", source: "commit-write",
  value: { state: "recorded", preview: "3" }, valueLabel: "After stage",
  before: { state: "recorded", preview: "2" }, after: { state: "recorded", preview: "3" },
  change: "updated", writer: { runtimeStageId: "increment#1", stageName: "Increment", commitIdx: 1 }, traceTarget: writeTarget,
};
const activity: StageActivityView = {
  identity: { stageName: "Increment", stageLabel: "Increment count", runtimeStageId: "increment#1", invocationPath: [], commitIdx: 1 },
  availability: { ok: true },
  events: [
    { id: "read-step", kind: "step", source: "narrative", text: "Step 1: Read count = 2", key: "count", reportedOperation: "read", variableId: read.id },
    { id: "write-step", kind: "step", source: "narrative", text: "Step 2: Write count = 3", key: "count", reportedOperation: "write", variableId: write.id },
  ],
  reads: [read], writes: [write], decisions: [], logs: [],
  coverage: { narrative: "recorded", reads: "recorded", writes: "recorded", logs: "unavailable", truncated: false },
  notes: ["Recorded reads do not prove exact output derivation."],
};
const snapshot: StageSnapshot = { stageName: "Increment", stageLabel: "Increment count", runtimeStageId: "increment#1", memory: { count: 3 }, narrative: "", startMs: 0, durationMs: 1 };

describe("StageActivityPanel", () => {
  it("uses consumer micro tokens and host primitives without changing exact read tracing", () => {
    const trace = vi.fn();
    const view = render(<FootprintTheme tokens={{ typography: { body: "18px", lineHeight: "1.9" },
      controls: { height: "44px" }, radii: { control: "18px" }, borders: { width: "3px" }, elevation: { panel: "none" } }}>
      <StageActivityPanel activity={activity} onTraceVariable={trace} />
    </FootprintTheme>);
    const panel = screen.getByRole("region", { name: "Stage activity" });
    const key = screen.getByRole("button", { name: "Inspect read count" });
    expect(panel.style.fontSize).toContain("--fp-font-size-body");
    expect(panel.style.lineHeight).toContain("--fp-line-height");
    expect(key.style.minHeight).toContain("--fp-control-height");
    expect(key.style.borderRadius).toContain("--fp-radius-control");
    expect(key.style.border).toContain("--fp-border-width");
    expect(screen.getByRole("complementary", { name: "Variable inspector" }).style.boxShadow).toContain("--fp-shadow-panel");
    view.rerender(<FootprintTheme components={{ Button: HostButton, Code: HostCode, Badge: HostBadge }}>
      <StageActivityPanel activity={activity} onTraceVariable={trace} />
    </FootprintTheme>);
    const hostKey = screen.getByRole("button", { name: "Inspect read count" });
    expect(hostKey.getAttribute("data-fp-part")).toBe("activity-variable");
    expect(hostKey.style.fontSize).toBe("");
    expect(hostKey.style.border).toBe("");
    fireEvent.click(hostKey);
    fireEvent.click(screen.getByRole("button", { name: "Backtrack read count" }));
    expect(trace).toHaveBeenCalledExactlyOnceWith(readTarget);
    expect(view.container.querySelector('[data-fp-part="activity-visit"][data-host="code"]')).toBeTruthy();
    expect(view.container.querySelector('[data-fp-part="activity-event-kind"][data-host="badge"]')).toBeTruthy();
  });

  it("keeps reads and writes of one key distinct and forwards their exact cutoffs", () => {
    const trace = vi.fn(), navigate = vi.fn();
    const view = render(<StageActivityPanel activity={activity} onTraceVariable={trace} onNavigateToStage={navigate} />);
    const inspector = within(screen.getByRole("complementary", { name: "Variable inspector" }));
    expect(view.container.querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("increment#1");
    expect(inspector.getByText("Written key")).toBeTruthy();
    expect(view.container.querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("3");
    expect(inspector.getByText("Before stage")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Inspect read count" }));
    expect(inspector.getByText("Read key")).toBeTruthy();
    expect(inspector.getByText("After prior writer; read-time value not captured")).toBeTruthy();
    expect(view.container.querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("2");
    fireEvent.click(inspector.getByRole("button", { name: "Backtrack read count" }));
    expect(trace).toHaveBeenLastCalledWith(readTarget);
    fireEvent.click(inspector.getByRole("button", { name: "Open writer" }));
    expect(navigate).toHaveBeenLastCalledWith("seed#0");
    fireEvent.click(screen.getByRole("button", { name: "Inspect write count" }));
    fireEvent.click(inspector.getByRole("button", { name: "Backtrack write count" }));
    expect(trace).toHaveBeenLastCalledWith(writeTarget);
    expect(screen.getByRole("heading", { name: "Increment count" })).toBeTruthy(); // the inspected stage remains visible
  });

  it("resets variable selection for a different exact invocation or visit", () => {
    const view = render(<StageActivityPanel activity={activity} />);
    fireEvent.click(screen.getByRole("button", { name: "Inspect read count" }));
    const second: StageActivityView = { ...activity,
      identity: { ...activity.identity, runtimeStageId: "child/increment#3", invocationPath: ["child#2"], commitIdx: 3 },
      reads: [{ ...read, value: { state: "recorded", preview: "100" } }],
      writes: [{ ...write, value: { state: "recorded", preview: "101" }, after: { state: "recorded", preview: "101" } }],
    };
    view.rerender(<StageActivityPanel activity={second} />);
    expect(view.container.querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("101");
    expect(screen.getByText("child/increment#3")).toBeTruthy();
    expect(within(screen.getByRole("complementary", { name: "Variable inspector" })).getByText("Written key")).toBeTruthy();
  });

  it("keeps a restored read selected until its controlling host accepts a different variable", () => {
    const onVariableSelect = vi.fn();
    const view = render(<StageActivityPanel activity={activity} selectedVariableId={read.id} onVariableSelect={onVariableSelect} />);
    const inspector = within(screen.getByRole("complementary", { name: "Variable inspector" }));
    expect(inspector.getByText("Read key")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Inspect write count" }));
    expect(onVariableSelect).toHaveBeenLastCalledWith(write.id);
    expect(inspector.getByText("Read key")).toBeTruthy();
    view.rerender(<StageActivityPanel activity={activity} selectedVariableId={write.id} onVariableSelect={onVariableSelect} />);
    expect(inspector.getByText("Written key")).toBeTruthy();
    view.rerender(<StageActivityPanel activity={activity} onVariableSelect={onVariableSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Inspect read count" }));
    expect(inspector.getByText("Read key")).toBeTruthy();
    expect(onVariableSelect).toHaveBeenLastCalledWith(read.id);
  });

  it("ignores controlled ids that do not belong to the current visit", () => {
    const view = render(<StageActivityPanel activity={activity} selectedVariableId={read.id} />);
    const second: StageActivityView = { ...activity,
      identity: { ...activity.identity, runtimeStageId: "other#2", commitIdx: 2 },
      reads: [], writes: [{ ...write, id: "other-write", value: { state: "recorded", preview: "101" }, after: { state: "recorded", preview: "101" } }],
      events: [],
    };
    view.rerender(<StageActivityPanel activity={second} selectedVariableId={read.id} />);
    expect(within(screen.getByRole("complementary", { name: "Variable inspector" })).getByText("Written key")).toBeTruthy();
    expect(view.container.querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("101");
    expect(screen.queryByRole("button", { name: "Inspect read count" })).toBeNull();
  });

  it("preserves generic narrative text, saved decisions and stage events without inventing their semantics", () => {
    const decision = { id: "decision", kind: "decision" as const, source: "execution-tree" as const, text: "returned branchId: manual" };
    const log = { id: "emit", kind: "event" as const, source: "narrative" as const, text: "Recorded emission: queued" };
    render(<StageActivityPanel activity={{ ...activity, events: [{ id: "custom", kind: "step", source: "narrative", text: "A custom recorder described this step." }], decisions: [decision], logs: [log] }} />);
    expect(screen.getByText("NARRATIVE STEP")).toBeTruthy();
    expect(screen.getByText("A custom recorder described this step.")).toBeTruthy();
    expect(screen.getByText("returned branchId: manual")).toBeTruthy();
    expect(screen.getByText("Recorded emission: queued")).toBeTruthy();
    expect(screen.queryByText(/predicate was false/i)).toBeNull();
  });

  it("withholds unavailable values and exact-target actions instead of substituting current memory", () => {
    const unknownRead = { ...read, value: { state: "unavailable" as const, preview: null }, writer: null, traceTarget: null };
    render(<StageActivityPanel activity={{ ...activity, reads: [unknownRead], writes: [], events: [] }} onTraceVariable={vi.fn()} />);
    const inspector = within(screen.getByRole("complementary", { name: "Variable inspector" }));
    expect(inspector.getByText("Value preview unavailable")).toBeTruthy();
    expect(inspector.getByText("This read's origin is not established.")).toBeTruthy();
    expect(inspector.getByRole("button", { name: "Backtrack read count" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("No ordered narrative steps recorded for this visit.")).toBeTruthy();
  });

  it("keeps absent before state separate from an unavailable before state", () => {
    const view = render(<StageActivityPanel activity={{ ...activity, writes: [{ ...write, before: { state: "unavailable", preview: null } }] }} />);
    const change = view.container.querySelector('[data-fp="stage-activity-change"]')!;
    expect(change.textContent).toContain("Before stageValue preview unavailable");
    view.rerender(<StageActivityPanel activity={{ ...activity, writes: [{ ...write, before: { state: "absent", preview: null } }] }} />);
    expect(change.textContent).toContain("Before stageAbsent in this recorded state");
  });

  it("renders the same recorded content in unstyled mode with no built-in styles", () => {
    const view = render(<StageActivityPanel activity={activity} unstyled onTraceVariable={vi.fn()} />);
    expect(view.container.querySelectorAll("[style]")).toHaveLength(0);
    expect(screen.getByText("Step 1: Read count = 2")).toBeTruthy();
    expect(screen.getByText("Recorded reads do not prove exact output derivation.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Backtrack write count" })).toBeTruthy();
  });

  it("reports unavailable visits and truncation explicitly", () => {
    const view = render(<StageActivityPanel activity={{ ...activity, availability: { ok: false, reason: "Duplicate runtime visit." } }} />);
    expect(screen.getByRole("status").textContent).toContain("Duplicate runtime visit");
    expect(screen.queryByRole("button", { name: /Backtrack/ })).toBeNull();
    view.rerender(<StageActivityPanel activity={{ ...activity, coverage: { ...activity.coverage, truncated: true } }} />);
    expect(screen.getByRole("status").textContent).toContain("Some recorded activity may be omitted");
  });
});

describe("Inspector Activity lens compatibility", () => {
  const props = { snapshots: [snapshot], selectedIndex: 0, dataTraceFrames: [] };
  it("themes tabs and count badges while allowing native-compatible host replacements", () => {
    const frames = [{ runtimeStageId: "seed#0", stageId: "seed", stageName: "Seed", keysWritten: ["count"], linkedBy: "count", depth: 0 }];
    const change = vi.fn();
    const view = render(<InspectorPanel {...props} tab="trace" dataTraceFrames={frames} onTabChange={change} />);
    const tab = screen.getByRole("button", { name: /Data Trace/ });
    expect(tab.style.fontSize).toContain("--fp-font-size-body");
    expect(tab.style.minHeight).toContain("--fp-control-height");
    const badge = tab.querySelector<HTMLElement>('[data-fp-part="inspector-tab-count"]')!;
    expect(badge.style.color).toContain("--fp-on-primary");
    expect(badge.style.borderRadius).toContain("--fp-radius-badge");
    view.rerender(<FootprintTheme components={{ Tab: HostButton, Badge: HostBadge }}>
      <InspectorPanel {...props} dataTraceFrames={frames} onTabChange={change} />
    </FootprintTheme>);
    const hostTab = screen.getByRole("button", { name: /Data Trace/ });
    expect(hostTab.getAttribute("data-fp-part")).toBe("inspector-tab-data-trace");
    expect(hostTab.style.fontSize).toBe("");
    expect(hostTab.querySelector('[data-host="badge"]')?.getAttribute("style")).toBeNull();
    fireEvent.click(hostTab);
    expect(change).toHaveBeenLastCalledWith("trace");
    expect(hostTab.getAttribute("aria-pressed")).toBe("true");
  });
  it("keeps legacy instances on State and leaves legacy callbacks unchanged", () => {
    const onTabChange = vi.fn();
    render(<InspectorPanel {...props} onTabChange={onTabChange} traceContent={<div>Existing trace</div>} />);
    expect(screen.queryByRole("button", { name: "Activity" })).toBeNull();
    expect(screen.getByRole("button", { name: "State" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Data Trace" }));
    expect(onTabChange).toHaveBeenLastCalledWith("trace");
    expect(screen.getByText("Existing trace")).toBeTruthy();
  });

  it("defaults supplied Activity to the new lens and can return to State or trace", () => {
    const onTabChange = vi.fn(), onActivitySelect = vi.fn();
    render(<InspectorPanel {...props} activity={activity} onTabChange={onTabChange} onActivitySelect={onActivitySelect} traceContent={<div>Existing trace</div>} />);
    expect(screen.getByRole("button", { name: "Activity" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("region", { name: "Stage activity" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "State" }));
    expect(onTabChange).toHaveBeenLastCalledWith("state");
    expect(screen.queryByRole("region", { name: "Stage activity" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Activity" }));
    expect(onActivitySelect).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Data Trace" }));
    expect(screen.getByText("Existing trace")).toBeTruthy();
    expect(onTabChange).toHaveBeenLastCalledWith("trace");
    expect(onTabChange.mock.calls.flat()).not.toContain("activity");
  });

  it("honors controlled Activity selection while keeping the State/Trace controlled union", () => {
    const select = vi.fn(), change = vi.fn();
    const view = render(<InspectorPanel {...props} activity={activity} activitySelected={false} onActivitySelect={select} onTabChange={change} tab="trace" traceContent={<div>Existing trace</div>} />);
    expect(screen.getByText("Existing trace")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Activity" }));
    expect(select).toHaveBeenCalledOnce();
    expect(screen.getByText("Existing trace")).toBeTruthy(); // host still owns the Activity boolean
    view.rerender(<InspectorPanel {...props} activity={activity} activitySelected onActivitySelect={select} onTabChange={change} tab="trace" />);
    expect(screen.getByRole("region", { name: "Stage activity" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "State" }));
    expect(change).toHaveBeenLastCalledWith("state");
  });

  it("forwards the selected Activity variable when reopening the lens", () => {
    const select = vi.fn();
    const view = render(<InspectorPanel {...props} activity={activity} activitySelected={false} tab="trace" traceContent={<div>Existing trace</div>}
      selectedActivityVariableId={read.id} onActivityVariableSelect={select} />);
    view.rerender(<InspectorPanel {...props} activity={activity} activitySelected selectedActivityVariableId={read.id} onActivityVariableSelect={select} />);
    expect(within(screen.getByRole("complementary", { name: "Variable inspector" })).getByText("Read key")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Inspect write count" }));
    expect(select).toHaveBeenLastCalledWith(write.id);
    expect(within(screen.getByRole("complementary", { name: "Variable inspector" })).getByText("Read key")).toBeTruthy();
  });

  it("keeps all Inspector controls safe when embedded in a consumer form", () => {
    const submit = vi.fn(event => event.preventDefault());
    render(<form onSubmit={submit}><InspectorPanel {...props} activity={activity} onTraceActivityVariable={vi.fn()} /></form>);
    for (const button of screen.getAllByRole("button")) expect(button.getAttribute("type")).toBe("button");
    fireEvent.click(screen.getByRole("button", { name: "Inspect read count" }));
    fireEvent.click(screen.getByRole("button", { name: "Backtrack read count" }));
    fireEvent.click(screen.getByRole("button", { name: "State" }));
    expect(submit).not.toHaveBeenCalled();
  });
});
