/** @vitest-environment jsdom */
import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import { FootprintTheme, useFootprintTheme, FootprintButton, FootprintTab, FootprintInput,
  FootprintCheckbox, FootprintBadge, FootprintCode, FootprintTooltip, FootprintIcon, coolLight } from "../../src/theme";
import type { FootprintComponents, FootprintTooltipAdapterProps, FootprintIconAdapterProps, ThemeTokens } from "../../src/theme";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";

const HostButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>((props, ref) =>
  <button {...props} ref={ref} data-host-button="" />);
const HostTab = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>((props, ref) =>
  <button {...props} ref={ref} data-host-tab="" />);
const HostInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>((props, ref) =>
  <input {...props} ref={ref} data-host-input="" />);
const HostCheckbox = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>((props, ref) =>
  <input {...props} ref={ref} data-host-checkbox="" />);
const HostBadge = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>((props, ref) =>
  <span {...props} ref={ref} data-host-badge="" />);
const HostCode = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>((props, ref) =>
  <code {...props} ref={ref} data-host-code="" />);
const HostTooltip = React.forwardRef<HTMLSpanElement, FootprintTooltipAdapterProps>(({ content, ...props }, ref) =>
  <span {...props} ref={ref} data-host-tooltip={content} />);
const HostIcon = React.forwardRef<HTMLSpanElement, FootprintIconAdapterProps>(({ name, ...props }, ref) =>
  <span {...props} ref={ref} data-host-icon={name} />);
const components: FootprintComponents = {
  Button: HostButton, Tab: HostTab, Input: HostInput, Checkbox: HostCheckbox,
  Badge: HostBadge, Code: HostCode, Tooltip: HostTooltip, Icon: HostIcon,
};

const snapshots: StageSnapshot[] = [
  { stageName: "seed", stageLabel: "Seed", runtimeStageId: "seed#0", memory: { count: 2 }, narrative: "", startMs: 0, durationMs: 1 },
  { stageName: "increment", stageLabel: "Increment", runtimeStageId: "increment#1", memory: { count: 3 }, narrative: "", startMs: 1, durationMs: 1 },
];
const narrativeEntries: NarrativeEntry[] = [
  { type: "step", text: "Step 1: Write count = 2", depth: 1, stageId: "seed", stageName: "Seed", runtimeStageId: "seed#0", key: "count", stepNumber: 1 },
  { type: "step", text: "Step 2: Read count = 2", depth: 1, stageId: "increment", stageName: "Increment", runtimeStageId: "increment#1", key: "count", stepNumber: 2 },
  { type: "step", text: "Step 3: Write count = 3", depth: 1, stageId: "increment", stageName: "Increment", runtimeStageId: "increment#1", key: "count", stepNumber: 3 },
];
const runtimeSnapshot = {
  runId: "themed-counter", sharedState: { count: 3 }, subflowResults: {},
  commitLog: snapshots.map((stage, index) => ({ stage: stage.stageLabel, stageId: stage.stageName, runtimeStageId: stage.runtimeStageId,
    overwrite: { count: index + 2 }, updates: {}, trace: [{ path: "count", verb: "set" }] })),
  executionTree: { id: "seed", name: "Seed", runtimeStageId: "seed#0", stageReads: {}, stageWrites: { count: 2 },
    next: { id: "increment", name: "Increment", runtimeStageId: "increment#1", stageReads: { count: 2 }, stageWrites: { count: 3 } } },
};
function Counter(props: Partial<React.ComponentProps<typeof ExplainableShell>> = {}) {
  return <ExplainableShell snapshots={snapshots} narrativeEntries={narrativeEntries}
    runtimeSnapshot={runtimeSnapshot as never} renderFlowchart={() => <div />} {...props} />;
}
function activity() { return screen.getByRole("region", { name: "Stage activity" }); }
function inspector() { return within(activity()).getByRole("complementary", { name: "Variable inspector" }); }
function ThemeProbe() { return <output aria-label="Resolved theme">{JSON.stringify(useFootprintTheme())}</output>; }

