/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup } from "@testing-library/react";
import { KeyedRecorderView } from "../../src/components/ExplainableShell/_internal/KeyedRecorderView";
import type { StageSnapshot } from "../../src/types";

afterEach(cleanup);
const snapshot = (runtimeStageId: string): StageSnapshot => ({ runtimeStageId, stageName: runtimeStageId,
  stageLabel: runtimeStageId.split("/").at(-1)!, memory: {}, narrative: "", startMs: 0, durationMs: 0 });
const child = [snapshot("first/clean#2"), snapshot("first/scale#3"), snapshot("first/sum#4")];
const data = { numericField: "readCount", grandTotal: 13, steps: {
  "seed#0": { stageName: "Seed", readCount: 10, duration: 100 },
  "first/clean#2": { stageName: "Clean", readCount: 1, writeCount: 0, duration: 0.125, commitCount: 1 },
  "first/scale#3": { stageName: "Scale", readCount: 1, writeCount: 2, duration: 0.25, commitCount: 1 },
  "first/sum#4": { stageName: "Sum", readCount: 1, writeCount: 1, duration: 0.375, commitCount: 1 },
} };

function summaryCells(name: string) {
  const table = screen.getByRole("table", { name: "Metrics summary" });
  return within(within(table).getByRole("row", { name: new RegExp(`^${name} `) })).getAllByRole("cell").map(cell => cell.textContent);
}

