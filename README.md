# footprint-explainable-ui

Themeable React components for visualizing [FootPrint](https://github.com/sanjay1909/footPrint) pipeline execution — time-travel debugging, flowchart overlays, narrative traces, and scope diffs.

## Install

```bash
npm install footprint-explainable-ui
```

Peer dependencies: `react >= 18`. For flowchart components, also install `@xyflow/react`.

## Quick Start

### All-in-One Shell

The `ExplainableShell` gives you a tabbed UI (Result | Explainable | AI-Compatible) with time-travel controls, Gantt timeline, scope diffs, and progressive narrative — out of the box.

```tsx
import { ExplainableShell, FootprintTheme, warmDark } from "footprint-explainable-ui";

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

### Individual Components

Every component works standalone. Mix and match:

```tsx
import {
  NarrativeTrace,
  ScopeDiff,
  GanttTimeline,
  MemoryInspector,
  TimeTravelControls,
  ResultPanel,
} from "footprint-explainable-ui";

function MyDebugger({ snapshots }) {
  const [idx, setIdx] = useState(0);

  return (
    <>
      <TimeTravelControls
        snapshots={snapshots}
        selectedIndex={idx}
        onIndexChange={setIdx}
      />
      <MemoryInspector snapshots={snapshots} selectedIndex={idx} />
      <ScopeDiff
        previous={idx > 0 ? snapshots[idx - 1].memory : null}
        current={snapshots[idx].memory}
        hideUnchanged
      />
      <GanttTimeline snapshots={snapshots} selectedIndex={idx} onSelect={setIdx} />
    </>
  );
}
```

## Theming

### Option 1: ThemeProvider

Wrap your app with `FootprintTheme` and pass a preset or custom tokens:

```tsx
import { FootprintTheme, warmDark, warmLight, coolDark } from "footprint-explainable-ui";

// Use a built-in preset
<FootprintTheme tokens={warmDark}>
  <MyApp />
</FootprintTheme>

// Or customize
<FootprintTheme tokens={{
  colors: {
    primary: "#e91e63",
    bgPrimary: "#121212",
    textPrimary: "#ffffff",
  },
  radius: "12px",
}}>
  <MyApp />
</FootprintTheme>
```

### Option 2: CSS Variables

Set `--fp-*` CSS variables directly — no provider needed:

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
|--------|-------------|
| `coolDark` | Default — indigo/slate dark theme |
| `warmDark` | Charcoal-purple with warm text |
| `warmLight` | Cream/peach light theme |

### Token Reference

```typescript
interface ThemeTokens {
  colors?: {
    primary?: string;    // Accent color (buttons, highlights)
    success?: string;    // Completed stages
    error?: string;      // Error states
    warning?: string;    // Warnings
    bgPrimary?: string;  // Main background
    bgSecondary?: string;// Panel/card background
    bgTertiary?: string; // Hover/active background
    textPrimary?: string;// Main text
    textSecondary?: string;// Secondary text
    textMuted?: string;  // Dimmed text
    border?: string;     // Borders
  };
  radius?: string;       // Border radius
  fontFamily?: {
    sans?: string;       // UI text font
    mono?: string;       // Code/data font
  };
}
```

## Size Variants

All components accept a `size` prop: `"compact"`, `"default"`, or `"detailed"`.

```tsx
<GanttTimeline snapshots={snapshots} size="compact" />
<MemoryInspector snapshots={snapshots} size="detailed" />
```

## Unstyled Mode

Strip all built-in styles and bring your own. Components render semantic `data-fp` attributes for CSS targeting:

```tsx
<NarrativeTrace narrative={lines} unstyled className="my-narrative" />
```

```css
[data-fp="narrative-header"] { font-weight: bold; }
[data-fp="narrative-step"] { padding-left: 2rem; }
[data-fp="narrative-group"][data-latest="true"] { background: highlight; }
```

## Components

| Component | Description |
|-----------|-------------|
| `ExplainableShell` | Tabbed container: Result / Explainable / AI-Compatible |
| `TimeTravelControls` | Play/pause, prev/next, tick-mark timeline |
| `NarrativeTrace` | Collapsible stage groups with progressive reveal |
| `NarrativeLog` | Simple timeline-style execution log |
| `ScopeDiff` | Side-by-side scope changes (added/changed/removed) |
| `ResultPanel` | Final pipeline output + console logs |
| `MemoryInspector` | Accumulated memory state viewer |
| `GanttTimeline` | Horizontal duration timeline |
| `SnapshotPanel` | All-in-one inspector (scrubber + memory + narrative + Gantt) |

### Flowchart Components (separate entry point)

Requires `@xyflow/react` as a peer dependency. Import from `footprint-explainable-ui/flowchart`:

```bash
npm install @xyflow/react
```

```tsx
import {
  FlowchartView,
  StageNode,
  specToReactFlow,
  TimeTravelDebugger,
} from "footprint-explainable-ui/flowchart";
```

| Export | Description |
|--------|-------------|
| `FlowchartView` | ReactFlow pipeline visualization with execution overlay |
| `StageNode` | Custom node with state-aware coloring, step badges, pulse rings |
| `specToReactFlow` | Convert pipeline spec → ReactFlow nodes/edges with path overlay |
| `TimeTravelDebugger` | Full debugger with flowchart + all panels |

### `specToReactFlow` — Pipeline Spec to Flowchart

Converts a `builder.toSpec()` structure into ReactFlow nodes and edges. Supports two modes:

```tsx
import { specToReactFlow } from "footprint-explainable-ui/flowchart";
import type { ExecutionOverlay } from "footprint-explainable-ui/flowchart";

// 1. Static flowchart (no execution state)
const { nodes, edges } = specToReactFlow(spec);

// 2. With execution overlay (Google Maps-style path)
const overlay: ExecutionOverlay = {
  doneStages: new Set(["ReceiveApp", "PullCredit"]),
  activeStage: "CalculateDTI",
  executedStages: new Set(["ReceiveApp", "PullCredit", "CalculateDTI"]),
  executionOrder: ["ReceiveApp", "PullCredit", "CalculateDTI"],
};
const { nodes, edges } = specToReactFlow(spec, overlay);

// 3. Custom edge colors (overrides theme defaults)
const { nodes, edges } = specToReactFlow(spec, overlay, {
  edgeExecuted: "#00ff88",
  edgeActive: "#ff6b6b",
});
```

Edge colors default to the library's theme tokens (`success` for executed, `primary` for active). Override per-call via the `colors` parameter.

### `StageNode` — Theme-Aware Node

`StageNode` reads all colors from `--fp-*` CSS variables:
- **Default state**: uses `--fp-bg-secondary` background, `--fp-text-primary` text
- **Active/done/error**: uses `--fp-color-primary` / `success` / `error` background
- **Step badge**: shows execution order number on executed nodes
- **Font**: uses `--fp-font-sans` for label text

Wrap your flowchart in `FootprintTheme` and the nodes match automatically:

```tsx
<FootprintTheme tokens={warmDark}>
  <ReactFlow nodes={nodes} edges={edges} nodeTypes={{ stage: StageNode }} />
</FootprintTheme>
```

## Adapters

Convert FootPrint runtime snapshots to the `StageSnapshot[]` format:

```typescript
import { toVisualizationSnapshots } from "footprint-explainable-ui";

const executor = new FlowChartExecutor(pipeline);
await executor.run(scope);

const snapshots = toVisualizationSnapshots(executor.getSnapshot());
```

## Rendering in Different Contexts

The library is render-target agnostic. Use components in:

- **Inline content** — drop into any React layout
- **Modal/dialog** — wrap in your modal component
- **Sidebar panel** — use `size="compact"` for narrow panels
- **Full-page dashboard** — use `ExplainableShell` with all tabs
- **Embedded widget** — use `unstyled` mode + custom CSS

```tsx
// In a modal
<Dialog>
  <ExplainableShell snapshots={snapshots} narrative={narrative} size="compact" />
</Dialog>

// In a sidebar
<aside style={{ width: 320 }}>
  <NarrativeTrace narrative={narrative} size="compact" />
  <GanttTimeline snapshots={snapshots} size="compact" />
</aside>
```
