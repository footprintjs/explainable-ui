import { useState, type CSSProperties, type ReactNode, type Ref } from "react";
import type { BaseComponentProps, NarrativeEntry } from "../../../types";
import { componentStyles, FootprintButton, theme } from "../../../theme";

export interface RecordedVisitItem {
  readonly entry: NarrativeEntry;
  readonly index: number;
}

/** Presentation only: its caller has already admitted every item to one cursor. */
export function RecordedVisit({
  id, label, items, current, showRuntimeId = false, prefix, renderItem, followRef,
  size = "default", unstyled = false,
}: {
  readonly id?: string;
  readonly label: string;
  readonly items: readonly RecordedVisitItem[];
  readonly current: boolean;
  readonly showRuntimeId?: boolean;
  readonly prefix: "narrative" | "commentary";
  readonly renderItem: (item: RecordedVisitItem) => ReactNode;
  readonly followRef?: Ref<HTMLDivElement>;
  readonly size?: NonNullable<BaseComponentProps["size"]>;
  readonly unstyled?: boolean;
}) {
  const chrome = componentStyles(size);
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;
  const blocks: { operations: boolean; items: RecordedVisitItem[] }[] = [];
  for (const item of items) {
    const operations = item.entry.type === "step", previous = blocks[blocks.length - 1];
    if (previous?.operations === operations) previous.items.push(item);
    else blocks.push({ operations, items: [item] });
  }
  return <section data-fp={`${prefix}-visit`} data-runtime-stage-id={id} data-current={current || undefined}
    aria-label={showRuntimeId ? id ? `Recorded visit ${id}` : "Unbound recorded entries" : `Stage ${label}`}
    style={sx({ border: `${chrome.borderWidth} solid ${current ? theme.accent : theme.border}`,
      borderRadius: chrome.radiusPanel, padding: chrome.padding, marginBottom: chrome.spaceMd,
      background: current ? theme.accentBg : theme.bgPrimary, minWidth: 0 })}>
    {id && <header style={sx({ marginBottom: chrome.spaceSm, overflowWrap: "anywhere" })}>
      <div ref={followRef} data-fp={`${prefix}-visit-heading`}>
        <strong style={sx({ fontSize: chrome.body })}>{label}</strong>
        {current && <span style={sx({ color: theme.accent, marginLeft: chrome.spaceSm, fontSize: chrome.small })}>Selected step</span>}
        {showRuntimeId && <code style={sx({ display: "block", fontFamily: theme.fontMono, fontSize: chrome.small,
          color: theme.textSecondary, marginTop: chrome.spaceXs })}>{id}</code>}
      </div>
    </header>}
    {blocks.map(block => block.operations ? <details key={block.items[0].index} data-fp={`${prefix}-operations`}
      style={sx({ margin: `${chrome.spaceXs} 0`, overflowWrap: "anywhere" })}>
      <summary style={sx({ cursor: "pointer", fontSize: chrome.body, color: theme.textSecondary })}>
        Recorded operations ({block.items.length})
      </summary>
      <div style={sx({ marginTop: chrome.spaceSm })}>{block.items.map(renderItem)}</div>
    </details> : <div key={block.items[0].index}>{block.items.map(renderItem)}</div>)}
  </section>;
}

export function recordedTextStyle(entry: NarrativeEntry, chrome: ReturnType<typeof componentStyles>): CSSProperties {
  const heading = entry.type === "stage" || entry.type === "subflow";
  const emphasis = entry.type === "condition" || entry.type === "retry" || entry.type === "attempt";
  const failed = entry.type === "error" || entry.type === "break";
  return { fontWeight: heading ? chrome.weightStrong : chrome.weightNormal,
    color: failed ? theme.error : emphasis ? theme.warning : theme.textPrimary,
    fontFamily: entry.type === "step" ? theme.fontMono : theme.fontSans };
}

export function RecordedText({ text, size, unstyled }: {
  readonly text: string;
  readonly size: NonNullable<BaseComponentProps["size"]>;
  readonly unstyled: boolean;
}) {
  const [expandedText, setExpandedText] = useState<string | null>(null);
  const expanded = expandedText === text;
  const limit = 600;
  const chrome = componentStyles(size);
  if (text.length <= limit) return text;
  return <>
    <span>{expanded ? text : `${text.slice(0, limit)}…`}</span>
    <FootprintButton unstyled={unstyled} densitySize={size} part="narrative-text-toggle"
      aria-expanded={expanded} onClick={() => setExpandedText(value => value === text ? null : text)}
      defaultStyle={{ display: "block", marginTop: chrome.spaceXs, border: `${chrome.borderWidth} solid ${theme.border}`,
        borderRadius: chrome.radiusControl, padding: chrome.controlPadding, color: theme.textPrimary,
        background: theme.bgSecondary, fontSize: chrome.small, cursor: "pointer", fontFamily: theme.fontSans }}>
      {expanded ? "Show less recorded text" : `Show full recorded text (${text.length} characters)`}
    </FootprintButton>
  </>;
}
