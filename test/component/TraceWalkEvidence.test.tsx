/** @vitest-environment jsdom */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TraceWalkCard } from "../../src/components/DataTracePanel/TraceWalkCard";
import { buildSelectedTraceWalk, buildTraceWalk, formatTraceWalk, traceContributionPreview, type TraceWalk } from "../../src/components/ExplainableShell/_internal/traceWalk";
import type { FlowRecordSelection } from "../../src/adapters/recordInput";

const row = (id: string, path: string, value: unknown) => ({ stage: id, stageId: id, runtimeStageId: id,
  overwrite: { [path]: value }, updates: {}, redactedPaths: [], trace: [{ path, verb: "set" }] });
const walk = () => buildTraceWalk([row("a#0", "x", 2), row("b#1", "out", 3)], { runtimeStageId: "b#1", stageReads: { x: 2, external: 1 } }, "out");
const step = (id: string) => id === "a#0" ? 1 : 2;

describe.each([false, true])("M5 card evidence (unstyled=%s)", unstyled => {
  it("previews the frozen displayed anchor when the cursor is off-walk", () => {
    const source: FlowRecordSelection = { sourceId: "record", format: "snapshot", record: {
      commitLog: [row("a#0", "x", 2), row("b#1", "out", 3), row("off#2", "out", 99)],
      executionTree: { runtimeStageId: "b#1", stageReads: { x: 2 } },
    }, reads: { status: "unknown" } };
    const query = buildSelectedTraceWalk(source, "out", { beforeCommitIdx: 2 });
    const { container } = render(<TraceWalkCard walk={query} cursorRuntimeStageId="off#2" stepNumberOf={step}
      previewValueOf={key => traceContributionPreview(source, query, query.stops[0], key)} unstyled={unstyled} />);
    expect(container.textContent).toContain("out = 3");
    expect(container.textContent).not.toContain("= 99");
  });
  it("shares incomplete/truncated/unknown-origin facts with Copy story without an origin claim", async () => {
    const query = walk();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { container } = render(<TraceWalkCard walk={query} cursorRuntimeStageId={null} stepNumberOf={step} unstyled={unstyled} />);
    expect(container.textContent).toContain("origin unknown");
    expect(container.textContent).toContain(query.note);
    expect(container.textContent).not.toContain("run input");
    await act(async () => fireEvent.click(screen.getByText("Copy story")));
    expect(writeText).toHaveBeenCalledWith(formatTraceWalk(query, step));
    const limited = buildTraceWalk([row("a#0", "x", 2), row("b#1", "out", 3)], { runtimeStageId: "b#1", stageReads: { x: 2 } }, "out", { maxDepth: 0 });
    const second = render(<TraceWalkCard walk={limited} cursorRuntimeStageId={null} stepNumberOf={step} unstyled={unstyled} />);
    expect(second.container.textContent).toContain("depth limit");
    expect(formatTraceWalk(limited, step)).toContain("depth limit");
  });
  it("does not label a first-key preview as the value of two contributed keys", () => {
    const query: TraceWalk = { ...walk(), stops: [{ ...walk().stops[0], contributedKeys: ["x", "y"],
      contributedWrites: [{ key: "x", commitIdx: 1 }, { key: "y", commitIdx: 3 }], readCommitIdx: 1 }] };
    const { container } = render(<TraceWalkCard walk={query} cursorRuntimeStageId={null} stepNumberOf={step} previewValueOf={() => 2} unstyled={unstyled} />);
    expect(container.textContent).toContain("x, y · preview x = 2");
    expect(container.textContent).toContain("x at row 1, y at row 3");
    expect(formatTraceWalk(query, step)).toContain("x at row 1, y at row 3");
  });
  it("suppresses ambiguous same-key values and explains the different recorded rows in card and copy", () => {
    const query: TraceWalk = { ...walk(), stops: [{ ...walk().stops[0], contributedKeys: ["x"],
      contributedWrites: [{ key: "x", commitIdx: 1 }, { key: "x", commitIdx: 3 }], readCommitIdx: 1 }] };
    const preview = vi.fn(() => 9);
    const { container } = render(<TraceWalkCard walk={query} cursorRuntimeStageId={null} stepNumberOf={step} previewValueOf={preview} unstyled={unstyled} />);
    expect(preview).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Multiple recorded writer rows contribute x");
    expect(container.textContent).not.toContain("= 9");
    expect(formatTraceWalk(query, step)).toContain("x at row 1, x at row 3");
  });
  it.each(["deleted", "redacted", "from-initial-state"] as const)("makes %s basis visible, never an exact value", basis => {
    const query: TraceWalk = { ...walk(), stops: [{ ...walk().stops[0], contributedWrites: [{ key: "out", commitIdx: 1, valueBasis: [basis] }] }] };
    const preview = vi.fn(() => 42);
    const { container } = render(<TraceWalkCard walk={query} cursorRuntimeStageId={null} stepNumberOf={step} previewValueOf={preview} unstyled={unstyled} />);
    expect(preview).not.toHaveBeenCalled();
    expect(container.textContent).toContain(`out (${basis})`);
    expect(formatTraceWalk(query, step)).toContain(`out (${basis})`);
    expect(container.textContent).not.toContain("= 42");
  });
  it("contains throwing optional previews while keeping navigation and copy functional", async () => {
    const onJump = vi.fn(), writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const query = walk();
    const { container } = render(<TraceWalkCard walk={query} cursorRuntimeStageId={null} stepNumberOf={step} previewValueOf={() => { throw new Error("host preview unavailable"); }} onJumpToStop={onJump} unstyled={unstyled} />);
    fireEvent.click(container.querySelectorAll('[data-fp="twc-itinerary-row"]')[1]);
    expect(onJump).toHaveBeenCalledWith("a#0");
    await act(async () => fireEvent.click(screen.getByText("Copy story")));
    expect(writeText).toHaveBeenCalledWith(formatTraceWalk(query, step));
  });
});

