import { B as BaseComponentProps, S as StageSnapshot, I as ThemeModeProps, T as TraceGraph, R as RuntimeOverlay, N as NarrativeEntry, J as ThemeMode, w as TracedFlowColors } from './graphFromStructure-yuEBX-H-.cjs';
export { O as OverlayFromSnapshotOptions, j as RuntimeExecutionStep, l as SerializedStructureNode, K as Size, m as SnapshotWithCommitLog, n as SubflowTree, o as SubflowTreeEntry, p as SubflowTreeProps, F as graphFromStructure, G as overlayFromSnapshot, L as themeModeVars } from './graphFromStructure-yuEBX-H-.cjs';
import * as react from 'react';
import { ReactNode } from 'react';
import { ValueBasis, ReadsCoverage } from 'foottrace';
import '@xyflow/react';

/** Default theme tokens — consumers override via CSS variables or ThemeProvider. */
interface ThemeTokens {
    colors?: {
        primary?: string;
        success?: string;
        error?: string;
        warning?: string;
        /** Semantic node-state roles (a runtime overlay maps onto these): the scrub
         *  cursor, the visited path, and a group's lead node. */
        nodeCursor?: string;
        nodeVisited?: string;
        nodeMain?: string;
        /** Interactive accent — active tab, selected row rule, focused chip.
         *  Defaults to `primary` when omitted, so setting one colour is enough. */
        accent?: string;
        /** The translucent wash BEHIND an accented row (selected trace step). */
        accentBg?: string;
        /** Panel body surface — the plain background a panel paints itself with. */
        bg?: string;
        /** Raised surface (cards, popovers) sitting ON the body surface. */
        bgElevated?: string;
        /** Tracing-rail chrome — the "you are walking a value's causes" colour.
         *  One token drives the badge, rail border, stops and walk buttons. */
        tracing?: string;
        /** CATEGORICAL chip palette (four hues) for the ingredient chips on one
         *  trace stop. Not semantic — their only job is to stay tellable apart,
         *  which is why they are their own roles and not `primary`/`success`. */
        chip1?: string;
        chip2?: string;
        chip3?: string;
        chip4?: string;
        bgPrimary?: string;
        bgSecondary?: string;
        bgTertiary?: string;
        textPrimary?: string;
        textSecondary?: string;
        textMuted?: string;
        border?: string;
    };
    radius?: string;
    fontFamily?: {
        sans?: string;
        mono?: string;
    };
}
/**
 * Maps ThemeTokens to CSS custom property assignments.
 *
 * Every `--fp-*` variable the components actually read must be emitted
 * here — a component reading a variable this function never writes can
 * only ever show its hard-coded fallback, which is how a "light" theme
 * ends up with dark patches. `test/unit/themeTokens.test.ts` greps the
 * source for `--fp-*` reads and fails when one has no emitter, so a new
 * token can't silently drift back out of the theme.
 */
declare function tokensToCSSVars(tokens: ThemeTokens): Record<string, string>;
/** Raw fallback values — used by tokensToCSSVars() and anywhere a real color is needed. */
declare const rawDefaults: {
    readonly colors: {
        readonly primary: "#6366f1";
        readonly success: "#22c55e";
        readonly error: "#ef4444";
        readonly warning: "#f59e0b";
        readonly nodeCursor: "#f59e0b";
        readonly nodeVisited: "#22c55e";
        readonly nodeMain: "#6366f1";
        readonly accent: "#6366f1";
        readonly accentBg: "rgba(99,102,241,0.12)";
        readonly tracing: "#0d9488";
        readonly chip1: "#0d9488";
        readonly chip2: "#d97706";
        readonly chip3: "#7c3aed";
        readonly chip4: "#e11d48";
        readonly bg: "#1a1b26";
        readonly bgElevated: "#1e293b";
        readonly bgPrimary: "#0f172a";
        readonly bgSecondary: "#1e293b";
        readonly bgTertiary: "#334155";
        readonly textPrimary: "#f8fafc";
        readonly textSecondary: "#94a3b8";
        readonly textMuted: "#64748b";
        readonly border: "#334155";
    };
    readonly radius: "8px";
    readonly fontFamily: {
        readonly sans: "Inter, system-ui, -apple-system, sans-serif";
        readonly mono: "'JetBrains Mono', 'Fira Code', monospace";
    };
};
/**
 * Default dark theme values with CSS variable references (consumers can
 * override via CSS).
 *
 * WARNING — do NOT pass this object to `<FootprintTheme tokens={...}>` (or to
 * `tokensToCSSVars`). Every value here is already a `var(--fp-…, fallback)`
 * REFERENCE, so feeding them back in emits self-referential declarations like
 * `--fp-accent: var(--fp-accent, #6366f1)`, which resolve to nothing and blank
 * out the colours they were meant to set. Start from `rawDefaults` (plain hex)
 * or from a preset in `theme/presets.ts` and override the fields you want.
 */
declare const defaultTokens: Required<{
    [K in keyof ThemeTokens]-?: Required<ThemeTokens[K]>;
}>;

declare function useFootprintTheme(): ThemeTokens;
interface FootprintThemeProps {
    tokens?: ThemeTokens;
    children: React.ReactNode;
}
/**
 * Optional theme provider — wraps children with CSS custom properties.
 * Consumers can also just set --fp-* CSS variables directly.
 *
 * Wrapper div uses `display: contents` so it's invisible to the
 * parent's layout (flex / grid / block). This matters because themed
 * children often need to fill a parent (flex:1 / height:100% /
 * grid cells), and a regular block `<div>` here would break that
 * chain — descendants would resolve to 0 height when the parent is
 * flex-column or a grid cell with minmax(0, 1fr). `display: contents`
 * removes the box from the render tree while keeping the DOM intact,
 * so CSS custom property inheritance (which follows the DOM) still
 * flows to children.
 *
 * Trade-off: `display: contents` elements are removed from the
 * accessibility tree in some older browser versions. Our wrapper has
 * no semantic role, so this is fine.
 */
declare function FootprintTheme({ tokens, children }: FootprintThemeProps): react.JSX.Element;

/**
 * Built-in palettes.
 *
 * Each preset carries EVERY role the components read — including the
 * node-state roles, the accent pair, the surfaces and the tracing colour.
 * A preset with holes is worse than no preset: the components fall back to
 * their hard-coded (dark) defaults for the missing roles, so a light theme
 * shows dark patches. `test/unit/themeTokens.test.ts` fails when a preset
 * stops covering a token the source reads.
 *
 * The cool presets keep the historic raw defaults for the node roles
 * (amber cursor / green visited / indigo lead) so nothing re-colours for
 * consumers already on them; the warm presets use their own palette.
 */
/** Cool dark theme (the library default) */
declare const coolDark: ThemeTokens;
/** Warm dark theme — charcoal-purple palette */
declare const warmDark: ThemeTokens;
/** Warm light theme — cream/peach palette */
declare const warmLight: ThemeTokens;
/** Cool light theme — neutral grays, matches Tailwind zinc palette */
declare const coolLight: ThemeTokens;
/** All built-in theme presets */
declare const themePresets: {
    readonly coolDark: ThemeTokens;
    readonly coolLight: ThemeTokens;
    readonly warmDark: ThemeTokens;
    readonly warmLight: ThemeTokens;
};
type ThemePresetName = keyof typeof themePresets;

