import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { CauseResult, Gap } from "foottrace/cause";
type Attention = CauseResult["attention"][number];
import { theme } from "../../theme/styles";
import { useIsomorphicLayoutEffect } from "../../_internal/useIsomorphicLayoutEffect";
import {
  admitAttention,
  admitExplanation,
  displayLabel,
  gapMessages,
} from "./admission";
import type { InvestigationPanelProps, InvestigationResult } from "./types";

const box: CSSProperties = {
  color: theme.textPrimary,
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  padding: 20,
  fontFamily: theme.fontSans,
  lineHeight: 1.5,
  minWidth: 0,
  overflowWrap: "anywhere",
};
const button: CSSProperties = {
  color: theme.textPrimary,
  background: theme.bgSecondary,
  border: `1px solid ${theme.border}`,
  borderRadius: 6,
  padding: "6px 10px",
  font: "inherit",
  cursor: "pointer",
};
const row: CSSProperties = {
  borderBlockEnd: `1px solid ${theme.border}`,
  paddingBlock: 12,
};
const attentionNames: Record<string, string> = {
  error: "Recorded error",
  "unknown-effect": "Outcome unknown",
  "gave-up": "Stopped retrying",
  timeout: "Timed out",
  retried: "Retried",
  "quality-drop": "Quality changed",
  "not-collected": "Evidence unavailable",
  outlier: "Unusual result",
};
function Badges({ marks }: { marks: readonly Attention[] }) {
  return (
    <>
      {marks.map((mark, index) => (
        <span
          key={index}
          style={{
            display: "inline-block",
            marginInlineEnd: 6,
            marginBlock: 3,
            padding: "2px 7px",
            borderRadius: 4,
            background: theme.accentBg,
          }}
        >
          {Object.prototype.hasOwnProperty.call(attentionNames, mark.kind)
            ? attentionNames[mark.kind]
            : mark.kind}
        </span>
      ))}
    </>
  );
}
function Gaps({ gaps }: { gaps: readonly Gap[] }) {
  return (
    <>
      {gaps.map((gap, index) => (
        <p key={index} role="status">
          {gapMessages[gap.code]}
        </p>
      ))}
    </>
  );
}
type QueryState =
  | {
      [Status in "loading" | "error" | "refused"]: {
        owner: object;
        nodeId: string;
        request: AbortController;
        status: Status;
      };
    }["loading" | "error" | "refused"]
  | {
      owner: object;
      nodeId: string;
      request: AbortController;
      status: "ready";
      result: InvestigationResult;
    };
type FocusIntent =
  | { owner: object; kind: "explanation"; request: AbortController }
  | { owner: object; kind: "attention"; nodeId: string };

