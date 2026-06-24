import '@xyflow/react/dist/style.css';
import { TracedFlow } from '../src/flowchart';
import graphData from './sample-graph.json';

/**
 * Demo harness for the flowchart renderer. Renders a REAL captured agent
 * graph with <TracedFlow>. Edit src/components/FlowchartView/* and this
 * hot-reloads — the loop used to perfect the visual layout (straight edges,
 * even spacing, container-fit).
 */
const graph = graphData as unknown as { nodes: { id: string }[]; edges: unknown[] };

// A node is a subflow box if some other node id is nested under it ("<id>/...").
const subflowIds = graph.nodes
  .map((n) => n.id)
  .filter((id) => graph.nodes.some((o) => o.id.startsWith(`${id}/`)));

export function Demo() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 1120, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, margin: '0 0 4px' }}>explainable-ui — flowchart demo</h1>
      <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: 14 }}>
        A real captured agent flowchart rendered with <code>&lt;TracedFlow&gt;</code>. Edit{' '}
        <code>src/components/FlowchartView/*</code> and it hot-reloads here.
      </p>
      <div
        style={{
          height: 600,
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <TracedFlow graph={graph as never} groupedSubflows={subflowIds} />
      </div>
    </div>
  );
}
