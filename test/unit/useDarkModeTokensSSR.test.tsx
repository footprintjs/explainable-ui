/** @vitest-environment node */
/**
 * useDarkModeTokens on the server.
 *
 * The hook read `document.documentElement` inside its `useState`
 * INITIALIZER, which runs during render — including a server render, where
 * there is no `document`. Any Next.js app that called the library's own
 * theme bridge crashed on the server before rendering a byte.
 *
 * OLD BEHAVIOUR: this file throws
 * "ReferenceError: document is not defined" on the first render.
 */
import { describe, it, expect } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { useDarkModeTokens } from "../../src/theme/useDarkModeTokens";
import { coolLight, warmLight } from "../../src/theme/presets";

function Probe({ options }: { options?: Parameters<typeof useDarkModeTokens>[0] }) {
  const tokens = useDarkModeTokens(options);
  return React.createElement("span", null, tokens.colors?.bgPrimary ?? "");
}

describe("useDarkModeTokens — server render", () => {
  it("does not touch `document` during render", () => {
    expect(typeof document).toBe("undefined"); // the environment this guards
    expect(() => renderToString(React.createElement(Probe))).not.toThrow();
  });

  it("renders the LIGHT tokens on the server — dark is not assumed", () => {
    const html = renderToString(React.createElement(Probe));
    expect(html).toContain(coolLight.colors!.bgPrimary!);
  });

  it("honours a custom light palette on the server too", () => {
    const html = renderToString(
      React.createElement(Probe, { options: { light: warmLight } }),
    );
    expect(html).toContain(warmLight.colors!.bgPrimary!);
  });
});