/**
 * useDarkModeTokens — follow the host app's dark mode.
 *
 * The direct answer to "why is your UI dark inside my light app": this
 * library's `--fp-*` fallbacks are dark, so a component with nothing set
 * renders dark. This hook watches the app's own dark-mode switch and hands
 * back the matching preset.
 *
 *   import { FootprintTheme, useDarkModeTokens } from 'footprint-explainable-ui';
 *
 *   function MyApp() {
 *     const tokens = useDarkModeTokens();          // Tailwind's `.dark` on <html>
 *     return (
 *       <FootprintTheme tokens={tokens}>
 *         <ExplainableShell ... />
 *       </FootprintTheme>
 *     );
 *   }
 *
 * Other switches work too — pass whatever your app uses:
 *
 *   useDarkModeTokens({ darkClass: 'theme-dark' })          // a class name
 *   useDarkModeTokens({ darkClass: '[data-theme="dark"]' }) // a CSS selector
 *   useDarkModeTokens({ light: warmLight, dark: warmDark }) // your palettes
 *
 * Server rendering: on the server there is no `document`, so the first render
 * returns the LIGHT tokens and the client corrects on mount. (It used to read
 * `document` inside the `useState` initializer, which is a hard crash in
 * Next.js — a light flash is the honest cost of not knowing yet.)
 */

interface DarkModeTokensOptions {
    /** Tokens to use in light mode. Defaults to coolLight. */
    light?: ThemeTokens;
    /** Tokens to use in dark mode. Defaults to coolDark. */
    dark?: ThemeTokens;
    /**
     * How the app says "dark". A bare CLASS NAME on `<html>` (`'dark'` —
     * Tailwind's convention, the default), or any CSS SELECTOR the root
     * element should match (`'.dark'`, `'[data-theme="dark"]'`, `'#app.night'`).
     * Anything starting with `.`, `[`, `#` or `:` is treated as a selector.
     */
    darkClass?: string;
    /** @deprecated Renamed to `darkClass`. Still read, same meaning. */
    selector?: string;
}
declare function useDarkModeTokens(options?: DarkModeTokensOptions): ThemeTokens;

interface MemoryInspectorProps extends BaseComponentProps {
    /** A memory object to show as-is. Takes precedence over `snapshots`. */
    data?: Record<string, unknown>;
    /** When using snapshots mode, pass these instead of data */
    snapshots?: StageSnapshot[];
    /** Which step's state to show (for time-travel). Each snapshot's `memory`
     *  is already the accumulated state after that stage — including its
     *  deletions — so this reads that step, it does not re-accumulate. */
    selectedIndex?: number;
    /** Show data types alongside values */
    showTypes?: boolean;
    /** Highlight keys that are new at this step */
    highlightNew?: boolean;
}
/**
 * Displays pipeline memory state as formatted JSON.
 * Supports both static (data prop) and time-travel (snapshots + selectedIndex) modes.
 */
declare function MemoryInspector({ data, snapshots, selectedIndex, showTypes, highlightNew, size, unstyled, className, style, }: MemoryInspectorProps): react.JSX.Element;

interface NarrativeLogProps extends BaseComponentProps {
    /** Snapshots to display narratives from */
    snapshots: StageSnapshot[];
    /** Show narratives up to this index (for time-travel sync) */
    selectedIndex?: number;
    /** Show a single narrative string (simple mode) */
    narrative?: string;
}
/**
 * Timeline-style execution log showing what happened at each stage.
 * Supports both full snapshots mode and single-narrative mode.
 */
declare function NarrativeLog({ snapshots, selectedIndex, narrative, size, unstyled, className, style, }: NarrativeLogProps): react.JSX.Element;

interface NarrativeTraceProps extends BaseComponentProps {
    /** All narrative lines (full trace) */
    narrative: string[];
    /** Number of lines currently revealed (for progressive reveal). Defaults to all. */
    revealedCount?: number;
    /** Start with all groups collapsed */
    defaultCollapsed?: boolean;
    /** Called when user clicks a stage header */
    onStageClick?: (headerIndex: number) => void;
}
declare function NarrativeTrace({ narrative, revealedCount, defaultCollapsed, onStageClick, size, unstyled, className, style, }: NarrativeTraceProps): react.JSX.Element;

interface GanttTimelineProps extends BaseComponentProps, ThemeModeProps {
    /** Stage snapshots with timing info */
    snapshots: StageSnapshot[];
    /** Currently selected stage index */
    selectedIndex?: number;
    /** Callback when a stage bar is clicked */
    onSelect?: (index: number) => void;
    /** Max visible rows before collapsing (0 = no collapse). Default: 5 */
    maxVisibleRows?: number;
}
/**
 * Horizontal Gantt-style timeline showing stage durations and overlap.
 * Collapses to `maxVisibleRows` with expand/collapse toggle.
 * Auto-scrolls to keep the active stage visible when collapsed.
 *
 * Honest degrade: a run recorded without a metrics recorder has all-zero
 * durations. Rather than draw invisible 1%-wide bars against a fabricated
 * 1ms axis and label every row "0ms", the component switches to SEQUENCE
 * bars — equal width, positioned by execution order — plus one note saying
 * so. Order is real; duration is not, and is never invented.
 */
declare function GanttTimeline({ snapshots, selectedIndex, onSelect, size, unstyled, className, style, theme: themeMode, maxVisibleRows, }: GanttTimelineProps): react.JSX.Element;

interface SnapshotPanelProps extends BaseComponentProps, ThemeModeProps {
    /** Stage snapshots from pipeline execution */
    snapshots: StageSnapshot[];
    /** Show the Gantt timeline */
    showGantt?: boolean;
    /** Show the time-travel scrubber */
    showScrubber?: boolean;
    /** Title override */
    title?: string;
}
/**
 * All-in-one panel: time-travel scrubber + memory inspector + narrative log + gantt.
 * Drop this into any page to make a pipeline run inspectable.
 */
declare function SnapshotPanel({ snapshots, showGantt, showScrubber, title, size, unstyled, className, style, theme: themeMode, }: SnapshotPanelProps): react.JSX.Element;

interface DiffEntry {
    key: string;
    type: "added" | "removed" | "changed" | "unchanged";
    oldValue?: unknown;
    newValue?: unknown;
}
interface ScopeDiffProps extends BaseComponentProps {
    /** Memory state before the current stage */
    previous: Record<string, unknown> | null;
    /** Memory state after the current stage */
    current: Record<string, unknown>;
    /** Hide unchanged keys (default: false) */
    hideUnchanged?: boolean;
}
declare function ScopeDiff({ previous, current, hideUnchanged, size, unstyled, className, style, }: ScopeDiffProps): react.JSX.Element;

interface ResultPanelProps extends BaseComponentProps {
    /** Final pipeline output / shared state */
    data: Record<string, unknown> | null;
    /** Optional console log lines */
    logs?: string[];
    /** Hide console section (default: false) */
    hideConsole?: boolean;
}
declare function ResultPanel({ data, logs, hideConsole, size, unstyled, className, style, }: ResultPanelProps): react.JSX.Element;

type StageDetailMode = "simple" | "dev";
interface MemoryChange {
    key: string;
    type: "added" | "updated" | "removed";
    oldValue?: unknown;
    newValue?: unknown;
}
/**
 * Keys hidden from the memory views by default.
 *
 * Empty on purpose: footprintjs writes no reserved keys of its own into
 * shared state, so there is nothing this library can honestly hide for you.
 * It exists as the DEFAULT for `excludeKeys` — pass your own set to hide the
 * plumbing keys YOUR pipeline carries.
 */
