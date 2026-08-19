import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StageDetailPanel, DEFAULT_EXCLUDED_KEYS } from "../../src/components/StageDetailPanel";
import type { StageSnapshot } from "../../src/types";

function snap(overrides: Partial<StageSnapshot> = {}): StageSnapshot {
  return {
    stageName: "stage-1",
    stageLabel: "CreateOrder",
    memory: { orderId: "ORD-1", total: 100 },
    narrative: "Created order ORD-1 with total 100.",
    startMs: 0,
    durationMs: 12,
    status: "done",
    description: "Initialize order and customer data",
    ...overrides,
  };
}

function render(props: Parameters<typeof StageDetailPanel>[0]): string {
  return renderToStaticMarkup(createElement(StageDetailPanel, props));
}

describe("StageDetailPanel", () => {
  // ── Simple mode ──────────────────────────────────────────────────────

  describe("simple mode", () => {
    it("renders stage label", () => {
      const html = render({ snapshots: [snap()], selectedIndex: 0, mode: "simple" });
      expect(html).toContain("CreateOrder");
    });

    it("renders description when present", () => {
      const html = render({ snapshots: [snap()], selectedIndex: 0, mode: "simple" });
      expect(html).toContain("Initialize order and customer data");
    });

    it("renders narrative text", () => {
      const html = render({ snapshots: [snap()], selectedIndex: 0, mode: "simple" });
      expect(html).toContain("Created order ORD-1 with total 100.");
    });

    it("renders status badge", () => {
      const html = render({ snapshots: [snap()], selectedIndex: 0, mode: "simple" });
      expect(html).toContain("done");
    });

    it("renders duration", () => {
      const html = render({ snapshots: [snap()], selectedIndex: 0, mode: "simple" });
      expect(html).toContain("12ms");
    });

    it("omits description when not set", () => {
      const s = snap({ description: undefined });
      const html = render({ snapshots: [s], selectedIndex: 0, mode: "simple" });
      expect(html).not.toContain("Initialize order");
    });

    it("omits narrative when empty", () => {
      const s = snap({ narrative: "" });
      const html = render({ snapshots: [s], selectedIndex: 0, mode: "simple" });
      expect(html).not.toContain("What happened");
    });
  });

  // ── Dev mode ─────────────────────────────────────────────────────────

  describe("dev mode", () => {
    it("shows ADD badges for first stage (all keys are new)", () => {
      const html = render({ snapshots: [snap()], selectedIndex: 0, mode: "dev" });
      expect(html).toContain("ADD");
      expect(html).toContain("orderId");
      expect(html).toContain("total");
    });

    it("shows UPD badge for changed values", () => {
      const s1 = snap({ memory: { count: 1 } });
      const s2 = snap({ stageLabel: "Increment", memory: { count: 2 } });
      const html = render({ snapshots: [s1, s2], selectedIndex: 1, mode: "dev" });
      expect(html).toContain("UPD");
      expect(html).toContain("count");
    });

    it("shows DEL badge for removed keys", () => {
      const s1 = snap({ memory: { temp: "val", keep: true } });
      const s2 = snap({ stageLabel: "Cleanup", memory: { keep: true } });
      const html = render({ snapshots: [s1, s2], selectedIndex: 1, mode: "dev" });
      expect(html).toContain("DEL");
      expect(html).toContain("temp");
    });

    it("shows unchanged keys when memory is identical", () => {
      const s1 = snap({ memory: { x: 1 } });
      const s2 = snap({ stageLabel: "Noop", memory: { x: 1 } });
      const html = render({ snapshots: [s1, s2], selectedIndex: 1, mode: "dev" });
      // No changes, but the key still shows as unchanged
      expect(html).toContain("memory-unchanged");
      // Header shows key count only, no "X changed" when nothing changed
      expect(html).toContain("1 key");
      expect(html).not.toContain("0 changed");
    });

    it("shows key count and change count in header", () => {
      const html = render({ snapshots: [snap()], selectedIndex: 0, mode: "dev" });
      // snap() has 2 keys: orderId, total → "2 keys, 2 changed"
      expect(html).toContain("2 keys");
      expect(html).toContain("2 changed");
    });

    it("shows old → new for updated values", () => {
      const s1 = snap({ memory: { status: "pending" } });
      const s2 = snap({ stageLabel: "Process", memory: { status: "done" } });
      const html = render({ snapshots: [s1, s2], selectedIndex: 1, mode: "dev" });
      expect(html).toContain("&quot;pending&quot;");
      expect(html).toContain("&quot;done&quot;");
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("renders 'No stage selected' when index is out of bounds", () => {
      const html = render({ snapshots: [], selectedIndex: 0, mode: "simple" });
      expect(html).toContain("No stage selected");
    });

    it("defaults to simple mode when mode prop omitted", () => {
      const html = render({ snapshots: [snap()], selectedIndex: 0 });
      // Simple mode shows description text, dev mode shows "Memory Changes"
      expect(html).toContain("Initialize order and customer data");
      expect(html).not.toContain("Memory Changes");
    });

    it("renders sub-1ms duration as <1", () => {
      const s = snap({ durationMs: 0.5 });
      const html = render({ snapshots: [s], selectedIndex: 0, mode: "simple" });
      expect(html).toContain("&lt;1");
    });
  });

  // ── Unstyled mode ────────────────────────────────────────────────────

  describe("unstyled mode", () => {
    it("uses data-fp attributes in simple mode", () => {
      const html = render({ snapshots: [snap()], selectedIndex: 0, mode: "simple", unstyled: true });
      expect(html).toContain('data-fp="stage-detail-panel"');
      expect(html).toContain('data-fp="stage-label"');
      expect(html).toContain('data-fp="stage-description"');
      expect(html).toContain('data-fp="stage-narrative"');
    });

    it("uses data-fp attributes in dev mode", () => {
      const html = render({ snapshots: [snap()], selectedIndex: 0, mode: "dev", unstyled: true });
      expect(html).toContain('data-fp="stage-detail-panel"');
      expect(html).toContain('data-fp="memory-change"');
      expect(html).toContain('data-type="added"');
    });

    it("sets data-mode attribute", () => {
      const htmlSimple = render({ snapshots: [snap()], selectedIndex: 0, mode: "simple", unstyled: true });
      const htmlDev = render({ snapshots: [snap()], selectedIndex: 0, mode: "dev", unstyled: true });
      expect(htmlSimple).toContain('data-mode="simple"');
      expect(htmlDev).toContain('data-mode="dev"');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 0.35.0 — `excludeKeys` does what the prop says.
//
// It was declared on the props interface and documented, and
// `DEFAULT_EXCLUDED_KEYS` was exported beside it — but the component never
// destructured either one, so both were pure fiction: passing a set changed
// nothing on screen.
// ─────────────────────────────────────────────────────────────────────────────
describe("StageDetailPanel — excludeKeys", () => {
  const before = snap({ memory: { orderId: "ORD-1", _internal: "noise", total: 100 } });
  const after = snap({
    stageLabel: "PriceOrder",
    memory: { orderId: "ORD-1", _internal: "CHANGED", total: 250, tax: 20 },
  });

  it("hides an excluded key from the memory ledger", () => {
    const html = render({
      snapshots: [before, after],
      selectedIndex: 1,
      mode: "dev",
      excludeKeys: new Set(["_internal"]),
    });
    expect(html).not.toContain("_internal");
    expect(html).toContain("orderId");
  });

  it("hides it from the CHANGE list too — no badge for a key you cannot see", () => {
    // `_internal` changed between the two steps. Filtering only the ledger
    // would have left an UPD row for a key that is not in the ledger.
    const html = render({
      snapshots: [before, after],
      selectedIndex: 1,
      mode: "dev",
      excludeKeys: new Set(["_internal"]),
    });
    expect(html).not.toContain("CHANGED");
    expect(html).toContain("250"); // the visible change is still reported
  });

  it("an excluded key that was DELETED raises no DEL row", () => {
    const gone = snap({ stageLabel: "Cleanup", memory: { orderId: "ORD-1", total: 100 } });
    const html = render({
      snapshots: [before, gone],
      selectedIndex: 1,
      mode: "dev",
      excludeKeys: new Set(["_internal"]),
    });
    expect(html).not.toContain("_internal");
    expect(html).not.toContain('data-type="removed"');
  });

  it("applies in unstyled dev mode as well", () => {
    const html = render({
      snapshots: [before, after],
      selectedIndex: 1,
      mode: "dev",
      unstyled: true,
      excludeKeys: new Set(["_internal"]),
    });
    expect(html).not.toContain("_internal");
    expect(html).toContain("orderId");
  });

  it("shows everything by default — the shipped default excludes nothing", () => {
    const html = render({ snapshots: [before, after], selectedIndex: 1, mode: "dev" });
    expect(html).toContain("_internal");
    expect(DEFAULT_EXCLUDED_KEYS.size).toBe(0);
  });

  it("an explicitly empty set also shows everything", () => {
    const html = render({
      snapshots: [before, after],
      selectedIndex: 1,
      mode: "dev",
      excludeKeys: new Set<string>(),
    });
    expect(html).toContain("_internal");
  });
});
