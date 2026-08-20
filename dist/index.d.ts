import * as React$1 from 'react';
import { CSSProperties, ReactNode } from 'react';
import { Node, Edge } from '@xyflow/react';

/** Snapshot of a single pipeline stage — the core data shape for all components. */
interface StageSnapshot {
    /** Internal stage identifier */
    stageName: string;
    /** Human-readable label */
    stageLabel: string;
    /** Unique per-execution-step identifier. Format: [subflowPath/]stageId#executionIndex. Key for recorder Map lookup. */
    runtimeStageId?: string;
    /** Accumulated memory state after this stage ran */
    memory: Record<string, unknown>;
    /** Narrative text describing what happened */
    narrative: string;
    /** When this stage started (ms from pipeline start) */
    startMs: number;
    /** How long this stage took (ms) */
    durationMs: number;
    /** Execution status */
    status?: "pending" | "active" | "done" | "error";
    /** Human-readable description of what this stage does */
    description?: string;
    /** Subflow identifier (when this stage is inside a subflow) */
    subflowId?: string;
    /** Subflow execution result — present on stages that ran a subflow. */
    subflowResult?: unknown;
}
/** Structured narrative entry — preserves type info for semantic rendering. */
interface NarrativeEntry {
    type: 'stage' | 'step' | 'condition' | 'fork' | 'selector' | 'subflow' | 'loop' | 'break' | 'error' | 'pause' | 'resume' | 'emit'
    /** One failed attempt at a stage that declares a `retry` policy — the
     *  stage is about to run again. Attempt telemetry, not an outcome: the
     *  stage may still succeed, so this is warning-weight, not error-weight.
     *  Emitted by footprintjs >= 9.15.0, nested inside its own stage. */
     | 'retry';
    text: string;
    depth: number;
    stageName?: string;
    /** Stable stage identifier (matches spec node id). Primary key for UI sync. */
    stageId?: string;
    /** Unique per-execution-step identifier. Format: [subflowPath/]stageId#executionIndex.
     *  Used for exact time-travel sync (preferred over stageId for progressive reveal). */
    runtimeStageId?: string;
    /** Subflow ID when this entry was generated inside a subflow. */
    subflowId?: string;
    /** Direction for subflow entries: 'entry' when entering, 'exit' when leaving. */
    direction?: 'entry' | 'exit';
    stepNumber?: number;
    /** Scope key that was read or written. Only present on 'step' entries. */
    key?: string;
    /** Raw value from the scope event. Only present on 'step' entries. */
    rawValue?: unknown;
}
/** Component size variants */
type Size = "compact" | "default" | "detailed";
/** Common props shared by all visualization components */
interface BaseComponentProps {
    /** Size variant */
    size?: Size;
    /** Strip all built-in styles — bring your own */
    unstyled?: boolean;
    /** Additional CSS class name */
    className?: string;
    /** Inline style overrides */
    style?: React.CSSProperties;
}

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
declare function FootprintTheme({ tokens, children }: FootprintThemeProps): React$1.JSX.Element;

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

/**
 * The one-word theme switch.
 *
 * Every component in this library paints from `--fp-*` variables whose
 * built-in fallbacks are DARK. Mounted inside a light app with nothing set,
 * a panel renders dark — correct by the rules, wrong on the page. Setting a
 * dozen variables by hand to fix that is not a first-try experience.
 *
 * `<Component theme="light" />` is that fix in one word: it stamps a full
 * preset as inline `--fp-*` variables on the component's own root, so
 * everything under it — including nested children — follows. It is the same
 * mechanism `<ExplainableShell traceTheme={{ mode }}>` uses; this module is
 * the single place that maps a mode to its palette.
 *
 * Precedence, from weakest to strongest:
 *   1. the components' hard-coded fallbacks (dark)
 *   2. `--fp-*` an ancestor sets (`<FootprintTheme>`, your own CSS)
 *   3. `theme="light" | "dark"` on the component  ← wins, because it is local
 *
 * So `theme` is a per-component override, not a replacement for
 * `<FootprintTheme tokens={...}>` — reach for the provider when you want one
 * palette for a whole tree, and for a custom palette rather than a preset.
 */

/** Light or dark. The whole switch. */
type ThemeMode = "dark" | "light";
/** Props mixin for components that accept the switch. */
interface ThemeModeProps {
    /**
     * Light or dark, in one word — applies the built-in preset as `--fp-*`
     * variables on this component's root. Omit to inherit whatever the page
     * (or a `<FootprintTheme>` ancestor) already set.
     */
    theme?: ThemeMode;
}
/**
 * CSS variables for a mode, ready to spread into a root element's `style`.
 * Returns `{}` for `undefined` so an unthemed component is byte-identical to
 * how it rendered before the prop existed.
 */
declare function themeModeVars(mode?: ThemeMode): CSSProperties;

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
declare function MemoryInspector({ data, snapshots, selectedIndex, showTypes, highlightNew, size, unstyled, className, style, }: MemoryInspectorProps): React$1.JSX.Element;

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
declare function NarrativeLog({ snapshots, selectedIndex, narrative, size, unstyled, className, style, }: NarrativeLogProps): React$1.JSX.Element;

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
declare function NarrativeTrace({ narrative, revealedCount, defaultCollapsed, onStageClick, size, unstyled, className, style, }: NarrativeTraceProps): React$1.JSX.Element;

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
declare function GanttTimeline({ snapshots, selectedIndex, onSelect, size, unstyled, className, style, theme: themeMode, maxVisibleRows, }: GanttTimelineProps): React$1.JSX.Element;

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
declare function SnapshotPanel({ snapshots, showGantt, showScrubber, title, size, unstyled, className, style, theme: themeMode, }: SnapshotPanelProps): React$1.JSX.Element;

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
declare function ScopeDiff({ previous, current, hideUnchanged, size, unstyled, className, style, }: ScopeDiffProps): React$1.JSX.Element;

