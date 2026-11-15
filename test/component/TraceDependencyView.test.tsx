import { forwardRef, useEffect, useState, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
/** @vitest-environment jsdom */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TraceDependencyView } from "../../src/components/DataTracePanel/TraceDependencyView";
import { buildTraceWalk, type TraceWalk } from "../../src/trace/traceWalk";
import type { StageSnapshot } from "../../src/types";
import { FootprintTheme } from "../../src/theme";

const log = [
  ["LoadRates", "load#1", "rates"], ["PickBase", "pick#2", "baseRate"],
  ["Audit", "audit#3", "auditNote"], ["AssessRisk", "risk#4", "riskFactor"],
  ["Quote", "quote#5", "quote"],
].map(([stage, runtimeStageId, key]) => ({ stage, stageId: stage, runtimeStageId, trace: [{ path: key }] }));
const reads = [{}, { rates: 1 }, {}, {}, { baseRate: 1, riskFactor: 1 }];
const tree: Record<string, unknown> = {};
let parent = tree;
log.forEach((entry, index) => {
  Object.assign(parent, { runtimeStageId: entry.runtimeStageId, stageReads: reads[index] });
  if (index < log.length - 1) { parent.next = {}; parent = parent.next as Record<string, unknown>; }
});
const snapshots: StageSnapshot[] = log.map((entry, index) => ({
  runtimeStageId: entry.runtimeStageId, stageName: entry.stage, stageLabel: entry.stage,
  memory: { rates: [3.1, 3.4, 9.9], baseRate: index === 1 ? 9.9 : 100, riskFactor: 1.2, quote: 11.88 },
  narrative: "", startMs: index, durationMs: 1,
}));
const walk = buildTraceWalk(log, tree, "quote");

