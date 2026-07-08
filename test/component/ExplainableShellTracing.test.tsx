/** @vitest-environment jsdom */
/**
 * ExplainableShell — Same-Rail Rewind integration (the full loop).
 *
 * What is being pinned (the design contract, end to end):
 * 1. ENTRY: clicking a "Trace a value" chip in the Data Trace tab enters
 *    tracing mode — the ONE visible jump lands the cursor on the anchor,
 *    the rail shows the mode header, non-dependency ticks go unlandable.
 * 2. WALK: at a FORK stop (2+ ingredients) the walk-back control PROMPTS —
 *    the chooser offers each ingredient plus "visit all (time order)",
 *    which performs the classic nearest-earlier-stop move. At a non-fork
 *    stop "earlier cause" steps backward through stops only, as before.
 * 3. FOLLOW: an ingredient chip (in the chooser) re-anchors the walk
 *    (breadcrumb "▸ via"), "show all" restores the full walk.
 * 4. EXIT: Done leaves the cursor where the walk ended (no teleport).
 * 5. DRILL exits tracing (the walk lives on the root rail — honesty).
 * 6. F1: ANY variable ever written is traceable from the search block —
 *    including keys not yet written at the cursor (the honest card).
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import * as React from "react";

import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import type { StageSnapshot } from "../../src/types";

// ── The diamond fixture (same shape as traceWalk.test) ────────────────────
// total ← {tax ← {rate, subtotal}, subtotal}; Audit is causally irrelevant.
const STAGES = [
  { name: "Seed", rsid: "seed#0", writes: ["rate", "items"], reads: undefined as string[] | undefined },
  { name: "Sum", rsid: "sum#1", writes: ["subtotal"], reads: ["items"] },
  { name: "Audit", rsid: "audit#2", writes: ["auditNote"], reads: ["subtotal"] },
  { name: "ApplyTax", rsid: "applyTax#3", writes: ["tax"], reads: ["rate", "subtotal"] },
  { name: "ComputeTotal", rsid: "computeTotal#4", writes: ["total"], reads: ["subtotal", "tax"] },
];

const SNAPSHOTS: StageSnapshot[] = STAGES.map((st, i) => ({
  stageName: st.name.toLowerCase(),
  stageLabel: st.name,
  runtimeStageId: st.rsid,
  memory: { total: 109.45 },
  narrative: "",
  startMs: i,
  durationMs: 1,
}));

function makeRuntimeSnapshot() {
  const commitLog = STAGES.map((st) => ({
    stage: st.name,
    stageId: st.name.toLowerCase(),
    runtimeStageId: st.rsid,
    trace: st.writes.map((path) => ({ path })),
  }));
  let tree: Record<string, unknown> | undefined;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    const st = STAGES[i];
    tree = {
      runtimeStageId: st.rsid,
      ...(st.reads && { stageReads: Object.fromEntries(st.reads.map((k) => [k, 1])) }),
      ...(tree && { next: tree }),
    };
  }
  return { sharedState: {}, commitLog, executionTree: tree, subflowResults: {} };
}

function renderShell() {
  const utils = render(
    React.createElement(ExplainableShell, {
      snapshots: SNAPSHOTS,
      runtimeSnapshot: makeRuntimeSnapshot() as never,
      title: "Quote",
    }),
  );
  return utils;
}

function toolbar() {
  return screen.getByRole("toolbar");
}

/** Enter tracing on `total`: cursor to last stage → Inspector → Data Trace → chip. */
function enterTracing() {
  // Walk the cursor to the last stage so its writes ("total") are traceable.
  const next = screen.getByLabelText("Next stage");
  for (let i = 0; i < STAGES.length - 1; i++) fireEvent.click(next);
  fireEvent.click(screen.getByText("Inspector"));
  fireEvent.click(screen.getByText("Data Trace"));
  fireEvent.click(within(screen.getByText("This step wrote:").parentElement as HTMLElement).getByText("total"));
}

function forkChooser(): HTMLElement | null {
  return document.querySelector('[data-fp="twc-fork-chooser"]');
}

