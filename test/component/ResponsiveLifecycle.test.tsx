/** @vitest-environment jsdom */
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import { ExplainableView } from "../../src/components/ExplainableView/ExplainableView";
import type { ExplainableRecording } from "../../src/components/ExplainableView/ExplainableContext";
import type { StageSnapshot } from "../../src/types";

const snapshots: StageSnapshot[] = [{
  stageName: "seed", stageLabel: "Seed", runtimeStageId: "seed#0",
  memory: { count: 1 }, narrative: "Seeded", startMs: 0, durationMs: 1,
}];
const recording: ExplainableRecording = {
  snapshot: {
    sharedState: { count: 1 },
    executionTree: { id: "seed", name: "Seed", runtimeStageId: "seed#0" },
    commitLog: [{ runtimeStageId: "seed#0", stageId: "seed", overwrite: { count: 1 }, updates: {} }],
  },
};
const slots = { timeTravel: null, flowchart: null, inspector: null, commentary: null, timeline: null };
const renderChart = () => <div>Chart</div>;

class ObservedContainer implements ResizeObserver {
  static instances: ObservedContainer[] = [];
  element?: Element;
  constructor(private callback: ResizeObserverCallback) { ObservedContainer.instances.push(this); }
  observe(element: Element) { this.element = element; }
  unobserve() {}
  disconnect = vi.fn();
  resize(width: number) {
    act(() => this.callback([{ target: this.element, contentRect: { width } } as ResizeObserverEntry], this));
  }
}

beforeEach(() => {
  ObservedContainer.instances = [];
  vi.stubGlobal("ResizeObserver", ObservedContainer);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function observerFor(element: Element): ObservedContainer {
  const observer = ObservedContainer.instances.find(candidate => candidate.element === element);
  expect(observer, "the current rendered container should be observed").toBeDefined();
  return observer!;
}

describe("responsive containers that attach after mounting", () => {
  it("observes the shell when an initially empty recording becomes available", () => {
    const view = render(<ExplainableShell snapshots={[]} renderFlowchart={renderChart} />);
    expect(view.container.querySelector('[data-fp="explainable-shell"]')).toBeNull();
    view.rerender(<ExplainableShell snapshots={snapshots} renderFlowchart={renderChart} />);
    const shell = view.container.querySelector<HTMLElement>('[data-fp="explainable-shell"]')!;
    const observer = observerFor(shell);
    observer.resize(520);
    expect((shell.lastElementChild as HTMLElement).style.overflow).toBe("auto");
    observer.resize(1100);
    expect((shell.lastElementChild as HTMLElement).style.overflow).toBe("hidden");
    view.unmount();
    expect(observer.disconnect).toHaveBeenCalledOnce();
  });

  it("attaches and releases shell observation as styling is toggled", () => {
    const view = render(<ExplainableShell snapshots={snapshots} renderFlowchart={renderChart} unstyled />);
    expect(ObservedContainer.instances).toHaveLength(0);
    view.rerender(<ExplainableShell snapshots={snapshots} renderFlowchart={renderChart} />);
    const shell = view.container.querySelector<HTMLElement>('[data-fp="explainable-shell"]')!;
    const observer = observerFor(shell);
    observer.resize(520);
    expect((shell.lastElementChild as HTMLElement).style.overflow).toBe("auto");
    view.rerender(<ExplainableShell snapshots={snapshots} renderFlowchart={renderChart} unstyled />);
    expect(observer.disconnect).toHaveBeenCalledOnce();
  });

  it("observes the composable view after switching from unstyled to styled", () => {
    const view = render(<ExplainableView recording={recording} slots={slots} unstyled />);
    expect(ObservedContainer.instances).toHaveLength(0);
    view.rerender(<ExplainableView recording={recording} slots={slots} />);
    const root = view.container.querySelector<HTMLElement>('[data-fp="explainable-view"]')!;
    const observer = observerFor(root);
    observer.resize(520);
    expect(root.dataset.narrow).toBe("true");
    expect(view.container.querySelector<HTMLElement>('[data-fp="workbench-main"]')?.style.flexDirection).toBe("column");
    observer.resize(1100);
    expect(root.dataset.narrow).toBeUndefined();
    expect(view.container.querySelector<HTMLElement>('[data-fp="workbench-main"]')?.style.flexDirection).toBe("row");
    view.rerender(<ExplainableView recording={recording} slots={slots} unstyled />);
    expect(observer.disconnect).toHaveBeenCalledOnce();
  });
});
