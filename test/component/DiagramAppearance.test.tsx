/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiagramDrawingProvider } from "../../src/components/DiagramDrawing";
import { StockNodeAppearance, DiagramNodeAppearance, applyDiagramAppearance, readDiagramObjectAppearance, type DiagramObjectAppearance } from "../../src/components/DiagramAppearance";

afterEach(cleanup);

describe("diagram object facts", () => {
  it("keeps ordinary chart markup and retains the opted-in paint layer when a frame clears", () => {
    const view = (enableAppearance?: boolean, appearance?: DiagramObjectAppearance) =>
      <DiagramDrawingProvider enableAppearance={enableAppearance}>
        <StockNodeAppearance appearance={appearance}><button>Host drawing</button></StockNodeAppearance>
      </DiagramDrawingProvider>;
    const ui = render(view());
    expect(screen.getByRole("button").parentElement).toBe(ui.container);
    ui.rerender(view(true));
    const drawing = screen.getByRole("button");
    const paint = drawing.parentElement;
    expect(paint?.getAttribute("data-fp")).toBe("diagram-node-paint");
    ui.rerender(view(true, { presence: "removed" }));
    ui.rerender(view());
    expect(screen.getByRole("button")).toBe(drawing);
    expect(drawing.parentElement).toBe(paint);
  });

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

  it("keeps an invisible native handle hidden and compounds the alpha of a dimmed drawing", () => {
    const view = (appearance?: DiagramObjectAppearance) => <div><DiagramNodeAppearance appearance={appearance}>
      <span className="react-flow__handle" data-testid="handle" style={{ opacity: 0 }} />
      <div data-testid="dimmed" style={{ opacity: 0.25, filter: "drop-shadow(2px 2px 1px blue)" }}>Body</div>
    </DiagramNodeAppearance></div>;
    const { rerender } = render(view({ presence: "removed" }));
    for (const [name, opacity] of [["handle", "0"], ["dimmed", "0.25"]]) {
      const paint = getComputedStyle(screen.getByTestId(name));
      expect(paint.opacity).toBe(opacity);

    }
    const dimmed = screen.getByTestId("dimmed"), paint = dimmed.parentElement!;
    expect(paint.getAttribute("data-fp")).toBe("diagram-node-paint");
    expect(paint.style.opacity).toBe("var(--fp-diagram-removed-opacity, 0.4)");
    expect(getComputedStyle(dimmed).filter).toBe("drop-shadow(2px 2px 1px blue)");
    rerender(view({ activity: "removing" }));
    expect(getComputedStyle(screen.getByTestId("handle")).opacity).toBe("0");
    expect(screen.getByTestId("dimmed")).toBe(dimmed);
    expect(getComputedStyle(dimmed).filter).toBe("drop-shadow(2px 2px 1px blue)");
    expect(paint.style.opacity).toBe("");
    expect(paint.style.display).toBe("contents");
  });

  it("draws progress on the node, preserves stateful children through removal and rewind, and leaves ordinary layout unchanged", () => {
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
    const paint = drawing.parentElement!;
    expect(paint.dataset.presence).toBe("removed");
    expect(paint.nextElementSibling?.getAttribute("data-fp")).toBe("diagram-node-appearance");
    rerender(view({ presence: "removed" }, true));
    expect(paint.style.opacity).toBe("");
    expect(paint.style.display).toBe("contents");
    rerender(view());
    expect(screen.getByTestId("footprint").children).toHaveLength(1);
    expect(screen.getByRole("textbox")).toBe(drawing);
    expect((drawing as HTMLInputElement).value).toBe("live");
  });
});
