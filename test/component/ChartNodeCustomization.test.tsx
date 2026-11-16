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

  it.each([
    [{}, "--fp-border", "2px"],
    [{ active: true }, "--fp-node-cursor", "2px"],
    [{ done: true }, "--fp-node-visited", "2px"],
    [{ error: true }, "--fp-color-error", "2px"],
    [{ done: true, emphasis: "hero" }, "--fp-node-main", "2.5px"],
    [{ emphasis: "muted" }, "--fp-border", "1px"],
  ] as const)("can outline and lift each recorded state independently of its fill: %j", (status, legacyOutline, legacyWidth) => {
    const flags = status as Partial<StageNodeData>;
    const view = render(<FootprintTheme tokens={{ nodes: {
      borderColor: "#35332f", borderWidth: "1px", radius: "5px", shadow: "2px 3px 0 #35332f",
    } }}>{stage(status)}</FootprintTheme>);
    const body = view.container.querySelector<HTMLElement>('[data-fp="stage-node-body"]')!;
    const node = view.container.querySelector<HTMLElement>('[data-fp="stage-node"]')!;
    const declarations = view.container.querySelector<HTMLElement>(".fp-theme-root")!.style;
    expect(declarations.getPropertyValue("--fp-node-border-color")).toBe("#35332f");
    expect(declarations.getPropertyValue("--fp-node-shadow")).toBe("2px 3px 0 #35332f");
    expect(body.style.border).toContain("--fp-node-border-color");
    expect(body.style.border).toContain(legacyOutline);
    expect(body.style.border).toContain(`var(--fp-node-border-width, ${legacyWidth})`);
    expect(body.style.borderRadius).toContain("--fp-node-radius");
    expect(body.style.boxShadow).toContain("--fp-node-shadow");
    expect(body.style.background).not.toContain("--fp-node-border-color");
    expect(node.dataset.active).toBe(flags.active ? "true" : undefined);
    expect(node.dataset.done).toBe(flags.done ? "true" : undefined);
    expect(node.dataset.error).toBe(flags.error ? "true" : undefined);
    expect(view.getByText("Recorded work")).toBeTruthy();
    expect(view.container.querySelectorAll(".react-flow__handle")).toHaveLength(2);
  });

  it("uses the same outline and shadow overrides for decision shapes without changing the recorded cursor", () => {
    const view = render(<FootprintTheme tokens={{ nodes: {
      borderColor: "#35332f", borderWidth: "1px", shadow: "2px 3px 0 #35332f", badgeShadow: "none", pulseOpacity: "0",
      shapeShadow: "drop-shadow(2px 3px 0 #35332f)",
    } }}>{stage({ isDecider: true, active: true, stepNumbers: [2] })}</FootprintTheme>);
    const body = view.container.querySelector<HTMLElement>('[data-fp="stage-node-body"]')!;
    const layers = [...body.querySelectorAll<HTMLElement>("[style]")];
    const outline = layers.find(layer => layer.style.background.includes("--fp-node-border-color"))!;
    const shape = layers.find(layer => layer.style.boxShadow.includes("--fp-node-shadow"))!;
    expect(outline.style.inset).toContain("--fp-node-border-width");
    expect(outline.style.clipPath).toContain("polygon");
    expect(shape.style.background).toContain("--fp-node-cursor");
    expect(shape.style.clipPath).toContain("polygon");
    expect(body.style.filter).toContain("--fp-node-shape-shadow");
    const badge = view.container.querySelector<HTMLElement>('[data-fp="stage-cursor-badge"]')!;
    expect(badge.textContent).toBe("NOW");
    expect(badge.style.boxShadow).toContain("--fp-node-badge-shadow");
    expect(view.container.querySelector('[data-fp="stage-node"]')?.getAttribute("data-active")).toBe("true");
    expect(view.container.querySelectorAll(".react-flow__handle")).toHaveLength(2);
    view.rerender(<FootprintTheme tokens={{ nodes: { shapeShadow: "drop-shadow(2px 3px 0 #35332f)" } }}>
      {stage({ isDecider: true, active: true, stepNumbers: [2], unstyled: true })}
    </FootprintTheme>);
    expect(view.container.querySelector<HTMLElement>('[data-fp="stage-node-body"]')!.style.filter).toBe("");
    expect(view.container.querySelectorAll(".react-flow__handle")).toHaveLength(2);
  });

  it.each([
    [{ active: true }, "Selected"],
    [{ done: true }, "Visited"],
    [{ error: true, done: true }, "Failed"],
  ] as const)("keeps group status explicit with a fixed outline: %j", (status, label) => {
    const props = { data: { label: "Recorded group", ...status } } as unknown as Parameters<typeof GroupContainerNode>[0];
    const view = render(<FootprintTheme tokens={{ nodes: { borderColor: "#35332f", groupStatusDisplay: "inline-flex" } }}>
      {createElement(ReactFlowProvider, null, createElement(GroupContainerNode, props))}
    </FootprintTheme>);
    const badge = view.container.querySelector<HTMLElement>('[data-fp="group-status-badge"]')!;
    expect(badge.textContent).toBe(label);
    expect(badge.style.display).toContain("--fp-node-group-status-display");
    // A visited container is an execution position, not a completion claim.
    expect(badge.textContent).not.toMatch(/complet|success/i);
    expect(view.container.querySelectorAll(".react-flow__handle")).toHaveLength(2);
    view.rerender(<FootprintTheme tokens={{ nodes: { groupStatusDisplay: "inline-flex" } }}>
      {createElement(ReactFlowProvider, null, createElement(GroupContainerNode, {
        ...props, data: { ...props.data, unstyled: true },
      }))}
    </FootprintTheme>);
    expect(view.container.querySelector('[data-fp="group-status-badge"]')).toBeNull();
  });

  it.each([
    [GroupContainerNode, "group-container-node"],
    [SlotPillNode, "slot-pill-node"],
  ] as const)("shares node paint with %s while retaining its footprint and recorded status", (Component, part) => {
    const props = { data: { label: "Recorded group", active: true, done: true } } as unknown as Parameters<typeof Component>[0];
    const view = render(<FootprintTheme tokens={{ nodes: {
      borderColor: "#35332f", borderWidth: "1px", borderStyle: "solid", radius: "5px", shadow: "2px 3px 0 #35332f",
    } }}>{createElement(ReactFlowProvider, null, createElement(Component, props))}</FootprintTheme>);
    const card = view.container.querySelector<HTMLElement>(`[data-fp="${part}"]`)!;
    expect(card.style.border).toContain("--fp-node-border-color");
    expect(card.style.border).toContain("--fp-node-border-width");
    expect(card.style.border).toContain("--fp-node-border-style");
    expect(card.style.borderRadius).toContain("--fp-node-radius");
    expect(card.style.boxShadow).toContain("--fp-node-shadow");
    expect(card.style.width).toBe("100%");
    expect(card.style.height).toBe("100%");
    expect(card.dataset.active).toBe("true");
    expect(card.dataset.done).toBe("true");
    expect(view.getByText("Recorded group")).toBeTruthy();
    expect(view.container.querySelectorAll(".react-flow__handle")).toHaveLength(2);
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
