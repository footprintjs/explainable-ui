/** @vitest-environment jsdom */
import { createElement } from "react";
import { render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { StageNode, type StageNodeData } from "../../src/components/StageNode";

const trace: NonNullable<StageNodeData["traceWorkflow"]> = {
  color: "rebeccapurple",
  role: "question",
  values: [{ key: "total", preview: "20", color: "darkcyan" }],
};

function node(data: Partial<StageNodeData>) {
  const props = { data: { label: "Sum", description: "Add recorded inputs", ...data } } as unknown as Parameters<typeof StageNode>[0];
  return createElement(ReactFlowProvider, null, createElement(StageNode, props));
}

describe("StageNode recorded-evidence overlay", () => {
  it.each([
    { done: true }, { active: true }, { error: true }, { isDecider: true, done: true },
  ])("adds a static role and values without changing the status body or layout: %j", status => {
    const view = render(node(status));
    const body = () => view.container.querySelector<HTMLElement>('[data-fp="stage-node-body"]')!;
    const baseline = body().outerHTML;
    const wrapperStyle = view.container.querySelector('[data-fp="stage-node"]')!.getAttribute("style");
    const handles = [...view.container.querySelectorAll(".react-flow__handle")].map(handle => handle.className);

    view.rerender(node({ ...status, traceWorkflow: trace }));
    expect(body().outerHTML).toBe(baseline); // Background, icons, border, padding and intrinsic shape stay untouched.
    expect(view.container.querySelector('[data-fp="stage-node"]')!.getAttribute("style")).toBe(wrapperStyle);
    expect([...view.container.querySelectorAll(".react-flow__handle")].map(handle => handle.className)).toEqual(handles);
    expect(handles).toHaveLength(2);
    expect(view.getByText("Question")).toBeTruthy();
    expect(view.getByText("total = 20")).toBeTruthy();
    const ring = view.container.querySelector<HTMLElement>('[data-fp="trace-workflow-ring"]')!;
    expect(ring.style.position).toBe("absolute");
    expect(ring.getAttribute("aria-hidden")).toBe("true");
    expect(ring.style.animation).toBe("");
    const caption = view.container.querySelector<HTMLElement>('[data-fp="trace-workflow-caption"]')!;
    expect(caption.style.position).toBe("absolute");
    expect(caption.style.top).toBe("calc(100% + 7px)");
    expect(caption.style.height).toBe("18px");
    expect(caption.style.width).toBe("max-content");
    expect(caption.style.maxWidth).toBe("220px");
    expect(caption.style.flexDirection).not.toBe("column");
    expect(caption.querySelector('[data-fp="trace-workflow-role"]')).toBeTruthy();
    expect(caption.querySelector('[data-fp="trace-workflow-values"]')).toBeTruthy();
    expect(view.container.querySelector('[data-fp="stage-node"]')!.getAttribute("data-trace-role")).toBe("question");
  });

  it.each([
    ["input", "Recorded input"], ["upstream", "Upstream read"],
  ] as const)("names the %s role and keeps unavailable values explicit", (role, label) => {
    const view = render(node({ traceWorkflow: { ...trace, role, values: [{ key: "profile\u001fname", preview: null, color: "darkcyan" }] } }));
    expect(view.getByText(label)).toBeTruthy();
    expect(view.getByText("profile › name · preview unavailable")).toBeTruthy();
  });

  it("bounds badges and their text without retaining full values in attributes", () => {
    const key = "k".repeat(2_000), preview = "v".repeat(2_000);
    const view = render(node({ traceWorkflow: { ...trace, values: [
      { key, preview, color: "darkcyan" },
      { key: "second", preview: "2", color: "darkcyan" },
      { key: "third", preview: "3", color: "darkcyan" },
    ] } }));
    expect(view.container.querySelectorAll('[data-fp="trace-workflow-value"]')).toHaveLength(1);
    expect(view.getByText("+2 more")).toBeTruthy();
    expect(view.container.textContent).not.toContain("second");
    expect(view.container.textContent).not.toContain("third");
    expect(view.container.innerHTML).not.toContain(key);
    expect(view.container.innerHTML).not.toContain(preview);
    expect(view.container.querySelector('[data-fp="trace-workflow-value"]')!.textContent!.length).toBeLessThan(90);
  });

  it("stops linked, active and state-dot motion while retaining the cursor and status", () => {
    const view = render(node({ linked: true, active: true, traceWorkflow: trace, suppressMotion: true }));
    const stage = view.container.querySelector<HTMLElement>('[data-fp="stage-node"]')!;
    expect(stage.getAttribute("data-motion-suppressed")).toBe("true");
    expect(view.getByText("NOW")).toBeTruthy();
    const animated = [...stage.querySelectorAll<HTMLElement>("[style]")].filter(element => element.style.animation);
    expect(animated).toHaveLength(3); // linked ring, active ring, state dot
    expect(animated.every(element => element.style.animation === "none")).toBe(true);
    expect(view.container.querySelector<HTMLElement>('[data-fp="stage-node-body"]')!.style.transition).toBe("none");
    expect(document.getElementById("fp-stage-node-keyframes")!.textContent).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation: none !important[\s\S]*transition: none !important/);
  });
});