declare const DEFAULT_EXCLUDED_KEYS: Set<string>;
interface StageDetailPanelProps extends BaseComponentProps {
    /** Stage snapshots for time-travel */
    snapshots: StageSnapshot[];
    /** Current snapshot index */
    selectedIndex: number;
    /** Display mode: "simple" (description + narrative) or "dev" (memory story) */
    mode?: StageDetailMode;
    /** Show a toggle to switch between simple/dev modes (default: false) */
    showToggle?: boolean;
    /** Called when user toggles mode via built-in toggle */
    onModeChange?: (mode: StageDetailMode) => void;
    /** Keys to hide from the memory views — they disappear from the ledger AND
     *  from the change list (no ADD/UPD/DEL badge for an excluded key), in both
     *  styled and unstyled dev mode. Default: `DEFAULT_EXCLUDED_KEYS` (empty —
     *  nothing hidden). Pass an empty set to show everything. */
    excludeKeys?: Set<string>;
}
declare function StageDetailPanel({ snapshots, selectedIndex, mode: controlledMode, showToggle, onModeChange, excludeKeys, size, unstyled, className, style, }: StageDetailPanelProps): react.JSX.Element;

/**
 * Same-Rail Rewind (tracing mode) — the rail's AXIS never changes, only its
 * stops do: every dependency was committed earlier than the value it fed, so
 * a backward slice is a sub-sequence of this same timeline. When `tracing`
 * is set, slice members stay landable ("stops"), everything else fades to
 * unlandable ticks, and prev/next walk stop-to-stop ("◀ earlier cause").
 * The cursor stays the ONE `selectedIndex` — no second position exists.
 *
 * THEMING: tracing mode recolors its chrome with ONE token, `--fp-tracing`
 * (default #0d9488 teal) — the TRACING badge, the rail's bottom border, the
 * stop ticks, the walk buttons, and Done — so the tracing rail is
 * unmistakably not normal time-travel. Consumers retheme by setting
 * `--fp-tracing` on any ancestor. Normal mode never reads the token.
 */
interface TracingRail {
    /** The traced variable — rendered in the mode header. */
    tracedKey: string;
    /** Set while an ingredient filter is active ("▸ via key"). */
    viaKey?: string | null;
    /** Snapshot indices that are stops, ASCENDING. All other ticks become
     *  faint and unlandable (context, not destinations). */
    stopIndices: number[];
    /** 1-based position of the cursor in WALK order (newest first) + total —
     *  the "stop 2 of 6" label. */
    stopOrdinal: number;
    totalStops: number;
    /** Exit tracing (Done button / Escape). The cursor stays put. */
    onExit: () => void;
    /** Clear the via filter back to the full walk (breadcrumb's "show all"). */
    onShowAll?: () => void;
    /** Ingredient count at the CURRENT stop. Together with `onForkPrompt`,
     *  >= 2 turns the walk-back control into "choose cause…": it PROMPTS
     *  instead of moving, so a silent default never hides one parent of a
     *  fork. 0/undefined = not a fork — classic earlier-cause behavior. */
    forkCount?: number;
    /** Open the fork chooser — fired INSTEAD of a cursor move when
     *  `forkCount >= 2` (click or ArrowLeft on the walk-back control). */
    onForkPrompt?: () => void;
}
interface TimeTravelControlsProps extends BaseComponentProps {
    /** Stage snapshots */
    snapshots: StageSnapshot[];
    /** Currently selected stage index */
    selectedIndex: number;
    /** Callback when selected index changes */
    onIndexChange: (index: number) => void;
    /** Enable auto-play with Gantt-proportional timing */
    autoPlayable?: boolean;
    /** Same-Rail Rewind session — when set, the rail is in tracing mode. */
    tracing?: TracingRail | null;
}
declare function TimeTravelControls({ snapshots, selectedIndex, onIndexChange, autoPlayable, tracing, size, unstyled, className, style, }: TimeTravelControlsProps): react.JSX.Element;

/**
 * Minimal subflow-walking spec shape. Used INTERNALLY by drill-down
 * resolution (which navigates `subflowStructure` to find a child chart
 * inside the parent's serialized structure). No longer used for chart
 * rendering — that happens via `traceGraph` + `<TracedFlow>` exclusively.
 *
 * Kept as a local type so the file no longer depends on any legacy
 * spec-walk module.
 */
interface SpecNode {
    name: string;
    id?: string;
    description?: string;
    children?: SpecNode[];
    next?: SpecNode;
    isSubflowRoot?: boolean;
    subflowId?: string;
    subflowName?: string;
    subflowStructure?: SpecNode;
}
/** Tab ID — "result", "memory", "narrative", or any custom recorder view ID. */
type ShellTab = string;
interface PanelLabels {
    /** Left panel pill label (subflow tree). Default: "Topology" */
    topology?: string;
    /** Right panel pill label (memory/narrative). Default: "Details" */
    details?: string;
    /** Bottom panel pill label (timeline). Default: "Timeline" */
    timeline?: string;
}
/** Which panels start expanded. Default: `{ details: true }` (flowchart + memory). */
interface DefaultExpanded {
    topology?: boolean;
    details?: boolean;
    timeline?: boolean;
}
/**
 * Raw runtime snapshot from FlowChartExecutor.getSnapshot().
 * When provided, ExplainableShell converts it internally — zero boilerplate.
 */
interface RuntimeSnapshotInput {
    sharedState: Record<string, unknown>;
    executionTree: unknown;
    commitLog: unknown[];
    subflowResults?: Record<string, unknown>;
    /** Recorder snapshots from toSnapshot() — auto-generates detail tabs. */
    recorders?: Array<{
        id: string;
        name: string;
        description?: string;
        preferredOperation?: 'translate' | 'accumulate' | 'aggregate';
        data: unknown;
    }>;
}
/**
 * A recorder view that appears as a tab in the details panel.
 * Each recorder provides its own per-stage rendering.
 * Memory and Narrative are built-in defaults — add more via this prop.
 */
interface RecorderView {
    /** Unique key for this view tab */
    id: string;
    /** Display label on the tab */
    name: string;
    /** Short description shown as tooltip and header for auto-detected views.
     *  e.g., "Per-step timing and I/O counts (KeyedRecorder)" */
    description?: string;
    /**
     * Render function — receives the current snapshot index and all snapshots.
     * Return a React node to display in the details panel.
     */
    render: (props: {
        snapshots: StageSnapshot[];
        selectedIndex: number;
    }) => React.ReactNode;
}
/**
 * The Trace flowchart's two-colour theme (footprintjs level).
 *
 * `mode` is the COARSE switch: it applies eui's full light or dark preset
 * (`coolLight` / `coolDark`) as `--fp-*` variables on the shell root, so the
 * ENTIRE shell — canvas, panels, nodes, text, borders — follows dark/light from
 * this one field. You do NOT need to hand-set `--fp-*` yourself. (`--fp-*`
 * remains available as a fine escape hatch for individual token overrides.)
 *
 * `visited` and `current` are the two semantic node colours, layered on top of
 * the mode base. All optional — sensible per-mode defaults are used for anything
 * omitted.
 */
