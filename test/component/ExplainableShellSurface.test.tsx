/** @vitest-environment jsdom */
/**
 * 0.35.0 — the shell's surface, and the props that reach it.
 *
 * Three defects, one theme: a knob that reads as wired and is not.
 *
 *   1. UNSTYLED lost the whole explainable surface. Its tab bar listed
 *      Result / Memory / Narrative, but the only content branches were
 *      `result` and `explainable` — and `explainable` was in NO tab list, so
 *      the surface was unreachable and Memory and Narrative were dead
 *      buttons that rendered blank. Unstyled means the same content with no
 *      styling; that is its whole contract.
 *   2. `panelLabels` was computed and then ignored on desktop — the pills
 *      there were hard-coded "Topology" / "Details", and the timeline footer
 *      hard-coded "Timeline". The README hero passes this prop.
 *   3. The Result view was unreachable on desktop: the tabbed details panel
 *      renders only under 640px, and the right panel filtered `result` out.
 *      `resultData`, `logs` and `hideConsole` therefore did nothing at all on
 *      a desktop-width shell.
 *
 * Plus the dead `tabs` prop, which now says so out loud.
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, fireEvent, within } from "@testing-library/react";

import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";

const SNAPSHOTS: StageSnapshot[] = [
  {
    stageName: "seed",
    stageLabel: "Seed",
    runtimeStageId: "seed#0",
    memory: { request: "hello" },
    narrative: "Seeded.",
    startMs: 0,
    durationMs: 1,
  },
  {
    stageName: "sum",
    stageLabel: "Sum",
    runtimeStageId: "sum#1",
    memory: { request: "hello", total: 42 },
    narrative: "Totalled.",
    startMs: 1,
    durationMs: 1,
  },
];

const NARRATIVE: NarrativeEntry[] = [
  { type: "stage", text: "Seeded the run.", depth: 0, stageId: "seed", runtimeStageId: "seed#0", stageName: "Seed" },
  { type: "stage", text: "Totalled the items.", depth: 0, stageId: "sum", runtimeStageId: "sum#1", stageName: "Sum" },
];

/** A graph with a subflow mount, so the Topology sidebar is on screen. */
const GRAPH: TraceGraph = {
  nodes: [
    { id: "seed", type: "stage", position: { x: 0, y: 0 }, data: { label: "Seed", isDecider: false, isFork: false, isSubflow: false } },
    { id: "sum", type: "stage", position: { x: 0, y: 80 }, data: { label: "Sum", isDecider: false, isFork: false, isSubflow: true, subflowId: "sum" } },
  ] as unknown as TraceGraph["nodes"],
  edges: [{ id: "seed->sum", source: "seed", target: "sum", data: { kind: "next" } }] as unknown as TraceGraph["edges"],
};

const RESULT = { total: 42 };
const LOGS = ["first log line", "second log line"];

afterEach(() => vi.restoreAllMocks());

// ── 1. Unstyled keeps the whole surface ────────────────────────────────────

