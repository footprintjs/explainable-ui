import { describe, expect, it } from "vitest";
import { resolveFlowchartOptions, resolveFlowchartRenderer } from "../../src/model/flowchart";
import { resolveLensLayout } from "../../src/model/lensLayout";

const layout = () => ({ columns: "1fr", areas: [["timeTravel"], ["flowchart"]] });

describe("serializable flowchart geometry", () => {
  it("retains the flat default and admits both renderer choices", () => {
    expect(resolveFlowchartRenderer(undefined)).toBe("flat");
    expect(resolveFlowchartOptions(undefined)).toEqual({});
    expect(resolveFlowchartOptions({ renderer: undefined })).toEqual({});
    for (const renderer of ["flat", "isometric"]) {
      expect(resolveFlowchartRenderer(renderer)).toBe(renderer);
      expect(resolveFlowchartOptions({ renderer })).toEqual({ renderer });
    }
  });

  it("keeps an owned copy of JSON geometry alongside the existing area layout", () => {
    const input = { ...layout(), flowchart: { renderer: "isometric" } };
    const result = resolveLensLayout(JSON.parse(JSON.stringify(input)));
    expect(result.order).toEqual(["timeTravel", "flowchart"]);
    expect(result.definition.flowchart).toEqual({ renderer: "isometric" });
    const direct = resolveLensLayout(input);
    input.flowchart.renderer = "flat";
    expect(direct.definition.flowchart).toEqual({ renderer: "isometric" });
    expect(resolveLensLayout(layout()).definition).not.toHaveProperty("flowchart");
  });

  it.each(["3d", "ISOMETRIC", "", null, 3, true])("rejects unsupported renderer %j", renderer => {
    expect(() => resolveFlowchartOptions({ renderer })).toThrow("renderer must be");
    expect(() => resolveLensLayout({ ...layout(), flowchart: { renderer } })).toThrow("renderer must be");
  });

  it("does not execute accessor configuration or accept inherited choices", () => {
    let calls = 0;
    const getter = { get renderer() { calls++; return "isometric"; } };
    expect(() => resolveFlowchartOptions(getter)).toThrow("plain data");
    expect(() => resolveLensLayout({ ...layout(), flowchart: getter })).toThrow("plain data");
    expect(() => resolveLensLayout({ ...layout(), get flowchart() { calls++; return {}; } })).toThrow("plain data");
    expect(() => resolveFlowchartOptions(Object.create({ renderer: "isometric" }))).toThrow("plain object");
    expect(calls).toBe(0);
    expect(resolveFlowchartOptions(Object.assign(Object.create(null), { renderer: "isometric" })))
      .toEqual({ renderer: "isometric" });
  });
});