interface TraceTheme {
    mode?: "dark" | "light";
    /** Executed / done nodes. */
    visited?: string;
    /** The node at the current cursor position ("now"). */
    current?: string;
}
interface ExplainableShellProps extends BaseComponentProps {
    /**
     * Pre-converted visualization snapshots. Use when you've already called
     * toVisualizationSnapshots() yourself.
     */
    snapshots?: StageSnapshot[];
    /**
     * Raw runtime snapshot from executor.getSnapshot(). The shell converts it
     * internally via toVisualizationSnapshots(). When provided, `snapshots`
     * and `resultData` are derived automatically. Pair with
     * `narrativeEntries` for rich per-stage narrative.
     *
     * Usage: `<ExplainableShell runtimeSnapshot={executor.getSnapshot()} narrativeEntries={executor.getNarrativeEntries()} traceGraph={graph} runtimeOverlay={overlay} />`
     */
    runtimeSnapshot?: RuntimeSnapshotInput | null;
    /**
     * Build-time graph captured live via `createTraceStructureRecorder`.
     * REQUIRED for chart rendering (v6+) — the legacy `spec` →
     * legacy spec-walk post-walk path was removed in favor of this
     * recorder-driven graph.
     *
     * Pair with `runtimeOverlay` for the full time-travel trace UI.
     * When `traceGraph` is set but `runtimeOverlay` is absent, the
     * chart renders without runtime coloring (build-time-only view).
     *
     * The `spec` prop, when also provided, is used INTERNALLY for
     * subflow drill-down resolution (navigating `subflowStructure` to
     * find a child chart inside the parent's serialized structure) —
     * NOT for rendering.
     */
    traceGraph?: TraceGraph | null;
    /**
     * Runtime overlay captured live via `createTraceRuntimeOverlay` — the
     * per-step colouring that lights the executed path.
     *
     * **Usually leave it off.** When `runtimeSnapshot` is given and this prop
     * is absent, the shell rebuilds the overlay from the snapshot's own commit
     * log (`overlayFromSnapshot`), so a replayed recording colours its chart
     * exactly like the live run did. Pass it only to override that — a live
     * `createTraceRuntimeOverlay` handle sees a little more than a recording
     * can (errors, subflow internals, wall-clock).
     *
     * For a deliberately uncoloured (build-time-only) chart pass an EMPTY
     * overlay — `{ executionOrder: [], errors: new Map(), running: false }`.
     * Omitting the prop no longer means "no colours"; it means "work it out
     * from the snapshot", because omitting it was how every replay ended up
     * grey.
     */
    runtimeOverlay?: RuntimeOverlay | null;
    /**
     * Trace flowchart theme — the footprintjs-LEVEL **two-colour** scheme:
     * `visited` (executed nodes) + `current` (the cursor node). `mode` is the
     * coarse light/dark switch — it applies eui's full preset to the whole shell,
     * so you pass one word instead of a wall of `--fp-*` vars. Colours are optional
     * — omit to use the per-mode defaults. The agent-semantic three-colour theme
     * belongs to `<Lens>`, not here.
     */
    traceTheme?: TraceTheme;
    title?: string;
    resultData?: Record<string, unknown> | null;
    logs?: string[];
    /** Structured narrative entries from `executor.getNarrativeEntries()`.
     *  This is the only narrative input — the flat-string form was
     *  removed; call `.map(e => e.text)` if you need it.
     *
     *  Optional when `runtimeSnapshot` is given: a run recorded with
     *  footprintjs's narrative recorder carries its entries inside the
     *  snapshot, and the shell reads them from there. Pass this prop to
     *  override that (it always wins). */
    narrativeEntries?: NarrativeEntry[];
    /**
     * @deprecated Never had an effect and now warns in dev. Use `hideTabs` to
     * drop tabs by id and `defaultTab` to choose which one opens first.
     *
     * It was documented as `["result", "explainable"]`, but `"explainable"` is
     * not a tab in the styled shell at all — it is the unstyled whole-surface
     * view — so honouring this list literally would have cut every styled shell
     * down to a lone Result tab. There is no reading of it that is both
     * faithful to the documented default and safe, which is why it is going
     * rather than getting wired.
     */
    tabs?: ShellTab[];
    defaultTab?: ShellTab;
    hideConsole?: boolean;
    /** Hide specific detail tabs (e.g., ['result', 'memory']). */
    hideTabs?: string[];
    /** Customize the labels on collapsible panel pills */
    panelLabels?: PanelLabels;
    /** Which panels start expanded. Default: `{ details: true }` */
    defaultExpanded?: DefaultExpanded;
    /**
     * Recorder views — each becomes a tab in the details panel.
     * Default: Memory + Narrative. Pass additional recorder views
     * to show tokens, cost, tools, permissions, or custom data.
     *
     * Usage:
     *   recorderViews={[
     *     { id: 'tokens', name: 'Tokens', render: ({ selectedIndex }) => <div>...</div> },
     *   ]}
     */
    recorderViews?: RecorderView[];
    /**
     * Custom flowchart renderer. When omitted, ExplainableShell renders
     * via `<TracedFlow graph={traceGraph} overlay={runtimeOverlay} />` —
     * the recorder-driven path. Override to plug a custom chart UI; the
     * `spec` parameter is forwarded only for backward-compatible
     * signatures (it's the same SpecNode used for drill-down) and may
     * be `null` once consumers stop threading it in.
     */
    renderFlowchart?: (props: {
        spec: SpecNode | null;
        snapshots: StageSnapshot[];
        selectedIndex: number;
        onNodeClick?: (indexOrId: number | string) => void;
        showStageId?: boolean;
        /** Dependency-cone overlay (chart node id → BFS depth) — painted while
         *  the Inspector's Data Trace tab is open. Custom renderers may ignore it. */
        sliceCone?: ReadonlyMap<string, number>;
        /** The shell's CURRENT drill scope — the mount node's id, or `null` at the
         *  top level. The shell owns the one drill state, so a chart that keeps
         *  its own must follow this or it will show a different level than the
         *  breadcrumb, story and timeline beside it. */
        currentSubflowId?: string | null;
        /** Call to MOVE the shell's drill: a mount node's id to drill in, `null`
         *  to pop back to the top. */
        onSubflowChange?: (mountStageId: string | null) => void;
    }) => React.ReactNode;
    /**
     * When true, render each node's stable `stageId` as a small monospace
     * caption beneath the label in the default flowchart renderer.
     * Teaching aid: it reveals the key recorders use
     * (`runtimeStageId = [subflowPath/]stageId#executionIndex`) so a
     * consumer can map any recorder's per-stage data back to a node.
     * Default false.
     */
    showStageId?: boolean;
}
declare function ExplainableShell({ snapshots: snapshotsProp, runtimeSnapshot, title, resultData: resultDataProp, logs, narrativeEntries: narrativeEntriesProp, tabs: deprecatedTabs, defaultTab, hideConsole, hideTabs: hideTabsProp, panelLabels, defaultExpanded, recorderViews, renderFlowchart, showStageId, traceGraph, runtimeOverlay: runtimeOverlayProp, traceTheme, size, unstyled, className, style, }: ExplainableShellProps): react.JSX.Element;

/**
 * TraceViewer — renders a saved recording. No live executor, no re-run.
 *
 * A recording is three things, and each one lights a different surface:
 *
 *   ```ts
 *   const recording = {
 *     snapshot:  executor.getSnapshot(),      // memory, story, timeline, colouring
 *     structure: chart.buildTimeStructure,    // the CHART. Nothing else can draw it.
 *     events:    [...],                       // the agent view (agentfootprint-lens)
 *   };
 *   fs.writeFileSync('run.json', JSON.stringify(recording));
 *   ```
 *
 *   ```tsx
 *   <TraceViewer recording={JSON.parse(raw)} onError={(e) => setStatus(e.message)} />
 *   ```
 *
 * This is the same `Recording` shape `observeRecording` takes in
 * `agentfootprint-lens` — one saved file, two viewers. `events` is read by
 * Lens, not here; a recording with only two of the three fields still works,
 * and the missing surface says which piece it wanted.
 *
 * Accepts a parsed object OR a raw JSON string (the paste-a-run workflow).
 * Everything that can go wrong goes to `onError` with a typed reason —
 * including the two that used to render nothing at all: a snapshot this
 * library cannot read, and a recording whose run has no stages.
 *
 * The component is a thin composition over `graphFromStructure` +
 * `overlayFromSnapshot` + `<ExplainableShell />` — exactly what a consumer
 * would write by hand. Source is short on purpose; read it as the reference.
 */

/**
 * One frozen run. Field-for-field the shape `agentfootprint-lens`'
 * `observeRecording` reads, so the same file drives both viewers.
 */