describe("ExplainableShell — unstyled renders every tab it lists", () => {
  function renderUnstyled(extra: Record<string, unknown> = {}) {
    return render(
      <ExplainableShell
        snapshots={SNAPSHOTS}
        narrativeEntries={NARRATIVE}
        traceGraph={GRAPH}
        resultData={RESULT}
        logs={LOGS}
        unstyled
        {...extra}
      />,
    );
  }

  const tabButtons = (c: HTMLElement) =>
    Array.from(c.querySelectorAll<HTMLButtonElement>('[data-fp="shell-tab"]'));
  const content = (c: HTMLElement) => c.querySelector('[data-fp="shell-content"]')!;

  it("lists the explainable surface alongside the detail tabs", () => {
    const { container } = renderUnstyled();
    const names = tabButtons(container).map((b) => b.textContent);
    expect(names).toContain("Result");
    expect(names).toContain("Memory");
    expect(names).toContain("Narrative");
    expect(names).toContain("Explainable");
  });

  it("the Memory tab renders memory instead of nothing", () => {
    const { container } = renderUnstyled();
    const memoryTab = tabButtons(container).find((b) => b.textContent === "Memory")!;
    fireEvent.click(memoryTab);
    const body = content(container);
    expect(body.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
    // The cursor sits on step 0, so step 0's state is what memory shows.
    expect(body.textContent).toContain("request");
  });

  it("the Narrative tab renders the story instead of nothing", () => {
    const { container } = renderUnstyled();
    fireEvent.click(tabButtons(container).find((b) => b.textContent === "Narrative")!);
    const body = content(container);
    expect(body.querySelector('[data-fp="narrative-panel"], [data-fp="story-narrative"]')).toBeTruthy();
    expect(body.textContent).toContain("Seeded the run.");
  });

  it("the Explainable tab still shows the whole surface at once", () => {
    const { container } = renderUnstyled();
    fireEvent.click(tabButtons(container).find((b) => b.textContent === "Explainable")!);
    const body = content(container);
    expect(body.querySelector('[data-fp="time-travel-controls"]')).toBeTruthy();
    expect(body.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
    expect(body.querySelector('[data-fp="gantt-timeline"], [data-fp="gantt"]')).toBeTruthy();
  });

  it("the Result tab still works — nothing was traded away for the rest", () => {
    const { container } = renderUnstyled();
    expect(content(container).textContent).toContain("first log line");
  });

  it("an auto-detected recorder view renders too, not a blank panel", () => {
    const { container } = renderUnstyled({
      recorderViews: [
        { id: "cost", name: "Cost", render: () => <div data-fp="cost-view">$0.42</div> },
      ],
    });
    fireEvent.click(tabButtons(container).find((b) => b.textContent === "Cost")!);
    expect(content(container).querySelector('[data-fp="cost-view"]')).toBeTruthy();
  });

  it("every listed tab renders SOMETHING — no dead buttons left", () => {
    const { container } = renderUnstyled();
    for (const tab of tabButtons(container)) {
      fireEvent.click(tab);
      expect(
        (content(container).textContent ?? "").trim().length,
        `tab "${tab.textContent}" rendered nothing`,
      ).toBeGreaterThan(0);
    }
  });
});

// ── 2. panelLabels on desktop ──────────────────────────────────────────────

describe("ExplainableShell — panelLabels reaches the desktop pills", () => {
  const LABELS = { topology: "What Ran", details: "What Happened", timeline: "How Long" };

  function renderDesktop(extra: Record<string, unknown> = {}) {
    // jsdom's ResizeObserver stub never fires, so `isNarrow` stays false —
    // this IS the desktop branch.
    return render(
      <ExplainableShell
        snapshots={SNAPSHOTS}
        narrativeEntries={NARRATIVE}
        traceGraph={GRAPH}
        resultData={RESULT}
        logs={LOGS}
        {...extra}
      />,
    );
  }

  it("renames all three panels (the README hero's own example)", () => {
    const { container } = renderDesktop({ panelLabels: LABELS });
    expect(container.textContent).toContain("What Ran");
    expect(container.textContent).toContain("What Happened");
    expect(container.textContent).toContain("How Long");
  });

  it("drops the hard-coded defaults once renamed", () => {
    const { container } = renderDesktop({ panelLabels: LABELS });
    expect(container.textContent).not.toContain("Topology");
    expect(container.textContent).not.toContain("Details");
    expect(container.textContent).not.toContain("Timeline");
  });

  it("keeps the defaults when the prop is absent", () => {
    const { container } = renderDesktop();
    expect(container.textContent).toContain("Topology");
    expect(container.textContent).toContain("Details");
    expect(container.textContent).toContain("Timeline");
  });

  it("renames the collapsed Topology pill too", () => {
    const { container } = renderDesktop({
      panelLabels: LABELS,
      defaultExpanded: { topology: true, details: true },
    });
    expect(container.textContent).toContain("What Ran");
  });
});

// ── 3. Result reachable on desktop ─────────────────────────────────────────

describe("ExplainableShell — the Result view has a home on desktop", () => {
  function renderDesktop(extra: Record<string, unknown> = {}) {
    return render(
      <ExplainableShell
        snapshots={SNAPSHOTS}
        narrativeEntries={NARRATIVE}
        traceGraph={GRAPH}
        resultData={RESULT}
        logs={LOGS}
        {...extra}
      />,
    );
  }

  const modeButton = (c: HTMLElement, name: string) =>
    Array.from(c.querySelectorAll<HTMLButtonElement>("button")).find(
      (b) => b.textContent?.trim() === name,
    );

  it("offers a Result mode on the right panel", () => {
    const { container } = renderDesktop();
    expect(modeButton(container, "Result")).toBeTruthy();
  });

  it("shows resultData when you open it", () => {
    const { container } = renderDesktop();
    fireEvent.click(modeButton(container, "Result")!);
    expect(container.textContent).toContain("total");
    expect(container.textContent).toContain("42");
  });

  it("shows the console logs — `logs` finally does something", () => {
    const { container } = renderDesktop();
    fireEvent.click(modeButton(container, "Result")!);
    expect(container.textContent).toContain("first log line");
    expect(container.textContent).toContain("second log line");
  });

  it("hideConsole hides them — and it, too, finally does something", () => {
    const { container } = renderDesktop({ hideConsole: true });
    fireEvent.click(modeButton(container, "Result")!);
    expect(container.textContent).toContain("42"); // the result is still there
    expect(container.textContent).not.toContain("first log line");
  });

  it("hideTabs={['result']} removes the mode entirely", () => {
    const { container } = renderDesktop({ hideTabs: ["result"] });
    expect(modeButton(container, "Result")).toBeUndefined();
    expect(modeButton(container, "Insights")).toBeTruthy();
  });

  it("Insights still opens on the Story, not on Result", () => {
    // Result deliberately lives on the mode toggle rather than in the
    // Insights list: an Insight is recorder-derived, and seeding the list
    // with Result would have pushed the story off the opening screen.
    const { container } = renderDesktop();
    const insights = container.querySelector('[data-fp="insight-panel"], [data-fp="story-narrative"]');
    expect(insights).toBeTruthy();
    expect(container.textContent).toContain("Seeded the run.");
  });

  it("the Insights empty state survives — a run with no recorders still guides", () => {
    const { container } = render(
      <ExplainableShell snapshots={SNAPSHOTS} traceGraph={GRAPH} resultData={RESULT} />,
    );
    expect(container.querySelector('[data-fp="insights-empty"]')).toBeTruthy();
  });
});

// ── 4. The dead `tabs` prop says so ────────────────────────────────────────

describe("ExplainableShell — the `tabs` prop is loudly deprecated", () => {
  it("warns in dev when a consumer passes it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <ExplainableShell
        snapshots={SNAPSHOTS}
        traceGraph={GRAPH}
        tabs={["result", "explainable"]}
      />,
    );
    const said = warn.mock.calls.map((c) => String(c[0])).join("\n");
    expect(said).toContain("`tabs` prop is deprecated");
    expect(said).toContain("hideTabs");
    expect(said).toContain("defaultTab");
  });

  it("stays quiet when it is not passed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ExplainableShell snapshots={SNAPSHOTS} traceGraph={GRAPH} />);
    const said = warn.mock.calls.map((c) => String(c[0])).join("\n");
    expect(said).not.toContain("`tabs` prop is deprecated");
  });

  it("does not change what is on screen — it never did", () => {
    const { container } = render(
      <ExplainableShell
        snapshots={SNAPSHOTS}
        narrativeEntries={NARRATIVE}
        traceGraph={GRAPH}
        resultData={RESULT}
        tabs={["nonsense"]}
      />,
    );
    expect(within(container).queryByText(/Insights/)).toBeTruthy();
    expect(container.textContent).toContain("Seeded the run.");
  });
});

