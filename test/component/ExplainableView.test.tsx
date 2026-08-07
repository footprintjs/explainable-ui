/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import * as React from "react";

import {
  CommentaryPanel,
  ExplainableProvider,
  ExplainableView,
  TimelinePanel,
  ValueInspector,
} from "../../src/components/ExplainableView";

const RECORDING = {
  schemaVersion: 1,
  snapshot: {
    sharedState: { count: 2, decision: "continue" },
    executionTree: {
      id: "alpha",
      name: "Alpha",
      runtimeStageId: "alpha#0",
      logs: {}, errors: {}, metrics: {}, evals: {},
      next: {
        id: "beta",
        name: "Beta",
        runtimeStageId: "beta#1",
        logs: {}, errors: {}, metrics: {}, evals: {},
      },
    },
    commitLog: [
      { idx: 0, stage: "Alpha", stageId: "alpha", runtimeStageId: "alpha#0", overwrite: { count: 1 }, updates: {}, trace: [{ path: "count", verb: "set" }] },
      { idx: 1, stage: "Beta", stageId: "beta", runtimeStageId: "beta#1", overwrite: { count: 2, decision: "continue" }, updates: {}, trace: [{ path: "count", verb: "set" }, { path: "decision", verb: "set" }] },
    ],
  },
  structure: {
    id: "alpha",
    name: "Alpha",
    description: "Load the starting value",
    next: { id: "beta", name: "Beta", description: "Choose what happens next" },
  },
  narrativeEntries: [
    { type: "stage", text: "Alpha loaded the starting value.", depth: 0, stageId: "alpha", runtimeStageId: "alpha#0" },
    { type: "stage", text: "Beta chose the continue path.", depth: 0, stageId: "beta", runtimeStageId: "beta#1" },
  ],
};

afterEach(cleanup);