interface Recording {
    /** The run's footprintjs snapshot (`executor.getSnapshot()`). Required —
     *  without it there is no run to show. */
    readonly snapshot?: unknown;
    /** The chart's build-time structure (`chart.buildTimeStructure`). The only
     *  thing that can draw the flowchart; a snapshot cannot. */
    readonly structure?: unknown;
    /** The same chart under the name many recordings were frozen with. Read
     *  when `structure` is absent, so an existing file drops straight in. */
    readonly blueprint?: unknown;
    /** The run's event log. Read by `<Lens>`; ignored here. */
    readonly events?: readonly unknown[];
    /** Narrative entries, when the producer captured them separately. Usually
     *  unnecessary — a run recorded with footprintjs's narrative recorder
     *  carries its story inside the snapshot. */
    readonly narrativeEntries?: unknown[];
    /** Optional producer version stamp. Anything other than 1 is refused
     *  loudly rather than half-rendered. */
    readonly schemaVersion?: number;
    /** When the producer stamped extra fields, they ride along untouched. */
    readonly [key: string]: unknown;
}
/**
 * Why a recording could not be shown. Every branch reports one of these —
 * the viewer never renders `fallback` without saying why.
 */
type TraceParseError = {
    kind: 'invalid-json';
    message: string;
} | {
    kind: 'not-object';
    message: string;
} | {
    kind: 'unsupported-version';
    message: string;
    version: number;
} | {
    kind: 'missing-snapshot';
    message: string;
} | {
    kind: 'unreadable-snapshot';
    message: string;
} | {
    kind: 'no-stages';
    message: string;
};
interface TraceViewerProps extends Pick<ExplainableShellProps, 'tabs' | 'defaultTab' | 'hideTabs' | 'size' | 'panelLabels' | 'recorderViews' | 'renderFlowchart' | 'traceTheme'>, ThemeModeProps {
    /**
     * The recording to render — a parsed object or a raw JSON string.
     * `null` / `undefined` / empty-string render the `fallback`.
     */
    readonly recording?: Recording | string | null;
    /** Former name for `recording`. Still read; prefer `recording`. */
    readonly trace?: Recording | string | null;
    /**
     * Called with the typed reason whenever nothing can be rendered. Show it:
     * every one of these is actionable, and half of them name a missing
     * ingredient rather than a corrupt file.
     */
    readonly onError?: (error: TraceParseError) => void;
    /** Element rendered when no valid recording is available. */
    readonly fallback?: react.ReactNode;
}
declare function TraceViewer({ recording, trace, onError, fallback, tabs, defaultTab, hideTabs, size, panelLabels, recorderViews, renderFlowchart, traceTheme, theme: themeMode, }: TraceViewerProps): react.ReactElement | null;

interface MemoryPanelProps extends BaseComponentProps {
    snapshots: StageSnapshot[];
    selectedIndex: number;
}
declare function MemoryPanel({ snapshots, selectedIndex, size, unstyled, className, style, }: MemoryPanelProps): react.JSX.Element;

interface NarrativePanelProps extends BaseComponentProps {
    snapshots: StageSnapshot[];
    selectedIndex: number;
    /** Structured narrative entries (primary source — richer rendering).
     *  When absent, falls back to per-stage `snapshot.narrative` lines. */
    narrativeEntries?: NarrativeEntry[];
    /** The subflow `narrativeEntries` were scoped to, when this panel is showing
     *  a drilled-in level. Forwarded to `<StoryNarrative scopeSubflowId>` so the
     *  level's own stages are shown instead of hidden as "subflow internals". */
    scopeSubflowId?: string;
    /**
     * Full runtime snapshot from the runner (executor.getSnapshot() /
     * agent.getSnapshot()). When present, "Copy for LLM" includes the
     * commit log, final shared state, and recorder snapshots alongside
     * the rendered narrative. Without it, only the rendered text is
     * copied — useful but misses the tool-call payloads and state
     * transitions needed to debug why a run failed.
     */
    runtimeSnapshot?: any;
    /**
     * Flowchart spec from the runner (executor.getSpec() / agent.getSpec()).
     * When present, "Copy for LLM" appends the topology so the LLM can
     * see which node was running at each step — not just the narrative.
     */
    spec?: any;
}
declare function NarrativePanel({ snapshots, selectedIndex, narrativeEntries, scopeSubflowId, runtimeSnapshot, spec, size, unstyled, className, style, }: NarrativePanelProps): react.JSX.Element;

interface StoryNarrativeProps extends BaseComponentProps {
    /** Structured narrative entries from CombinedNarrativeRecorder */
    entries: NarrativeEntry[];
    /** Number of entries to reveal (position-based sync from NarrativePanel) */
    revealedEntryCount: number;
    /**
     * The subflow this story IS. Set it when `entries` were already scoped to
     * one subflow (a drilled-in view): entries belonging to that subflow are
     * this story's own stages and must be shown, while entries from subflows
     * NESTED inside it stay hidden behind their own mount, exactly as
     * top-level subflows are at the root.
     *
     * Unset (the default) means the root story — every subflow's internals are
     * hidden and only the Entering/Exiting markers show.
     */
    scopeSubflowId?: string;
}
declare function StoryNarrative({ entries, revealedEntryCount, scopeSubflowId, size, unstyled, className, style: outerStyle, }: StoryNarrativeProps): react.JSX.Element;

/**
 * Shape of FootPrint's RuntimeSnapshot (from FlowChartExecutor.getSnapshot()).
 * We define it here instead of importing to avoid a hard dependency on footprintjs.
 */
interface RuntimeStageSnapshot {
    id: string;
    /** `stageId#executionIndex` — the universal per-execution key. Joins this
     *  tree node to its commit-log bundles for cumulative-memory replay. */
    runtimeStageId?: string;
    name?: string;
    isDecider?: boolean;
    isFork?: boolean;
    /** User-level writes made by this stage (pre-namespace keys → values). */
    stageWrites?: Record<string, unknown>;
    logs: Record<string, unknown>;
    errors: Record<string, unknown>;
    metrics: Record<string, unknown>;
    evals: Record<string, unknown>;
    flowMessages?: unknown[];
    description?: string;
    subflowId?: string;
    next?: RuntimeStageSnapshot;
    children?: RuntimeStageSnapshot[];
}
interface RecorderSnapshot {
    id: string;
    name: string;
    data: unknown;
}
interface RuntimeSnapshot {
    sharedState: Record<string, unknown>;
    initialState?: Record<string, unknown>;
    executionTree: RuntimeStageSnapshot;
    commitLog?: unknown[];
    /** Per-subflow execution results (keyed by subflowId). */
    subflowResults?: Record<string, unknown>;
    /** Snapshots from recorders that implement toSnapshot() (e.g. MetricRecorder). */
    recorders?: RecorderSnapshot[];
}

/**
 * Reads the execution narrative a recorded run carries with it.
 *
 * Use when you have a snapshot but no live executor to call
 * `getNarrativeEntries()` on:
 * ```ts
 * <ExplainableShell runtimeSnapshot={snapshot}
 *                   narrativeEntries={narrativeFromSnapshot(snapshot)} />
 * ```
 * (`<ExplainableShell>` already does this for you — pass the prop only to
 * override.) Returns `undefined` when the run was recorded without a
 * narrative recorder: absent narrative stays absent, never invented.
 */
