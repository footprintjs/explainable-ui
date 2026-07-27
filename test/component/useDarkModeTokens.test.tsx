/** @vitest-environment jsdom */
/**
 * useDarkModeTokens in the browser.
 *
 * The option was documented as "CSS selector" and used as a class name
 * (`classList.contains`), so the two spellings a real app most likely passes
 * — `.dark` and `[data-theme="dark"]` — silently never matched and the UI
 * stayed light-tokened while the app was dark. Both work now, and the option
 * is called `darkClass` so its plain reading is also true.
 *
 * OLD BEHAVIOUR: the `.dark` and `[data-theme]` cases below return the LIGHT
 * tokens no matter what the document says.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import * as React from "react";
import { useDarkModeTokens } from "../../src/theme/useDarkModeTokens";
import { coolDark, coolLight } from "../../src/theme/presets";

function Probe({ options }: { options?: Parameters<typeof useDarkModeTokens>[0] }) {
  const tokens = useDarkModeTokens(options);
  return React.createElement("span", { "data-testid": "bg" }, tokens.colors?.bgPrimary ?? "");
}

function shown(options?: Parameters<typeof useDarkModeTokens>[0]): string {
  const { getByTestId } = render(React.createElement(Probe, { options }));
  return getByTestId("bg").textContent ?? "";
}

const DARK = coolDark.colors!.bgPrimary!;
const LIGHT = coolLight.colors!.bgPrimary!;

afterEach(() => {
  cleanup();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-theme");
});

describe("useDarkModeTokens — how an app says 'dark'", () => {
  it("reads Tailwind's bare `dark` class by default", () => {
    expect(shown()).toBe(LIGHT);
    cleanup();
    document.documentElement.classList.add("dark");
    expect(shown()).toBe(DARK);
  });

  it("accepts the SELECTOR spelling of the same class", () => {
    document.documentElement.classList.add("dark");
    expect(shown({ darkClass: ".dark" })).toBe(DARK);
  });

  it("accepts an attribute selector — the other common switch", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    expect(shown({ darkClass: '[data-theme="dark"]' })).toBe(DARK);
  });

  it("still reads the old `selector` option name", () => {
    document.documentElement.classList.add("night");
    expect(shown({ selector: "night" })).toBe(DARK);
  });

  it("survives an unparseable selector instead of crashing the UI", () => {
    expect(() => shown({ darkClass: "[[[" })).not.toThrow();
  });
});

describe("useDarkModeTokens — follows the switch while mounted", () => {
  it("re-themes when the class is added later", async () => {
    const { getByTestId } = render(React.createElement(Probe));
    expect(getByTestId("bg").textContent).toBe(LIGHT);
    await act(async () => {
      document.documentElement.classList.add("dark");
      // MutationObserver delivers on a microtask.
      await Promise.resolve();
    });
    expect(getByTestId("bg").textContent).toBe(DARK);
  });

  it("re-themes when a data-attribute switch flips", async () => {
    const { getByTestId } = render(
      React.createElement(Probe, { options: { darkClass: '[data-theme="dark"]' } }),
    );
    await act(async () => {
      document.documentElement.setAttribute("data-theme", "dark");
      await Promise.resolve();
    });
    expect(getByTestId("bg").textContent).toBe(DARK);
    await act(async () => {
      document.documentElement.setAttribute("data-theme", "light");
      await Promise.resolve();
    });
    expect(getByTestId("bg").textContent).toBe(LIGHT);
  });
});
