# footprint-explainable-ui

Themeable React components for visualizing [FootPrint](https://github.com/footprintjs/footPrint) pipeline execution — time-travel debugging, flowchart overlays, subflow drill-down, narrative traces, and scope diffs.

## Install

```bash
npm install footprint-explainable-ui
```

**Peer dependencies:** `react >= 18`, `react-dom >= 18`

For flowchart components, also install:

```bash
npm install @xyflow/react
```

## Entry Points

| Import path | What it provides |
|---|---|
| `footprint-explainable-ui` | Core components, themes, adapters |
| `footprint-explainable-ui/flowchart` | Flowchart visualization, subflow navigation (requires `@xyflow/react`) |

## Quick Start

### 1. Convert FootPrint execution data to snapshots

```typescript
import { FlowChartExecutor } from "footprint";
import { toVisualizationSnapshots } from "footprint-explainable-ui";

const executor = new FlowChartExecutor(chart);
await executor.run();

// Convert runtime snapshot → visualization snapshots
const snapshots = toVisualizationSnapshots(executor.getSnapshot());
```

### 2. Render with the all-in-one shell

```tsx
import {
  ExplainableShell,
  FootprintTheme,
  warmDark,
} from "footprint-explainable-ui";

function App({ snapshots, narrative, result }) {
  return (
    <FootprintTheme tokens={warmDark}>
      <ExplainableShell
        snapshots={snapshots}
        narrative={narrative}
        resultData={result}
        logs={consoleLogs}
      />
    </FootprintTheme>
  );
}
```

### 3. Or compose individual components

```tsx
import {
  TimeTravelControls,
  MemoryInspector,
  ScopeDiff,
  GanttTimeline,
  NarrativeTrace,
} from "footprint-explainable-ui";

function MyDebugger({ snapshots }) {
  const [idx, setIdx] = useState(0);
  const current = snapshots[idx];
  const previous = idx > 0 ? snapshots[idx - 1] : null;

  return (
    <>
      <TimeTravelControls
        snapshots={snapshots}
        selectedIndex={idx}
        onIndexChange={setIdx}
      />
      <MemoryInspector snapshots={snapshots} selectedIndex={idx} />
      <ScopeDiff
        previous={previous?.memory ?? null}
        current={current.memory}
        hideUnchanged
      />
      <NarrativeTrace narrative={snapshots.map(s => s.narrative)} />
      <GanttTimeline snapshots={snapshots} selectedIndex={idx} onSelect={setIdx} />
    </>
  );
}
```

---

## Flowchart Visualization

Import from `footprint-explainable-ui/flowchart`:

```tsx
import {
  StageNode,
  specToReactFlow,
  useSubflowNavigation,
  SubflowBreadcrumb,
  type SpecNode,
  type ExecutionOverlay,
} from "footprint-explainable-ui/flowchart";
```

### Static flowchart from pipeline spec

```tsx
import { ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { specToReactFlow, StageNode } from "footprint-explainable-ui/flowchart";

const nodeTypes = { stage: StageNode };

function PipelineChart({ spec }) {
  const { nodes, edges } = specToReactFlow(spec);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
    />
  );
}
```

### With execution overlay (time-travel)

The overlay highlights which stages have executed, which is active, and the execution path — like a Google Maps route overlay.

```tsx
import { specToReactFlow, type ExecutionOverlay } from "footprint-explainable-ui/flowchart";

// Build overlay from your current time-travel position
const overlay: ExecutionOverlay = {
  doneStages: new Set(["LoadOrder", "ProcessPayment"]),
  activeStage: "ShipOrder",
  executedStages: new Set(["LoadOrder", "ProcessPayment", "ShipOrder"]),
  executionOrder: ["LoadOrder", "ProcessPayment", "ShipOrder"],
};

const { nodes, edges } = specToReactFlow(spec, overlay);
```

**Tip:** Compute the overlay from your snapshots array and current index:

```tsx
function buildOverlay(snapshots, idx): ExecutionOverlay {
  const executionOrder = snapshots.slice(0, idx + 1).map(s => s.stageLabel);
  const doneStages = new Set(snapshots.slice(0, idx).map(s => s.stageLabel));
  const activeStage = snapshots[idx]?.stageLabel ?? null;
  const executedStages = new Set([...doneStages]);
  if (activeStage) executedStages.add(activeStage);
  return { doneStages, activeStage, executedStages, executionOrder };
}
```

### Custom edge colors

```tsx
const { nodes, edges } = specToReactFlow(spec, overlay, {
  edgeExecuted: "#00ff88",  // Completed path
  edgeActive: "#ff6b6b",    // Currently executing
});
```

### Subflow drill-down navigation

For pipelines with nested subflows, `useSubflowNavigation` manages a breadcrumb stack. Clicking a subflow node drills into its internal flowchart.

```tsx
import {
  useSubflowNavigation,
  SubflowBreadcrumb,
  specToReactFlow,
  StageNode,
} from "footprint-explainable-ui/flowchart";
import { ReactFlow } from "@xyflow/react";

const nodeTypes = { stage: StageNode };

function DrillDownChart({ spec, overlay }) {
  const subflowNav = useSubflowNavigation(spec);

  // Get the current level's spec from breadcrumbs
  const currentSpec = subflowNav.breadcrumbs[subflowNav.breadcrumbs.length - 1].spec;
  const { nodes, edges } = specToReactFlow(currentSpec, overlay);

  return (
    <div>
      {/* Breadcrumb bar: Pipeline > PaymentSubflow */}
      {subflowNav.isInSubflow && (
        <SubflowBreadcrumb
          breadcrumbs={subflowNav.breadcrumbs}
          onNavigate={subflowNav.navigateTo}
        />
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => subflowNav.handleNodeClick(node.id)}
        fitView
      />
    </div>
  );
}
```

**`useSubflowNavigation` returns:**

| Property | Type | Description |
|---|---|---|
| `breadcrumbs` | `BreadcrumbEntry[]` | Stack from root to current level |
| `nodes` | `Node[]` | ReactFlow nodes for current level |
| `edges` | `Edge[]` | ReactFlow edges for current level |
| `handleNodeClick` | `(nodeId) => boolean` | Drills into subflow if applicable |
| `navigateTo` | `(level) => void` | Jump to breadcrumb level (0 = root) |
| `isInSubflow` | `boolean` | Whether we're inside a subflow |
| `currentSubflowNodeName` | `string \| null` | Name of the subflow node drilled into |

### Extracting subflow execution data

When drilled into a subflow, extract its execution snapshots from the parent's memory:

```tsx
import { toVisualizationSnapshots } from "footprint-explainable-ui";

// Find the parent stage that contains the subflow result
const parentSnap = parentSnapshots.find(s => s.stageLabel === subflowNav.currentSubflowNodeName);
const sfResult = parentSnap?.memory?.subflowResult;
const tc = sfResult?.treeContext;

if (tc?.stageContexts) {
  const subflowSnapshots = toVisualizationSnapshots({
    sharedState: tc.globalContext,
    executionTree: tc.stageContexts,
    commitLog: tc.history ?? [],
  });

  // Strip builder's "subflowId/" prefix from stage names
  const prefix = sfResult.subflowId ? `${sfResult.subflowId}/` : null;
  if (prefix) {
    for (const snap of subflowSnapshots) {
      if (snap.stageLabel.startsWith(prefix))
        snap.stageLabel = snap.stageLabel.slice(prefix.length);
      if (snap.stageName.startsWith(prefix))
        snap.stageName = snap.stageName.slice(prefix.length);
    }
  }
}
```

---

## Theming

### ThemeProvider

```tsx
import { FootprintTheme, warmDark, warmLight, coolDark } from "footprint-explainable-ui";

<FootprintTheme tokens={warmDark}>
  <MyApp />
</FootprintTheme>
```

### CSS Variables (no provider needed)

```css
:root {
  --fp-color-primary: #7c6cf0;
  --fp-bg-primary: #1e1a2e;
  --fp-bg-secondary: #2a2540;
  --fp-text-primary: #f0e6d6;
  --fp-border: #3a3455;
  --fp-radius: 8px;
  --fp-font-mono: 'JetBrains Mono', monospace;
}
```

### Built-in Presets

| Preset | Description |
|---|---|
| `coolDark` | Default — indigo/slate dark theme |
| `warmDark` | Charcoal-purple with warm text |
| `warmLight` | Cream/peach light theme |

### Token Reference

```typescript
interface ThemeTokens {
  colors?: {
    primary?: string;       // Accent (buttons, highlights)
    success?: string;       // Completed stages
    error?: string;         // Error states
    warning?: string;       // Warnings
    bgPrimary?: string;     // Main background
    bgSecondary?: string;   // Panel/card background
    bgTertiary?: string;    // Hover/active background
    textPrimary?: string;   // Main text
    textSecondary?: string; // Secondary text
    textMuted?: string;     // Dimmed text
    border?: string;        // Borders
  };
  radius?: string;
  fontFamily?: {
    sans?: string;          // UI text font
    mono?: string;          // Code/data font
  };
}
```

---

## Components Reference

### Core Components

| Component | Description |
|---|---|
| `ExplainableShell` | Tabbed container: Result / Explainable / AI-Compatible |
| `TimeTravelControls` | Play/pause, prev/next, scrubber timeline |
| `NarrativeTrace` | Collapsible stage groups with progressive reveal |
| `NarrativeLog` | Simple timeline-style execution log |
| `ScopeDiff` | Side-by-side scope changes (added/changed/removed) |
| `ResultPanel` | Final pipeline output + console logs |
| `MemoryInspector` | Accumulated memory state viewer |
| `GanttTimeline` | Horizontal duration timeline |
| `SnapshotPanel` | All-in-one inspector (scrubber + memory + narrative + Gantt) |

### Flowchart Components (`footprint-explainable-ui/flowchart`)

| Export | Description |
|---|---|
| `FlowchartView` | ReactFlow pipeline visualization with execution overlay |
| `StageNode` | Custom node with state-aware coloring, step badges, pulse rings |
| `specToReactFlow` | Convert pipeline spec → ReactFlow nodes/edges with path overlay |
| `TimeTravelDebugger` | Full debugger with flowchart + all panels |
| `SubflowBreadcrumb` | Breadcrumb bar for subflow drill-down |
| `useSubflowNavigation` | Hook managing subflow drill-down navigation stack |

### Adapters

| Export | Description |
|---|---|
| `toVisualizationSnapshots` | Convert `FlowChartExecutor.getSnapshot()` → `StageSnapshot[]` |
| `createSnapshots` | Build `StageSnapshot[]` from simple arrays (testing/custom data) |

---

## Size Variants

All components accept a `size` prop: `"compact"`, `"default"`, or `"detailed"`.

```tsx
<GanttTimeline snapshots={snapshots} size="compact" />
<MemoryInspector snapshots={snapshots} size="detailed" />
```

## Unstyled Mode

Strip all built-in styles for full CSS control. Components render semantic `data-fp` attributes:

```tsx
<NarrativeTrace narrative={lines} unstyled className="my-narrative" />
```

```css
[data-fp="narrative-header"] { font-weight: bold; }
[data-fp="narrative-step"] { padding-left: 2rem; }
[data-fp="narrative-group"][data-latest="true"] { background: highlight; }
```

---

## License

MIT