declare function narrativeFromSnapshot(runtime: unknown): NarrativeEntry[] | undefined;
/**
 * Deep-merges a caller-owned PATCH into a base value. This retained public
 * utility is not a record reader; its array policy differs from Foottrace.
 *
 * Semantics:
 *   - plain objects: object-spread per level — patch keys win, base
 *     siblings survive (the gap this helper closes)
 *   - **arrays: REPLACE, not union-merge.** Deliberate divergence from
 *     footprintjs's `deepSmartMerge` (which unions non-empty arrays with
 *     reference-equality dedup). A memory VIEW should show the array a
 *     consumer would read at that moment: the dominant array-write path
 *     (TypedScope copy-on-write push / `$batchArray`) commits as a `set`
 *     of the full final array anyway, and union-replay of the rare
 *     `merge`-verb array delta can fabricate element mixes (reference
 *     dedup never dedupes deep-equal objects) that the display has no
 *     way to reconcile. Replace is predictable and loses nothing the
 *     patch didn't carry.
 *   - summary markers (`__writeSummary`/`__readSummary`): atomic — a marker
 *     patch replaces the key wholesale, and nothing merges INTO a marker
 *   - primitives / null / type mismatches: patch wins
 *
 * Pure: never mutates `base` or `patch`; merged branches are fresh objects.
 */
declare function mergeWritePatch(base: unknown, patch: unknown): unknown;
/**
 * Converts a FootPrint RuntimeSnapshot into a flat array of StageSnapshots
 * suitable for visualization components.
 *
 * The `narrativeEntries` parameter (from `executor.getNarrativeEntries()`)
 * distributes the library's rich combined narrative per-stage. Omit it and
 * the narrative the snapshot carries itself (`snapshot.recorders`) is used
 * instead — so a replayed recording reads like the live run did.
 * When narrative is not enabled at all, stages get a basic line built from
 * the stage's own name/description/writes — this adapter reflects what the
 * library produces, nothing more.
 *
 * Usage:
 * ```ts
 * const executor = new FlowChartExecutor(chart);
 * await executor.run();
 * const snapshots = toVisualizationSnapshots(
 *   executor.getSnapshot(),
 *   executor.getNarrativeEntries(),
 * );
 * ```
 */
declare function toVisualizationSnapshots(runtime: RuntimeSnapshot, narrativeEntries?: NarrativeEntry[]): StageSnapshot[];
/**
 * Converts a footprintjs SubflowResult (stored on StageSnapshot.subflowResult)
 * into visualization snapshots for drill-down views.
 *
 * SubflowResult shape (from footprintjs):
 *   { subflowId, subflowName, treeContext: { globalContext, stageContexts, history }, parentStageId }
 *
 * Pass the RUN's `subflowResults` map as the third argument to keep drilling
 * DEEPER: a subflow that mounts another subflow needs its child's result to
 * be attached to the stage that mounts it, and that result lives in the run-
 * level map (footprintjs dual-keys it by both `subflowPath` and
 * `runtimeStageId`, which is what the inner tree's nodes carry). Without it
 * the inner mount's snapshot has no `subflowResult` and the second drill
 * silently does nothing.
 *
 * Returns empty array if the input is not a valid SubflowResult.
 */
declare function subflowResultToSnapshots(subflowResult: unknown, narrativeEntries?: NarrativeEntry[], subflowResults?: Record<string, unknown>): StageSnapshot[];
/**
 * Creates StageSnapshots from simple arrays (when you don't have a RuntimeSnapshot).
 * Useful for testing or custom data sources.
 */
declare function createSnapshots(stages: Array<{
    name: string;
    label?: string;
    memory?: Record<string, unknown>;
    narrative?: string;
    durationMs?: number;
    description?: string;
    subflowId?: string;
}>): StageSnapshot[];

/**
 * Narrative sync utilities — shared logic for mapping timeline position
 * to narrative entries. Used by NarrativePanel and available to consumers
 * building custom visualization shells.
 */

/**
 * Range index: runtimeStageId → half-open range [firstIdx, endIdx) in entries array.
 *
 * This is the same shape as `SequenceRecorder.getEntryRanges()` in footprintjs.
 * When you have recorder access, pass `recorder.getEntryRanges()` directly.
 * When you only have the flat array, use `buildEntryRangeIndex()` to build it.
 */
type EntryRangeIndex = ReadonlyMap<string, {
    readonly firstIdx: number;
    readonly endIdx: number;
}>;
/**
 * Build a range index from a flat entries array for O(1) per-step lookups.
 * Equivalent to `SequenceRecorder.getEntryRanges()` but works on detached arrays.
 *
 * Call once when narrativeEntries changes, then pass to `computeRevealedEntryCount`.
 *
 * @param entries — structured entries (from CombinedNarrativeRecorder.getEntries() or getNarrativeEntries())
 * @returns range index for fast slider sync
 */
declare function buildEntryRangeIndex(entries: Pick<NarrativeEntry, "runtimeStageId">[]): EntryRangeIndex;
/**
 * Compute how many narrative entries to reveal at a given slider position.
 *
 * **With range index (preferred):** O(selectedIndex) — one Map lookup per snapshot.
 * **Without index (convenience):** O(entries) forward scan.
 *
 * The range index can come from:
 * - `SequenceRecorder.getEntryRanges()` (when you have recorder access)
 * - `buildEntryRangeIndex(entries)` (when you only have the flat array)
 *
 * @param narrativeEntries — structured entries from CombinedNarrativeRecorder
 * @param snapshots — execution timeline (from adapter)
 * @param selectedIndex — current slider position (0-based)
 * @param rangeIndex — optional precomputed range index for O(1) lookups
 * @returns number of entries to reveal (0 to narrativeEntries.length)
 */
declare function computeRevealedEntryCount(narrativeEntries: NarrativeEntry[], snapshots: Pick<StageSnapshot, "runtimeStageId">[], selectedIndex: number, rangeIndex?: EntryRangeIndex): number;
/**
 * Extract narrative entries belonging to a specific subflow.
 *
 * Three-tier matching (most reliable first):
 * 1. `stageName` prefix match (e.g., entries with `stageName` starting with `"sf-pay/"`)
 * 2. `subflowId` field match
 * 3. `direction` field on subflow entry/exit markers (renderer-agnostic)
 *
 * @param entries — all narrative entries from the execution
 * @param subflowId — subflow identifier to extract
 * @param subflowName — optional display name for fallback matching
 * @returns entries belonging to the subflow
 */
declare function extractSubflowNarrative(entries: NarrativeEntry[], subflowId: string, subflowName?: string): NarrativeEntry[];

/** A node in the causal DAG (matches footprintjs CausalNode shape). */
interface CausalFrame {
    runtimeStageId: string;
    stageId: string;
    stageName: string;
    keysWritten: string[];
    linkedBy: string;
    depth: number;
}
interface DataTracePanelProps extends BaseComponentProps {
    /** Flattened causal chain frames (BFS order from causalChain + flattenCausalDAG). */
    frames: CausalFrame[];
    /** Currently selected stage's runtimeStageId. */
    selectedStageId?: string;
    /** Callback when a frame is clicked — navigate time-travel to that stage. */
    onFrameClick?: (runtimeStageId: string) => void;
    /** Optional: stage name for the "tracing from" header. */
    fromStageName?: string;
    /** Optional honesty line rendered under the header (⚠-style). */
    note?: string;
}
/**
 * Render the backward causal chain as a stack trace.
 * Each frame shows: stage name, what it wrote, linked by which key.
 * Click a frame to navigate the time-travel slider.
 */
declare const DataTracePanel: react.NamedExoticComponent<DataTracePanelProps>;

