/** @vitest-environment jsdom */
import * as React from "react";
import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import { toVisualizationSnapshots } from "../../src/adapters/fromRuntimeSnapshot";

// Untouched output from the source-engine candidate, including two visits of
// one mount and a nested output rename. No synthetic causal edges are added.
const recording = JSON.parse(readFileSync("test/fixtures/subflow-handoff/recording.json", "utf8"));
type Props = React.ComponentProps<typeof ExplainableShell>;
function setup(mount: string, change?: (snapshot: typeof recording.runtimeSnapshot) => void) {
  const snapshot = structuredClone(recording.runtimeSnapshot);
  change?.(snapshot);
  const snapshots = toVisualizationSnapshots(snapshot);
  const index = snapshots.findIndex(stage => stage.runtimeStageId === mount);
  expect(index).toBeGreaterThanOrEqual(0);
  const props: Props = { runtimeSnapshot: snapshot, renderFlowchart: () => React.createElement("div") };
  const view = render(React.createElement(ExplainableShell, props));
  fireEvent.click(screen.getByText("Inspector"));
  fireEvent.click(screen.getByText("Data Trace"));
  for (let at = 0; at < index; at++) fireEvent.click(screen.getByLabelText("Next stage"));
  const entry = [...document.querySelectorAll('[data-fp="trace-any-chip"]')].find(element => element.textContent === "renamed");
  expect(entry).toBeTruthy();
  fireEvent.click(entry!);
  return { snapshot, replace: (next: typeof snapshot) => view.rerender(React.createElement(ExplainableShell, { ...props, runtimeSnapshot: next })) };
}
function card() { return document.querySelector('[data-fp="trace-walk-card"]') as HTMLElement; }

describe("recorded output handoff navigation", () => {
  it.each([
    ["child#2", "child/inner#4", 2],
    ["child#9", "child/inner#11", 4],
  ])("follows %s through the exact nested visit and keeps each cursor rail local", (mount, inner, expected) => {
    setup(String(mount));
    expect(card().textContent).toContain("computed inside");
    expect(card().textContent).toContain("conservative prefix");
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("Tracing renamed");
    fireEvent.click(screen.getByRole("button", { name: `Follow child source middleOutput in ${mount}` }));
    expect(card().textContent).toContain(`Tracing subflow invocation ${mount}.`);
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("Tracing middleOutput");
    fireEvent.click(screen.getByRole("button", { name: `Follow child source localOutput in ${inner}` }));
    expect(card().textContent).toContain(`${mount} → ${inner}`);
    expect(card().textContent).toContain(`= ${expected}`);
    expect(card().textContent).toContain("recorded at invocation start; earlier origin unknown");
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("Tracing localOutput");
    expect(screen.getByRole("toolbar").querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Earlier cause" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Toward result" }).hasAttribute("disabled")).toBe(true);
    expect(document.querySelector('[data-fp="twc-handoff-source"]')).toBeNull();
  });

  it("copies the same qualified source evidence displayed at the boundary", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    setup("child#2");
    const sentence = card().querySelector('[data-fp="twc-handoff"] > div')?.textContent;
    await act(async () => { fireEvent.click(within(card()).getByText("Copy story")); });
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0][0]).toContain(sentence);
    expect(writeText.mock.calls[0][0]).toContain("computed inside");
    expect(writeText.mock.calls[0][0]).not.toContain("BEFORE the run");
  });

  it.each(["absent", "partial", "wrong-address"])("leaves %s handoffs as honest boundaries", problem => {
    setup("child#2", snapshot => {
      const result = snapshot.subflowResults["child#2"];
      if (problem === "absent") delete result.outputHandoff;
      if (problem === "partial") result.outputHandoff.status = "partial";
      if (problem === "wrong-address") result.outputHandoff.child.address.drillPath = ["child#9"];
    });
    expect(card().textContent).toContain("computed inside");
    expect(card().textContent).not.toContain("this is an origin");
    expect(document.querySelector('[data-fp="twc-handoff-source"]')).toBeNull();
  });

  it("removes a source link when a fresh same-run snapshot withdraws its metadata", () => {
    const ui = setup("child#2");
    expect(screen.getByRole("button", { name: "Follow child source middleOutput in child#2" })).toBeTruthy();
    const next = structuredClone(ui.snapshot);
    delete next.subflowResults["child#2"].outputHandoff;
    ui.replace(next);
    expect(card().textContent).toContain("computed inside");
    expect(document.querySelector('[data-fp="twc-handoff-source"]')).toBeNull();
  });
});
