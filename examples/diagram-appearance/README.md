# Document handoff

The app draws a two-step document workflow and its handoff edge from plain application data. Open **Source** to choose design time, live input or saved events. Switch **Renderer** at any step to inspect the same graph in flat or isometric view. **Node drawing** switches between the library's stage and the app's folded sheet.

Run from the repository root with `npx vite --config examples/diagram-appearance/vite.config.ts`. The Pages gallery links to `./diagram-appearance/`.

## Draw the plan

```tsx
import { TraceFlow, graphFromStructure } from 'footprint-explainable-ui/flowchart';
import '@xyflow/react/dist/style.css';

const graph = graphFromStructure({ id: 'compose', name: 'Compose', next: { id: 'review', name: 'Review' } });
<div style={{ height: 420 }}><TraceFlow graph={graph} /></div>;
```

The same graph supplies the IDs used by live updates, saved events, and geometry. Its nodes and edge remain in the graph after confirmed removal so they can appear as ghosts and regain their earlier appearance on rewind.

## Report what the app knows

**Live input** applies observations immediately. Begin creation to see an activity with unknown progress. Enter a completed and total count to supply a measurement. Flag health to add a host-defined health assessment while retaining the current counts. Begin removal, then confirm it to see the change in presence. Use **Apply to** to try the same operations on the handoff edge.

```tsx
<TraceFlow graph={graph} diagramAppearance={{
  nodes: { review: { activity: 'updating', progress: { completed: 3, total: 8, unit: 'pages' } } },
  edges: { [graph.edges[0].id]: { activity: 'removing', presence: 'present' } },
}} />
```

**Saved events** reads a small illustrative sequence of application observations with `createDiagramAppearanceReader`. Each observation replaces the appearance for one object. Its facts last until the next observation for that ID. `null` clears the observation. `{ presence: 'removed' }` records confirmed absence. Build the reader once per revision and pass the host's selected step.

```tsx
import { createDiagramAppearanceReader } from 'footprint-explainable-ui/flowchart';

const reader = createDiagramAppearanceReader([
  { step: 1, target: 'node', id: 'review', appearance: { activity: 'creating' } },
  { step: 2, target: 'node', id: 'review', appearance: { presence: 'removed' } },
]);
// Inside the host component, step is the same cursor used for its other panels.
<TraceFlow graph={graph} diagramAppearance={reader.at(step)} />;
```

Backtrack uses recorded variable reads and writes. These illustrative observations describe object appearance only.

## Supply your own geometry

The example's `geometry.nodes.review` defines a 184 × 96 CSS-pixel box with its target at (51, 8) and source at (133, 88), relative to its top-left. Its drawing name, `sheet`, resolves through the app's trusted registry. The same component draws either view using the supplied `renderer`. The library positions the ports, labels, and state indicators. Geometry and observations can be serialized. The React drawing stays in application code.

```tsx
<TraceFlow graph={graph} renderer={renderer}
  diagramGeometry={geometry} diagramDrawings={drawings} diagramAppearance={appearance} />
```

See [observations.ts](./observations.ts) for the graph, geometry, and illustrative events, [SheetDrawing.tsx](./SheetDrawing.tsx) for the drawing, and [DiagramAppearanceExample.tsx](./DiagramAppearanceExample.tsx) for the controls.
