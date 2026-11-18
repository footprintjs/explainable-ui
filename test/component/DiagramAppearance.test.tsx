/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiagramDrawingProvider } from "../../src/components/DiagramDrawing";
import { StockNodeAppearance, DiagramNodeAppearance, applyDiagramAppearance, readDiagramObjectAppearance, type DiagramObjectAppearance } from "../../src/components/DiagramAppearance";

import { createDiagramAppearanceProjector } from "../../src/components/DiagramAppearance/model";

import { createDiagramAppearanceReader } from "../../src/model/diagram";

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

  it("reuses unchanged nodes and edges, including fresh equivalent host facts, and clears explicit removals", () => {
    const a = { id: "a", data: { label: "A" } };
    const b = { id: "b", data: { label: "B" } };
    const base = [a, b];
    const project = createDiagramAppearanceProjector<typeof a>();
    const first = project(base, { a: { health: "ok" }, b: { activity: "creating" } });
    const updated = project(base, { a: { health: "ok" }, b: { activity: "updating" } });
    expect(updated[0]).toBe(first[0]);
    expect(updated[1]).not.toBe(first[1]);
    expect(project(base, { a: { health: "ok" }, b: { activity: "updating" } })).toBe(updated);
    const cleared = project(base, { a: { health: "ok" } });
    expect(cleared[1]).toBe(b);
    expect(first[1].data).toHaveProperty("diagramAppearance.activity", "creating");
    const mutable = { progress: { completed: 1, total: 2 } };
    const live = project(base, { a: mutable });
    mutable.progress.completed = 2;
    expect(project(base, { a: mutable })[0].data).toHaveProperty("diagramAppearance.progress.completed", 2);
    expect(live[0].data).toHaveProperty("diagramAppearance.progress.completed", 1);
    const replacement = { ...a, data: { label: "new recording" } };
    expect(project([replacement, b], { a: { health: "ok" } })[0].data.label).toBe("new recording");
  });

  it("projects recorded deltas on their exact predecessor and recovers after missed frames or layout changes", () => {
    const untouched = vi.fn(() => "untouched");
    const graph = [{ id: "a" }, { id: "b" }, { get id() { return untouched(); } }];
    const reader = createDiagramAppearanceReader([
      { step: 0, target: "node", id: "untouched", appearance: { health: "ok" } },
      { step: 1, target: "node", id: "a", appearance: { health: "one" } },
      { step: 2, target: "node", id: "b", appearance: { health: "two" } },
      { step: 3, target: "node", id: "a", appearance: null },
    ]);
    const project = createDiagramAppearanceProjector();
    const first = project(graph, reader.at(0).nodes);
    project(graph, reader.at(1).nodes); // also builds the position index
    untouched.mockClear();
    const next = project(graph, reader.at(2).nodes);
    expect(untouched).not.toHaveBeenCalled();
    expect(next[2]).toBe(first[2]);
    reader.at(3);
    reader.at(0);
    const recovered = project(graph, reader.at(1).nodes);
    expect(recovered[1]).toBe(graph[1]);
    expect(recovered[0].data?.diagramAppearance).toEqual({ health: "one" });
    const changedLayout = project([graph[2], graph[0], graph[0]], reader.at(3).nodes);
    expect(changedLayout[0]).toBe(first[2]);
    expect(project([graph[0], graph[0]], reader.at(1).nodes).map(n => n.data?.diagramAppearance))
      .toEqual([{ health: "one" }, { health: "one" }]);
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
