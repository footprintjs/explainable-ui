import type { BaseComponentProps } from "../../types";
import { theme, componentStyles, FootprintCode } from "../../theme";

export interface ResultPanelProps extends BaseComponentProps {
  /** Final pipeline output / shared state */
  data: Record<string, unknown> | null;
  /** Optional console log lines */
  logs?: string[];
  /** Hide console section (default: false) */
  hideConsole?: boolean;
}

export function ResultPanel({
  data,
  logs = [],
  hideConsole = false,
  size = "default",
  unstyled = false,
  className,
  style,
}: ResultPanelProps) {
  const ui = componentStyles(size);

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="result-panel">
        <div data-fp="result-data">
          <div data-fp="result-heading">{size === "compact" ? "Result" : "Business Result (Scope)"}</div>
          <pre><FootprintCode defaultStyle={undefined}>{data ? JSON.stringify(data, null, 2) : "No data"}</FootprintCode></pre>
        </div>
        {!hideConsole && (
          <div data-fp="result-console">
            <div>Console</div>
            {logs.length === 0 && <div>No console output</div>}
            {logs.map((line, i) => (
              <div key={i} data-fp="console-line" data-error={line.startsWith("ERROR")}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style,
      }}
      data-fp="result-panel"
    >
      <div style={{ flex: 1, overflow: "auto", padding: ui.padding }}>
        <div
          style={{
            fontSize: ui.label,
            fontWeight: ui.weightStrong,
            color: theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: ui.spaceSm,
          }}
        >
          {size === "compact" ? "Result" : "Business Result (Scope)"}
        </div>
        <pre
          style={{
            fontSize: ui.body,
            fontFamily: theme.fontMono,
            color: theme.textPrimary,
            background: theme.bgSecondary,
            padding: ui.padding,
            borderRadius: ui.radiusPanel,
            overflow: "auto",
            margin: 0,
          }}
        >
          <FootprintCode defaultStyle={undefined}>{data ? JSON.stringify(data, null, 2) : "No data"}</FootprintCode>
        </pre>
      </div>

      {!hideConsole && (
        <div
          style={{
            borderTop: `${ui.borderWidth} solid ${theme.border}`,
            padding: ui.padding,
            overflow: "auto",
            maxHeight: "40%",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: ui.label,
              fontWeight: ui.weightStrong,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: ui.spaceSm,
            }}
          >
            Console
          </div>
          {logs.length === 0 && (
            <div style={{ fontSize: ui.body, color: theme.textMuted, fontStyle: "italic" }}>
              No console output
            </div>
          )}
          {logs.map((line, i) => (
            <div
              key={i}
              style={{
                fontSize: ui.body,
                fontFamily: theme.fontMono,
                color: line.startsWith("ERROR") ? theme.error : theme.textPrimary,
                padding: `calc(${ui.spaceXs} / 2) 0`,
                borderBottom: `${ui.borderWidth} solid ${theme.bgSecondary}`,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
