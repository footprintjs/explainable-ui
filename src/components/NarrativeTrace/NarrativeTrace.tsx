import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { BaseComponentProps } from "../../types";
import { theme, componentStyles, FootprintButton } from "../../theme";
import { useTraceMotion } from "../../_internal/useTraceMotion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NarrativeGroup {
  header: string;
  headerIdx: number;
  steps: { text: string; idx: number }[];
}

export interface NarrativeTraceProps extends BaseComponentProps {
  /** All narrative lines (full trace) */
  narrative: string[];
  /** Number of lines currently revealed (for progressive reveal). Defaults to all. */
  revealedCount?: number;
  /** Start with all groups collapsed */
  defaultCollapsed?: boolean;
  /** Called when user clicks a stage header */
  onStageClick?: (headerIndex: number) => void;
  /** Follow revealed sections only when the reader opts in. */
  followCursor?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseGroups(lines: string[]): NarrativeGroup[] {
  const groups: NarrativeGroup[] = [];
  let current: NarrativeGroup | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const isStep = trimmed.startsWith("Step ") || /^\s/.test(line);

    if (!isStep || !current) {
      current = { header: line, headerIdx: i, steps: [] };
      groups.push(current);
    } else {
      current.steps.push({ text: line, idx: i });
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NarrativeTrace({
  narrative, revealedCount, defaultCollapsed = false, onStageClick, followCursor = false,
  size = "default", unstyled = false, className, style,
}: NarrativeTraceProps) {
  const revealed = revealedCount != null ? narrative.slice(0, revealedCount) : narrative;
  const future = revealedCount != null ? narrative.slice(revealedCount) : [];
  const revealedGroups = useMemo(() => parseGroups(revealed), [revealed]);
  const futureGroups = useMemo(() => parseGroups(future), [future]);
  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(() =>
    defaultCollapsed ? new Set(parseGroups(narrative).map(group => group.headerIdx)) : new Set());
  const latestRef = useRef<HTMLDivElement>(null);
  const motion = useTraceMotion();
  useEffect(() => {
    if (!followCursor) return;
    try { if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return; } catch { /* Unsupported hosts can follow without animation. */ }
    latestRef.current?.scrollIntoView?.({ behavior: motion ? "smooth" : "auto", block: "nearest" });
  }, [followCursor, motion, revealedGroups.length, revealedCount]);
  const toggle = useCallback((index: number) => setCollapsedSet(previous => {
    const next = new Set(previous);
    if (next.has(index)) next.delete(index); else next.add(index);
    return next;
  }), []);
  const chrome = componentStyles(size);
  const sx = (value: React.CSSProperties): React.CSSProperties | undefined => unstyled ? undefined : value;
  const lastIndex = revealedGroups.length - 1;

  return <div className={className} data-fp="narrative-trace" role="log" aria-label="Recorded narrative lines"
    style={{ ...sx({ flex: 1, overflow: "auto", padding: chrome.padding, fontFamily: theme.fontMono, color: theme.textPrimary }), ...style }}>
    {revealedGroups.map((group, index) => {
      const latest = index === lastIndex, collapsed = collapsedSet.has(group.headerIdx), hasSteps = group.steps.length > 0;
      const header = <>{hasSteps && <span aria-hidden="true" style={sx({ display: "inline-block", width: chrome.iconSize, flexShrink: 0 })}>{collapsed ? "▸" : "▾"}</span>}<span>{group.header}</span></>;
      const headerStyle: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: chrome.spaceXs,
        textAlign: "left", width: "100%", minWidth: 0, border: "none", borderLeft: `${chrome.borderWidth} solid ${latest ? theme.accent : theme.border}`,
        background: latest ? theme.accentBg : "transparent", color: theme.textPrimary, borderRadius: chrome.radiusControl,
        padding: chrome.controlPadding, fontFamily: theme.fontSans, fontSize: chrome.body, fontWeight: chrome.weightStrong,
        lineHeight: chrome.lineHeight, whiteSpace: "pre-wrap", overflowWrap: "anywhere" };
      return <div key={group.headerIdx} ref={latest ? latestRef : undefined} data-fp="narrative-group" data-latest={latest || undefined}
        style={sx({ marginBottom: chrome.spaceXs, minWidth: 0 })}>
        {hasSteps || onStageClick ? <FootprintButton data-fp="narrative-header" data-collapsible={hasSteps}
          data-collapsed={collapsed} aria-expanded={hasSteps ? !collapsed : undefined}
          aria-label={`Recorded section: ${group.header}${hasSteps ? `, ${group.steps.length} lines` : ""}`}
          onClick={() => { if (hasSteps) toggle(group.headerIdx); onStageClick?.(group.headerIdx); }}
          defaultStyle={{ ...headerStyle, cursor: "pointer" }} unstyled={unstyled} densitySize={size} part="narrative-section">
          {header}
        </FootprintButton> : <div data-fp="narrative-header" style={sx(headerStyle)}>{header}</div>}
        {!collapsed && group.steps.map(step => <div key={step.idx} data-fp="narrative-step"
          style={sx({ fontSize: chrome.body, lineHeight: chrome.lineHeight, color: theme.textSecondary,
            padding: chrome.controlPadding, paddingLeft: chrome.spaceLg, whiteSpace: "pre-wrap", overflowWrap: "anywhere" })}>
          {step.text}
        </div>)}
      </div>;
    })}
    {revealedGroups.length === 0 && <p data-fp="narrative-empty" style={sx({ margin: 0, fontSize: chrome.body, color: theme.textSecondary })}>No recorded lines at this selected step.</p>}
    {futureGroups.length > 0 && <div data-fp="narrative-future-hint" style={sx({ fontSize: chrome.small, color: theme.textSecondary, padding: chrome.controlPadding })}>
      {futureGroups.length} more recorded {futureGroups.length === 1 ? "section" : "sections"} ahead...
    </div>}
  </div>;
}
