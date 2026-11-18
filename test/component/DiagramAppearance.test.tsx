/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiagramNodeAppearance, applyDiagramAppearance, readDiagramObjectAppearance, type DiagramObjectAppearance } from "../../src/components/DiagramAppearance";

afterEach(cleanup);

describe("diagram object facts", () => {
  it("preserves direct node/edge data and clears it only for an explicit snapshot", () => {
    const untouched = Object.freeze({ id: "other" });
    const original = Object.freeze({ id: "source", data: Object.freeze({ label: "kept", diagramAppearance: { health: "existing" } }) });
    const entries = [original, untouched];
    expect(applyDiagramAppearance(entries)).toBe(entries);
    const current = applyDiagramAppearance(entries, { source: { activity: "creating", progress: { completed: 0, total: 3 } } });
    expect(current[0]).toEqual({ id: "source", data: { label: "kept", diagramAppearance: { activity: "creating", progress: { completed: 0, total: 3 } } } });
    expect(current[1]).toBe(untouched);
    expect(applyDiagramAppearance(current, {})).toEqual([{ id: "source", data: { label: "kept" } }, untouched]);
    expect(original.data.diagramAppearance).toEqual({ health: "existing" });
  });

  it("accepts exact own IDs and data fields without invoking accessors", () => {
    const getter = vi.fn(() => ({ activity: "creating" }));
    const map = Object.create({ inherited: { presence: "removed" } });
    Object.defineProperty(map, "trap", { get: getter });
    const entries = ["inherited", "trap", "__proto__", "constructor"].map(id => ({ id }));
    expect(applyDiagramAppearance(entries, map)).toBe(entries);
    expect(readDiagramObjectAppearance({ get progress() { getter(); return undefined; }, health: " healthy " })).toEqual({ health: "healthy" });
    expect(getter).not.toHaveBeenCalled();
  });

  it.each([[1, 0], [1, -1], [-1, 2], [6, 5], [NaN, 10], [0, Infinity], [Infinity, 10]])(
    "omits an invalid measurement %s of %s without losing independent activity and health", (completed, total) => {
      expect(readDiagramObjectAppearance({ activity: "removing", health: "needs attention", progress: { completed, total } }))
        .toEqual({ activity: "removing", health: "needs attention" });
    });

  it("retains fractional measured values and units", () => {
    expect(readDiagramObjectAppearance({ progress: { completed: 0.25, total: 0.5, unit: " MB " } }))
      .toEqual({ progress: { completed: 0.25, total: 0.5, unit: "MB" } });
  });

  it("draws progress on the node, preserves stateful children through removal and rewind, and keeps ordinary markup", () => {
    const view = (appearance?: DiagramObjectAppearance, unstyled?: boolean) =>
      <div data-testid="footprint"><DiagramNodeAppearance appearance={appearance} unstyled={unstyled}>
        <input aria-label="Drawing" defaultValue="initial" />
      </DiagramNodeAppearance></div>;
    const { container, rerender } = render(view());
    const drawing = screen.getByRole("textbox");
    expect(screen.getByTestId("footprint").children).toHaveLength(1);
    fireEvent.change(drawing, { target: { value: "live" } });
    rerender(view({ activity: "creating" }));
    expect(screen.getByText("Creating")).toBeTruthy();
    expect(container.querySelector('[data-fp="diagram-node-ring"]')).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
    const progress = (completed: number) => ({ completed, total: 6, unit: "files" });
    rerender(view({ activity: "updating", progress: progress(0), health: "attention" }));
    const meter = screen.getByRole("progressbar", { name: "Progress in files" });
    expect(meter.getAttribute("aria-valuenow")).toBe("0");
    expect(meter.querySelector('[data-fp="diagram-node-progress"]')?.getAttribute("stroke")).toBe("none");
    expect((meter.parentElement as HTMLElement).style.pointerEvents).toBe("none");
    expect((meter.parentElement as HTMLElement).style.inset).toBe("0px");
    expect(screen.getByText("Updating · 0 of 6 files · Health · attention")).toBeTruthy();
    rerender(view({ activity: "removing", progress: progress(3) }));
    expect(meter.querySelector('[data-fp="diagram-node-progress"]')?.getAttribute("stroke-dasharray")).toBe("0.5 1");
    expect(container.querySelector("style")).toBeNull();
    rerender(view({ presence: "removed" }));
    expect(screen.getByText("Removed")).toBeTruthy();
    expect(container.querySelector("style")?.nextElementSibling).toBe(drawing);
    expect(drawing.nextElementSibling?.getAttribute("data-presence")).toBe("removed");
    rerender(view({ presence: "removed" }, true));
    expect(container.querySelector("style")).toBeNull();
    rerender(view());
    expect(screen.getByTestId("footprint").children).toHaveLength(1);
    expect(screen.getByRole("textbox")).toBe(drawing);
    expect((drawing as HTMLInputElement).value).toBe("live");
  });
});
