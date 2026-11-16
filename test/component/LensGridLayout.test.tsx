/** @vitest-environment jsdom */
import { createRef, useState } from "react";
import { fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LensGridLayout, type LensGridLayoutProps } from "../../src/components/ExplainableShell/_internal/LensGridLayout";
import type { LensLayoutDefinition, LensLayoutSurface } from "../../src/model/lensLayout";

const layout: LensLayoutDefinition = {
  columns: "minmax(0, 2fr) minmax(0, 1fr)",
  rows: "auto minmax(0, 1fr) 120px",
  areas: [["timeTravel", "timeTravel"], ["flowchart", "details"], ["timeline", "timeline"]],
  gap: 8,
};

function props(overrides: Partial<LensGridLayoutProps> = {}): LensGridLayoutProps {
  return {
    layout,
    isNarrow: false,
    surfaces: Object.fromEntries(["timeTravel", "flowchart", "developer", "commentary", "timeline", "details"]
      .map(name => [name, <div key={name}>{name} content</div>])) as Record<LensLayoutSurface, React.ReactNode>,
    ...overrides,
  };
}

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('[data-fp="explainable-shell"]')!;
}

describe("LensGridLayout", () => {
  it("uses named grid areas, mounts spanning surfaces once and hides omitted panels", () => {
    const view = render(<LensGridLayout {...props()} />);
    const shell = root(view.container);
    expect(shell.dataset.layout).toBe("grid");
    expect(shell.style.display).toBe("grid");
    expect(shell.style.height).toBe("100%");
    expect(shell.style.minHeight).toBe("0px");
    expect(shell.style.gridTemplateColumns).toBe(layout.columns);
    expect(shell.style.gridTemplateRows).toBe(layout.rows);
    expect(shell.style.gridTemplateAreas).toBe('"timeTravel timeTravel" "flowchart details" "timeline timeline"');
    expect(shell.style.gap).toBe("8px");
    expect(view.getAllByText("timeTravel content")).toHaveLength(1);
    expect(view.getAllByText("timeline content")).toHaveLength(1);
    expect(view.queryByText("developer content")).toBeNull();
    expect(view.queryByText("commentary content")).toBeNull();
    expect(view.getByRole("region", { name: "Workflow" }).style.gridArea).toBe("flowchart");
  });

  it("stacks in first-appearance order with a scrollable chart and details footprint", () => {
    const view = render(<LensGridLayout {...props({ isNarrow: true })} />);
    const shell = root(view.container);
    expect(shell.style.display).toBe("flex");
    expect(shell.style.flexDirection).toBe("column");
    expect(shell.style.overflow).toBe("auto");
    expect(shell.style.gridTemplateAreas).toBe("");
    expect(Array.from(shell.children).map(child => child.getAttribute("data-fp-surface")))
      .toEqual(["timeTravel", "flowchart", "details", "timeline"]);
    expect(view.getByRole("region", { name: "Workflow" }).style.minHeight).toBe("320px");
    expect(view.getByRole("region", { name: "Details" }).style.minHeight).toBe("240px");
    expect(view.getByRole("region", { name: "Details" }).style.overflow).toBe("auto");
  });

  it("retains mounted surface state when rearranged and when the responsive mode changes", () => {
    function Counter() {
      const [count, setCount] = useState(0);
      return <button onClick={() => setCount(count + 1)}>Count {count}</button>;
    }
    const initial = props();
    initial.surfaces.flowchart = <Counter />;
    const view = render(<LensGridLayout {...initial} />);
    fireEvent.click(view.getByRole("button", { name: "Count 0" }));
    const rearranged: LensLayoutDefinition = {
      columns: "1fr 2fr", areas: [["details", "flowchart"], ["timeTravel", "timeTravel"]],
    };
    view.rerender(<LensGridLayout {...initial} layout={rearranged} isNarrow />);
    expect(view.getByRole("button", { name: "Count 1" })).toBeTruthy();
    expect(Array.from(root(view.container).children).map(child => child.getAttribute("data-fp-surface")))
      .toEqual(["details", "flowchart", "timeTravel"]);
  });

  it("provides the same semantic surfaces unstyled without builtin inline geometry or paint", () => {
    const view = render(<LensGridLayout {...props({ unstyled: true, isNarrow: true,
      themeStyle: { background: "red", fontSize: 14 } })} />);
    const shell = root(view.container);
    expect(shell.hasAttribute("style")).toBe(false);
    for (const section of shell.querySelectorAll("section")) expect(section.hasAttribute("style")).toBe(false);
    expect(view.getByRole("region", { name: "Workflow" }).textContent).toBe("flowchart content");
    expect(view.getByRole("region", { name: "Time travel" })).toBeTruthy();
    view.rerender(<LensGridLayout {...props({ unstyled: true, style: { display: "grid", gap: 20 } })} />);
    expect(root(view.container).style.display).toBe("grid");
    expect(root(view.container).style.gap).toBe("20px");
  });

  it("forwards the existing root ref, keyboard handling and explicit host styles", () => {
    const containerRef = createRef<HTMLDivElement>();
    const onKeyDown = vi.fn();
    const view = render(<LensGridLayout {...props({ containerRef, onKeyDown, className: "host-layout",
      themeStyle: { color: "red" }, style: { minHeight: 560, gap: 20, color: "blue" } })} />);
    expect(containerRef.current).toBe(root(view.container));
    expect(containerRef.current!.className).toBe("host-layout");
    expect(containerRef.current!.style.minHeight).toBe("560px");
    expect(containerRef.current!.style.gap).toBe("20px");
    expect(containerRef.current!.style.color).toBe("blue");
    fireEvent.keyDown(containerRef.current!, { key: "ArrowRight" });
    expect(onKeyDown).toHaveBeenCalledOnce();
  });

  it("validates invalid definitions during server rendering without a CSSOM", () => {
    expect(() => renderToString(<LensGridLayout {...props({ layout: {
      columns: "1fr", areas: [["flowchart"]],
    } })} />)).toThrow(/Invalid Lens layout:.*timeTravel.*flowchart/);
    expect(renderToString(<LensGridLayout {...props()} />)).toContain('data-layout="grid"');
  });

  it("renders a descriptor-read copy without executing stored array methods during SSR", () => {
    const execute = vi.fn(() => { throw new Error("stored method must not execute"); });
    const areas = [["timeTravel"], ["flowchart"]];
    Object.defineProperty(areas, "map", { get: execute });
    Object.defineProperty(areas, "join", { get: execute });
    Object.defineProperty(areas, Symbol.iterator, { get: execute });
    for (const row of [areas[0], areas[1]]) {
      Object.defineProperty(row, "map", { get: execute });
      Object.defineProperty(row, "join", { get: execute });
      Object.defineProperty(row, Symbol.iterator, { get: execute });
    }
    const html = renderToString(<LensGridLayout {...props({
      layout: { columns: "1fr", areas } as LensLayoutDefinition,
    })} />);
    expect(html).toContain("grid-template-areas:&quot;timeTravel&quot; &quot;flowchart&quot;");
    expect(html.split("<!-- -->").join("")).toContain("flowchart content");
    expect(execute).not.toHaveBeenCalled();
  });

  it.each([false, true])("ignores inherited optional CSS fields during SSR: own undefined=%s", ownUndefined => {
    const inherited = vi.fn(() => { throw new Error("inherited field must not execute"); });
    const names = ["rows", "minHeight", "gap"] as const;
    const previous = names.map(name => Object.getOwnPropertyDescriptor(Object.prototype, name));
    try {
      for (const name of names) Object.defineProperty(Object.prototype, name, { configurable: true, get: inherited });
      const definition: LensLayoutDefinition = {
        columns: "1fr", areas: [["timeTravel"], ["flowchart"]],
        ...(ownUndefined ? { rows: undefined, minHeight: undefined, gap: undefined } : {}),
      };
      const html = renderToString(<LensGridLayout {...props({ layout: definition })} />);
      expect(html).toContain("min-height:0");
      expect(html).not.toContain("grid-template-rows");
      expect(inherited).not.toHaveBeenCalled();
    } finally {
      names.forEach((name, index) => {
        if (previous[index]) Object.defineProperty(Object.prototype, name, previous[index]!);
        else Reflect.deleteProperty(Object.prototype, name);
      });
    }
  });
});