interface InspectorPanelProps extends BaseComponentProps {
    snapshots: StageSnapshot[];
    selectedIndex: number;
    /** Causal chain frames for the selected node (empty = no trace available). */
    dataTraceFrames: CausalFrame[];
    /** Optional honesty line for the Data Trace tab (e.g. reads not recorded). */
    dataTraceNote?: string;
    /** Currently selected runtimeStageId. */
    selectedStageId?: string;
    /** Navigate to a stage when clicking a Data Trace frame. */
    onNavigateToStage?: (runtimeStageId: string) => void;
    /** Fires when the user switches tabs — lets the shell paint the chart's
     *  dependency cone while the Data Trace tab is open. */
    onTabChange?: (tab: "state" | "trace") => void;
    /** Controlled tab — when provided the SHELL owns the tab (it must force
     *  Data Trace open on tracing entry); clicks still fire onTabChange. */
    tab?: "state" | "trace";
    /** Replaces the Data Trace tab body (the shell swaps in the Same-Rail
     *  Rewind stop card / entry chips); default = the classic frames list. */
    traceContent?: ReactNode;
}
declare const InspectorPanel: react.NamedExoticComponent<InspectorPanelProps>;

/** One recorded dependency. null means no earlier recorded writer, not a proven input. */
interface TraceIngredient {
    key: string;
    writerRuntimeStageId: string | null;
    writerStageName: string | null;
    /** Exact source-local writer row, independent of the stage's read anchor. */
    writerCommitIdx: number | null;
    basis?: "nested-rows";
}
interface TraceStop {
    runtimeStageId: string;
    stageId: string;
    stageName: string;
    /** Representative stage/read position; the root uses its exact anchor writer.
     * Not a promise that every contributed key was written at this one row. */
    commitIdx: number;
    contributedKeys: string[];
    keysWritten: string[];
    ingredients: TraceIngredient[];
    depth: number;
    loopPass: number;
    /** The execution's own commit: where its captured reads belong. */
    readCommitIdx?: number;
    /** Actual writer positions for this stage's contributions to the slice. */
    contributedWrites?: Array<{
        key: string;
        commitIdx: number;
        valueBasis?: ValueBasis[];
    }>;
}
interface TraceWalkMissing {
    /** Compatibility vocabulary. 'never-written' means no recorded writer in
     * the queried range; it makes no claim that the value was a run input. */
    reason: "never-written" | "not-yet-written";
    /** Separately checked whole-record hint, never part of the historical answer. */
    firstWriteCommitIdx?: number;
    firstWriterRuntimeStageId?: string;
    firstWriterStageName?: string;
}
interface TraceWalk {
    key: string;
    /** One card per canonical execution, newest representative position first. */
    stops: TraceStop[];
    missing: TraceWalkMissing | null;
    /** Compatibility name: captured reads lacking an earlier recorded writer.
     * Their origin is unknown; these are not asserted to be run inputs. */
    inputTermini: string[];
    /** Some captured reads were observed, never a complete-capture guarantee. */
    readsAvailable: boolean;
    truncated: boolean;
    /** Optional additions keep caller-created walks source-compatible. */
    status?: "available" | "not-recorded" | "unavailable";
    note?: string;
    evidence?: {
        sourceId: string;
        beforeCommitIdx: number;
        readsKind: string;
        readsCoverage?: ReadsCoverage;
        truncated?: {
            byDepth: boolean;
            byNodes: boolean;
        };
    };
}
type WalkOptions = {
    beforeCommitIdx?: number;
    maxDepth?: number;
    maxFrames?: number;
};
/** Retained public positional API. No fabricated stage is needed for a key query. */
declare function buildTraceWalk(commitLog: unknown[], executionTree: unknown, key: string, opts?: WalkOptions): TraceWalk;
/** Copy story and the card consume the same qualified presentation facts. */
declare function formatTraceWalk(walk: TraceWalk, stepNumberOf: (runtimeStageId: string) => number | null): string;

interface TraceWalkCardProps extends BaseComponentProps {
    walk: TraceWalk;
    /** The ONE cursor — the card highlights its stop; null falls back to the anchor. */
    cursorRuntimeStageId: string | null;
    /** Active ingredient filter (breadcrumb "▸ via key"). */
    viaKey?: string | null;
    /** Map a stop to its 1-based rail step number (null = not on this rail). */
    stepNumberOf: (runtimeStageId: string) => number | null;
    /** Value preview for the displayed contribution, not the current rail memory.
     * The Shell reads its frozen source at that key's exact writer row. */
    previewValueOf?: (key: string) => unknown;
    /** Follow an ingredient: re-anchor the walk on ing.key before this stop. */
    onFollowIngredient?: (ing: TraceIngredient) => void;
    /** Jump the cursor to a stop (itinerary row click). */
    onJumpToStop?: (runtimeStageId: string) => void;
    onShowAll?: () => void;
    onExit?: () => void;
    /** F2 fork chooser: when true AND the current stop has 2+ ingredients,
     *  a loud chooser block asks WHICH ingredient the walk should follow —
     *  the rail's walk-back control opens it instead of moving. */
    forkChooserOpen?: boolean;
    /** The chooser's neutral option — today's behavior: step to the nearest
     *  earlier stop in time. The SHELL computes the move; the card only
     *  fires this. */
    onContinueTimeOrder?: () => void;
    /** False at the walk's earliest stop — there IS no earlier stop, so the
     *  chooser's time-order button must not pretend to move (review fix). */
    canContinueTimeOrder?: boolean;
}
declare const TraceWalkCard: react.NamedExoticComponent<TraceWalkCardProps>;

interface InsightConfig {
    /** Unique ID (matches recorder id). */
    id: string;
    /** User-facing name (Story, Performance, Quality, Cost). */
    name: string;
    /** Aggregate summary for collapsed header (e.g., "1.2ms 3R 3W"). */
    summary?: string;
    /** Render the insight content. */
    render: () => React.ReactNode;
}
interface InsightPanelProps extends BaseComponentProps {
    insights: InsightConfig[];
    /** Which insight is expanded by default (by id). */
    expandedId?: string;
    /** Display mode: tabs (one at a time) or grid (all visible). */
    mode: "tabs" | "grid";
}
declare const InsightPanel: react.NamedExoticComponent<InsightPanelProps>;

interface CompactTimelineProps {
    snapshots: StageSnapshot[];
    selectedIndex: number;
    /** Start expanded or collapsed. Default: collapsed. */
    defaultExpanded?: boolean;
    /** Header text. Default: "Timeline". `<ExplainableShell>` passes
     *  `panelLabels.timeline` here so the desktop footer is labelled by the
     *  same prop as the mobile pill. */
    label?: string;
}
declare const CompactTimeline: react.NamedExoticComponent<CompactTimelineProps>;

interface ExplainableRecording {
    readonly snapshot: RuntimeSnapshotInput;
    readonly structure?: unknown;
    readonly blueprint?: unknown;
    readonly narrativeEntries?: NarrativeEntry[];
    readonly resultData?: Record<string, unknown> | null;
    readonly logs?: readonly string[];
    readonly schemaVersion?: number;
    readonly [key: string]: unknown;
}
type ExplainableRecordingInput = ExplainableRecording | string | null | undefined;
interface ExplainableViewTheme {
    /** Built-in light/dark palette. Omit to inherit the consumer's CSS variables. */
    readonly mode?: ThemeMode;
    /** Fine-grained design tokens. These override the selected mode. */
    readonly tokens?: ThemeTokens;
    /** Flowchart state colors. These override both mode and tokens for chart nodes. */
    readonly flowchart?: Partial<TracedFlowColors>;
}
interface ExplainableRunContextValue {
    readonly recording: ExplainableRecording | null;
    readonly snapshots: StageSnapshot[];
    readonly selectedIndex: number;
    readonly selectedSnapshot: StageSnapshot | undefined;
    readonly selectIndex: (index: number) => void;
    readonly traceGraph: TraceGraph;
    readonly runtimeOverlay: RuntimeOverlay;
    readonly narrativeEntries: NarrativeEntry[];
    readonly resultData: Record<string, unknown> | null;
    readonly logs: string[];
    readonly flowchartColors: Partial<TracedFlowColors> | undefined;
    readonly error: string | null;
}
interface ExplainableProviderProps {
    readonly recording: ExplainableRecordingInput;
    readonly selectedIndex?: number;
    readonly defaultSelectedIndex?: number;
    readonly onSelectedIndexChange?: (index: number) => void;
    readonly theme?: ExplainableViewTheme;
    readonly children: react.ReactNode;
    readonly className?: string;
    readonly style?: react.CSSProperties;
}
declare function ExplainableProvider({ recording: input, selectedIndex: controlledIndex, defaultSelectedIndex, onSelectedIndexChange, theme, children, className, style, }: ExplainableProviderProps): react.JSX.Element;
declare function useExplainableRun(): ExplainableRunContextValue;

