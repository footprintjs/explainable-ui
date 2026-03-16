import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";

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
      current.steps.push({ text: trimmed, idx: i });
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NarrativeTrace({
  narrative,
  revealedCount,
  defaultCollapsed = false,
  onStageClick,
  size = "default",
  unstyled = false,
  className,
  style,
}: NarrativeTraceProps) {
  const revealed = revealedCount != null ? narrative.slice(0, revealedCount) : narrative;
  const future = revealedCount != null ? narrative.slice(revealedCount) : [];

  const revealedGroups = useMemo(() => parseGroups(revealed), [revealed]);
  const futureGroups = useMemo(() => parseGroups(future), [future]);

  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(() => {
    if (!defaultCollapsed) return new Set();
    return new Set(parseGroups(narrative).map((g) => g.headerIdx));
  });

  const latestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealedGroups.length]);

  const toggle = useCallback((idx: number) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const lastIdx = revealedGroups.length - 1;
  const fs = fontSize[size];
  const pad = padding[size];

  // ── Unstyled mode ──
  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="narrative-trace">
        {revealedGroups.map((group, gi) => (
          <div key={group.headerIdx} data-fp="narrative-group" data-latest={gi === lastIdx}>
            <div
              data-fp="narrative-header"
              data-collapsible={group.steps.length > 0}
              data-collapsed={collapsedSet.has(group.headerIdx)}
              role={group.steps.length > 0 ? "button" : undefined}
              tabIndex={group.steps.length > 0 ? 0 : undefined}
              aria-expanded={group.steps.length > 0 ? !collapsedSet.has(group.headerIdx) : undefined}
              aria-label={`Stage ${gi + 1}, ${group.steps.length} steps${gi === lastIdx ? ", current" : ""}`}
              onClick={() => {
                if (group.steps.length > 0) toggle(group.headerIdx);
                onStageClick?.(group.headerIdx);
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (group.steps.length > 0) toggle(group.headerIdx);
                  onStageClick?.(group.headerIdx);
                }
              }}
            >
              {group.header}
            </div>
            {!collapsedSet.has(group.headerIdx) &&
              group.steps.map((step) => (
                <div key={step.idx} data-fp="narrative-step">
                  {step.text}
                </div>
              ))}
          </div>
        ))}
        {futureGroups.map((group) => (
          <div key={`f-${group.headerIdx}`} data-fp="narrative-group" data-future>
            <div data-fp="narrative-header">{group.header}</div>
            {group.steps.map((step) => (
              <div key={`f-${step.idx}`} data-fp="narrative-step">
                {step.text}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ── Styled mode ──
  return (
    <div
      className={className}
      style={{
        flex: 1,
        overflow: "auto",
        padding: pad,
        fontFamily: theme.fontMono,
        ...style,
      }}
      data-fp="narrative-trace"
    >
      {revealedGroups.map((group, gi) => {
        const isLatest = gi === lastIdx;
        const isCollapsed = collapsedSet.has(group.headerIdx);
        const hasSteps = group.steps.length > 0;

        return (
          <div
            key={group.headerIdx}
            ref={isLatest ? latestRef : undefined}
            style={{ marginBottom: 2 }}
            data-fp="narrative-group"
          >
            {/* Stage header */}
            <div
              role={hasSteps ? "button" : undefined}
              tabIndex={hasSteps ? 0 : undefined}
              aria-expanded={hasSteps ? !isCollapsed : undefined}
              aria-label={`Stage ${gi + 1}, ${group.steps.length} steps${isLatest ? ", current" : ", completed"}`}
              onClick={() => {
                if (hasSteps) toggle(group.headerIdx);
                onStageClick?.(group.headerIdx);
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (hasSteps) toggle(group.headerIdx);
                  onStageClick?.(group.headerIdx);
                }
              }}
              style={{
                fontSize: fs.body,
                lineHeight: 1.7,
                color: isLatest ? theme.textPrimary : theme.textSecondary,
                padding: `4px ${pad - 4}px`,
                borderRadius: 4,
                background: isLatest ? theme.bgTertiary : "transparent",
                borderLeft: isLatest
                  ? `3px solid ${theme.primary}`
                  : `3px solid ${theme.success}`,
                cursor: hasSteps ? "pointer" : "default",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                userSelect: "none",
                transition: "all 0.15s ease",
              }}
            >
              {hasSteps && (
                <span
                  style={{
                    fontSize: fs.small - 1,
                    color: theme.textMuted,
                    transition: "transform 0.15s ease",
                    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    display: "inline-block",
                    width: 10,
                    flexShrink: 0,
                  }}
                >
                  &#9660;
                </span>
              )}
              {!hasSteps && <span style={{ width: 10, flexShrink: 0 }} />}
              <span>{group.header}</span>
            </div>

            {/* Step lines */}
            {!isCollapsed &&
              group.steps.map((step) => (
                <div
                  key={step.idx}
                  style={{
                    fontSize: fs.small,
                    lineHeight: 1.6,
                    color: isLatest ? theme.textSecondary : theme.textMuted,
                    padding: `2px ${pad - 4}px 2px ${pad + 20}px`,
                    opacity: isLatest ? 0.9 : 0.7,
                    transition: "all 0.15s ease",
                  }}
                  data-fp="narrative-step"
                >
                  {step.text}
                </div>
              ))}
          </div>
        );
      })}

      {/* Dimmed future groups */}
      {futureGroups.length > 0 && (
        <div style={{ opacity: 0.2 }}>
          {futureGroups.map((group) => (
            <div key={`f-${group.headerIdx}`} style={{ marginBottom: 2 }}>
              <div
                style={{
                  fontSize: fs.body,
                  lineHeight: 1.7,
                  color: theme.textMuted,
                  padding: `4px ${pad - 4}px`,
                  borderLeft: `3px solid ${theme.border}`,
                  fontWeight: 600,
                  paddingLeft: pad + 12,
                }}
              >
                {group.header}
              </div>
              {group.steps.map((step) => (
                <div
                  key={`f-${step.idx}`}
                  style={{
                    fontSize: fs.small,
                    lineHeight: 1.6,
                    color: theme.textMuted,
                    padding: `2px ${pad - 4}px 2px ${pad + 20}px`,
                  }}
                >
                  {step.text}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