describe("M5 bounded preview and asynchronous clipboard", () => {
  it.each([[new Map([["x", 1]]), "[Map: 1 entries]"], [new Set([1]), "[Set: 1 entries]"], [12n, "12n"], [new Date("2020-01-01T00:00:00Z"), "Date(2020-01-01T00:00:00.000Z)"]])("bounds non-JSON preview %s", (value, text) => {
    const { container } = render(<TraceWalkCard walk={walk()} cursorRuntimeStageId={null} stepNumberOf={step} previewValueOf={() => value} />);
    expect(container.textContent).toContain(text);
  });
  it("never executes payload getters/toJSON and safely bounds cycles", () => {
    const getter = vi.fn(() => "secret"), toJSON = vi.fn(() => "secret");
    const value: Record<string, unknown> = { toJSON }; value.self = value;
    Object.defineProperty(value, "private", { enumerable: true, get: getter });
    const { container } = render(<TraceWalkCard walk={walk()} cursorRuntimeStageId={null} stepNumberOf={step} previewValueOf={() => value} />);
    expect(container.textContent).not.toContain("secret");
    expect(getter).not.toHaveBeenCalled(); expect(toJSON).not.toHaveBeenCalled();
  });
  it("ignores completion for the replaced walk, including when the clipboard resolves later", async () => {
    let resolve!: () => void;
    const writeText = vi.fn(() => new Promise<void>(done => { resolve = done; }));
    Object.assign(navigator, { clipboard: { writeText } });
    const first = walk();
    const { rerender } = render(<TraceWalkCard walk={first} cursorRuntimeStageId={null} stepNumberOf={step} />);
    fireEvent.click(screen.getByText("Copy story"));
    rerender(<TraceWalkCard walk={walk()} cursorRuntimeStageId={null} stepNumberOf={step} />);
    await act(async () => resolve());
    expect(screen.queryByText("Copied ✓")).toBeNull();
    expect(screen.getByText("Copy story")).toBeTruthy();
  });
  it("handles clipboard rejection and allows an honest retry", async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error("denied")).mockResolvedValueOnce(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<TraceWalkCard walk={walk()} cursorRuntimeStageId={null} stepNumberOf={step} />);
    await act(async () => fireEvent.click(screen.getByText("Copy story")));
    expect(screen.getByRole("status").textContent).toContain("Copy failed");
    await act(async () => fireEvent.click(screen.getByText("Copy story")));
    expect(screen.getByText("Copied ✓")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