interface ResultPanelProps extends BaseComponentProps {
    /** Final pipeline output / shared state */
    data: Record<string, unknown> | null;
    /** Optional console log lines */
    logs?: string[];
    /** Hide console section (default: false) */
    hideConsole?: boolean;
}
declare function ResultPanel({ data, logs, hideConsole, size, unstyled, className, style, }: ResultPanelProps): React$1.JSX.Element;

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
declare function StageDetailPanel({ snapshots, selectedIndex, mode: controlledMode, showToggle, onModeChange, excludeKeys, size, unstyled, className, style, }: StageDetailPanelProps): React$1.JSX.Element;

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
declare function TimeTravelControls({ snapshots, selectedIndex, onIndexChange, autoPlayable, tracing, size, unstyled, className, style, }: TimeTravelControlsProps): React$1.JSX.Element;

/**
 * One entry in the execution timeline. `<TracedFlow>` keys time-travel
 * scrubbing on the index into this array — at index `i`, all entries
 * `0..i-1` are "done", entry `i` is "active".
 */
interface RuntimeExecutionStep {
    /** `[subflowPath/]stageId#executionIndex` — universal key. */
    readonly runtimeStageId: string;
    /** Base stage id (without `#N`) — matches the `TraceGraph` node id. */
    readonly stageId: string;
    /** Human-readable label (from event.stageName). */
    readonly stageName: string;
    /** When this step recorded, in ms since recorder start. */
    readonly timestampMs: number;
}
interface RuntimeOverlay {
    /** Ordered execution history — drives time-travel scrubbing. */
    readonly executionOrder: readonly RuntimeExecutionStep[];
    /** Per-base-stageId error message (most-recent wins). */
    readonly errors: ReadonlyMap<string, string>;
    /** True after `onRunStart` until `onRunEnd` — useful for "still running" indicators. */
    readonly running: boolean;
    /**
     * How many times each stage EXECUTION was attempted, keyed by
     * `runtimeStageId` — present only for executions that took more than one
     * attempt (a declared `retry` policy that actually fired).
     *
     * NOT a new axis. footprintjs runs every attempt of a stage under ONE
     * runtimeStageId and commits ONE bundle for it, so a retried stage is one
     * stop on the rail, not three. This map is per-NODE state hanging off that
     * single stop — read it to paint an attempt badge, never to add a step.
     *
     * Optional so an overlay hand-built by a consumer (or produced by an older
     * version of this library) stays type-valid; absent means "nothing known
     * about attempts", which is exactly how a run with no retry policy looks.
     */
    readonly retryAttempts?: ReadonlyMap<string, number>;
}

/**
 * Branded types for translator key discipline.
 *
 * The footprintjs/trace contract uses two distinct identity strings:
 *
 *   - **StageId**: the stable identifier the user picks at build time
 *     (e.g. `'load-order'`, `'check-inventory'`). Identity per chart spec.
 *
 *   - **RuntimeStageId**: `[subflowPath/]stageId#executionIndex` — the
 *     per-execution identity. A loop visiting the same stage 3 times
 *     produces 3 distinct RuntimeStageIds with the same StageId base.
 *
 * Translator outputs index per-stage data by StageId (`Map<StageId, ...>`)
 * AND per-execution data by RuntimeStageId (`Map<RuntimeStageId, ...>`).
 * Both are `string` at runtime — TypeScript can't distinguish them
 * without help. Branded types make `byStageId.get(runtimeStageId)` a
 * **compile-time error** instead of a silent `undefined` at runtime.
 *
 * Why branded types over wrapper classes
 * ──────────────────────────────────────
 *   - Zero runtime cost (the brand exists only at the type level)
 *   - JSON-serializable as-is (no `toJSON` glue needed)
 *   - Interop with consumer code that uses raw `string` is one cast
 *     (`stageId as StageId`) when the consumer is sure of the source.
 *
 * Usage pattern
 * ─────────────
 * ```ts
 * import type { StageId, RuntimeStageId } from './_internal/keys';
 *
 * // In a translator, when accepting input from a footprintjs event:
 * const sid = event.stageId as StageId;
 * const rsid = event.traversalContext.runtimeStageId as RuntimeStageId;
 *
 * // In a consumer reading from the index:
 * const node = index.byStageId.get(stageId);          // typechecks
 * const node = index.byStageId.get(runtimeStageId);   // TS ERROR ✓
 * ```
 *
 * Helper to derive a StageId from a RuntimeStageId — strips `#N` suffix
 * and optional subflow path. **Use only for DISPLAY**, NEVER for matching
 * commitLog stageIds (see invariant I3 in `traceStructureRecorder.ts`).
 */
/** Stable per-spec identifier (e.g. `'load-order'`). */
type StageId = string & {
    readonly __brand: "StageId";
};

