/** @vitest-environment jsdom */
/**
 * StoryNarrative — heading numbering and subflow markers, asserted through the
 * SHIPPED component.
 *
 * This file replaces `test/unit/narrativeHeadings.test.ts`, which hand-copied
 * the numbering algorithm into the test and then drifted away from it: it was
 * still asserting headings like `"Stage 1"`, `"Decider 1"` and `"Subflow 3.1"`
 * long after the component had moved to a bare counter plus a separate
 * heading TYPE. A green copy of code nobody ships is worse than no test — it
 * is what let the fork-numbering slip below stay hidden. Everything here
 * renders `<StoryNarrative>` and reads the DOM.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { StoryNarrative } from "../../src/components/StoryNarrative/StoryNarrative";
import type { NarrativeEntry } from "../../src/types";

function e(
  type: NarrativeEntry["type"],
  text: string,
  extra: Partial<NarrativeEntry> = {},
): NarrativeEntry {
  return { type, text, depth: 0, ...extra } as NarrativeEntry;
}

/** The rendered lines, in order. Unstyled mode prints one div per entry. */
function lines(entries: NarrativeEntry[], scopeSubflowId?: string): string[] {
  const { container } = render(
    <StoryNarrative
      entries={entries}
      revealedEntryCount={entries.length}
      scopeSubflowId={scopeSubflowId}
      unstyled
    />,
  );
  return Array.from(container.querySelectorAll('[data-fp="narrative-entry"]')).map(
    (n) => n.textContent ?? "",
  );
}

/** The leading "N." of a line, or null when the line carries no number. */
function num(line: string): string | null {
  const m = line.match(/^(\d+)\./);
  return m ? m[1]! : null;
}

describe("StoryNarrative — flat sequential numbering", () => {
  it("numbers stages 1, 2, 3 in traversal order", () => {
    const out = lines([
      e("stage", "Stage 1: First stage.", { stageName: "First" }),
      e("step", "Write x = 1"),
      e("stage", "Stage 2: Second stage.", { stageName: "Second" }),
      e("stage", "Stage 3: Third stage.", { stageName: "Third" }),
    ]);
    expect(num(out[0]!)).toBe("1");
    expect(num(out[1]!)).toBeNull(); // steps are not steps of the chart
    expect(num(out[2]!)).toBe("2");
    expect(num(out[3]!)).toBe("3");
  });

  it("strips the legacy 'Stage N: ' prefix from the text", () => {
    const out = lines([e("stage", "Stage 1: The process began: Parse request.", { stageName: "Parse" })]);
    expect(out[0]).toContain("The process began: Parse request.");
    expect(out[0]).not.toContain("Stage 1: The process");
  });

  it("labels a stage heading with its type and name", () => {
    const out = lines([e("stage", "Parse the request.", { stageName: "Parse" })]);
    expect(out[0]).toBe("1. [Stage: Parse] Parse the request.");
  });

  it("a decision is nested under its stage — no number of its own", () => {
    const out = lines([
      e("stage", "Stage 1: Evaluate risk.", { stageName: "Evaluate" }),
      e("condition", "Risk is high, chose reject."),
      e("stage", "Stage 2: Reject request.", { stageName: "Reject" }),
    ]);
    expect(num(out[0]!)).toBe("1");
    expect(num(out[1]!)).toBeNull();
    expect(num(out[2]!)).toBe("2"); // the decision did not consume a number
  });

  it("steps, loops, breaks, errors and retries carry no number", () => {
    const out = lines([
      e("stage", "Stage 1: First.", { stageName: "First" }),
      e("step", "Write x = 1"),
      e("loop", "On pass 2 through Process."),
      e("retry", "Attempt 1 failed: timeout."),
      e("break", "Stopped early."),
      e("error", "Boom."),
    ]);
    expect(num(out[0]!)).toBe("1");
    for (const line of out.slice(1)) expect(num(line)).toBeNull();
  });
});

