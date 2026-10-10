import { useId } from "react";
import type { CSSProperties } from "react";
import type { StateKey } from "foottrace";
import { theme } from "../theme/styles";
import { buildRecordLensModel } from "./model";
import { previewValue } from "./preview";
import type { RecordLensInput } from "./types";

export interface RecordLensProps extends RecordLensInput {
  /** Read-only navigation intent. The host owns and updates the selected step. */
  readonly onStepChange?: (step: number) => void;
  /** Exact top-level key segments; a dotted property name stays a single key. */
  readonly onKeyChange?: (key: StateKey) => void;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const panel: CSSProperties = {
  color: theme.textPrimary,
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  padding: 20,
  fontFamily: theme.fontSans,
  lineHeight: 1.5,
  minWidth: 0,
};
const control: CSSProperties = {
  color: theme.textPrimary,
  background: theme.bgSecondary,
  border: `1px solid ${theme.border}`,
  borderRadius: 6,
  padding: "7px 12px",
  font: "inherit",
  maxWidth: "100%",
};
const cell: CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  verticalAlign: "top",
  borderBottom: `1px solid ${theme.border}`,
};
const mono: CSSProperties = {
  fontFamily: theme.fontMono,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

/** Experimental source-only facade. Not exported by the installed package. */
export function RecordLens(props: RecordLensProps) {
  const id = useId();
  // Read afresh on every host render: recorders can append to an existing source.
  const model = buildRecordLensModel(props);
  const available = model.status !== "refused";
  const selected = model.selected;
  const address = !selected
    ? "No recorded steps. Showing the available starting state."
    : selected.kind === "start"
    ? selected.lastCommitIdx < 0
      ? "Run start · before the first recorded commit"
      : `Run start · includes seed through commit ${selected.lastCommitIdx}`
    : selected.kind === "end"
    ? `Run end · through commit ${selected.lastCommitIdx}`
    : `${selected.runtimeStageId} · commits ${selected.commitIdx}–${selected.lastCommitIdx}`;
  return (
    <section
      aria-label={`Record: ${props.sourceId}`}
      className={props.className}
      style={{ ...panel, ...props.style }}
    >
      <header
        style={{
          display: "flex",
          gap: 12,
          alignItems: "baseline",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>Record</h2>
        <span style={{ color: theme.textSecondary }}>{props.sourceId}</span>
      </header>
      <nav
        aria-label="Recorded steps"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          marginBlock: 18,
        }}
      >
        <button
          type="button"
          style={control}
          disabled={!available || !props.onStepChange || props.step <= 0}
          onClick={() => props.onStepChange?.(props.step - 1)}
        >
          Previous
        </button>
        <label htmlFor={`${id}-step`}>Step</label>
        <select
          id={`${id}-step`}
          style={control}
          value={available && selected ? props.step : ""}
          disabled={!props.onStepChange || !model.stops.length}
          onChange={(event) => props.onStepChange?.(Number(event.target.value))}
        >
          {(!available || !selected) && (
            <option value="">
              {available ? "No recorded steps" : "Choose a valid step"}
            </option>
          )}
          {model.stops.map((stop) => (
            <option key={stop.step} value={stop.step}>
              {stop.step + 1}. {stop.label ?? stop.stageId} · {stop.kind}
            </option>
          ))}
        </select>
        <button
          type="button"
          style={control}
          disabled={
            !available ||
            !props.onStepChange ||
            props.step >= model.stops.length - 1
          }
          onClick={() => props.onStepChange?.(props.step + 1)}
        >
          Next
        </button>
      </nav>
      {model.status === "refused" ? (
        <p role="alert">{model.refusal.message}</p>
      ) : (
        <>
          <p style={{ color: theme.textSecondary }}>{address}</p>
          {model.folded.basis === "log-only" && (
            <p role="status">
              Starting state not recorded. This is a log-only reconstruction,
              not proof of the complete state.
            </p>
          )}
          {model.folded.redacted && (
            <p role="status">
              Some recorded values are redacted. Hidden values cannot be
              recovered here.
            </p>
          )}
          {!!model.folded.skipped?.length && (
            <p role="status">
              Incomplete record: {model.folded.skipped.length} unreadable row(s)
              were skipped by Foottrace.
            </p>
          )}
          <h3>State at this step</h3>
          <p style={{ color: theme.textSecondary, fontSize: 13 }}>
            Values are abbreviated display previews, not an export of the
            record.
          </p>
          {!Object.keys(model.folded.state).length ? (
            <p>No keys in the available state.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th scope="col" style={cell}>
                      Key
                    </th>
                    <th scope="col" style={cell}>
                      Value preview
                    </th>
                    <th scope="col" style={cell}>
                      Trace
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(model.folded.state).map(([key, value]) => (
                    <tr key={key}>
                      <th scope="row" style={{ ...cell, ...mono }}>
                        {key}
                      </th>
                      <td style={{ ...cell, ...mono }}>
                        {previewValue(value)}
                      </td>
                      <td style={cell}>
                        <button
                          type="button"
                          style={control}
                          disabled={!props.onKeyChange}
                          aria-label={`Explain ${key}`}
                          onClick={() => props.onKeyChange?.([key])}
                        >
                          Why?
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h3>Changes since the previous stop</h3>
          {model.changes.length === 0 ? (
            <p>No top-level changes in the available state.</p>
          ) : (
            <ul>
              {model.changes.map((change) => (
                <li key={change.key} style={{ marginBlock: 8 }}>
                  <strong>{change.key}</strong> — {change.kind}
                  <div style={mono}>
                    {change.kind === "added"
                      ? "[absent]"
                      : previewValue(change.before)}{" "}
                    →{" "}
                    {change.kind === "removed"
                      ? "[absent]"
                      : previewValue(change.after)}
                  </div>
                  {change.kind === "removed" && (
                    <button
                      type="button"
                      style={control}
                      disabled={!props.onKeyChange}
                      onClick={() => props.onKeyChange?.([change.key])}
                    >
                      Explain {change.key}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <h3>Recorded explanation</h3>
          {!model.provenance ? (
            <p>Select a key to inspect its recorded origin.</p>
          ) : model.provenance.status === "unavailable" ? (
            <p role="status">{model.provenance.message}</p>
          ) : (
            <>
              <p role="status">
                {model.provenance.reads === "unknown"
                  ? "Separate read evidence is unavailable. Any write-time reads in the record are still used; unrecorded dependencies remain unknown."
                  : "Using the supplied read evidence. Unrecorded reads are not proof of independence."}
              </p>
              <pre style={mono}>{model.provenance.prose}</pre>
            </>
          )}
        </>
      )}
    </section>
  );
}