/** Bounded presentation over host-selected canonical Foottrace results. Never traverses or loads a graph. */
export function InvestigationPanel(props: InvestigationPanelProps) {
  if (!props.port)
    return (
      <section
        aria-label="Investigation"
        className={props.className}
        style={{ ...box, ...props.style }}
      >
        <h2>Needs attention</h2>
        <p role="status">Investigation is unavailable for this recording.</p>
      </section>
    );
  return <BoundInvestigationPanel {...props} port={props.port} />;
}
function BoundInvestigationPanel({
  port,
  className,
  style,
}: InvestigationPanelProps & {
  port: NonNullable<InvestigationPanelProps["port"]>;
}) {
  const attention = useMemo(
    () => admitAttention(port.attention),
    [port.attention]
  );
  const owner = port.binding;
  const currentOwner = useRef<object | null>(null);
  const active = useRef<AbortController | null>(null);
  const explanationElement = useRef<HTMLElement | null>(null);
  const attentionElements = useRef(new Map<string, HTMLButtonElement>());
  const returnTo = useRef<{ owner: object; nodeId: string } | null>(null);
  const focusIntent = useRef<FocusIntent | null>(null);
  const [state, setState] = useState<QueryState | null>(null);
  const [page, setPage] = useState({ owner, count: 20 });
  const visible = page.owner === owner ? page.count : 20;
  const [showPath, setShowPath] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  // Speculative renders must not change the committed owner. Layout cleanup
  // invalidates and aborts old work before commit callbacks or promise reactions
  // can observe a newly committed binding; abandoned renders leave it untouched.
  useIsomorphicLayoutEffect(() => {
    currentOwner.current = owner;
    if (returnTo.current?.owner !== owner) returnTo.current = null;
    // Suspense can replay layout setup while retaining this component's state.
    // A request canceled while hidden must not reappear as orphaned loading.
    if (!active.current) {
      setState((previous) =>
        previous?.owner === owner && previous.status === "loading"
          ? null
          : previous
      );
    }
    return () => {
      currentOwner.current = null;
      focusIntent.current = null;
      active.current?.abort();
      active.current = null;
    };
  }, [owner]);
  const selected = state?.owner === owner ? state : null;
  // Only explicit user actions request focus. Consume intent after their state
  // and callback refs commit, never during speculative render or settlement.
  useIsomorphicLayoutEffect(() => {
    const intent = focusIntent.current;
    if (!intent || intent.owner !== owner || currentOwner.current !== owner)
      return;
    if (intent.kind === "explanation") {
      if (
        selected?.request !== intent.request ||
        active.current !== intent.request ||
        intent.request.signal.aborted
      )
        return;
      focusIntent.current = null;
      explanationElement.current?.focus();
    } else if (!selected) {
      focusIntent.current = null;
      attentionElements.current.get(intent.nodeId)?.focus();
    }
  });
  const close = () => {
    active.current?.abort();
    active.current = null;
    const target = returnTo.current;
    focusIntent.current =
      target?.owner === owner ? { ...target, kind: "attention" } : null;
    setState(null);
  };
  const query = (nodeId: string, fromAttention = false) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    if (fromAttention) returnTo.current = { owner, nodeId };
    focusIntent.current = { owner, kind: "explanation", request: controller };
    setShowPath(false);
    setShowImpact(false);
    setShowAlternatives(false);
    setState({ owner, nodeId, request: controller, status: "loading" });
    // Deferring the host call also captures a synchronous refusal without exposing its error details.
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted || currentOwner.current !== owner)
          return undefined;
        return port.explain(nodeId, { signal: controller.signal });
      })
      .then(
        (value) => {
          if (
            active.current !== controller ||
            controller.signal.aborted ||
            currentOwner.current !== owner
          )
            return;
          const result = admitExplanation(value, nodeId);
          setState(
            result
              ? { owner, nodeId, request: controller, status: "ready", result }
              : { owner, nodeId, request: controller, status: "refused" }
          );
        },
        () => {
          if (
            active.current === controller &&
            !controller.signal.aborted &&
            currentOwner.current === owner
          )
            setState({ owner, nodeId, request: controller, status: "error" });
        }
      );
  };
  const label = (nodeId: string) => displayLabel(port.labels, nodeId);
  const item = (nodeId: string, index: number) => (
    <li key={`${index}:${nodeId}`} style={row}>
      <span>{label(nodeId)}</span>{" "}
      <button
        type="button"
        style={button}
        aria-label={`Investigate related item ${index + 1}`}
        onClick={() => query(nodeId)}
      >
        Investigate
      </button>
    </li>
  );
  return (
    <section
      aria-label="Investigation"
      className={className}
      style={{ ...box, ...style }}
    >
      <h2 style={{ marginBlockStart: 0 }}>Needs attention</h2>
      <p style={{ color: theme.textSecondary }}>
        Choose an item to inspect its recorded causes and effects.
      </p>
      {!attention ? (
        <p role="alert">The attention list could not be verified.</p>
      ) : (
        <>
          <Gaps gaps={attention.gaps} />
          {attention.confidence === "incomplete" &&
            attention.nodes.length > 0 && (
              <p role="status">
                Attention coverage is incomplete. Other outcomes remain unknown.
              </p>
            )}
          {!attention.nodes.length ? (
            <p>
              {attention.confidence === "incomplete" || attention.gaps.length
                ? "No attention items are available. Coverage is unknown."
                : "No attention items were reported in the supplied evidence."}
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {attention.nodes
                .slice(0, selected ? 20 : visible)
                .map((node, index) => (
                  <li key={node.nodeId} style={row}>
                    <div>{label(node.nodeId)}</div>
                    <Badges marks={node.attention} />{" "}
                    <button
                      ref={(element) => {
                        if (element)
                          attentionElements.current.set(node.nodeId, element);
                        else attentionElements.current.delete(node.nodeId);
                      }}
                      type="button"
                      style={button}
                      aria-label={`Investigate item ${index + 1}`}
                      onClick={() => query(node.nodeId, true)}
                    >
                      Investigate
                    </button>
                  </li>
                ))}
            </ul>
          )}
          {!selected && attention.nodes.length > visible && (
            <button
              type="button"
              style={button}
              onClick={() => setPage({ owner, count: visible + 20 })}
            >
              Show more attention items
            </button>
          )}
        </>
      )}
      {selected && (
        <section
          ref={explanationElement}
          tabIndex={-1}
          aria-label="Selected explanation"
          aria-busy={selected.status === "loading"}
          style={{
            borderBlockStart: `1px solid ${theme.border}`,
            marginBlockStart: 20,
            paddingBlockStart: 16,
          }}
        >
          <button type="button" style={button} onClick={close}>
            Close investigation
          </button>
          <h3>{label(selected.nodeId)}</h3>
          {selected.status === "loading" ? (
            <p role="status">Loading explanation…</p>
          ) : selected.status === "error" ? (
            <>
              <p role="alert">Explanation unavailable. Try again.</p>
              <button
                type="button"
                style={button}
                onClick={() => query(selected.nodeId)}
              >
                Try again
              </button>
            </>
          ) : selected.status === "refused" ? (
            <>
              <p role="alert">This explanation could not be verified.</p>
              <p>
                Its evidence is unsupported, too large, or from a different
                selection.
              </p>
            </>
          ) : (
            <>
              <Badges marks={selected.result.attention} />
              <h4>
                {selected.result.rootCause
                  ? "Supported root cause"
                  : "Root cause unknown"}
              </h4>
              {selected.result.rootCause && (
                <p>{label(selected.result.rootCause)}</p>
              )}
              {!selected.result.rootCause && (
                <p>The supplied evidence does not establish one root cause.</p>
              )}
              {!!selected.result.gaps.length && <h4>Evidence coverage</h4>}
              <Gaps gaps={selected.result.gaps} />
              {selected.result.confidence === "incomplete" &&
                !selected.result.gaps.length && (
                  <p role="status">The recorded explanation is incomplete.</p>
                )}
              <details>
                <summary>Recorded evidence references</summary>
                <ul>
                  {[
                    ...selected.result.attention.flatMap(
                      (mark) => mark.evidence
                    ),
                    ...selected.result.gaps.flatMap((gap) => gap.evidence),
                    ...selected.result.impact.gaps.flatMap(
                      (gap) => gap.evidence
                    ),
                  ].map((reference, index) => (
                    <li key={index}>{reference}</li>
                  ))}
                </ul>
              </details>
              <button
                type="button"
                style={button}
                aria-expanded={showPath}
                onClick={() => setShowPath((value) => !value)}
              >
                {showPath ? "Hide recorded path" : "Show recorded path"}
              </button>
              {showPath && (
                <>
                  <h4>Recorded dependency path</h4>
                  {selected.result.path.length ? (
                    <ol>{selected.result.path.map(item)}</ol>
                  ) : (
                    <p>No dependency path was supplied.</p>
                  )}
                </>
              )}
              {!!selected.result.alternatives.length && (
                <>
                  <h4>Alternative candidates</h4>
                  <p>These candidates remain uncertain.</p>
                  <button
                    type="button"
                    style={button}
                    aria-expanded={showAlternatives}
                    onClick={() => setShowAlternatives((value) => !value)}
                  >
                    {showAlternatives
                      ? "Hide alternative candidates"
                      : "Show alternative candidates"}
                  </button>
                  {showAlternatives && (
                    <ul>{selected.result.alternatives.map(item)}</ul>
                  )}
                </>
              )}
              <div style={{ marginBlockStart: 16 }}>
                <button
                  type="button"
                  style={button}
                  aria-expanded={showImpact}
                  onClick={() => setShowImpact((value) => !value)}
                >
                  {showImpact ? "Hide affected items" : "Show affected items"}
                </button>
              </div>
              {showImpact && (
                <>
                  <h4>Affected items</h4>
                  <Gaps gaps={selected.result.impact.gaps} />
                  {selected.result.impact.confidence === "incomplete" && (
                    <p role="status">
                      Affected-item coverage is incomplete. Unlisted items
                      remain unknown.
                    </p>
                  )}
                  {selected.result.impact.nodes.length ? (
                    <ul>{selected.result.impact.nodes.map(item)}</ul>
                  ) : (
                    <p>
                      No affected items were reported in the supplied evidence.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </section>
      )}
    </section>
  );
}
