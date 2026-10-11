import * as react from 'react';
import * as _xyflow_react from '@xyflow/react';
import { NodeProps, EdgeProps, Edge } from '@xyflow/react';
import { B as BaseComponentProps, S as StageSnapshot, T as TraceGraph, R as RuntimeOverlay, a as TraceFlowLayout, b as TraceNode$1, c as TraceEdgeData, d as TraceStructureRecorderHandle, e as RuntimeStageId, f as StageId, C as CreateTraceStructureRecorderOptions, g as CreateTraceRuntimeOverlayOptions, h as TraceRuntimeOverlayHandle } from './graphFromStructure-yuEBX-H-.js';
export { M as MinimalFlowRecorder, i as MinimalStructureRecorder, O as OverlayFromSnapshotOptions, j as RuntimeExecutionStep, k as RuntimeOverlaySlice, l as SerializedStructureNode, m as SnapshotWithCommitLog, n as SubflowTree, o as SubflowTreeEntry, p as SubflowTreeProps, q as TraceEdge, r as TraceFlow, s as TraceFlowEdgeColors, t as TraceFlowProps, u as TraceNodeData, v as TracedFlow, w as TracedFlowColors, x as TracedFlowProps, y as asRuntimeStageId, z as asStageId, A as createTraceRuntimeOverlay, D as createTraceStructureRecorder, E as defaultTraceFlowLayout, F as graphFromStructure, G as overlayFromSnapshot, H as sliceOverlay } from './graphFromStructure-yuEBX-H-.js';
import 'foottrace';

interface StageNodeData {
    label: string;
    active?: boolean;
    done?: boolean;
    error?: boolean;
    linked?: boolean;
    /** Semantic icon hint (e.g., "llm", "tool", "rag", "start", "parse", "agent", "guard") */
    icon?: string;
    /** Step numbers in execution order (shown as badges — multiple when revisited via loops) */
    stepNumbers?: number[];
    /**
     * How many times this stage's execution was ATTEMPTED — a declared `retry`
     * policy that actually fired (footprintjs >= 9.15.0). Renders a small
     * warning-weight `↺ ×N` chip when greater than 1; 1 or absent renders
     * nothing, because one attempt is the silent default.
     *
     * Attempt telemetry, not an outcome. A stage that failed twice and then
     * succeeded is a DONE node wearing the chip; a stage that exhausted its
     * policy keeps its error state and wears the chip alongside. The chip
     * never changes the node's status colour.
     *
     * A policy that was DECLARED but never fired shows nothing at all —
     * declared is not the same as happened, and a chart that cannot tell the
     * two apart is worse than one that stays quiet.
     */
    retryAttempts?: number;
    /** Node was not executed (dim it) */
    dimmed?: boolean;
    /** Node is a subflow root (show nested indicator) */
    isSubflow?: boolean;
    /** Node uses lazy resolution (dashed border + cloud icon when unresolved) */
    isLazy?: boolean;
    /** Node is a decider (renders as diamond shape per flowchart convention) */
    isDecider?: boolean;
    /** Node is a fork (parallel fan-out) */
    isFork?: boolean;
    /** Human-readable description of what this stage does */
    description?: string;
    /** Subflow identifier — set when this node belongs to a subflow */
    subflowId?: string;
    /**
     * Stable stage identifier from the spec (`SpecNode.id`). Renderable as a
     * small monospace caption under the label when `showStageId` is true —
     * useful for teaching the runtimeStageId convention and for debugging
     * which node a recorder event belongs to.
     */
    stageId?: string;
    /**
     * When true, render the `stageId` as a small monospace caption beneath
     * the label. Default false. Drives the "Show IDs" toggle in
     * ExplainableShell.
     */
    showStageId?: boolean;
    /**
     * Visual emphasis hint — generic, so the renderer stays domain-agnostic.
     * `hero` = a stage the viewer cares about (accent border + tint + bold);
     * `muted` = mechanism/plumbing (recedes — faded + thin border). The
     * consumer's graph builder sets this from its own semantics (e.g. the
     * agentfootprint lens maps `stageRole` → emphasis). Layers UNDER run status:
     * active/done/error colours still override during a run.
     */
    emphasis?: "hero" | "muted";
    /**
     * Size tier — scales the card's text + padding to match the footprint the
     * layout allocated (the layout's node-size resolver must scale in lockstep,
     * else the card and its laid-out box disagree). `lg` = a focal stage,
     * `sm` = a minor/plumbing stage, default `md`. Generic — no domain meaning.
     */
    size?: "sm" | "md" | "lg";
    [key: string]: unknown;
}
/**
 * Custom ReactFlow node for pipeline stages.
 * All colors and fonts come from `--fp-*` CSS variables (via theme).
 * Shows execution state via color, icon, step badge, and pulse animation.
 */
declare const StageNode: react.NamedExoticComponent<Pick<_xyflow_react.Node<Record<string, unknown>, string | undefined>, "data" | "width" | "height" | "id" | "sourcePosition" | "targetPosition" | "dragHandle" | "parentId"> & Required<Pick<_xyflow_react.Node<Record<string, unknown>, string | undefined>, "type" | "selected" | "draggable" | "dragging" | "selectable" | "deletable" | "zIndex">> & {
    isConnectable: boolean;
    positionAbsoluteX: number;
    positionAbsoluteY: number;
} & {
    data: StageNodeData;
}>;

/**
 * @deprecated Since 0.38.0 — retained in 1.x. Use
 * `<SnapshotPanel>` for the same scrubber + memory + narrative + Gantt
 * without a chart, `<ExplainableShell>` for the full shell over a
 * footprintjs run, or the `footprint-viewer` package for the zero-config
 * five-tab viewer.
 */
interface TimeTravelDebuggerProps extends BaseComponentProps {
    /** Stage snapshots */
    snapshots: StageSnapshot[];
    /** Recorder-captured build-time graph (from
     *  `createTraceStructureRecorder().getGraph()`). Required for the
     *  chart rendering — replaces the legacy `nodes` / `edges` props. */
    graph: TraceGraph;
    /** Optional runtime overlay (from
     *  `createTraceRuntimeOverlay().getOverlay()`). When provided, the
     *  chart renders via `<TracedFlow>` with per-step coloring synced to
     *  the scrubber; otherwise renders via `<TraceFlow>` (build-time only). */
    runtimeOverlay?: RuntimeOverlay;
    /** Show Gantt timeline */
    showGantt?: boolean;
    /** Layout direction */
    layout?: "horizontal" | "vertical";
    /** Title */
    title?: string;
}
/**
 * Full time-travel debugger: scrubber + recorder-driven flowchart +
 * memory + narrative + gantt. This is the "batteries included"
 * component for pipeline debugging.
 *
 * v6+: chart rendering is recorder-driven. Pass `graph` (always) and
 * optionally `runtimeOverlay` for per-step coloring tied to the
 * scrubber.
 *
 * @deprecated Since 0.38.0 — retained in 1.x.
 *
 * It owns its cursor (the scrubber index is local state with no
 * `selectedIndex` / `onIndexChange`), so nothing outside it can move the
 * time-travel position or read it — which is why no shipped surface in
 * this library uses it. What it renders, three supported components
 * already render, controlled:
 *
 *   - `<SnapshotPanel>` — the same scrubber + memory + narrative + Gantt.
 *   - `<ExplainableShell>` — that plus the chart, drill-down, tracing and
 *     the recorder tabs, over a footprintjs run.
 *   - `footprint-viewer` — the zero-config five-tab viewer, if you want
 *     the whole experience rather than one panel.
 */
declare function TimeTravelDebugger({ snapshots, graph, runtimeOverlay, showGantt, layout, title, size, unstyled, className, style, }: TimeTravelDebuggerProps): react.JSX.Element;

/**
 * useSubflowNavigation — LEGACY drill-down breadcrumb tracker.
 *
 * DEPRECATED since 0.38.0 — retained in 1.x. Two reasons, both
 * structural rather than stylistic:
 *
 *   1. **The key it emits is the wrong one.** `currentSubflowId` here is
 *      the child chart's LOCAL `subflowId`. That is not unique: mount the
 *      same chart twice and both mounts report the same key, so a filter
 *      keyed on it shows the other mount's stages — or nothing. The modern
 *      drill keys by the MOUNT NODE'S id, which is unique by construction
 *      (see `_internal/subflowDrill.ts`, "Drill KEY vs. child SCOPE").
 *   2. **It is half a system.** `currentGraph` is documented to swap to the
 *      child's graph and never has (see the TODO below) — it returns the
 *      root graph at every level, so the chart never actually narrows.
 *
 * Use instead: `<TracedFlow>`'s built-in drill — it owns the scope
 * (`currentSubflowId` + `onSubflowChange`, mount-node keyed) and renders
 * its own breadcrumb. Driving it yourself is the same two pure functions
 * the component calls: `filterGraphForDrill(graph, mountNodeId)` and
 * `buildSubflowBreadcrumb(graph, mountNodeId)`, both exported from
 * `footprint-explainable-ui/flowchart`.
 *
 * Original notes follow.
 *
 * ---
 *
 * Recorder-driven (v6+): replaces the legacy SpecNode-walk path. Accepts
 * a `TraceGraph` (from `createTraceStructureRecorder`) and tracks WHICH
 * subflow the user has drilled into.
 *
 * Limitation (intentional — recorder graph is flat / mount-only):
 *   The StructureRecorder records the MOUNT of each subflow in the
 *   parent chart, not the inner structure of each child chart. So
 *   "drill into a subflow" today returns the SAME graph with the
 *   `currentSubflowId` marker advanced — there is no separate
 *   child-graph to swap in. Filtering nodes by
 *   `data.subflowId === <selected>` would only surface mount nodes,
 *   not the child chart's stages.
 *
 * TODO(recorder-driven-nesting): when child charts attach their own
 * `traceStructureRecorder` and surface those graphs via a registry,
 * accept `Map<subflowId, TraceGraph>` and swap `currentGraph` to the
 * child's graph on drill-down. Consumers can then render
 * `<TraceFlow graph={currentGraph} />` per level.
 */

interface BreadcrumbEntry$1 {
    /** Display name for this level */
    label: string;
    /** The subflow id that was drilled into to reach this level
     *  (undefined for root). */
    subflowId?: string;
    /** Human-readable description of this subflow */
    description?: string;
}
interface SubflowNavigation {
    /** Current breadcrumb path (root → ... → current) */
    breadcrumbs: BreadcrumbEntry$1[];
    /** Current graph — today identical to the root graph (see file-level
     *  TODO). Consumers should still treat this as the source of truth so
     *  they remain forward-compatible once per-subflow graphs are wired in. */
    currentGraph: TraceGraph;
    /** Subflow id of the level the user is currently inside (null at root). */
    currentSubflowId: string | null;
    /** Display name of the subflow node we drilled into (null at root). */
    currentSubflowNodeName: string | null;
    /** Call when a node is clicked — drills in if it's a subflow.
     *  Returns true when the click pushed a new level. */
    handleNodeClick: (nodeId: string) => boolean;
    /** Navigate to a specific breadcrumb level (0 = root) */
    navigateTo: (level: number) => void;
    /** Whether we're currently inside a subflow (not at root) */
    isInSubflow: boolean;
}
/**
 * Hook that tracks subflow drill-down state for a recorder-driven chart.
 *
 * Maintains a breadcrumb stack. When a subflow node is clicked the
 * stack pushes a new entry; breadcrumb clicks pop back to that level.
 * See file-level docs for the deferred per-subflow graph swap.
 *
 * @deprecated Since 0.38.0 — retained in 1.x. Use
 * `<TracedFlow>`'s built-in drill (`currentSubflowId` / `onSubflowChange`,
 * keyed by the mount node's id), or drive it yourself with
 * `filterGraphForDrill` + `buildSubflowBreadcrumb`.
 */
