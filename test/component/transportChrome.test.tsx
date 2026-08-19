/** @vitest-environment jsdom */
/**
 * 0.35.0 — two pieces of chrome that were printing nonsense.
 *
 * 1. `<SnapshotPanel>`'s scrub buttons were written as `label="◀"`.
 *    A JSX string ATTRIBUTE is not a JS string literal — it does not process
 *    backslash escapes — so the six characters `◀` were rendered
 *    verbatim where an arrow should have been.
 *
 * 2. `<CompactTimeline>` painted its pending dots with
 *    `theme.textMuted + "40"`. A theme token is a `var(--fp-…, #fallback)`
 *    STRING, so that concatenation produced
 *    `var(--fp-text-muted, #64748b)40` — not a colour any browser parses.
 *    The dots (and the connecting line) were simply invisible, inside the
 *    footer of the shipped shell.
 */
import { describe, expect, it } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { SnapshotPanel } from "../../src/components/SnapshotPanel";
import { CompactTimeline } from "../../src/components/CompactTimeline/CompactTimeline";
import type { StageSnapshot } from "../../src/types";

const SNAPS: StageSnapshot[] = ["alpha", "beta", "gamma"].map((name, i) => ({
  stageName: name,
  stageLabel: name,
  runtimeStageId: `${name}#${i}`,
  memory: { [name]: i },
  narrative: `${name} ran.`,
  startMs: i * 10,
  durationMs: 10,
}));

describe("SnapshotPanel — the scrub buttons are real buttons", () => {
  function scrubButtons(container: HTMLElement): HTMLButtonElement[] {
    return Array.from(container.querySelectorAll<HTMLButtonElement>('[data-fp="scrub-button"]'));
  }

  it("renders an arrow, not the characters of an escape sequence", () => {
    const { container } = render(<SnapshotPanel snapshots={SNAPS} />);
    const [prev, next] = scrubButtons(container);
    expect(prev?.textContent).toBe("◀");
    expect(next?.textContent).toBe("▶");
    expect(container.textContent).not.toContain("u25C0");
    expect(container.textContent).not.toContain("u25B6");
  });

  it("names itself for a screen reader — a bare triangle names nothing", () => {
    const { container } = render(<SnapshotPanel snapshots={SNAPS} />);
    const [prev, next] = scrubButtons(container);
    expect(prev?.getAttribute("aria-label")).toBe("Previous stage");
    expect(next?.getAttribute("aria-label")).toBe("Next stage");
  });

  it("moves the cursor, and is disabled at each end", () => {
    const { container } = render(<SnapshotPanel snapshots={SNAPS} />);
    const [prev, next] = scrubButtons(container);
    expect(prev!.disabled).toBe(true); // at step 1 of 3
    expect(next!.disabled).toBe(false);

    fireEvent.click(next!);
    expect(container.textContent).toContain("2/3");
    fireEvent.click(next!);
    expect(container.textContent).toContain("3/3");
    expect(scrubButtons(container)[1]!.disabled).toBe(true); // at the end

    fireEvent.click(scrubButtons(container)[0]!);
    expect(container.textContent).toContain("2/3");
  });

  it("is a type=button so it never submits a surrounding form", () => {
    const { container } = render(<SnapshotPanel snapshots={SNAPS} />);
    for (const b of scrubButtons(container)) expect(b.getAttribute("type")).toBe("button");
  });
});

describe("CompactTimeline — the dots are actually a colour", () => {
  /** Every `background:` the dot line paints. */
  function backgrounds(container: HTMLElement): string[] {
    return Array.from(container.querySelectorAll<HTMLElement>("div[style]"))
      .map((n) => n.style.background)
      .filter((b) => b !== "");
  }

  it("never emits a var() with a hex-alpha suffix glued onto it", () => {
    const { container } = render(<CompactTimeline snapshots={SNAPS} selectedIndex={1} />);
    for (const bg of backgrounds(container)) {
      expect(bg).not.toMatch(/var\([^)]*\)[0-9a-fA-F]{2}\b/);
    }
  });

  it("paints the pending dots with a colour the DOM accepts", () => {
    // jsdom drops a declaration it cannot parse, so an invalid colour shows up
    // as an EMPTY background. A parseable one survives.
    const { container } = render(<CompactTimeline snapshots={SNAPS} selectedIndex={0} />);
    const pending = backgrounds(container).filter((b) => b.includes("color-mix"));
    expect(pending.length).toBeGreaterThan(0);
    for (const bg of pending) expect(bg).toContain("var(--fp-text-muted");
  });

  it("every dot in the line carries a background", () => {
    const { container } = render(<CompactTimeline snapshots={SNAPS} selectedIndex={1} />);
    const dots = Array.from(container.querySelectorAll<HTMLElement>('div[title]'));
    expect(dots).toHaveLength(3);
    for (const dot of dots) expect(dot.style.background).not.toBe("");
  });

  it("defaults its header to Timeline and takes an override", () => {
    const { container: a } = render(<CompactTimeline snapshots={SNAPS} selectedIndex={0} />);
    expect(a.textContent).toContain("Timeline");
    const { container: b } = render(
      <CompactTimeline snapshots={SNAPS} selectedIndex={0} label="How Long" />,
    );
    expect(b.textContent).toContain("How Long");
    expect(b.textContent).not.toContain("Timeline");
  });
});
