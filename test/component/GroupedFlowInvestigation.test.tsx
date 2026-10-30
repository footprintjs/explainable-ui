/** @vitest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GroupedFlowInvestigation } from "../../src/components/GroupedFlowInvestigation/GroupedFlowInvestigation";
import type { InvestigationPort, InvestigationResult } from "../../src/components/InvestigationPanel/types";

vi.mock("../../src/components/GroupedFlowDiagram/GroupedFlowDiagram", () => ({
  GroupedFlowDiagram: (props: any) => <section data-testid="diagram" data-selected={props.selectedNodeId ?? ""} data-expanded={props.expandedGroupIds?.join(" ") ?? ""}
    data-highlight-nodes={props.highlight?.nodeIds?.join(" ") ?? ""} data-highlight-edges={props.highlight?.edgeIds?.join(" ") ?? ""}
    data-camera={props.focusRequest?.nodeIds.join(" ") ?? ""}>
    {props.definition.nodes.filter((node: any) => node.kind !== "group").map((node: any) => <button key={node.id} onClick={() => props.onSelectNode(node.id)}>Select {node.label}</button>)}
    <output data-testid="edge-labels">{JSON.stringify(props.recordedRelationships)}</output>
  </section>,
}));
const definition = { nodes: [{ id: "flow", label: "Work", kind: "group" as const }, { id: "root", label: "Load", parentId: "flow" },
  { id: "failed", label: "Save", parentId: "flow" }, { id: "other", label: "Save" }], edges: [{ id: "design", source: "root", target: "failed", label: "Possible transition" }] };
const observation = { nodeStates: { failed: "failed" as const, root: "completed" as const, other: "failed" as const } };
const edge = { from: "failed", to: "root", kind: "data" as const, attribution: "recorded-read" as const, evidence: ["read:1"] };
const result = { nodeId: "failed", attention: [], rootCause: "root", path: ["failed", "root"], alternatives: [], confidence: "complete" as const, gaps: [],
  backward: { nodes: ["failed", "root"], edges: [edge], confidence: "complete" as const, gaps: [] },
  impact: { nodes: ["other"], edges: [{ ...edge, from: "failed", to: "other" }], confidence: "complete" as const, gaps: [] } };
const port = (explain: InvestigationPort["explain"] = vi.fn<InvestigationPort["explain"]>(async () => result)): InvestigationPort => ({ binding: {}, attention: { nodes: [], confidence: "complete", gaps: [] }, labels: { failed: "Save", root: "Load", other: "Another Save" }, explain });
const selectFailure = () => fireEvent.click(screen.getAllByRole("button", { name: "Select Save" })[0]!);
function deferred<T>() { let resolve!: (value: T) => void; return { promise: new Promise<T>(done => { resolve = done; }), resolve: (value: T) => resolve(value) }; }

it("does no eager query; a failed exact item requests one explanation, reveals ancestors and keeps design arrows unhighlighted", async () => {
  const source = port(); render(<GroupedFlowInvestigation definition={definition} observation={observation} port={source} />);
  expect(source.explain).not.toHaveBeenCalled(); selectFailure(); await screen.findByText("Supported root cause");
  expect(source.explain).toHaveBeenCalledTimes(1); expect(vi.mocked(source.explain).mock.calls[0]?.[0]).toBe("failed");
  const diagram = screen.getByTestId("diagram"); expect(diagram.getAttribute("data-expanded")).toBe("flow");
  expect(diagram.getAttribute("data-highlight-nodes")).toContain("root"); expect(diagram.getAttribute("data-camera")).toContain("root");
  expect(diagram.getAttribute("data-camera")?.split(" ")).toContain("flow");
  expect(diagram.getAttribute("data-highlight-edges")).not.toContain("design");
  expect(screen.getByTestId("edge-labels").textContent).toContain("recorded-read");
  fireEvent.click(screen.getByRole("button", { name: "What it affected" }));
  expect(source.explain).toHaveBeenCalledTimes(1); expect(diagram.getAttribute("data-highlight-nodes")).toContain("other");
});

it("selects a healthy item without running analysis until explicitly asked", async () => {
  const source = port(); render(<GroupedFlowInvestigation definition={definition} observation={observation} port={source} />);
  fireEvent.click(screen.getByRole("button", { name: "Select Load" })); expect(source.explain).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Investigate selected item" })); await waitFor(() => expect(source.explain).toHaveBeenCalledExactlyOnceWith("root", expect.anything()));
});

it("cancels a prior selection and refuses its late result", async () => {
  const old = deferred<InvestigationResult>(); const explain = vi.fn<InvestigationPort["explain"]>().mockImplementationOnce(() => old.promise).mockImplementationOnce(async () => ({ ...result, nodeId: "other", rootCause: "other", path: ["other"], backward: undefined, impact: { nodes: [], edges: [], confidence: "complete", gaps: [] } }));
  render(<GroupedFlowInvestigation definition={definition} observation={observation} port={port(explain)} />);
  selectFailure(); await waitFor(() => expect(explain).toHaveBeenCalledTimes(1)); const signal = explain.mock.calls[0]![1].signal;
  fireEvent.click(screen.getAllByRole("button", { name: "Select Save" })[1]!); await screen.findByText("Supported root cause");
  expect(signal.aborted).toBe(true); await act(async () => old.resolve(result)); expect(screen.getByTestId("diagram").getAttribute("data-selected")).toBe("other");
  expect(screen.getByTestId("diagram").getAttribute("data-highlight-nodes")).not.toContain("root");
});

it("removes an old run's query, selection and highlights when its binding changes", async () => {
  const old = deferred<InvestigationResult>(); const a = port(vi.fn(() => old.promise)); const { rerender } = render(<GroupedFlowInvestigation definition={definition} observation={observation} port={a} />);
  selectFailure(); await waitFor(() => expect(a.explain).toHaveBeenCalledTimes(1)); const signal = vi.mocked(a.explain).mock.calls[0]![1].signal;
  const b = port(); rerender(<GroupedFlowInvestigation definition={definition} observation={observation} port={b} />); expect(signal.aborted).toBe(true);
  await act(async () => old.resolve(result)); expect(b.explain).not.toHaveBeenCalled(); expect(screen.getByTestId("diagram").getAttribute("data-selected")).toBe("");
  expect(screen.queryByText("Supported root cause")).toBeNull();
});

it("keeps an unmapped cause in the text but never substitutes a same-name diagram node", async () => {
  const explained = { ...result, rootCause: "outside", path: ["failed", "outside"], backward: { nodes: ["failed", "outside"], edges: [{ ...edge, to: "outside" }], confidence: "complete" as const, gaps: [] } };
  render(<GroupedFlowInvestigation definition={definition} observation={observation} port={port(vi.fn(async () => explained))} />);
  selectFailure(); await screen.findByText("Supported root cause"); expect(screen.getByText(/1 recorded item is not shown in this diagram/)).toBeTruthy();
  expect(screen.getByTestId("diagram").getAttribute("data-highlight-nodes")).not.toContain("root");
  expect(screen.getByTestId("edge-labels").textContent).not.toContain("recorded-read");
});

it("keeps unavailable backward relationships distinct from an empty complete result", async () => {
  render(<GroupedFlowInvestigation definition={definition} observation={observation} port={port(vi.fn(async () => ({ ...result, backward: undefined })))} />);
  selectFailure(); await screen.findByText("Supported root cause"); expect(screen.getByText(/Backward connections were not provided/)).toBeTruthy();
  expect(screen.getByTestId("diagram").getAttribute("data-highlight-edges")).toBe("");
});

it("never promotes alternatives to the supported cause", async () => {
  render(<GroupedFlowInvestigation definition={definition} observation={observation} port={port(vi.fn(async () => ({ ...result, rootCause: undefined, path: ["failed"], alternatives: ["root"], backward: { ...result.backward, confidence: "incomplete", gaps: [{ code: "ambiguous", evidence: [] }] } })))} />);
  selectFailure(); await screen.findByText("Root cause unknown"); expect(screen.queryByText("Supported root cause")).toBeNull();
});

it("keeps the supported backward root when only impact coverage is limited", async () => {
  const gap = { code: "edge-limit" as const, evidence: [] };
  const source = port(vi.fn(async () => ({ ...result, confidence: "incomplete" as const, gaps: [gap], impact: { ...result.impact, confidence: "incomplete" as const, gaps: [gap] } })));
  render(<GroupedFlowInvestigation definition={definition} observation={observation} port={source} />);
  selectFailure(); await screen.findByText("Supported root cause");
  fireEvent.click(screen.getByRole("button", { name: "What it affected" }));
  expect(screen.getByText("Supported root cause")).toBeTruthy(); expect(screen.getByText(/Some evidence is missing/)).toBeTruthy();
  expect(source.explain).toHaveBeenCalledTimes(1);
});

it("frames a readable supported root without the whole group on a narrow canvas", async () => {
  const before = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 390 });
  try {
    render(<GroupedFlowInvestigation definition={definition} observation={observation} port={port()} />);
    selectFailure(); await screen.findByText("Supported root cause");
    expect(screen.getByTestId("diagram").getAttribute("data-camera")).toBe("root");
  } finally {
    if (before) Object.defineProperty(HTMLElement.prototype, "clientWidth", before);
    else delete (HTMLElement.prototype as any).clientWidth;
  }
});