declare function useSubflowNavigation(rootGraph: TraceGraph | null): SubflowNavigation;

/**
 * @deprecated Since 0.38.0 — retained in 1.x. Its `breadcrumbs`
 * come from `useSubflowNavigation`, which is deprecated for keying the
 * drill by a non-unique id. Use `<TracedFlow>`'s own breadcrumb bar, or
 * `buildSubflowBreadcrumb(graph, mountNodeId)` to render your own trail.
 */
interface SubflowBreadcrumbProps {
    breadcrumbs: BreadcrumbEntry$1[];
    onNavigate: (level: number) => void;
}
/**
 * Breadcrumb bar for subflow drill-down navigation.
 * Shows: Root > SubflowA > SubflowB — clicking any crumb navigates back.
 *
 * @deprecated Since 0.38.0 — retained in 1.x. This is the
 * display half of the legacy `useSubflowNavigation` pair; the modern
 * chart draws its own trail from `buildSubflowBreadcrumb`. Use
 * `<TracedFlow>` (breadcrumb included), or call `buildSubflowBreadcrumb`
 * yourself when you own the layout.
 */
declare const SubflowBreadcrumb: react.NamedExoticComponent<SubflowBreadcrumbProps>;

/**
 * Pure helpers for subflow drill-down on a `TraceGraph`.
 *
 * Filtering and breadcrumb computation are derived from the
 * `TraceNodeData.subflowOf` field that the structure recorder sets
 * at `onSubflowMounted` time. Both functions are pure (no I/O, no
 * React) so they can be unit-tested in isolation and reused by any
 * renderer.
 *
 * Drill KEY vs. child SCOPE (why `resolveDrillScope` exists)
 * ──────────────────────────────────────────────────────────
 * A drill is identified by the MOUNT NODE'S id — `pipeline/prepare` —
 * because node ids are globally unique. `data.subflowId` is NOT: it is
 * the child chart's own LOCAL id, so mounting the same chart twice
 * (top level AND inside another subflow) gives two mounts the same
 * `subflowId`. Drilling by that shared id showed the OTHER mount's
 * stages, or — when only the nested mount existed — nothing at all.
 *
 * The children's `subflowOf` tag is what the filter actually matches,
 * and two producers spell it differently:
 *
 *   - eui's own recorder (`walkSubflowSpecInto`) tags inner stages with
 *     the mount PATH, which equals the mount node's id.
 *   - a consumer bridge may materialise internals tagged with the
 *     mount's LOCAL `subflowId` instead.
 *
 * `resolveDrillScope` turns a drill key into whichever of the two the
 * graph in hand actually uses, so both producers drill correctly and a
 * caller that still passes a bare `subflowId` keeps working.
 */

/**
 * Filter the trace graph by drill-down scope.
 *
 *   - `currentSubflowId === null`  → show top-level (nodes with no
 *     `subflowOf`). Subflow internals are hidden; their mount node
 *     stays visible as a single clickable card.
 *   - `currentSubflowId === 'X'`   → show only the stages of the mount
 *     `X` names — `X` being the mount NODE id (preferred, unique) or
 *     its local `subflowId` (legacy).
 *
 * Edges follow the same filter — only edges where both endpoints
 * are in the visible set survive. When nothing would be filtered
 * out, returns the original graph reference (preserves upstream
 * memoization).
 */
declare function filterGraphForDrill(graph: TraceGraph, currentSubflowId: string | null): TraceGraph;
/** Entry in the breadcrumb path. `subflowId === null` is the root.
 *  For a drilled level this carries the DRILL KEY (the mount node's id),
 *  which is what `onNavigate` hands back to the drill. */
interface BreadcrumbEntry {
    subflowId: string | null;
    label: string;
}
/**
 * Build the breadcrumb path for the current drill level.
 *
 * Always starts with the root `{ subflowId: null, label: 'Chart' }`, then
 * one entry per ancestor mount, outermost first — walked by following each
 * mount's own `subflowOf` up to the top level. Drill keys are unique node
 * ids, so the FULL chain is recoverable: drilling `Pipeline` → `Prepare`
 * reads `Chart › Pipeline › Prepare`, and clicking `Pipeline` goes back one
 * level instead of all the way out.
 */
declare function buildSubflowBreadcrumb(graph: TraceGraph, currentSubflowId: string | null): BreadcrumbEntry[];

/**
 * collapseTraceGraph — hide a caller-chosen set of nodes from a `TraceGraph`,
 * honestly: the nodes disappear, the edges through them are re-connected, and
 * the caller gets the list of what was hidden so the UI can SAY so.
 *
 * The mechanism is deliberately NEUTRAL: this library has no idea what makes a
 * node worth hiding — that judgement belongs to whoever built the graph (a
 * domain layer might hide its framework's own plumbing subflows, a dashboard
 * might hide retries). The predicate receives the whole node, so a caller can
 * decide by id, by `data.emphasis`, by `data.isSubflow` — anything the graph
 * already carries. No id convention is special-cased here.
 *
 * Rules, stated so they can be tested (and they are — collapseTraceGraph.test):
 *
 *   1. A node the predicate matches is removed, and listed in `hiddenNodeIds`.
 *   2. A removed subflow card takes its internals with it (the nodes whose
 *      `subflowOf` scope it owns, transitively). They are NOT listed — they
 *      were only ever reachable by drilling a card that no longer exists, and
 *      counting invisible internals would overstate what the collapse hid.
 *   3. Every path THROUGH a removed node survives: predecessors connect to
 *      successors (chains of removed nodes contract fully). A contracted edge
 *      that would point a node at itself is dropped; duplicates are deduped.
 *   4. A loop edge stays a loop edge: if either contracted leg was `kind:
 *      'loop'`, the resulting edge is too — hiding a stage inside a loop must
 *      not straighten the loop.
 *   4b. A contracted edge REMEMBERS what it contracted through: `data.via`
 *      lists the removed node ids the edge now stands in for (chains
 *      accumulate; duplicate contractions union their lists). That is how a
 *      time cursor standing on a hidden node stays visible — the renderer
 *      lights the edge that carries it (`edgeCarriesCursor`) instead of
 *      going dark.
 *   5. Nothing matched → the ORIGINAL graph reference comes back (upstream
 *      memoization is preserved), with an empty `hiddenNodeIds`.
 *
 * The transform is pure and synchronous. It says what it hid; it never decides
 * what SHOULD be hidden and it never renders the sentence — absent and hidden
 * are different facts, and only the caller knows the words for them.
 */

type TraceNode = TraceGraph["nodes"][number];
interface CollapsedTraceGraph {
    /** The graph with the hidden nodes removed and their edges contracted. The
     *  ORIGINAL reference when nothing matched. */
    readonly graph: TraceGraph;
    /**
     * The ids of the nodes the predicate matched, in graph order — what the
     * collapse HID, for the caller's honest sentence ("N steps hidden"). A
     * removed card's internals are not listed (see rule 2 above).
     */
    readonly hiddenNodeIds: readonly string[];
}
declare function collapseTraceGraph(graph: TraceGraph, hide: (node: TraceNode) => boolean): CollapsedTraceGraph;

interface GroupContainerNodeData {
    label: string;
    isGroupContainer?: boolean;
    active?: boolean;
    done?: boolean;
    error?: boolean;
    dimmed?: boolean;
    description?: string;
    icon?: string;
    [key: string]: unknown;
}
declare function GroupContainerNode({ data }: NodeProps): react.JSX.Element;

interface SlotPillNodeData {
    label: string;
    /** Lit when the selector PICKED this slot this turn (overlay or consumer). */
    active?: boolean;
    selected?: boolean;
    done?: boolean;
    /** Faded when other slots ran but this one didn't (the "unlit" signal). */
    dimmed?: boolean;
    /** Semantic kind hint for the dot color (e.g. 'system-prompt'|'messages'|'tools'). */
    slotKind?: string;
    icon?: string;
    [key: string]: unknown;
}
declare function SlotPillNode({ data }: NodeProps): react.JSX.Element;

declare function LoopBackEdge({ id, source, target, markerEnd, style }: EdgeProps): react.JSX.Element | null;

declare function SmartStepEdge({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, }: EdgeProps): react.JSX.Element;

/**
 * groupLayout — xyflow NATIVE container boxes for the trace chart.
 *
 * Two box mechanisms live here, plus the existing drill (elsewhere):
 *
 *   - **Drill** (`subflowDrill.ts` + `useSubflowDrill`): a subflow shows as
 *     ONE mount card; clicking it zooms in. The DEFAULT for every subflow.
 *   - **Main-chart box** (`wrapInMainChartBox`): wrap the WHOLE chart in ONE
 *     container box. This is the Lens model — the primitive you're viewing
 *     (LLMCall / Agent) is always one box; every subflow inside it stays a
 *     drill card. A `nodeTypes` registry then styles each inner card
 *     (system-prompt / messages / tools / LLM). USE THIS for Lens.
 *   - **Per-subflow group** (`applyGroupLayout`): box individual subflows
 *     (mount → container, members nested inside). A more granular tool kept
 *     for consumers that want specific subflows inlined as boxes rather than
 *     drilled. NOT what the Lens main-chart model uses.
 *
 * All are pure `(graph, opts) => graph` (no React, no I/O) and compose with
 * `<TracedFlow>` before nodes reach `<ReactFlow>`. explainable-ui stays
 * policy-free: it offers the mechanisms; the consumer (Lens) picks.
 *
 * Pure: `(graph, opts) => graph`. No React, no I/O. Composed by `<TracedFlow>`
 * before the nodes reach `<ReactFlow>`.
 *
 * What it does, given `groupedSubflowIds`:
 *   1. For each grouped subflow that is actually present (a mount node whose
 *      `subflowId` is listed AND has ≥1 member where `subflowOf === id`):
 *      - lay the OUTER graph out with `baseLayout` (members excluded; the
 *        mount stays as the box anchor);
 *      - lay the subflow's MEMBERS out with `baseLayout` in isolation, then
 *        normalise them to the box's local coordinate space;
 *      - size the container box to fit the members (+ header + padding);
 *      - convert the mount node to `type: 'groupContainer'` with a `style`
 *        width/height, and nest each member via `parentId` + `extent`.
 *   2. Subflows NOT listed are left untouched (they continue to drill).
 *
 * Node ORDER invariant (xyflow requirement): a parent node MUST appear
 * before its children in the array. We emit all outer nodes (containers
 * included) first, then all nested members — so every container precedes
 * its members.
 */

