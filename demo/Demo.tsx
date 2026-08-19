import "@xyflow/react/dist/style.css";
import { TracedFlow } from "../src/flowchart";
import { ExplainableShell } from "../src/components/ExplainableShell/ExplainableShell";
import type { TraceGraph } from "../src/components/FlowchartView/traceStructureRecorder";
import graphData from "./sample-graph.json";
import runData from "./sample-run.json";
import subflowRunData from "./sample-subflow-run.json";

// Rehydrate the JSON fixture: RuntimeOverlay.errors is a Map at runtime,
// serialized as entry pairs by generate-run.ts.
const liveRun = {
  ...runData,
  runtimeOverlay: {
    ...runData.runtimeOverlay,
    errors: new Map((runData.runtimeOverlay.errors as [string, string][]) ?? []),
  },
};
const subflowRun = {
  ...subflowRunData,
  runtimeOverlay: {
    ...subflowRunData.runtimeOverlay,
    errors: new Map((subflowRunData.runtimeOverlay.errors as [string, string][]) ?? []),
  },
};
import { GALLERY, COMBINE, CONNECTED_AGENT } from "./sample-graphs";

/**
 * Demo gallery — each composition pattern in its OWN small chart so a layout
 * fix is visible at a glance, plus the big real agent chart (the "combine"
 * target). Edit src/components/FlowchartView/* and every chart hot-reloads.
 */
const complex = graphData as unknown as TraceGraph;

function ChartCard({
  title,
  subtitle,
  graph,
  height = 260,
  groupedSubflows,
}: {
  title: string;
  subtitle: string;
  graph: TraceGraph;
  height?: number;
  groupedSubflows?: string[];
}) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div style={{ padding: "9px 14px", borderBottom: "1px solid #eef2f7" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{title}</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{subtitle}</div>
      </div>
      <div style={{ height }}>
        <TracedFlow graph={graph as never} groupedSubflows={groupedSubflows} />
      </div>
    </div>
  );
}

export function Demo() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>explainable-ui — flowchart gallery</h1>

      {/* THE full shell on a REAL generated run (demo/generate-run.ts) —
          exercise the Data Trace tab: scrub to Quote, open Inspector →
          Data Trace, and watch the chart dim to the dependency CONE
          (Audit, the chronological neighbor, correctly stays dim). */}
      <div
        data-testid="shell-live-run"
        style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff", height: 640, marginBottom: 20 }}
      >
        <ExplainableShell
          runtimeSnapshot={liveRun.runtimeSnapshot as never}
          narrativeEntries={liveRun.narrativeEntries as never}
          traceGraph={liveRun.traceGraph as never}
          runtimeOverlay={liveRun.runtimeOverlay as never}
          traceTheme={{ mode: "light" }}
        />
      </div>
      {/* The shell on a run that mounts NESTED subflows (demo/generate-subflow-run.ts).
          `Prepare` is mounted twice — top level and inside `Pipeline` — so drilling
          the inner one proves the drill scopes by the MOUNT, not by the shared id.
          Open the Topology rail on the left and click a subflow there too: every
          entry path must land on the same chart. */}
      <div
        data-testid="shell-subflow-run"
        style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff", height: 640, marginBottom: 20 }}
      >
        <ExplainableShell
          runtimeSnapshot={subflowRun.runtimeSnapshot as never}
          narrativeEntries={subflowRun.narrativeEntries as never}
          traceGraph={subflowRun.traceGraph as never}
          runtimeOverlay={subflowRun.runtimeOverlay as never}
          traceTheme={{ mode: "light" }}
          defaultExpanded={{ topology: true }}
        />
      </div>

      <p style={{ color: "#64748b", margin: "0 0 20px", fontSize: 14 }}>
        One chart per composition pattern (so the layout is readable), then the real agent chart —
        the combine target. Edit <code>src/components/FlowchartView/*</code> and every chart
        hot-reloads.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {GALLERY.map((c) => (
          <ChartCard key={c.title} title={c.title} subtitle={c.subtitle} graph={c.graph} />
        ))}
      </div>
      <ChartCard
        title="Combine — every pattern, one connected flow"
        subtitle="sequence · fork+merge diamond · decision · side-lane loop — laid out perfectly"
        graph={COMBINE}
        height={560}
      />
      <ChartCard
        title="Connected agent — the complete chart, perfect"
        subtitle="full ReAct agent, CONNECTED — straight spine · symmetric+even diamond · conforming Route · side-lane loop"
        graph={CONNECTED_AGENT}
        height={620}
      />
      <ChartCard
        title="Complex — real captured agent (disconnected data)"
        subtitle="the SAME code on a real capture whose edges fragment into 3 pieces — a DATA limit, not a layout one"
        graph={complex}
        height={520}
      />
    </div>
  );
}