describe("StoryNarrative — fork and selector headings", () => {
  it("a fork after a stage opens a new numbered heading", () => {
    const out = lines([
      e("stage", "Stage 1: First.", { stageName: "First" }),
      e("fork", "[Parallel]: Forking into 3 paths: A, B, C."),
    ]);
    expect(out[1]).toBe("2. [Fork: ] Forking into 3 paths: A, B, C.");
  });

  it("a [Selected] fork reads as a Selector", () => {
    const out = lines([
      e("stage", "Stage 1: First.", { stageName: "First" }),
      e("fork", "[Selected]: 2 of 3 selected: A, B."),
    ]);
    expect(out[1]).toContain("[Selector");
    expect(out[1]).toContain("2 of 3 selected: A, B.");
  });

  it("consecutive fork entries share ONE heading — they are one fan-out", () => {
    const out = lines([
      e("stage", "Stage 1: First.", { stageName: "First" }),
      e("fork", "[Parallel]: Forking into 2 paths: A, B."),
      e("fork", "Branch A ran."),
      e("fork", "Branch B ran."),
    ]);
    expect(num(out[1]!)).toBe("2");
    expect(num(out[2]!)).toBeNull();
    expect(num(out[3]!)).toBeNull();
  });

  // ── REGRESSION (0.35.0) ────────────────────────────────────────────────
  // `prevType` was only ever advanced by the fork branch itself. Every other
  // branch returned early without touching it, so after one fork the tracker
  // read "fork" FOREVER — and the next fork in the run, however far away, was
  // treated as a continuation of the first and lost its heading and its
  // number. Anything at all in between exposes it.
  it("a fork after an EARLIER fork still gets its own heading (stage between)", () => {
    const out = lines([
      e("fork", "[Parallel]: First fan-out: A, B."),
      e("stage", "Stage 2: Middle.", { stageName: "Middle" }),
      e("fork", "[Parallel]: Second fan-out: C, D."),
    ]);
    expect(num(out[0]!)).toBe("1");
    expect(num(out[1]!)).toBe("2");
    expect(num(out[2]!)).toBe("3");
    expect(out[2]).toContain("[Fork");
  });

  it("...with a subflow marker in between", () => {
    const out = lines([
      e("fork", "[Parallel]: First fan-out."),
      e("subflow", "Entering the Auth subflow.", {
        stageId: "auth",
        subflowId: "auth",
        direction: "entry",
        stageName: "Auth",
      }),
      e("fork", "[Parallel]: Second fan-out."),
    ]);
    expect(num(out[0]!)).toBe("1");
    expect(num(out[1]!)).toBe("2");
    expect(num(out[2]!)).toBe("3");
  });

  it("...with a decision in between", () => {
    const out = lines([
      e("fork", "[Parallel]: First fan-out."),
      e("condition", "Chose the fast path."),
      e("fork", "[Parallel]: Second fan-out."),
    ]);
    expect(num(out[0]!)).toBe("1");
    expect(num(out[1]!)).toBeNull(); // decisions still take no number
    expect(num(out[2]!)).toBe("2");
  });

  it("a step between forks does NOT split one fan-out", () => {
    // Guard for the fix: only a genuinely different kind of entry ends a
    // fan-out. `step` already reset the tracker before this change and must
    // go on doing so.
    const out = lines([
      e("fork", "[Parallel]: Fan-out."),
      e("step", "Write x = 1"),
      e("fork", "[Parallel]: Second fan-out."),
    ]);
    expect(num(out[0]!)).toBe("1");
    expect(num(out[2]!)).toBe("2");
  });
});