/** xyflow node type used for the container box. Consumers register a
 *  renderer for this key (explainable-ui ships a default `GroupContainerNode`). */
declare const GROUP_CONTAINER_NODE_TYPE = "groupContainer";
interface GroupLayoutOptions {
    /** Subflow ids (the mount's `subflowId`) to render as group boxes. */
    readonly groupedSubflowIds: readonly string[];
    /** Layout for both the outer graph and each subflow's interior. */
    readonly baseLayout: TraceFlowLayout;
    /** Inner padding inside the container box, in px. Default 16. */
    readonly padding?: number;
    /** Header strip height (room for the box title), in px. Default 44. */
    readonly headerHeight?: number;
    /** Assumed node footprint for box sizing (the layout sets positions, not
     *  sizes). Defaults match the bundled `StageNode` footprint. */
    readonly nodeWidth?: number;
    readonly nodeHeight?: number;
}
/**
 * Apply group-container nesting to a positioned-or-unpositioned graph.
 * Returns a NEW graph (input is not mutated). Edges pass through unchanged
 * — xyflow resolves them by node id regardless of nesting, so an edge that
 * pointed at a now-container mount still connects to the box, and
 * member↔member edges render inside it.
 */
declare function applyGroupLayout(graph: TraceGraph, opts: GroupLayoutOptions): TraceGraph;
/**
 * Convenience: wrap a base layout into a `TraceFlowLayout` that applies
 * group containers. Pass to `<TraceFlow layout={...}>` / `<TracedFlow>`.
 */
declare function createGroupedLayout(opts: GroupLayoutOptions): TraceFlowLayout;
/** Default id for the synthesised main-chart container node. */
declare const MAIN_CHART_BOX_ID = "__main_chart__";
interface MainChartBoxOptions {
    /** Layout applied to the chart's contents before wrapping. */
    readonly baseLayout: TraceFlowLayout;
    /** Container node id. Default `__main_chart__`. */
    readonly id?: string;
    /** Box title (rendered in the container header). */
    readonly label?: string;
    /** Optional taxonomy hint surfaced on `data` (e.g. 'LLMCall' | 'Agent'). */
    readonly kind?: string;
    readonly padding?: number;
    readonly headerHeight?: number;
    readonly nodeWidth?: number;
    readonly nodeHeight?: number;
}
/**
 * Wrap an entire graph in a single main-chart container box. Pure
 * `(graph, opts) => graph`; input not mutated. Empty graph → returned
 * unchanged (nothing to wrap).
 */
declare function wrapInMainChartBox(graph: TraceGraph, opts: MainChartBoxOptions): TraceGraph;
/**
 * Convenience: a `TraceFlowLayout` that wraps the whole chart in one
 * main-chart box. Pass to `<TraceFlow layout={...}>` / `<TracedFlow>`.
 */
declare function createMainChartBoxLayout(opts: MainChartBoxOptions): TraceFlowLayout;

/**
 * dagreTraceLayout — professor-grade `TraceFlowLayout` backed by dagre.
 *
 * Replaces the hand-rolled BFS `defaultTraceFlowLayout` (which used FIXED
 * spacing constants — Y_STEP / X_SPREAD — and documented "first-wins"
 * convergence + no overlap detection). Dagre instead derives every
 * position from the STRUCTURE RELATIONS:
 *
 *   - **next** (sequential): y-delta = rank depth (longest path), so a
 *     convergence node lands at `max(incoming ranks) + 1` — not
 *     "deepest-branch-so-far".
 *   - **fork / selector** (N branches): x-delta = the measured SUBTREE
 *     WIDTH of each branch (a wide branch pushes its siblings further; a
 *     thin one barely shifts them) — scales cleanly for any N, no collisions.
 *   - **merge** (join): centered under the average of its real parents.
 *
 * Compound nesting: dagre is given `parentId` as a compound-parent link,
 * so group-container children (from `applyGroupLayout` / `wrapInMainChartBox`)
 * stay inside their box. Coordinates are returned parent-RELATIVE (xyflow
 * convention), matching what the box transforms expect.
 *
 * Ported from agentfootprint-lens's proven `dagreLayout` (same dagre core),
 * re-shaped to the `TraceFlowLayout` contract: `(TraceGraph) => TraceGraph`.
 * Pure — same graph in, same positions out; no React, no I/O.
 */

/** Explicit node footprint (px). */
interface NodeFootprint {
    readonly width: number;
    readonly height: number;
}
/**
 * Consumer-supplied per-node size resolver. Receives the WHOLE node (all
 * recorder semantics: `data.isSubflow`, `data.icon`, `data.subflowId`,
 * `id`, …) and returns a footprint, or `undefined` to leave the node alone
 * (→ falls back to `style.width/height`, then the default footprint).
 *
 * The library imposes NO sizing rules — the consumer decides per node by
 * whatever criteria THEY choose. E.g. make one specific slot a slim bar
 * while another stays a full card; make the LLM-call node large; etc.
 */
type NodeSizeResolver = (node: TraceNode$1) => NodeFootprint | undefined;
/** Consumer-supplied per-edge layout-weight resolver. Higher weight pulls
 *  the two endpoints into a tighter, straighter column (dagre `weight`).
 *  Return `undefined` for the default (1). */
type EdgeWeightResolver = (edge: Edge<TraceEdgeData>) => number | undefined;
/** Consumer-supplied per-edge minimum rank-span resolver. `>1` STRETCHES an
 *  edge (pushes its target that many ranks down). Note dagre cannot make an
 *  edge SHORTER than one rank — `minlen` only increases. Return `undefined`
 *  for the default (1). */
type EdgeMinLenResolver = (edge: Edge<TraceEdgeData>) => number | undefined;
/**
 * Consumer-supplied left-to-right ORDER for a node's fork/decider children.
 * Receives the source node id + its child target ids (in spec/edge-insertion
 * order); returns the SAME ids reordered left-to-right (index 0 = leftmost).
 * Ids omitted from the result keep their original relative order after the
 * listed ones. Return the input unchanged (or `undefined` from the resolver)
 * to leave a node alone.
 *
 * Use to place a specific branch on a chosen side — e.g. the looping branch on
 * the right margin where the loop-back curve lives, so the "iterate" path reads
 * as one side of the fork. This is a pure VISUAL/LAYOUT decision (it changes
 * which side a branch draws on, never the chart's behavior), so it belongs in
 * the renderer, not the chart spec.
 *
 * Mechanism: dagre seeds its sibling order from edge-insertion order and keeps
 * it as the tie-break for equal-barycenter siblings. We insert each source's
 * edges in the resolved order, so for the common symmetric N-branch decider the
 * result is deterministic. (For graphs where one ordering strictly reduces edge
 * crossings, dagre's crossing-minimizer may still override — best-effort, as
 * documented for any dagre ordering hint.)
 */
type SiblingOrderResolver = (sourceId: string, childIds: readonly string[]) => readonly string[];
interface DagreTraceLayoutOptions {
    /** Layout direction. `'TB'` (top-to-bottom) is the default — matches the
     *  "Seed → … → answer" reading order. */
    readonly direction?: "TB" | "BT" | "LR" | "RL";
    /** Vertical spacing between rank layers (px). Surfaced as a knob — the
     *  rank-gap delta. Default 80. */
    readonly rankSep?: number;
    /** Horizontal spacing between siblings within a rank (px). The
     *  sibling-gap delta dagre adds ON TOP of measured subtree widths.
     *  Default 60. */
    readonly nodeSep?: number;
    /** Spacing between edges (px). Default 20. */
    readonly edgeSep?: number;
    /** Fallback node footprint when a node carries no explicit size. dagre
     *  needs real dimensions or arrows collapse to a point. */
    readonly nodeWidth?: number;
    readonly nodeHeight?: number;
    /** Per-node size resolver — consumer decides each node's footprint. See
     *  `NodeSizeResolver`. Resolution order: resolver → `node.style` → default. */
    readonly nodeSize?: NodeSizeResolver;
    /** Per-edge pull (dagre `weight`). See `EdgeWeightResolver`. */
    readonly edgeWeight?: EdgeWeightResolver;
    /** Per-edge stretch (dagre `minlen`). See `EdgeMinLenResolver`. */
    readonly edgeMinLen?: EdgeMinLenResolver;
    /** Per-node fork/decider child ordering. See `SiblingOrderResolver`. */
    readonly siblingOrder?: SiblingOrderResolver;
}
/**
 * Lay out a `TraceGraph` with dagre. Returns a NEW graph with each node's
 * `position` set (top-left, parent-relative for nested nodes). Edges pass
 * through unchanged — xyflow routes them once nodes are placed.
 *
 * Loop back-edges (`kind: 'loop'`) are EXCLUDED from the dagre graph: they
 * are visual annotations only (invariant I1) and would otherwise create
 * cycles that distort ranking.
 */
declare function dagreTraceLayout(graph: TraceGraph, options?: DagreTraceLayoutOptions): TraceGraph;
/**
 * Build a `TraceFlowLayout` from dagre options. Pass to
 * `<TraceFlow layout={...}>` / `<TracedFlow layout={...}>`, or use it as a
 * `baseLayout` for the group/main-box transforms.
 */
declare function createDagreTraceLayout(options?: DagreTraceLayoutOptions): TraceFlowLayout;

/**
 * snapLinearSuccessors — pure post-dagre alignment pass for the chart SPINE.
 *
 * THE PROBLEM IT FIXES
 * --------------------
 * On a chart like `Context(selector) → [slot, slot] → messageAPI(merge) →
 * callLLM(linear)`, dagre's default balanced x-assignment (Brandes–Köpf
 * `balance()` = median of 4 extreme alignments) drifts a pure linear
 * successor a few px off the spine on an ASYMMETRIC graph (a wide callLLM
 * node + the fork above unbalance the alignment passes). Measured centers:
 * context 915, messageAPI 917, callLLM 921 — callLLM is ~6px off even though
 * it is a single-in / single-out continuation of messageAPI.
 *
 * THE FIX
 * -------
 * A pure `(graph) => graph` pass applied AFTER `dagreTraceLayout`. A node with
 * EXACTLY ONE forward (non-loop) predecessor, whose predecessor has EXACTLY
 * ONE forward (non-loop) successor, and which shares the same `parentId`
 * coordinate space, snaps its CENTER-x onto that predecessor's center-x. The
 * top-left `position.x` is recomputed from the new center using the node's OWN
 * width. `y` is never touched.
 *
 * WHAT IT NEVER MOVES (by construction of the predicate)
 * ------------------------------------------------------
 *   - the ROOT             — 0 predecessors            → predicate (1) fails
 *   - a MERGE (messageAPI) — >1 predecessor            → predicate (1) fails
 *   - FORK / DECISION children — predecessor out-deg>1 → predicate (2) fails
 *   - cross-compound hops  — differing parentId        → predicate (3) fails
 * A fork/merge NODE itself is still snapped onto ITS upstream predecessor when
 * that predecessor is a pure linear hop — correct, it is a continuation of
 * whatever feeds it. Only its CHILDREN are protected.
 *
 * PROPERTIES
 * ----------
 *   - PURE: never mutates the input graph; returns a new nodes array (edges by
 *     reference, mirroring dagre's own pass-through).
 *   - IDEMPOTENT: re-running finds centers already equal → zero-delta writes.
 *   - CHAIN-PROPAGATING: nodes are processed in rank (y-asc) order, so a
 *     snapped predecessor's corrected x flows down a `a→b→c` chain in one pass.
 *   - GEOMETRY-EXACT: widths come from the SAME resolver→style→default order
 *     dagre used (`sizeOf`), so reconstructed centers match dagre's placement.
 *
 * Compose it with dagre via `createSnappedDagreLayout`, or call it directly on
 * a `dagreTraceLayout(...)` result. Kept SEPARATE from `dagreTraceLayout` so
 * the base layout's output stays byte-identical for consumers that don't opt
 * in.
 */

