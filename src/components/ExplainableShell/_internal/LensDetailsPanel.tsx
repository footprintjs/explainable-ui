import { useId, type ReactNode } from "react";
import { componentStyles, FootprintTab, theme } from "../../../theme";
import type { Size } from "../../../types";
import type { LensView } from "../LensWorkbench";

interface LensDetailsPanelProps {
  view: LensView;
  onViewChange?: (view: LensView) => void;
  developer: ReactNode;
  commentary: ReactNode;
  size?: Size;
  unstyled?: boolean;
}

/** Only the details presentation changes; chart and replay keep their mounted state. */
export function LensDetailsPanel({ view, onViewChange, developer, commentary, size, unstyled = false }: LensDetailsPanelProps) {
  const id = useId();
  const ui = componentStyles(size);
  return <div data-fp="lens-details" data-view={view} style={unstyled ? undefined : {
    display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden",
  }}>
    {onViewChange ? <div role="tablist" aria-label="Details view" data-fp="lens-view-tabs" style={unstyled ? undefined : {
      display: "flex", flexShrink: 0, borderBottom: `${ui.borderWidth} solid ${theme.border}`, background: theme.bgSecondary,
    }}>
      {([['developer', 'Developer'], ['story', 'Commentary']] as const).map(([value, label]) => <FootprintTab
        key={value} id={`${id}-${value}`} role="tab" type="button" aria-selected={view === value}
        aria-controls={`${id}-content`} part="lens-view-tab" unstyled={unstyled} densitySize={size}
        tabIndex={view === value ? 0 : -1}
        onKeyDown={event => {
          const next = event.key === "Home" ? "developer" : event.key === "End" ? "story"
            : event.key === "ArrowLeft" || event.key === "ArrowRight" ? value === "developer" ? "story" : "developer" : undefined;
          if (!next) return;
          event.preventDefault();
          onViewChange(next);
          event.currentTarget.ownerDocument.getElementById(`${id}-${next}`)?.focus();
        }}
        onClick={() => onViewChange(value)} style={unstyled ? undefined : { flex: 1 }} defaultStyle={unstyled ? undefined : {
          padding: ui.controlPadding, minHeight: ui.controlHeight, fontFamily: theme.fontSans,
          fontSize: ui.label, fontWeight: ui.weightStrong, lineHeight: ui.lineHeight,
          color: view === value ? theme.primary : theme.textSecondary, background: "transparent", border: "none",
          borderBottom: `${ui.focusWidth} solid ${view === value ? theme.primary : "transparent"}`, cursor: "pointer",
        }}>{label}</FootprintTab>)}
    </div> : <div data-fp="lens-view-label" style={unstyled ? undefined : {
      padding: ui.controlPadding, borderBottom: `${ui.borderWidth} solid ${theme.border}`,
      fontSize: ui.label, fontWeight: ui.weightStrong, color: theme.textSecondary,
    }}>{view === "story" ? "Commentary" : "Developer"}</div>}
    <div id={`${id}-content`} role={onViewChange ? "tabpanel" : undefined}
      aria-labelledby={onViewChange ? `${id}-${view}` : undefined} style={unstyled ? undefined : { flex: 1, minHeight: 0, overflow: "auto" }}>
      {view === "story" ? commentary : developer}
    </div>
  </div>;
}
