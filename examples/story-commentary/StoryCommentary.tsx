import { useState } from "react";
import {
  CommentaryPanel,
  ExplainableShell,
  TraceViewer,
  graphFromStructure,
  useLensWorkbench,
  type LensLayoutDefinition,
  type LensView,
  type NarrativeEntry,
  type StageSnapshot,
} from "footprint-explainable-ui";
import "@xyflow/react/dist/style.css";

/**
 * A static presentation fixture, not an engine recording. Each narrative line
 * names the exact execution visit represented by its snapshot. In production,
 * retain these IDs from the recorder instead of assigning them in the UI.
 */
export const snapshots: StageSnapshot[] = [
  {
    stageName: "load-request",
    stageLabel: "Load request",
    runtimeStageId: "load-request#0",
    memory: { requestedAmount: 1200 },
    narrative: "The request asks for 1,200.",
    startMs: 0,
    durationMs: 18,
    status: "done",
  },
  {
    stageName: "check-limit",
    stageLabel: "Check limit",
    runtimeStageId: "check-limit#1",
    memory: { requestedAmount: 1200, limit: 1500, eligible: true },
    narrative: "The recorded limit check passed.",
    startMs: 18,
    durationMs: 11,
    status: "done",
  },
  {
    stageName: "prepare-result",
    stageLabel: "Prepare result",
    runtimeStageId: "prepare-result#2",
    memory: {
      requestedAmount: 1200,
      limit: 1500,
      eligible: true,
      result: "Ready for review",
    },
    narrative: "The result is ready for review.",
    startMs: 29,
    durationMs: 8,
    status: "done",
  },
];

/** Existing JSON-compatible NarrativeEntry[]; no UI template language. */
export const narrativeEntries: NarrativeEntry[] = [
  {
    type: "stage",
    text: "Load request",
    depth: 0,
    stageId: "load-request",
    runtimeStageId: "load-request#0",
  },
  {
    type: "step",
    text: "Wrote requestedAmount: 1200",
    depth: 1,
    stageId: "load-request",
    runtimeStageId: "load-request#0",
    key: "requestedAmount",
    rawValue: 1200,
  },
  {
    type: "stage",
    text: "Check limit",
    depth: 0,
    stageId: "check-limit",
    runtimeStageId: "check-limit#1",
  },
  {
    type: "condition",
    text: "The recorded limit check passed: 1,200 is within the 1,500 limit.",
    depth: 1,
    stageId: "check-limit",
    runtimeStageId: "check-limit#1",
  },
  {
    type: "stage",
    text: "Prepare result",
    depth: 0,
    stageId: "prepare-result",
    runtimeStageId: "prepare-result#2",
  },
  {
    type: "emit",
    text: "The result is ready for review.",
    depth: 1,
    stageId: "prepare-result",
    runtimeStageId: "prepare-result#2",
  },
];

const graph = graphFromStructure({
  id: "load-request",
  name: "Load request",
  next: {
    id: "check-limit",
    name: "Check limit",
    next: { id: "prepare-result", name: "Prepare result" },
  },
});

/** Full Lens layout data: two core surfaces plus three optional surfaces. */
export const customerLayout: LensLayoutDefinition = {
  columns: "minmax(0, 1.6fr) minmax(300px, 1fr)",
  rows: "auto minmax(420px, 1fr) minmax(200px, 0.6fr)",
  areas: [
    ["timeTravel", "timeTravel"],
    ["flowchart", "commentary"],
    ["timeline", "developer"],
  ],
  minHeight: 760,
  gap: 12,
};

/** Simulate saving application layout settings and restoring their JSON. */
export const customerLayoutJson = JSON.stringify(customerLayout);
export const restoredCustomerLayout: LensLayoutDefinition = JSON.parse(customerLayoutJson);

/** All five named surfaces share the existing chart, scope and stage cursor. */
export function JsonLayoutStoryCommentary() {
  return (
    <div style={{ height: "100vh" }}>
      <ExplainableShell
        snapshots={snapshots}
        traceGraph={graph}
        narrativeEntries={narrativeEntries}
        layout={restoredCustomerLayout}
        theme={{ mode: "light" }}
        commentary={{ presentation: "log", followCursor: true, showEntryTypes: false }}
        replayControls={{ previousNext: true, playPause: true, slider: true, intervalMs: 2400 }}
      />
    </div>
  );
}