/**
 * Options for the snap pass. These MUST mirror the size-relevant options
 * passed to the `dagreTraceLayout` run that produced the graph, so the pass
 * reconstructs each node's center from the identical width.
 */
interface SnapLinearSuccessorsOptions {
    /** Per-node size resolver — same one passed to dagre. Resolution order:
     *  resolver → `node.style` → default. */
    readonly nodeSize?: NodeSizeResolver;
    /** Fallback width when a node carries no resolver/style size. Must match
     *  the dagre run's `nodeWidth`. Default 200. */
    readonly nodeWidth?: number;
    /** Fallback height. Must match the dagre run's `nodeHeight`. Default 80.
     *  (Height is unused for x-snapping but kept so `sizeOf` resolves the same
     *  footprint the resolver may key on.) */
    readonly nodeHeight?: number;
}
/**
 * Snap pure single-in/single-out linear successors onto their predecessor's
 * center-x. See the file header for the full contract. Pure + idempotent.
 */
declare function snapLinearSuccessors(graph: TraceGraph, options?: SnapLinearSuccessorsOptions): TraceGraph;
/**
 * Convenience: run a base `TraceFlowLayout` (typically `createDagreTraceLayout`)
 * then the snap pass, as one composed layout.
 *
 * @example
 *   const layout = createSnappedDagreLayout(
 *     createDagreTraceLayout({ nodeSize }),
 *     { nodeSize }, // SAME size opts so widths match
 *   );
 */
declare function createSnappedDagreLayout(base: TraceFlowLayout, options?: SnapLinearSuccessorsOptions): TraceFlowLayout;

/**
 * traceGroupLayout — a group-based layout for footprint trace charts, designed
 * the way a layout engineer reasons about structured flowcharts: NOT by tuning
 * a generic Sugiyama/dagre pass, but by ranking nodes into bands and centering
 * each MERGE under the SPAN of its inputs, so the layout's correctness falls out
 * BY CONSTRUCTION.
 *
 * The mental model (groups):
 *   - A SEQUENCE is a single-in/single-out chain → stacked vertically, each node
 *     inheriting its predecessor's x (a straight spine; the downstream
 *     `snapLinearSuccessors` pass keeps it pixel-exact).
 *   - A FORK (a node with ≥2 branch children) → its children spread across the
 *     next band; the children ARE the parallel group.
 *   - A MERGE (a node with ≥2 incoming edges) → centered under the combined
 *     visual SPAN of its inputs. This handles STAGGERED merges with zero
 *     special-casing: longest-path ranking puts a merge one band below its
 *     deepest input, and span-centering places it symmetrically under inputs
 *     that may sit at different bands and have very different widths.
 *
 * For the agent merge-tree this yields: messageAPI centered under
 * {system-prompt, messages}; call-llm centered under the span of
 * {messageAPI, tools} (tools bypasses messageAPI's band — a staggered merge);
 * route + its branches symmetric below; the loop excluded from layout (drawn as
 * a right-margin back-edge by `LoopBackEdge`).
 *
 * Contract: pure `(TraceGraph) => TraceGraph`, sets `position` (top-left) on
 * every node, parent-relative for `parentId` nodes — same as `dagreTraceLayout`.
 * Reuses `sizeOf` / `NodeSizeResolver` / size defaults from `dagreTraceLayout`
 * (so the group-container "style-wins" exception + any consumer sizing behave
 * identically), and composes with the existing `createSnappedDagreLayout` +
 * `wrapInMainChartBox` passes — no duplication.
 */

interface TraceGroupLayoutOptions {
    /** Vertical gap between rank bands (px). Default 80. */
    readonly rankSep?: number;
    /** Horizontal gap between siblings within a band (px). Default 60. */
    readonly nodeSep?: number;
    /** Fallback node footprint when a node carries no explicit size. */
    readonly nodeWidth?: number;
    readonly nodeHeight?: number;
    /** Per-node size resolver (see `NodeSizeResolver`). Resolution order matches
     *  `dagreTraceLayout.sizeOf`. */
    readonly nodeSize?: NodeSizeResolver;
    /** Left-to-right order for a fork's children within their band (see
     *  `SiblingOrderResolver`). Default = edge-insertion order. */
    readonly siblingOrder?: SiblingOrderResolver;
    /** Bottom-up merge re-centering pass. Default true; off = pass-1 only (debug). */
    readonly enableMergeCentering?: boolean;
    /**
     * How a MERGE (join) node is horizontally placed relative to its inputs:
     *   - `"span"` (default) — centered under the combined visual SPAN of its
     *     inputs. Faithful "this node's data comes from those boxes", but when a
     *     join's inputs are the splayed children of a fork, the join lands under
     *     the splay (off the trunk) and the main path ZIG-ZAGS.
     *   - `"fork-origin"` — aligned with the FORK the inputs re-converge from
     *     (their lowest common ancestor). A join returns to its fork's axis, so
     *     the trunk (root → joins → tail) renders as ONE STRAIGHT centered column
     *     with the branches splaying symmetrically around it. Nested forks return
     *     to their INNER fork. Use for "read it as a sequence with side-inputs"
     *     charts.
     * Default `"span"` (unchanged behavior for existing consumers).
     */
    readonly mergeAlign?: "span" | "fork-origin";
}
/**
 * Lay out a `TraceGraph` by rank bands + span-centered merges. Returns a NEW
 * graph with each node's `position` set. Edges pass through by reference.
 */
declare function traceGroupLayout(graph: TraceGraph, options?: TraceGroupLayoutOptions): TraceGraph;
/**
 * Build a `TraceFlowLayout` from group-layout options. Pass to
 * `<TraceFlow layout={...}>` / `<TracedFlow layout={...}>`, or wrap with the
 * existing `createSnappedDagreLayout(base, opts)` (it is layout-engine-agnostic)
 * and/or `wrapInMainChartBox`.
 */
declare function createTraceGroupLayout(options?: TraceGroupLayoutOptions): TraceFlowLayout;

/**
 * createNodeViewRecorder — per-stage summary translator.
 *
 * Implements footprintjs v6.0+ `CombinedRecorder` (Flow + Scope) and
 * produces a `NodeViewIndex` — per-stage data keyed by both `StageId`
 * (chart-shape lookup) and `RuntimeStageId` (per-execution lookup).
 *
 * Composition (panel guidance, L8.0 review)
 * ─────────────────────────────────────────
 *   NodeView does NOT duplicate the structural prev/next index — it
 *   READS those fields from the structure translator's
 *   `node.data.prevIds`/`nextIds`. The structure translator already
 *   maintains convergence-correct, loop-excluded neighbors. Duplicating
 *   the index here would re-introduce edge-ordering bugs we just
 *   solved.
 *
 *   The NodeView translator owns ONLY runtime-derived per-stage state:
 *     - `executions[]` — every FlowRecorder.onStageExecuted event for
 *       this stage (loop-friendly: N executions of one stage produce
 *       N entries, each with its own runtimeStageId).
 *     - `commitRuntimeStageIds[]` — refs to commits made by this stage
 *       (the canonical CommitView lives in CommitFlowIndex from L8.2;
 *       NodeView stores only the join key).
 *
 *   Plus derived convenience fields: `visitedInRun`, `executionCount`,
 *   `firstExecutedAt`, `lastExecutedAt`, `totalDurationMs`, `errorCount`.
 *
 * Version bumping
 * ───────────────
 *   NodeView bumps its own version on EITHER:
 *     (a) a Flow/Scope event arrives (own state mutates), OR
 *     (b) the structure translator's version bumps (structural data
 *         the index projects from changed).
 *
 *   So `useTranslator(nodeView, ...)` re-renders when EITHER changes —
 *   one subscription, full reactive coverage.
 *
 * @example
 * ```tsx
 * import { createTraceStructureRecorder, createNodeViewRecorder, useTranslator } from 'footprint-explainable-ui/flowchart';
 *
 * const trace = useMemo(() => createTraceStructureRecorder(), []);
 * const nodeView = useMemo(() => createNodeViewRecorder({ structure: trace }), [trace]);
 *
 * useEffect(() => {
 *   executor.attachFlowRecorder(nodeView.recorder);
 *   executor.attachScopeRecorder(nodeView.recorder);
 * }, [nodeView]);
 *
 * const index = useTranslator(nodeView, () => nodeView.getIndex());
 * const finalize = index.byStageId.get(asStageId('FinalizeOrder'));
 * // finalize.prevIds            → ['CheckInventory', 'RunFraudCheck']  (from structure)
 * // finalize.executions         → [{ runtimeStageId, iteration, startMs, endMs, ... }]
 * // finalize.visitedInRun       → true
 * // finalize.commitRuntimeStageIds → ['finalize-order#3', ...]
 * ```
 */

interface TraversalContext$1 {
    readonly runtimeStageId: string;
    readonly iteration?: number;
    readonly runId?: string;
}
interface FlowStageExecutedEvent$1 {
    readonly stageName: string;
    readonly stageId?: string;
    readonly traversalContext: TraversalContext$1;
    readonly startTime?: number;
    readonly endTime?: number;
}
interface FlowErrorEvent$1 {
    readonly stageName: string;
    readonly stageId?: string;
    readonly message?: string;
    readonly traversalContext?: TraversalContext$1;
}
/** One FAILED attempt at a stage with a declared `retry` policy
 *  (footprintjs >= 9.15.0). Fires DURING the stage, before its
 *  `onStageExecuted`, and only when another attempt follows. */
interface FlowStageRetryEvent$1 {
    readonly stageName: string;
    readonly stageId?: string;
    /** Which attempt just FAILED, 1-based. */
    readonly attempt?: number;
    readonly maxAttempts?: number;
    readonly delayMs?: number;
    readonly message?: string;
    readonly traversalContext?: TraversalContext$1;
}
interface FlowRunLifecycleEvent$1 {
    readonly traversalContext?: TraversalContext$1;
}
interface ScopeCommitEvent$1 {
    readonly stage?: string;
    readonly stageId?: string;
    readonly runtimeStageId?: string;
    readonly updates?: Record<string, unknown>;
    readonly reads?: readonly string[];
}
/**
 * Minimal CombinedRecorder interface mirror — subset of footprintjs's
 * Flow + Scope recorder interfaces NodeView consumes. Implements both
 * channels in one object; consumer attaches via
 * `executor.attachFlowRecorder()` AND `executor.attachScopeRecorder()`
 * (or `executor.attachCombinedRecorder()` if available).
 */