/**
 * traceStructureRecorder — event-driven xyflow Node[] + Edge[] collector.
 *
 * Implements footprintjs v6.0+ `StructureRecorder` interface. Accumulates
 * an unpositioned graph (xyflow node + edge shape) as the chart is being
 * built — no spec tree walk required.
 *
 * Why event-driven
 * ────────────────
 *   The recorder fires SYNCHRONOUSLY at every spec-mutation moment during
 *   construction. By the time `.build()` returns, the recorder's
 *   `getGraph()` returns the complete graph — zero extra walking
 *   (the "collect during traversal, never post-process" rule footprintjs
 *   documents in its core principle).
 *
 *   Bonus: the same recorder shape can drive incremental UI updates if
 *   the builder is constructed asynchronously (e.g., a UI builder where
 *   each "add stage" click re-renders the live graph).
 *
 * Layout is a separate concern
 * ────────────────────────────
 *   This module produces UNPOSITIONED nodes (no `position` field set;
 *   xyflow defaults to `{x: 0, y: 0}`). Apply a layout algorithm
 *   downstream — either:
 *
 *     - a graph algorithm (dagre / elk / d3-force)
 *     - manual positioning via your own walk over `recorder.getGraph()`
 *
 *   The `<TraceFlow>` component wires a default BFS layout.
 *
 * @example
 * ```ts
 * import { flowChart } from 'footprintjs';
 * import { createTraceStructureRecorder } from 'footprint-explainable-ui/flowchart';
 *
 * const trace = createTraceStructureRecorder();
 * const chart = flowChart('seed', fn, 'seed', {
 *   structureRecorders: [trace.recorder],
 * })
 *   .addFunction('a', fnA, 'a')
 *   .build();
 *
 * const { nodes, edges } = trace.getGraph();
 * // → nodes: [{ id: 'seed', data: { label: 'seed', ... } }, { id: 'a', ... }]
 * // → edges: [{ id: 'seed->a', source: 'seed', target: 'a', data: { kind: 'next' } }]
 *
 * <ReactFlow nodes={layout(nodes)} edges={edges} />
 * ```
 */

type EdgeKind = "next" | "fork-branch" | "decision-branch";
/**
 * Per-node data attached to the xyflow `Node`. The built-in `StageNode`
 * renderer reads the named fields below.
 *
 * Consumer extension: this type EXTENDS `Record<string, unknown>` so
 * you can attach custom fields without TypeScript fighting you. Pair
 * this with `<TraceFlow nodeTypes={{ stageNode: MyNode }} />` (or push
 * nodes with `type: 'myCustomKind'`) to render those custom fields
 * however you want. The built-in `StageNode` ignores fields it doesn't
 * recognize, so adding consumer fields is non-breaking even if you
 * keep the default renderer.
 */
interface TraceNodeData extends Record<string, unknown> {
    label: string;
    isDecider: boolean;
    isFork: boolean;
    isSubflow: boolean;
    /** True when the event carried `type: 'streaming'` (the spec was added
     *  via `addStreamingFunction`). Renderers that style streaming stages
     *  distinctly key on this flag. */
    isStreaming: boolean;
    description?: string;
    icon?: string;
    subflowId?: string;
    isLazy?: boolean;
    isPausable?: boolean;
    /** Visual emphasis hint — `hero` (prominent) / `muted` (recedes). Set by
     *  the consumer's graph builder from its own semantics; the renderer styles
     *  off it without any domain knowledge. */
    emphasis?: "hero" | "muted";
    /** Size tier — scales the card; must match the layout's node-size resolver. */
    size?: "sm" | "md" | "lg";
    /** Set later by `onDeciderComplete` when the decider's branch list is
     *  sealed. Useful for renderers that want to render decider with a
     *  branch-count badge. */
    branchIds?: readonly string[];
    defaultBranch?: string;
    /**
     * The subflow this node belongs to, OR `undefined` for top-level
     * parent-chart stages. Tracked via a stack-based heuristic during
     * event ingestion:
     *
     *   - Push on `onSubflowMounted({subflowId, rootStageId})` →
     *     top-of-stack = `{subflowId, mountStageId}`
     *   - `onStageAdded` tags new nodes with the top-of-stack `subflowId`
     *     (the mount node itself stays UNtagged — it's part of the parent
     *     chain)
     *   - Pop on `onEdgeAdded` where `from === mount.id` (a mount's
     *     outgoing edge to a sibling means the parent chain has resumed);
     *     the wrongly-tagged target node is re-tagged to the parent scope
     *
     * Mount nodes (where `isSubflow=true`) have `subflowOf` reflecting
     * their OWN parent context, NOT the subflow they mount. So a parent's
     * mount node has `subflowOf=undefined` (top-level parent), and the
     * subflow's INTERNAL stages have `subflowOf=<mount.subflowId>`.
     *
     * Renderers use this to filter the chart by drill-down level: show
     * only nodes where `subflowOf === currentDrillSubflowId` (undefined
     * for top-level view, mount.subflowId after drilling in).
     */
    subflowOf?: string;
    /**
     * **L8.0 — STRUCTURAL prev/next**: stage ids that lead into / out of
     * this node, derived live from incoming/outgoing edges. Excludes
     * `loop` back-edges (visual only — per invariant I1).
     *
     * Convergence-correct: a fork-join node carries an ENTRY per branch
     * child (e.g., `FinalizeOrder.prevIds = ['CheckInventory', 'RunFraudCheck']`).
     *
     * "Structural" qualifier: this is the chart-SHAPE prev/next, not
     * runtime execution order. For runtime ancestry use `CommitView`
     * fields on `CommitFlowIndex` (L8.2).
     */
    prevIds: StageId[];
    nextIds: StageId[];
}
/**
 * Per-edge data attached to the xyflow `Edge`. The default edge
 * renderer reads `kind` (and `label`).
 *
 * Consumer extension: same pattern as `TraceNodeData` — extra fields
 * pass through unchanged. Pair with `<TraceFlow edgeTypes={...} />`
 * to render custom edges (e.g., a "retried" edge with a count badge).
 */