describe("Lens host component integration", () => {
  it("keeps navigation, search, tracing, return focus and follow state when controls are replaced", () => {
    render(<FootprintTheme components={components}><Counter /></FootprintTheme>);
    const activityTab = screen.getByRole("button", { name: "Activity" });
    expect(activityTab.hasAttribute("data-host-tab")).toBe(true);
    expect(activityTab.getAttribute("aria-pressed")).toBe("true");
    const previous = screen.getByRole("button", { name: "Previous stage" });
    expect(previous.hasAttribute("data-host-button")).toBe(true);
    expect((previous as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
    expect(activity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("increment#1");

    fireEvent.click(screen.getByRole("button", { name: /^Data Trace/ }));
    const search = screen.getByPlaceholderText("search any variable...") as HTMLInputElement;
    expect(search.hasAttribute("data-host-input")).toBe(true);
    fireEvent.change(search, { target: { value: "count" } });
    expect(search.value).toBe("count");
    fireEvent.click(screen.getByRole("button", { name: "Activity" }));
    fireEvent.click(within(activity()).getByRole("button", { name: "Inspect read count" }));
    const backtrack = within(inspector()).getByRole("button", { name: "Backtrack read count" });
    expect(backtrack.hasAttribute("data-host-button")).toBe(true);
    expect(backtrack.hasAttribute("style")).toBe(false);
    fireEvent.click(backtrack);
    expect(document.querySelector('[data-fp="trace-walk-card"]')?.textContent).toContain("wrote count = 2");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Return to Increment activity");
    expect(document.activeElement?.hasAttribute("data-host-button")).toBe(true);
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(activity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("increment#1");
    expect(document.activeElement?.getAttribute("data-variable-kind")).toBe("read");
    expect(document.activeElement?.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Run data" }));
    fireEvent.click(screen.getByRole("button", { name: "Run log" }));
    const follow = screen.getByRole("checkbox", { name: "Follow cursor" }) as HTMLInputElement;
    expect(follow.hasAttribute("data-host-checkbox")).toBe(true);
    expect(follow.type).toBe("checkbox");
    expect(follow.checked).toBe(false);
    fireEvent.click(follow);
    expect(follow.checked).toBe(true);
  });

  it("inherits outer adapters while a nested theme replaces one component", () => {
    const buttonRef = React.createRef<HTMLButtonElement>();
    const inputRef = React.createRef<HTMLInputElement>();
    render(<FootprintTheme components={{ Button: HostButton, Badge: HostBadge, Code: HostCode, Tooltip: HostTooltip, Icon: HostIcon }}>
      <FootprintTheme components={{ Input: HostInput }}>
        <FootprintButton ref={buttonRef} aria-label="Host action" defaultStyle={{ color: "red" }} style={{ marginTop: 7 }}>Action</FootprintButton>
        <FootprintTab aria-pressed="true">Inherited tab</FootprintTab>
        <FootprintInput ref={inputRef} aria-label="Host search" defaultValue="saved" />
        <FootprintCheckbox aria-label="Host option" defaultChecked />
        <FootprintBadge>Recorded</FootprintBadge>
        <FootprintCode>count</FootprintCode>
        <FootprintTooltip content="Recorded value" title="Value help"><span>Help</span></FootprintTooltip>
        <FootprintIcon name="back" aria-label="Back icon">←</FootprintIcon>
      </FootprintTheme>
    </FootprintTheme>);
    const button = screen.getByRole("button", { name: "Host action" });
    expect(buttonRef.current).toBe(button);
    expect((button as HTMLElement).style.color).toBe("");
    expect((button as HTMLElement).style.marginTop).toBe("7px");
    expect(screen.getByRole("button", { name: "Inherited tab" }).hasAttribute("data-host-button")).toBe(true);
    expect(screen.getByRole("button", { name: "Inherited tab" }).getAttribute("aria-pressed")).toBe("true");
    expect(inputRef.current).toBe(screen.getByRole("textbox", { name: "Host search" }));
    expect((screen.getByRole("checkbox", { name: "Host option" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("checkbox", { name: "Host option" }).hasAttribute("data-host-input")).toBe(true);
    expect(screen.getByText("Recorded").hasAttribute("data-host-badge")).toBe(true);
    expect(screen.getByText("count").hasAttribute("data-host-code")).toBe(true);
    expect(screen.getByTitle("Value help").getAttribute("data-host-tooltip")).toBe("Recorded value");
    expect(screen.getByLabelText("Back icon").getAttribute("data-host-icon")).toBe("back");
  });
});

describe("Lens token inheritance and sizing", () => {
  it("applies direct Lens theme mode, tokens and adapters with explicit legacy node colors preserved", () => {
    const view = render(<FootprintTheme tokens={{ fontFamily: { mono: "Host Mono" } }} components={{ Button: HostButton, Tab: HostButton }}>
      <Counter theme={{ mode: "light", tokens: { colors: { primary: "#734ca1", bgPrimary: "#fbf6ed", nodeVisited: "#448855" },
        typography: { body: "17px" }, controls: { height: "42px" } }, components: { Tab: HostTab } }}
        traceTheme={{ mode: "dark", visited: "#116633", current: "#bb6600" }} />
    </FootprintTheme>);
    const shell = view.container.querySelector<HTMLElement>('[data-fp="explainable-shell"]')!;
    expect(shell.style.getPropertyValue("--fp-bg-primary")).toBe("#fbf6ed");
    expect(shell.style.getPropertyValue("--fp-color-primary")).toBe("#734ca1");
    expect(shell.style.getPropertyValue("--fp-text-primary")).toBe(coolLight.colors!.textPrimary);
    expect(shell.style.getPropertyValue("--fp-font-size-body")).toBe("17px");
    expect(shell.style.getPropertyValue("--fp-control-height")).toBe("42px");
    expect(shell.style.getPropertyValue("--fp-node-visited")).toBe("#116633");
    expect(shell.style.getPropertyValue("--fp-node-cursor")).toBe("#bb6600");
    expect(screen.getByRole("button", { name: "Activity" }).hasAttribute("data-host-tab")).toBe(true);
    expect(screen.getByRole("button", { name: "Next stage" }).hasAttribute("data-host-button")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
    expect(activity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("increment#1");
  });

  it("merges nested token groups and emits only local palette and micro-sizing overrides", () => {
    const outer: ThemeTokens = { colors: { primary: "#123456", success: "#237a42", chip1: "#734ca1" },
      typography: { body: "15px", small: "12px" }, controls: { height: "44px", iconSize: "21px" },
      spacing: { md: "18px" }, radii: { control: "9px" }, motion: { duration: "75ms" } };
    const inner: ThemeTokens = { colors: { primary: "#a34721", tracing: "#6e398a", onTracing: "#f9f4ff" },
      typography: { title: "22px" }, controls: { gap: "11px" } };
    const view = render(<FootprintTheme tokens={outer}><FootprintTheme tokens={inner}>
      <ThemeProbe /><FootprintButton aria-label="Sized action">Action</FootprintButton><Counter />
    </FootprintTheme></FootprintTheme>);
    const resolved = JSON.parse(screen.getByLabelText("Resolved theme").textContent!);
    expect(resolved.colors).toMatchObject({ primary: "#a34721", success: "#237a42", chip1: "#734ca1", tracing: "#6e398a" });
    expect(resolved.typography).toMatchObject({ body: "15px", small: "12px", title: "22px" });
    expect(resolved.controls).toMatchObject({ height: "44px", iconSize: "21px", gap: "11px" });
    const roots = view.container.querySelectorAll<HTMLElement>(".fp-theme-root");
    expect(roots[0].style.getPropertyValue("--fp-font-size-body")).toBe("15px");
    expect(roots[0].style.getPropertyValue("--fp-control-height")).toBe("44px");
    expect(roots[0].style.getPropertyValue("--fp-space-md")).toBe("18px");
    expect(roots[0].style.getPropertyValue("--fp-chip-1")).toBe("#734ca1");
    expect(roots[1].style.getPropertyValue("--fp-color-primary")).toBe("#a34721");
    expect(roots[1].style.getPropertyValue("--fp-on-tracing")).toBe("#f9f4ff");
    expect(roots[1].style.getPropertyValue("--fp-color-success")).toBe("");
    expect(roots[1].style.getPropertyValue("--fp-control-gap")).toBe("11px");
    const action = screen.getByRole("button", { name: "Sized action" }) as HTMLElement;
    expect(action.style.fontSize).toContain("--fp-font-size-body");
    expect(action.style.minHeight).toContain("--fp-control-height");
    expect(action.style.borderRadius).toContain("--fp-radius-control");
    expect(activity().getAttribute("style")).toContain("--fp-font-size-body");
    fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
    fireEvent.click(within(activity()).getByRole("button", { name: "Inspect read count" }));
    fireEvent.click(within(inspector()).getByRole("button", { name: "Backtrack read count" }));
    expect(screen.getByRole("toolbar").getAttribute("style")).toContain("--fp-tracing");
  });

  it("keeps the native unstyled fallback free of library paint while honoring explicit consumer style", () => {
    render(<FootprintTheme tokens={{ controls: { height: "48px" } }}>
      <FootprintButton unstyled aria-label="Plain action" defaultStyle={{ background: "red" }}>Plain</FootprintButton>
      <FootprintInput unstyled aria-label="Plain input" />
      <FootprintCheckbox unstyled aria-label="Plain option" />
      <FootprintBadge unstyled>Plain badge</FootprintBadge>
      <FootprintCode unstyled>plainKey</FootprintCode>
      <FootprintTab unstyled style={{ padding: 4 }}>Consumer tab</FootprintTab>
    </FootprintTheme>);
    for (const element of [screen.getByRole("button", { name: "Plain action" }), screen.getByRole("textbox", { name: "Plain input" }),
      screen.getByRole("checkbox", { name: "Plain option" }), screen.getByText("Plain badge"), screen.getByText("plainKey")])
      expect(element.hasAttribute("style")).toBe(false);
    expect((screen.getByRole("button", { name: "Consumer tab" }) as HTMLElement).style.padding).toBe("4px");
  });
});
