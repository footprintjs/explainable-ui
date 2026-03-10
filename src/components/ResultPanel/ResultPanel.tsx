import type { BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";

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
  const fs = fontSize[size];
  const pad = padding[size];

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="result-panel">
        <div data-fp="result-data">
          <pre>{data ? JSON.stringify(data, null, 2) : "No data"}</pre>
        </div>
        {!hideConsole && (
          <div data-fp="result-console">
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
      {data && (
        <div style={{ flex: 1, overflow: "auto", padding: pad }}>
          <div
            style={{
              fontSize: fs.label,
              fontWeight: 600,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            {size === "compact" ? "Result" : "Business Result (Scope)"}
          </div>
          <pre
            style={{
              fontSize: fs.body,
              fontFamily: theme.fontMono,
              color: theme.textPrimary,
              background: theme.bgSecondary,
              padding: pad,
              borderRadius: theme.radius,
              overflow: "auto",
              margin: 0,
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {!hideConsole && (
        <div
          style={{
            borderTop: `1px solid ${theme.border}`,
            padding: pad,
            overflow: "auto",
            maxHeight: "40%",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: fs.label,
              fontWeight: 600,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Console
          </div>
          {logs.length === 0 && (
            <div style={{ fontSize: fs.body, color: theme.textMuted, fontStyle: "italic" }}>
              No console output
            </div>
          )}
          {logs.map((line, i) => (
            <div
              key={i}
              style={{
                fontSize: fs.body,
                fontFamily: theme.fontMono,
                color: line.startsWith("ERROR") ? theme.error : theme.textPrimary,
                padding: "2px 0",
                borderBottom: `1px solid ${theme.bgSecondary}`,
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