interface TraceEdgeData extends Record<string, unknown> {
    kind: EdgeKind | "loop";
    label?: string;
    /**
     * Node ids this edge CONTRACTED THROUGH — stamped by `collapseTraceGraph`
     * when hidden nodes are removed and their paths re-connected. Lets a
     * renderer keep a time cursor visible when it stands on a hidden node:
     * the edge that stands in for that node lights instead (see
     * `edgeCarriesCursor`). Absent on ordinary edges.
     */
    via?: readonly string[];
}
type TraceNode = Node<TraceNodeData>;
type TraceEdge = Edge<TraceEdgeData>;
interface TraceGraph {
    nodes: TraceNode[];
    edges: TraceEdge[];
}

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
declare function ExplainableShell({ snapshots: snapshotsProp, runtimeSnapshot, title, resultData: resultDataProp, logs, narrativeEntries: narrativeEntriesProp, tabs: deprecatedTabs, defaultTab, hideConsole, hideTabs: hideTabsProp, panelLabels, defaultExpanded, recorderViews, renderFlowchart, showStageId, traceGraph, runtimeOverlay: runtimeOverlayProp, traceTheme, size, unstyled, className, style, }: ExplainableShellProps): React$1.JSX.Element;

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
    readonly fallback?: React$1.ReactNode;
}
declare function TraceViewer({ recording, trace, onError, fallback, tabs, defaultTab, hideTabs, size, panelLabels, recorderViews, renderFlowchart, traceTheme, theme: themeMode, }: TraceViewerProps): React$1.ReactElement | null;

interface MemoryPanelProps extends BaseComponentProps {
    snapshots: StageSnapshot[];
    selectedIndex: number;
}
declare function MemoryPanel({ snapshots, selectedIndex, size, unstyled, className, style, }: MemoryPanelProps): React$1.JSX.Element;

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
declare function NarrativePanel({ snapshots, selectedIndex, narrativeEntries, scopeSubflowId, runtimeSnapshot, spec, size, unstyled, className, style, }: NarrativePanelProps): React$1.JSX.Element;

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
declare function StoryNarrative({ entries, revealedEntryCount, scopeSubflowId, size, unstyled, className, style: outerStyle, }: StoryNarrativeProps): React$1.JSX.Element;

