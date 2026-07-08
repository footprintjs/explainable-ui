/** @vitest-environment jsdom */
/**
 * TraceWalkCard — the "WHY THIS VALUE" stop card.
 *
 * What is being pinned:
 * 1. Fork honesty: a 2-ingredient stop renders BOTH chips (colored,
 *    followable); following fires the re-anchor callback with the
 *    ingredient — the card never picks silently.
 * 2. Honest absence: both truthful sentences render as full cards.
 * 3. Termini are flagged run-inputs and NOT followable (no invented source).
 * 4. [Copy story] emits formatTraceWalk's exact string (LLM parity).
 * 5. The itinerary highlights the ONE cursor's stop; rows jump it.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

import { TraceWalkCard } from "../../src/components/DataTracePanel/TraceWalkCard";
import {
  buildTraceWalk,
  formatTraceWalk,
} from "../../src/components/ExplainableShell/_internal/traceWalk";

// Same diamond as traceWalk.test — total ← {tax ← {rate, subtotal}, subtotal}.
const commit = (stage: string, rsid: string, writes: string[]) => ({
  stage,
  stageId: stage.toLowerCase(),
  runtimeStageId: rsid,
  trace: writes.map((path) => ({ path })),
});
const LOG = [
  commit("Seed", "seed#0", ["rate", "items"]),
  commit("Sum", "sum#1", ["subtotal"]),
  commit("Audit", "audit#2", ["auditNote"]),
  commit("ApplyTax", "applyTax#3", ["tax"]),
  commit("ComputeTotal", "computeTotal#4", ["total"]),
];
const TREE = (() => {
  const nodes = [
    { runtimeStageId: "seed#0", stageReads: { config: 1 } },
    { runtimeStageId: "sum#1", stageReads: { items: 1 } },
    { runtimeStageId: "audit#2", stageReads: { subtotal: 1 } },
    { runtimeStageId: "applyTax#3", stageReads: { rate: 1, subtotal: 1 } },
    { runtimeStageId: "computeTotal#4", stageReads: { subtotal: 1, tax: 1 } },
  ];
  for (let i = 0; i < nodes.length - 1; i++) (nodes[i] as Record<string, unknown>).next = nodes[i + 1];
  return nodes[0];
})();

const stepOf = (rsid: string) => {
  const i = LOG.findIndex((c) => c.runtimeStageId === rsid);
  return i >= 0 ? i + 1 : null;
};

const WALK = buildTraceWalk(LOG, TREE, "total");

describe("TraceWalkCard", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("renders the fork stop with BOTH ingredient chips, followable", () => {
    const onFollow = vi.fn();
    render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="applyTax#3"
        stepNumberOf={stepOf}
        onFollowIngredient={onFollow}
      />,
    );
    expect(screen.getByText(/stop 2 of 4/i)).toBeTruthy();
    expect(screen.getByText(/Made from 2 ingredients/)).toBeTruthy();
    const chips = screen.getAllByTitle(/Follow /);
    expect(chips).toHaveLength(2);
    fireEvent.click(chips.find((c) => c.textContent?.includes("subtotal"))!);
    expect(onFollow).toHaveBeenCalledWith(
      expect.objectContaining({ key: "subtotal", writerRuntimeStageId: "sum#1" }),
    );
  });

  it("flags run-input termini and refuses to follow them", () => {
    render(
      <TraceWalkCard walk={WALK} cursorRuntimeStageId="seed#0" stepNumberOf={stepOf} onFollowIngredient={vi.fn()} />,
    );
    const terminus = screen.getByTitle(/never written — it came in with the run's inputs/);
    expect(terminus.textContent).toContain("config");
    expect((terminus as HTMLButtonElement).disabled).toBe(true);
  });

  it("highlights the cursor's row in the itinerary and jumps on row click", () => {
    const onJump = vi.fn();
    const { container } = render(
      <TraceWalkCard walk={WALK} cursorRuntimeStageId="applyTax#3" stepNumberOf={stepOf} onJumpToStop={onJump} />,
    );
    const rows = container.querySelectorAll('[data-fp="twc-itinerary-row"]');
    expect(rows).toHaveLength(4);
    expect(rows[1].getAttribute("data-current")).toBe("true");
    fireEvent.click(rows[3]);
    expect(onJump).toHaveBeenCalledWith("seed#0");
  });

  it("marks fork rows in the itinerary (⑂ badge)", () => {
    const { container } = render(
      <TraceWalkCard walk={WALK} cursorRuntimeStageId="computeTotal#4" stepNumberOf={stepOf} />,
    );
    const forkRow = [...container.querySelectorAll('[data-fp="twc-itinerary-row"]')].find((r) =>
      r.textContent?.includes("ApplyTax"),
    )!;
    expect(forkRow.textContent).toContain("⑂ 2");
  });

  it("[Copy story] writes formatTraceWalk's exact string — the parity artifact", async () => {
    render(<TraceWalkCard walk={WALK} cursorRuntimeStageId="computeTotal#4" stepNumberOf={stepOf} />);
    fireEvent.click(screen.getByText("Copy story"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(formatTraceWalk(WALK, stepOf));
  });

  it("renders the never-written absence card (a full answer, not an empty list)", () => {
    const missing = buildTraceWalk(LOG, TREE, "phantom");
    const { container } = render(
      <TraceWalkCard walk={missing} cursorRuntimeStageId={null} stepNumberOf={stepOf} />,
    );
    const card = container.querySelector('[data-fp="trace-walk-card"]')!;
    expect(card.getAttribute("data-missing")).toBe("never-written");
    expect(card.textContent).toContain("never written in this run");
    expect(card.textContent).toContain("arrived with the run's inputs");
  });

  it("renders the not-yet-written sentence with the first write's location", () => {
    const notYet = buildTraceWalk(LOG, TREE, "total", { beforeCommitIdx: 4 });
    const { container } = render(
      <TraceWalkCard walk={notYet} cursorRuntimeStageId={null} stepNumberOf={stepOf} />,
    );
    const card = container.querySelector('[data-fp="trace-walk-card"]')!;
    expect(card.getAttribute("data-missing")).toBe("not-yet-written");
    expect(card.textContent).toContain("not been written yet at this moment");
    expect(card.textContent).toContain("ComputeTotal");
    expect(card.textContent).toContain("step 5");
  });

  it("shows the via breadcrumb with 'show all ingredients'", () => {
    const onShowAll = vi.fn();
    const sub = buildTraceWalk(LOG, TREE, "subtotal", { beforeCommitIdx: 3 });
    render(
      <TraceWalkCard
        walk={sub}
        cursorRuntimeStageId={null}
        viaKey="subtotal"
        stepNumberOf={stepOf}
        onShowAll={onShowAll}
      />,
    );
    fireEvent.click(screen.getByText("show all ingredients"));
    expect(onShowAll).toHaveBeenCalledOnce();
  });

  it("says 'unknowable, not absent' when reads were never recorded", () => {
    const noReads = buildTraceWalk(LOG, { runtimeStageId: "x#0" }, "total");
    const { container } = render(
      <TraceWalkCard walk={noReads} cursorRuntimeStageId={null} stepNumberOf={stepOf} />,
    );
    expect(container.querySelector('[data-fp="twc-unknowable"]')?.textContent).toContain(
      "unknowable, not absent",
    );
  });

  it("shows a bounded value preview from the shell's previewValueOf", () => {
    render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="computeTotal#4"
        stepNumberOf={stepOf}
        previewValueOf={(k) => (k === "total" ? 109.45 : undefined)}
      />,
    );
    expect(screen.getByText(/= 109.45/)).toBeTruthy();
  });
});

describe("TraceWalkCard — fork chooser (F2)", () => {
  it("renders the chooser when forkChooserOpen and the stop has 2+ ingredients; chips follow as usual", () => {
    const onFollow = vi.fn();
    const { container } = render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="computeTotal#4"
        stepNumberOf={stepOf}
        onFollowIngredient={onFollow}
        forkChooserOpen
        onContinueTimeOrder={vi.fn()}
      />,
    );
    const chooser = container.querySelector('[data-fp="twc-fork-chooser"]') as HTMLElement;
    expect(chooser).toBeTruthy();
    expect(chooser.textContent).toContain(
      "This value was made from 2 ingredients — which one should the walk follow?",
    );
    // The SAME ingredient chips (both followable) live inside the chooser.
    const chips = within(chooser).getAllByTitle(/Follow /);
    expect(chips).toHaveLength(2);
    fireEvent.click(chips.find((c) => c.textContent?.includes("tax"))!);
    expect(onFollow).toHaveBeenCalledWith(
      expect.objectContaining({ key: "tax", writerRuntimeStageId: "applyTax#3" }),
    );
  });

  it("fires onContinueTimeOrder from the neutral 'visit all (time order)' button", () => {
    const onContinue = vi.fn();
    const { container } = render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="computeTotal#4"
        stepNumberOf={stepOf}
        forkChooserOpen
        onContinueTimeOrder={onContinue}
      />,
    );
    fireEvent.click(
      within(container.querySelector('[data-fp="twc-fork-chooser"]') as HTMLElement).getByText(
        "visit all, oldest cause last (time order)",
      ),
    );
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("no chooser when the stop has a single ingredient (nothing to choose)", () => {
    const { container } = render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="sum#1"
        stepNumberOf={stepOf}
        forkChooserOpen
        onContinueTimeOrder={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-fp="twc-fork-chooser"]')).toBeNull();
  });

  it("no chooser when forkChooserOpen is false, even at a fork stop", () => {
    const { container } = render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="computeTotal#4"
        stepNumberOf={stepOf}
        onContinueTimeOrder={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-fp="twc-fork-chooser"]')).toBeNull();
  });
});
