/** @vitest-environment jsdom */
import * as React from "react";
import { createRef, forwardRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  FootprintTheme, FootprintButton, FootprintTab, FootprintInput, FootprintCheckbox,
  FootprintBadge, FootprintCode, FootprintTooltip, FootprintIcon,
  useFootprintTheme, useFootprintComponents, componentStyles, tokensToCSSVars,
  type FootprintComponents, type ThemeTokens,
} from "../../src/theme";

const HostButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function HostButton(props, ref) {
  return <button {...props} ref={ref} data-host="button" />;
});
const HostInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function HostInput(props, ref) {
  return <input {...props} ref={ref} data-host="input" />;
});

function ThemeReadout() {
  const tokens = useFootprintTheme();
  const components = useFootprintComponents();
  return <output>{JSON.stringify({ tokens, buttonInherited: components.Button === HostButton })}</output>;
}

describe("consumer theme and primitive contract", () => {
  it("emits only local overrides while nested contexts inherit fields and adapters", () => {
    render(<FootprintTheme components={{ Button: HostButton }} tokens={{
      colors: { primary: "navy", onPrimary: "white" }, typography: { body: "16px", lineHeight: "1.8" }, controls: { height: "40px" },
    }}>
      <FootprintTheme components={{ Button: undefined }} tokens={{ colors: { warning: "orange", primary: undefined }, typography: { small: "12px" } }}>
        <ThemeReadout /><FootprintButton data-fp-part="kept">Nested</FootprintButton>
      </FootprintTheme>
    </FootprintTheme>);
    const wrappers = document.querySelectorAll<HTMLElement>(".fp-theme-root");
    expect(wrappers[0].style.getPropertyValue("--fp-font-size-body")).toBe("16px");
    expect(wrappers[1].style.getPropertyValue("--fp-font-size-body")).toBe("");
    expect(wrappers[1].style.getPropertyValue("--fp-color-primary")).toBe("");
    expect(wrappers[1].style.getPropertyValue("--fp-color-warning")).toBe("orange");
    const context = JSON.parse(screen.getByRole("status").textContent!);
    expect(context.tokens.colors).toMatchObject({ primary: "navy", onPrimary: "white", warning: "orange" });
    expect(context.tokens.typography).toMatchObject({ body: "16px", lineHeight: "1.8", small: "12px" });
    expect(context.tokens.controls.height).toBe("40px");
    expect(context.buttonInherited).toBe(true);
    expect(screen.getByRole("button", { name: "Nested" }).getAttribute("data-fp-part")).toBe("kept");
  });

  it("gives host controls native state, actions, refs and accessibility without fallback paint", () => {
    const click = vi.fn(), change = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(<form><FootprintTheme components={{ Button: HostButton, Input: HostInput }}>
      <FootprintButton ref={ref} aria-pressed="true" aria-label="Inspect value" onClick={click}
        defaultStyle={{ background: "red", padding: 99 }} style={{ marginLeft: 3 }} data-fp="trace-value">Inspect</FootprintButton>
      <FootprintTab disabled aria-label="Unavailable tab">Unavailable</FootprintTab>
      <FootprintInput aria-label="Find key" value="rate" onChange={change} defaultStyle={{ background: "red" }} />
    </FootprintTheme></form>);
    const button = screen.getByRole("button", { name: "Inspect value" });
    expect(ref.current).toBe(button);
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("data-fp")).toBe("trace-value");
    expect(button.style.background).toBe("");
    expect(button.style.padding).toBe("");
    expect(button.style.marginLeft).toBe("3px");
    fireEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Unavailable tab" }).getAttribute("disabled")).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Unavailable tab" }));
    expect(click).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByRole("textbox", { name: "Find key" }), { target: { value: "tax" } });
    expect(change).toHaveBeenCalledOnce();
  });

  it("supports native checkbox semantics and custom presentation without changing the event", () => {
    const toggle = vi.fn();
    const ref = createRef<HTMLInputElement>();
    render(<FootprintTheme components={{ Checkbox: HostInput }}>
      <label><FootprintCheckbox ref={ref} checked onChange={toggle} aria-describedby="help" defaultStyle={{ width: 500 }} /> Follow cursor</label>
      <span id="help">Recorded steps only</span>
    </FootprintTheme>);
    const checkbox = screen.getByRole("checkbox", { name: "Follow cursor" }) as HTMLInputElement;
    expect(ref.current).toBe(checkbox);
    expect(checkbox.type).toBe("checkbox");
    expect(checkbox.checked).toBe(true);
    expect(checkbox.style.width).toBe("");
    expect(checkbox.getAttribute("aria-describedby")).toBe("help");
    fireEvent.click(checkbox);
    expect(toggle).toHaveBeenCalledOnce();
    expect(toggle.mock.calls[0][0].type).toBe("change");
  });

  it("retains semantic content and explicit consumer styles in unstyled native primitives", () => {
    const { container } = render(<>
      <FootprintButton unstyled defaultStyle={{ padding: 99 }}>Return</FootprintButton>
      <FootprintTab unstyled>Stage</FootprintTab>
      <FootprintInput unstyled aria-label="Search" />
      <FootprintCheckbox unstyled aria-label="Follow" />
      <FootprintBadge unstyled>Recorded</FootprintBadge>
      <FootprintCode unstyled>rate</FootprintCode>
      <FootprintTooltip unstyled content="Recorded source"><FootprintIcon unstyled name="source" aria-hidden="true">↳</FootprintIcon></FootprintTooltip>
      <FootprintButton unstyled style={{ color: "rebeccapurple" }}>Host style</FootprintButton>
    </>);
    expect(container.querySelectorAll("[style]")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Host style" }).style.color).toBe("rebeccapurple");
    expect(screen.getByTitle("Recorded source").textContent).toBe("↳");
    expect(screen.getByRole("button", { name: "Return" }).getAttribute("type")).toBe("button");
    expect(container.textContent).toContain("Recordedrate");
  });

  it("routes each visual primitive to its adapter while preserving host metadata", () => {
    const components: FootprintComponents = {
      Badge: props => <mark {...props} data-host="badge" />,
      Code: props => <code {...props} data-host="code" />,
      Tooltip: ({ content, ...props }) => <span {...props} data-host="tooltip" title={content} />,
      Icon: ({ name, ...props }) => <span {...props} data-host="icon" data-name={name} />,
    };
    const { container } = render(<FootprintTheme components={components}>
      <FootprintBadge part="read-label" defaultStyle={{ color: "red" }}>Read</FootprintBadge>
      <FootprintCode data-key="rate">rate</FootprintCode>
      <FootprintTooltip content="Exact visit"><FootprintIcon name="visit">•</FootprintIcon></FootprintTooltip>
    </FootprintTheme>);
    expect(container.querySelector('[data-host="badge"]')?.getAttribute("data-fp-part")).toBe("read-label");
    expect(container.querySelector('[data-host="badge"]')?.getAttribute("style")).toBeNull();
    expect(container.querySelector('[data-host="code"]')?.getAttribute("data-key")).toBe("rate");
    expect(container.querySelector('[data-host="tooltip"]')?.getAttribute("title")).toBe("Exact visit");
    expect(container.querySelector('[data-host="icon"]')?.getAttribute("data-name")).toBe("visit");
  });

  it("distinguishes an omitted default recipe from explicit no-paint migration props", () => {
    render(<>
      <FootprintButton>Default recipe</FootprintButton>
      <FootprintButton defaultStyle={undefined}>Existing plain button</FootprintButton>
      <FootprintTab defaultStyle={undefined}>Existing plain tab</FootprintTab>
      <FootprintInput defaultStyle={undefined} aria-label="Existing plain input" />
      <FootprintCheckbox defaultStyle={undefined} aria-label="Existing plain checkbox" />
      <FootprintBadge defaultStyle={undefined}>Existing plain badge</FootprintBadge>
      <FootprintCode defaultStyle={undefined}>Existing plain code</FootprintCode>
      <FootprintIcon name="visit" defaultStyle={undefined}>Existing plain icon</FootprintIcon>
    </>);
    expect(screen.getByRole("button", { name: "Default recipe" }).getAttribute("style")).toContain("--fp-font-size-body");
    expect(document.querySelectorAll("[style]")).toHaveLength(1);
  });

  it("maps global radii, component recipes and semantic foreground pairs explicitly", () => {
    const vars = tokensToCSSVars({
      radius: "0px", radii: { badge: "20px" },
      colors: { nodeCursor: "navy", onNodeCursor: "white", tracing: "yellow", onTracing: "black" },
      typography: { body: "1rem", lineHeight: "1.8", weightStrong: "800" },
      spacing: { md: "20px" }, controls: { height: "44px" }, motion: { duration: "0ms" },
      elevation: { panel: "none" },
    });
    expect(vars).toMatchObject({
      "--fp-radius": "0px", "--fp-radius-control": "0px", "--fp-radius-panel": "0px", "--fp-radius-badge": "20px",
      "--fp-node-cursor": "navy", "--fp-on-node-cursor": "white", "--fp-tracing": "yellow", "--fp-on-tracing": "black",
      "--fp-font-size-body": "1rem", "--fp-line-height": "1.8", "--fp-font-weight-strong": "800",
      "--fp-space-md": "20px", "--fp-control-height": "44px", "--fp-motion-duration": "0ms", "--fp-shadow-panel": "none",
    });
    expect(componentStyles("compact").body).toContain("--fp-font-size-body");
    expect(componentStyles("compact").body).not.toBe(componentStyles("detailed").body);
    expect(componentStyles("compact").padding).not.toBe(componentStyles("detailed").padding);
  });

  it("applies theme to a single child without changing its layout, ref, events or authored style", () => {
    const ref = createRef<HTMLDivElement>(), click = vi.fn();
    const { container } = render(<FootprintTheme asChild tokens={{ colors: { primary: "purple" } }} components={{ Button: HostButton }}>
      <div ref={ref} className="consumer-shell" style={{ display: "flex", minHeight: 300, "--fp-color-primary": "navy" } as React.CSSProperties} onClick={click}>
        <ThemeReadout /><FootprintButton>Inspect</FootprintButton>
      </div>
    </FootprintTheme>);
    expect(container.children).toHaveLength(1);
    const child = container.firstElementChild as HTMLDivElement;
    expect(ref.current).toBe(child);
    expect(child.classList.contains("consumer-shell")).toBe(true);
    expect(child.classList.contains("fp-theme-root")).toBe(true);
    expect(child.style.display).toBe("flex");
    expect(child.style.minHeight).toBe("300px");
    expect(child.style.getPropertyValue("--fp-color-primary")).toBe("navy");
    expect(screen.getByRole("button", { name: "Inspect" }).getAttribute("data-host")).toBe("button");
    fireEvent.click(child);
    expect(click).toHaveBeenCalledOnce();
  });

  it("rejects an asChild fragment rather than silently losing theme variables", () => {
    expect(() => renderToStaticMarkup(<FootprintTheme asChild><><div /></></FootprintTheme>)).toThrow(/non-fragment React element/);
  });

  it("server-renders the same local CSS contract without browser APIs", () => {
    const tokens: ThemeTokens = { controls: { height: "42px" }, colors: { onNodeCursor: "white" } };
    const html = renderToStaticMarkup(<FootprintTheme tokens={tokens}><FootprintButton>Inspect</FootprintButton></FootprintTheme>);
    expect(html).toContain("--fp-control-height:42px");
    expect(html).toContain("--fp-on-node-cursor:white");
    expect(html).toContain('type="button"');
    expect(html).toContain("Inspect");
  });
});