/** The built-in Developer / Commentary buttons switch only the details pane. */
export function StoryCommentary() {
  return (
    <section style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", gap: 8, padding: 12 }}>
        <span>Static UI example · use Previous / Next to read each visit.</span>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ExplainableShell
          snapshots={snapshots}
          traceGraph={graph}
          narrativeEntries={narrativeEntries}
          title="Request review"
          defaultView="story"
          theme={{ mode: "light" }}
          autoPlay={false}
          commentary={{
            title: "What happened",
            presentation: "log",
            followCursor: true,
            showEntryTypes: false,
            maxLines: 100,
            emptyMessage: "No commentary was recorded through this step.",
            renderEntry: (entry, { current }) => (
              <p style={{ margin: 0, fontWeight: current ? 600 : 400 }}>{entry.text}</p>
            ),
          }}
          replayControls={{
            previousNext: true,
            playPause: true,
            slider: true,
            intervalMs: 2400,
          }}
        />
      </div>
    </section>
  );
}

/** A host can control the same built-in audience buttons. */
export function ControlledStoryCommentary() {
  const [view, setView] = useState<LensView>("story");
  return (
    <div style={{ height: "100vh" }}>
      <ExplainableShell
        snapshots={snapshots}
        traceGraph={graph}
        narrativeEntries={narrativeEntries}
        view={view}
        onViewChange={setView}
      />
    </div>
  );
}

/** A host layout may arrange the ready-made, already synchronized surfaces. */
function CustomerLayout({ view, onViewChange }: { view: LensView; onViewChange: (view: LensView) => void }) {
  const { surfaces } = useLensWorkbench();
  return (
    <section style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      <header>{surfaces.breadcrumb}{surfaces.timeTravel}</header>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 0.65fr)", flex: 1, minHeight: 0 }}>
        <main style={{ minHeight: 400 }}>{surfaces.chart}</main>
        <aside style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
          <nav aria-label="Details audience" style={{ display: "flex", gap: 8 }}>
            <button type="button" aria-pressed={view === "developer"} onClick={() => onViewChange("developer")}>
              Developer
            </button>
            <button type="button" aria-pressed={view === "story"} onClick={() => onViewChange("story")}>
              Commentary
            </button>
          </nav>
          <section style={{ flex: 1, minHeight: 0 }}>
            {view === "story" ? surfaces.commentary : surfaces.developer}
          </section>
        </aside>
      </div>
    </section>
  );
}

export function CustomStoryCommentary() {
  const [view, setView] = useState<LensView>("story");
  return (
    <div style={{ height: "100vh" }}>
      <ExplainableShell
        snapshots={snapshots}
        traceGraph={graph}
        narrativeEntries={narrativeEntries}
        view={view}
        onViewChange={setView}
        commentary={{ title: "Request diary", presentation: "log", followCursor: true, showEntryTypes: false }}
        renderLayout={() => <CustomerLayout view={view} onViewChange={setView} />}
      />
    </div>
  );
}

/**
 * Alternative inside CustomerLayout: replace surfaces.commentary with this
 * component for local props. It reads the same full-Lens cursor and scope.
 * It also works inside the basic ExplainableProvider.
 */
export function LocallyStyledCommentary() {
  return (
    <CommentaryPanel
      title="Request diary"
      presentation="log"
      followCursor
      showEntryTypes={false}
      renderEntry={(entry) => <p style={{ margin: 0 }}>{entry.text}</p>}
    />
  );
}

/** The same public options on a real saved { snapshot, structure, narrativeEntries? }. */
export function SavedStory({ json, layout }: { json: string; layout?: LensLayoutDefinition }) {
  return (
    <div style={{ height: "100vh" }}>
      <TraceViewer
        recording={json}
        layout={layout}
        defaultView="story"
        commentary={{ title: "What happened", presentation: "log", followCursor: true, showEntryTypes: false }}
        replayControls={{ previousNext: true, playPause: true, slider: true }}
      />
    </div>
  );
}
