# Icons on execution stage nodes

[`NodeIcons.tsx`](./NodeIcons.tsx) provides four public-consumer exports:

- `NodeIconMode`: `"recorded" | "builtin" | "custom"`.
- `applyExampleNodeIcons(graph, mode)`: an immutable presentation helper for an
  incoming `TraceGraph`.
- `ExampleStageIcon`: a native-compatible `FootprintComponents.Icon` adapter
  with inline SVGs and no external assets or icon packages.
- `ExampleGroupContainerNode`: an optional, separate wrapper for grouped
  subflow headers.

This example uses the caller's real graph and recording. It does not create a
pipeline or fabricate an execution.

| Mode | Stage-node metadata | Register `ExampleStageIcon`? |
|---|---|---|
| `recorded` | Return the original graph and its existing icon keys | No |
| `builtin` | Use the library's built-in keys for recognized example roles | No |
| `custom` | Use `example-*` keys for the same roles | Yes |

`builtin` and `custom` are explicit demo overrides: recognized nodes can replace
an existing authored icon. `recorded` preserves those choices exactly. Unmatched
nodes and unrelated custom node types retain their existing icons in every
mode. The helper changes only `node.data.icon`; IDs, positions, scope metadata,
edges and runtime information remain intact. Supply the original graph each
time you change mode, rather than decorating a previously decorated graph.

Roles come from an explicit map of the example charts' exact node IDs, existing
`isSubflow` / `isFork` / `isDecider` metadata, or a caller-authored
`node.data.exampleIconRole`. They are not selected by array position or inferred
from execution status. Edit the ID map for your application, or set one of these
roles on your own node data:

| Role | Custom key and drawing | Built-in key |
|---|---|---|
| `input` | `example-input`: incoming tray | `start` |
| `check` | `example-check`: shield and check | `guard` |
| `compute` | `example-compute`: calculator | `tool` |
| `result` | `example-result`: document and check | `end` |
| `subflow` | `example-subflow`: nested connected boxes | `agent` |
| `parallel` | `example-parallel`: two branches | `decision` |
| `loop` | `example-loop`: circular arrow | `loop` |
| `transform` | `example-transform`: filter | `parse` |
| `lookup` | `example-lookup`: magnifier | `rag` |
| `note` | `example-note`: note sheet | `memory` |

These symbols describe authored stage roles. Execution coloring, the selected
visit and recorded retry counts still come from the normal Lens data.

## ExplainableShell with a mode selector

Copy the example file into a React application using `footprint-explainable-ui`
0.45.0 or later, then pass your existing graph and snapshot:

```tsx
import { useMemo, useState } from "react";
import {
  ExplainableShell,
  type RuntimeSnapshotInput,
  type TraceGraph,
} from "footprint-explainable-ui";
import "@xyflow/react/dist/style.css";
import {
  applyExampleNodeIcons,
  ExampleStageIcon,
  type NodeIconMode,
} from "./NodeIcons";

export function PipelineIcons({ graph, snapshot }: {
  graph: TraceGraph;
  snapshot: RuntimeSnapshotInput;
}) {
  const [mode, setMode] = useState<NodeIconMode>("recorded");
  const displayGraph = useMemo(
    () => applyExampleNodeIcons(graph, mode),
    [graph, mode],
  );

  return (
    <section>
      <label>
        Node icons{" "}
        <select value={mode} onChange={(event) => setMode(event.currentTarget.value as NodeIconMode)}>
          <option value="recorded">As recorded</option>
          <option value="builtin">Built-in example</option>
          <option value="custom">Custom SVG example</option>
        </select>
      </label>
      <div style={{ height: "80vh" }}>
        <ExplainableShell
          runtimeSnapshot={snapshot}
          traceGraph={displayGraph}
          theme={{
            mode: "light",
            components: mode === "custom" ? { Icon: ExampleStageIcon } : undefined,
          }}
        />
      </div>
    </section>
  );
}
```

The example registers its renderer only in `custom` mode. Other semantic icon
names, including control icons and built-in stage icons, retain the library's
supplied `children` fallback. The adapter forwards the native span ref, events,
class, style, ARIA and data attributes. Its SVGs use `currentColor`, their own
geometry and decorative SVG accessibility attributes; caller-supplied span
styles take precedence.

## Custom icons in a saved run with TraceViewer

A producer can save a string icon key in a stage's serialized structure. For
example, the existing structure node for a validation stage can carry
`"icon": "example-check"`; a built-in shield uses `"icon": "guard"` instead.
`graphFromStructure` preserves those keys when `TraceViewer` rebuilds the graph.
The saved JSON contains the key, while the React application supplies its
renderer:

```tsx
import {
  FootprintTheme,
  TraceViewer,
  type Recording,
} from "footprint-explainable-ui";
import { ExampleStageIcon } from "./NodeIcons";

export function SavedCustomIconRun({ recording }: {
  recording: Recording | string;
}) {
  return (
    <FootprintTheme components={{ Icon: ExampleStageIcon }}>
      <div style={{ height: "80vh" }}>
        <TraceViewer recording={recording} />
      </div>
    </FootprintTheme>
  );
}
```

This saved-run example installs the adapter for a recording whose structure
already contains custom icon keys. To replay ordinary built-in icon keys, omit
the adapter. React components and SVG source are not serialized into the run.

This configures actual execution stage and subflow-node icons.
`GroupedFlowDiagram`'s definition icon hints and the collapsible panel/pill
controls have separate APIs. They do not select an execution node's
`data.icon`. Unknown icon names preserve the supplied fallback, so this adapter
can coexist with the Lens's other controls.

## Optional grouped-subflow header

When `TracedFlow.groupedSubflows` expands a mount into a container, that
container uses a separate header API. Its raw `icon` is a pictograph, rather
than a stage-icon key. Register the optional wrapper for this demo's group
headers while keeping your existing runtime overlay, cursor and drill wiring:

```tsx
import {
  GROUP_CONTAINER_NODE_TYPE,
  TracedFlow,
} from "footprint-explainable-ui/flowchart";
import { ExampleGroupContainerNode } from "./NodeIcons";

const exampleGroupNodeTypes = {
  [GROUP_CONTAINER_NODE_TYPE]: ExampleGroupContainerNode,
};

<TracedFlow
  graph={displayGraph}
  overlay={overlay}
  scrubIndex={overlayIndex}
  groupedSubflows={groupedSubflowIds}
  currentSubflowId={currentSubflowId}
  onSubflowChange={onSubflowChange}
  onNodeClick={onNodeClick}
  nodeTypes={mode === "recorded" ? undefined : exampleGroupNodeTypes}
/>;
```

`overlayIndex` is a position in the supplied `overlay.executionOrder`. Inside a
shell's `renderFlowchart` callback, retain its existing exact runtime-stage-ID
mapping from the selected invocation to that overlay index.

This is an additional `nodeTypes` example, not a shared icon API for stages,
groups and panel controls. Keep the custom stage adapter from the first example
for `custom` mode. The wrapper uses `iconContent` and `headerMode="expandable"`
for recognized `example-*` keys, clearing the raw key so it is not printed in
the heading. The demo's built-in subflow key `agent` becomes a simple `▣`
pictograph instead. Other authored raw group icons are retained.

An already expandable header keeps its authored icon content, actions, status
and port direction. When adding only a demo icon to a legacy header, the wrapper
keeps its top/bottom ports and leaves previously dormant action/status metadata
hidden. It delegates all remaining node props to `GroupContainerNode`.
