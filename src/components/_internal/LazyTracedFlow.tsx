import { Component, Suspense, lazy } from "react";
import type { ReactNode } from "react";
import type { TracedFlowProps } from "../FlowchartView/TracedFlow";

// Composite views load the graph only when it is rendered. The established
// /flowchart exports remain synchronous and intentionally select graph code.
// Keep this direct dynamic import intact in the emitted package chunks.
const Graph = lazy(() => import("../FlowchartView/TracedFlow").then(({ TracedFlow }) => ({ default: TracedFlow })));

class GraphLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return (
      <div role="alert" aria-label="Graph unavailable" data-fp="graph-unavailable">
        The flowchart could not be loaded or rendered. Check that the graph
        dependencies are installed, then reload the page. The other views
        remain available.
      </div>
    );
    return this.props.children;
  }
}

/** Only the graph suspends: source, cursor, drill state and theme belong to
 * the caller and continue to update. No alternate graph or algorithm is used
 * on failure. A failed module import requires a page reload after repair. */
export function LazyTracedFlow(props: TracedFlowProps) {
  return (
    <GraphLoadBoundary>
      <Suspense fallback={<div role="status" aria-live="polite" data-fp="graph-loading">Loading flowchart…</div>}>
        <Graph {...props} />
      </Suspense>
    </GraphLoadBoundary>
  );
}
