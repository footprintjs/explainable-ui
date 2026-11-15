/** @vitest-environment jsdom */
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FootprintTheme } from "../../src/theme";
import type { FootprintIconAdapterProps } from "../../src/theme/components";
import { RightPanel } from "../../src/components/ExplainableShell/_internal/RightPanel";
import { HLinePill, VLinePill, MissingChartNote } from "../../src/components/ExplainableShell/_internal/ShellChrome";
import { ShellDetailTabs, UnstyledShellLayout } from "../../src/components/ExplainableShell/_internal/ShellLayout";
import { InsightPanel } from "../../src/components/InsightPanel/InsightPanel";

const insights = [
  { id: "narrative", name: "Run log", render: () => <p>Recorded run log</p> },
  { id: "metrics", name: "Metrics", render: () => <p>Recorded metrics</p> },
];
const panelProps = {
  mode: "insights" as const, onModeChange: vi.fn(), snapshots: [], selectedIndex: 0,
  activeTab: "result", allTabs: [
    { id: "result", name: "Result" }, { id: "memory", name: "Memory" },
    { id: "narrative", name: "Narrative" }, { id: "metrics", name: "Metrics" },
  ],
  renderTabBody: (id: string) => <p>{id} recorded content</p>,
  size: "compact" as const, onNavigateToStage: vi.fn(), dataTrace: { frames: [], readsAvailable: true },
};