// ── 5. Hook order survives an unstyled flip ────────────────────────────────

describe("ExplainableShell — hook order survives an `unstyled` flip", () => {
  // The unstyled branch returns early. Every hook must therefore run BEFORE
  // that return: a hook below it runs only on styled renders, so flipping
  // `unstyled` between renders changes the hook count and React throws
  // ("Rendered more hooks than during the previous render"). This is the
  // same defect class the renderTabBody unification fixed for the old
  // detailsContent useMemo — this test pins the whole component, so a future
  // hook added below the early return fails here instead of in production.
  it("unstyled → styled does not change the hook count", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(
      <ExplainableShell snapshots={SNAPSHOTS} traceGraph={GRAPH} unstyled />,
    );
    expect(() =>
      rerender(<ExplainableShell snapshots={SNAPSHOTS} traceGraph={GRAPH} />),
    ).not.toThrow();
    const said = err.mock.calls.map((c) => String(c[0])).join("\n");
    expect(said).not.toContain("Rendered more hooks");
    err.mockRestore();
  });

  it("styled → unstyled does not change the hook count either", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(
      <ExplainableShell snapshots={SNAPSHOTS} traceGraph={GRAPH} />,
    );
    expect(() =>
      rerender(<ExplainableShell snapshots={SNAPSHOTS} traceGraph={GRAPH} unstyled />),
    ).not.toThrow();
    const said = err.mock.calls.map((c) => String(c[0])).join("\n");
    expect(said).not.toContain("Rendered fewer hooks");
    err.mockRestore();
  });
});