interface MinimalNodeViewRecorder {
    readonly id: string;
    onStageExecuted?(event: FlowStageExecutedEvent$1): void;
    onError?(event: FlowErrorEvent$1): void;
    onStageRetry?(event: FlowStageRetryEvent$1): void;
    onRunStart?(event: FlowRunLifecycleEvent$1): void;
    onRunEnd?(event: FlowRunLifecycleEvent$1): void;
    onCommit?(event: ScopeCommitEvent$1): void;
}
/** One execution of a stage. A stage that runs N times in a loop
 *  produces N `ExecutionRecord` entries on the NodeView.executions[]. */
interface ExecutionRecord {
    /** `[subflowPath/]stageId#executionIndex` — universal join key. */
    readonly runtimeStageId: RuntimeStageId;
    /** Loop iteration (0-indexed). undefined when the engine didn't
     *  populate it (rare). */
    readonly iteration?: number;
    /** ms since executor start. */
    readonly startMs?: number;
    /** ms since executor start. */
    readonly endMs?: number;
    /** Set when `onError` fired for this execution. */
    readonly errorMessage?: string;
    /**
     * How many times this ONE execution was attempted — present only when a
     * declared `retry` policy actually fired (> 1). All attempts share this
     * record: the engine gives them one runtimeStageId and one commit bundle,
     * so retrying never multiplies `executions`.
     */
    readonly attempts?: number;
    /** Total attempts the stage's policy allows, as reported by the retry
     *  event. Present only alongside `attempts`. */
    readonly maxAttempts?: number;
}
/**
 * Per-stage summary. Joins STRUCTURAL data (from the structure
 * translator's TraceNode.data) with RUNTIME data (executions + commit
 * refs accumulated by this translator).
 */
interface NodeView {
    readonly stageId: StageId;
    readonly label: string;
    readonly type: "stage" | "decider" | "selector" | "fork" | "streaming" | "subflow" | "loop";
    readonly isDecider: boolean;
    readonly isFork: boolean;
    readonly isSubflow: boolean;
    readonly isStreaming: boolean;
    readonly isPausable: boolean;
    readonly description?: string;
    readonly icon?: string;
    readonly subflowId?: string;
    readonly branchIds?: readonly string[];
    readonly defaultBranch?: string;
    /** From the structure translator (loop-excluded, convergence-correct). */
    readonly prevIds: StageId[];
    readonly nextIds: StageId[];
    readonly executions: ExecutionRecord[];
    /** Derived: `executions.length > 0`. */
    readonly visitedInRun: boolean;
    /** Derived: `executions.length` (loop iteration count). */
    readonly executionCount: number;
    /** Derived: first execution `startMs`, or `null` if not yet executed. */
    readonly firstExecutedAt: number | null;
    /** Derived: last execution `endMs`, or `null`. */
    readonly lastExecutedAt: number | null;
    /** Derived: sum of `endMs - startMs` across executions. */
    readonly totalDurationMs: number;
    /** Derived: count of executions with an errorMessage. */
    readonly errorCount: number;
    /** Derived: count of executions that took more than one attempt. `0` for a
     *  stage that never retried — including one that DECLARED a policy and
     *  never needed it, which is the honest reading of "was this flaky?". */
    readonly retriedExecutionCount: number;
    /** Run-time stage ids of commits made by this stage. Look up the
     *  canonical CommitView via `commitFlow.byRuntimeStageId.get(id)`. */
    readonly commitRuntimeStageIds: RuntimeStageId[];
}
/** Index of NodeView keyed by both StageId and RuntimeStageId. The
 *  branded types prevent `byStageId.get(runtimeStageId)` silent-undefined. */
interface NodeViewIndex {
    readonly byStageId: ReadonlyMap<StageId, NodeView>;
    readonly byRuntimeStageId: ReadonlyMap<RuntimeStageId, NodeView>;
    /** All NodeViews — insertion order matches structure translator. */
    readonly all: readonly NodeView[];
}
interface NodeViewRecorderHandle {
    /** CombinedRecorder — attach via BOTH `executor.attachFlowRecorder()`
     *  AND `executor.attachScopeRecorder()` (footprintjs routes by
     *  method-shape detection). */
    recorder: MinimalNodeViewRecorder;
    /** Returns a defensive copy of the current index state. */
    getIndex(): NodeViewIndex;
    /** Pub-sub: returns unsubscribe. Designed for `useSyncExternalStore`. */
    subscribe(listener: () => void): () => void;
    /** Monotonic version counter — bumps on Flow/Scope event OR when
     *  the structure translator's version bumps (since NodeView projects
     *  from its data). */
    version(): number;
    /** Reset runtime state. Does NOT bump version or notify (consistent
     *  with traceStructureRecorder + createTraceRuntimeOverlay). */
    reset(): void;
}
interface CreateNodeViewRecorderOptions {
    /** Recorder id (surfaces in error attribution). */
    id?: string;
    /** REQUIRED — the structure translator handle. NodeView projects
     *  structural fields (`prevIds`, `nextIds`, `label`, etc.) from
     *  this on every `getIndex()` call. */
    structure: TraceStructureRecorderHandle;
}
declare function createNodeViewRecorder(options: CreateNodeViewRecorderOptions): NodeViewRecorderHandle;

/**
 * createCommitFlowRecorder — per-commit summary translator.
 *
 * Owns the canonical `CommitView[]` — captured from Scope `onCommit`
 * events as the chart runs. Each CommitView joins:
 *
 *   - **Identity**: runtimeStageId, stageId, commitIdx
 *   - **Structural**: prev/next stage ids (read from structure
 *     translator's `TraceNode.data.prevIds`/`nextIds`)
 *   - **Runtime prev/next**: derived via "most-recent-per-structural-
 *     prev" rule over the commitLog (loop-safe, convergence-aware)
 *   - **Data dependencies**: per-read-key lineage via
 *     `findLastWriter` over the commitLog
 *   - **Payload**: updates + reads
 *
 * Composition (panel guidance, L8.1 review)
 * ─────────────────────────────────────────
 *   Per Panel 1 rule "translators MUST subscribe to structure
 *   directly, never to peer translators", CommitFlow subscribes to
 *   the structure handle (NOT to NodeView). Linear dependency tree
 *   keeps notify cascades O(depth) instead of O(N²).
 *
 *   NodeView (L8.1) stores `commitRuntimeStageIds[]` — refs only —
 *   pointing into CommitFlow's `byRuntimeStageId`. The canonical
 *   payload lives HERE; NodeView is the per-stage projection.
 *
 * @example
 * ```tsx
 * const trace = useMemo(() => createTraceStructureRecorder(), []);
 * const commitFlow = useMemo(
 *   () => createCommitFlowRecorder({ structure: trace }),
 *   [trace],
 * );
 * useEffect(() => {
 *   executor.attachFlowRecorder(commitFlow.recorder);
 *   executor.attachScopeRecorder(commitFlow.recorder);
 * }, [commitFlow]);
 *
 * const index = useTranslator(commitFlow, () => commitFlow.getIndex());
 * const c = index.byRuntimeStageId.get(asRuntimeStageId('finalize-order#3'));
 * c.structuralPrevIds  // ['CheckInventory', 'RunFraudCheck']
 * c.runtimePrevIds     // ['check-inventory#1', 'run-fraud-check#2']
 * c.dataDependencies   // [{ key:'inStock', sourceRuntimeStageId:'check-inventory#1', sourceCommitIdx:1 }, ...]
 *
 * const lineage = backtraceDataFlow(index, asRuntimeStageId('finalize-order#3'));
 * // → ancestry chain of commits whose writes contributed to this commit's reads
 * ```
 */

interface TraversalContext {
    readonly runtimeStageId: string;
    readonly iteration?: number;
    readonly runId?: string;
}
interface FlowStageExecutedEvent {
    readonly stageName: string;
    readonly stageId?: string;
    readonly traversalContext: TraversalContext;
}
interface FlowErrorEvent {
    readonly stageName: string;
    readonly stageId?: string;
    readonly message?: string;
    readonly traversalContext?: TraversalContext;
}
/** One FAILED attempt at a stage with a declared `retry` policy
 *  (footprintjs >= 9.15.0). Fires DURING the stage; only the surviving
 *  attempt ever commits, which is why this fact has to come from the event
 *  stream rather than from the commit itself. */
interface FlowStageRetryEvent {
    readonly stageName: string;
    readonly stageId?: string;
    /** Which attempt just FAILED, 1-based. */
    readonly attempt?: number;
    readonly maxAttempts?: number;
    readonly traversalContext?: TraversalContext;
}
interface FlowRunLifecycleEvent {
    readonly traversalContext?: TraversalContext;
}
interface ScopeReadEvent {
    readonly stage?: string;
    readonly stageId?: string;
    readonly runtimeStageId?: string;
    readonly key?: string;
}
interface ScopeCommitEvent {
    readonly stage?: string;
    readonly stageId?: string;
    readonly runtimeStageId?: string;
    readonly updates?: Record<string, unknown>;
    readonly reads?: readonly string[];
}
/**
 * Minimal CombinedRecorder mirror — subset of footprintjs's Flow +
 * Scope channels CommitFlow consumes.
 */
interface MinimalCommitFlowRecorder {
    readonly id: string;
    onStageExecuted?(event: FlowStageExecutedEvent): void;
    onError?(event: FlowErrorEvent): void;
    onStageRetry?(event: FlowStageRetryEvent): void;
    onRunStart?(event: FlowRunLifecycleEvent): void;
    onRunEnd?(event: FlowRunLifecycleEvent): void;
    onRead?(event: ScopeReadEvent): void;
    onCommit?(event: ScopeCommitEvent): void;
}
/**
 * One data-dependency edge — a read key in this commit AND the commit
 * whose `updates` last wrote that key before this commit's index.
 *
 * `sourceRuntimeStageId` and `sourceCommitIdx` are BOTH `null` when no
 * prior commit wrote the key (panel-flagged: NEVER `undefined` — forces
 * consumers to handle absence as load-bearing).
 */
interface DataDependency {
    readonly key: string;
    readonly sourceRuntimeStageId: RuntimeStageId | null;
    readonly sourceCommitIdx: number | null;
}
/**
 * Per-commit summary. Joins structural data (from the structure
 * translator) with runtime data (commitLog timeline) into a single
 * consumer-friendly shape.
 *
 * Three "prev" views — pick the right one for your UI:
 * ─────────────────────────────────────────────────────
 *   | Field                | Answers                                    |
 *   |----------------------|--------------------------------------------|
 *   | `structuralPrevIds`  | "what COULD flow in" (chart shape)        |
 *   | `runtimePrevIds`     | "what DID flow in by stage" (execution    |
 *   |                      | timeline; loop-aware)                      |
 *   | `dataDependencies`   | "which commit wrote the bytes I read"     |
 *   |                      | (causal data lineage; per-key)             |
 *
 * The three answers usually align on simple charts (linear; single
 * fork-merge). They DIVERGE in interesting ways under loops (runtime
 * differs by iteration; data-deps may skip uninvolved stages) and
 * conditional branches (structural sees all options; runtime + data
 * see only the chosen path).
 */
