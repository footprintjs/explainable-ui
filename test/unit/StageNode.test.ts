/**
 * Component tests for StageNode — specifically the CENTERING CONTRACT.
 *
 * React Flow sizes the node WRAPPER to the width the layout allocated (which can
 * be WIDER than the card — uniform-width columns, or a NodeSizeResolver
 * footprint the layout stamps onto `style.width`). The card itself is
 * content-sized. Without a centering wrapper the card sits at the box's LEFT
 * edge, so its visual center drifts left of the box center the layout placed it
 * at — the wider the box, the worse the drift. That manifested as "CallLLM /
 * Route look not-centered" in the agent merge-tree chart.
 *
 * The fix: StageNode wraps its (content-sized) card in a `width:100%` +
 * `justify-content:center` flex container, so the card's visual center coincides
 * with the node-box center (layout centering == paint centering). These tests
 * pin that contract so it can't silently regress back to left-anchoring.
 *
 * The actual pixel-centering is verified in-browser (jsdom has no layout); here
 * we pin the STRUCTURAL invariant — the centering wrapper is always present,
 * for every node shape and every execution state.
 *
 * Test types (Convention 3): unit, functional, property. Security/perf/load do
 * not apply to a purely presentational, state-free centering wrapper.
 */

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReactFlowProvider } from "@xyflow/react";
import { StageNode } from "../../src/components/StageNode";
import type { StageNodeData } from "../../src/components/StageNode/StageNode";

/**
 * The unique style signature of the centering wrapper. React serializes the
 * style object in key order — `{ width: "100%", display: "flex",
 * justifyContent: "center" }` — so this exact substring identifies OUR wrapper
 * and not the card's own `justify-content:center` (which has `min-width`, not
 * `width:100%`) or the badge dots (`width:22px`).
 */
const CENTERING_WRAPPER = "width:100%;display:flex;justify-content:center";

/** Render the node with the given data, return the static HTML string. */
function render(data: Partial<StageNodeData>): string {
  const props = { data: { label: "CallLLM", ...data } } as unknown as Parameters<typeof StageNode>[0];
  return renderToStaticMarkup(
    createElement(ReactFlowProvider, null, createElement(StageNode, props)),
  );
}

describe("StageNode centering contract", () => {
  it("functional: renders the stage label", () => {
    expect(render({ label: "messageAPI" })).toContain("messageAPI");
  });

  it("unit: wraps the card in a full-width center-justified container (no left-anchor)", () => {
    expect(render({ label: "CallLLM" })).toContain(CENTERING_WRAPPER);
  });

  it("unit: the centering wrapper ENCLOSES the card (opens before the label)", () => {
    const html = render({ label: "CallLLM" });
    const wrapperAt = html.indexOf(CENTERING_WRAPPER);
    const labelAt = html.indexOf("CallLLM");
    expect(wrapperAt).toBeGreaterThanOrEqual(0);
    expect(labelAt).toBeGreaterThan(wrapperAt); // label is INSIDE the wrapper
  });

  it("functional: a decider (diamond) node is also centered within its box", () => {
    // Deciders render as a diamond, but must still center within an oversized
    // box — the wrapper sits above the shape branch, so it covers both.
    expect(render({ label: "Route", isDecider: true })).toContain(CENTERING_WRAPPER);
  });

  it("property: the centering wrapper is present for EVERY execution state", () => {
    // Centering must never depend on active/done/error/dimmed/linked — those
    // change colors/animation, not geometry. Any combination keeps the wrapper.
    const flags: Array<keyof StageNodeData> = ["active", "done", "error", "dimmed", "linked", "isSubflow", "isFork", "isLazy"];
    for (let mask = 0; mask < 1 << flags.length; mask += 37 /* sample combos */) {
      const data: Partial<StageNodeData> = { label: "S" };
      flags.forEach((f, i) => { if (mask & (1 << i)) (data as Record<string, unknown>)[f] = true; });
      expect(render(data)).toContain(CENTERING_WRAPPER);
    }
  });

  it("property: a decider in any state also keeps the wrapper", () => {
    for (const state of [{}, { active: true }, { done: true }, { error: true }, { dimmed: true }]) {
      expect(render({ label: "D", isDecider: true, ...state })).toContain(CENTERING_WRAPPER);
    }
  });
});