describe("ExplainableView composable recording UI", () => {
  it("parses external JSON and synchronizes timeline, inspector, and commentary", async () => {
    const { container, getByRole, queryByText, getByText } = render(
      <ExplainableView
        recording={JSON.stringify(RECORDING)}
        layout="linear"
        theme={{
          mode: "light",
          tokens: { colors: { primary: "#245c45", warning: "#df6a4e" } },
          flowchart: { done: "#245c45", active: "#df6a4e" },
        }}
      />,
    );

    expect(container.querySelector('[data-fp="timeline-panel"]')).toBeTruthy();
    expect(container.querySelector('[data-fp="flowchart-panel"]')).toBeTruthy();
    expect(container.querySelector('[data-fp="value-inspector"]')).toBeTruthy();
    expect(container.querySelector('[data-fp="commentary-panel"]')).toBeTruthy();
    expect(getByText("Alpha loaded the starting value.")).toBeTruthy();
    expect(queryByText("Beta chose the continue path.")).toBeNull();

    fireEvent.click(getByRole("option", { name: "Go to stage 2: beta" }));
    expect(getByText("Beta chose the continue path.")).toBeTruthy();
    expect(container.querySelector('[data-fp="value-inspector"]')?.textContent).toContain("beta");

    const provider = container.querySelector<HTMLElement>('[data-fp="explainable-provider"]');
    expect(provider?.style.getPropertyValue("--fp-bg-primary")).not.toBe("");
    await waitFor(() => expect(container.querySelectorAll(".react-flow__node").length).toBe(2));
  });

  it("lets consumers own layout while the provider owns the cursor", () => {
    const { getByText, getByRole, queryByText } = render(
      <ExplainableProvider recording={RECORDING}>
        <TimelinePanel />
        <ValueInspector />
        <CommentaryPanel />
      </ExplainableProvider>,
    );

    expect(getByText("Alpha loaded the starting value.")).toBeTruthy();
    expect(queryByText("Beta chose the continue path.")).toBeNull();
    fireEvent.click(getByRole("option", { name: "Go to stage 2: beta" }));
    expect(getByText("Beta chose the continue path.")).toBeTruthy();
  });

  it("accepts a replacement slot without disturbing the other surfaces", () => {
    const { container, getByText } = render(
      <ExplainableView
        recording={RECORDING}
        layout="studio"
        slots={{ commentary: ({ selectedSnapshot }) => <div>Custom story for {selectedSnapshot?.stageLabel}</div> }}
      />,
    );

    expect(getByText("Custom story for alpha")).toBeTruthy();
    expect(container.querySelector('[data-fp="timeline-panel"]')).toBeTruthy();
    expect(container.querySelector('[data-fp="flowchart-panel"]')).toBeTruthy();
    expect(container.querySelector('[data-fp="value-inspector"]')).toBeTruthy();
    expect(container.querySelector('[data-fp="commentary-panel"]')).toBeNull();
  });

  it("reassembles the old workbench and gives product a full-width commentary", () => {
    const view = render(
      <ExplainableView recording={RECORDING} />,
    );

    const workbench = view.container.querySelector<HTMLElement>('[data-fp="explainable-view"]');
    expect(workbench?.dataset.layout).toBe("developer");
    expect(workbench?.style.display).toBe("flex");
    expect(workbench?.style.height).toBe("100%");
    expect(workbench?.style.maxHeight).toBe("100%");
    expect(workbench?.style.overflow).toBe("hidden");
    for (const surface of workbench?.querySelectorAll<HTMLElement>("[data-fp-surface]") ?? []) {
      expect(surface.style.minHeight).toBe("0px");
      expect(surface.style.overflow).toBe("hidden");
    }
    expect(view.container.querySelector('[data-fp="time-travel-controls"]')).toBeTruthy();
    expect(view.container.querySelector('[data-fp="compact-timeline-panel"]')).toBeTruthy();
    expect(view.container.querySelector('[data-fp="value-inspector"]')).toBeTruthy();
    expect(view.container.querySelector('[data-fp="commentary-panel"]')).toBeNull();
    expect(view.container.querySelector('[data-fp="timeline-panel"]')).toBeNull();
    expect(view.container.querySelector('[data-fp="surface-collapse-handle"]')).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Collapse details" }));
    expect(view.container.querySelector('[data-fp="value-inspector"]')).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Expand details" }));
    expect(view.container.querySelector('[data-fp="value-inspector"]')).toBeTruthy();

    view.rerender(<ExplainableView recording={RECORDING} layout="product" />);
    expect(view.container.querySelector('[data-fp="value-inspector"]')).toBeTruthy();
    expect(view.container.querySelector('[data-fp="commentary-panel"]')).toBeTruthy();
    expect(view.container.querySelector('[data-fp="time-travel-controls"]')).toBeTruthy();
    expect(view.container.querySelector('[data-fp="compact-timeline-panel"]')).toBeNull();
    expect(
      view.container.querySelector<HTMLElement>('[data-fp-surface="commentary"]')?.style.width,
    ).toBe("100%");
    fireEvent.click(view.getByRole("button", { name: "Next stage" }));
    expect(view.getByText("Beta chose the continue path.")).toBeTruthy();
  });

  it("lets consumers place and hide surfaces with named grid areas", () => {
    const { container } = render(
      <ExplainableView
        recording={RECORDING}
        layout={{
          columns: "320px minmax(0, 1fr)",
          rows: "minmax(480px, 1fr) 220px",
          areas: [
            ["commentary", "flowchart"],
            ["timeline", "timeline"],
          ],
        }}
      />,
    );

    const view = container.querySelector<HTMLElement>('[data-fp="explainable-view"]');
    expect(view?.dataset.layout).toBe("custom");
    expect(view?.style.gridTemplateColumns).toBe("320px minmax(0, 1fr)");
    expect(view?.style.gridTemplateAreas).toBe(
      '"commentary flowchart" "timeline timeline"',
    );
    expect(container.querySelector('[data-fp-surface="inspector"]')).toBeNull();
    expect(container.querySelector('[data-fp-surface="commentary"]')).toBeTruthy();
  });

  it("stacks the old workbench inside a narrow host instead of overflowing", () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    const observers: Array<{
      callback: ResizeObserverCallback;
      element?: Element;
      instance: ResizeObserver;
    }> = [];
    class TestResizeObserver implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        observers.push({ callback, instance: this });
      }
      disconnect() {}
      observe(element: Element) {
        const observer = observers.find((candidate) => candidate.instance === this);
        if (observer) observer.element = element;
      }
      unobserve() {}
    }
    globalThis.ResizeObserver = TestResizeObserver;

    try {
      const { container } = render(
        <ExplainableView recording={RECORDING} layout="product" />,
      );
      const workbench = container.querySelector<HTMLElement>('[data-fp="explainable-view"]');
      const observer = observers.find((candidate) => candidate.element === workbench);
      expect(observer).toBeTruthy();
      act(() => {
        observer?.callback(
          [{ contentRect: { width: 520 } } as ResizeObserverEntry],
          observer.instance,
        );
      });

      expect(workbench?.dataset.narrow).toBe("true");
      expect(
        container.querySelector<HTMLElement>('[data-fp="workbench-main"]')?.style.flexDirection,
      ).toBe("column");
      expect(
        container.querySelector<HTMLElement>('[data-fp="surface-collapse-handle"]')?.dataset.orientation,
      ).toBe("horizontal");
      expect(container.querySelector('[data-fp="value-inspector"]')).toBeTruthy();
      expect(container.querySelector('[data-fp="commentary-panel"]')).toBeTruthy();
      expect(container.querySelector('[data-fp="compact-timeline-panel"]')).toBeNull();
    } finally {
      globalThis.ResizeObserver = originalResizeObserver;
    }
  });
});
