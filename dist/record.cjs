'use strict';

var chunkDGKL4TUX_cjs = require('./chunk-DGKL4TUX.cjs');
var chunkCOT43DA6_cjs = require('./chunk-COT43DA6.cjs');
var react = require('react');
var foottrace = require('foottrace');
var jsxRuntime = require('react/jsx-runtime');

var unknownReads = {
  kind: "not-recorded",
  lookup: () => []
};
function changesBetween(before, after) {
  const keys = /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes = [];
  for (const key of keys) {
    const wasPresent = Object.prototype.hasOwnProperty.call(before, key);
    const isPresent = Object.prototype.hasOwnProperty.call(after, key);
    if (!wasPresent) changes.push({ key, kind: "added", after: after[key] });
    else if (!isPresent)
      changes.push({ key, kind: "removed", before: before[key] });
    else if (!foottrace.deepEqual(before[key], after[key])) {
      changes.push({
        key,
        kind: "changed",
        before: before[key],
        after: after[key]
      });
    }
  }
  return changes;
}
function provenanceAt(source, throughCommitIdx, key, reads) {
  const log = Array.isArray(source.commitLog) ? source.commitLog : Array.isArray(source.history) ? source.history : [];
  const prefix = [];
  for (let index = 0; index <= throughCommitIdx; index++) {
    const row = log[index];
    if (!foottrace.isCommitBundle(row)) {
      return {
        status: "unavailable",
        reason: "log-gap",
        message: "Causal explanation is unavailable because this recorded prefix contains unreadable rows."
      };
    }
    prefix.push(row);
  }
  try {
    const slice = foottrace.sliceForKey(prefix, key, reads ?? unknownReads, {
      before: prefix.length
    });
    return {
      status: "ready",
      slice,
      prose: foottrace.formatSlice(slice),
      reads: !reads || reads.coverage?.stepsWithReads === 0 ? "unknown" : "provided"
    };
  } catch {
    return {
      status: "unavailable",
      reason: "query-refused",
      message: "Foottrace could not read a causal explanation from the supplied record and read evidence."
    };
  }
}
function buildRecordLensModel(input) {
  const position = { sourceId: input.sourceId, step: input.step };
  if (!input.sourceId.trim()) {
    return {
      ...position,
      stops: [],
      selected: null,
      status: "refused",
      refusal: {
        code: "invalid-source-id",
        message: "A source label is required."
      }
    };
  }
  let stops = [];
  try {
    if (!input.source || typeof input.source !== "object" || Array.isArray(input.source)) {
      return {
        ...position,
        stops,
        selected: null,
        status: "refused",
        refusal: {
          code: "read-refused",
          message: "Supply one recorded source object."
        }
      };
    }
    const cursor = foottrace.timeTravel(input.source);
    stops = cursor.stops;
    const validStep = Number.isInteger(input.step) && input.step >= 0 && (stops.length === 0 ? input.step === 0 : input.step < stops.length);
    if (!validStep) {
      return {
        ...position,
        stops,
        selected: null,
        status: "refused",
        refusal: {
          code: "invalid-step",
          message: "The requested step is not a position in this source."
        }
      };
    }
    const selected = stops[input.step] ?? null;
    const folded = selected ? cursor.stateAt(selected) : foottrace.stateAt(input.source, -1);
    const previousStop = stops[input.step - 1];
    const previous = previousStop ? cursor.stateAt(previousStop) : foottrace.stateAt(input.source, -1);
    return {
      ...position,
      stops,
      selected,
      status: selected ? "ready" : "empty",
      folded,
      previous,
      changes: changesBetween(previous.state, folded.state),
      ...input.selectedKey !== void 0 && {
        provenance: provenanceAt(
          input.source,
          folded.throughCommitIdx,
          input.selectedKey,
          input.reads
        )
      }
    };
  } catch {
    return {
      ...position,
      stops,
      selected: null,
      status: "refused",
      refusal: {
        code: "read-refused",
        message: "Foottrace could not read the supplied source."
      }
    };
  }
}
var panel = {
  color: chunkCOT43DA6_cjs.theme.textPrimary,
  background: chunkCOT43DA6_cjs.theme.bg,
  border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
  borderRadius: chunkCOT43DA6_cjs.theme.radius,
  padding: 20,
  fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
  lineHeight: 1.5,
  minWidth: 0
};
var control = {
  color: chunkCOT43DA6_cjs.theme.textPrimary,
  background: chunkCOT43DA6_cjs.theme.bgSecondary,
  border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
  borderRadius: 6,
  padding: "7px 12px",
  font: "inherit",
  maxWidth: "100%"
};
var cell = {
  padding: "8px 12px",
  textAlign: "left",
  verticalAlign: "top",
  borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`
};
var mono = {
  fontFamily: chunkCOT43DA6_cjs.theme.fontMono,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere"
};
function RecordLens(props) {
  const id = react.useId();
  const model = buildRecordLensModel(props);
  const available = model.status !== "refused";
  const selected = model.selected;
  const address = !selected ? "No recorded steps. Showing the available starting state." : selected.kind === "start" ? selected.lastCommitIdx < 0 ? "Run start \xB7 before the first recorded commit" : `Run start \xB7 includes seed through commit ${selected.lastCommitIdx}` : selected.kind === "end" ? `Run end \xB7 through commit ${selected.lastCommitIdx}` : `${selected.runtimeStageId} \xB7 commits ${selected.commitIdx}\u2013${selected.lastCommitIdx}`;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "section",
    {
      "aria-label": `Record: ${props.sourceId}`,
      className: props.className,
      style: { ...panel, ...props.style },
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          "header",
          {
            style: {
              display: "flex",
              gap: 12,
              alignItems: "baseline",
              flexWrap: "wrap"
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsx("h2", { style: { margin: 0, fontSize: 20 }, children: "Record" }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textSecondary }, children: props.sourceId })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs(
          "nav",
          {
            "aria-label": "Recorded steps",
            style: {
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              marginBlock: 18
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                "button",
                {
                  type: "button",
                  style: control,
                  disabled: !available || !props.onStepChange || props.step <= 0,
                  onClick: () => props.onStepChange?.(props.step - 1),
                  children: "Previous"
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: `${id}-step`, children: "Step" }),
              /* @__PURE__ */ jsxRuntime.jsxs(
                "select",
                {
                  id: `${id}-step`,
                  style: control,
                  value: available && selected ? props.step : "",
                  disabled: !props.onStepChange || !model.stops.length,
                  onChange: (event) => props.onStepChange?.(Number(event.target.value)),
                  children: [
                    (!available || !selected) && /* @__PURE__ */ jsxRuntime.jsx("option", { value: "", children: available ? "No recorded steps" : "Choose a valid step" }),
                    model.stops.map((stop) => /* @__PURE__ */ jsxRuntime.jsxs("option", { value: stop.step, children: [
                      stop.step + 1,
                      ". ",
                      stop.label ?? stop.stageId,
                      " \xB7 ",
                      stop.kind
                    ] }, stop.step))
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx(
                "button",
                {
                  type: "button",
                  style: control,
                  disabled: !available || !props.onStepChange || props.step >= model.stops.length - 1,
                  onClick: () => props.onStepChange?.(props.step + 1),
                  children: "Next"
                }
              )
            ]
          }
        ),
        model.status === "refused" ? /* @__PURE__ */ jsxRuntime.jsx("p", { role: "alert", children: model.refusal.message }) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
          /* @__PURE__ */ jsxRuntime.jsx("p", { style: { color: chunkCOT43DA6_cjs.theme.textSecondary }, children: address }),
          model.folded.basis === "log-only" && /* @__PURE__ */ jsxRuntime.jsx("p", { role: "status", children: "Starting state not recorded. This is a log-only reconstruction, not proof of the complete state." }),
          model.folded.redacted && /* @__PURE__ */ jsxRuntime.jsx("p", { role: "status", children: "Some recorded values are redacted. Hidden values cannot be recovered here." }),
          !!model.folded.skipped?.length && /* @__PURE__ */ jsxRuntime.jsxs("p", { role: "status", children: [
            "Incomplete record: ",
            model.folded.skipped.length,
            " unreadable row(s) were skipped by Foottrace."
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx("h3", { children: "State at this step" }),
          /* @__PURE__ */ jsxRuntime.jsx("p", { style: { color: chunkCOT43DA6_cjs.theme.textSecondary, fontSize: 13 }, children: "Values are abbreviated display previews, not an export of the record." }),
          !Object.keys(model.folded.state).length ? /* @__PURE__ */ jsxRuntime.jsx("p", { children: "No keys in the available state." }) : /* @__PURE__ */ jsxRuntime.jsx("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxRuntime.jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [
            /* @__PURE__ */ jsxRuntime.jsx("thead", { children: /* @__PURE__ */ jsxRuntime.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntime.jsx("th", { scope: "col", style: cell, children: "Key" }),
              /* @__PURE__ */ jsxRuntime.jsx("th", { scope: "col", style: cell, children: "Value preview" }),
              /* @__PURE__ */ jsxRuntime.jsx("th", { scope: "col", style: cell, children: "Trace" })
            ] }) }),
            /* @__PURE__ */ jsxRuntime.jsx("tbody", { children: Object.entries(model.folded.state).map(([key, value]) => /* @__PURE__ */ jsxRuntime.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntime.jsx("th", { scope: "row", style: { ...cell, ...mono }, children: key }),
              /* @__PURE__ */ jsxRuntime.jsx("td", { style: { ...cell, ...mono }, children: chunkDGKL4TUX_cjs.previewValue(value) }),
              /* @__PURE__ */ jsxRuntime.jsx("td", { style: cell, children: /* @__PURE__ */ jsxRuntime.jsx(
                "button",
                {
                  type: "button",
                  style: control,
                  disabled: !props.onKeyChange,
                  "aria-label": `Explain ${key}`,
                  onClick: () => props.onKeyChange?.([key]),
                  children: "Why?"
                }
              ) })
            ] }, key)) })
          ] }) }),
          /* @__PURE__ */ jsxRuntime.jsx("h3", { children: "Changes since the previous stop" }),
          model.changes.length === 0 ? /* @__PURE__ */ jsxRuntime.jsx("p", { children: "No top-level changes in the available state." }) : /* @__PURE__ */ jsxRuntime.jsx("ul", { children: model.changes.map((change) => /* @__PURE__ */ jsxRuntime.jsxs("li", { style: { marginBlock: 8 }, children: [
            /* @__PURE__ */ jsxRuntime.jsx("strong", { children: change.key }),
            " \u2014 ",
            change.kind,
            /* @__PURE__ */ jsxRuntime.jsxs("div", { style: mono, children: [
              change.kind === "added" ? "[absent]" : chunkDGKL4TUX_cjs.previewValue(change.before),
              " ",
              "\u2192",
              " ",
              change.kind === "removed" ? "[absent]" : chunkDGKL4TUX_cjs.previewValue(change.after)
            ] }),
            change.kind === "removed" && /* @__PURE__ */ jsxRuntime.jsxs(
              "button",
              {
                type: "button",
                style: control,
                disabled: !props.onKeyChange,
                onClick: () => props.onKeyChange?.([change.key]),
                children: [
                  "Explain ",
                  change.key
                ]
              }
            )
          ] }, change.key)) }),
          /* @__PURE__ */ jsxRuntime.jsx("h3", { children: "Recorded explanation" }),
          !model.provenance ? /* @__PURE__ */ jsxRuntime.jsx("p", { children: "Select a key to inspect its recorded origin." }) : model.provenance.status === "unavailable" ? /* @__PURE__ */ jsxRuntime.jsx("p", { role: "status", children: model.provenance.message }) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            /* @__PURE__ */ jsxRuntime.jsx("p", { role: "status", children: model.provenance.reads === "unknown" ? "Separate read evidence is unavailable. Any write-time reads in the record are still used; unrecorded dependencies remain unknown." : "Using the supplied read evidence. Unrecorded reads are not proof of independence." }),
            /* @__PURE__ */ jsxRuntime.jsx("pre", { style: mono, children: model.provenance.prose })
          ] })
        ] })
      ]
    }
  );
}

exports.RecordLens = RecordLens;
exports.buildRecordLensModel = buildRecordLensModel;
//# sourceMappingURL=record.cjs.map
//# sourceMappingURL=record.cjs.map