/**
 * Tests for `extractMeasuredFootprints` — the pure core of the measure-then-
 * layout probe.
 *
 * Regression context: the probe used to read `getNodes()`, whose nodes report
 * `measured: {0,0}` in xyflow v12 — so the sizes map was always empty and the
 * layout silently stayed on estimated fallback sizes (off-center deciders /
 * forks). The fix reads the INTERNAL nodes from `nodeLookup`, whose `.measured`
 * carries the real footprint. These tests pin that contract: read `.measured`,
 * and DROP any node whose footprint is missing or 0×0.
 *
 * Test types (Convention 3): unit, functional, property, security/robustness.
 */

import { describe, it, expect } from "vitest";
import {
  extractMeasuredFootprints,
  type MeasuredLike,
} from "../../src/components/FlowchartView/_internal/measuredFootprints";

/** Build nodeLookup-shaped entries from a plain record. */
const entries = (
  rec: Record<string, MeasuredLike>,
): Iterable<readonly [string, MeasuredLike]> => Object.entries(rec);

describe("extractMeasuredFootprints", () => {
  it("unit: reads the `.measured` field into id -> {width,height}", () => {
    const out = extractMeasuredFootprints(
      entries({
        intake: { measured: { width: 132, height: 33 } },
        decide: { measured: { width: 120, height: 72 } },
      }),
    );
    expect(out.get("intake")).toEqual({ width: 132, height: 33 });
    expect(out.get("decide")).toEqual({ width: 120, height: 72 });
    expect(out.size).toBe(2);
  });

  it("unit: a 0×0 (unmeasured) node is SKIPPED — never feeds a degenerate size", () => {
    // This is exactly the getNodes() failure mode: every node reports 0×0.
    const out = extractMeasuredFootprints(
      entries({
        a: { measured: { width: 0, height: 0 } },
        b: { measured: { width: 100, height: 40 } },
      }),
    );
    expect(out.has("a")).toBe(false);
    expect(out.get("b")).toEqual({ width: 100, height: 40 });
  });

  it("unit: missing `.measured` or a missing dimension is skipped", () => {
    const out = extractMeasuredFootprints(
      entries({
        noMeasured: {},
        widthOnly: { measured: { width: 100 } },
        heightOnly: { measured: { height: 40 } },
        ok: { measured: { width: 50, height: 20 } },
      }),
    );
    expect([...out.keys()]).toEqual(["ok"]);
  });

  it("functional: the whole-getNodes()-returns-0×0 case yields an EMPTY map (the bug signature)", () => {
    const allZero = extractMeasuredFootprints(
      entries({
        intake: { measured: { width: 0, height: 0 } },
        decide: { measured: { width: 0, height: 0 } },
        notify: { measured: { width: 0, height: 0 } },
      }),
    );
    expect(allZero.size).toBe(0); // caller then keeps estimated sizes (no relayout) — no crash
  });

  it("property: output keys are exactly the inputs with a positive w AND h", () => {
    for (let t = 0; t < 200; t++) {
      const rec: Record<string, MeasuredLike> = {};
      const expectKept = new Set<string>();
      const n = 1 + (t % 6);
      for (let i = 0; i < n; i++) {
        const w = ((t * (i + 1)) % 5) * 30; // 0,30,60,90,120
        const h = ((t * (i + 2)) % 4) * 20; // 0,20,40,60
        const id = `n${i}`;
        rec[id] = { measured: { width: w, height: h } };
        if (w > 0 && h > 0) expectKept.add(id);
      }
      const out = extractMeasuredFootprints(entries(rec));
      expect(new Set(out.keys())).toEqual(expectKept);
      for (const [id, s] of out) {
        expect(s.width).toBeGreaterThan(0);
        expect(s.height).toBeGreaterThan(0);
        expect(s).toEqual({ width: rec[id].measured!.width, height: rec[id].measured!.height });
      }
    }
  });

  it("security/robustness: degenerate inputs (empty, negative, NaN, non-number) do not throw and are skipped", () => {
    expect(extractMeasuredFootprints(entries({})).size).toBe(0);
    const out = extractMeasuredFootprints(
      entries({
        neg: { measured: { width: -10, height: 40 } },
        nan: { measured: { width: NaN, height: 40 } },
        // a hostile shape with non-number dims must not crash or leak through
        bad: { measured: { width: "100" as unknown as number, height: 40 } },
        good: { measured: { width: 10, height: 10 } },
      }),
    );
    expect([...out.keys()]).toEqual(["good"]);
  });
});