interface CommitView {
    readonly runtimeStageId: RuntimeStageId;
    readonly stageId: StageId;
    /** Position in the chronologically-ordered commitLog. */
    readonly commitIdx: number;
    /** Stage ids that lead into this stage in the chart (loop-excluded). */
    readonly structuralPrevIds: StageId[];
    readonly structuralNextIds: StageId[];
    /**
     * For each structural prev stage that EXECUTED IN THIS RUN before
     * this commit, the most-recent runtimeStageId of that prev's commit.
     * Loop-safe: in iteration 2, runtime prev points at iteration 2's
     * commits (not iteration 1's).
     */
    readonly runtimePrevIds: RuntimeStageId[];
    /**
     * For each structural next stage that EXECUTED IN THIS RUN after
     * this commit, the soonest runtimeStageId. Symmetric to prev.
     */
    readonly runtimeNextIds: RuntimeStageId[];
    /**
     * One entry per key in `reads`. `sourceRuntimeStageId` points at the
     * commit whose `updates` last set this key BEFORE this commit's
     * index; `null` when no prior writer (typically: read of a key
     * declared as default but never written by another stage).
     */
    readonly dataDependencies: DataDependency[];
    /**
     * The commit's writes. **Shallow-copied** at intake — top-level
     * keys are owned, but nested object values are SHARED references
     * to whatever the upstream `onCommit` payload carried. Consumers
     * MUST NOT mutate nested values; doing so corrupts the recorder's
     * internal state and propagates through `findLastWriter` to every
     * subsequent `getIndex()` call.
     */
    readonly updates: Record<string, unknown>;
    readonly reads: string[];
    /**
     * How many attempts the stage made before THIS commit landed — present
     * only when a declared `retry` policy fired (> 1). The discarded attempts
     * committed nothing, so this is the one place the commit chain can say
     * "these values are attempt 3's, not attempt 1's".
     */
    readonly attempts?: number;
}
/** Indexed CommitView access. */
interface CommitFlowIndex {
    /** Ordered list — index === commitIdx. */
    readonly commits: readonly CommitView[];
    /** Lookup by runtimeStageId (the universal join key). */
    readonly byRuntimeStageId: ReadonlyMap<RuntimeStageId, CommitView>;
    /**
     * Data-dependency edges — `from` and `to` are commitIdx ints; `key`
     * is the data key that flowed from one commit to the other. Same
     * data as walking each CommitView's `dataDependencies` — exposed as
     * a flat edge list for graph algorithms and rendering.
     *
     * **When to use which**:
     *   - `view.dataDependencies` — render ONE commit's inputs in a
     *     detail panel (e.g., `<CommitInspector>`).
     *   - `index.dataEdges` — draw the FULL data-flow DAG (React Flow
     *     edges, GraphViz, dependency matrix, etc.). One pass over the
     *     flat list = the whole graph.
     *
     * Edges are `Object.freeze()`d at construction — type `readonly` is
     * compile-time; freeze is the runtime enforcement.
     */
    readonly dataEdges: readonly {
        readonly from: number;
        readonly to: number;
        readonly key: string;
    }[];
}
interface CommitFlowRecorderHandle {
    /** CombinedRecorder — attach via BOTH `executor.attachFlowRecorder()`
     *  AND `executor.attachScopeRecorder()`. */
    recorder: MinimalCommitFlowRecorder;
    /** Returns a defensive copy of the current index state. */
    getIndex(): CommitFlowIndex;
    /** Pub-sub: returns unsubscribe. */
    subscribe(listener: () => void): () => void;
    /** Monotonic version counter — bumps on Scope/Flow event OR when
     *  the structure translator's version bumps. */
    version(): number;
    /** Reset runtime state. Does NOT bump version or notify (consistent
     *  with other translators' reset contracts). */
    reset(): void;
}
interface CreateCommitFlowRecorderOptions {
    /** Recorder id (surfaces in error attribution). */
    id?: string;
    /** REQUIRED — structure translator handle for structural prev/next
     *  projection. CommitFlow subscribes to its version. */
    structure: TraceStructureRecorderHandle;
}
declare function createCommitFlowRecorder(options: CreateCommitFlowRecorderOptions): CommitFlowRecorderHandle;
/**
 * Walk data-dependency edges BACKWARD from a starting commit. Returns
 * the lineage chain — every ancestor commit whose writes transitively
 * contributed to the starting commit's reads.
 *
 * BFS order, commitIdx-ascending (oldest first). Includes the starting
 * commit at the END of the returned array.
 *
 * Cycle defense: visited set + recursion cap at `index.commits.length`
 * (per L8 panel must-fix — defends against future malformed graphs).
 *
 * @example
 * ```ts
 * const lineage = backtraceDataFlow(commitIndex, asRuntimeStageId('finalize-order#3'));
 * // → [load-order#0, check-inventory#1, run-fraud-check#2, finalize-order#3]
 * //   (the commits whose updates fed FinalizeOrder's reads)
 * ```
 */
declare function backtraceDataFlow(index: CommitFlowIndex, startRuntimeStageId: RuntimeStageId): CommitView[];

/**
 * `createTraceBundle` — one factory wires every shipped translator
 * + provides a single `attachTo(executor)` call that registers all
 * runtime recorders.
 *
 * Bundle shape (as of L8.2)
 * ─────────────────────────
 *   - `structure` — build-time `TraceGraph` (StructureRecorder).
 *   - `runtimeOverlay` — execution overlay for time-travel (FlowRecorder).
 *   - `nodeView` — per-stage summary index, CombinedRecorder
 *     (FlowRecorder + ScopeRecorder).
 *   - `commitFlow` — per-commit summary + data-lineage,
 *     CombinedRecorder (ScopeRecorder + FlowRecorder).
 *
 * Goal: collapse the 5-line "create + attach + subscribe" boilerplate
 * into one call for the common case. Consumers that want à-la-carte
 * setup can still construct each translator directly (the underlying
 * factories are unchanged).
 *
 * Independence: each translator subscribes ONLY to `structure` (per
 * L8.1 Panel 1 rule — translators must never subscribe to peers).
 * Linear dependency tree keeps notify cascades O(depth), not O(N²).
 *
 * @example
 * ```tsx
 * import { createTraceBundle } from 'footprint-explainable-ui/flowchart';
 *
 * function MyTraceUI() {
 *   const bundle = useMemo(() => createTraceBundle(), []);
 *   useEffect(() => {
 *     const chart = flowChart('seed', fn, 'seed', {
 *       structureRecorders: [bundle.structure.recorder],
 *     }).addFunction('a', fnA, 'a').build();
 *     const executor = new FlowChartExecutor(chart);
 *     bundle.attachTo(executor);
 *     executor.run({ input });
 *   }, [bundle]);
 *
 *   return <TracedFlow recorder={bundle.structure} overlay={bundle.runtimeOverlay} />;
 * }
 * ```
 *
 * **Recorder-attach lifecycle**: `attachTo(executor)` attaches THREE
 * FlowRecorders (`runtimeOverlay`, `nodeView`, `commitFlow`) and TWO
 * ScopeRecorders (`nodeView`, `commitFlow`). Each translator has a
 * distinct `recorder.id`, so footprintjs's id-idempotency rule
 * doesn't collide. The build-time `structure.recorder` is NOT
 * auto-attached — it must be passed to `flowChart(..., {
 * structureRecorders: [...] })` because builder recorders register
 * BEFORE `executor` exists. Consumers wire that one explicitly (see
 * example above). This matches footprintjs's two-phase recorder
 * model (build vs runtime).
 */

/** Minimal executor surface — mirrors the bits of footprintjs's
 *  `FlowChartExecutor` the bundle calls into. Local to keep
 *  explainable-ui dep-free from footprintjs. */
interface MinimalExecutor {
    attachFlowRecorder(recorder: unknown): void;
    attachScopeRecorder?(recorder: unknown): void;
}
interface TraceBundle {
    structure: TraceStructureRecorderHandle;
    runtimeOverlay: TraceRuntimeOverlayHandle;
    /** L8.1 — per-stage summary translator. Reads `prevIds`/`nextIds`
     *  from `structure` (no duplication), accumulates `executions[]`
     *  + commit refs from Flow + Scope events. */
    nodeView: NodeViewRecorderHandle;
    /** L8.2 — per-commit summary translator. Owns canonical CommitView[].
     *  Derives structural prev/next from `structure`, runtimePrev/Next
     *  from "most-recent-per-prev" over commitLog, and dataDependencies
     *  via findLastWriter per read key. */
    commitFlow: CommitFlowRecorderHandle;
    /**
     * Attach RUNTIME recorders (FlowRecorder, ScopeRecorder) to a
     * footprintjs executor. The build-time `structure.recorder` is NOT
     * covered — pass it to `flowChart(..., { structureRecorders: [...] })`
     * at construction time instead (see file header example).
     */
    attachTo(executor: MinimalExecutor): void;
}
interface CreateTraceBundleOptions {
    /** Per-translator options. All optional. */
    structure?: CreateTraceStructureRecorderOptions;
    runtimeOverlay?: CreateTraceRuntimeOverlayOptions;
    nodeView?: Omit<CreateNodeViewRecorderOptions, "structure">;
    commitFlow?: Omit<CreateCommitFlowRecorderOptions, "structure">;
}
declare function createTraceBundle(options?: CreateTraceBundleOptions): TraceBundle;

/**
 * `useTranslator(handle, getSnapshot)` — React adapter for any translator
 * exposing the standard `subscribe()` + `version()` shape.
 *
 * Wraps `useSyncExternalStore` so consumers don't repeat the boilerplate
 * for every translator. The `version` is the snapshot identity — when it
 * changes, React re-renders; `getSnapshot` then returns the consumer-
 * chosen view (full graph, slice, etc.).
 *
 * @example
 * ```tsx
 * const trace = useMemo(() => createTraceStructureRecorder(), []);
 * const graph = useTranslator(trace, () => trace.getGraph());
 * return <TraceFlow graph={graph} />;
 * ```
 *
 * **Why a hook (vs each component wiring `useSyncExternalStore` itself)**:
 * three reasons. (1) Reduces 4 lines of `useSyncExternalStore + useMemo`
 * boilerplate to one line. (2) Standardises the snapshot-identity
 * convention (version int) — consumers can't accidentally pass a getter
 * whose return identity changes every call (which would re-render
 * forever). (3) Stable subscribe/getVersion refs via memoization on the
 * handle identity — no re-subscribe on parent re-renders.
 */
interface TranslatorHandleLike {
    subscribe(listener: () => void): () => void;
    version(): number;
}
/**
 * Subscribe to a translator + return a typed snapshot computed by the
 * caller. The snapshot recomputes whenever `version()` changes.
 *
 * `getSnapshot` is called inside a `useMemo` keyed on the version
 * integer — so consumers can return fresh objects from `getSnapshot`
 * (e.g., `handle.getGraph()` returns a defensive copy) without
 * triggering infinite re-renders.
 */
