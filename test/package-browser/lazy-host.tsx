// Deterministic browser mechanism fixture, not a substitute for M8 real-run replay.
// Import only the actual packed root. Importing /flowchart here would deliberately
// make its synchronous graph API eager and invalidate this composite-view test.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
// Graph hosts supply XYFlow's documented stylesheet, as existing demos do.
import "@xyflow/react/dist/style.css";
import {
  ExplainableProvider, FlowchartPanel, TimeTravelBar, ValueInspector,
  type ExplainableRecording,
} from "footprint-explainable-ui";

function recording(prefix: string): ExplainableRecording {
  const first = `${prefix}-first`, last = `${prefix}-last`;
  return {
    snapshot: {
      sharedState: { count: 2 },
      executionTree: {
        id: first, name: first, runtimeStageId: `${first}#0`,
        logs: {}, errors: {}, metrics: {}, evals: {},
        next: { id: last, name: last, runtimeStageId: `${last}#1`, logs: {}, errors: {}, metrics: {}, evals: {} },
      },
      commitLog: [first, last].map((stage, index) => ({
        idx: index, stage, stageId: stage, runtimeStageId: `${stage}#${index}`,
        overwrite: { count: index + 1 }, updates: {}, redactedPaths: [],
        trace: [{ path: "count", verb: "set" }],
      })),
    },
    structure: { id: first, name: first, next: { id: last, name: last } },
  };
}
const sources = { old: recording("old"), new: recording("new") };

function Host() {
  const [source, setSource] = useState<"old" | "new">("old");
  const [cursor, setCursor] = useState(0);
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  return <main>
    <button onClick={() => setOpen(value => !value)}>{open ? "Hide graph" : "Show graph"}</button>
    <button onClick={() => setSource(value => value === "old" ? "new" : "old")}>Switch recording</button>
    <button onClick={() => setCursor(value => value === 0 ? 1 : 0)}>Switch step</button>
    <button onClick={() => setDark(value => !value)}>Switch theme</button>
    <output data-testid="host-state">{source}:{cursor}:{dark ? "dark" : "light"}</output>
    <ExplainableProvider recording={sources[source]} selectedIndex={cursor}
      onSelectedIndexChange={setCursor} theme={{ mode: dark ? "dark" : "light",
        tokens: { colors: { nodeCursor: dark ? "#12ab34" : "#ab1234" } } }}>
      <TimeTravelBar autoPlayable={false} />
      <div style={{ height: 180 }}><ValueInspector /></div>
      {open && <div style={{ height: 520, width: 900 }}><FlowchartPanel /></div>}
    </ExplainableProvider>
  </main>;
}

createRoot(document.getElementById("root")!).render(<Host />);
