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
function followChild(key: string, mount: string) {
  fireEvent.click(within(card()).getByRole("button", { name: `Follow child source ${key} in ${mount}` }));
}
function activeTick() {
  return [...screen.getByRole("toolbar").querySelectorAll('[data-fp="tt-tick"]')]
    .findIndex(tick => tick.getAttribute("data-active") === "true");
}

describe("recorded output handoff navigation", () => {
  it.each([
    ["child#2", "child/inner#4", 2],
    ["child#9", "child/inner#11", 4],
  ])("follows %s through the exact nested visit and keeps each cursor rail local", (mount, inner, expected) => {
    setup(String(mount));
    expect(card().textContent).toContain("subflow boundary:");
    expect(card().textContent).toContain("conservative prefix");
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("Tracing renamed");
    fireEvent.click(within(card()).getByRole("button", { name: `Follow child source middleOutput in ${mount}` }));
    expect(card().textContent).toContain(`Tracing subflow invocation ${mount}.`);
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("Tracing middleOutput");
    fireEvent.click(within(card()).getByRole("button", { name: `Follow child source localOutput in ${inner}` }));
    expect(card().textContent).toContain(`${mount} → ${inner}`);
    expect(card().textContent).toContain(`= ${expected}`);
    expect(card().textContent).toContain("recorded at invocation start; earlier origin unknown");
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("Tracing localOutput");
    expect(screen.getByRole("toolbar").querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Earlier recorded step" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Later recorded step" }).hasAttribute("disabled")).toBe(true);
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
    expect(writeText.mock.calls[0][0]).toContain("subflow boundary:");
    expect(writeText.mock.calls[0][0]).not.toContain("BEFORE the run");
  });

  it.each(["absent", "partial", "wrong-address"])("leaves %s handoffs as honest boundaries", problem => {
    setup("child#2", snapshot => {
      const result = snapshot.subflowResults["child#2"];
      if (problem === "absent") delete result.outputHandoff;
      if (problem === "partial") result.outputHandoff.status = "partial";
      if (problem === "wrong-address") result.outputHandoff.child.address.drillPath = ["child#9"];
    });
    expect(card().textContent).toContain("subflow boundary:");
    expect(card().textContent).not.toContain("this is an origin");
    expect(document.querySelector('[data-fp="twc-handoff-source"]')).toBeNull();
  });

  it("removes a source link when a fresh same-run snapshot withdraws its metadata", () => {
    const ui = setup("child#2");
    expect(screen.getByRole("button", { name: "Follow child source middleOutput in child#2" })).toBeTruthy();
    const next = structuredClone(ui.snapshot);
    delete next.subflowResults["child#2"].outputHandoff;
    ui.replace(next);
    expect(card().textContent).toContain("subflow boundary:");
    expect(document.querySelector('[data-fp="twc-handoff-source"]')).toBeNull();
  });

  it("keeps a nested investigation trail and restores the exact repeated parent visit after a same-run refresh", () => {
    const ui = setup("child#9");
    const rootCursor = activeTick();
    const rootStops = screen.getByRole("toolbar").querySelectorAll('[data-fp="tt-tick"]').length;
    followChild("middleOutput", "child#9");
    const childCursor = activeTick();
    followChild("localOutput", "child/inner#11");
    expect(screen.getByRole("navigation", { name: "Investigation trail" }).textContent).toContain("renamed›middleOutput›localOutput");

    ui.replace(structuredClone(ui.snapshot));
    fireEvent.click(within(card()).getByRole("button", { name: "Return to middleOutput in child#9" }));
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("Tracing middleOutput");
    expect(activeTick()).toBe(childCursor);
    expect(card().textContent).toContain("Tracing subflow invocation child#9.");
    expect(card().textContent).not.toContain("child#2");

    fireEvent.click(within(card()).getByRole("button", { name: "Return to renamed in root" }));
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("Tracing renamed");
    expect(activeTick()).toBe(rootCursor);
    expect(screen.getByRole("toolbar").querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(rootStops);
    expect(card().textContent).toContain("wrote renamed = 4");
    expect(within(card()).getByRole("button", { name: "Follow child source middleOutput in child#9" })).toBeTruthy();
  });

  it.each(["handoff-withdrawn", "history-revised", "new-run"])("does not restore invalid saved references after %s", change => {
    const ui = setup("child#9");
    followChild("middleOutput", "child#9");
    followChild("localOutput", "child/inner#11");
    const next = structuredClone(ui.snapshot);
    if (change === "handoff-withdrawn") delete next.subflowResults["child#9"].outputHandoff;
    if (change === "history-revised") {
      const handoff = next.subflowResults["child#9"].outputHandoff;
      next.commitLog[handoff.parent.commitIdx].trace = [];
    }
    if (change === "new-run") next.runId = "another-recording";
    ui.replace(next);
    expect(screen.queryByRole("navigation", { name: "Investigation trail" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Return to renamed in root" })).toBeNull();
    if (change === "new-run") expect(document.querySelector('[data-fp="trace-walk-card"]')).toBeNull();
  });
});
