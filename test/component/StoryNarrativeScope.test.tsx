/** @vitest-environment jsdom */
/**
 * StoryNarrative — which level's entries a story shows.
 *
 * The root story hides subflow internals: they belong behind their mount, and
 * you read them by drilling in. But the DRILLED story is handed only that
 * subflow's entries — every one of which carries a `subflowId` — so the same
 * rule blanked it entirely. `scopeSubflowId` names the level being viewed:
 * its own entries show, entries from subflows nested INSIDE it stay hidden.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { StoryNarrative } from "../../src/components/StoryNarrative";
import type { NarrativeEntry } from "../../src/types";

const entries = [
  { type: "stage", stageName: "Seed", depth: 0, text: "ROOT-SEED" },
  { type: "subflow", stageName: "Pipeline", subflowId: "pipeline", depth: 0, direction: "entry", text: "ENTER-PIPELINE" },
  { type: "stage", stageName: "pipeline/Fetch", subflowId: "pipeline", depth: 0, text: "PIPELINE-FETCH" },
  { type: "stage", stageName: "pipeline/prepare/Clean", subflowId: "pipeline/prepare", depth: 0, text: "NESTED-CLEAN" },
] as unknown as NarrativeEntry[];

const all = entries.length;

afterEach(cleanup);

describe("StoryNarrative — level scoping (REGRESSION)", () => {
  it("the root story hides subflow internals but keeps the markers", () => {
    const { container } = render(
      createElement(StoryNarrative, { entries, revealedEntryCount: all }),
    );
    expect(container.textContent).toContain("ROOT-SEED");
    expect(container.textContent).toContain("ENTER-PIPELINE");
    expect(container.textContent).not.toContain("PIPELINE-FETCH");
    expect(container.textContent).not.toContain("NESTED-CLEAN");
  });

  it("a drilled story shows its OWN stages", () => {
    const { container } = render(
      createElement(StoryNarrative, {
        entries,
        revealedEntryCount: all,
        scopeSubflowId: "pipeline",
      }),
    );
    expect(container.textContent).toContain("PIPELINE-FETCH");
  });

  it("...and still hides the subflows nested inside it", () => {
    const { container } = render(
      createElement(StoryNarrative, {
        entries,
        revealedEntryCount: all,
        scopeSubflowId: "pipeline",
      }),
    );
    expect(container.textContent).not.toContain("NESTED-CLEAN");
    expect(container.textContent).not.toContain("ROOT-SEED"); // a level above
  });

  it("the deepest level shows its own stages too", () => {
    const { container } = render(
      createElement(StoryNarrative, {
        entries,
        revealedEntryCount: all,
        scopeSubflowId: "pipeline/prepare",
      }),
    );
    expect(container.textContent).toContain("NESTED-CLEAN");
    expect(container.textContent).not.toContain("PIPELINE-FETCH");
  });
});