interface SubflowTreeEntry {
    /** Node name / identifier */
    name: string;
    /** Human-readable description */
    description?: string;
    /**
     * The mount node's id in the graph — the DRILL KEY. Unique even when the
     * same child chart is mounted twice, which `subflowId` and `name` are not
     * (see `_internal/subflowDrill.ts`). Hosts should drill with this.
     */
    nodeId?: string;
    /** Subflow ID (when this node represents a subflow) */
    subflowId?: string;
    /** Whether this node is a subflow root (has nested structure) */
    isSubflow?: boolean;
    /** Nested children (subflow stages) — always undefined in the
     *  current recorder-driven implementation; see file-level TODO. */
    children?: SubflowTreeEntry[];
}
interface SubflowTreeProps extends BaseComponentProps {
    /** Recorder-captured graph from `createTraceStructureRecorder().getGraph()`. */
    graph: TraceGraph;
    /** Currently active stage name (highlights in tree) */
    activeStage?: string | null;
    /** Set of completed stage names */
    doneStages?: Set<string>;
    /**
     * Called when a tree node is clicked. `nodeId` is the mount node's graph id
     * — the unambiguous drill key. Prefer it over `name`: two mounts of the
     * same child chart share a label, so drilling by name lands on whichever
     * one happens to be found first.
     */
    onNodeSelect?: (name: string, isSubflow: boolean, nodeId?: string) => void;
}
declare const SubflowTree: React$1.NamedExoticComponent<SubflowTreeProps>;

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
    executionTree: RuntimeStageSnapshot;
    commitLog: unknown[];
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
 * Deep-merges a net-change write PATCH into a base value for the
 * cumulative-memory VIEW — the visualization-side mirror of footprintjs's
 * `deepSmartMerge` (the `merge`-verb arm of `applySmartMerge`).
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
 * overlayFromSnapshot — the runtime overlay, rebuilt from a FROZEN snapshot.
 *
 * `<TracedFlow>` colours its chart from ONE input: the `RuntimeOverlay`
 * (TracedFlow.tsx → `sliceOverlay`). Until now the only way to get one was
 * to attach `createTraceRuntimeOverlay()` to a LIVE executor — so a
 * consumer replaying a recording (a saved `executor.getSnapshot()`, a
 * shipped demo, a bug report pasted into a viewer) had a rail, a memory
 * panel and a narrative but a dead, uncoloured chart.
 *
 * Nothing about the overlay needs to be live: `snapshot.commitLog` already
 * holds the execution order. Bundles are appended in execution order
 * (`bundle.idx` == array position) and one stage execution can emit MORE
 * than one bundle (a subflow mount commits its outputMapper result, then a
 * boundary bundle), so we dedupe by `runtimeStageId` keeping the FIRST —
 * the same dedupe the live recorder does on `onStageExecuted`.
 *
 * ```ts
 * const snapshot = JSON.parse(await fs.readFile('run.json', 'utf8'));
 * <ExplainableShell
 *   runtimeSnapshot={snapshot}
 *   traceGraph={graph}
 *   runtimeOverlay={overlayFromSnapshot(snapshot)}   // ← chart lights up
 * />
 * ```
 *
 * What it CANNOT know (honest absence — never fabricated)
 * ──────────────────────────────────────────────────────
 *   - **`timestampMs` is 0 on every step.** Commit bundles carry no
 *     wall clock. The field is display-only — `sliceOverlay` and
 *     `<TracedFlow>` never read it — so 0 is the honest value, not a
 *     guess. For real timings attach footprintjs's metrics recorder;
 *     `toVisualizationSnapshots` reads those into `StageSnapshot.durationMs`.
 *   - **`errors` is empty.** The commit log has no error channel; a
 *     failing stage's writes land (footprintjs commits before rethrow)
 *     but the message does not. Error painting needs the live recorder.
 *   - **`running` is false.** A recording is a finished run by definition.
 *   - **Retry attempts need the narrative.** A retried attempt commits
 *     nothing (footprintjs discards a failed attempt's staged writes), so
 *     the commit log cannot know a stage was attempted more than once. Pass
 *     the run's `narrativeEntries` — it records one `type: 'retry'` entry per
 *     failed attempt, stamped with the stage's runtimeStageId — and the
 *     rebuilt overlay carries the same `retryAttempts` a live recorder would
 *     have accumulated. Omit them and attempts are absent, not guessed.
 *   - **Subflow-internal steps are absent when the engine isolated them.**
 *     footprintjs keeps deep-subflow commits out of the run-level
 *     commitLog by design, so a recording of a chart with subflows yields
 *     overlay steps for the MOUNT stages, not their internals — the same
 *     stages the snapshot's own rail (`toVisualizationSnapshots`) shows.
 *     A live `createTraceRuntimeOverlay` sees both.
 */

/** Duck-typed input: any object carrying a footprintjs commit log —
 *  a whole `executor.getSnapshot()` or just `{ commitLog }`. */
interface SnapshotWithCommitLog {
    commitLog?: unknown;
}
/** The slice of a narrative entry this reader consumes — duck-typed so both
 *  footprintjs's `CombinedNarrativeEntry` and this library's `NarrativeEntry`
 *  fit without either side importing the other. */
interface NarrativeEntryLike {
    type?: unknown;
    runtimeStageId?: unknown;
}
interface OverlayFromSnapshotOptions {
    /**
     * The run's narrative entries — `executor.getNarrativeEntries()`, or a
     * recording's `narrativeEntries`. The ONLY post-hoc source of retry facts:
     * `onStageRetry` fires during a stage and leaves no trace in the commit
     * log, but the narrative keeps one `type: 'retry'` entry per failed
     * attempt. Optional: without it the overlay simply carries no attempt
     * facts (honest absence — never a guess).
     */
    readonly narrativeEntries?: readonly NarrativeEntryLike[] | null;
}
/**
 * Builds a `RuntimeOverlay` from a recorded run — the post-hoc twin of
 * `createTraceRuntimeOverlay()`. Pass the result straight to
 * `<TracedFlow overlay={...}>` or `<ExplainableShell runtimeOverlay={...}>`.
 *
 * Returns an empty overlay (no steps) for a missing or empty commit log —
 * an unrecorded run colours nothing, which is the truthful rendering.
 */
declare function overlayFromSnapshot(snapshot: SnapshotWithCommitLog | null | undefined, options?: OverlayFromSnapshotOptions): RuntimeOverlay;

/**
 * graphFromStructure — the chart, rebuilt from a SAVED structure.
 *
 * `createTraceStructureRecorder` collects the chart while footprintjs
 * BUILDS it. This is its post-hoc twin: hand it the `buildTimeStructure`
 * a chart carries (`chart.buildTimeStructure`, plain JSON) and it produces
 * the same `TraceGraph` — no builder, no live process, no agent framework.
 *
 * Why it exists
 * ─────────────
 * A recording is three things: `events`, `snapshot`, and `structure`.
 * The snapshot draws the memory panel, the story and the rail; only the
 * structure can draw the CHART. Until now the one spec→graph adapter in
 * the ecosystem was `structureGraphFromSpec` in `agentfootprint-lens`,
 * which reaches into `agentfootprint` for agent vocabulary — so a plain
 * footprintjs consumer had to install an agent framework to draw a saved
 * pipeline run. This is that adapter, with no agent semantics.
 *
 * ```ts
 * // Recording side (in the app that ran the pipeline):
 * const recording = {
 *   snapshot:  executor.getSnapshot(),
 *   structure: chart.buildTimeStructure,   // ← the chart. Nothing else can draw it.
 * };
 *
 * // Rendering side, anywhere later:
 * <ExplainableShell
 *   runtimeSnapshot={recording.snapshot}
 *   traceGraph={graphFromStructure(recording.structure)}
 * />
 * ```
 *
 * Same graph, same ids
 * ────────────────────
 * Node ids are the chart's own stage ids at the top level and
 * `subflowPath/stageId` inside a subflow — byte-identical to the live
 * recorder, which is what lets the runtime overlay (live OR
 * `overlayFromSnapshot`) light the right boxes. The events are replayed
 * into `createTraceStructureRecorder` itself rather than re-implemented,
 * so the two paths cannot drift: one graph builder, two front doors.
 *
 * What a saved structure cannot carry (honest absence — never invented)
 * ────────────────────────────────────────────────────────────────────
 *   - **A decider's `defaultBranch`.** footprintjs's live
 *     `onDeciderComplete` event names the fallback branch, but
 *     `SerializedPipelineStructure` has no field for it, so a rebuilt
 *     decider node carries `branchIds` without `defaultBranch`. Renderers
 *     that badge the default simply don't badge it.
 *   - **A lazy subflow's internals.** `isLazy` mounts resolve at run time;
 *     the saved structure holds the mount node alone, exactly as the live
 *     recorder saw it at build time.
 */

/**
 * The slice of footprintjs's `SerializedPipelineStructure` this walker
 * reads. Duck-typed on purpose — explainable-ui declares no `footprintjs`
 * dependency (see traceStructureRecorder.ts for the boundary rationale).
 */
interface SerializedStructureNode {
    readonly id: string;
    readonly name: string;
    readonly type?: "stage" | "decider" | "selector" | "fork" | "streaming" | "subflow" | "loop";
    readonly description?: string;
    readonly icon?: string;
    readonly hasDecider?: boolean;
    readonly hasSelector?: boolean;
    readonly branchIds?: readonly string[];
    readonly children?: readonly SerializedStructureNode[];
    readonly next?: SerializedStructureNode;
    readonly loopTarget?: string;
    readonly isLoopReference?: boolean;
    readonly isSubflowRoot?: boolean;
    readonly subflowId?: string;
    readonly subflowName?: string;
    readonly subflowStructure?: SerializedStructureNode;
    readonly isLazy?: boolean;
    readonly isPausable?: boolean;
    /** Structure-only: this branch rejoins at its OWN named stage instead of
     *  the shared convergence stage (an unequal-depth merge). */
    readonly convergeAt?: string;
    readonly [key: string]: unknown;
}
/**
 * Builds the chart's `TraceGraph` from a serialized `buildTimeStructure`.
 *
 * Pass the result to `<ExplainableShell traceGraph={...}>` or
 * `<TracedFlow graph={...}>`. Returns an EMPTY graph (`{nodes: [], edges: []}`)
 * when the input isn't a structure — a recording saved without its
 * structure draws no chart, which is the truthful rendering. Check
 * `graph.nodes.length` if you want to branch on that.
 */
declare function graphFromStructure(structure: unknown): TraceGraph;

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
declare const DataTracePanel: React$1.NamedExoticComponent<DataTracePanelProps>;

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
declare const InspectorPanel: React$1.NamedExoticComponent<InspectorPanelProps>;

/**
 * traceWalk — the SAME-RAIL REWIND walk: a variable-anchored backward slice,
 * linearized in REVERSE COMMIT ORDER so it can be driven by the existing
 * time slider ("◀ earlier cause" stop by stop).
 *
 * THE LOAD-BEARING FACT (why one linear walk can cover a DAG): every
 * dependency was committed strictly EARLIER than the value derived from it,
 * so a backward slice is always a sub-sequence of the run's timeline — and
 * sorting its frames by commitIdx DESCENDING is a valid topological order.
 * One monotone "earlier" button therefore visits EVERY frame, including
 * both parents of a fork, with no branch-choosing UI and no second cursor.
 *
 * FORKS are explained, not navigated: each stop carries its `ingredients`
 * (the read keys + who wrote each), so a 2-parent value shows both chips;
 * "follow one ingredient" is a RE-ANCHORED walk (same function, key = the
 * ingredient, before = this stop) — never a special traversal mode.
 *
 * HONEST ABSENCE, two truthful sentences (they are different facts):
 *   'never-written'   — no commit in the WHOLE log wrote the key: it came
 *                       in with the run's inputs.
 *   'not-yet-written' — a later commit writes it, but none at or before
 *                       the cutoff: "not yet" is not "never".
 *
 * Shares the read→write BFS with dataTrace.ts (the causalChain mirror);
 * eui still never imports footprintjs — snapshot SHAPES only.
 */
/** One read key of a stop, resolved to the commit that wrote it. */
interface TraceIngredient {
    key: string;
    /** null = no commit before this stop wrote the key (a run-input terminus). */
    writerRuntimeStageId: string | null;
    writerStageName: string | null;
    writerCommitIdx: number | null;
}
/** One stop on the rewind rail — a slice frame with its rail position. */
interface TraceStop {
    runtimeStageId: string;
    stageId: string;
    stageName: string;
    /** Position in the commit log — the stop's place on the time rail. */
    commitIdx: number;
    /** The slice keys DOWNSTREAM members read from this stop (what it
     *  contributed to the traced value). The anchor contributes the traced
     *  key itself. */
    contributedKeys: string[];
    keysWritten: string[];
    ingredients: TraceIngredient[];
    /** BFS hop distance from the anchor (tooltip-grade info, NOT the walk
     *  order — the walk order is time). */
    depth: number;
    /** 1-based pass number when the same stage appears more than once in
     *  the walk (loop iterations); 0 = appears once. */
    loopPass: number;
}
interface TraceWalkMissing {
    reason: "never-written" | "not-yet-written";
    /** For 'not-yet-written': where the FIRST write actually happens. */
    firstWriteCommitIdx?: number;
    firstWriterRuntimeStageId?: string;
    firstWriterStageName?: string;
}
interface TraceWalk {
    key: string;
    /** Stops in WALK ORDER: commitIdx DESCENDING. stops[0] is the anchor
     *  (the last writer of `key` within the cutoff). */
    stops: TraceStop[];
    /** Non-null ⇒ zero stops: the honest-absence card, not an empty chain. */
    missing: TraceWalkMissing | null;
    /** Read keys that NO commit ever wrote — the run's inputs ("came in the
     *  door"), deduped, in first-encounter order. */
    inputTermini: string[];
    /** False when the snapshot recorded no reads anywhere — the chain is
     *  UNKNOWABLE (not absent) beyond the anchor. */
    readsAvailable: boolean;
    /** True when the underlying slice hit its frame/depth budget — the
     *  earliest stop may not be the true origin. */
    truncated: boolean;
}
/**
 * Build the rewind walk for `key`.
 *
 * `beforeCommitIdx` (EXCLUSIVE) scopes the question to "the value as it
 * stood before that moment" — it is also how ingredient-following works:
 * follow ingredient K at stop S = buildTraceWalk(K, { beforeCommitIdx:
 * S.commitIdx }) — one function, no traversal modes.
 */
declare function buildTraceWalk(commitLog: unknown[], executionTree: unknown, key: string, opts?: {
    beforeCommitIdx?: number;
    maxDepth?: number;
    maxFrames?: number;
}): TraceWalk;
/**
 * formatTraceWalk — THE parity artifact: the [Copy story] button and any
 * LLM backtrack tool emit THIS string, so the human's board and the
 * agent's answer are the same text, not two translations.
 *
 * `stepNumberOf` maps a runtimeStageId to the 1-based step number shown on
 * the rail (null = not on the rail); walk order and wording match the
 * stop cards exactly.
 */
declare function formatTraceWalk(walk: TraceWalk, stepNumberOf: (runtimeStageId: string) => number | null): string;

interface TraceWalkCardProps extends BaseComponentProps {
    walk: TraceWalk;
    /** The ONE cursor — the card highlights its stop; null falls back to the anchor. */
    cursorRuntimeStageId: string | null;
    /** Active ingredient filter (breadcrumb "▸ via key"). */
    viaKey?: string | null;
    /** Map a stop to its 1-based rail step number (null = not on this rail). */
    stepNumberOf: (runtimeStageId: string) => number | null;
    /** Value preview for a contributed key at the current stop (the shell
     *  reads snapshot.memory — state as of that moment). */
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
declare const TraceWalkCard: React$1.NamedExoticComponent<TraceWalkCardProps>;

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
declare const InsightPanel: React$1.NamedExoticComponent<InsightPanelProps>;

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
declare const CompactTimeline: React$1.NamedExoticComponent<CompactTimelineProps>;

/**
 * TracedFlow — runtime-overlay variant of `<TraceFlow>`.
 *
 * Pairs a build-time `TraceGraph` (from `createTraceStructureRecorder`)
 * with a runtime `RuntimeOverlay` (from `createTraceRuntimeOverlay`)
 * and a scrub index → renders an xyflow chart with per-node coloring
 * (done / active / error), per-edge highlighting (executed paths),
 * loop-edge side-routing, and subflow drill-down.
 *
 * The component is orchestration only. Each responsibility lives in
 * an extracted helper / hook (see `_internal/`):
 *
 *   - drill state .................. useSubflowDrill
 *   - container resize → fitView ... useChartAutoRefit
 *   - graph filtering by drill ..... filterGraphForDrill
 *   - breadcrumb path .............. buildSubflowBreadcrumb
 *   - slice id normalization ....... normalizeSliceLeafIds
 *   - mount status aggregation ..... aggregateMountStatus
 *   - node / edge styling .......... toStageNodeWithOverlay + styleEdgeWithOverlay
 *   - breadcrumb UI ................ <SubflowBreadcrumbBar>
 *
 * @example
 * ```tsx
 * const trace = useMemo(() => createTraceStructureRecorder(), []);
 * const runtime = useMemo(() => createTraceRuntimeOverlay(), []);
 * // ... attach both to executor, run the chart ...
 * <TracedFlow
 *   graph={trace.getGraph()}
 *   overlay={runtime.getOverlay()}
 *   scrubIndex={sliderValue}
 *   onNodeClick={(stageId) => focusStage(stageId)}
 *   onSubflowChange={(mountId) => syncShellDrill(mountId)}
 * />
 * ```
 */

interface TracedFlowColors {
    /** Default (un-executed) node text + edge stroke. */
    default: string;
    /** Done — visually de-emphasised (lighter). */
    done: string;
    /** Active — current scrub position. */
    active: string;
    /** Error — node with recorded onError. */
    error: string;
    /** Loop back-edge color. */
    loop: string;
}

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
    readonly children: React$1.ReactNode;
    readonly className?: string;
    readonly style?: React$1.CSSProperties;
}
declare function ExplainableProvider({ recording: input, selectedIndex: controlledIndex, defaultSelectedIndex, onSelectedIndexChange, theme, children, className, style, }: ExplainableProviderProps): React$1.JSX.Element;
declare function useExplainableRun(): ExplainableRunContextValue;

interface TimelinePanelProps extends BaseComponentProps {
    readonly title?: string;
    readonly renderDetail?: (snapshot: StageSnapshot, index: number) => React$1.ReactNode;
}
declare function TimelinePanel({ title, renderDetail, unstyled, className, style, }: TimelinePanelProps): React$1.JSX.Element;

interface FlowchartPanelProps extends BaseComponentProps {
    readonly title?: string;
    readonly colors?: Partial<TracedFlowColors>;
}
declare function FlowchartPanel({ title, colors, unstyled, className, style, }: FlowchartPanelProps): React$1.JSX.Element;

interface ValueInspectorProps extends BaseComponentProps {
    readonly title?: string;
}
declare function ValueInspector({ title, size, unstyled, className, style, }: ValueInspectorProps): React$1.JSX.Element;

interface CommentaryRenderContext {
    readonly index: number;
    readonly current: boolean;
}
interface CommentaryPanelProps extends BaseComponentProps {
    readonly title?: string;
    readonly maxLines?: number;
    readonly renderEntry?: (entry: NarrativeEntry, context: CommentaryRenderContext) => React$1.ReactNode;
    readonly emptyMessage?: string;
}
declare function CommentaryPanel({ title, maxLines, renderEntry, emptyMessage, unstyled, className, style, }: CommentaryPanelProps): React$1.JSX.Element;

interface TimeTravelBarProps extends BaseComponentProps {
    readonly autoPlayable?: boolean;
}
declare function TimeTravelBar({ autoPlayable, size, unstyled, className, style, }: TimeTravelBarProps): React$1.JSX.Element;

interface CompactTimelinePanelProps extends BaseComponentProps {
    readonly defaultExpanded?: boolean;
}
declare function CompactTimelinePanel({ defaultExpanded, unstyled, className, style, }: CompactTimelinePanelProps): React$1.JSX.Element;

interface SurfaceCollapseHandleProps {
    readonly label?: string;
    readonly expanded: boolean;
    readonly orientation?: "vertical" | "horizontal";
    readonly onToggle: () => void;
    readonly className?: string;
    readonly style?: React$1.CSSProperties;
    readonly unstyled?: boolean;
}
declare function SurfaceCollapseHandle({ label, expanded, orientation, onToggle, className, style, unstyled, }: SurfaceCollapseHandleProps): React$1.JSX.Element;

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
type ExplainableViewSlot = React$1.ReactNode | ((context: ExplainableRunContextValue) => React$1.ReactNode);
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
declare function ExplainableView({ recording, selectedIndex, defaultSelectedIndex, onSelectedIndexChange, theme: viewTheme, layout, slots, minHeight, detailsExpanded, defaultDetailsExpanded, onDetailsExpandedChange, detailsLabel, unstyled, className, style, }: ExplainableViewProps): React$1.JSX.Element;

export { type NarrativeEntry as AdapterNarrativeEntry, type BaseComponentProps, type CausalFrame, CommentaryPanel, type CommentaryPanelProps, type CommentaryRenderContext, CompactTimeline, CompactTimelinePanel, type CompactTimelinePanelProps, type CompactTimelineProps, DEFAULT_EXCLUDED_KEYS, type DarkModeTokensOptions, DataTracePanel, type DataTracePanelProps, type DefaultExpanded, type DiffEntry, type EntryRangeIndex, type ExplainableLayoutDefinition, ExplainableProvider, type ExplainableProviderProps, type ExplainableRecording, type ExplainableRecordingInput, type ExplainableRunContextValue, ExplainableShell, type ExplainableShellProps, type ExplainableSurface, ExplainableView, type ExplainableViewLayout, type ExplainableViewPreset, type ExplainableViewProps, type ExplainableViewSlot, type ExplainableViewSlots, type ExplainableViewTheme, FlowchartPanel, type FlowchartPanelProps, FootprintTheme, GanttTimeline, type GanttTimelineProps, type InsightConfig, InsightPanel, type InsightPanelProps, InspectorPanel, type InspectorPanelProps, type MemoryChange, MemoryInspector, type MemoryInspectorProps, MemoryPanel, type MemoryPanelProps, type NarrativeEntry, NarrativeLog, type NarrativeLogProps, NarrativePanel, type NarrativePanelProps, NarrativeTrace, type NarrativeTraceProps, type OverlayFromSnapshotOptions, type PanelLabels, type RecorderView, type Recording, ResultPanel, type ResultPanelProps, type RuntimeExecutionStep, type RuntimeOverlay, type RuntimeSnapshotInput, ScopeDiff, type ScopeDiffProps, type SerializedStructureNode, type ShellTab, type Size, SnapshotPanel, type SnapshotPanelProps, type SnapshotWithCommitLog, type StageDetailMode, StageDetailPanel, type StageDetailPanelProps, type StageSnapshot, StoryNarrative, type StoryNarrativeProps, SubflowTree, type SubflowTreeEntry, type SubflowTreeProps, SurfaceCollapseHandle, type SurfaceCollapseHandleProps, type ThemeMode, type ThemeModeProps, type ThemePresetName, type ThemeTokens, TimeTravelBar, type TimeTravelBarProps, TimeTravelControls, type TimeTravelControlsProps, TimelinePanel, type TimelinePanelProps, type TraceGraph, type TraceIngredient, type TraceParseError, type TraceStop, type TraceTheme, TraceViewer, type TraceViewerProps, type TraceWalk, TraceWalkCard, type TraceWalkCardProps, type TraceWalkMissing, type TracingRail, ValueInspector, type ValueInspectorProps, buildEntryRangeIndex, buildTraceWalk, computeRevealedEntryCount, coolDark, coolLight, createSnapshots, defaultTokens, extractSubflowNarrative, formatTraceWalk, graphFromStructure, mergeWritePatch, narrativeFromSnapshot, overlayFromSnapshot, rawDefaults, subflowResultToSnapshots, themeModeVars, themePresets, toVisualizationSnapshots, tokensToCSSVars, useDarkModeTokens, useExplainableRun, useFootprintTheme, warmDark, warmLight };
