/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CommitBundle, TimeTravelSource } from "foottrace";
import { RecordLens } from "../../src/record/RecordLens";
import { previewValue } from "../../src/record/preview";

afterEach(cleanup);

const write: CommitBundle = {
  stage: "calculate",
  stageId: "calculate",
  runtimeStageId: "calculate#1",
  trace: [{ path: "total", verb: "set" }],
  overwrite: { total: 12 },
  updates: {},
  redactedPaths: [],
};
const source: TimeTravelSource = {
  initialState: { total: 0 },
  commitLog: [write],
};

describe("source-only RecordLens", () => {
  it("renders the canonical selection and emits navigation without running application actions", () => {
    const onStepChange = vi.fn();
    const { rerender } = render(
      <RecordLens
        sourceId="run-a"
        source={source}
        step={0}
        onStepChange={onStepChange}
      />
    );
    expect(
      screen.getByRole("button", { name: "Previous" }).getAttribute("disabled")
    ).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onStepChange).toHaveBeenCalledExactlyOnceWith(1);
    // Controlled: the host must acknowledge the new selection.
    expect(screen.getByRole("combobox", { name: "Step" })).toHaveProperty(
      "value",
      "0"
    );
    rerender(
      <RecordLens
        sourceId="run-a"
        source={source}
        step={1}
        onStepChange={onStepChange}
      />
    );
    expect(screen.getByText("calculate#1 · commits 0–0")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("refuses a bad source-local cursor and lets the host choose a valid one", () => {
    const onStepChange = vi.fn();
    render(
      <RecordLens
        sourceId="other-source"
        source={source}
        step={99}
        onStepChange={onStepChange}
      />
    );
    expect(screen.getByRole("alert").textContent).toContain("not a position");
    expect(screen.queryByText("State at this step")).toBeNull();
    fireEvent.change(screen.getByRole("combobox", { name: "Step" }), {
      target: { value: "1" },
    });
    expect(onStepChange).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("does not reinterpret a literal dotted key as a nested address", () => {
    const onKeyChange = vi.fn();
    render(
      <RecordLens
        sourceId="literal"
        source={{ initialState: { "a.b": 1 } }}
        step={0}
        onKeyChange={onKeyChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Explain a.b" }));
    expect(onKeyChange).toHaveBeenCalledExactlyOnceWith(["a.b"]);
    expect(
      screen.getByText(
        "No recorded steps. Showing the available starting state."
      )
    ).toBeTruthy();
  });

  it("keeps missing read evidence and log-only state visibly qualified", () => {
    render(
      <RecordLens
        sourceId="partial"
        source={{ commitLog: [write] }}
        step={1}
        selectedKey="total"
      />
    );
    expect(screen.getByText(/Starting state not recorded/)).toBeTruthy();
    expect(screen.getByText(/dependencies remain unknown/)).toBeTruthy();
  });

  it("renders redaction and gaps instead of a made-up causal explanation", () => {
    render(
      <RecordLens
        sourceId="redacted"
        source={{ commitLog: [null, { ...write, redactedPaths: ["total"] }] }}
        step={1}
        selectedKey="total"
      />
    );
    expect(screen.getByText(/Some recorded values are redacted/)).toBeTruthy();
    expect(screen.getByText(/Incomplete record/)).toBeTruthy();
    expect(screen.getByText(/contains unreadable rows/)).toBeTruthy();
  });

  it("refreshes an appended record even when its source identity is unchanged", () => {
    const live = { initialState: {}, commitLog: [write] };
    const { rerender } = render(
      <RecordLens sourceId="live" source={live} step={1} />
    );
    live.commitLog.push({
      ...write,
      runtimeStageId: "calculate#2",
      overwrite: { total: 25 },
    });
    rerender(<RecordLens sourceId="live" source={live} step={2} />);
    expect(screen.getByText("25")).toBeTruthy();
  });

  it("shows removed keys in changes, not current state", () => {
    const removal: CommitBundle = {
      ...write,
      trace: [{ path: "draft", verb: "delete" }],
      overwrite: { draft: undefined },
    };
    render(
      <RecordLens
        sourceId="deletion"
        source={{ initialState: { draft: "old" }, commitLog: [removal] }}
        step={1}
      />
    );
    expect(screen.getByText("No keys in the available state.")).toBeTruthy();
    expect(screen.getByText(/"old" → \[absent\]/)).toBeTruthy();
  });
});

describe("bounded display previews, not serialization", () => {
  it("handles cycles and non-JSON values without changing the supplied data", () => {
    const cycle: Record<string, unknown> = { n: 10n, map: new Map([["a", 1]]) };
    cycle.self = cycle;
    expect(previewValue(cycle)).toContain("10n");
    expect(previewValue(cycle)).toContain("Map: 1 entries");
    expect(previewValue(cycle)).toContain("repeated reference");
    expect(cycle.self).toBe(cycle);
    expect(cycle.n).toBe(10n);
  });

  it("bounds large values and reports an unavailable preview without crashing the view", () => {
    expect(previewValue("x".repeat(100_000)).length).toBeLessThan(810);
    expect(
      previewValue({
        get value() {
          throw new Error("no preview");
        },
      })
    ).toContain("[accessor not read]");
  });

  it("does not invoke accessors or toJSON, including values beyond the preview budget", () => {
    const read = vi.fn(() => 42);
    const toJSON = vi.fn(() => "fake value");
    const wide: Record<string, unknown> = { toJSON };
    for (let i = 0; i < 1000; i++)
      Object.defineProperty(wide, `key${i}`, { enumerable: true, get: read });
    const preview = previewValue(wide);
    expect(preview).toContain("[accessor not read]");
    expect(preview).toContain("…");
    expect(read).not.toHaveBeenCalled();
    expect(toJSON).not.toHaveBeenCalled();
  });

  it("labels dates and unsupported opaque values without pretending they are empty data", () => {
    expect(previewValue(new Date(0))).toBe("Date(1970-01-01T00:00:00.000Z)");
    expect(previewValue(new Date(Number.NaN))).toBe("[Invalid Date]");
    expect(previewValue(new WeakMap())).toBe("[Object preview unavailable]");
  });
});