declare function useTranslator<T>(handle: TranslatorHandleLike, getSnapshot: () => T): T;

/**
 * Graph traversal helpers — pure functions over a `NodeViewIndex`.
 *
 * Bi-directional structural walks (`walkForward` / `walkBackward`) plus
 * convenience wrappers (`backtraceStructural` / `forwardtraceStructural`).
 *
 * Cycle defense (panel L8 must-fix)
 * ──────────────────────────────────
 *   Every traversal carries a `visited: Set<StageId>` and caps recursion
 *   at `index.all.length` (the total node count). Defends against:
 *     - Future bugs where a malformed graph includes a non-loop cycle
 *     - Manual edge injection bypassing the structure-recorder fix
 *     - Duplicate edges that survive dedupe due to source/target
 *       collisions
 *   Loop back-edges (`data.kind === 'loop'`) already excluded at the
 *   structure-recorder layer (invariant I1), so they never enter
 *   `prevIds`/`nextIds` — no extra filtering here.
 *
 * BFS order
 * ─────────
 *   Walks return nodes in BFS order — root first, then immediate
 *   neighbors, then their neighbors. Matches breadcrumb-friendly
 *   "closest-first" display order.
 *
 * Always-arrays returns
 * ─────────────────────
 *   All helpers return `NodeView[]`. Empty array (NOT null/undefined)
 *   means "no path" or "node not found". Consumers `.map()` /
 *   `.length`-check without null-handling boilerplate.
 */

interface WalkOptions {
    /** Hard cap on hops. Default: `index.all.length` (one full traversal). */
    maxDepth?: number;
    /** When true, only return nodes that have `visitedInRun === true`.
     *  Useful for "in THIS run, what fed me?" queries (runtime-aware walk). */
    onlyVisited?: boolean;
    /** When true, INCLUDE the start node in the returned array. Default:
     *  false (caller already has the start node; the walk returns its
     *  ancestors/descendants). */
    includeStart?: boolean;
}
/**
 * Walk forward (`nextIds`) from `startId`. BFS order. Cycle-safe.
 * Returns `[]` if `startId` is unknown.
 *
 * Convergence semantics: a node reachable via multiple paths appears
 * ONCE in the result (visited-set dedupes).
 */
declare function walkForward(index: NodeViewIndex, startId: StageId, options?: WalkOptions): NodeView[];
/**
 * Walk backward (`prevIds`) from `startId`. BFS order. Cycle-safe.
 * Returns `[]` if `startId` is unknown.
 *
 * Convergence semantics: a fork-join's `walkBackward` returns BOTH
 * branch parents (and their ancestors), each once.
 */
declare function walkBackward(index: NodeViewIndex, startId: StageId, options?: WalkOptions): NodeView[];
/**
 * Backtrace from `stageId` to a structural root (no prev) OR a split
 * point (multiple prevs). Returns the chain from `stageId` BACK to
 * the root, root-first. Includes `stageId` at the END.
 *
 * Defines "split" as `prevIds.length > 1 OR prevIds.length === 0`
 * (per L8 panel recommendation) — stops at convergence points AND at
 * the seed. Useful for breadcrumb display where "innermost serial
 * run" is the meaningful path.
 */
declare function backtraceStructural(index: NodeViewIndex, stageId: StageId, options?: Pick<WalkOptions, "maxDepth" | "onlyVisited">): NodeView[];
/**
 * Forward-trace from `stageId` to a structural leaf (no next) OR a
 * fork point (multiple nexts). Returns the chain from `stageId`
 * FORWARD to the leaf/fork, with `stageId` at the START.
 */
declare function forwardtraceStructural(index: NodeViewIndex, stageId: StageId, options?: Pick<WalkOptions, "maxDepth" | "onlyVisited">): NodeView[];

interface NodeInspectorProps extends BaseComponentProps {
    /** The NodeView index (from `nodeView.getIndex()` or `useTranslator`).
     *
     *  **Pure data prop** (NOT the recorder handle) — by design. Lets
     *  consumers wrap in `useTranslator(nodeView, () => nodeView.getIndex())`
     *  at the parent, or pass a static index from tests / Storybook /
     *  SSR. Mirrors `<CommitInspector index={...}>` for consistency. */
    index: NodeViewIndex;
    /** Which stage to inspect. When `null`, renders the placeholder. */
    selectedId: StageId | null;
    /** Click handler — receives a stageId for breadcrumb navigation. */
    onNavigate?: (stageId: StageId) => void;
    /** When true, the prev/next chains include only `visitedInRun` nodes
     *  (runtime-filtered view). */
    onlyVisited?: boolean;
}
declare function NodeInspector({ index, selectedId, onNavigate, onlyVisited, className, style, }: NodeInspectorProps): react.JSX.Element;

interface CommitInspectorProps extends BaseComponentProps {
    /** The CommitFlow index (from `commitFlow.getIndex()` or `useTranslator`).
     *
     *  **Pure data prop** (NOT the recorder handle) — by design. Lets
     *  consumers wrap in `useTranslator(commitFlow, () => commitFlow.getIndex())`
     *  at the parent, or pass a static index from tests / Storybook /
     *  SSR. Mirrors `<NodeInspector index={...}>` for consistency. */
    index: CommitFlowIndex;
    /** Which commit to inspect (by runtimeStageId). null → placeholder. */
    selectedRuntimeStageId: RuntimeStageId | null;
    /** Click handler — receives a runtimeStageId for time-travel
     *  navigation. Used by all clickable references (runtime prev/next,
     *  data-dep sources, lineage chain). */
    onNavigate?: (runtimeStageId: RuntimeStageId) => void;
}
declare function CommitInspector({ index, selectedRuntimeStageId, onNavigate, className, style, }: CommitInspectorProps): react.JSX.Element;

/**
 * Series-parallel chain tree builders — pure functions over `TraceGraph`
 * (structural) + `CommitFlowIndex` (runtime).
 *
 * When to reach for this vs. flat commitLog
 * ─────────────────────────────────────────
 *   Use `commitLog` when you want chronological replay / slider scrubbing
 *   ("what happened in order"). Use the chain tree when you want to
 *   render parallel structure visually or answer "which branch ran?"
 *   questions — flat `commitLog[idx-1]` loses the fork shape.
 *
 *   Pairs with `<CommitInspector>` for git-log-style master/detail —
 *   `<CommitChainView>` picks, `<CommitInspector>` inspects.
 *   Complements the per-stage view from `createNodeViewRecorder`.
 *
 * Why a chain tree
 * ────────────────
 *   Footprintjs charts are **series-parallel DAGs by construction** —
 *   the builder primitives compose serially (`addFunction`) or in
 *   parallel (`addListOfFunction` / `addDeciderFunction`). Series-
 *   parallel DAGs are provably representable as expression trees,
 *   so we can decompose any footprintjs chart into a nested
 *   `(serial | parallel | leaf)` shape that renders cleanly as
 *   swim lanes.
 *
 * Two builders, one tree shape
 * ────────────────────────────
 *   - `structureAsChainTree(graph, options?)` — STRUCTURAL view.
 *     No commitLog. Decomposes the chart shape into S-P primitives.
 *     Renders the full chart (all branches of a decider, etc.) even
 *     before running.
 *
 *   - `buildCommitChainTree(graph, commitFlow, options?)` — RUNTIME
 *     view. Each leaf carries the commits[] that fired for that stage
 *     in this run. Loops produce a leaf with N commits. Branches that
 *     never executed in this run appear as empty `commits[]` leaves
 *     (consumer can filter).
 *
 * Algorithm scope (correctness contract)
 * ──────────────────────────────────────
 *   These builders are tuned for **series-parallel charts** — every
 *   fork in footprintjs's builder has a matching merge point. For
 *   non-S-P or malformed graphs the tree is still finite and stable
 *   (cycle defense guarantees termination), but the shape may not
 *   reflect a clean S-P decomposition.
 *
 *   - Forks with **no common descendant** drop the outer-walk tail at
 *     the fork node. Real footprintjs charts always re-merge.
 *   - Edges with `data.kind === undefined` are treated as `'next'`.
 *     Multiple linear-next edges from a single source follow only the
 *     first (deterministic by insertion order); a dev-mode warning
 *     fires when this is observed (`isDevMode()` from footprintjs).
 *
 * Cycle defense (L8 panel must-fix carried forward)
 * ─────────────────────────────────────────────────
 *   Every recursive walk carries a `visited: Set<StageId>` to defend
 *   against malformed graphs (manual edge injection, future builder
 *   bugs). Loop edges (`kind === 'loop'`) are excluded at the
 *   structure-recorder layer per invariant I1, so they never enter
 *   prev/next — no extra filtering needed here. Convergence detection
 *   uses BFS bounded by `graph.nodes.length`.
 *
 * @example
 * ```ts
 * const trace = createTraceStructureRecorder();
 * // ... build a fork chart ...
 *
 * const sChain = structureAsChainTree(trace.getGraph());
 * // → { kind: 'serial', items: [
 * //     { kind: 'leaf', stageId: 'LoadOrder' },
 * //     { kind: 'parallel', branches: [
 * //       { kind: 'leaf', stageId: 'CheckInventory' },
 * //       { kind: 'leaf', stageId: 'RunFraudCheck' },
 * //     ]},
 * //     { kind: 'leaf', stageId: 'FinalizeOrder' },
 * //   ]}
 *
 * const commitFlow = createCommitFlowRecorder({ structure: trace });
 * // ... run chart ...
 * const cChain = buildCommitChainTree(trace.getGraph(), commitFlow.getIndex());
 * // → same shape, but each leaf carries `commits: CommitView[]`
 * ```
 */

/** Structural chain tree leaf (no commits). */
interface StructureChainLeaf {
    readonly kind: "leaf";
    readonly stageId: StageId;
}
/** Structural chain tree node — recursive S-P composition over stage ids. */
type StructureChain = StructureChainLeaf | {
    readonly kind: "serial";
    readonly items: readonly StructureChain[];
} | {
    readonly kind: "parallel";
    readonly branches: readonly StructureChain[];
};
/** Commit chain tree leaf — carries all commits for the stage (loop-aware). */
interface CommitChainLeaf {
    readonly kind: "leaf";
    readonly stageId: StageId;
    /** All commits that fired for this stage in this run, in commitIdx
     *  ascending order. Loop iteration N has commits[N]. Empty array
     *  when the stage never executed in this run.
     *
     *  **Ownership**: references are shared with
     *  `CommitFlowIndex.commits` (no deep copy). The same shallow-copy /
     *  nested-shared-value contract documented on `CommitView.updates`
     *  applies. Do not mutate. */
    readonly commits: readonly CommitView[];
}
/** Commit chain tree — recursive S-P composition with commit leaves. */
type CommitChain = CommitChainLeaf | {
    readonly kind: "serial";
    readonly items: readonly CommitChain[];
} | {
    readonly kind: "parallel";
    readonly branches: readonly CommitChain[];
};
interface ChainTreeOptions {
    /** Stage id to start the walk from. Defaults to the chart's seed
     *  (first node with no incoming non-loop edge). */
    rootStageId?: StageId;
}
/**
 * Build a structural chain tree for a chart. Pure function over
 * `TraceGraph` — no runtime data required. Useful for rendering the
 * chart shape before any execution (static documentation, etc.).
 */