describe("Run data tab selection", () => {
  it("marks the fallback Run log active when the supplied default belongs to another Lens mode", () => {
    render(<RightPanel {...panelProps} />);
    expect(screen.getByRole("button", { name: "Run log" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Metrics" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("narrative recorded content")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Metrics" }));
    expect(screen.getByText("metrics recorded content")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Metrics" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("marks the actual fallback active when a selected recorder is withdrawn", () => {
    const view = render(<InsightPanel mode="tabs" expandedId="narrative" insights={insights} />);
    view.rerender(<InsightPanel mode="tabs" expandedId="narrative" insights={[insights[1]]} />);
    expect(screen.getByRole("button", { name: "Metrics" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Recorded metrics")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Run log" })).toBeNull();
  });
});

describe("Shell microtheme parts", () => {
  it("routes mode/detail/recorder tabs through the host Tab with identities, state and actions intact", () => {
    const tabPaint = vi.fn(), mode = vi.fn(), detail = vi.fn();
    const HostTab = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => {
      tabPaint(props.style);
      return <button {...props} ref={ref} className="host-tab" />;
    });
    const view = render(<FootprintTheme components={{ Tab: HostTab }}>
      <RightPanel {...panelProps} onModeChange={mode} />
      <ShellDetailTabs tabs={[{ id: "inspector", name: "Details" }]} activeTab="inspector" onTabChange={detail}>Detail content</ShellDetailTabs>
    </FootprintTheme>);
    const run = screen.getByRole("button", { name: "Run data" });
    expect(run.getAttribute("data-fp-part")).toBe("lens-mode");
    expect(run.getAttribute("data-mode-id")).toBe("insights");
    expect(run.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(run);
    expect(mode).toHaveBeenCalledExactlyOnceWith("insights");
    const details = screen.getByRole("button", { name: "Details" });
    expect(details.getAttribute("data-tab-id")).toBe("inspector");
    expect(details.getAttribute("data-fp-part")).toBe("shell-detail-tab");
    fireEvent.click(details);
    expect(detail).toHaveBeenCalledExactlyOnceWith("inspector");
    expect(screen.getByRole("button", { name: "Run log" }).getAttribute("data-fp-part")).toBe("run-data-tab");
    expect(tabPaint.mock.calls.every(([style]) => style === undefined ||
      Object.keys(style).every(key => ["flex", "minWidth", "flexShrink"].includes(key)))).toBe(true);
    expect((run as HTMLElement).style.flex).toBe("1 1 0%");
    expect((run as HTMLElement).style.minWidth).toBe("0px");
    expect((details as HTMLElement).style.flexShrink).toBe("0");
    expect(view.container.querySelectorAll("button.host-tab").length).toBeGreaterThan(3);
  });

  it("routes collapse controls, icons and code through host primitives without submitting forms", () => {
    const click = vi.fn(), submit = vi.fn(event => event.preventDefault());
    const HostButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => <button {...props} ref={ref} data-host="button" />);
    const HostCode = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>((props, ref) => <code {...props} ref={ref} data-host="code" />);
    const HostIcon = forwardRef<HTMLSpanElement, FootprintIconAdapterProps>(({ name, ...props }, ref) => <span {...props} ref={ref} data-host-icon={name} />);
    const view = render(<form onSubmit={submit}><FootprintTheme components={{ Button: HostButton, Code: HostCode, Icon: HostIcon }}>
      <HLinePill label="Details" expanded onClick={click} />
      <VLinePill label="Topology" expanded={false} onClick={click} />
      <MissingChartNote />
    </FootprintTheme></form>);
    const details = screen.getByRole("button", { name: "Details" });
    expect(details.getAttribute("aria-expanded")).toBe("true");
    expect(details.getAttribute("data-fp-part")).toBe("shell-collapse-horizontal");
    fireEvent.click(details);
    const topology = screen.getByRole("button", { name: "Topology" });
    expect((topology as HTMLElement).style.writingMode).toBe("vertical-lr");
    expect((topology as HTMLElement).style.display).toBe("flex");
    expect((topology as HTMLElement).style.background).toBe("");
    expect((topology as HTMLElement).style.padding).toBe("");
    const arrow = topology.querySelector<HTMLElement>('[data-fp-part="shell-collapse-icon"]')!;
    expect(arrow.style.writingMode).toBe("horizontal-tb");
    fireEvent.click(topology);
    expect(click).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveBeenCalled();
    expect(view.container.querySelector('[data-host-icon="collapse"][data-fp-part="shell-collapse-icon"]')).toBeTruthy();
    expect(view.container.querySelector('[data-host="code"][data-fp-part="missing-chart-code"]')).toBeTruthy();
    for (const button of view.container.querySelectorAll("button")) expect(button.getAttribute("type")).toBe("button");
  });

  it("keeps shell and empty-recorder controls free of built-in paint when unstyled", () => {
    const change = vi.fn(), ref = vi.fn();
    const view = render(<UnstyledShellLayout tabs={[{ id: "narrative", name: "Run log" }]}
      activeTab="narrative" onTabChange={change} containerRef={ref}>
      <InsightPanel mode="tabs" insights={[]} unstyled />
    </UnstyledShellLayout>);
    expect(view.container.querySelectorAll("[style]")).toHaveLength(0);
    const tab = screen.getByRole("button", { name: "Run log" });
    expect(tab.getAttribute("aria-pressed")).toBe("true");
    expect(tab.getAttribute("data-fp-part")).toBe("shell-tab");
    fireEvent.click(tab);
    expect(change).toHaveBeenCalledExactlyOnceWith("narrative");
    expect(ref).toHaveBeenCalledWith(view.container.firstElementChild);
    expect(screen.getByText("executor.attachScopeRecorder(...)").getAttribute("data-fp-part")).toBe("recorder-attachment-instruction");
  });

  it("uses typography, spacing, control and border recipes in native chrome", () => {
    const view = render(<FootprintTheme tokens={{ typography: { body: "16px", label: "15px" }, controls: { height: "44px" }, borders: { width: "3px", focusWidth: "4px" } }}>
      <RightPanel {...panelProps} size="default" />
      <HLinePill label="Details" expanded onClick={vi.fn()} />
    </FootprintTheme>);
    const run = screen.getByRole("button", { name: "Run data" });
    expect(run.getAttribute("style")).toContain("--fp-font-size-label");
    expect(run.getAttribute("style")).toContain("--fp-control-height");
    expect(run.getAttribute("style")).toContain("--fp-focus-width");
    expect(screen.getByRole("button", { name: "Details" }).getAttribute("style")).toContain("--fp-radius-badge");
    expect(view.container.querySelector(".fp-theme-root")?.getAttribute("style")).toContain("--fp-control-height: 44px");
  });
});
