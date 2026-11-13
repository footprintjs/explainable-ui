import type { CSSProperties, ReactNode, RefCallback } from "react";
import { theme } from "../../../theme";
import { HLinePill, VLinePill } from "./ShellChrome";

export interface ShellPanelControl {
  label: string;
  expanded: boolean;
  onChange: (expanded: boolean) => void;
}

interface ShellLayoutProps {
  containerRef: RefCallback<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
  themeStyle: CSSProperties;
  isNarrow: boolean;
  stageCount: number;
  showTopology: boolean;
  showTreeSidebar: boolean;
  topology: ShellPanelControl;
  details: ShellPanelControl;
  timeline: ShellPanelControl;
  slots: {
    rail: ReactNode;
    navigation: ReactNode;
    breadcrumb: ReactNode;
    chart: ReactNode;
    missingChart: ReactNode;
    tree: ReactNode;
    mobileDetails: ReactNode;
    desktopDetails: ReactNode;
    gantt: ReactNode;
    compactTimeline: ReactNode;
  };
}

/** Layout only: selected records, navigation and playback are supplied by the container. */
export function ShellLayout({
  containerRef, className, style, themeStyle, isNarrow, stageCount,
  showTopology, showTreeSidebar, topology, details, timeline, slots,
}: ShellLayoutProps) {
  return (
    <div ref={containerRef} className={className} data-fp="explainable-shell" style={{
      ...themeStyle, height: "100%", display: "flex", flexDirection: "column",
      overflow: "hidden", background: theme.bgPrimary, color: theme.textPrimary,
      fontFamily: theme.fontSans, fontSize: 12, ...style,
    }}>
      {slots.rail}
      {slots.navigation}
      {slots.breadcrumb}
      <div style={{ flex: 1, overflow: isNarrow ? "auto" : "hidden", display: "flex", flexDirection: "column" }}>
        {isNarrow ? (
          <>
            {showTopology && <div style={{ height: 350, flexShrink: 0, overflow: "hidden" }}>{slots.chart}</div>}
            {slots.missingChart}
            {showTreeSidebar && <>
              <HLinePill label={topology.label} expanded={topology.expanded} onClick={() => topology.onChange(!topology.expanded)} />
              {topology.expanded && <div style={{ maxHeight: 180, overflow: "auto", flexShrink: 0 }}>{slots.tree}</div>}
            </>}
            <HLinePill label={details.label} expanded={details.expanded} onClick={() => details.onChange(!details.expanded)} />
            {details.expanded && <div style={{ maxHeight: 350, flexShrink: 0, overflow: "hidden" }}>{slots.mobileDetails}</div>}
            <HLinePill label={timeline.label} detail={`${stageCount} stages`} expanded={timeline.expanded} onClick={() => timeline.onChange(!timeline.expanded)} />
            {timeline.expanded && <div style={{ flexShrink: 0, overflow: "hidden" }}>{slots.gantt}</div>}
          </>
        ) : (
          <>
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {showTreeSidebar && (topology.expanded ? (
                <div style={{ width: 180, flexShrink: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
                  <div style={{ flex: 1, overflow: "auto" }}>{slots.tree}</div>
                  <VLinePill label={topology.label} expanded side="left" onClick={() => topology.onChange(false)} />
                </div>
              ) : <VLinePill label={topology.label} expanded={false} side="left" onClick={() => topology.onChange(true)} />)}
              {showTopology ? (
                <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>{slots.chart}</div>
              ) : (
                <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>{slots.missingChart}</div>
              )}
              <VLinePill label={details.label} expanded={details.expanded} onClick={() => details.onChange(!details.expanded)} />
              {details.expanded && <div style={{ width: "42%", minWidth: 320, maxWidth: 550, display: "flex", flexDirection: "column", overflow: "hidden" }}>{slots.desktopDetails}</div>}
            </div>
            {slots.compactTimeline}
          </>
        )}
      </div>
    </div>
  );
}

interface ShellTabDefinition { id: string; name: string; description?: string }
interface ShellTabsProps {
  tabs: ShellTabDefinition[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
}

export function UnstyledShellLayout({ tabs, activeTab, onTabChange, children, className, style }: ShellTabsProps & { className?: string; style?: CSSProperties }) {
  return <div className={className} style={style} data-fp="explainable-shell">
    <div data-fp="shell-tabs">
      {tabs.map(tab => <button key={tab.id} data-fp="shell-tab" data-active={tab.id === activeTab} onClick={() => onTabChange(tab.id)}>{tab.name}</button>)}
    </div>
    <div data-fp="shell-content" data-tab={activeTab}>{children}</div>
  </div>;
}

export function ShellDetailTabs({ tabs, activeTab, onTabChange, children }: ShellTabsProps) {
  return <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
    <div style={{ display: "flex", borderBottom: `1px solid ${theme.border}`, background: theme.bgSecondary, flexShrink: 0, overflowX: "auto" }}>
      {tabs.map(tab => {
        const active = tab.id === activeTab;
        return <button key={tab.id} onClick={() => onTabChange(tab.id)} title={tab.description} style={{
          padding: "6px 14px", fontSize: 11, fontWeight: active ? 700 : 500,
          textTransform: "uppercase", letterSpacing: "0.08em", color: active ? theme.primary : theme.textMuted,
          background: "transparent", border: "none", borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
          cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
        }}>{tab.name}</button>;
      })}
    </div>
    <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
  </div>;
}