interface TimelinePanelProps extends BaseComponentProps {
    readonly title?: string;
    readonly renderDetail?: (snapshot: StageSnapshot, index: number) => react.ReactNode;
}
declare function TimelinePanel({ title, renderDetail, unstyled, className, style, }: TimelinePanelProps): react.JSX.Element;

interface FlowchartPanelProps extends BaseComponentProps {
    readonly title?: string;
    readonly colors?: Partial<TracedFlowColors>;
}
declare function FlowchartPanel({ title, colors, unstyled, className, style, }: FlowchartPanelProps): react.JSX.Element;

interface ValueInspectorProps extends BaseComponentProps {
    readonly title?: string;
}
declare function ValueInspector({ title, size, unstyled, className, style, }: ValueInspectorProps): react.JSX.Element;

interface CommentaryRenderContext {
    readonly index: number;
    readonly current: boolean;
}
interface CommentaryPanelProps extends BaseComponentProps {
    readonly title?: string;
    readonly maxLines?: number;
    readonly renderEntry?: (entry: NarrativeEntry, context: CommentaryRenderContext) => react.ReactNode;
    readonly emptyMessage?: string;
}
declare function CommentaryPanel({ title, maxLines, renderEntry, emptyMessage, unstyled, className, style, }: CommentaryPanelProps): react.JSX.Element;

interface TimeTravelBarProps extends BaseComponentProps {
    readonly autoPlayable?: boolean;
}
declare function TimeTravelBar({ autoPlayable, size, unstyled, className, style, }: TimeTravelBarProps): react.JSX.Element;

interface CompactTimelinePanelProps extends BaseComponentProps {
    readonly defaultExpanded?: boolean;
}
declare function CompactTimelinePanel({ defaultExpanded, unstyled, className, style, }: CompactTimelinePanelProps): react.JSX.Element;

interface SurfaceCollapseHandleProps {
    readonly label?: string;
    readonly expanded: boolean;
    readonly orientation?: "vertical" | "horizontal";
    readonly onToggle: () => void;
    readonly className?: string;
    readonly style?: react.CSSProperties;
    readonly unstyled?: boolean;
}
declare function SurfaceCollapseHandle({ label, expanded, orientation, onToggle, className, style, unstyled, }: SurfaceCollapseHandleProps): react.JSX.Element;

type ExplainableSurface = "timeTravel" | "timeline" | "stageRail" | "flowchart" | "inspector" | "commentary";
type ExplainableViewPreset = "developer" | "product" | "studio" | "linear";
interface ExplainableLayoutDefinition {
    readonly columns: string;
    readonly rows?: string;
    readonly areas: ReadonlyArray<ReadonlyArray<ExplainableSurface | ".">>;
    readonly minHeight?: number | string;
    readonly gap?: number | string;
}
type ExplainableViewLayout = ExplainableViewPreset | ExplainableLayoutDefinition;
type ExplainableViewSlot = react.ReactNode | ((context: ExplainableRunContextValue) => react.ReactNode);
interface ExplainableViewSlots {
    readonly timeTravel?: ExplainableViewSlot;
    readonly timeline?: ExplainableViewSlot;
    readonly stageRail?: ExplainableViewSlot;
    readonly flowchart?: ExplainableViewSlot;
    readonly inspector?: ExplainableViewSlot;
    readonly commentary?: ExplainableViewSlot;
}
interface ExplainableViewProps extends Omit<ExplainableProviderProps, "children" | "className" | "style">, BaseComponentProps {
    readonly layout?: ExplainableViewLayout;
    readonly slots?: ExplainableViewSlots;
    readonly minHeight?: number | string;
    readonly detailsExpanded?: boolean;
    readonly defaultDetailsExpanded?: boolean;
    readonly onDetailsExpandedChange?: (expanded: boolean) => void;
    readonly detailsLabel?: string;
}
declare function ExplainableView({ recording, selectedIndex, defaultSelectedIndex, onSelectedIndexChange, theme: viewTheme, layout, slots, minHeight, detailsExpanded, defaultDetailsExpanded, onDetailsExpandedChange, detailsLabel, unstyled, className, style, }: ExplainableViewProps): react.JSX.Element;

export { NarrativeEntry as AdapterNarrativeEntry, BaseComponentProps, type CausalFrame, CommentaryPanel, type CommentaryPanelProps, type CommentaryRenderContext, CompactTimeline, CompactTimelinePanel, type CompactTimelinePanelProps, type CompactTimelineProps, DEFAULT_EXCLUDED_KEYS, type DarkModeTokensOptions, DataTracePanel, type DataTracePanelProps, type DefaultExpanded, type DiffEntry, type EntryRangeIndex, type ExplainableLayoutDefinition, ExplainableProvider, type ExplainableProviderProps, type ExplainableRecording, type ExplainableRecordingInput, type ExplainableRunContextValue, ExplainableShell, type ExplainableShellProps, type ExplainableSurface, ExplainableView, type ExplainableViewLayout, type ExplainableViewPreset, type ExplainableViewProps, type ExplainableViewSlot, type ExplainableViewSlots, type ExplainableViewTheme, FlowchartPanel, type FlowchartPanelProps, FootprintTheme, GanttTimeline, type GanttTimelineProps, type InsightConfig, InsightPanel, type InsightPanelProps, InspectorPanel, type InspectorPanelProps, type MemoryChange, MemoryInspector, type MemoryInspectorProps, MemoryPanel, type MemoryPanelProps, NarrativeEntry, NarrativeLog, type NarrativeLogProps, NarrativePanel, type NarrativePanelProps, NarrativeTrace, type NarrativeTraceProps, type PanelLabels, type RecorderView, type Recording, ResultPanel, type ResultPanelProps, RuntimeOverlay, type RuntimeSnapshotInput, ScopeDiff, type ScopeDiffProps, type ShellTab, SnapshotPanel, type SnapshotPanelProps, type StageDetailMode, StageDetailPanel, type StageDetailPanelProps, StageSnapshot, StoryNarrative, type StoryNarrativeProps, SurfaceCollapseHandle, type SurfaceCollapseHandleProps, ThemeMode, ThemeModeProps, type ThemePresetName, type ThemeTokens, TimeTravelBar, type TimeTravelBarProps, TimeTravelControls, type TimeTravelControlsProps, TimelinePanel, type TimelinePanelProps, TraceGraph, type TraceIngredient, type TraceParseError, type TraceStop, type TraceTheme, TraceViewer, type TraceViewerProps, type TraceWalk, TraceWalkCard, type TraceWalkCardProps, type TraceWalkMissing, type TracingRail, ValueInspector, type ValueInspectorProps, buildEntryRangeIndex, buildTraceWalk, computeRevealedEntryCount, coolDark, coolLight, createSnapshots, defaultTokens, extractSubflowNarrative, formatTraceWalk, mergeWritePatch, narrativeFromSnapshot, rawDefaults, subflowResultToSnapshots, themePresets, toVisualizationSnapshots, tokensToCSSVars, useDarkModeTokens, useExplainableRun, useFootprintTheme, warmDark, warmLight };
