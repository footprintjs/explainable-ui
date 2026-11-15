/** @vitest-environment jsdom */
import { createElement, forwardRef } from "react";
import { fireEvent, render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { StageNode, type StageNodeData } from "../../src/components/StageNode";
import { GroupContainerNode } from "../../src/components/GroupContainerNode";
import { SlotPillNode } from "../../src/components/SlotPillNode";
import { FootprintTheme, type FootprintIconAdapterProps } from "../../src/theme";

function stage(data: Partial<StageNodeData>) {
  const props = { data: { label: "Stage", description: "Recorded work", stageId: "stage", showStageId: true, ...data } } as unknown as Parameters<typeof StageNode>[0];
  return createElement(ReactFlowProvider, null, createElement(StageNode, props));
}

describe("chart design-system rendering", () => {
  it.each([false, true])("uses the brand cursor pair for its badge while retry keeps warning: tracing=%s", tracing => {
    const view = render(<FootprintTheme tokens={{ colors: { nodeCursor: "#14532d", onNodeCursor: "#fff", warning: "#f59e0b" } }}>
      {stage({ active: true, retryAttempts: 3, traceContext: tracing ? "displayed" : undefined })}
    </FootprintTheme>);
    const badge = view.container.querySelector<HTMLElement>('[data-fp="stage-cursor-badge"]')!;
    expect(badge.textContent).toBe(tracing ? "VIEWING" : "NOW");
    expect(badge.style.background).toContain("--fp-node-cursor");
    expect(badge.style.color).toContain("--fp-on-node-cursor");
    expect(badge.style.boxShadow).toContain("--fp-node-cursor");
    expect(badge.style.fontSize).toContain("--fp-font-size-body");
    expect(badge.style.borderRadius).toContain("--fp-radius-control");
    expect(view.getByRole("img", { name: /retried/ }).style.color).toContain("--fp-color-warning");
    const root = view.container.querySelector<HTMLElement>(".fp-theme-root")!;
    expect(root.style.getPropertyValue("--fp-node-cursor")).toBe("#14532d");
    expect(root.style.getPropertyValue("--fp-on-node-cursor")).toBe("#fff");
  });

  it.each([
    [{ active: true }, "--fp-on-node-cursor"],
    [{ done: true }, "--fp-on-node-visited"],
    [{ done: true, emphasis: "hero" }, "--fp-on-node-main"],
    [{ error: true }, "--fp-on-error"],
  ] as const)("pairs the node foreground with its semantic fill: %j", (status, foreground) => {
    const view = render(<FootprintTheme tokens={{ colors: { nodeCursor: "#111", onNodeCursor: "#eee", nodeVisited: "#fff", onNodeVisited: "#111" } }}>
      {stage(status)}
    </FootprintTheme>);
    const label = view.getByText("Stage");
    expect(label.style.color).toContain(foreground);
    expect(label.style.fontSize).toContain("--fp-font-size-body");
    expect(view.container.querySelector<HTMLElement>(".fp-theme-root")!.style.getPropertyValue("--fp-on-node-cursor")).toBe("#eee");
  });

  it("retains content, statuses and ports while stripping StageNode paint", () => {
    const data: Partial<StageNodeData> = { active: true, retryAttempts: 3, stepNumbers: [1], traceWorkflow: {
      color: "purple", role: "question", values: [{ key: "answer", preview: "7", color: "teal" }],
    } };
    const view = render(stage(data));
    const text = view.container.textContent;
    view.rerender(stage({ ...data, unstyled: true }));
    expect(view.container.textContent).toBe(text);
    expect(view.container.querySelectorAll(".react-flow__handle")).toHaveLength(2);
    const node = view.container.querySelector<HTMLElement>('[data-fp="stage-node"]')!;
    expect(node.dataset.active).toBe("true");
    expect(node.dataset.traceContext).toBe("displayed");
    expect(node.dataset.unstyled).toBe("true");
    const body = node.querySelector<HTMLElement>('[data-fp="stage-node-body"]')!;
    expect(body.style.minWidth).toBe("100px");
    for (const element of node.querySelectorAll<HTMLElement>("[style]")) {
      expect(element.style.background).toBe("");
      expect(element.style.border).toBe("");
      expect(element.style.color).toBe("");
      expect(element.style.fontSize).toBe("");
      expect(element.style.boxShadow).toBe("");
    }
    expect(view.container.querySelectorAll("button")).toHaveLength(0);
  });

  it("lets the host icon registry render semantic names, including names unknown to the built-in set", () => {
    const Icon = forwardRef<HTMLSpanElement, FootprintIconAdapterProps>(function Icon({ name, children: _children, ...props }, ref) {
      return <span {...props} ref={ref} data-host-icon={name}>Brand icon</span>;
    });
    const view = render(<FootprintTheme components={{ Icon }}>{stage({ active: true, icon: "company-step" })}</FootprintTheme>);
    expect(view.getByText("Brand icon").getAttribute("data-host-icon")).toBe("company-step");
    expect(view.getByText("Brand icon").getAttribute("data-fp-part")).toBe("stage-icon");
    expect(view.container.querySelector('[data-host-icon="company-step"] svg')).toBeNull();
  });

  it("keeps group containment, header actions, status text and handle direction in unstyled mode", () => {
    const clicked = vi.fn();
    const props = { data: { label: "Group", headerMode: "expandable", headerAction: <button onClick={clicked}>Expand</button>,
      statusLabel: "Recorded status", handleDirection: "LR", active: true, unstyled: true } } as unknown as Parameters<typeof GroupContainerNode>[0];
    const view = render(createElement(ReactFlowProvider, null, createElement(GroupContainerNode, props)));
    const group = view.container.querySelector<HTMLElement>('[data-fp="group-container-node"]')!;
    expect(group.style.width).toBe("100%");
    expect(group.style.height).toBe("100%");
    expect(group.style.position).toBe("relative");
    expect(group.style.background).toBe("");
    expect(group.style.border).toBe("");
    expect(view.getByText("Recorded status")).toBeTruthy();
    expect(view.container.querySelector(".react-flow__handle-left")).toBeTruthy();
    expect(view.container.querySelector(".react-flow__handle-right")).toBeTruthy();
    fireEvent.click(view.getByText("Expand")); expect(clicked).toHaveBeenCalledOnce();
  });

  it("keeps the pill footprint and semantic status without its default paint", () => {
    const props = { data: { label: "Slot", active: true, done: true, unstyled: true } } as unknown as Parameters<typeof SlotPillNode>[0];
    const view = render(createElement(ReactFlowProvider, null, createElement(SlotPillNode, props)));
    const pill = view.container.querySelector<HTMLElement>('[data-fp="slot-pill-node"]')!;
    expect(pill.style.width).toBe("100%");
    expect(pill.style.height).toBe("100%");
    expect(pill.dataset.active).toBe("true");
    expect(pill.dataset.done).toBe("true");
    expect(pill.style.background).toBe("");
    expect(pill.style.border).toBe("");
    expect(pill.style.opacity).toBe("");
    expect(view.container.querySelectorAll(".react-flow__handle")).toHaveLength(2);
    expect(view.getByText("Slot")).toBeTruthy();
  });
});