declare function structureAsChainTree(graph: TraceGraph, options?: ChainTreeOptions): StructureChain | null;
/**
 * Build a commit-decorated chain tree. Same S-P shape as
 * `structureAsChainTree`, but each leaf carries the commits[] that
 * fired for that stage in this run (in commitIdx ascending order).
 *
 * Loop semantics: a stage that ran N times has a leaf with
 * `commits.length === N`. The consumer's renderer decides whether to
 * display them as a single "ran 3×" badge or unroll into N visible
 * boxes — both views are supported by the same data.
 *
 * Branches that never executed in this run appear with empty
 * `commits[]`. Consumers wanting "runtime-only" view can filter them
 * out.
 */
declare function buildCommitChainTree(graph: TraceGraph, commitFlow: CommitFlowIndex, options?: ChainTreeOptions): CommitChain | null;

interface CommitChainViewProps extends BaseComponentProps {
    /** The chain tree. Accepts BOTH `CommitChain` (from
     *  `buildCommitChainTree`) and `StructureChain` (from
     *  `structureAsChainTree` — pre-execution view). null → placeholder. */
    chain: CommitChain | StructureChain | null;
    /** Highlighted commit (by runtimeStageId). Only meaningful for
     *  `CommitChain` input (StructureChain has no commits to select). */
    selectedRuntimeStageId?: RuntimeStageId | null;
    /** Fires when a commit box is clicked — pass to `<CommitInspector>`
     *  for master/detail wiring. Not fired for "not executed" leaves. */
    onSelectCommit?: (runtimeStageId: RuntimeStageId) => void;
    /** Optional label resolver — default uses the bare stageId. Consumers
     *  can map id → friendly name (e.g., from a NodeViewIndex). */
    resolveLabel?: (stageId: StageId) => string;
    /** Time-travel cursor: commits with `commitIdx > revealedThroughCommitIdx`
     *  render dimmed (still visible — keeps layout stable). Pairs with
     *  `<RunSlider>` in the ONE-CURSOR model.
     *
     *  Semantics:
     *  - `null` (default) — reveal ALL commits (no time-travel applied).
     *  - `N >= 0` — reveal commits 0..N inclusive; dim commits with
     *    `commitIdx > N`.
     *  - `N < 0` (e.g., `-1`) — reveal NONE; all commits dim. Use this
     *    sentinel for "cursor is stale / unresolved" so the chain doesn't
     *    accidentally fall back to fully-revealed when the consumer wants
     *    no-reveal. */
    revealedThroughCommitIdx?: number | null;
}
declare function CommitChainView({ chain, selectedRuntimeStageId, onSelectCommit, resolveLabel, revealedThroughCommitIdx, className, style, }: CommitChainViewProps): react.JSX.Element;

/**
 * Slot prop bags — slots receive PURE DATA (chain/index), NOT the
 * bundle. Mirrors the sibling-inspector convention so slot bodies are
 * usable from tests / Storybook / SSR and avoid re-subscribing to
 * translators. Each callback is wired by the shell to the shared
 * selection cursor.
 */
interface ChainSlotProps {
    /** Live chain tree, derived from the bundle. `null` before any
     *  commits arrive. */
    chain: CommitChain | null;
    /** Currently selected commit (shared cursor). */
    selectedRuntimeStageId: RuntimeStageId | null;
    /** Wire to the shared selection cursor. */
    onSelectCommit: (rsid: RuntimeStageId) => void;
    /** Time-travel reveal cursor (derived from selectedRuntimeStageId
     *  via ONE-CURSOR model). Commits with commitIdx > this value
     *  render dimmed. `null` reveals all, `-1` reveals none, `N >= 0`
     *  reveals up to commit N. **Optional in custom slots** — slot
     *  authors that don't implement time-travel dimming can ignore it
     *  (matches the standalone `<CommitChainView>` prop optionality). */
    revealedThroughCommitIdx?: number | null;
}
interface CommitInspectorSlotProps {
    /** Live commitFlow index. */
    index: CommitFlowIndex;
    /** Currently selected commit (shared cursor). */
    selectedRuntimeStageId: RuntimeStageId | null;
    /** Wire to the shared selection cursor (e.g., for clickable
     *  data-dep / lineage breadcrumbs). */
    onNavigate: (rsid: RuntimeStageId) => void;
}
interface NodeInspectorSlotProps {
    /** Live nodeView index. */
    index: NodeViewIndex;
    /** StageId derived from `selectedRuntimeStageId`. */
    selectedStageId: StageId | null;
    /** Wire to the shared selection cursor (e.g., for prev/next chain
     *  breadcrumbs). Resolves the stage to its first commit. */
    onNavigate: (stageId: StageId) => void;
}
interface SliderSlotProps {
    /** Live commitFlow index. */
    index: CommitFlowIndex;
    /** Currently selected commit — same cursor as the chain selection
     *  per the ONE-CURSOR model. */
    cursorRuntimeStageId: RuntimeStageId | null;
    /** Wire to the shared selection cursor. */
    onCursorChange: (rsid: RuntimeStageId | null) => void;
}
interface TraceExplorerSlots {
    /** Override the chain (master) pane. Use to swap the swim-lane
     *  renderer for a timeline/Gantt/custom layout while keeping the
     *  same selection contract. */
    chain?: React.ComponentType<ChainSlotProps>;
    /** Override the commit (detail) pane. Use to add custom commit-
     *  detail formatting (e.g., domain-specific updates rendering). */
    commitInspector?: React.ComponentType<CommitInspectorSlotProps>;
    /** Override the node (stage-summary) pane. Use to surface per-stage
     *  custom KPIs / annotations alongside the default execution data. */
    nodeInspector?: React.ComponentType<NodeInspectorSlotProps>;
    /** Override the slider (top time-travel bar). Pass `null` to HIDE
     *  the slider entirely (e.g., for static post-run views with no
     *  scrub affordance). */
    slider?: React.ComponentType<SliderSlotProps> | null;
}
interface TraceExplorerShellProps extends BaseComponentProps {
    /** The translator bundle from `createTraceBundle()`. MUST have had
     *  `bundle.attachTo(executor)` called before any commits arrive,
     *  otherwise every pane shows its placeholder. */
    bundle: TraceBundle;
    /** Controlled selection (omit for uncontrolled). `null` clears. */
    selectedRuntimeStageId?: RuntimeStageId | null;
    /** Fires on selection changes. In controlled mode, required for
     *  selection to take effect. In uncontrolled mode, fires as an
     *  observation hook (logging/analytics) — the shell still owns the
     *  state.
     *
     *  Memoize via `useCallback` to avoid downstream re-renders. */
    onSelectionChange?: (rsid: RuntimeStageId | null) => void;
    /** Optional slot overrides. Should be stable across renders
     *  (define at module scope or `useMemo`). */
    slots?: TraceExplorerSlots;
}
declare function TraceExplorerShell({ bundle, selectedRuntimeStageId: controlledSel, onSelectionChange, slots, className, style, }: TraceExplorerShellProps): react.JSX.Element;

interface RunSliderProps extends BaseComponentProps {
    /** Live commit flow index (pure data prop — pass via
     *  `useTranslator(commitFlow, () => commitFlow.getIndex())`).
     *  Source: `createCommitFlowRecorder` — see `<CommitInspector>` for
     *  the canonical consumer pattern. */
    index: CommitFlowIndex;
    /** The shared time cursor. `null` = no commit yet selected (slider
     *  sits at value 0). */
    cursorRuntimeStageId: RuntimeStageId | null;
    /** Fires when the slider moves. */
    onCursorChange: (rsid: RuntimeStageId | null) => void;
    /** Optional label callback. Default renders `"#commitIdx · stageId"`.
     *  Receives the full resolved `commit` + the `index` for richer
     *  labels (step name, duration from a sibling translator, etc.). */
    renderLabel?: (info: {
        commitIdx: number;
        total: number;
        runtimeStageId: RuntimeStageId | null;
        /** Resolved commit at the cursor, or `null` when index is empty. */
        commit: CommitView | null;
        /** Full index — for cross-lookups (e.g., finding the previous
         *  commit's stage label). */
        index: CommitFlowIndex;
    }) => React.ReactNode;
}
declare function RunSlider({ index, cursorRuntimeStageId, onCursorChange, renderLabel, className, style, }: RunSliderProps): react.JSX.Element;

export { type BreadcrumbEntry$1 as BreadcrumbEntry, type ChainSlotProps, type ChainTreeOptions, type CollapsedTraceGraph, type CommitChain, type CommitChainLeaf, CommitChainView, type CommitChainViewProps, type CommitFlowIndex, type CommitFlowRecorderHandle, CommitInspector, type CommitInspectorProps, type CommitInspectorSlotProps, type CommitView, type CreateCommitFlowRecorderOptions, type CreateNodeViewRecorderOptions, type CreateTraceBundleOptions, CreateTraceRuntimeOverlayOptions, CreateTraceStructureRecorderOptions, type DagreTraceLayoutOptions, type DataDependency, type EdgeMinLenResolver, type EdgeWeightResolver, type ExecutionRecord, GROUP_CONTAINER_NODE_TYPE, GroupContainerNode, type GroupContainerNodeData, type GroupLayoutOptions, LoopBackEdge, MAIN_CHART_BOX_ID, type MainChartBoxOptions, type MinimalCommitFlowRecorder, type MinimalNodeViewRecorder, type NodeFootprint, NodeInspector, type NodeInspectorProps, type NodeInspectorSlotProps, type NodeSizeResolver, type NodeView, type NodeViewIndex, type NodeViewRecorderHandle, RunSlider, type RunSliderProps, RuntimeOverlay, RuntimeStageId, type SiblingOrderResolver, type SliderSlotProps, SlotPillNode, type SlotPillNodeData, SmartStepEdge, type SnapLinearSuccessorsOptions, StageId, StageNode, type StageNodeData, type StructureChain, type StructureChainLeaf, SubflowBreadcrumb, type SubflowBreadcrumbProps, type SubflowNavigation, TimeTravelDebugger, type TimeTravelDebuggerProps, type TraceBundle, TraceEdgeData, TraceExplorerShell, type TraceExplorerShellProps, type TraceExplorerSlots, TraceFlowLayout, TraceGraph, type TraceGroupLayoutOptions, TraceNode$1 as TraceNode, TraceRuntimeOverlayHandle, TraceStructureRecorderHandle, type TranslatorHandleLike, type WalkOptions, applyGroupLayout, backtraceDataFlow, backtraceStructural, buildCommitChainTree, buildSubflowBreadcrumb, collapseTraceGraph, createCommitFlowRecorder, createDagreTraceLayout, createGroupedLayout, createMainChartBoxLayout, createNodeViewRecorder, createSnappedDagreLayout, createTraceBundle, createTraceGroupLayout, dagreTraceLayout, filterGraphForDrill, forwardtraceStructural, snapLinearSuccessors, structureAsChainTree, traceGroupLayout, useSubflowNavigation, useTranslator, walkBackward, walkForward, wrapInMainChartBox };
