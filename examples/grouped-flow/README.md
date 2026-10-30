# Grouped flow example

A self-contained React example of an expandable flow diagram. Payment starts open with Authorize and Capture inside it; collapse it to show the same flow as one card. Select a step to inspect the supplied observation.

The desktop flow runs from left to right. At widths of 640px or less it runs from top to bottom, keeping steps readable on a phone. The diagram initially focuses the selected problem on a narrow screen; pan to explore, or use its controls to fit the full flow. After tracing, **Focus highlighted path** brings the supplied path into view. Changing the layout does not change any recorded fact.

From the repository root, with dependencies installed:

```sh
npx vite --config examples/grouped-flow/vite.config.ts
```

Open the local address printed by Vite (by default `http://127.0.0.1:5311`). For a static build:

```sh
npx vite build --config examples/grouped-flow/vite.config.ts
```

The output goes to `grouped-flow-example-dist/`.

## What the example records

All data is synthetic and lives in [fixture.ts](./fixture.ts). The app displays an **Example recording** badge. It uses local code and system fonts, with no remote assets, inference, provider calls, or paid services.

The definition supplies the available steps, group membership, and transitions. A separate observation supplies each recorded node and edge state. Label and Confirmation are explicitly marked `not-run`; an omitted observation remains `unknown`. A completed execution state makes no claim about a real transaction or receipt.

**Trace this problem** selects No shipping option and uses an explicit fixture highlight containing Shipping rates, Rates found?, No shipping option, and their two observed connections. It displays the fixed fact: “The recorded rates result was empty, so the No branch was taken.” It does not discover causes by following structural arrows or explain an unrecorded internal reason.

The example imports the library source directly so edits to the reusable component update the example during local development. Consumers can use the public `GroupedFlowDiagram` export instead.

## Files

- `demo.tsx`: themed example, expansion, selection, and fixed highlight action.
- `fixture.ts`: independent structure, observations, and app-approved emphasis.
- `main.tsx`: React entry point.
- `vite.config.ts`: local development and static output configuration.

## Repeated flow instances

Open `http://127.0.0.1:5311/nested.html` while the same server is running. Two Payment groups have the same name but different instance IDs. Both can expand independently; duplicate Validate steps carry Group/Item context, and selection preserves the exact ID. Missing group observations remain Unknown even when every supplied child completed or a child failed.

## Browser regression proof

With Node 22 or newer and Playwright available as a local development tool, start the server above in one terminal and run:

```sh
node examples/grouped-flow/browser-check.mjs
```

The proof uses only the fixed loopback example server. It checks mouse/keyboard expansion, exact selections and original relationship IDs, explicit states, supplied highlights, nested layout containment, zoom/fit controls, reduced motion, and readable selection framing on 320px/390px screens. It writes a fresh temporary report directory by default. `GROUPED_FLOW_REPORT_DIR` chooses a local report directory. For a separately installed Playwright module or cached Chromium binary, set `GROUPED_FLOW_PLAYWRIGHT_MODULE` and `GROUPED_FLOW_CHROMIUM_EXECUTABLE` explicitly; no credentials or `.env` files are required. The source library does not load or run this script.
