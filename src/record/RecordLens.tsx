import { useId, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { StateKey, Stop } from "foottrace";
import { theme } from "../theme/styles";
import { createRecordLensReader } from "./model";
import { RecordExplanation } from "./RecordExplanation";
import { previewValue } from "./preview";
import type { RecordBacktrackPosition, RecordLensInput, RecordLensReader } from "./types";

type RecordSelection = (RecordLensInput & { readonly reader?: never }) | {
  readonly reader: RecordLensReader;
  readonly source?: never;
  readonly sourceId?: never;
  readonly strategy?: never;
  readonly reads?: never;
  readonly step: number;
  readonly selectedKey?: StateKey;
};

export type RecordLensProps = RecordSelection & {
  /** Exact runtime mount path for the host's selected stop. Omit for the root log. */
  readonly invocationPath?: readonly string[];
  /** Follow and return across scopes in one update to the host's shared cursor. */
  readonly onPositionChange?: (next: RecordBacktrackPosition) => void;
  /** Read-only navigation intent. The host owns and updates the selected step. */
  readonly onStepChange?: (step: number) => void;
  /** Exact top-level key segments; a dotted property name stays a single key. */
  readonly onKeyChange?: (key: StateKey) => void;
  readonly className?: string;
  readonly style?: CSSProperties;
};

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

function stopAddress(stop: Stop | null): string {
  if (!stop) return "No recorded steps. Showing the available starting state.";
  if (stop.kind === "end") return `Run end · through commit ${stop.lastCommitIdx}`;
  if (stop.kind !== "start") return `${stop.runtimeStageId} · commits ${stop.commitIdx}–${stop.lastCommitIdx}`;
  if (stop.lastCommitIdx < 0) return "Run start · before the first recorded commit";
  const contents = stop.prologue ? "earlier stages" : "seed";
  return `Run start · includes ${contents} through commit ${stop.lastCommitIdx}`;
}

// A number field keeps arbitrary exact stops reachable without mounting one
// native option per visit. Small recordings keep their labelled dropdown.
const MAX_PICKER_OPTIONS = 128;

function StepNumber({ id, current, total, revision, onStepChange }: {
  revision: object;
  id: string;
  current: number | undefined;
  total: number;
  onStepChange?: (step: number) => void;
}) {
  const formatted = current === undefined ? '' : String(current + 1);
  const [edit, setEdit] = useState({ revision, current, value: formatted });
  const moved = edit.revision !== revision || edit.current !== current;
  const draft = moved ? formatted : edit.value;
  if (moved) setEdit({ revision, current, value: formatted });
  const number = Number(draft);
  const valid = Number.isSafeInteger(number) && number >= 1 && number <= total;
  const commit = () => { if (valid) onStepChange?.(number - 1); };
  return <>
    <label htmlFor={id}>Step</label>
    <input id={id} type="number" min={1} max={total} step={1}
      aria-describedby={id + '-count'} value={draft} onChange={event => setEdit({ revision, current, value: event.target.value })}
      onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commit(); } }}
      disabled={!onStepChange} style={{ ...control, width: '10ch' }} />
    <span id={id + '-count'}>of {total}</span>
    <button type="button" style={control} disabled={!onStepChange || !valid} onClick={commit}>Go to step</button>
  </>;
}

const rootPath: readonly string[] = [];

/** Controlled view of one Foottrace recording and its selected historical question. */
export function RecordLens(props: RecordLensProps) {
  // Raw source props may change in place. Prepared readers are immutable revisions.
  const root = props.reader ?? createRecordLensReader(props);
  const path = props.invocationPath ?? rootPath;
  const scoped = path.length ? root.forScope?.(path) : root;
  if (!scoped) return <section style={{ ...panel, ...props.style }} className={props.className} role="status">
    The selected subflow recording is unavailable.
  </section>;
  return <RecordLensView {...props} root={root} scoped={scoped} path={path} />;
}

type ViewProps = RecordLensProps & { root: RecordLensReader; scoped: RecordLensReader; path: readonly string[] };
function RecordLensView(props: ViewProps) {
  const id = useId();
  const pickerRevision = useMemo(() => ({}), [props.reader, props.sourceId, props.source, props.reads, props.strategy]);
  const model = props.scoped.at(props.step, props.selectedKey);
  const { onPositionChange } = props;
  const chooseKey = onPositionChange
    ? (key: readonly string[]) => onPositionChange({ invocationPath: props.path, step: props.step, key })
    : props.onKeyChange;
  const options = useMemo(() => model.stops.length > MAX_PICKER_OPTIONS ? null : model.stops.map(stop => (
    <option key={stop.step} value={stop.step}>
      {stop.step + 1}. {stop.label ?? stop.stageId} · {stop.kind}
    </option>
  )), [model.stops]);
  const available = model.status !== "refused";
  const selected = model.selected;
  return (
    <section
      aria-label={`Record: ${model.sourceId}`}
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
        <span style={{ color: theme.textSecondary }}>{model.sourceId}{props.path.length > 0 && ` · ${props.path.join(" › ")}`}</span>
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
        {options === null ? (
          <StepNumber key={model.sourceId} revision={pickerRevision} id={`${id}-step`} current={selected?.step} total={model.stops.length} onStepChange={props.onStepChange} />
        ) : (
          <>
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
              {options}
            </select>
          </>
        )}
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
          <p style={{ color: theme.textSecondary }}>{stopAddress(selected)}</p>
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
                          disabled={!chooseKey}
                          aria-label={`Explain ${key}`}
                          onClick={() => chooseKey?.([key])}
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
                      disabled={!chooseKey}
                      onClick={() => chooseKey?.([change.key])}
                    >
                      Explain {change.key}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <h3>Recorded explanation</h3>
          <RecordExplanation model={model} root={props.root} reader={props.scoped} owner={pickerRevision}
            path={props.path} segmentedKey={Array.isArray(props.selectedKey)}
            onPositionChange={props.onPositionChange} onStepChange={props.onStepChange} onKeyChange={props.onKeyChange}
            style={control} textStyle={mono} />
        </>
      )}
    </section>
  );
}