describe("variable dependency investigation view", () => {
  it("keeps numeric graph geometry for host buttons while leaving their paint to the host", () => {
    const HostButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => <button {...props} ref={ref} data-host="button" />);
    const HostCode = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>((props, ref) => <code {...props} ref={ref} data-host="code" />);
    const HostBadge = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>((props, ref) => <span {...props} ref={ref} data-host="badge" />);
    const follow = vi.fn();
    const { container } = render(<FootprintTheme components={{ Button: HostButton, Code: HostCode, Badge: HostBadge }}>
      <TraceDependencyView hasWorkflow={false} walk={walk} cursorRuntimeStageId="quote#5" snapshots={snapshots} onFollowIngredient={follow}><div /></TraceDependencyView>
    </FootprintTheme>);
    const node = container.querySelector('[data-variable="baseRate"]') as HTMLButtonElement;
    expect(node.getAttribute("data-host")).toBe("button");
    expect(node.getAttribute("data-fp-part")).toBe("trace-variable-node");
    expect(node.style.position).toBe("absolute");
    expect(node.style.width).toBe("218px");
    expect(node.style.height).toBe("104px");
    expect(Number.parseFloat(node.style.left)).toBeGreaterThanOrEqual(0);
    expect(node.style.background).toBe("");
    expect(node.style.borderRadius).toBe("");
    expect(node.style.fontSize).toBe("");
    expect(node.querySelector('[data-host="code"]')?.getAttribute("data-fp-part")).toBe("trace-node-variable");
    expect(node.querySelector('[data-host="badge"]')?.getAttribute("data-fp-part")).toBe("trace-variable-kind");
    fireEvent.click(node);
    expect(follow).toHaveBeenCalledWith(expect.objectContaining({ key: "baseRate", writerRuntimeStageId: "pick#2" }));
  });

  it("uses theme recipes for diagram paint without changing measured graph dimensions", () => {
    const { container } = render(<FootprintTheme tokens={{ typography: { title: "19px", lineHeight: "1.7", weightStrong: "800" },
      spacing: { md: "18px" }, radii: { panel: "12px" }, borders: { focusWidth: "3px" }, elevation: { focus: "0 0 0 3px cyan" } }}>
      <TraceDependencyView hasWorkflow={false} walk={walk} cursorRuntimeStageId="quote#5" snapshots={snapshots}><div /></TraceDependencyView>
    </FootprintTheme>);
    const node = container.querySelector('[data-variable="quote"]') as HTMLElement;
    expect(node.style.width).toBe("218px");
    expect(node.style.lineHeight).toContain("--fp-line-height");
    expect(node.style.borderRadius).toContain("--fp-radius-panel");
    expect(node.style.boxShadow).toContain("--fp-shadow-focus");
    expect((node.querySelector('[data-fp-part="trace-node-variable"]') as HTMLElement).style.fontSize).toContain("--fp-font-size-title");
  });

  it("keeps variable actions and evidence available without built-in geometry or paint in unstyled mode", () => {
    const follow = vi.fn();
    const { container } = render(<TraceDependencyView hasWorkflow={false} walk={walk} cursorRuntimeStageId="quote#5" snapshots={snapshots}
      onFollowIngredient={follow} unstyled><div>Execution chart</div></TraceDependencyView>);
    expect(container.querySelector("[style]")).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
    const node = screen.getByRole("button", { name: "Follow baseRate at PickBase" });
    fireEvent.click(node);
    expect(follow).toHaveBeenCalledWith(expect.objectContaining({ key: "baseRate", writerCommitIdx: 1 }));
    expect(screen.getByRole("button", { name: "Variables" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("shows both sibling inputs and writer-time values, without unrelated execution stages", () => {
    const follow = vi.fn();
    const { container } = render(<TraceDependencyView walk={walk} cursorRuntimeStageId="quote#5" snapshots={snapshots} onFollowIngredient={follow}><div>Execution chart</div></TraceDependencyView>);
    expect(screen.getByRole("button", { name: /^Execution$/ }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /^Variables$/ }));
    const graph = container.querySelector('[data-fp="trace-dependency-view"]')!;
    expect(graph.textContent).toContain("Why quote = 11.88?");
    const base = container.querySelector('[data-variable="baseRate"]') as HTMLButtonElement;
    expect(base.textContent).toContain("9.9"); // not the later cursor's100
    expect(base.textContent).toContain("PickBase");
    expect(container.querySelector('[data-variable="riskFactor"]')).toBeTruthy();
    expect(container.querySelector('[data-variable="auditNote"]')).toBeNull();
    expect(graph.textContent).toContain("recorded stage reads");
    expect(graph.textContent).toContain("not execution order or proof of exact derivation");
    fireEvent.click(base);
    expect(follow).toHaveBeenCalledWith({ key: "baseRate", writerRuntimeStageId: "pick#2", writerStageName: "PickBase", writerCommitIdx: 1 });
    expect(screen.getByText("Execution chart").closest('[data-fp="trace-execution-layer"]')?.getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps the execution renderer available and preserves the chosen view for a new question", () => {
    const props = { cursorRuntimeStageId: "quote#5", snapshots, onFollowIngredient: vi.fn() };
    const view = render(<TraceDependencyView {...props} walk={walk}><div>Execution chart</div></TraceDependencyView>);
    fireEvent.click(screen.getByRole("button", { name: /^Execution$/ }));
    expect(screen.getByText("Execution chart")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Execution$/ }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /^Variables$/ }));
    view.rerender(<TraceDependencyView {...props} walk={buildTraceWalk(log, tree, "baseRate")}><div>Execution chart</div></TraceDependencyView>);
    expect(screen.getByRole("button", { name: /^Variables$/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Execution chart").closest('[data-fp="trace-execution-layer"]')?.getAttribute("aria-hidden")).toBe("true");
  });

  it("gives keyboard/screen-reader users the same recorded input relationships", () => {
    render(<TraceDependencyView walk={walk} cursorRuntimeStageId="quote#5" snapshots={snapshots} onJumpToStop={vi.fn()}><div /></TraceDependencyView>);
    fireEvent.click(screen.getByRole("button", { name: /^Variables$/ }));
    const output = screen.getByRole("button", { name: "Show quote at Quote" });
    const description = document.getElementById(output.getAttribute("aria-describedby")!);
    expect(description?.textContent).toContain("Recorded stage reads: baseRate, riskFactor");
    const controls = screen.getByRole("group", { name: "Investigation view" });
    expect(within(controls).getAllByRole("button")).toHaveLength(2);
  });

  it("does not replace a consumer's chart when there is no admitted trace question", () => {
    render(<TraceDependencyView walk={null} cursorRuntimeStageId={null} snapshots={snapshots}><div>Execution chart</div></TraceDependencyView>);
    expect(screen.getByText("Execution chart")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Variable investigation" })).toBeNull();
  });

  it("shows nested commit-path values from the writer snapshot without invoking accessors", () => {
    const key = "applicant\u001faddress\u001fzip";
    const ownLog = [{ stage: "Address", stageId: "address", runtimeStageId: "address#1", trace: [{ path: key }] }];
    const ownWalk = buildTraceWalk(ownLog, { runtimeStageId: "address#1", stageReads: {} }, key);
    const ownSnapshots = [{ ...snapshots[0], runtimeStageId: "address#1", memory: { applicant: { address: { zip: 75078 } } } }];
    const { container } = render(<TraceDependencyView hasWorkflow={false} walk={ownWalk} cursorRuntimeStageId="address#1" snapshots={ownSnapshots}><div /></TraceDependencyView>);
    const node = container.querySelector('[data-fp="trace-variable-node"]')!;
    expect(node.textContent).toContain("applicant › address › zip");
    expect(node.textContent).toContain("75078");
    const execution = screen.getByRole("button", { name: /^Execution$/ });
    const variables = screen.getByRole("button", { name: /^Variables$/ });
    expect(execution.getAttribute("aria-pressed")).toBe("false");
    expect(variables.getAttribute("aria-pressed")).toBe("true");
    expect(variables.style.background).not.toBe("transparent");
  });
  it("preserves custom chart state and DOM identity through tracing, view switches, follow and exit", () => {
    const mounted = vi.fn(), unmounted = vi.fn();
    function StickyChart() {
      const [zoom, setZoom] = useState(1);
      useEffect(() => { mounted(); return unmounted; }, []);
      return <button onClick={() => setZoom(value => value + 1)}>Chart zoom {zoom}</button>;
    }
    const props = { cursorRuntimeStageId: "quote#5", snapshots };
    const view = render(<TraceDependencyView {...props} walk={null}><StickyChart /></TraceDependencyView>);
    const chart = screen.getByRole("button", { name: "Chart zoom 1" });
    fireEvent.click(chart);
    view.rerender(<TraceDependencyView {...props} walk={walk}><StickyChart /></TraceDependencyView>);
    expect(screen.getByRole("button", { name: "Chart zoom 2" })).toBe(chart);
    fireEvent.click(screen.getByRole("button", { name: /^Variables$/ }));
    expect(screen.queryByRole("button", { name: /Chart zoom/ })).toBeNull();
    expect((chart.closest('[data-fp="trace-execution-layer"]') as HTMLElement).inert).toBe(true);
    view.rerender(<TraceDependencyView {...props} walk={buildTraceWalk(log, tree, "baseRate")}><StickyChart /></TraceDependencyView>);
    fireEvent.click(screen.getByRole("button", { name: /^Execution$/ }));
    expect(screen.getByRole("button", { name: "Chart zoom 2" })).toBe(chart);
    view.rerender(<TraceDependencyView {...props} walk={null}><StickyChart /></TraceDependencyView>);
    expect(screen.getByRole("button", { name: "Chart zoom 2" })).toBe(chart);
    expect(mounted).toHaveBeenCalledOnce();
    expect(unmounted).not.toHaveBeenCalled();
  });

  it("keeps the parent question visible while following a child and restores it explicitly", () => {
    const onReturn = vi.fn();
    render(<TraceDependencyView walk={walk} cursorRuntimeStageId="quote#5" snapshots={snapshots}
      questionTrail={[{ key: "parentQuote", invocationPath: [] }, { key: "quote", invocationPath: ["child#2"] }]}
      onReturnToQuestion={onReturn}><div>Execution chart</div></TraceDependencyView>);
    const bridge = document.querySelector('[data-fp="trace-context-bridge"]')!;
    expect(bridge.textContent).toContain("FollowingparentQuote→quote");
    fireEvent.click(within(bridge as HTMLElement).getByRole("button", { name: "parentQuote" }));
    expect(onReturn).toHaveBeenCalledWith(0);
  });

  it("withholds previews for duplicate writer snapshots instead of choosing a later value", () => {
    const ownSnapshots = [...snapshots, { ...snapshots[1], memory: { baseRate: "wrong" } }];
    const { container } = render(<TraceDependencyView hasWorkflow={false} walk={walk} cursorRuntimeStageId="quote#5" snapshots={ownSnapshots}><div /></TraceDependencyView>);
    const node = container.querySelector('[data-variable="baseRate"]')!;
    expect(node.textContent).toContain("Value not recorded");
    expect(node.textContent).not.toContain("wrong");
  });

  it("withholds one snapshot reused by different writer commits", () => {
    const latest = { ...walk.stops[0], runtimeStageId: "same#0", stageName: "Update", commitIdx: 1,
      contributedKeys: ["score"], keysWritten: ["score"], ingredients: [{ key: "score", writerRuntimeStageId: "same#0", writerStageName: "Seed", writerCommitIdx: 0 }] };
    const earlier = { ...latest, stageName: "Seed", commitIdx: 0, ingredients: [] };
    const ambiguous: TraceWalk = { ...walk, key: "score", stops: [latest, earlier] };
    const { container } = render(<TraceDependencyView hasWorkflow={false} walk={ambiguous} cursorRuntimeStageId="same#0"
      snapshots={[{ ...snapshots[0], runtimeStageId: "same#0", memory: { score: 2 } }]}><div /></TraceDependencyView>);
    const nodes = container.querySelectorAll('[data-variable="score"]');
    expect(nodes).toHaveLength(2);
    for (const node of nodes) expect(node.textContent).toContain("Value not recorded");
    expect(container.textContent).not.toContain("Why score = 2?");
  });

  it("keeps the followed variable's element and turns transitions off when reduced motion changes", () => {
    const listeners = new Set<() => void>();
    const media = { matches: false,
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    };
    vi.stubGlobal("matchMedia", () => media);
    try {
      const props = { hasWorkflow: false, cursorRuntimeStageId: "quote#5", snapshots };
      const view = render(<TraceDependencyView {...props} walk={walk}><div /></TraceDependencyView>);
      const before = view.container.querySelector('[data-variable="baseRate"]') as HTMLElement;
      expect(view.container.querySelector('[data-motion="on"]')).toBeTruthy();
      expect(before.style.transition).toContain("240ms");
      view.rerender(<TraceDependencyView {...props} walk={buildTraceWalk(log, tree, "baseRate")}><div /></TraceDependencyView>);
      expect(view.container.querySelector('[data-variable="baseRate"]')).toBe(before);
      act(() => { media.matches = true; listeners.forEach(listener => listener()); });
      expect(view.container.querySelector('[data-motion="off"]')).toBeTruthy();
      expect(before.style.transition).toBe("");
      expect(before.style.animation).toBe("");
    } finally { vi.unstubAllGlobals(); }
  });

});