describe("KeyedRecorderView", () => {
  it("shows selected, through-cursor and current-child totals with counts and milliseconds", () => {
    render(<KeyedRecorderView data={data} snapshots={child} selectedIndex={1} presentation="metrics" scopeLabel="First quote" />);
    expect(screen.getByText(/First quote · Step 2 of 3/)).toBeTruthy();
    expect(summaryCells("Reads")).toEqual(["1", "2", "3"]);
    expect(summaryCells("Writes")).toEqual(["2", "2", "3"]);
    expect(summaryCells("Duration \\(ms\\)")).toEqual(["0.25", "0.375", "0.75"]);
    expect(screen.getByText(/recorded stage time, not elapsed runtime/)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    const details = screen.getByRole("table", { name: "Recorded visit metrics" });
    expect(within(details).getAllByRole("row")).toHaveLength(3);
    expect(within(details).queryByText("Seed")).toBeNull();
    expect(within(details).queryByText("Sum")).toBeNull();
    expect(details.querySelector('[aria-current="step"]')?.textContent).toContain("Scale");
    expect(screen.queryByText("13")).toBeNull();
  });

  it("keeps recorded zero distinct from missing, string and non-finite metrics", () => {
    const invalid = { numericField: "readCount", steps: {
      "one#1": { stageName: "One", readCount: 0, writeCount: "4", durationMs: Number.NaN, commitCount: Number.POSITIVE_INFINITY },
    } };
    render(<KeyedRecorderView data={invalid} snapshots={[snapshot("one#1")]} selectedIndex={0} presentation="metrics" />);
    expect(summaryCells("Reads")).toEqual(["0", "0", "0"]);
    expect(summaryCells("Writes")).toEqual(["—", "—", "—"]);
    expect(summaryCells("Duration \\(ms\\)")).toEqual(["—", "—", "—"]);
    expect(summaryCells("Commits")).toEqual(["—", "—", "—"]);
    expect(screen.queryByText("0.000")).toBeNull();
    expect(screen.queryByText("NaN")).toBeNull();
    expect(screen.queryByText("Infinity")).toBeNull();
  });

  it("shows only recorded fields and does not invent timing for a custom recorder", () => {
    const custom = { numericField: "confidence", steps: { "one#1": { stageName: "One", confidence: 0.8 } } };
    render(<KeyedRecorderView data={custom} snapshots={[snapshot("one#1")]} selectedIndex={0} />);
    expect(screen.getByText("Total through this step · Confidence")).toBeTruthy();
    expect(screen.queryByText(/Duration/)).toBeNull();
    expect(screen.queryByText("Reads")).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Confidence" })).toBeTruthy();
  });

  it("does not assume a unit for a custom recorder's generic duration field", () => {
    render(<KeyedRecorderView data={{ numericField: "duration", steps: { "one#1": { duration: 2 } } }}
      snapshots={[snapshot("one#1")]} selectedIndex={0} />);
    expect(screen.getByRole("columnheader", { name: "Duration" })).toBeTruthy();
    expect(screen.queryByText(/\(ms\)/)).toBeNull();
  });

  it("keeps the generic total button while making its total local to the child flow", () => {
    render(<KeyedRecorderView data={data} snapshots={child} selectedIndex={2} preferredOperation="aggregate" scopeLabel="First quote" />);
    fireEvent.click(screen.getByRole("button", { name: "Show flow total" }));
    expect(screen.getByText("Flow total · Reads")).toBeTruthy();
    expect(screen.getByText("3", { selector: "strong span" })).toBeTruthy();
    expect(screen.queryByText("13")).toBeNull();
    expect(screen.queryByText(/Aggregate|Accumulate|Translate/)).toBeNull();
  });

  it("does not assign ambiguous visits or stage-name aggregates to the selected step", () => {
    const legacy = { numericField: "readCount", stages: { Repeat: { readCount: 13 } } };
    render(<KeyedRecorderView data={legacy} snapshots={[
      { ...snapshot("repeat#1"), stageName: "Repeat" }, { ...snapshot("repeat#2"), stageName: "Repeat" },
    ]} selectedIndex={1} presentation="metrics" />);
    expect(screen.getByText(/Entire recorder output/)).toBeTruthy();
    expect(screen.getByText(/Selected-step and flow totals are unavailable/)).toBeTruthy();
    expect(screen.getByRole("table", { name: "Legacy stage totals" })).toBeTruthy();
    expect(screen.getByText("13")).toBeTruthy();
    expect(screen.queryByRole("table", { name: "Metrics summary" })).toBeNull();
    expect(screen.queryByRole("table", { name: "Recorded visit metrics" })).toBeNull();
  });

  it("keeps a locally unique legacy name unscoped and unavailable numbers safe", () => {
    render(<KeyedRecorderView data={{ numericField: "readCount", stages: {
      Normalize: { readCount: "10", writeCount: 1 },
    } }} snapshots={[{ ...snapshot("child/normalize#2"), stageName: "Normalize" }]} selectedIndex={0} presentation="metrics" />);
    const table = screen.getByRole("table", { name: "Legacy stage totals" });
    const row = within(table).getByRole("row", { name: /^Normalize / });
    expect(within(row).getAllByRole("cell").map(cell => cell.textContent)).toEqual(["—", "1"]);
    expect(screen.queryByRole("table", { name: "Metrics summary" })).toBeNull();
  });

  it("preserves semantic content and removes built-in styles in unstyled mode", () => {
    const { container } = render(<KeyedRecorderView data={data} snapshots={child} selectedIndex={1}
      presentation="metrics" scopeLabel="First quote" unstyled className="consumer-metrics" />);
    expect(summaryCells("Reads")).toEqual(["1", "2", "3"]);
    expect(container.querySelector("[style]")).toBeNull();
    expect(container.querySelector(".consumer-metrics")).toBeTruthy();
  });

  it("preserves generic non-keyed output and explains unavailable built-in metrics", () => {
    const { rerender } = render(<KeyedRecorderView data={{ note: "Recorded custom output" }} snapshots={child} selectedIndex={0} unstyled />);
    expect(screen.getByText(/Recorded custom output/)).toBeTruthy();
    rerender(<KeyedRecorderView data={{ note: "Recorded custom output" }} snapshots={child} selectedIndex={0} presentation="metrics" unstyled />);
    expect(screen.getByText(/no readable per-visit numeric table/)).toBeTruthy();
    expect(screen.queryByText(/Recorded custom output/)).toBeNull();
  });
});
