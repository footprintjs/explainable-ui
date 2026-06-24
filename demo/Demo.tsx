import "@xyflow/react/dist/style.css";
import { TracedFlow } from "../src/flowchart";
import type { TraceGraph, TraceNode } from "../src/components/FlowchartView/traceStructureRecorder";
import graphData from "./sample-graph.json";
import { GALLERY } from "./sample-graphs";

/**
 * Demo gallery — each composition pattern in its OWN small chart so a layout
 * fix is visible at a glance, plus the big real agent chart (the "combine"
 * target). Edit src/components/FlowchartView/* and every chart hot-reloads.
 */
const complex = graphData as unknown as TraceGraph;
const complexSubflows = complex.nodes
  .map((nd: TraceNode) => nd.id)
  .filter((id: string) => complex.nodes.some((o: TraceNode) => o.id.startsWith(`${id}/`)));

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
        title="Complex — real captured agent"
        subtitle="53 nodes · subflows · loops · the combine target"
        graph={complex}
        height={520}
        groupedSubflows={complexSubflows}
      />
    </div>
  );
}
