/** @vitest-environment jsdom */
import { createElement, forwardRef } from "react";
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { Position, ReactFlowProvider, type EdgeProps } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { FootprintTheme, IsometricEdge, IsometricStageNode, type FootprintIconAdapterProps, type StageNodeData } from "footprint-explainable-ui/flowchart";

function stage(data: Partial<StageNodeData>) {
  const props = { data: { label: "Combine", description: "Combine the recorded amounts", ...data } } as unknown as Parameters<typeof IsometricStageNode>[0];
  return createElement(ReactFlowProvider, null, createElement(IsometricStageNode, props));
}

describe("built-in isometric rendering", () => {
  it("keeps the recorded label, description, selection and native connection directions accessible", () => {
    const view = render(stage({ active: true, stepNumbers: [5] }));
    const node = view.getByRole("group", { name: /Combine\. Combine the recorded amounts\. Selected step\. Execution steps 5/ });
    expect(node.getAttribute("title")).toBe(node.getAttribute("aria-label"));
    expect(node.getAttribute("data-active")).toBe("true");
    expect(view.getByText("NOW")).toBeTruthy();
    expect(node.querySelectorAll(".react-flow__handle")).toHaveLength(2);
    expect(node.querySelector(".react-flow__handle.target.react-flow__handle-left")).toBeTruthy();
    expect(node.querySelector(".react-flow__handle.source.react-flow__handle-right")).toBeTruthy();
  });

  it.each([
    { traceContext: "displayed" },
    { traceContext: "outside" },
    { traceWorkflow: { color: "purple", role: "question", values: [{ key: "total", preview: "35", color: "purple" }] } },
  ] satisfies Partial<StageNodeData>[])("calls an inspected recorded cursor VIEWING rather than NOW: %j", context => {
    const view = render(stage({ active: true, ...context }));
    expect(view.getByText("VIEWING")).toBeTruthy();
    expect(view.queryByText("NOW")).toBeNull();
    expect(view.getByRole("group", { name: /Selected step/ }).getAttribute("data-active")).toBe("true");
  });

  it("retains recorded failure and retry facts independently of the illustrated shape", () => {
    const view = render(stage({ label: "FetchQuote", description: "Read the recorded quote", error: true, retryAttempts: 3 }));
    const node = view.getByRole("group", { name: /FetchQuote\. Read the recorded quote\. Recorded failure\. retried, attempt 3 of 3 failed/ });
    expect(node.getAttribute("data-error")).toBe("true");
    expect(node.getAttribute("data-active")).toBeNull();
    expect(view.getByText("FAILED")).toBeTruthy();
    expect(view.getByRole("img", { name: "retried, attempt 3 of 3 failed" })).toBeTruthy();
  });

  it("displays recorded nested trace-value paths without exposing the canonical separator", () => {
    const key = "runs\u001fitems\u001famount";
    const view = render(stage({ traceWorkflow: { color: "teal", role: "input", values: [{ key, preview: "30", color: "teal" }] } }));
    const node = view.getByRole("group", { name: /Recorded input: runs › items › amount = 30/ });
    expect(node.textContent).toContain("runs › items › amount = 30");
    expect(node.textContent).not.toContain("\u001f");
    expect(node.getAttribute("aria-label")).not.toContain("\u001f");
  });

  it("passes the recorded semantic icon name through the consumer Icon adapter", () => {
    const Icon = forwardRef<HTMLSpanElement, FootprintIconAdapterProps>(function Icon({ name, children: _children, ...props }, ref) {
      return <span {...props} ref={ref} data-consumer-icon={name}>Consumer icon</span>;
    });
    const view = render(<FootprintTheme components={{ Icon }}>{stage({ icon: "company-deploy" })}</FootprintTheme>);
    expect(view.container.querySelector('[data-consumer-icon="company-deploy"]')).toBeTruthy();
    expect(view.getByRole("group", { name: /Combine\. Combine the recorded amounts/ })).toBeTruthy();
  });

  it("keeps the accessible facts and ports in unstyled mode without applying its surface shadow", () => {
    const view = render(stage({ active: true, error: true, retryAttempts: 2, unstyled: true }));
    const node = view.getByRole("group", { name: /Selected step\. Recorded failure/ });
    expect(node.getAttribute("data-unstyled")).toBe("true");
    expect(node.style.width).toBe("168px");
    expect(node.style.height).toBe("116px");
    expect(node.style.fontFamily).toBe("");
    expect(node.style.color).toBe("");
    expect(node.style.boxShadow).toBe("");
    expect(node.querySelector<SVGElement>(".iso-stage__slab")!.style.filter).toBe("");
    expect(node.querySelectorAll(".react-flow__handle")).toHaveLength(2);
    expect(view.getByRole("img", { name: "retried, attempt 2 of 2 failed" })).toBeTruthy();
  });

  it("preserves consumer edge labels, paint, markers and interaction width", () => {
    const props: EdgeProps = {
      id: "items-to-combine", source: "items", target: "combine",
      sourceX: 10, sourceY: 20, targetX: 100, targetY: 70,
      sourcePosition: Position.Right, targetPosition: Position.Left,
      label: "Recorded input", markerStart: "url(#read-start)", markerEnd: "url(#read-end)", interactionWidth: 32,
      style: { stroke: "#0d9488", strokeWidth: 3, strokeDasharray: "5 3" },
      labelStyle: { fill: "#292723", fontWeight: 600 },
      labelBgStyle: { fill: "#faf8f2" }, labelShowBg: true,
    };
    // Server markup exercises the real BaseEdge contract without SVG text
    // measurement (getBBox), which jsdom does not implement.
    const host = document.createElement("div");
    host.innerHTML = renderToStaticMarkup(<svg><IsometricEdge {...props} /></svg>);
    const path = host.querySelector<SVGElement>(".react-flow__edge-path")!;
    expect(path.getAttribute("id")).toBe("items-to-combine");
    expect(path.getAttribute("marker-start")).toBe("url(#read-start)");
    expect(path.getAttribute("marker-end")).toBe("url(#read-end)");
    expect(path.style.stroke).toBe("rgb(13, 148, 136)");
    expect(path.style.strokeWidth).toBe("3");
    expect(path.style.strokeDasharray).toBe("5 3");
    expect(host.querySelector(".react-flow__edge-interaction")!.getAttribute("stroke-width")).toBe("32");
    const label = host.querySelector<SVGElement>(".react-flow__edge-text")!;
    expect(label.textContent).toBe("Recorded input");
    expect(label.style.fill).toBe("rgb(41, 39, 35)");
    expect(host.querySelector<SVGElement>(".react-flow__edge-textbg")!.style.fill).toBe("rgb(250, 248, 242)");
  });
});