describe("StoryNarrative — subflow markers", () => {
  const enter = (name: string, id: string) =>
    e("subflow", `Entering the ${name} subflow.`, {
      stageId: id,
      subflowId: id,
      direction: "entry",
      stageName: name,
    });
  const exit = (name: string, id: string) =>
    e("subflow", `Exiting the ${name} subflow.`, {
      stageId: id,
      subflowId: id,
      direction: "exit",
      stageName: name,
    });

  it("an entry marker is numbered; the exit marker is not rendered", () => {
    const out = lines([
      e("stage", "Stage 1: Parse.", { stageName: "Parse" }),
      enter("Auth", "auth"),
      exit("Auth", "auth"),
      e("stage", "Stage 3: Respond.", { stageName: "Respond" }),
    ]);
    expect(out).toHaveLength(3); // the exit marker is dropped
    expect(num(out[0]!)).toBe("1");
    expect(out[1]).toContain("[Subflow: Auth]");
    expect(num(out[1]!)).toBe("2");
    expect(num(out[2]!)).toBe("3");
  });

  // ── REGRESSION (0.35.0) ────────────────────────────────────────────────
  // Enter/exit used to be decided by a TOGGLE keyed on the entry's stable
  // stageId: the first marker for an id was the entry and every later one an
  // exit. A subflow mounted more than once — a loop, or simply the same child
  // chart mounted twice — therefore showed its FIRST entry and then vanished
  // from the story for good. The entries carry a `direction`; read it.
  it("the SAME subflow mounted twice appears twice", () => {
    const out = lines([
      e("stage", "Stage 1: Start.", { stageName: "Start" }),
      enter("Auth", "auth"),
      exit("Auth", "auth"),
      e("loop", "On pass 2 through the retry loop."),
      enter("Auth", "auth"),
      exit("Auth", "auth"),
      e("stage", "Stage 4: Done.", { stageName: "Done" }),
    ]);
    const subflowLines = out.filter((l) => l.includes("[Subflow: Auth]"));
    expect(subflowLines).toHaveLength(2);
    expect(num(subflowLines[0]!)).toBe("2");
    expect(num(subflowLines[1]!)).toBe("3");
  });

  it("three mounts, three markers — the numbering keeps climbing", () => {
    const out = lines([
      enter("Auth", "auth"),
      exit("Auth", "auth"),
      enter("Auth", "auth"),
      exit("Auth", "auth"),
      enter("Auth", "auth"),
      exit("Auth", "auth"),
    ]);
    expect(out).toHaveLength(3);
    expect(out.map(num)).toEqual(["1", "2", "3"]);
  });

  it("falls back to the first-seen toggle when no direction is carried", () => {
    // A hand-built narrative (or an older renderer) sets no `direction`. The
    // old toggle still answers, so those consumers are not broken.
    const out = lines([
      e("subflow", "Entering the Auth subflow.", { stageId: "auth", subflowId: "auth", stageName: "Auth" }),
      e("subflow", "Exiting the Auth subflow.", { stageId: "auth", subflowId: "auth", stageName: "Auth" }),
    ]);
    expect(out).toHaveLength(1);
    expect(num(out[0]!)).toBe("1");
  });

  it("a nested subflow's own stages stay hidden behind its marker", () => {
    const out = lines([
      e("stage", "Stage 1: Parse.", { stageName: "Parse" }),
      enter("Auth", "auth"),
      e("stage", "Validated the token.", { subflowId: "auth", stageName: "Validate" }),
      exit("Auth", "auth"),
    ]);
    expect(out).toHaveLength(2);
    expect(out[1]).toContain("[Subflow: Auth]");
  });

  it("drilled in, that subflow's OWN stages are the story", () => {
    const out = lines(
      [
        enter("Auth", "auth"),
        e("stage", "Validated the token.", { subflowId: "auth", stageName: "Validate" }),
        exit("Auth", "auth"),
      ],
      "auth",
    );
    expect(out.some((l) => l.includes("Validated the token."))).toBe(true);
  });
});

describe("StoryNarrative — progressive reveal", () => {
  it("shows only the revealed entries", () => {
    const entries = [
      e("stage", "Stage 1: First.", { stageName: "First" }),
      e("stage", "Stage 2: Second.", { stageName: "Second" }),
      e("stage", "Stage 3: Third.", { stageName: "Third" }),
    ];
    const { container } = render(
      <StoryNarrative entries={entries} revealedEntryCount={2} unstyled />,
    );
    const shown = Array.from(container.querySelectorAll('[data-fp="narrative-entry"]'));
    expect(shown).toHaveLength(2);
  });
});
