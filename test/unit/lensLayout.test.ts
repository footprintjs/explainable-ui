import { describe, expect, it } from "vitest";
import {
  lensLayoutSurfaceOrder,
  resolveLensLayout,
  validateLensLayout,
  type LensLayoutDefinition,
} from "../../src/model/lensLayout";

const layout = (): LensLayoutDefinition => ({
  columns: "minmax(0, 1fr) minmax(240px, 0.6fr)",
  rows: "auto minmax(0, 1fr) auto",
  areas: [["timeTravel", "timeTravel"], ["flowchart", "developer"], ["timeline", "commentary"]],
  minHeight: 600,
  gap: "0.75rem",
});
const rejects = (value: unknown) => expect(() => validateLensLayout(value)).toThrow(/^Invalid Lens layout: /);

describe("Lens JSON layouts", () => {
  it("accepts an ordinary layout and returns unique surfaces in their first visual order", () => {
    const value = layout();
    const before = JSON.stringify(value);
    validateLensLayout(value);
    expect(lensLayoutSurfaceOrder(value)).toEqual(["timeTravel", "flowchart", "developer", "timeline", "commentary"]);
    expect(JSON.stringify(value)).toBe(before);
  });

  it("accepts a rectangular combined details area and empty grid cells", () => {
    const value = { columns: "repeat(3, minmax(0, 1fr))", areas: [
      ["timeTravel", "timeTravel", "."], ["flowchart", "details", "details"],
      ["flowchart", "details", "details"],
    ] } as const;
    validateLensLayout(value);
    expect(lensLayoutSurfaceOrder(value)).toEqual(["timeTravel", "flowchart", "details"]);
  });

  it.each(["developer", "commentary"] as const)("rejects combined details together with %s", surface => {
    rejects({ columns: "1fr", areas: [["timeTravel"], ["flowchart"], ["details"], [surface]] });
  });

  it.each([
    null, [], "developer", {},
    { columns: "1fr", areas: [] },
    { columns: "1fr", areas: [[]] },
    { columns: "1fr", areas: [["timeTravel"], ["flowchart", "."]] },
    { columns: "1fr", areas: [["timeTravel"], ["flowchart"], ["unknown"]] },
    { columns: "1fr", areas: [["timeTravel"], ["flowchart"], [42]] },
    { columns: "1fr", areas: [["flowchart"]] },
    { columns: "1fr", areas: [["timeTravel"]] },
    { columns: "1fr", areas: [["timeTravel"], ["."], ["timeTravel"], ["flowchart"]] },
    { columns: "1fr 1fr", areas: [["timeTravel", "timeTravel"], ["flowchart", "."], ["flowchart", "flowchart"]] },
  ])("refuses malformed, missing or nonrectangular surfaces: %j", value => rejects(value));

  it("bounds both axes and rejects sparse matrix rows", () => {
    rejects({ columns: "1fr", areas: Array.from({ length: 17 }, () => ["flowchart"]) });
    rejects({ columns: "1fr", areas: [Array(17).fill("timeTravel"), Array(17).fill("flowchart")] });
    rejects({ columns: "1fr", areas: [Array(1), ["flowchart"]] });
    const sparse = [["timeTravel"], ["flowchart"]];
    delete sparse[0];
    rejects({ columns: "1fr", areas: sparse });
  });

  it.each(["", " ", "1fr ".repeat(300), 2, null, {}])("bounds columns and rows without parsing CSS: %j", value => {
    rejects({ ...layout(), columns: value });
    rejects({ ...layout(), rows: value });
  });

  it("passes modern CSS and named grid lines through during SSR", () => {
    validateLensLayout({ ...layout(), columns: "[main] minmax(0, 1fr) [sidebar] var(--sidebar, 20rem) [end]",
      rows: "auto minmax(0, calc(100dvh - 4rem)) auto", minHeight: "clamp(320px, 80vh, 960px)", gap: "var(--grid-gap, 1rem)" });
    validateLensLayout({ ...layout(), columns: "repeat(2, minmax(0, 1fr))", minHeight: 0, gap: "0" });
    validateLensLayout({ ...layout(), columns: "repeat(auto-fit, minmax(min(100%, 32cqi), 1fr))",
      rows: "subgrid [start] repeat(2, [line]) [end]", minHeight: "anchor-size(height)", gap: "1cqi 2cqb" });
  });

  it("leaves the validity of every bounded nonempty CSS string to the browser", () => {
    validateLensLayout({ ...layout(), columns: "definitely-not-css", rows: "red", minHeight: "-1px", gap: "1fr" });
  });

  it.each([-1, NaN, Infinity, -Infinity, "", " ", "x".repeat(1_025), {}, null])(
    "rejects invalid optional sizes: %j", value => {
      rejects({ ...layout(), minHeight: value });
      rejects({ ...layout(), gap: value });
    },
  );

  it("does not execute stored field or cell accessors", () => {
    let calls = 0;
    const getter = () => { calls++; return "timeTravel"; };
    for (const property of ["columns", "rows", "areas", "gap", "minHeight"]) {
      const value = Object.defineProperty({ ...layout() }, property, { get: getter });
      rejects(value);
    }
    const row = Object.defineProperty(["timeTravel"], 0, { get: getter });
    rejects({ columns: "1fr", areas: [row, ["flowchart"]] });
    expect(calls).toBe(0);
  });

  it("accepts null-prototype JSON data but never inherits required fields", () => {
    validateLensLayout(Object.assign(Object.create(null), layout()));
    rejects(Object.create(layout()));
  });

  it("orders frozen data without invoking custom array iteration", () => {
    const value = layout();
    const areas = [...value.areas];
    Object.defineProperty(areas, Symbol.iterator, { get() { throw new Error("must not run"); } });
    expect(lensLayoutSurfaceOrder({ ...value, areas })).toEqual(["timeTravel", "flowchart", "developer", "timeline", "commentary"]);
    const frozen = Object.freeze({ ...value, areas: Object.freeze(value.areas.map(row => Object.freeze([...row]))) });
    expect(lensLayoutSurfaceOrder(frozen)).toContain("flowchart");
  });

  it("normalizes only descriptors into clean, detached arrays without calling raw map or join", () => {
    let calls = 0;
    const fail = () => { calls++; throw new Error("raw method getter"); };
    const rows = [["timeTravel"], ["flowchart"]];
    Object.defineProperty(rows, "map", { get: fail });
    Object.defineProperty(rows, "join", { get: fail });
    for (const row of rows) {
      Object.defineProperty(row, "map", { get: fail });
      Object.defineProperty(row, "join", { get: fail });
    }
    const input = { columns: "1fr", areas: rows, ignored: "not retained" };
    const { definition, order } = resolveLensLayout(input);
    expect(definition).not.toBe(input);
    expect(definition.areas).not.toBe(rows);
    expect(definition.areas.map(row => row.join(" "))).toEqual(["timeTravel", "flowchart"]);
    expect(order).toEqual(["timeTravel", "flowchart"]);
    expect(Object.keys(definition).sort()).toEqual(["areas", "columns", "gap", "minHeight", "rows"]);
    expect(Object.keys(definition.areas)).toEqual(["0", "1"]);
    expect(Object.keys(definition.areas[0])).toEqual(["0"]);
    rows[0][0] = "changed";
    expect(definition.areas[0][0]).toBe("timeTravel");
    expect(calls).toBe(0);
  });

  it.each([false, true])("owns absent optional fields even with inherited getters, explicit undefined=%s", explicit => {
    let calls = 0;
    const properties = ["rows", "minHeight", "gap"] as const;
    const previous = properties.map(key => Object.getOwnPropertyDescriptor(Object.prototype, key));
    try {
      for (const key of properties) Object.defineProperty(Object.prototype, key, {
        configurable: true,
        get() { calls++; throw new Error("inherited getter"); },
      });
      const input = { columns: "1fr", areas: [["timeTravel"], ["flowchart"]],
        ...(explicit ? { rows: undefined, minHeight: undefined, gap: undefined } : {}) };
      const resolved = resolveLensLayout(input);
      for (const key of properties) {
        expect(Object.prototype.hasOwnProperty.call(resolved.definition, key)).toBe(true);
        expect(resolved.definition[key]).toBeUndefined();
      }
      expect(calls).toBe(0);
    } finally {
      properties.forEach((key, index) => {
        if (previous[index]) Object.defineProperty(Object.prototype, key, previous[index]!);
        else delete (Object.prototype as Record<string, unknown>)[key];
      });
    }
  });

  it("preserves owned optional values in the normalized definition", () => {
    const input = layout();
    expect(resolveLensLayout(input).definition).toEqual(input);
  });
});
