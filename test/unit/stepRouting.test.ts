/**
 * Tests for `staggeredBendY` — the pure routing decision behind `SmartStepEdge`.
 *
 * Contract: an edge that SKIPS a rank (a node sits vertically between its
 * endpoints) must bend in the GAP below the lowest skipped node, so its
 * horizontal run clears that node instead of cutting through it (the bug:
 * `tools → call-llm` slicing through `message-api`). An edge that skips nothing
 * returns `null` → caller uses the default midpoint bend (== plain smoothstep).
 *
 * Test types (Convention 3): unit, functional, property, security.
 */

import { describe, it, expect } from "vitest";
import { staggeredBendY, type VerticalBounds } from "../../src/components/FlowchartView/_internal/stepRouting";

// Band geometry mirroring the agent merge-tree (flow coords, top→bottom):
//   tools     rank 1 : top 360, bottom 440   (source of the staggered edge)
//   messageAPI rank 2: top 540, bottom 660   (the SKIPPED node)
//   call-llm  rank 3 : top 760, bottom 880   (target)
const TOOLS = { top: 360, bottom: 440 };
const MSG_API: VerticalBounds = { top: 540, bottom: 660 };
const CALL_LLM = { top: 760, bottom: 880 };

describe("staggeredBendY", () => {
  it("unit: skips nothing → null (caller uses the default midpoint bend)", () => {
    // adjacent edge: messageAPI → call-llm, no node between them.
    expect(staggeredBendY(MSG_API.bottom, CALL_LLM.top, [TOOLS])).toBeNull();
  });

  it("unit: a skipped node → bend BELOW it and ABOVE the target", () => {
    const y = staggeredBendY(TOOLS.bottom, CALL_LLM.top, [MSG_API]);
    expect(y).not.toBeNull();
    expect(y!).toBeGreaterThan(MSG_API.bottom); // clears the skipped node
    expect(y!).toBeLessThan(CALL_LLM.top); // stays above the target
  });

  it("functional: the bend clears the skipped node, so the horizontal run can't cut through it", () => {
    // Reproduces the actual bug geometry: the default midpoint WOULD land inside
    // messageAPI; staggeredBendY must move it out.
    const midpoint = (TOOLS.bottom + CALL_LLM.top) / 2; // 600 — inside messageAPI (540–660)
    expect(midpoint).toBeGreaterThan(MSG_API.top);
    expect(midpoint).toBeLessThan(MSG_API.bottom);
    const y = staggeredBendY(TOOLS.bottom, CALL_LLM.top, [MSG_API])!;
    expect(y).toBeGreaterThanOrEqual(MSG_API.bottom); // moved OUT of the box
  });

  it("unit: endpoints are excluded by the caller — only `others` are considered", () => {
    // (the component filters source/target out before calling; here `others`
    // never contains them, so an empty list trivially skips nothing.)
    expect(staggeredBendY(TOOLS.bottom, CALL_LLM.top, [])).toBeNull();
  });

  it("unit: multiple skipped nodes → bend below the LOWEST one", () => {
    const a: VerticalBounds = { top: 540, bottom: 600 };
    const b: VerticalBounds = { top: 620, bottom: 700 }; // lower bottom
    const y = staggeredBendY(TOOLS.bottom, CALL_LLM.top, [a, b])!;
    expect(y).toBeGreaterThanOrEqual(b.bottom); // below the lowest (b)
  });

  it("unit: a node level with the SOURCE or TARGET row is not 'skipped' (center test is strict)", () => {
    const atSource: VerticalBounds = { top: 360, bottom: 440 }; // center 400 == source band
    const atTarget: VerticalBounds = { top: 760, bottom: 880 }; // center 820 == target band
    expect(staggeredBendY(TOOLS.bottom, CALL_LLM.top, [atSource, atTarget])).toBeNull();
  });

  it("unit: clamps to stay minGapFromTarget above the target (corner radius room)", () => {
    // a skipped node whose bottom nearly touches the target → midpoint would sit
    // too close to the target; clamp keeps an 8px gap by default.
    const hugging: VerticalBounds = { top: 600, bottom: 756 }; // bottom 4px above target top 760
    const y = staggeredBendY(TOOLS.bottom, CALL_LLM.top, [hugging])!;
    expect(y).toBeLessThanOrEqual(CALL_LLM.top - 8);
  });

  it("property: with NON-OVERLAPPING bands, the bend clears every skipped node and stays below the target", () => {
    // Models a real rank layout: bands don't overlap, so a skipped node fits
    // ENTIRELY in the gap (its bottom is strictly above the target's top). Under
    // that invariant the bend always clears every skipped node AND keeps the
    // corner gap to the target.
    for (let t = 0; t < 300; t++) {
      const sB = (t * 13) % 200;
      const tT = sB + 220 + ((t * 7) % 300); // target well below source
      const others: VerticalBounds[] = [];
      const n = 1 + (t % 4);
      for (let i = 0; i < n; i++) {
        const h = 20 + ((t * (i + 1)) % 40); // height ≤ 60
        const maxTop = tT - 12 - h; // keep the whole node ≥12px above the target
        if (maxTop <= sB + 5) continue;
        const top = sB + 5 + ((t * (i + 3)) % (maxTop - sB - 5));
        others.push({ top, bottom: top + h });
      }
      const y = staggeredBendY(sB, tT, others);
      if (y === null) continue;
      expect(y).toBeLessThanOrEqual(tT - 8 + 1e-9); // keeps the corner gap to target
      for (const o of others) {
        const cy = (o.top + o.bottom) / 2;
        if (cy > sB && cy < tT) expect(y).toBeGreaterThanOrEqual(o.bottom - 1e-9); // clears each skipped node
      }
    }
  });

  it("security/robustness: degenerate inputs do not throw or return NaN", () => {
    expect(staggeredBendY(0, 0, [])).toBeNull(); // zero-height span
    expect(() => staggeredBendY(NaN, NaN, [{ top: NaN, bottom: NaN }])).not.toThrow();
    // target above source (inverted) → nothing qualifies as skipped → null
    expect(staggeredBendY(500, 100, [{ top: 200, bottom: 300 }])).toBeNull();
  });
});
