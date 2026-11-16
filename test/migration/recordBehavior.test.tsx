/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TraceWalkCard } from "../../src/components/DataTracePanel/TraceWalkCard";
import { DataTracePanel } from "../../src/components/DataTracePanel/DataTracePanel";
import {
  buildTraceWalk,
  formatTraceWalk,
} from "../../src/components/ExplainableShell/_internal/traceWalk";
import { buildDataTrace } from "../../src/components/ExplainableShell/_internal/dataTrace";
import fork from "./fixtures/causal-phases/runtime-snapshot-10.0.0.json";

const key = "runs\u001fa\u001fy";
const stepOf = (id: string) => {
  const index = fork.commitLog.findIndex((row) => row.runtimeStageId === id);
  return index < 0 ? null : index + 1;
};

describe("M1 — real saved Flow display interactions", () => {
  it("withholds an ambiguous legacy nested ingredient while preserving itinerary callbacks", () => {
    const onFollowIngredient = vi.fn();
    const onJumpToStop = vi.fn();
    const walk = buildTraceWalk(fork.commitLog, fork.executionTree, key, {
      beforeCommitIdx: 2,
    });
    const { container } = render(
      <TraceWalkCard
        walk={walk}
        cursorRuntimeStageId="a#1"
        stepNumberOf={stepOf}
        onFollowIngredient={onFollowIngredient}
        onJumpToStop={onJumpToStop}
      />
    );
    expect(screen.getByText(/stop 1 of 1/i)).toBeTruthy();
    const ingredient = container.querySelector('[data-fp="twc-ingredient"]') as HTMLButtonElement;
    expect(ingredient.disabled).toBe(true);
    expect(ingredient.textContent).toContain("legacy read address is unknown; source unknown");
    fireEvent.click(ingredient);
    expect(onFollowIngredient).not.toHaveBeenCalled();
    const rows = container.querySelectorAll('[data-fp="twc-itinerary-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].getAttribute("data-current")).toBe("true");
    fireEvent.click(rows[0]);
    expect(onJumpToStop).toHaveBeenCalledExactlyOnceWith("a#1");
    // Controlled selection: callbacks do not move the owner's cursor.
    expect(rows[0].getAttribute("data-current")).toBe("true");
  });

  it("copies the same projected story it displays, while R2 tracks the separate address defect", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const walk = buildTraceWalk(fork.commitLog, fork.executionTree, key, {
      beforeCommitIdx: 2,
    });
    render(
      <TraceWalkCard
        walk={walk}
        cursorRuntimeStageId="a#1"
        stepNumberOf={stepOf}
      />
    );
    fireEvent.click(screen.getByText("Copy story"));
    expect(writeText).toHaveBeenCalledExactlyOnceWith(
      formatTraceWalk(walk, stepOf)
    );
    expect(screen.getByText(/Recorded state reads \(1\)/)).toBeTruthy();
  });

  it("keeps the current Data Trace navigation contract and no-reads qualification", () => {
    const onFrameClick = vi.fn();
    // Source prefix is an actual saved prefix, not a synthetic tree or log.
    const frames = buildDataTrace(
      fork.commitLog.slice(0, 2),
      fork.executionTree,
      "a#1"
    ).frames;
    const { container, rerender } = render(
      <DataTracePanel
        frames={frames}
        selectedStageId="a#1"
        onFrameClick={onFrameClick}
        fromStageName="A"
      />
    );
    const buttons = container.querySelectorAll('[data-fp="data-trace-frame"]');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].getAttribute("data-selected")).toBe("true");
    fireEvent.click(buttons[0]);
    expect(onFrameClick).toHaveBeenCalledExactlyOnceWith("a#1");
    // Prefix coverage remains present; its legacy names still omit scope addresses.
    expect(buildDataTrace(fork.commitLog.slice(0, 2), undefined, "a#1").readsAvailable).toBe(true);
    // Withhold both read-evidence sources for the unknown-coverage case.
    const withoutReadEvidence = fork.commitLog.slice(0, 2).map(commit => ({ ...commit,
      trace: commit.trace.map(write => ({ path: write.path })),
    }));
    const noReads = buildDataTrace(
      withoutReadEvidence,
      undefined,
      "a#1"
    );
    expect(noReads.readsAvailable).toBe(false);
    rerender(
      <DataTracePanel
        frames={noReads.frames}
        note="Reads were not recorded; dependencies are unknown."
      />
    );
    expect(
      screen.getByText("Reads were not recorded; dependencies are unknown.")
    ).toBeTruthy();
  });
});
