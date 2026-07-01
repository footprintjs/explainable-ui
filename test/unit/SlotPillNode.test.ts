/**
 * Component tests for SlotPillNode — the slim context-slot pill whose lit/unlit
 * state is the Static-vs-Dynamic agent signal (a lit pill = the Context selector
 * engineered that slot this turn; unlit = it didn't).
 *
 * The lit decision is `active || selected`; dimmed (but not lit) fades to 0.45.
 * These pin that visual contract so the signal can't silently regress.
 *
 * Rendered via renderToStaticMarkup inside a ReactFlowProvider (the node uses
 * xyflow <Handle>, which needs the store context). Assertions read the pill's
 * inline style from the HTML.
 */

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReactFlowProvider } from "@xyflow/react";
import { SlotPillNode } from "../../src/components/SlotPillNode";
import type { SlotPillNodeData } from "../../src/components/SlotPillNode";
import { rawDefaults } from "../../src/theme/tokens";

const C = rawDefaults.colors;

/** Render the pill with the given data, return the static HTML string. */
function render(data: Partial<SlotPillNodeData>): string {
  const props = { data: { label: "system-prompt", ...data } } as unknown as Parameters<typeof SlotPillNode>[0];
  return renderToStaticMarkup(
    createElement(ReactFlowProvider, null, createElement(SlotPillNode, props)),
  );
}

describe("SlotPillNode", () => {
  it("functional: renders the slot label + a title attribute", () => {
    const html = render({ label: "tools" });
    expect(html).toContain("tools");
    expect(html).toContain('title="tools"');
  });

  // The lit glow is `box-shadow:0 0 0 2px ...`; unlit is `box-shadow:none`.
  const GLOW = "box-shadow:0 0 0 2px";

  it("unit: LIT when active — primary border + glow (box-shadow)", () => {
    const html = render({ label: "messages", active: true });
    expect(html).toContain(C.primary); // primary-colored border/accent (as the var() fallback)
    expect(html).toContain(GLOW); // the lit glow
    // Lit background is a 14% primary tint via color-mix over the resting bg —
    // theme-aware (follows dark/light), replacing the old hardcoded rgba().
    expect(html).toContain("14%");
  });

  it("unit: LIT when selected (selector pick) — same lit treatment as active", () => {
    const litViaSelected = render({ label: "x", selected: true });
    const litViaActive = render({ label: "x", active: true });
    // Both selected and active drive the same lit visual (border + glow).
    expect(litViaSelected).toContain(GLOW);
    expect(litViaSelected).toContain(C.primary);
    // The two lit paths produce identical markup.
    expect(litViaSelected).toBe(litViaActive);
  });

  it("unit: UNLIT (neither active nor selected) — muted border, no glow", () => {
    const html = render({ label: "messages" });
    expect(html).toContain(C.border); // muted border, not primary
    expect(html).toContain("box-shadow:none"); // explicitly no lit glow
    expect(html).not.toContain(GLOW);
  });

  it("unit: dimmed AND unlit fades to 0.45 (the not-engineered-this-turn signal)", () => {
    const html = render({ label: "tools", dimmed: true });
    expect(html).toContain("opacity:0.45");
  });

  it("unit: lit WINS over dimmed — a picked slot is never faded", () => {
    const html = render({ label: "tools", dimmed: true, active: true });
    expect(html).not.toContain("opacity:0.45");
    expect(html).toContain(GLOW); // still lit
  });

  it("functional: renders an icon when provided", () => {
    const html = render({ label: "tools", icon: "🔧" });
    expect(html).toContain("🔧");
  });
});
