/** @vitest-environment jsdom */
/**
 * TraceWalkCard — the "WHY THIS VALUE" stop card.
 *
 * What is being pinned:
 * 1. Fork honesty: a 2-ingredient stop renders BOTH chips (colored,
 *    followable); following fires the re-anchor callback with the
 *    ingredient — the card never picks silently.
 * 2. Honest absence: both truthful sentences render as full cards.
 * 3. Termini are flagged run-inputs and NOT followable (no invented source).
 * 4. [Copy story] emits formatTraceWalk's exact string (LLM parity).
 * 5. The itinerary highlights the ONE cursor's stop; rows jump it.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { FootprintTheme, type FootprintIconAdapterProps, type FootprintTooltipAdapterProps } from "../../src/theme";

import { TraceWalkCard } from "../../src/components/DataTracePanel/TraceWalkCard";
import {
  buildTraceWalk,
  formatTraceWalk,
} from "../../src/components/ExplainableShell/_internal/traceWalk";

// Same diamond as traceWalk.test — total ← {tax ← {rate, subtotal}, subtotal}.
const commit = (stage: string, rsid: string, writes: string[]) => ({
  stage,
  stageId: stage.toLowerCase(),
  runtimeStageId: rsid,
  trace: writes.map((path) => ({ path })),
});
const LOG = [
  commit("Seed", "seed#0", ["rate", "items"]),
  commit("Sum", "sum#1", ["subtotal"]),
  commit("Audit", "audit#2", ["auditNote"]),
  commit("ApplyTax", "applyTax#3", ["tax"]),
  commit("ComputeTotal", "computeTotal#4", ["total"]),
];
const TREE = (() => {
  const nodes = [
    { runtimeStageId: "seed#0", stageReads: { config: 1 } },
    { runtimeStageId: "sum#1", stageReads: { items: 1 } },
    { runtimeStageId: "audit#2", stageReads: { subtotal: 1 } },
    { runtimeStageId: "applyTax#3", stageReads: { rate: 1, subtotal: 1 } },
    { runtimeStageId: "computeTotal#4", stageReads: { subtotal: 1, tax: 1 } },
  ];
  for (let i = 0; i < nodes.length - 1; i++) (nodes[i] as Record<string, unknown>).next = nodes[i + 1];
  return nodes[0];
})();

const stepOf = (rsid: string) => {
  const i = LOG.findIndex((c) => c.runtimeStageId === rsid);
  return i >= 0 ? i + 1 : null;
};

const WALK = buildTraceWalk(LOG, TREE, "total");
const HostButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => <button {...props} ref={ref} data-host="button" />);
const HostCode = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>((props, ref) => <code {...props} ref={ref} data-host="code" />);
const HostTooltip = forwardRef<HTMLSpanElement, FootprintTooltipAdapterProps>(({ content, ...props }, ref) => <span {...props} ref={ref} data-host="tooltip" data-content={content} />);
const HostIcon = forwardRef<HTMLSpanElement, FootprintIconAdapterProps>(({ name, ...props }, ref) => <span {...props} ref={ref} data-host="icon" data-icon-name={name} />);

describe("TraceWalkCard", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("uses theme micro tokens and replaceable primitives while preserving ingredient actions", () => {
    const follow = vi.fn();
    const view = render(<TraceWalkCard walk={WALK} cursorRuntimeStageId="computeTotal#4" stepNumberOf={stepOf} onFollowIngredient={follow} />);
    const card = view.container.querySelector<HTMLElement>('[data-fp="trace-walk-card"]')!;
    const chip = screen.getAllByTitle(/Follow /)[0];
    expect(card.style.fontSize).toContain("--fp-font-size-body");
    expect(card.style.lineHeight).toContain("--fp-line-height");
    expect(chip.style.borderRadius).toContain("--fp-radius-badge");
    expect(chip.style.minHeight).toContain("--fp-control-height");
    expect(chip.style.border).toContain("--fp-border-width");
    view.rerender(<FootprintTheme components={{ Button: HostButton, Code: HostCode, Tooltip: HostTooltip, Icon: HostIcon }}>
      <TraceWalkCard walk={{ ...WALK, truncated: true }} cursorRuntimeStageId="computeTotal#4" stepNumberOf={stepOf} onFollowIngredient={follow} />
    </FootprintTheme>);
    const hostChip = screen.getAllByTitle(/Follow /)[0];
    expect(hostChip.getAttribute("data-fp-part")).toBe("trace-ingredient");
    expect(hostChip.style.fontSize).toBe("");
    expect(hostChip.style.border).toBe("");
    fireEvent.click(hostChip);
    expect(follow).toHaveBeenCalledOnce();
    expect(follow.mock.calls[0][0]).toMatchObject({ key: "subtotal", writerRuntimeStageId: "sum#1" });
    expect(view.container.querySelector('[data-host="tooltip"]')?.getAttribute("data-content")).toContain("re-anchor the walk on its writer");
    expect(view.container.querySelector('[data-host="icon"][data-icon-name="warning"]')).toBeTruthy();
    expect(view.container.querySelector('[data-host="code"][data-fp-part="trace-value"]')).toBeTruthy();
  });

  it("keeps nested chooser, trail, tooltip and code content unstyled", () => {
    const follow = vi.fn(), back = vi.fn(), exit = vi.fn();
    const view = render(<TraceWalkCard walk={{ ...WALK, truncated: true }} cursorRuntimeStageId="computeTotal#4" stepNumberOf={stepOf}
      questionTrail={[{ key: "total", invocationPath: [] }, { key: "subtotal", invocationPath: [] }]}
      onReturnToQuestion={back} onFollowIngredient={follow} onExit={exit} forkChooserOpen unstyled />);
    expect(view.container.querySelector("[style]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Return to total in root" }));
    expect(back).toHaveBeenCalledExactlyOnceWith(0);
    fireEvent.click(screen.getAllByTitle(/Follow /)[0]);
    expect(follow).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Exit tracing" }));
    expect(exit).toHaveBeenCalledOnce();
  });

  it.each([false, true])("offers the Activity return action in recorded and missing cards (unstyled=%s)", (unstyled) => {
    const onExit = vi.fn(), submit = vi.fn(event => event.preventDefault());
    const props = { cursorRuntimeStageId: "computeTotal#4", stepNumberOf: stepOf, onExit, unstyled,
      exitLabel: "Back to Quote · Activity", exitAriaLabel: "Return to Quote activity" };
    const view = render(<form onSubmit={submit}><TraceWalkCard {...props} walk={WALK} /></form>);
    const back = screen.getByRole("button", { name: "Return to Quote activity" });
    expect(back.textContent).toBe("Back to Quote · Activity");
    fireEvent.click(back);
    expect(onExit).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
    view.rerender(<form onSubmit={submit}><TraceWalkCard {...props} walk={buildTraceWalk(LOG, TREE, "phantom")} /></form>);
    fireEvent.click(screen.getByRole("button", { name: "Return to Quote activity" }));
    expect(onExit).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveBeenCalled();
    view.rerender(<TraceWalkCard walk={WALK} cursorRuntimeStageId={null} stepNumberOf={stepOf} onExit={onExit} unstyled={unstyled} />);
    expect(screen.getByRole("button", { name: "Exit tracing" }).textContent).toBe("Done ✕");
  });

  it("renders the fork stop with BOTH ingredient chips, followable", () => {
    const onFollow = vi.fn();
    render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="applyTax#3"
        stepNumberOf={stepOf}
        onFollowIngredient={onFollow}
      />,
    );
    expect(screen.getByText(/stop 2 of 4/i)).toBeTruthy();
    expect(screen.getByText(/Recorded state reads \(2\)/)).toBeTruthy();
    const chips = screen.getAllByTitle(/Follow /);
    expect(chips).toHaveLength(2);
    fireEvent.click(chips.find((c) => c.textContent?.includes("subtotal"))!);
    expect(onFollow).toHaveBeenCalledWith(
      expect.objectContaining({ key: "subtotal", writerRuntimeStageId: "sum#1" }),
    );
  });

  it("flags run-input termini and refuses to follow them", () => {
    render(
      <TraceWalkCard walk={WALK} cursorRuntimeStageId="seed#0" stepNumberOf={stepOf} onFollowIngredient={vi.fn()} />,
    );
    const terminus = screen.getByTitle(/no recorded write; value unknown/);
    expect(terminus.textContent).toContain("config");
    expect((terminus as HTMLButtonElement).disabled).toBe(true);
  });

  it("highlights the cursor's row in the itinerary and jumps on row click", () => {
    const onJump = vi.fn();
    const { container } = render(
      <TraceWalkCard walk={WALK} cursorRuntimeStageId="applyTax#3" stepNumberOf={stepOf} onJumpToStop={onJump} />,
    );
    const rows = container.querySelectorAll('[data-fp="twc-itinerary-row"]');
    expect(rows).toHaveLength(4);
    expect(rows[1].getAttribute("data-current")).toBe("true");
    fireEvent.click(rows[3]);
    expect(onJump).toHaveBeenCalledWith("seed#0");
  });

  it("marks fork rows in the itinerary (⑂ badge)", () => {
    const { container } = render(
      <TraceWalkCard walk={WALK} cursorRuntimeStageId="computeTotal#4" stepNumberOf={stepOf} />,
    );
    const forkRow = [...container.querySelectorAll('[data-fp="twc-itinerary-row"]')].find((r) =>
      r.textContent?.includes("ApplyTax"),
    )!;
    expect(forkRow.textContent).toContain("⑂ 2");
  });

  it("[Copy story] writes formatTraceWalk's exact string — the parity artifact", async () => {
    render(<TraceWalkCard walk={WALK} cursorRuntimeStageId="computeTotal#4" stepNumberOf={stepOf} />);
    fireEvent.click(screen.getByText("Copy story"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(formatTraceWalk(WALK, stepOf));
  });

  it("renders the never-written absence card (a full answer, not an empty list)", () => {
    const missing = buildTraceWalk(LOG, TREE, "phantom");
    const { container } = render(
      <TraceWalkCard walk={missing} cursorRuntimeStageId={null} stepNumberOf={stepOf} />,
    );
    const card = container.querySelector('[data-fp="trace-walk-card"]')!;
    expect(card.getAttribute("data-missing")).toBe("never-written");
    expect(card.textContent).toContain("no recorded write");
    expect(card.textContent).toContain("value unknown");
  });

  it("renders the not-yet-written sentence with the first write's location", () => {
    const notYet = buildTraceWalk(LOG, TREE, "total", { beforeCommitIdx: 4 });
    const { container } = render(
      <TraceWalkCard walk={notYet} cursorRuntimeStageId={null} stepNumberOf={stepOf} />,
    );
    const card = container.querySelector('[data-fp="trace-walk-card"]')!;
    expect(card.getAttribute("data-missing")).toBe("not-yet-written");
    expect(card.textContent).toContain("not been written yet at this moment");
    expect(card.textContent).toContain("ComputeTotal");
    expect(card.textContent).toContain("step 5");
  });

  it("shows the via breadcrumb with 'show all ingredients'", () => {
    const onShowAll = vi.fn();
    const sub = buildTraceWalk(LOG, TREE, "subtotal", { beforeCommitIdx: 3 });
    render(
      <TraceWalkCard
        walk={sub}
        cursorRuntimeStageId={null}
        viaKey="subtotal"
        stepNumberOf={stepOf}
        onShowAll={onShowAll}
      />,
    );
    fireEvent.click(screen.getByText("show all ingredients"));
    expect(onShowAll).toHaveBeenCalledOnce();
  });

  it("says 'unknowable, not absent' when reads were never recorded", () => {
    const noReads = buildTraceWalk(LOG, { runtimeStageId: "x#0" }, "total");
    const { container } = render(
      <TraceWalkCard walk={noReads} cursorRuntimeStageId={null} stepNumberOf={stepOf} />,
    );
    expect(container.querySelector('[data-fp="twc-unknowable"]')?.textContent).toContain(
      "unknowable, not absent",
    );
  });

  it("shows a bounded value preview from the shell's previewValueOf", () => {
    render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="computeTotal#4"
        stepNumberOf={stepOf}
        previewValueOf={(k) => (k === "total" ? 109.45 : undefined)}
      />,
    );
    expect(screen.getByText(/= 109.45/)).toBeTruthy();
  });

  it("keeps variable and child hops visible and can restore either earlier question", () => {
    const onReturn = vi.fn();
    render(<TraceWalkCard walk={WALK} cursorRuntimeStageId="computeTotal#4" stepNumberOf={stepOf}
      questionTrail={[
        { key: "parentTotal", invocationPath: [] },
        { key: "childTotal", invocationPath: ["child#2"] },
        { key: "total", invocationPath: ["child#2"] },
      ]} onReturnToQuestion={onReturn} />);
    const trail = screen.getByRole("navigation", { name: "Investigation trail" });
    expect(trail.textContent).toContain("parentTotal");
    expect(trail.textContent).toContain("childTotal");
    fireEvent.click(within(trail).getByRole("button", { name: "Return to parentTotal in root" }));
    expect(onReturn).toHaveBeenLastCalledWith(0);
    fireEvent.click(within(trail).getByRole("button", { name: /Back to childTotal/ }));
    expect(onReturn).toHaveBeenLastCalledWith(1);
    expect(trail.querySelector('[aria-current="step"]')?.textContent).toBe("total");
  });

  it("does not promote a stage without recorded state reads into a proven origin", () => {
    const origin = buildTraceWalk([commit("Write", "write#0", ["answer"])], { runtimeStageId: "write#0", stageReads: {} }, "answer", { scope: { invocationPath: [], readsAvailable: true } });
    const { container } = render(<TraceWalkCard walk={origin} cursorRuntimeStageId="write#0" stepNumberOf={() => 1} />);
    expect(container.querySelector('[data-fp="twc-origin"]')?.textContent).toContain("No recorded state reads");
    expect(container.textContent).not.toContain("this is an origin");
    expect(container.textContent).not.toContain("Made from");
  });
});

describe("TraceWalkCard — fork chooser (F2)", () => {
  it("renders the chooser when forkChooserOpen and the stop has 2+ ingredients; chips follow as usual", () => {
    const onFollow = vi.fn();
    const { container } = render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="computeTotal#4"
        stepNumberOf={stepOf}
        onFollowIngredient={onFollow}
        forkChooserOpen
        onContinueTimeOrder={vi.fn()}
      />,
    );
    const chooser = container.querySelector('[data-fp="twc-fork-chooser"]') as HTMLElement;
    expect(chooser).toBeTruthy();
    expect(chooser.textContent).toContain(
      "This step has 2 recorded state reads. Which source should the walk follow?",
    );
    // The SAME ingredient chips (both followable) live inside the chooser.
    const chips = within(chooser).getAllByTitle(/Follow /);
    expect(chips).toHaveLength(2);
    fireEvent.click(chips.find((c) => c.textContent?.includes("tax"))!);
    expect(onFollow).toHaveBeenCalledWith(
      expect.objectContaining({ key: "tax", writerRuntimeStageId: "applyTax#3" }),
    );
  });

  it("fires onContinueTimeOrder from the neutral 'visit all (time order)' button", () => {
    const onContinue = vi.fn();
    const { container } = render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="computeTotal#4"
        stepNumberOf={stepOf}
        forkChooserOpen
        onContinueTimeOrder={onContinue}
      />,
    );
    fireEvent.click(
      within(container.querySelector('[data-fp="twc-fork-chooser"]') as HTMLElement).getByText(
        "visit all recorded steps (newest first)",
      ),
    );
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("no chooser when the stop has a single ingredient (nothing to choose)", () => {
    const { container } = render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="sum#1"
        stepNumberOf={stepOf}
        forkChooserOpen
        onContinueTimeOrder={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-fp="twc-fork-chooser"]')).toBeNull();
  });

  it("no chooser when forkChooserOpen is false, even at a fork stop", () => {
    const { container } = render(
      <TraceWalkCard
        walk={WALK}
        cursorRuntimeStageId="computeTotal#4"
        stepNumberOf={stepOf}
        onContinueTimeOrder={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-fp="twc-fork-chooser"]')).toBeNull();
  });
});

describe("child input boundary in a missing-value card",()=>{
 it("does not use the root never-written claim for a mapped child input",()=>{
   const walk=buildTraceWalk(LOG,TREE,"config",{scope:{invocationPath:["child#3"],readsAvailable:true,mountLabels:{}}});
   render(<TraceWalkCard walk={walk} cursorRuntimeStageId={null} stepNumberOf={stepOf}/>);
   expect(document.querySelector('[data-fp="trace-walk-card"]')?.textContent).toContain("no recorded write; value unknown");
   expect(document.querySelector('[data-fp="trace-walk-card"]')?.textContent).not.toContain("never written");
 });
});


describe("explicit raw child start boundary", () => {
  it("uses scope facts rather than matching the invocation name against display text", () => {
    const log = [{stage:"Restore",stageId:"resume",runtimeStageId:"prepare#4",trace:[{path:"items"}]}];
    const walk = buildTraceWalk(log,{runtimeStageId:"prepare#4",stageReads:{}},"items",{scope:{invocationPath:["prepare#4"],readsAvailable:true}});
    const {container}=render(<TraceWalkCard walk={walk} cursorRuntimeStageId={null} stepNumberOf={()=>1}/>);
    expect(container.querySelector('[data-fp="twc-boundary"]')?.textContent).toContain("recorded at invocation start; earlier origin unknown");
    expect(container.querySelector('[data-fp="twc-origin"]')).toBeNull();
  });
});