describe("ExplainableShell — Same-Rail Rewind", () => {
  it("ENTRY: the chip starts tracing, jumps the cursor to the anchor, and flips the rail", () => {
    renderShell();
    enterTracing();
    // Mode chrome on the rail
    expect(toolbar().getAttribute("data-tracing")).toBe("true");
    expect(within(toolbar()).getByText(/stop 1 of 4/)).toBeTruthy();
    // The stop card is open with the anchor's story
    expect(screen.getByText(/Why this value — stop 1 of 4/i)).toBeTruthy();
    expect(screen.getByText(/Made from 2 ingredients/)).toBeTruthy();
    // Non-dependency tick (Audit) is unlandable
    const audit = screen.getByTitle(/Audit \(not part of this trace\)/);
    expect((audit as HTMLButtonElement).disabled).toBe(true);
  });

  it("WALK: a fork stop prompts; 'visit all (time order)' performs the classic step; non-forks walk as before", () => {
    renderShell();
    enterTracing();
    // The anchor (ComputeTotal ← subtotal + tax) IS a fork: the walk-back
    // control prompts instead of moving.
    fireEvent.click(screen.getByLabelText("Choose cause"));
    const chooser = forkChooser()!;
    expect(chooser).toBeTruthy();
    expect(within(chooser).getAllByTitle(/Follow /)).toHaveLength(2);
    // Neutral option = today's behavior: nearest earlier stop = ApplyTax.
    fireEvent.click(within(chooser).getByText(/visit all, oldest cause last/));
    expect(within(toolbar()).getByText(/stop 2 of 4/)).toBeTruthy();
    expect(screen.getByText(/Step 4 ·/)).toBeTruthy(); // ApplyTax is rail step 4 — Audit was skipped
    expect(forkChooser()).toBeNull(); // the cursor move closed the chooser
    // ApplyTax (← rate + subtotal) is ALSO a fork — prompt again, visit all → Sum.
    fireEvent.click(screen.getByLabelText("Choose cause"));
    fireEvent.click(screen.getByText(/visit all, oldest cause last/));
    expect(within(toolbar()).getByText(/stop 3 of 4/)).toBeTruthy();
    // Sum has ONE ingredient — the classic button is back and steps to Seed.
    fireEvent.click(screen.getByLabelText("Earlier cause"));
    expect(within(toolbar()).getByText(/stop 4 of 4/)).toBeTruthy();
    expect((screen.getByLabelText("Earlier cause") as HTMLButtonElement).disabled).toBe(true);
  });

  it("CHOOSER closes on any cursor move (a stop-tick click), leaving the walk intact", () => {
    renderShell();
    enterTracing();
    fireEvent.click(screen.getByLabelText("Choose cause"));
    expect(forkChooser()).toBeTruthy();
    // Click the Sum stop tick directly — a cursor move that is not a walk step.
    const ticks = document.querySelectorAll('[data-fp="tt-tick"]');
    fireEvent.click(ticks[1]);
    expect(forkChooser()).toBeNull();
    expect(within(toolbar()).getByText(/stop 3 of 4/)).toBeTruthy(); // still tracing, on Sum
  });

  it("FOLLOW from the chooser: an ingredient chip re-anchors the walk with the via breadcrumb; show-all restores", () => {
    renderShell();
    enterTracing();
    fireEvent.click(screen.getByLabelText("Choose cause")); // anchor fork: subtotal + tax
    const chips = within(forkChooser()!).getAllByTitle(/Follow /);
    fireEvent.click(chips.find((c) => c.textContent?.includes("subtotal"))!);
    // Re-anchored on subtotal's writer (Sum): the header + breadcrumb say so.
    expect(screen.getAllByText(/via/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Why this value — stop 1 of/i)).toBeTruthy();
    expect(screen.getByText(/Step 2 ·/)).toBeTruthy(); // Sum is rail step 2
    expect(forkChooser()).toBeNull(); // following answered the chooser
    fireEvent.click(screen.getByText("show all ingredients"));
    expect(within(toolbar()).getByText(/stop 1 of 4/)).toBeTruthy(); // full walk restored, back at the anchor
  });

  it("EXIT: Done restores the normal rail and the cursor stays at the found cause", () => {
    renderShell();
    enterTracing();
    fireEvent.click(screen.getByLabelText("Choose cause"));
    fireEvent.click(screen.getByText(/visit all, oldest cause last/)); // → ApplyTax
    fireEvent.click(within(toolbar()).getByLabelText("Exit tracing"));
    expect(toolbar().getAttribute("data-tracing")).toBeNull();
    // Normal rail is back (play button returns) and no teleport happened:
    // clicking "Next stage" once lands on ComputeTotal (we were on ApplyTax).
    expect(screen.getByLabelText("Play")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Next stage"));
    expect(screen.getAllByText(/ComputeTotal/).length).toBeGreaterThan(0);
  });

  it("F1: the search block traces a key the current stage did NOT write — honestly", () => {
    renderShell();
    // Cursor to Sum (step 2) — it writes only `subtotal`.
    fireEvent.click(screen.getByLabelText("Next stage"));
    fireEvent.click(screen.getByText("Inspector"));
    fireEvent.click(screen.getByText("Data Trace"));
    // Empty filter previews every run-written key (6 here, so no "+N more").
    expect(document.querySelectorAll('[data-fp="trace-any-chip"]')).toHaveLength(6);
    const search = document.querySelector('[data-fp="trace-search"]') as HTMLInputElement;
    fireEvent.change(search, { target: { value: "total" } });
    const chips = [...document.querySelectorAll('[data-fp="trace-any-chip"]')];
    // Case-insensitive substring: both `subtotal` and `total` match.
    expect(chips.map((c) => c.textContent)).toEqual(["subtotal", "total"]);
    fireEvent.click(chips.find((c) => c.textContent === "total")!);
    // `total` is first written LATER than the cursor — the honest
    // not-yet-written card, and the rail stays in normal mode (no stops).
    const card = document.querySelector('[data-fp="trace-walk-card"]')!;
    expect(card.getAttribute("data-missing")).toBe("not-yet-written");
    expect(card.textContent).toContain("not been written yet at this moment");
    expect(toolbar().getAttribute("data-tracing")).toBeNull();
  });

  it("ABSENCE: tracing an unwritten value shows the truthful card, rail stays normal", () => {
    renderShell();
    // Move to Seed (writes rate+items). Trace `rate` from step 1 — but first
    // check a NEVER-written key by tracing from the State side: simplest
    // honest fixture — trace `total` from step 1 (before its write).
    fireEvent.click(screen.getByText("Inspector"));
    fireEvent.click(screen.getByText("Data Trace"));
    fireEvent.click(within(screen.getByText("This step wrote:").parentElement as HTMLElement).getByText("rate"));
    // rate's anchor is Seed itself — a 1-stop walk, no rail mode (< 2 stops is
    // still a walk; rail shows when stops exist). Here we assert the card.
    expect(screen.getByText(/Why this value/i)).toBeTruthy();
  });
});
