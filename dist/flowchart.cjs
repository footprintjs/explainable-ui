"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/flowchart.ts
var flowchart_exports = {};
__export(flowchart_exports, {
  CommitChainView: () => CommitChainView,
  CommitInspector: () => CommitInspector,
  FootprintBadge: () => FootprintBadge,
  FootprintButton: () => FootprintButton,
  FootprintCheckbox: () => FootprintCheckbox,
  FootprintCode: () => FootprintCode,
  FootprintIcon: () => FootprintIcon,
  FootprintInput: () => FootprintInput,
  FootprintLoadStatus: () => FootprintLoadStatus,
  FootprintTab: () => FootprintTab,
  FootprintTheme: () => FootprintTheme,
  FootprintTooltip: () => FootprintTooltip,
  GROUP_CONTAINER_NODE_TYPE: () => GROUP_CONTAINER_NODE_TYPE,
  GroupContainerNode: () => GroupContainerNode,
  GroupedFlowDiagram: () => GroupedFlowDiagram,
  GroupedFlowInvestigation: () => GroupedFlowInvestigation,
  ISOMETRIC_NODE_HEIGHT: () => ISOMETRIC_NODE_HEIGHT,
  ISOMETRIC_NODE_WIDTH: () => ISOMETRIC_NODE_WIDTH,
  IsometricEdge: () => IsometricEdge,
  IsometricGrid: () => IsometricGrid,
  IsometricStageNode: () => IsometricStageNode,
  LoopBackEdge: () => LoopBackEdge,
  MAIN_CHART_BOX_ID: () => MAIN_CHART_BOX_ID,
  NodeInspector: () => NodeInspector,
  RunSlider: () => RunSlider,
  SlotPillNode: () => SlotPillNode,
  SmartStepEdge: () => SmartStepEdge,
  StageNode: () => StageNode,
  SubflowBreadcrumb: () => SubflowBreadcrumb,
  SubflowTree: () => SubflowTree,
  TimeTravelDebugger: () => TimeTravelDebugger,
  TraceExplorerShell: () => TraceExplorerShell,
  TraceFlow: () => TraceFlow,
  TracedFlow: () => TracedFlow,
  applyGroupLayout: () => applyGroupLayout,
  asRuntimeStageId: () => asRuntimeStageId,
  asStageId: () => asStageId,
  attachSubflowWorker: () => attachSubflowWorker,
  backtraceDataFlow: () => backtraceDataFlow,
  backtraceStructural: () => backtraceStructural,
  buildCommitChainTree: () => buildCommitChainTree,
  buildSubflowBreadcrumb: () => buildSubflowBreadcrumb,
  collapseTraceGraph: () => collapseTraceGraph,
  componentStyles: () => componentStyles,
  createCommitFlowRecorder: () => createCommitFlowRecorder,
  createDagreTraceLayout: () => createDagreTraceLayout,
  createGroupedLayout: () => createGroupedLayout,
  createIsometricTraceLayout: () => createIsometricTraceLayout,
  createMainChartBoxLayout: () => createMainChartBoxLayout,
  createNodeViewRecorder: () => createNodeViewRecorder,
  createRecordingSource: () => createRecordingSource,
  createSnappedDagreLayout: () => createSnappedDagreLayout,
  createSubflowWorkerPreparation: () => createSubflowWorkerPreparation,
  createTraceBundle: () => createTraceBundle,
  createTraceGroupLayout: () => createTraceGroupLayout,
  createTraceRuntimeOverlay: () => createTraceRuntimeOverlay,
  createTraceStructureRecorder: () => createTraceStructureRecorder,
  dagreTraceLayout: () => dagreTraceLayout,
  defaultTraceFlowLayout: () => defaultTraceFlowLayout,
  filterGraphForDrill: () => filterGraphForDrill,
  forwardtraceStructural: () => forwardtraceStructural,
  getFlowDiagramAncestors: () => getFlowDiagramAncestors,
  graphFromStructure: () => graphFromStructure,
  isometricTraceLayout: () => isometricTraceLayout,
  overlayFromSnapshot: () => overlayFromSnapshot,
  prepareSubflow: () => prepareSubflow,
  projectGroupedFlowDiagram: () => projectGroupedFlowDiagram,
  resolveProgressiveRenderingOptions: () => resolveProgressiveRenderingOptions,
  sliceOverlay: () => sliceOverlay,
  snapLinearSuccessors: () => snapLinearSuccessors,
  structureAsChainTree: () => structureAsChainTree,
  themeModeVars: () => themeModeVars,
  tokensToCSSVars: () => tokensToCSSVars,
  traceGroupLayout: () => traceGroupLayout,
  useFootprintComponents: () => useFootprintComponents,
  useFootprintTheme: () => useFootprintTheme,
  useSubflowNavigation: () => useSubflowNavigation,
  useTranslator: () => useTranslator,
  walkBackward: () => walkBackward,
  walkForward: () => walkForward,
  wrapInMainChartBox: () => wrapInMainChartBox
});
module.exports = __toCommonJS(flowchart_exports);

// src/theme/ThemeProvider.tsx
var import_react2 = require("react");

// src/theme/tokens.ts
function tokensToCSSVars(tokens) {
  const vars = {};
  if (tokens.colors) {
    const c = tokens.colors;
    if (c.primary) vars["--fp-color-primary"] = c.primary;
    if (c.success) vars["--fp-color-success"] = c.success;
    if (c.error) vars["--fp-color-error"] = c.error;
    if (c.warning) vars["--fp-color-warning"] = c.warning;
    if (c.onPrimary) vars["--fp-on-primary"] = c.onPrimary;
    if (c.onSuccess) vars["--fp-on-success"] = c.onSuccess;
    if (c.onError) vars["--fp-on-error"] = c.onError;
    if (c.onWarning) vars["--fp-on-warning"] = c.onWarning;
    if (c.onTracing) vars["--fp-on-tracing"] = c.onTracing;
    if (c.onNodeCursor) vars["--fp-on-node-cursor"] = c.onNodeCursor;
    if (c.onNodeVisited) vars["--fp-on-node-visited"] = c.onNodeVisited;
    if (c.onNodeMain) vars["--fp-on-node-main"] = c.onNodeMain;
    if (c.nodeCursor) vars["--fp-node-cursor"] = c.nodeCursor;
    if (c.nodeVisited) vars["--fp-node-visited"] = c.nodeVisited;
    if (c.nodeMain) vars["--fp-node-main"] = c.nodeMain;
    const accent = c.accent ?? c.primary;
    if (accent) vars["--fp-accent"] = accent;
    if (c.accentBg) vars["--fp-accent-bg"] = c.accentBg;
    if (c.success) vars["--fp-success"] = c.success;
    if (c.tracing) vars["--fp-tracing"] = c.tracing;
    if (c.chip1) vars["--fp-chip-1"] = c.chip1;
    if (c.chip2) vars["--fp-chip-2"] = c.chip2;
    if (c.chip3) vars["--fp-chip-3"] = c.chip3;
    if (c.chip4) vars["--fp-chip-4"] = c.chip4;
    if (c.bg) vars["--fp-bg"] = c.bg;
    if (c.bgElevated) vars["--fp-bg-elevated"] = c.bgElevated;
    if (c.bgPrimary) vars["--fp-bg-primary"] = c.bgPrimary;
    if (c.bgSecondary) vars["--fp-bg-secondary"] = c.bgSecondary;
    if (c.bgTertiary) vars["--fp-bg-tertiary"] = c.bgTertiary;
    if (c.textPrimary) vars["--fp-text-primary"] = c.textPrimary;
    if (c.textSecondary) vars["--fp-text-secondary"] = c.textSecondary;
    if (c.textMuted) vars["--fp-text-muted"] = c.textMuted;
    if (c.border) vars["--fp-border"] = c.border;
  }
  if (tokens.radius) {
    vars["--fp-radius"] = tokens.radius;
    vars["--fp-radius-control"] = tokens.radius;
    vars["--fp-radius-panel"] = tokens.radius;
    vars["--fp-radius-badge"] = tokens.radius;
  }
  const write = (values, names) => {
    if (!values) return;
    for (const [key, name] of Object.entries(names)) if (values[key]) vars[name] = values[key];
  };
  write(tokens.typography, {
    body: "--fp-font-size-body",
    label: "--fp-font-size-label",
    small: "--fp-font-size-small",
    title: "--fp-font-size-title",
    lineHeight: "--fp-line-height",
    weightNormal: "--fp-font-weight-normal",
    weightMedium: "--fp-font-weight-medium",
    weightStrong: "--fp-font-weight-strong"
  });
  write(tokens.spacing, { xs: "--fp-space-xs", sm: "--fp-space-sm", md: "--fp-space-md", lg: "--fp-space-lg", xl: "--fp-space-xl" });
  write(tokens.radii, { control: "--fp-radius-control", panel: "--fp-radius-panel", badge: "--fp-radius-badge" });
  write(tokens.borders, { width: "--fp-border-width", focusWidth: "--fp-focus-width" });
  write(tokens.elevation, { panel: "--fp-shadow-panel", popover: "--fp-shadow-popover", focus: "--fp-shadow-focus" });
  write(tokens.nodes, {
    borderColor: "--fp-node-border-color",
    borderWidth: "--fp-node-border-width",
    borderStyle: "--fp-node-border-style",
    radius: "--fp-node-radius",
    shadow: "--fp-node-shadow",
    shapeShadow: "--fp-node-shape-shadow",
    badgeShadow: "--fp-node-badge-shadow",
    pulseOpacity: "--fp-node-pulse-opacity",
    groupStatusDisplay: "--fp-node-group-status-display"
  });
  write(tokens.motion, { duration: "--fp-motion-duration", fastDuration: "--fp-motion-fast-duration", easing: "--fp-motion-easing" });
  write(tokens.controls, { height: "--fp-control-height", paddingX: "--fp-control-padding-x", gap: "--fp-control-gap", iconSize: "--fp-icon-size" });
  if (tokens.fontFamily?.sans) vars["--fp-font-sans"] = tokens.fontFamily.sans;
  if (tokens.fontFamily?.mono) vars["--fp-font-mono"] = tokens.fontFamily.mono;
  return vars;
}
var rawDefaults = {
  colors: {
    primary: "#6366f1",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    onPrimary: "#fff",
    onSuccess: "#fff",
    onError: "#fff",
    onWarning: "#1a1a1a",
    onTracing: "#fff",
    onNodeCursor: "#1a1a1a",
    onNodeVisited: "#fff",
    onNodeMain: "#fff",
    nodeCursor: "#f59e0b",
    nodeVisited: "#22c55e",
    nodeMain: "#6366f1",
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.12)",
    tracing: "#0d9488",
    chip1: "#0d9488",
    chip2: "#d97706",
    chip3: "#7c3aed",
    chip4: "#e11d48",
    bg: "#1a1b26",
    bgElevated: "#1e293b",
    bgPrimary: "#0f172a",
    bgSecondary: "#1e293b",
    bgTertiary: "#334155",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    border: "#334155"
  },
  radius: "8px",
  typography: {
    body: "12px",
    label: "11px",
    small: "10px",
    title: "14px",
    lineHeight: "1.5",
    weightNormal: "400",
    weightMedium: "500",
    weightStrong: "700"
  },
  spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px" },
  radii: { control: "6px", panel: "8px", badge: "12px" },
  borders: { width: "1px", focusWidth: "2px" },
  elevation: { panel: "0 2px 8px rgba(0,0,0,0.15)", popover: "0 6px 24px rgba(0,0,0,0.2)", focus: "none" },
  // CSS-wide initial makes a custom property guaranteed-invalid, so var()
  // selects the renderer's existing status-dependent fallback recipe.
  // Group status cues remain hidden unless a theme explicitly opts in.
  nodes: {
    borderColor: "initial",
    borderWidth: "initial",
    borderStyle: "initial",
    radius: "initial",
    shadow: "initial",
    shapeShadow: "initial",
    badgeShadow: "initial",
    pulseOpacity: "initial",
    groupStatusDisplay: "none"
  },
  motion: { duration: "240ms", fastDuration: "120ms", easing: "ease" },
  controls: { height: "28px", paddingX: "8px", gap: "6px", iconSize: "14px" },
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  }
};
var defaultTokens = {
  colors: {
    primary: `var(--fp-color-primary, ${rawDefaults.colors.primary})`,
    success: `var(--fp-color-success, ${rawDefaults.colors.success})`,
    error: `var(--fp-color-error, ${rawDefaults.colors.error})`,
    warning: `var(--fp-color-warning, ${rawDefaults.colors.warning})`,
    onPrimary: `var(--fp-on-primary, ${rawDefaults.colors.onPrimary})`,
    onSuccess: `var(--fp-on-success, ${rawDefaults.colors.onSuccess})`,
    onError: `var(--fp-on-error, ${rawDefaults.colors.onError})`,
    onWarning: `var(--fp-on-warning, ${rawDefaults.colors.onWarning})`,
    onTracing: `var(--fp-on-tracing, ${rawDefaults.colors.onTracing})`,
    onNodeCursor: `var(--fp-on-node-cursor, ${rawDefaults.colors.onNodeCursor})`,
    onNodeVisited: `var(--fp-on-node-visited, ${rawDefaults.colors.onNodeVisited})`,
    onNodeMain: `var(--fp-on-node-main, ${rawDefaults.colors.onNodeMain})`,
    nodeCursor: `var(--fp-node-cursor, ${rawDefaults.colors.nodeCursor})`,
    nodeVisited: `var(--fp-node-visited, ${rawDefaults.colors.nodeVisited})`,
    nodeMain: `var(--fp-node-main, ${rawDefaults.colors.nodeMain})`,
    accent: `var(--fp-accent, ${rawDefaults.colors.accent})`,
    accentBg: `var(--fp-accent-bg, ${rawDefaults.colors.accentBg})`,
    tracing: `var(--fp-tracing, ${rawDefaults.colors.tracing})`,
    chip1: `var(--fp-chip-1, ${rawDefaults.colors.chip1})`,
    chip2: `var(--fp-chip-2, ${rawDefaults.colors.chip2})`,
    chip3: `var(--fp-chip-3, ${rawDefaults.colors.chip3})`,
    chip4: `var(--fp-chip-4, ${rawDefaults.colors.chip4})`,
    bg: `var(--fp-bg, ${rawDefaults.colors.bg})`,
    bgElevated: `var(--fp-bg-elevated, ${rawDefaults.colors.bgElevated})`,
    bgPrimary: `var(--fp-bg-primary, ${rawDefaults.colors.bgPrimary})`,
    bgSecondary: `var(--fp-bg-secondary, ${rawDefaults.colors.bgSecondary})`,
    bgTertiary: `var(--fp-bg-tertiary, ${rawDefaults.colors.bgTertiary})`,
    textPrimary: `var(--fp-text-primary, ${rawDefaults.colors.textPrimary})`,
    textSecondary: `var(--fp-text-secondary, ${rawDefaults.colors.textSecondary})`,
    textMuted: `var(--fp-text-muted, ${rawDefaults.colors.textMuted})`,
    border: `var(--fp-border, ${rawDefaults.colors.border})`
  },
  radius: `var(--fp-radius, ${rawDefaults.radius})`,
  typography: {
    body: `var(--fp-font-size-body, ${rawDefaults.typography.body})`,
    label: `var(--fp-font-size-label, ${rawDefaults.typography.label})`,
    small: `var(--fp-font-size-small, ${rawDefaults.typography.small})`,
    title: `var(--fp-font-size-title, ${rawDefaults.typography.title})`,
    lineHeight: `var(--fp-line-height, ${rawDefaults.typography.lineHeight})`,
    weightNormal: `var(--fp-font-weight-normal, ${rawDefaults.typography.weightNormal})`,
    weightMedium: `var(--fp-font-weight-medium, ${rawDefaults.typography.weightMedium})`,
    weightStrong: `var(--fp-font-weight-strong, ${rawDefaults.typography.weightStrong})`
  },
  spacing: { xs: `var(--fp-space-xs, ${rawDefaults.spacing.xs})`, sm: `var(--fp-space-sm, ${rawDefaults.spacing.sm})`, md: `var(--fp-space-md, ${rawDefaults.spacing.md})`, lg: `var(--fp-space-lg, ${rawDefaults.spacing.lg})`, xl: `var(--fp-space-xl, ${rawDefaults.spacing.xl})` },
  radii: { control: `var(--fp-radius-control, ${rawDefaults.radii.control})`, panel: `var(--fp-radius-panel, ${rawDefaults.radii.panel})`, badge: `var(--fp-radius-badge, ${rawDefaults.radii.badge})` },
  borders: { width: `var(--fp-border-width, ${rawDefaults.borders.width})`, focusWidth: `var(--fp-focus-width, ${rawDefaults.borders.focusWidth})` },
  elevation: { panel: `var(--fp-shadow-panel, ${rawDefaults.elevation.panel})`, popover: `var(--fp-shadow-popover, ${rawDefaults.elevation.popover})`, focus: `var(--fp-shadow-focus, ${rawDefaults.elevation.focus})` },
  nodes: {
    borderColor: `var(--fp-node-border-color, ${rawDefaults.nodes.borderColor})`,
    borderWidth: `var(--fp-node-border-width, ${rawDefaults.nodes.borderWidth})`,
    borderStyle: `var(--fp-node-border-style, ${rawDefaults.nodes.borderStyle})`,
    radius: `var(--fp-node-radius, ${rawDefaults.nodes.radius})`,
    shadow: `var(--fp-node-shadow, ${rawDefaults.nodes.shadow})`,
    shapeShadow: `var(--fp-node-shape-shadow, ${rawDefaults.nodes.shapeShadow})`,
    badgeShadow: `var(--fp-node-badge-shadow, ${rawDefaults.nodes.badgeShadow})`,
    pulseOpacity: `var(--fp-node-pulse-opacity, ${rawDefaults.nodes.pulseOpacity})`,
    groupStatusDisplay: `var(--fp-node-group-status-display, ${rawDefaults.nodes.groupStatusDisplay})`
  },
  motion: { duration: `var(--fp-motion-duration, ${rawDefaults.motion.duration})`, fastDuration: `var(--fp-motion-fast-duration, ${rawDefaults.motion.fastDuration})`, easing: `var(--fp-motion-easing, ${rawDefaults.motion.easing})` },
  controls: { height: `var(--fp-control-height, ${rawDefaults.controls.height})`, paddingX: `var(--fp-control-padding-x, ${rawDefaults.controls.paddingX})`, gap: `var(--fp-control-gap, ${rawDefaults.controls.gap})`, iconSize: `var(--fp-icon-size, ${rawDefaults.controls.iconSize})` },
  fontFamily: {
    sans: `var(--fp-font-sans, ${rawDefaults.fontFamily.sans})`,
    mono: `var(--fp-font-mono, ${rawDefaults.fontFamily.mono})`
  }
};

// src/theme/components.tsx
var import_react = require("react");

// src/theme/styles.ts
function v(varName, fallback2) {
  return `var(${varName}, ${fallback2})`;
}
var theme = {
  primary: v("--fp-color-primary", "#6366f1"),
  success: v("--fp-color-success", "#22c55e"),
  error: v("--fp-color-error", "#ef4444"),
  warning: v("--fp-color-warning", "#f59e0b"),
  onPrimary: v("--fp-on-primary", rawDefaults.colors.onPrimary),
  onSuccess: v("--fp-on-success", rawDefaults.colors.onSuccess),
  onError: v("--fp-on-error", rawDefaults.colors.onError),
  onWarning: v("--fp-on-warning", rawDefaults.colors.onWarning),
  onTracing: v("--fp-on-tracing", rawDefaults.colors.onTracing),
  onNodeCursor: v("--fp-on-node-cursor", rawDefaults.colors.onNodeCursor),
  onNodeVisited: v("--fp-on-node-visited", rawDefaults.colors.onNodeVisited),
  onNodeMain: v("--fp-on-node-main", rawDefaults.colors.onNodeMain),
  onNodeError: v("--fp-on-error", rawDefaults.colors.onError),
  // Semantic NODE-STATE colors — first-class, themeable roles a runtime overlay
  // maps onto (scrub cursor / executed / a group's lead node). Distinct from the
  // generic `primary` accent so the three read as three different things.
  nodeCursor: v("--fp-node-cursor", "#f59e0b"),
  // the current / scrubbed-to step
  nodeVisited: v("--fp-node-visited", "#22c55e"),
  // executed up to the cursor
  nodeMain: v("--fp-node-main", "#6366f1"),
  // the lead / "hero" node of a group
  // Short-alias roles. Panels written against these read the SAME token the
  // presets emit (see tokensToCSSVars) — they exist so a component can say
  // "accent" without deciding whether it means the brand primary.
  accent: v("--fp-accent", "#6366f1"),
  // active tab / selected rule
  accentBg: v("--fp-accent-bg", "rgba(99,102,241,0.12)"),
  // wash behind an accented row
  tracing: v("--fp-tracing", "#0d9488"),
  // the tracing-rail chrome
  bg: v("--fp-bg", "#1a1b26"),
  // panel body surface
  bgElevated: v("--fp-bg-elevated", "#1e293b"),
  // raised card on the body surface
  bgPrimary: v("--fp-bg-primary", "#0f172a"),
  bgSecondary: v("--fp-bg-secondary", "#1e293b"),
  bgTertiary: v("--fp-bg-tertiary", "#334155"),
  textPrimary: v("--fp-text-primary", "#f8fafc"),
  textSecondary: v("--fp-text-secondary", "#94a3b8"),
  textMuted: v("--fp-text-muted", "#64748b"),
  border: v("--fp-border", "#334155"),
  radius: v("--fp-radius", "8px"),
  fontSans: v("--fp-font-sans", "Inter, system-ui, -apple-system, sans-serif"),
  fontMono: v("--fp-font-mono", "'JetBrains Mono', 'Fira Code', monospace")
};
var fontSize = {
  compact: { label: 10, body: 11, small: 9 },
  default: { label: 11, body: 12, small: 10 },
  detailed: { label: 12, body: 13, small: 11 }
};
var padding = {
  compact: 8,
  default: 12,
  detailed: 16
};
function componentStyles(size = "default") {
  const fontOffset = fontSize[size].body - fontSize.default.body;
  const padOffset = padding[size] - padding.default;
  const offset = (name, fallback2, amount) => amount === 0 ? v(name, fallback2) : `calc(${v(name, fallback2)} ${amount < 0 ? "-" : "+"} ${Math.abs(amount)}px)`;
  return {
    body: offset("--fp-font-size-body", rawDefaults.typography.body, fontOffset),
    label: offset("--fp-font-size-label", rawDefaults.typography.label, fontOffset),
    small: offset("--fp-font-size-small", rawDefaults.typography.small, fontOffset),
    title: offset("--fp-font-size-title", rawDefaults.typography.title, fontOffset),
    lineHeight: v("--fp-line-height", rawDefaults.typography.lineHeight),
    weightNormal: v("--fp-font-weight-normal", rawDefaults.typography.weightNormal),
    weightMedium: v("--fp-font-weight-medium", rawDefaults.typography.weightMedium),
    weightStrong: v("--fp-font-weight-strong", rawDefaults.typography.weightStrong),
    padding: `max(0px, ${offset("--fp-space-md", rawDefaults.spacing.md, padOffset)})`,
    controlHeight: `max(0px, ${offset("--fp-control-height", rawDefaults.controls.height, fontOffset * 4)})`,
    controlPadding: `${v("--fp-space-xs", rawDefaults.spacing.xs)} ${v("--fp-control-padding-x", rawDefaults.controls.paddingX)}`,
    controlPaddingX: v("--fp-control-padding-x", rawDefaults.controls.paddingX),
    controlGap: v("--fp-control-gap", rawDefaults.controls.gap),
    iconSize: offset("--fp-icon-size", rawDefaults.controls.iconSize, fontOffset),
    radiusControl: `var(--fp-radius-control, var(--fp-radius, ${rawDefaults.radii.control}))`,
    radiusPanel: `var(--fp-radius-panel, var(--fp-radius, ${rawDefaults.radii.panel}))`,
    radiusBadge: `var(--fp-radius-badge, var(--fp-radius, ${rawDefaults.radii.badge}))`,
    borderWidth: v("--fp-border-width", rawDefaults.borders.width),
    focusWidth: v("--fp-focus-width", rawDefaults.borders.focusWidth),
    shadowPanel: v("--fp-shadow-panel", rawDefaults.elevation.panel),
    shadowPopover: v("--fp-shadow-popover", rawDefaults.elevation.popover),
    shadowFocus: v("--fp-shadow-focus", rawDefaults.elevation.focus),
    duration: v("--fp-motion-duration", rawDefaults.motion.duration),
    fastDuration: v("--fp-motion-fast-duration", rawDefaults.motion.fastDuration),
    easing: v("--fp-motion-easing", rawDefaults.motion.easing),
    spaceXs: v("--fp-space-xs", rawDefaults.spacing.xs),
    spaceSm: v("--fp-space-sm", rawDefaults.spacing.sm),
    spaceMd: v("--fp-space-md", rawDefaults.spacing.md),
    spaceLg: v("--fp-space-lg", rawDefaults.spacing.lg),
    spaceXl: v("--fp-space-xl", rawDefaults.spacing.xl)
  };
}

// src/theme/components.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var FootprintComponentsContext = (0, import_react.createContext)({});
function useFootprintComponents() {
  return (0, import_react.useContext)(FootprintComponentsContext);
}
function partProps(part) {
  return part === void 0 ? {} : { "data-fp-part": part };
}
function paint(unstyled, fallback2, style) {
  if (unstyled || !fallback2) return style;
  return { ...fallback2, ...style };
}
function fallback(options, recipe) {
  return Object.prototype.hasOwnProperty.call(options, "defaultStyle") ? options.defaultStyle : recipe();
}
function control(size) {
  const ui = componentStyles(size);
  return {
    fontFamily: theme.fontSans,
    fontSize: ui.body,
    lineHeight: ui.lineHeight,
    minHeight: ui.controlHeight,
    padding: ui.controlPadding,
    borderRadius: ui.radiusControl,
    border: `${ui.borderWidth} solid ${theme.border}`,
    background: theme.bgPrimary,
    color: theme.textPrimary
  };
}
var FootprintButton = (0, import_react.forwardRef)(function FootprintButton2(input, ref) {
  const {
    unstyled,
    defaultStyle,
    style,
    part,
    densitySize = "default",
    type = "button",
    ...props
  } = input;
  const Custom = useFootprintComponents().Button;
  if (Custom) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Custom, { ...props, type, ref, style, ...partProps(part) });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ...props, type, ref, style: paint(unstyled, fallback(input, () => control(densitySize)), style), ...partProps(part) });
});
var FootprintTab = (0, import_react.forwardRef)(function FootprintTab2(input, ref) {
  const {
    unstyled,
    defaultStyle,
    style,
    part,
    densitySize = "default",
    type = "button",
    ...props
  } = input;
  const components = useFootprintComponents();
  const Custom = components.Tab ?? components.Button;
  if (Custom) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Custom, { ...props, type, ref, style, ...partProps(part) });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ...props, type, ref, style: paint(unstyled, fallback(input, () => control(densitySize)), style), ...partProps(part) });
});
var FootprintInput = (0, import_react.forwardRef)(function FootprintInput2(input, ref) {
  const {
    unstyled,
    defaultStyle,
    style,
    part,
    densitySize = "default",
    ...props
  } = input;
  const Custom = useFootprintComponents().Input;
  if (Custom) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Custom, { ...props, ref, style, ...partProps(part) });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ...props, ref, style: paint(unstyled, fallback(input, () => control(densitySize)), style), ...partProps(part) });
});
var FootprintCheckbox = (0, import_react.forwardRef)(function FootprintCheckbox2(input, ref) {
  const {
    unstyled,
    defaultStyle,
    style,
    part,
    densitySize = "default",
    ...props
  } = input;
  const components = useFootprintComponents();
  const Custom = components.Checkbox ?? components.Input;
  if (Custom) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Custom, { ...props, type: "checkbox", ref, style, ...partProps(part) });
  const ui = componentStyles(densitySize);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ...props, type: "checkbox", ref, style: paint(unstyled, fallback(input, () => ({ accentColor: theme.accent, width: ui.iconSize, height: ui.iconSize })), style), ...partProps(part) });
});
var FootprintBadge = (0, import_react.forwardRef)(function FootprintBadge2(input, ref) {
  const {
    unstyled,
    defaultStyle,
    style,
    part,
    densitySize = "default",
    ...props
  } = input;
  const Custom = useFootprintComponents().Badge;
  if (Custom) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Custom, { ...props, ref, style, ...partProps(part) });
  const ui = componentStyles(densitySize);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { ...props, ref, style: paint(unstyled, fallback(input, () => ({ fontSize: ui.small, borderRadius: ui.radiusBadge, padding: `${ui.spaceXs} ${ui.spaceSm}`, color: theme.textPrimary, background: theme.bgSecondary })), style), ...partProps(part) });
});
var FootprintCode = (0, import_react.forwardRef)(function FootprintCode2(input, ref) {
  const {
    unstyled,
    defaultStyle,
    style,
    part,
    densitySize = "default",
    ...props
  } = input;
  const Custom = useFootprintComponents().Code;
  if (Custom) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Custom, { ...props, ref, style, ...partProps(part) });
  const ui = componentStyles(densitySize);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { ...props, ref, style: paint(unstyled, fallback(input, () => ({ fontFamily: theme.fontMono, fontSize: ui.body })), style), ...partProps(part) });
});
var FootprintTooltip = (0, import_react.forwardRef)(function FootprintTooltip2(input, ref) {
  const {
    unstyled,
    defaultStyle,
    style,
    part,
    densitySize: _size,
    content,
    title,
    ...props
  } = input;
  const Custom = useFootprintComponents().Tooltip;
  if (Custom) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Custom, { ...props, ref, content, title, style, ...partProps(part) });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { ...props, ref, title: title ?? content, style: paint(unstyled, defaultStyle, style), ...partProps(part) });
});
var FootprintIcon = (0, import_react.forwardRef)(function FootprintIcon2(input, ref) {
  const {
    unstyled,
    defaultStyle,
    style,
    part,
    densitySize = "default",
    name,
    ...props
  } = input;
  const Custom = useFootprintComponents().Icon;
  if (Custom) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Custom, { ...props, name, ref, style, ...partProps(part) });
  const ui = componentStyles(densitySize);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { ...props, ref, "data-icon": name, style: paint(unstyled, fallback(input, () => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: ui.iconSize, height: ui.iconSize })), style), ...partProps(part) });
});

// src/theme/ThemeProvider.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var ThemeContext = (0, import_react2.createContext)({});
function useFootprintTheme() {
  return (0, import_react2.useContext)(ThemeContext);
}
function FootprintTheme({ tokens = {}, components, children, asChild = false }) {
  const parent = useFootprintTheme();
  const parentComponents = useFootprintComponents();
  const cssVars = tokensToCSSVars(tokens);
  const mergedTokens = (0, import_react2.useMemo)(() => {
    const merge = (outer, inner) => {
      if (!outer && !inner) return void 0;
      const local = Object.fromEntries(Object.entries(inner ?? {}).filter(([, value]) => value !== void 0));
      return { ...outer, ...local };
    };
    return {
      ...merge(parent, tokens),
      colors: merge(parent.colors, tokens.colors),
      fontFamily: merge(parent.fontFamily, tokens.fontFamily),
      typography: merge(parent.typography, tokens.typography),
      spacing: merge(parent.spacing, tokens.spacing),
      radii: merge(parent.radii, tokens.radii),
      borders: merge(parent.borders, tokens.borders),
      elevation: merge(parent.elevation, tokens.elevation),
      nodes: merge(parent.nodes, tokens.nodes),
      motion: merge(parent.motion, tokens.motion),
      controls: merge(parent.controls, tokens.controls)
    };
  }, [parent, tokens]);
  const mergedComponents = (0, import_react2.useMemo)(() => ({
    ...parentComponents,
    ...Object.fromEntries(Object.entries(components ?? {}).filter(([, value]) => value !== void 0))
  }), [parentComponents, components]);
  let content = /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "div",
    {
      style: { ...cssVars, display: "contents" },
      className: "fp-theme-root",
      children
    }
  );
  if (asChild) {
    if (!(0, import_react2.isValidElement)(children) || children.type === import_react2.Fragment) {
      throw new Error("FootprintTheme asChild requires one non-fragment React element that forwards className and style.");
    }
    content = (0, import_react2.cloneElement)(children, {
      // Child-authored style stays strongest; cloneElement retains its ref,
      // event handlers and all other props when they are not replaced here.
      style: { ...cssVars, ...children.props.style },
      className: [children.props.className, "fp-theme-root"].filter(Boolean).join(" ")
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ThemeContext.Provider, { value: mergedTokens, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FootprintComponentsContext.Provider, { value: mergedComponents, children: content }) });
}

// src/theme/presets.ts
var coolDark = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#6366f1",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    nodeCursor: "#f59e0b",
    nodeVisited: "#22c55e",
    nodeMain: "#6366f1",
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.12)",
    tracing: "#14b8a6",
    chip1: "#0d9488",
    chip2: "#d97706",
    chip3: "#7c3aed",
    chip4: "#e11d48",
    bg: "#0f172a",
    bgElevated: "#1e293b",
    bgPrimary: "#0f172a",
    bgSecondary: "#1e293b",
    bgTertiary: "#334155",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    border: "#334155"
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  }
};
var warmDark = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#7c6cf0",
    success: "#3dd68c",
    error: "#f06292",
    warning: "#ffb74d",
    nodeCursor: "#ffb74d",
    nodeVisited: "#3dd68c",
    nodeMain: "#7c6cf0",
    accent: "#7c6cf0",
    accentBg: "rgba(124,108,240,0.14)",
    tracing: "#3ecfb2",
    chip1: "#0d9488",
    chip2: "#d97706",
    chip3: "#7c3aed",
    chip4: "#e11d48",
    bg: "#1e1a2e",
    bgElevated: "#2a2540",
    bgPrimary: "#1e1a2e",
    bgSecondary: "#2a2540",
    bgTertiary: "#3a3455",
    textPrimary: "#f0e6d6",
    textSecondary: "#a89eb4",
    textMuted: "#6e6480",
    border: "#3a3455"
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  }
};
var warmLight = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#7c6cf0",
    success: "#22a860",
    error: "#d94452",
    warning: "#e09030",
    nodeCursor: "#e09030",
    nodeVisited: "#22a860",
    nodeMain: "#7c6cf0",
    accent: "#7c6cf0",
    accentBg: "rgba(124,108,240,0.12)",
    tracing: "#0e9c88",
    chip1: "#0d9488",
    chip2: "#d97706",
    chip3: "#7c3aed",
    chip4: "#e11d48",
    bg: "#faf5ef",
    bgElevated: "#f0e6d6",
    bgPrimary: "#faf5ef",
    bgSecondary: "#f0e6d6",
    bgTertiary: "#e4d5c3",
    textPrimary: "#2e2938",
    textSecondary: "#5c5468",
    textMuted: "#8a7e96",
    border: "#d6c8b4"
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  }
};
var coolLight = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#6366f1",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    nodeCursor: "#f59e0b",
    nodeVisited: "#22c55e",
    nodeMain: "#6366f1",
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.10)",
    tracing: "#0d9488",
    chip1: "#0d9488",
    chip2: "#d97706",
    chip3: "#7c3aed",
    chip4: "#e11d48",
    bg: "#ffffff",
    bgElevated: "#f9fafb",
    bgPrimary: "#ffffff",
    bgSecondary: "#f9fafb",
    bgTertiary: "#e5e7eb",
    textPrimary: "#18181b",
    textSecondary: "#52525b",
    textMuted: "#a1a1aa",
    border: "#e5e7eb"
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  }
};
var paperMono = "'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace";
var paperLight = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#465d50",
    success: "#4f7054",
    error: "#a4473e",
    warning: "#8d602c",
    onPrimary: "#fffdf6",
    onSuccess: "#fffdf6",
    onError: "#fffdf6",
    onWarning: "#fffdf6",
    onTracing: "#fffdf6",
    nodeCursor: "#edc5a9",
    nodeVisited: "#cbd9ba",
    nodeMain: "#d7d0e5",
    onNodeCursor: "#34382f",
    onNodeVisited: "#34382f",
    onNodeMain: "#34382f",
    accent: "#465d50",
    accentBg: "#e4e8d9",
    tracing: "#536b58",
    chip1: "#536b58",
    chip2: "#8d602c",
    chip3: "#75638b",
    chip4: "#a05d55",
    bg: "#f6f2e9",
    bgElevated: "#fffdf6",
    bgPrimary: "#f6f2e9",
    bgSecondary: "#fffdf6",
    bgTertiary: "#e8e4d8",
    textPrimary: "#34382f",
    textSecondary: "#616657",
    textMuted: "#686d5d",
    border: "#4e5148"
  },
  radius: "5px",
  radii: { control: "5px", panel: "5px", badge: "5px" },
  borders: { width: "1px", focusWidth: "2px" },
  elevation: { panel: "2px 3px 0 #4e5148", popover: "3px 4px 0 #4e5148", focus: "none" },
  nodes: {
    borderColor: "#34382f",
    borderWidth: "1px",
    borderStyle: "solid",
    radius: "5px",
    shadow: "2px 3px 0 #34382f",
    shapeShadow: "drop-shadow(2px 3px 0 #34382f)",
    badgeShadow: "none",
    pulseOpacity: "0",
    groupStatusDisplay: "inline-flex"
  },
  fontFamily: { sans: paperMono, mono: paperMono }
};
var paperDark = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#cbd9ba",
    success: "#c0d0aa",
    error: "#ecaca0",
    warning: "#e7c391",
    onPrimary: "#34382f",
    onSuccess: "#34382f",
    onError: "#34382f",
    onWarning: "#34382f",
    onTracing: "#34382f",
    nodeCursor: "#edc5a9",
    nodeVisited: "#cbd9ba",
    nodeMain: "#d7d0e5",
    onNodeCursor: "#34382f",
    onNodeVisited: "#34382f",
    onNodeMain: "#34382f",
    accent: "#cbd9ba",
    accentBg: "#3e4937",
    tracing: "#c0d0aa",
    chip1: "#c0d0aa",
    chip2: "#e7c391",
    chip3: "#d7d0e5",
    chip4: "#ecaca0",
    bg: "#252923",
    bgElevated: "#3a4035",
    bgPrimary: "#252923",
    bgSecondary: "#32372f",
    bgTertiary: "#454b3d",
    textPrimary: "#f2eedf",
    textSecondary: "#cbcbb7",
    textMuted: "#a8ad9a",
    border: "#a5aa97"
  },
  radius: "5px",
  radii: { control: "5px", panel: "5px", badge: "5px" },
  borders: { width: "1px", focusWidth: "2px" },
  elevation: { panel: "2px 3px 0 #10160f", popover: "3px 4px 0 #10160f", focus: "none" },
  nodes: {
    borderColor: "#171d16",
    borderWidth: "1px",
    borderStyle: "solid",
    radius: "5px",
    shadow: "2px 3px 0 #10160f",
    shapeShadow: "drop-shadow(2px 3px 0 #10160f)",
    badgeShadow: "none",
    pulseOpacity: "0",
    groupStatusDisplay: "inline-flex"
  },
  fontFamily: { sans: paperMono, mono: paperMono }
};

// src/theme/useDarkModeTokens.ts
var import_react3 = require("react");

// src/theme/mode.ts
function themeModeVars(mode) {
  if (!mode) return {};
  return tokensToCSSVars(mode === "light" ? coolLight : coolDark);
}

// src/theme/loading.tsx
var import_react4 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var FootprintLoadStatus = (0, import_react4.forwardRef)(function FootprintLoadStatus2(input, ref) {
  const { state, indicator = "skeleton", label, children, unstyled, defaultStyle, style, part, densitySize = "default", ...props } = input;
  const Custom = useFootprintComponents().LoadStatus;
  const shared = { ...props, role: state === "error" ? "alert" : "status", "aria-busy": state !== "error", "data-fp-part": part };
  if (Custom) return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Custom, { ...shared, ref, state, indicator, label, style, children });
  const ui = componentStyles(densitySize);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      ...shared,
      ref,
      "data-fp": "load-status",
      "data-state": state,
      "data-indicator": indicator,
      style: unstyled ? style : {
        padding: ui.padding,
        fontFamily: theme.fontSans,
        fontSize: ui.body,
        color: theme.textPrimary,
        background: theme.bgSecondary,
        border: `${ui.borderWidth} solid ${theme.border}`,
        borderRadius: ui.radiusPanel,
        ...defaultStyle,
        ...style
      },
      children: [
        state !== "error" && indicator === "skeleton" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { "aria-hidden": "true", "data-fp": "loading-skeleton", style: unstyled ? void 0 : { display: "grid", gap: ui.spaceXs, marginBottom: ui.spaceSm }, children: [80, 55].map((width) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: unstyled ? void 0 : { width: `${width}%`, height: ui.spaceSm, borderRadius: ui.radiusBadge, background: theme.border } }, width)) }),
        state !== "error" && indicator === "spinner" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { "aria-hidden": "true", "data-fp": "loading-spinner", style: unstyled ? void 0 : { display: "inline-block", marginRight: ui.spaceSm, width: ui.iconSize, height: ui.iconSize, border: `${ui.borderWidth} solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: "50%", animation: `fp-load-spin calc(${ui.duration} * 4) linear infinite` } }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: label }),
        children,
        !unstyled && indicator === "spinner" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: '@keyframes fp-load-spin { to { transform: rotate(360deg) } } @media (prefers-reduced-motion: reduce) { [data-fp="loading-spinner"] { animation: none !important } }' })
      ]
    }
  );
});

// src/components/GroupedFlowDiagram/GroupedFlowDiagram.tsx
var import_react16 = require("react");
var import_react17 = require("@xyflow/react");

// src/components/FlowchartView/_internal/useChartAutoRefit.ts
var import_react7 = require("react");
var import_react8 = require("@xyflow/react");

// src/_internal/useIsomorphicLayoutEffect.ts
var import_react5 = require("react");
var useIsomorphicLayoutEffect = typeof window === "undefined" ? import_react5.useEffect : import_react5.useLayoutEffect;

// src/components/FlowchartView/_internal/chartFitGeometry.ts
var import_react6 = require("@xyflow/react");
var positiveFinite = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
function measuredChartBounds(nodes) {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const node of nodes.values()) {
    if (node.hidden) continue;
    const width2 = node.measured?.width;
    const height2 = node.measured?.height;
    const { x, y } = node.internals.positionAbsolute;
    if (!positiveFinite(width2) || !positiveFinite(height2) || !Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x + width2);
    bottom = Math.max(bottom, y + height2);
  }
  const width = right - left;
  const height = bottom - top;
  if (!Number.isFinite(left) || !Number.isFinite(top) || !positiveFinite(width) || !positiveFinite(height)) return null;
  return { x: left, y: top, width, height };
}
function chartFitViewport(state, padding2) {
  if (!positiveFinite(state.width) || !positiveFinite(state.height) || !positiveFinite(state.minZoom) || !positiveFinite(state.maxZoom) || state.maxZoom < state.minZoom || !Number.isFinite(padding2) || padding2 < 0) return null;
  let bounds = measuredChartBounds(state.nodeLookup);
  if (!bounds) return null;
  if (state.visualBounds) {
    const extra = state.visualBounds;
    if (![extra.x, extra.y, extra.width, extra.height].every(Number.isFinite) || !positiveFinite(extra.width) || !positiveFinite(extra.height)) return null;
    const x = Math.min(bounds.x, extra.x), y = Math.min(bounds.y, extra.y);
    bounds = { x, y, width: Math.max(bounds.x + bounds.width, extra.x + extra.width) - x, height: Math.max(bounds.y + bounds.height, extra.y + extra.height) - y };
    if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) return null;
  }
  const viewport = (0, import_react6.getViewportForBounds)(bounds, state.width, state.height, state.minZoom, state.maxZoom, padding2);
  return Number.isFinite(viewport.x) && Number.isFinite(viewport.y) && positiveFinite(viewport.zoom) ? viewport : null;
}
function chartMeasurementKey(state) {
  return JSON.stringify([
    state.width,
    state.height,
    state.minZoom,
    state.maxZoom,
    measuredChartBounds(state.nodeLookup) !== null,
    Array.from(state.nodeLookup, ([id, node]) => node.hidden ? [id, "hidden"] : [id, node.measured?.width, node.measured?.height])
  ]);
}
function chartLayoutKey(nodes) {
  return JSON.stringify(nodes.map((node) => [
    node.id,
    node.parentId,
    node.hidden,
    node.position.x,
    node.position.y,
    node.origin,
    node.width,
    node.height
  ]));
}
function chartTopologyKey(nodes) {
  return JSON.stringify(nodes.map((node) => [node.id, node.parentId, node.hidden]));
}

// src/components/FlowchartView/_internal/useChartAutoRefit.ts
function hasVisibleArea(element) {
  if (!element) return false;
  const { width, height } = element.getBoundingClientRect();
  return positiveFinite(width) && positiveFinite(height);
}
function useChartAutoRefit({ wrapperRef, padding: padding2 = 0.1, refitKey, layoutKey, focusNodeIds, focusRequestKey, maxAutoZoom, visualBounds, preserveViewport }) {
  const store = (0, import_react8.useStoreApi)();
  const { setViewport } = (0, import_react8.useReactFlow)();
  const requestLayoutFit = (0, import_react7.useRef)(null);
  const visualBoundsKey = JSON.stringify(visualBounds);
  const committedVisualBounds = (0, import_react7.useRef)(visualBounds);
  useIsomorphicLayoutEffect(() => {
    committedVisualBounds.current = visualBounds;
  }, [visualBoundsKey]);
  const committedPreserveViewport = (0, import_react7.useRef)(preserveViewport);
  useIsomorphicLayoutEffect(() => {
    committedPreserveViewport.current = preserveViewport;
  }, [preserveViewport]);
  (0, import_react7.useEffect)(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let disposed = false;
    let frame = null;
    let pane = null;
    let measurementKey = chartMeasurementKey(store.getState());
    let panZoom = store.getState().panZoom;
    let lastTransform = [...store.getState().transform];
    let autoOwned = true;
    let pendingFit = true;
    let applyingFit = false;
    let lastSuccessfulViewport = null;
    const desiredViewport = (state) => {
      let nodeLookup = state.nodeLookup;
      if (focusNodeIds?.length) {
        const selected = /* @__PURE__ */ new Map();
        for (const id of focusNodeIds) {
          const node = nodeLookup.get(id);
          if (!node || node.hidden) return null;
          selected.set(id, node);
        }
        nodeLookup = selected;
      }
      return chartFitViewport({ ...state, nodeLookup, visualBounds: committedVisualBounds.current, maxZoom: maxAutoZoom === void 0 ? state.maxZoom : Math.min(state.maxZoom, maxAutoZoom) }, padding2);
    };
    const readContainerKey = () => {
      const state = store.getState();
      const outer = wrapper.getBoundingClientRect();
      const inner = state.domNode?.getBoundingClientRect();
      return JSON.stringify([outer.width, outer.height, inner?.width, inner?.height, state.width, state.height]);
    };
    let containerKey = readContainerKey();
    const cancelFrame = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    const requestFit = () => {
      if (disposed || !pendingFit) return;
      cancelFrame();
      frame = requestAnimationFrame(() => {
        frame = null;
        if (disposed || !pendingFit) return;
        const state = store.getState();
        if (!state.panZoom || !hasVisibleArea(wrapper) || !hasVisibleArea(state.domNode)) return;
        const viewport = desiredViewport(state);
        if (!viewport) return;
        pendingFit = false;
        lastSuccessfulViewport = JSON.stringify(viewport);
        applyingFit = true;
        try {
          void setViewport(viewport, { duration: 0 });
        } finally {
          applyingFit = false;
        }
      });
    };
    const requestIntent = () => {
      autoOwned = true;
      pendingFit = true;
      requestFit();
    };
    const checkContainer = () => {
      const nextKey = readContainerKey();
      if (nextKey === containerKey) {
        requestFit();
        return;
      }
      containerKey = nextKey;
      if (committedPreserveViewport.current && !autoOwned) {
        requestFit();
        return;
      }
      requestIntent();
    };
    requestLayoutFit.current = () => {
      if (!autoOwned) return;
      pendingFit = true;
      requestFit();
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(checkContainer);
    observer?.observe(wrapper);
    const observePane = () => {
      const current = store.getState().domNode;
      if (current === pane) return false;
      if (pane && pane !== wrapper) observer?.unobserve(pane);
      pane = current;
      if (pane && pane !== wrapper) observer?.observe(pane);
      return true;
    };
    observePane();
    const unsubscribe = store.subscribe((state) => {
      const cameraChanged = state.transform.some((value, index) => value !== lastTransform[index]);
      lastTransform = [...state.transform];
      if (cameraChanged && !applyingFit) {
        autoOwned = false;
        pendingFit = false;
        cancelFrame();
      }
      const paneChanged = observePane();
      const nextKey = chartMeasurementKey(state);
      const measurementsChanged = nextKey !== measurementKey;
      const viewportChanged = state.panZoom !== panZoom;
      measurementKey = nextKey;
      panZoom = state.panZoom;
      if (paneChanged || viewportChanged) requestIntent();
      if (measurementsChanged) {
        checkContainer();
        const viewport = desiredViewport(state);
        if (autoOwned && viewport && JSON.stringify(viewport) !== lastSuccessfulViewport) pendingFit = true;
        requestFit();
      }
    });
    window.addEventListener("resize", checkContainer);
    requestFit();
    return () => {
      disposed = true;
      unsubscribe();
      observer?.disconnect();
      requestLayoutFit.current = null;
      window.removeEventListener("resize", checkContainer);
      cancelFrame();
    };
  }, [store, setViewport, wrapperRef, padding2, refitKey, focusNodeIds, focusRequestKey, maxAutoZoom]);
  (0, import_react7.useEffect)(() => {
    requestLayoutFit.current?.();
  }, [layoutKey]);
  (0, import_react7.useEffect)(() => {
    requestLayoutFit.current?.();
  }, [visualBoundsKey]);
}
function ChartAutoRefit(props) {
  useChartAutoRefit(props);
  return null;
}

// src/components/GroupedFlowDiagram/DiagramNodes.tsx
var import_react10 = require("react");
var import_react11 = require("@xyflow/react");

// src/components/GroupContainerNode/GroupContainerNode.tsx
var import_react9 = require("@xyflow/react");
var import_jsx_runtime4 = require("react/jsx-runtime");
function GroupContainerNode({ data }) {
  const d = data;
  const expandable = d.headerMode === "expandable";
  const unstyled = d.unstyled === true;
  const ui = componentStyles();
  const borderColor = d.error ? theme.error : expandable && d.highlighted ? theme.tracing : d.active ? theme.primary : d.done ? theme.nodeVisited : theme.border;
  const recordedStatus = d.error ? "Failed" : d.active ? "Selected" : d.done ? "Visited" : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "div",
    {
      "data-fp": "group-container-node",
      "data-active": d.active || void 0,
      "data-done": d.done || void 0,
      "data-error": d.error || void 0,
      "data-unstyled": unstyled || void 0,
      style: {
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        position: "relative",
        ...!unstyled && {
          border: `${v("--fp-node-border-width", `calc(${ui.borderWidth} + 0.5px)`)} ${v("--fp-node-border-style", d.active || d.done || d.error ? "solid" : "dashed")} ${v("--fp-node-border-color", borderColor)}`,
          borderRadius: v("--fp-node-radius", `calc(${ui.radiusPanel} + 4px)`),
          boxShadow: v("--fp-node-shadow", "none"),
          // Translucent (theme-derived) so the dotted background + nested children
          // read clearly, while still following dark/light.
          background: `color-mix(in srgb, ${theme.textMuted} 7%, transparent)`,
          opacity: d.dimmed ? 0.4 : 1
        }
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              ...!unstyled && {
                gap: ui.controlGap,
                padding: `${ui.spaceSm} ${ui.spaceMd}`,
                fontSize: expandable && d.compactHeader ? `calc(${ui.body} + 2px)` : ui.body,
                fontWeight: `calc(${ui.weightStrong} - 100)`,
                color: theme.textMuted,
                letterSpacing: 0.2
              }
            },
            children: [
              (expandable ? d.iconContent : void 0) ?? (d.icon ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { "aria-hidden": true, children: d.icon }) : null),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { title: d.label, style: expandable && d.compactHeader ? { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : void 0, children: d.label }),
              !unstyled && recordedStatus && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "span",
                {
                  "data-fp": "group-status-badge",
                  style: {
                    display: v("--fp-node-group-status-display", "none"),
                    alignItems: "center",
                    gap: 4,
                    marginLeft: "auto",
                    flexShrink: 0,
                    fontFamily: theme.fontSans,
                    fontSize: ui.small,
                    color: theme.textPrimary
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { "aria-hidden": "true", style: { width: 6, height: 6, borderRadius: "50%", background: borderColor } }),
                    recordedStatus
                  ]
                }
              ),
              expandable && d.headerAction ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { marginLeft: "auto", flexShrink: 0 }, children: d.headerAction }) : null
            ]
          }
        ),
        expandable && d.statusLabel ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { id: d.statusLabelId, title: d.statusLabel, style: { ...!unstyled && { padding: `0 ${ui.spaceMd}`, fontSize: ui.label, color: theme.textSecondary }, ...d.compactHeader ? { maxHeight: 32, lineHeight: unstyled ? void 0 : "16px", overflow: "hidden" } : {} }, children: d.statusLabel }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_react9.Handle, { type: "target", position: expandable && d.handleDirection === "LR" ? import_react9.Position.Left : import_react9.Position.Top, style: unstyled ? void 0 : { opacity: 0 } }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_react9.Handle, { type: "source", position: expandable && d.handleDirection === "LR" ? import_react9.Position.Right : import_react9.Position.Bottom, style: unstyled ? void 0 : { opacity: 0 } })
      ]
    }
  );
}

// src/components/GroupedFlowDiagram/icons.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var paths = {
  cart: "M3 4h3l3 14h13l4-10H7 M10 24h.1 M22 24h.1",
  card: "M4 7h24v18H4z M4 12h24 M8 20h6",
  payment: "M16 3v26 M22 9c-2-4-13-3-12 3 1 5 13 2 13 8 0 6-12 7-15 2",
  shipping: "M3 8h16v15H3z M19 13h6l4 6v4H19 M8 26h.1 M24 26h.1",
  label: "M3 8h18l8 8-8 8H3z M8 12v8 M11 12v8 M15 12v8 M18 12v8",
  lock: "M7 14h18v15H7z M11 14V8c0-8 10-8 10 0v6",
  alert: "M16 3 30 28H2z M16 11v8 M16 23h.1",
  flow: "M4 4h9v8H4z M20 20h9v8h-9z M8 12v12h12 M20 4h9v8h-9z M13 8h7",
  step: "M5 5h22v22H5z M10 16l4 4 8-9"
};
function DiagramIcon({ icon, style }) {
  const path = icon && Object.prototype.hasOwnProperty.call(paths, icon) ? paths[icon] : void 0;
  if (!path && icon && /\p{Extended_Pictographic}/u.test(icon)) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { "aria-hidden": "true", style: { fontSize: 28, lineHeight: 1, ...style }, children: icon });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { "aria-hidden": "true", width: "30", height: "30", viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: "2.3", strokeLinecap: "round", strokeLinejoin: "round", style, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: path ?? paths.step }) });
}

// src/components/GroupedFlowDiagram/DiagramNodes.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
var statusText = { unknown: "Status unknown", running: "Running", completed: "Completed", failed: "Failed", "not-run": "Not run (recorded)" };
var smallButton = { font: "inherit", border: `1px solid ${theme.border}`, borderRadius: 8, padding: "5px 10px", background: theme.bgElevated, color: theme.textPrimary, cursor: "pointer" };
function DependencyHandles({ ports = [] }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_jsx_runtime6.Fragment, { children: ports.map((port) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    import_react11.Handle,
    {
      id: port.id,
      type: port.type,
      "data-recorded-port": port.id,
      position: { left: import_react11.Position.Left, right: import_react11.Position.Right, top: import_react11.Position.Top, bottom: import_react11.Position.Bottom }[port.side],
      isConnectable: false,
      style: { opacity: 0, pointerEvents: "none", ...port.side === "top" || port.side === "bottom" ? { left: port.offset } : { top: port.offset } }
    },
    port.id
  )) });
}
function CauseBadge({ item }) {
  if (!item.isRootCause && !item.containsRootCause) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: {
    position: "absolute",
    zIndex: 2,
    top: -12,
    left: 10,
    padding: "4px 9px",
    borderRadius: 7,
    fontSize: 11,
    lineHeight: "16px",
    fontWeight: 700,
    color: item.isRootCause ? theme.bg : theme.textSecondary,
    background: item.isRootCause ? theme.textPrimary : theme.bgElevated,
    border: `1px solid ${theme.tracing}`,
    pointerEvents: "none"
  }, children: item.isRootCause ? "Supported cause" : "Cause inside" });
}
function DiagramGroupNode(props) {
  const d = props.data, item = d.item;
  const statusId = (0, import_react10.useId)();
  const action2 = /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    "button",
    {
      type: "button",
      className: "nodrag nopan",
      style: smallButton,
      disabled: !d.canToggle,
      "aria-label": `Collapse ${item.node.label}${d.caption ? ` \xB7 ${d.caption}` : ""}`,
      "aria-expanded": "true",
      "aria-describedby": statusId,
      onClick: (event) => {
        event.stopPropagation();
        d.onToggle(item.node.id);
      },
      children: "Collapse"
    }
  );
  const text3 = [d.caption, statusText[item.state], item.recordedIssueCount ? `${item.recordedIssueCount} recorded issue${item.recordedIssueCount === 1 ? "" : "s"} inside` : "", item.containsSelection ? "Selection inside" : ""].filter(Boolean).join(" \xB7 ");
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { "data-node-id": item.node.id, "data-state": item.state, "data-highlighted": item.highlighted, "data-selected": d.selected, "data-expanded": "true", style: { position: "relative", width: "100%", height: "100%" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(GroupContainerNode, { ...props, data: {
      label: item.node.label,
      headerMode: "expandable",
      iconContent: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DiagramIcon, { icon: item.node.icon ?? "flow", style: { width: 22, height: 22, color: theme.nodeMain } }),
      headerAction: action2,
      statusLabel: text3,
      statusLabelId: statusId,
      handleDirection: d.direction,
      highlighted: item.highlighted,
      compactHeader: true,
      error: item.state === "failed",
      done: item.state === "completed",
      active: item.state === "running"
    } }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DependencyHandles, { ports: d.recordedPorts }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CauseBadge, { item })
  ] });
}
function DiagramItemNode({ data: d }) {
  const item = d.item, node = item.node, group = node.kind === "group", decision = node.kind === "decision";
  const statusId = (0, import_react10.useId)();
  const border = item.state === "failed" ? theme.error : item.highlighted ? theme.tracing : group ? theme.nodeMain : theme.border;
  const caption = d.caption ? ` \xB7 ${d.caption}` : "";
  const action2 = group ? `Expand ${node.label}${caption}` : `Select ${node.label}${caption}`;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "div",
    {
      "data-node-id": node.id,
      "data-state": item.state,
      "data-highlighted": item.highlighted,
      "data-selected": d.selected,
      style: {
        position: "relative",
        width: item.width,
        height: item.height,
        color: theme.textPrimary,
        filter: item.highlighted ? "drop-shadow(0 0 9px color-mix(in srgb, var(--fp-tracing, #0d9488) 25%, transparent))" : void 0
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_react11.Handle, { type: "target", position: d.direction === "LR" ? import_react11.Position.Left : import_react11.Position.Top, isConnectable: false }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "button",
          {
            type: "button",
            className: "nodrag nopan",
            "aria-label": action2,
            "aria-describedby": `${statusId}${decision ? ` ${statusId}-decision` : ""}`,
            "aria-expanded": group ? false : void 0,
            "aria-pressed": group ? void 0 : d.selected,
            disabled: group && (!item.childCount || !d.canToggle),
            title: node.description ? `${node.label}. ${node.description}` : node.label,
            onClick: (event) => {
              event.stopPropagation();
              group ? d.onToggle(node.id) : d.onSelect(node.id);
            },
            style: {
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "12px 18px",
              fontFamily: theme.fontSans,
              cursor: "pointer",
              color: "inherit",
              borderWidth: 2,
              borderStyle: group || item.state === "not-run" ? "dashed" : "solid",
              borderColor: border,
              borderRadius: 16,
              background: theme.bgElevated,
              boxShadow: "0 7px 20px rgba(0, 0, 0, 0.03137255)",
              outline: d.selected ? `3px solid ${theme.tracing}` : void 0,
              outlineOffset: 4
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DiagramIcon, { icon: node.icon ?? (group ? "flow" : "step"), style: { color: item.state === "not-run" ? theme.textMuted : theme.warning } }),
              decision && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { id: `${statusId}-decision`, style: { fontSize: 10, lineHeight: "12px", color: theme.textSecondary }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { "aria-hidden": "true", children: "\u25C7 " }),
                "Decision"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { style: { fontSize: 18, lineHeight: 1.2, maxWidth: "100%", maxHeight: group ? 22 : 44, overflow: "hidden", overflowWrap: "anywhere", ...group ? { whiteSpace: "nowrap", textOverflow: "ellipsis" } : {} }, children: node.label }),
              d.caption && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: 10, color: theme.textSecondary }, children: d.caption }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { id: statusId, style: { fontSize: group ? 11 : 12, color: item.state === "failed" ? theme.error : theme.textSecondary }, children: [
                statusText[item.state],
                group ? ` \xB7 ${item.childCount ? `${item.childCount} items inside` : "Step information unavailable"}` : ""
              ] }),
              group && (item.recordedIssueCount > 0 || item.containsSelection) && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { style: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 6px", fontSize: 10 }, children: [
                item.recordedIssueCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { style: { color: theme.error }, children: [
                  item.recordedIssueCount,
                  " recorded issue",
                  item.recordedIssueCount === 1 ? "" : "s",
                  " inside"
                ] }),
                item.containsSelection && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { color: theme.tracing }, children: "Selection inside" })
              ] })
            ]
          }
        ),
        item.state === "completed" && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { "aria-hidden": "true", style: { position: "absolute", top: -9, right: -9, width: 26, height: 26, borderRadius: "50%", background: theme.success, color: "white", textAlign: "center", fontSize: 19 }, children: "\u2713" }),
        item.state === "failed" && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { "aria-hidden": "true", style: { position: "absolute", top: -9, right: -9, width: 26, height: 26, borderRadius: "50%", background: theme.error, color: "white", textAlign: "center", fontSize: 20 }, children: "\xD7" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_react11.Handle, { type: "source", position: d.direction === "LR" ? import_react11.Position.Right : import_react11.Position.Bottom, isConnectable: false }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DependencyHandles, { ports: d.recordedPorts }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CauseBadge, { item })
      ]
    }
  );
}
var diagramNodeTypes = { flowDiagramItem: DiagramItemNode, flowDiagramGroup: DiagramGroupNode };

// src/components/GroupedFlowDiagram/layout.ts
var import_dagre = __toESM(require("dagre"), 1);
var MAX_NODES = 512;
var MAX_EDGES = 1024;
var MAX_GROUP_DEPTH = 16;
var PADDING = 24;
var HEADER_HEIGHT = 72;
var CANVAS_PADDING = 24;
var STEP_WIDTH = 180;
var STEP_HEIGHT = 148;
var DECISION_HEIGHT = 172;
var GROUP_MIN_WIDTH = 220;
var GROUP_MIN_HEIGHT = 168;
var ERROR = {
  definition: "Provide a diagram with plain data objects and bounded node and edge arrays.",
  nodes: "Provide up to 512 nodes with unique IDs, short labels, and valid node details.",
  edges: "Provide up to 1024 edges with unique IDs, short labels, and existing node endpoints.",
  hierarchy: "Use existing groups as parents, remove parent cycles, and limit nesting to 16 groups.",
  options: "Provide plain diagram options with a supported direction and bounded ID lists.",
  expansion: "Expand only group IDs declared in this diagram.",
  selection: "Select a node ID declared in this diagram.",
  observation: "Provide valid recorded states only for node and edge IDs declared in this diagram.",
  contradiction: "Resolve conflicting recorded states: an observed connection cannot touch a step marked not run, and a group marked not run cannot contain recorded activity.",
  highlight: "Highlight only declared node and edge IDs; a cause marker must reference an item not recorded as not run.",
  layout: "Simplify the diagram structure and try arranging it again."
};
var admissionMessages = /* @__PURE__ */ new WeakMap();
var AdmissionError = class extends Error {
  constructor(message) {
    super(message);
    admissionMessages.set(this, message);
  }
};
function record(value, message) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new AdmissionError(message);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new AdmissionError(message);
  return value;
}
function field(object, key, message) {
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (!descriptor) return void 0;
  if (!("value" in descriptor)) throw new AdmissionError(message);
  return descriptor.value;
}
function array(value, limit2, message) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new AdmissionError(message);
  const length = field(value, "length", message);
  if (typeof length !== "number" || !Number.isInteger(length) || length > limit2) throw new AdmissionError(message);
  const result = [];
  for (let i = 0; i < length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
    if (!descriptor || !("value" in descriptor)) throw new AdmissionError(message);
    result.push(descriptor.value);
  }
  return result;
}
function text(value, limit2, message, allowEmpty = false) {
  if (typeof value !== "string" || value.length > limit2 || !allowEmpty && !value.trim() || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new AdmissionError(message);
  }
  return value;
}
function optionalText(value, limit2, message) {
  return value === void 0 ? void 0 : text(value, limit2, message, true);
}
function admitDefinition(input) {
  const source = record(input, ERROR.definition);
  const nodeValues = array(field(source, "nodes", ERROR.definition), MAX_NODES, ERROR.nodes);
  const edgeValues = array(field(source, "edges", ERROR.definition), MAX_EDGES, ERROR.edges);
  const byId = /* @__PURE__ */ new Map();
  const nodes = nodeValues.map((value) => {
    const item = record(value, ERROR.nodes);
    const id = text(field(item, "id", ERROR.nodes), 256, ERROR.nodes);
    const label = text(field(item, "label", ERROR.nodes), 160, ERROR.nodes);
    const kindValue = field(item, "kind", ERROR.nodes);
    if (kindValue !== void 0 && kindValue !== "step" && kindValue !== "decision" && kindValue !== "group") throw new AdmissionError(ERROR.nodes);
    const parentValue = field(item, "parentId", ERROR.nodes);
    const parentId = parentValue === void 0 ? void 0 : text(parentValue, 256, ERROR.nodes);
    const description = optionalText(field(item, "description", ERROR.nodes), 320, ERROR.nodes);
    const icon = optionalText(field(item, "icon", ERROR.nodes), 32, ERROR.nodes);
    if (icon !== void 0 && (!icon.length || /[<>&/\\:\s]/u.test(icon))) throw new AdmissionError(ERROR.nodes);
    if (byId.has(id)) throw new AdmissionError(ERROR.nodes);
    const node = {
      id,
      label,
      kind: kindValue ?? "step",
      ...parentId !== void 0 ? { parentId } : {},
      ...description !== void 0 ? { description } : {},
      ...icon !== void 0 ? { icon } : {}
    };
    byId.set(id, node);
    return node;
  });
  const edgeIds = /* @__PURE__ */ new Set();
  const edges = edgeValues.map((value) => {
    const item = record(value, ERROR.edges);
    const id = text(field(item, "id", ERROR.edges), 256, ERROR.edges);
    const sourceId = text(field(item, "source", ERROR.edges), 256, ERROR.edges);
    const target = text(field(item, "target", ERROR.edges), 256, ERROR.edges);
    const label = optionalText(field(item, "label", ERROR.edges), 160, ERROR.edges);
    if (edgeIds.has(id) || !byId.has(sourceId) || !byId.has(target)) throw new AdmissionError(ERROR.edges);
    edgeIds.add(id);
    return { id, source: sourceId, target, ...label !== void 0 ? { label } : {} };
  });
  const ancestors = /* @__PURE__ */ new Map();
  const children = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    const path = [];
    const visited = /* @__PURE__ */ new Set([node.id]);
    let parentId = node.parentId;
    while (parentId !== void 0) {
      const parent = byId.get(parentId);
      if (!parent || parent.kind !== "group" || visited.has(parentId)) throw new AdmissionError(ERROR.hierarchy);
      visited.add(parentId);
      path.unshift(parentId);
      if (path.length + (node.kind === "group" ? 1 : 0) > MAX_GROUP_DEPTH) throw new AdmissionError(ERROR.hierarchy);
      parentId = parent.parentId;
    }
    ancestors.set(node.id, path);
    const siblings = children.get(node.parentId) ?? [];
    siblings.push(node);
    children.set(node.parentId, siblings);
  }
  return { nodes, edges, byId, edgeIds, ancestors, children };
}
function idList(value, limit2, message) {
  return value === void 0 ? [] : array(value, limit2, message).map((item) => text(item, 256, message));
}
function stateMap(value, ids, limit2, states) {
  const result = /* @__PURE__ */ new Map();
  if (value === void 0) return result;
  const object = record(value, ERROR.observation);
  const keys = Object.getOwnPropertyNames(object);
  if (keys.length > limit2 || Object.getOwnPropertySymbols(object).length) throw new AdmissionError(ERROR.observation);
  for (const key of keys) {
    const state = field(object, key, ERROR.observation);
    if (!ids.has(key) || typeof state !== "string" || !states.includes(state)) throw new AdmissionError(ERROR.observation);
    result.set(key, state);
  }
  return result;
}
function admitOptions(value, definition) {
  const object = value === void 0 ? {} : record(value, ERROR.options);
  const directionValue = field(object, "direction", ERROR.options);
  const direction = directionValue === void 0 ? "LR" : directionValue;
  if (direction !== "LR" && direction !== "TB") throw new AdmissionError(ERROR.options);
  const expanded = new Set(idList(field(object, "expandedGroupIds", ERROR.options), MAX_NODES, ERROR.options));
  for (const id of expanded) if (definition.byId.get(id)?.kind !== "group") throw new AdmissionError(ERROR.expansion);
  const selected = field(object, "selectedNodeId", ERROR.options);
  const selectedNodeId = selected === void 0 ? void 0 : text(selected, 256, ERROR.selection);
  if (selectedNodeId !== void 0 && !definition.byId.has(selectedNodeId)) throw new AdmissionError(ERROR.selection);
  const observationValue = field(object, "observation", ERROR.options);
  const observation = observationValue === void 0 ? {} : record(observationValue, ERROR.observation);
  const nodeStates = stateMap(field(observation, "nodeStates", ERROR.observation), definition.byId, MAX_NODES, ["unknown", "running", "completed", "failed", "not-run"]);
  const edgeStates = stateMap(field(observation, "edgeStates", ERROR.observation), definition.edgeIds, MAX_EDGES, ["unknown", "observed", "not-taken"]);
  const notRunAtOrAbove = (id) => nodeStates.get(id) === "not-run" || definition.ancestors.get(id).some((parent) => nodeStates.get(parent) === "not-run");
  for (const edge of definition.edges) {
    if (edgeStates.get(edge.id) === "observed" && (notRunAtOrAbove(edge.source) || notRunAtOrAbove(edge.target))) {
      throw new AdmissionError(ERROR.contradiction);
    }
  }
  for (const node of definition.nodes) {
    const state = nodeStates.get(node.id);
    if (state === "running" || state === "completed" || state === "failed") {
      if (definition.ancestors.get(node.id).some((id) => nodeStates.get(id) === "not-run")) throw new AdmissionError(ERROR.contradiction);
    }
  }
  const highlightValue = field(object, "highlight", ERROR.options);
  const highlight = highlightValue === void 0 ? {} : record(highlightValue, ERROR.highlight);
  const highlightedNodes = new Set(idList(field(highlight, "nodeIds", ERROR.highlight), MAX_NODES, ERROR.highlight));
  const highlightedEdges = new Set(idList(field(highlight, "edgeIds", ERROR.highlight), MAX_EDGES, ERROR.highlight));
  for (const id of highlightedNodes) if (!definition.byId.has(id)) throw new AdmissionError(ERROR.highlight);
  for (const id of highlightedEdges) if (!definition.edgeIds.has(id)) throw new AdmissionError(ERROR.highlight);
  const root = field(highlight, "rootCauseId", ERROR.highlight);
  const rootCauseId = root === void 0 ? void 0 : text(root, 256, ERROR.highlight);
  if (rootCauseId !== void 0 && (!definition.byId.has(rootCauseId) || notRunAtOrAbove(rootCauseId))) throw new AdmissionError(ERROR.highlight);
  for (const id of [...highlightedNodes]) for (const parent of definition.ancestors.get(id)) highlightedNodes.add(parent);
  for (const edge of definition.edges) {
    if (!highlightedEdges.has(edge.id)) continue;
    for (const id of [edge.source, edge.target]) {
      if (definition.byId.get(id).kind === "group") highlightedNodes.add(id);
      for (const parent of definition.ancestors.get(id)) highlightedNodes.add(parent);
    }
  }
  return { expanded, direction, selectedNodeId, nodeStates, edgeStates, highlightedNodes, highlightedEdges, rootCauseId };
}
function getFlowDiagramAncestors(definition, nodeId) {
  try {
    const admitted = admitDefinition(definition);
    return typeof nodeId === "string" ? [...admitted.ancestors.get(nodeId) ?? []] : [];
  } catch {
    return [];
  }
}
function projectGroupedFlowDiagram(definition, options) {
  try {
    const data = admitDefinition(definition);
    const config = admitOptions(options, data);
    const representative = (id) => data.ancestors.get(id).find((parent) => !config.expanded.has(parent)) ?? id;
    const edges = [];
    for (const edge of data.edges) {
      const source = representative(edge.source);
      const target = representative(edge.target);
      const collapsed = source !== edge.source || target !== edge.target;
      if (collapsed && source === target) continue;
      edges.push({ edge, source, target, collapsed, state: config.edgeStates.get(edge.id) ?? "unknown", highlighted: config.highlightedEdges.has(edge.id) });
    }
    const positions = /* @__PURE__ */ new Map();
    const sizes = /* @__PURE__ */ new Map();
    const childAtLevel = (id, parentId) => {
      const path = data.ancestors.get(id);
      if (parentId === void 0) return path[0] ?? id;
      const parentIndex = path.indexOf(parentId);
      return parentIndex < 0 ? void 0 : path[parentIndex + 1] ?? id;
    };
    const arrangeChildren = (parentId) => {
      const children = data.children.get(parentId) ?? [];
      if (!children.length) return { width: 0, height: 0 };
      const graph = new import_dagre.default.graphlib.Graph({ multigraph: true });
      graph.setGraph({ rankdir: config.direction, ranksep: 40, nodesep: 44, edgesep: 20, ranker: "longest-path" });
      graph.setDefaultEdgeLabel(() => ({}));
      const internalIds = /* @__PURE__ */ new Map();
      children.forEach((child, index) => {
        let size;
        if (child.kind === "group" && config.expanded.has(child.id)) {
          const contents = arrangeChildren(child.id);
          size = {
            width: Math.max(GROUP_MIN_WIDTH, contents.width + PADDING * 2),
            height: Math.max(GROUP_MIN_HEIGHT, contents.height + PADDING * 2 + HEADER_HEIGHT)
          };
        } else size = child.kind === "group" ? { width: GROUP_MIN_WIDTH, height: GROUP_MIN_HEIGHT } : { width: STEP_WIDTH, height: child.kind === "decision" ? DECISION_HEIGHT : STEP_HEIGHT };
        sizes.set(child.id, size);
        const internalId = `n${index}`;
        internalIds.set(child.id, internalId);
        graph.setNode(internalId, size);
      });
      edges.forEach((edge, index) => {
        const source = childAtLevel(edge.source, parentId);
        const target = childAtLevel(edge.target, parentId);
        if (source === void 0 || target === void 0 || source === target) return;
        const internalSource = internalIds.get(source);
        const internalTarget = internalIds.get(target);
        if (internalSource !== void 0 && internalTarget !== void 0) graph.setEdge(internalSource, internalTarget, {}, `e${index}`);
      });
      import_dagre.default.layout(graph);
      const raw = children.map((child) => {
        const placed = graph.node(internalIds.get(child.id));
        const size = sizes.get(child.id);
        if (!placed || !Number.isFinite(placed.x) || !Number.isFinite(placed.y)) throw new Error(ERROR.layout);
        return { child, size, x: placed.x - size.width / 2, y: placed.y - size.height / 2 };
      });
      const minX = Math.min(...raw.map((item) => item.x));
      const minY = Math.min(...raw.map((item) => item.y));
      const offsetX = parentId === void 0 ? CANVAS_PADDING : PADDING;
      const offsetY = parentId === void 0 ? CANVAS_PADDING : PADDING + HEADER_HEIGHT;
      let width = 0;
      let height = 0;
      for (const item of raw) {
        const x = item.x - minX;
        const y = item.y - minY;
        positions.set(item.child.id, { x: x + offsetX, y: y + offsetY });
        width = Math.max(width, x + item.size.width);
        height = Math.max(height, y + item.size.height);
      }
      return { width, height };
    };
    const canvas = arrangeChildren();
    const issueCounts = /* @__PURE__ */ new Map();
    for (const [id, state] of config.nodeStates) {
      if (state === "failed") for (const parent of data.ancestors.get(id)) issueCounts.set(parent, (issueCounts.get(parent) ?? 0) + 1);
    }
    const selectedAncestors = new Set(config.selectedNodeId ? data.ancestors.get(config.selectedNodeId) : []);
    const causeAncestors = new Set(config.rootCauseId ? data.ancestors.get(config.rootCauseId) : []);
    const nodes = [];
    const appendChildren = (parentId) => {
      for (const node of data.children.get(parentId) ?? []) {
        const expanded = node.kind === "group" && config.expanded.has(node.id);
        nodes.push({
          node,
          ...node.parentId !== void 0 ? { parentId: node.parentId } : {},
          position: positions.get(node.id),
          ...sizes.get(node.id),
          state: config.nodeStates.get(node.id) ?? "unknown",
          expanded,
          childCount: data.children.get(node.id)?.length ?? 0,
          recordedIssueCount: issueCounts.get(node.id) ?? 0,
          containsSelection: selectedAncestors.has(node.id),
          highlighted: config.highlightedNodes.has(node.id),
          ...config.rootCauseId !== void 0 ? { isRootCause: config.rootCauseId === node.id, containsRootCause: causeAncestors.has(node.id) } : {}
        });
        if (expanded) appendChildren(node.id);
      }
    };
    appendChildren();
    return {
      model: {
        definition: { nodes: data.nodes, edges: data.edges },
        nodeStates: Object.fromEntries(data.nodes.map((node) => [node.id, config.nodeStates.get(node.id) ?? "unknown"])),
        nodes,
        edges,
        direction: config.direction,
        width: canvas.width ? canvas.width + CANVAS_PADDING * 2 : 0,
        height: canvas.height ? canvas.height + CANVAS_PADDING * 2 : 0,
        expandedGroupIds: data.nodes.filter((node) => config.expanded.has(node.id)).map((node) => node.id)
      }
    };
  } catch (error) {
    const message = typeof error === "object" && error !== null ? admissionMessages.get(error) : void 0;
    return { error: message ?? ERROR.layout };
  }
}

// src/recordedRelationships/attribution.ts
var attributions = Object.freeze({
  "per-write": Object.freeze({ label: "Per-write link", caption: void 0 }),
  stage: Object.freeze({ label: "Step-level link", caption: "Step" }),
  "recorded-control": Object.freeze({ label: "Recorded control", caption: void 0 }),
  "recorded-read": Object.freeze({ label: "Recorded read", caption: "Read" }),
  "recorded-write": Object.freeze({ label: "Recorded write (retained value)", caption: "Kept" })
});
function isRecordedAttribution(value) {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(attributions, value);
}
function admitsRecordedAttribution(value, kind) {
  return isRecordedAttribution(value) && (value !== "recorded-write" || kind === "data");
}
function recordedAttributionLabel(value) {
  return attributions[value].label;
}
function recordedAttributionCaption(value, kind) {
  if (isRecordedAttribution(value)) {
    const caption = attributions[value].caption;
    if (caption !== void 0) return caption;
  }
  return kind === "control" ? "Rule" : kind === "data" ? "Data" : "Link";
}

// src/components/GroupedFlowDiagram/relationships.ts
function field2(value, key) {
  if (!value || typeof value !== "object") throw new Error();
  const item = Object.getOwnPropertyDescriptor(value, key);
  if (!item) return void 0;
  if (!("value" in item)) throw new Error();
  return item.value;
}
function plain(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error();
}
function list(value, max) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new Error();
  const length = field2(value, "length");
  if (typeof length !== "number" || !Number.isInteger(length) || length < 0 || length > max) throw new Error();
  return Array.from({ length }, (_, index) => {
    const item = Object.getOwnPropertyDescriptor(value, String(index));
    if (!item || !("value" in item)) throw new Error();
    return item.value;
  });
}
function text2(value, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new Error();
  return value;
}
function projectRecordedRelationships(value, model) {
  try {
    if (!model.nodeStates) return void 0;
    const nodeStates = model.nodeStates;
    const nodes = new Map(model.definition.nodes.map((node) => [node.id, node]));
    const used = new Set(model.definition.edges.map((edge) => edge.id));
    const expanded = new Set(model.expandedGroupIds);
    const notRun = (id) => {
      let current = id;
      while (current !== void 0) {
        if (nodeStates[current] === "not-run") return true;
        current = nodes.get(current)?.parentId;
      }
      return false;
    };
    let remaining = 65536;
    const readText = (value2, maximum) => {
      const result = text2(value2, maximum);
      remaining -= result.length;
      if (remaining < 0) throw new Error();
      return result;
    };
    const representative = (id) => {
      const ancestors = [];
      let parent = nodes.get(id)?.parentId;
      while (parent !== void 0) {
        ancestors.unshift(parent);
        parent = nodes.get(parent)?.parentId;
      }
      return ancestors.find((ancestor) => !expanded.has(ancestor)) ?? id;
    };
    const admitted = list(value, 512).map((entry) => {
      plain(entry);
      const id = readText(field2(entry, "id"), 256), source = readText(field2(entry, "source"), 256), target = readText(field2(entry, "target"), 256);
      const kind = field2(entry, "kind"), attribution = field2(entry, "attribution"), direction = field2(entry, "direction");
      if (used.has(id) || !nodes.has(source) || !nodes.has(target) || notRun(source) || notRun(target) || kind !== "data" && kind !== "control" || !admitsRecordedAttribution(attribution, kind) || direction !== void 0 && direction !== "backward" && direction !== "forward") throw new Error();
      used.add(id);
      return {
        id,
        source,
        target,
        kind,
        attribution,
        evidence: list(field2(entry, "evidence"), 32).map((value2) => readText(value2, 2048)),
        ...direction !== void 0 ? { direction } : {}
      };
    });
    return admitted.flatMap((relationship) => {
      const source = representative(relationship.source), target = representative(relationship.target);
      const collapsed = source !== relationship.source || target !== relationship.target;
      return collapsed && source === target ? [] : [{ relationship, source, target, collapsed }];
    });
  } catch {
    return void 0;
  }
}
function admitFocusRequest(value, model) {
  try {
    plain(value);
    const known = new Set(model.definition.nodes.map((node) => node.id));
    const nodeIds = list(field2(value, "nodeIds"), 512).map((value2) => text2(value2, 256));
    if (nodeIds.some((id) => !known.has(id))) return void 0;
    return { key: field2(value, "key"), nodeIds: [...new Set(nodeIds)] };
  } catch {
    return void 0;
  }
}

// src/components/GroupedFlowDiagram/RecordedRelationshipEdge.tsx
var import_react14 = require("@xyflow/react");

// src/components/GroupedFlowDiagram/recordedRouting.ts
var import_react12 = require("@xyflow/react");
var SIDE = { left: import_react12.Position.Left, right: import_react12.Position.Right, top: import_react12.Position.Top, bottom: import_react12.Position.Bottom };
var HALO = 16;
var STUB = 18;
var MAX_WORK = 2e6;
var MAX_VISITS = 1e5;
var intersects = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
var point = (box2, side, offset) => ({
  x: side === "left" ? box2.x : side === "right" ? box2.x + box2.width : box2.x + (offset ?? box2.width / 2),
  y: side === "top" ? box2.y : side === "bottom" ? box2.y + box2.height : box2.y + (offset ?? box2.height / 2)
});
var escape = (p, side) => ({ x: p.x + (side === "left" ? -STUB : side === "right" ? STUB : 0), y: p.y + (side === "top" ? -STUB : side === "bottom" ? STUB : 0) });
var crossing = (a, b, box2) => a.x === b.x ? a.x > box2.x && a.x < box2.x + box2.width && Math.max(a.y, b.y) > box2.y && Math.min(a.y, b.y) < box2.y + box2.height : a.y > box2.y && a.y < box2.y + box2.height && Math.max(a.x, b.x) > box2.x && Math.min(a.x, b.x) < box2.x + box2.width;
var distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
var Queue = class {
  constructor() {
    this.items = [];
  }
  before(a, b) {
    return a.score < b.score || a.score === b.score && a.key < b.key;
  }
  push(value) {
    let at2 = this.items.length;
    this.items.push(value);
    while (at2) {
      const parent = at2 - 1 >> 1;
      if (!this.before(value, this.items[parent])) break;
      this.items[at2] = this.items[parent];
      at2 = parent;
    }
    this.items[at2] = value;
  }
  pop() {
    const result = this.items[0], last = this.items.pop();
    if (!this.items.length || !last) return result;
    let at2 = 0;
    while (at2 * 2 + 1 < this.items.length) {
      let child = at2 * 2 + 1;
      if (child + 1 < this.items.length && this.before(this.items[child + 1], this.items[child])) child++;
      if (!this.before(this.items[child], last)) break;
      this.items[at2] = this.items[child];
      at2 = child;
    }
    this.items[at2] = last;
    return result;
  }
};
function routeRecordedRelationships(links, model) {
  const routes = /* @__PURE__ */ new Map(), decorations = /* @__PURE__ */ new Map();
  let work = 0, visits = 0;
  const outcome = () => ({ routes, decorations, undrawn: links.length - routes.size, work });
  if (model.nodes.length > 512 || model.edges.length > 1024 || links.length > 512) return outcome();
  const byId = new Map(model.nodes.map((item) => [item.node.id, item])), boxes = /* @__PURE__ */ new Map();
  const absolute = (item, depth = 0) => {
    if (depth > 16) throw new Error();
    const cached = boxes.get(item.node.id);
    if (cached) return cached;
    const parent = item.parentId ? byId.get(item.parentId) : void 0;
    if (item.parentId && !parent) throw new Error();
    const origin = parent ? absolute(parent, depth + 1) : { x: 0, y: 0 };
    const box2 = { x: item.position.x + origin.x, y: item.position.y + origin.y, width: item.width, height: item.height, owner: item.node.id };
    if (![box2.x, box2.y, box2.width, box2.height].every(Number.isFinite) || Math.max(Math.abs(box2.x), Math.abs(box2.y), box2.width, box2.height) > 1e6 || box2.width <= 0 || box2.height <= 0) throw new Error();
    boxes.set(item.node.id, box2);
    return box2;
  };
  try {
    for (const item of model.nodes) absolute(item);
  } catch {
    return outcome();
  }
  for (const item of model.nodes) if (item.isRootCause || item.containsRootCause) {
    const box2 = boxes.get(item.node.id);
    decorations.set(item.node.id, { x: box2.x, y: box2.y - 16, width: box2.width + 18, height: box2.height + 16 });
  }
  const obstacles = model.nodes.map((item) => {
    const box2 = boxes.get(item.node.id);
    return {
      x: box2.x - HALO,
      y: box2.y - (item.isRootCause || item.containsRootCause ? 28 : HALO),
      width: box2.width + HALO * 2,
      height: (item.expanded ? 72 : box2.height) + HALO + (item.isRootCause || item.containsRootCause ? 28 : HALO),
      owner: box2.owner
    };
  });
  for (const edge of model.edges) {
    if (!edge.edge.label) continue;
    const a = boxes.get(edge.source), b = boxes.get(edge.target);
    if (!a || !b) continue;
    const horizontal = model.direction === "LR", source = point(a, horizontal ? "right" : "bottom"), target = point(b, horizontal ? "left" : "top");
    const [, x, y] = (0, import_react12.getSmoothStepPath)({
      sourceX: source.x,
      sourceY: source.y,
      targetX: target.x,
      targetY: target.y,
      sourcePosition: horizontal ? import_react12.Position.Right : import_react12.Position.Bottom,
      targetPosition: horizontal ? import_react12.Position.Left : import_react12.Position.Top
    });
    const width2 = Math.min(180, edge.edge.label.length * 8 + 24);
    obstacles.push({ x: x - width2 / 2, y: y - 20, width: width2, height: 40 });
  }
  const ordered = [...links].sort((a, b) => a.relationship.id < b.relationship.id ? -1 : a.relationship.id > b.relationship.id ? 1 : 0);
  const candidates = /* @__PURE__ */ new Map();
  const facingSources = /* @__PURE__ */ new Map();
  const slots = (id, side, type, remote, remotePort) => {
    const box2 = boxes.get(id), item = byId.get(id), length = side === "top" || side === "bottom" ? box2.width : box2.height;
    const count2 = Math.min(6, Math.floor((length - 56) / 24) + 1), offsets = Array.from({ length: Math.max(0, count2) }, (_, index2) => 28 + (length - 56) * index2 / Math.max(1, count2 - 1)).filter((offset) => Math.abs(offset - length / 2) >= 20 && !(item.expanded && (side === "left" || side === "right") && offset < 96));
    const neighbour = side === "top" || side === "bottom" ? (remotePort?.x ?? remote.x + remote.width / 2) - box2.x : (remotePort?.y ?? remote.y + remote.height / 2) - box2.y;
    return offsets.sort((a, b) => Math.abs(a - neighbour) - Math.abs(b - neighbour) || (type === "source" ? a - b : b - a));
  };
  const xs = /* @__PURE__ */ new Set(), ys = /* @__PURE__ */ new Set();
  for (const box2 of obstacles) for (const offset of [-18, 0, 18]) {
    xs.add(box2.x + offset);
    xs.add(box2.x + box2.width + offset);
    ys.add(box2.y + offset);
    ys.add(box2.y + box2.height + offset);
  }
  for (const [ordinal, link] of ordered.entries()) {
    const a = boxes.get(link.source), b = boxes.get(link.target);
    if (!a || !b) continue;
    const backward = link.relationship.direction === "backward";
    const fallback2 = link.source === link.target ? [["bottom", "right"], ["right", "top"], ["left", "bottom"]] : model.direction === "LR" ? backward ? [["bottom", "bottom"], ["top", "top"], ["left", "right"]] : [["top", "top"], ["bottom", "bottom"], ["right", "left"]] : backward ? [["right", "right"], ["left", "left"], ["top", "bottom"]] : [["left", "left"], ["right", "right"], ["bottom", "top"]];
    const facing = link.source === link.target ? void 0 : model.direction === "LR" ? b.x + b.width + STUB * 2 <= a.x ? ["left", "right"] : a.x + a.width + STUB * 2 <= b.x ? ["right", "left"] : void 0 : b.y + b.height + STUB * 2 <= a.y ? ["top", "bottom"] : a.y + a.height + STUB * 2 <= b.y ? ["bottom", "top"] : void 0;
    if (facing) facingSources.set(link.relationship.id, facing[0]);
    const pairs = facing ? [facing, ...fallback2.filter((pair) => pair[0] !== facing[0] || pair[1] !== facing[1])] : fallback2;
    const options = pairs.filter(([sourceSide, targetSide]) => !(sourceSide === "top" && (byId.get(link.source)?.expanded || byId.get(link.source)?.isRootCause || byId.get(link.source)?.containsRootCause)) && !(targetSide === "top" && (byId.get(link.target)?.expanded || byId.get(link.target)?.isRootCause || byId.get(link.target)?.containsRootCause))).flatMap(([sourceSide, targetSide]) => slots(link.source, sourceSide, "source", b).flatMap((sourceOffset) => slots(link.target, targetSide, "target", a, point(a, sourceSide, sourceOffset)).map((targetOffset) => {
      const source = point(a, sourceSide, sourceOffset), target = point(b, targetSide, targetOffset), start = escape(source, sourceSide), end = escape(target, targetSide);
      for (const p of [start, end]) {
        xs.add(p.x);
        ys.add(p.y);
      }
      return {
        sourceSide,
        targetSide,
        source,
        target,
        start,
        end,
        sourcePort: { id: `recorded-${ordinal}-source`, type: "source", side: sourceSide, offset: sourceOffset },
        targetPort: { id: `recorded-${ordinal}-target`, type: "target", side: targetSide, offset: targetOffset }
      };
    })));
    candidates.set(link.relationship.id, options);
  }
  const fanGroups = /* @__PURE__ */ new Map(), fans = /* @__PURE__ */ new Map();
  for (const link of ordered) {
    const side = facingSources.get(link.relationship.id), relationship = link.relationship;
    if (!side || link.collapsed || link.source !== relationship.source || link.target !== relationship.target || !relationship.direction) continue;
    const key = JSON.stringify([relationship.source, relationship.direction, side, relationship.attribution === "stage"]);
    const group = fanGroups.get(key) ?? [];
    group.push(link);
    fanGroups.set(key, group);
  }
  for (const [key, group] of fanGroups) {
    if (group.length < 2 || new Set(group.map((link) => link.target)).size !== group.length) continue;
    const side = facingSources.get(group[0].relationship.id), box2 = boxes.get(group[0].source), length = side === "left" || side === "right" ? box2.height : box2.width;
    let common;
    for (const link of group) {
      const offsets = new Set((candidates.get(link.relationship.id) ?? []).filter((option) => option.sourceSide === side).map((option) => option.sourcePort.offset));
      common = common ? new Set([...common].filter((offset2) => offsets.has(offset2))) : offsets;
    }
    const offset = [...common].sort((a, b) => Math.abs(a - length / 2) - Math.abs(b - length / 2) || a - b)[0];
    if (offset !== void 0) for (const link of group) fans.set(link.relationship.id, { key, side, offset });
  }
  const columns = [...xs].sort((a, b) => a - b), rows = [...ys].sort((a, b) => a - b), width = columns.length;
  if (!width || !rows.length) return outcome();
  const position = (at2) => ({ x: columns[at2 % width], y: rows[Math.floor(at2 / width)] });
  const index = (p) => rows.indexOf(p.y) * width + columns.indexOf(p.x);
  const occupied = /* @__PURE__ */ new Map(), occupiedVertices = /* @__PURE__ */ new Map(), checked = /* @__PURE__ */ new Map(), labels = [], usedPorts = /* @__PURE__ */ new Map();
  const portKey = (id, port) => JSON.stringify([id, port.side, port.offset]);
  const segmentKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
  const clear = (a, b, boxes2, ignore) => {
    for (const box2 of boxes2) {
      if (work >= MAX_WORK) return false;
      work++;
      if ((ignore === void 0 || box2.owner !== ignore) && crossing(a, b, box2)) return false;
    }
    return true;
  };
  const search = (start, end) => {
    const from = index(start), to = index(end);
    if (from === to) return void 0;
    const queue = new Queue(), costs = /* @__PURE__ */ new Map(), parents = /* @__PURE__ */ new Map();
    queue.push({ at: from, direction: 0, cost: 0, score: distance(start, end), key: from * 3 });
    costs.set(from * 3, 0);
    let local = 0, current;
    while ((current = queue.pop()) && ++local <= 12e3 && ++visits <= MAX_VISITS && work < MAX_WORK) {
      if (costs.get(current.key) !== current.cost) continue;
      if (current.at === to) {
        const points = [], segments = [];
        let key = current.key;
        while (key !== void 0) {
          const at2 = Math.floor(key / 3), previous = parents.get(key);
          points.push(position(at2));
          if (previous !== void 0) segments.push(segmentKey(at2, Math.floor(previous / 3)));
          key = previous;
        }
        return { points: points.reverse(), segments };
      }
      const x = current.at % width, y = Math.floor(current.at / width), a = position(current.at);
      for (const next of [x > 0 ? current.at - 1 : -1, x + 1 < width ? current.at + 1 : -1, y > 0 ? current.at - width : -1, y + 1 < rows.length ? current.at + width : -1]) {
        if (next < 0) continue;
        const b = position(next), edge = segmentKey(current.at, next);
        let free = checked.get(edge);
        if (free === void 0) {
          free = clear(a, b, obstacles);
          checked.set(edge, free);
        }
        if (!free || !clear(a, b, labels)) continue;
        const direction = a.y === b.y ? 1 : 2, cost = current.cost + distance(a, b) + (current.direction && current.direction !== direction ? 20 : 0) + (occupied.get(edge) ?? 0) * (100 + distance(a, b) * 4) + (occupiedVertices.get(next) ?? 0) * 500;
        const key = next * 3 + direction;
        if (cost >= (costs.get(key) ?? Infinity)) continue;
        costs.set(key, cost);
        parents.set(key, current.key);
        queue.push({ at: next, direction, cost, score: cost + distance(b, end), key });
      }
    }
    return void 0;
  };
  const labelFor = (points) => {
    const segments = points.slice(1).map((b, at2) => ({ a: points[at2], b, length: distance(points[at2], b) })).sort((a, b) => b.length - a.length);
    for (const { a, b, length } of segments) {
      if (length < 28) continue;
      for (const fraction of [0.5, 0.25, 0.75, 0.125, 0.875]) for (const offset of [0, 20, -20, 38, -38]) {
        const horizontal = a.y === b.y, x = a.x + (b.x - a.x) * fraction + (horizontal ? 0 : offset), y = a.y + (b.y - a.y) * fraction + (horizontal ? offset : 0);
        const box2 = { x: x - 28, y: y - 15, width: 56, height: 30 };
        if ([...obstacles, ...labels].every((other) => {
          if (work >= MAX_WORK) return false;
          work++;
          return !intersects(box2, other);
        })) return { x, y, width: 48, height: 22, box: box2 };
      }
    }
    return void 0;
  };
  for (const link of ordered) {
    if (work >= MAX_WORK || visits > MAX_VISITS) break;
    const fan = fans.get(link.relationship.id), options = candidates.get(link.relationship.id) ?? [];
    const shared = (option) => fan !== void 0 && option.sourceSide === fan.side && option.sourcePort.offset === fan.offset;
    const preferred = fan ? [...options.filter(shared), ...options.filter((option) => !shared(option))] : options;
    for (const option of preferred) {
      const sourceKey = portKey(link.source, option.sourcePort), targetKey = portKey(link.target, option.targetPort);
      const sourceOwner = usedPorts.get(sourceKey);
      if (sourceOwner !== void 0 && (!shared(option) || sourceOwner !== fan?.key) || usedPorts.has(targetKey) || sourceKey === targetKey) continue;
      if (!clear(option.source, option.start, obstacles, link.source) || !clear(option.end, option.target, obstacles, link.target) || !clear(option.source, option.start, labels) || !clear(option.end, option.target, labels)) continue;
      const found = search(option.start, option.end);
      if (!found) continue;
      const corners = found.points.filter((p, at2, all) => !at2 || at2 === all.length - 1 || all[at2 - 1].x === p.x !== (p.x === all[at2 + 1].x));
      const points = [option.source, ...corners, option.target], label = labelFor(points);
      if (!label) continue;
      labels.push(label.box);
      for (const segment of found.segments) occupied.set(segment, (occupied.get(segment) ?? 0) + 1);
      for (const p of found.points) {
        const at2 = index(p);
        occupiedVertices.set(at2, (occupiedVertices.get(at2) ?? 0) + 1);
      }
      usedPorts.set(sourceKey, shared(option) ? fan.key : "");
      usedPorts.set(targetKey, "");
      routes.set(link.relationship.id, {
        points,
        sourceSide: option.sourceSide,
        targetSide: option.targetSide,
        sourcePort: option.sourcePort,
        targetPort: option.targetPort,
        label: { x: label.x, y: label.y, width: label.width, height: label.height }
      });
      break;
    }
  }
  return outcome();
}
function recordedRoutePath(route, source, target) {
  const interior = route.points.slice(1, -1).map((p) => ({ ...p }));
  const normalize = (anchor, side, reverse) => {
    const axis = side === "left" || side === "right" ? "y" : "x", from = reverse ? interior.length - 1 : 0;
    const expected = route.points[from + 1][axis];
    if (Math.abs(expected - anchor[axis]) > 1e-3) return;
    for (let at2 = from; at2 >= 0 && at2 < interior.length && route.points[at2 + 1][axis] === expected; at2 += reverse ? -1 : 1) interior[at2][axis] = anchor[axis];
  };
  normalize(source, route.sourceSide, false);
  normalize(target, route.targetSide, true);
  const start = interior[0], end = interior[interior.length - 1];
  const bridge = (p, actual, side) => side === "left" || side === "right" ? { x: p.x, y: actual.y } : { x: actual.x, y: p.y };
  const assembled = [source, bridge(start, source, route.sourceSide), ...interior, bridge(end, target, route.targetSide), target].filter((p, at2, all) => !at2 || p.x !== all[at2 - 1].x || p.y !== all[at2 - 1].y);
  const points = [];
  for (const next of assembled) {
    while (points.length > 1) {
      const a = points[points.length - 2], middle = points[points.length - 1];
      const straight = a.x === middle.x && middle.x === next.x && middle.y >= Math.min(a.y, next.y) && middle.y <= Math.max(a.y, next.y) || a.y === middle.y && middle.y === next.y && middle.x >= Math.min(a.x, next.x) && middle.x <= Math.max(a.x, next.x);
      if (!straight) break;
      points.pop();
    }
    points.push(next);
  }
  let path = `M${source.x},${source.y}`;
  for (let at2 = 1; at2 < points.length - 1; at2++) {
    const a = points[at2 - 1], p = points[at2], b = points[at2 + 1];
    const radius2 = Math.min(16, distance(a, p) / 2, distance(p, b) / 2);
    const before = { x: p.x + Math.sign(a.x - p.x) * radius2, y: p.y + Math.sign(a.y - p.y) * radius2 }, after = { x: p.x + Math.sign(b.x - p.x) * radius2, y: p.y + Math.sign(b.y - p.y) * radius2 };
    path += ` L${before.x},${before.y} Q${p.x},${p.y} ${after.x},${after.y}`;
  }
  return `${path} L${target.x},${target.y}`;
}
function recordedVisualBounds(plan, links, focus) {
  const selected = focus?.length ? new Set(focus) : void 0;
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  const include = (box2) => {
    left = Math.min(left, box2.x);
    top = Math.min(top, box2.y);
    right = Math.max(right, box2.x + box2.width);
    bottom = Math.max(bottom, box2.y + box2.height);
  };
  for (const [id, box2] of plan.decorations) if (!selected || selected.has(id)) include(box2);
  for (const link of links) {
    if (selected && (!selected.has(link.source) || !selected.has(link.target))) continue;
    const route = plan.routes.get(link.relationship.id);
    if (!route) continue;
    for (const p of route.points) include({ x: p.x - 2, y: p.y - 2, width: 4, height: 4 });
    include({ x: route.label.x - route.label.width / 2 - 6, y: route.label.y - route.label.height / 2 - 6, width: route.label.width + 12, height: route.label.height + 12 });
  }
  return Number.isFinite(left) ? { x: left, y: top, width: right - left, height: bottom - top } : void 0;
}

// src/components/GroupedFlowDiagram/RecordedRelationshipEdge.tsx
var import_react15 = require("react");

// src/components/GroupedFlowDiagram/presentation.ts
var import_react13 = require("react");
var RecordedFocusContext = (0, import_react13.createContext)({ focused: false });
function visibleRecordedFitTargets(ids, model) {
  if (ids.length > 512) return void 0;
  const declared = new Map(model.definition.nodes.map((node) => [node.id, node])), visible = new Set(model.nodes.map((item) => item.node.id)), result = /* @__PURE__ */ new Set();
  for (const id of ids) {
    if (!declared.has(id)) return void 0;
    let target = id, depth = 0;
    while (!visible.has(target)) {
      if (depth++ >= 16) return void 0;
      const parent = declared.get(target)?.parentId;
      if (parent === void 0 || !declared.has(parent)) return void 0;
      target = parent;
    }
    result.add(target);
  }
  return [...result];
}

// src/components/GroupedFlowDiagram/RecordedRelationshipEdge.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
function RecordedRelationshipEdge(props) {
  const { focused } = (0, import_react15.useContext)(RecordedFocusContext), [hovered, setHovered] = (0, import_react15.useState)(false);
  const data = props.data;
  const relationship = data?.relationship;
  const route = data?.route;
  if (!route) return null;
  const caption = recordedAttributionCaption(relationship?.attribution, relationship?.kind);
  const fullLabel = typeof props.label === "string" ? props.label : "Recorded dependency";
  const path = recordedRoutePath(route, { x: props.sourceX, y: props.sourceY }, { x: props.targetX, y: props.targetY });
  const { x, y } = route.label;
  const showCaption = !focused || caption !== "Data" || hovered || props.selected;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("g", { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), "data-recorded-connection": props.id, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("title", { children: fullLabel }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react14.BaseEdge, { id: props.id, path, markerEnd: props.markerEnd, style: props.style })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_react14.EdgeLabelRenderer, { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "span",
      {
        className: "nodrag nopan",
        title: fullLabel,
        "aria-label": fullLabel,
        "data-relationship-id": props.id,
        "data-caption-visible": showCaption,
        style: {
          position: "absolute",
          transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
          fontFamily: theme.fontSans,
          fontSize: 11,
          width: route.label.width,
          height: route.label.height,
          boxSizing: "border-box",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          borderRadius: 4,
          padding: "2px 5px",
          opacity: showCaption ? 1 : 0,
          border: `1px solid ${relationship?.direction === "backward" ? theme.error : relationship?.direction === "forward" ? theme.tracing : theme.textSecondary}`,
          color: theme.textPrimary,
          background: theme.bgElevated,
          pointerEvents: "none"
        },
        children: caption
      }
    ) })
  ] });
}
var recordedRelationshipEdgeTypes = { recordedRelationship: RecordedRelationshipEdge };

// src/components/GroupedFlowDiagram/cameraInitialization.ts
var NARROW_DIAGRAM_WIDTH = 600;
function initialCameraDecision(state) {
  if (!Number.isFinite(state.width) || state.width <= 0) return "wait";
  if (state.alreadyInitialized || state.cameraOwned || state.width >= NARROW_DIAGRAM_WIDTH || !state.hasVisibleSelection) return "preserve";
  return "selection";
}

// src/components/GroupedFlowDiagram/GroupedFlowDiagram.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var buttonStyle = { font: "inherit", fontSize: 12, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "7px 12px", background: theme.bgElevated, color: theme.textPrimary, cursor: "pointer" };
function GroupedFlowDiagram(props) {
  const { focused: recordedFocus, fitNodeIds } = (0, import_react16.useContext)(RecordedFocusContext);
  const [localExpanded, setLocalExpanded] = (0, import_react16.useState)(props.defaultExpandedGroupIds ?? []);
  const [localSelected, setLocalSelected] = (0, import_react16.useState)();
  const wrapper = (0, import_react16.useRef)(null);
  const [narrow, setNarrow] = (0, import_react16.useState)(false);
  const [focusIds, setFocusIds] = (0, import_react16.useState)();
  const [focusRequest, setFocusRequest] = (0, import_react16.useState)(0);
  const initiallyFocused = (0, import_react16.useRef)(false);
  const expanded = props.expandedGroupIds ?? localExpanded;
  const selected = props.selectedNodeId === void 0 ? localSelected : props.selectedNodeId ?? void 0;
  const canToggle = props.expandedGroupIds === void 0 || typeof props.onExpandedGroupIdsChange === "function";
  const result = (0, import_react16.useMemo)(
    () => projectGroupedFlowDiagram(props.definition, {
      expandedGroupIds: expanded,
      observation: props.observation,
      highlight: props.highlight,
      selectedNodeId: selected,
      direction: props.direction
    }),
    [props.definition, expanded, props.observation, props.highlight, selected, props.direction]
  );
  const model = result.model;
  const overlay = (0, import_react16.useMemo)(() => !model || props.recordedRelationships === void 0 ? [] : projectRecordedRelationships(props.recordedRelationships, model), [model, props.recordedRelationships]);
  const routing = (0, import_react16.useMemo)(() => model && overlay ? routeRecordedRelationships(overlay, model) : void 0, [model, overlay]);
  const visualBounds = (0, import_react16.useMemo)(() => routing && overlay ? recordedVisualBounds(routing, overlay, focusIds) : void 0, [routing, overlay, focusIds]);
  const fitTargets = (0, import_react16.useMemo)(() => model && recordedFocus ? visibleRecordedFitTargets(fitNodeIds ?? [], model) : void 0, [model, recordedFocus, fitNodeIds]);
  const camera = (0, import_react16.useMemo)(() => {
    if (!model || props.focusRequest === void 0) return void 0;
    const requested = admitFocusRequest(props.focusRequest, model);
    if (!requested || !recordedFocus || !requested.nodeIds.length) return requested;
    const visible = visibleRecordedFitTargets(requested.nodeIds, model);
    return visible ? { ...requested, nodeIds: visible } : void 0;
  }, [model, props.focusRequest, recordedFocus]);
  const lastCameraKey = (0, import_react16.useRef)(/* @__PURE__ */ Symbol());
  const changeExpanded = (next) => {
    if (props.expandedGroupIds === void 0) setLocalExpanded(next);
    props.onExpandedGroupIdsChange?.(next);
  };
  const select = (id) => {
    if (props.selectedNodeId === void 0) setLocalSelected(id);
    props.onSelectNode?.(id);
  };
  const requestFocus = (ids) => {
    initiallyFocused.current = true;
    setFocusIds(ids);
    setFocusRequest((value) => value + 1);
  };
  const names = (0, import_react16.useMemo)(() => {
    if (!model) return /* @__PURE__ */ new Map();
    const groups = model.definition.nodes.filter((node) => node.kind === "group");
    const groupIndex = new Map(groups.map((node, index) => [node.id, index + 1]));
    const counts = /* @__PURE__ */ new Map();
    const siblingCounts = /* @__PURE__ */ new Map();
    for (const node of model.definition.nodes) {
      counts.set(node.label, (counts.get(node.label) ?? 0) + 1);
      const key = JSON.stringify([node.parentId ?? null, node.label]);
      siblingCounts.set(key, (siblingCounts.get(key) ?? 0) + 1);
    }
    return new Map(model.definition.nodes.map((node, index) => {
      const duplicate = (counts.get(node.label) ?? 0) > 1;
      if (node.kind === "group" && duplicate) return [node.id, `Group ${groupIndex.get(node.id)}`];
      const context = node.parentId ? `Group ${groupIndex.get(node.parentId)}` : "";
      const siblingDuplicate = (siblingCounts.get(JSON.stringify([node.parentId ?? null, node.label])) ?? 0) > 1;
      return [node.id, [context, siblingDuplicate || !node.parentId && duplicate ? `Item ${index + 1}` : ""].filter(Boolean).join(" \xB7 ")];
    }));
  }, [props.definition, model]);
  const ports = /* @__PURE__ */ new Map();
  for (const item of overlay ?? []) {
    const route = routing?.routes.get(item.relationship.id);
    if (!route) continue;
    ports.set(item.source, [...ports.get(item.source) ?? [], route.sourcePort]);
    ports.set(item.target, [...ports.get(item.target) ?? [], route.targetPort]);
  }
  const nodes = model?.nodes.map((item) => ({
    id: item.node.id,
    type: item.expanded ? "flowDiagramGroup" : "flowDiagramItem",
    parentId: item.parentId,
    position: item.position,
    width: item.width,
    height: item.height,
    style: { width: item.width, height: item.height, pointerEvents: "all", ...recordedFocus && !item.highlighted ? { opacity: 0.28 } : {} },
    draggable: false,
    selectable: false,
    data: {
      item,
      caption: names.get(item.node.id) ?? "",
      selected: item.node.id === selected,
      direction: model.direction,
      canToggle,
      recordedPorts: ports.get(item.node.id),
      onToggle: (id) => {
        requestFocus(narrow ? [id] : void 0);
        changeExpanded(model.expandedGroupIds.includes(id) ? model.expandedGroupIds.filter((value) => value !== id) : [...model.expandedGroupIds, id]);
      },
      onSelect: select
    }
  })) ?? [];
  const edges = model?.edges.map((item) => {
    const color = item.highlighted ? theme.tracing : theme.textMuted;
    return {
      id: item.edge.id,
      source: item.source,
      target: item.target,
      type: "smoothstep",
      label: item.edge.label,
      ...recordedFocus ? { hidden: true } : {},
      className: `gfd-edge-${item.state}${item.highlighted ? " gfd-edge-highlighted" : ""}`,
      ariaLabel: `${item.edge.label ?? "Relationship"}. ${item.state === "observed" ? "Recorded" : item.state === "not-taken" ? "Not taken (recorded)" : "Not verified"}${item.collapsed ? ". Grouped view of the original relationship" : ""}.`,
      markerEnd: { type: import_react17.MarkerType.ArrowClosed, color },
      style: { stroke: color, strokeWidth: item.highlighted ? 4 : 2, ...item.state !== "observed" ? { strokeDasharray: "6 5" } : {} },
      labelStyle: { fill: theme.textPrimary, fontSize: 12, fontWeight: 600 },
      labelBgStyle: { fill: theme.bgElevated },
      labelBgPadding: [7, 4]
    };
  }) ?? [];
  const highlightFocusIds = new Set(model?.nodes.filter((node) => node.highlighted && !node.expanded).map((node) => node.node.id));
  for (const edge of model?.edges ?? []) {
    if (edge.highlighted) {
      highlightFocusIds.add(edge.source);
      highlightFocusIds.add(edge.target);
    }
  }
  if (!highlightFocusIds.size) {
    for (const node of model?.nodes ?? []) if (node.highlighted) highlightFocusIds.add(node.node.id);
  }
  for (const item of overlay ?? []) {
    const relationship = item.relationship;
    const route = routing?.routes.get(relationship.id);
    if (!route) continue;
    const color = relationship.direction === "backward" ? theme.error : relationship.direction === "forward" ? theme.tracing : theme.textSecondary;
    edges.push({
      id: relationship.id,
      source: item.source,
      target: item.target,
      type: "recordedRelationship",
      sourceHandle: route.sourcePort.id,
      targetHandle: route.targetPort.id,
      label: `${recordedAttributionLabel(relationship.attribution)} \xB7 ${relationship.kind}`,
      ariaLabel: `${relationship.direction === "backward" ? "Backward source trail, not a failed step. " : relationship.direction === "forward" ? "Forward recorded impact. " : "Recorded dependency. "}${recordedAttributionLabel(relationship.attribution)}. ${relationship.kind} dependency.${item.collapsed ? " Grouped view of the original relationship." : ""}`,
      data: { relationship, collapsed: item.collapsed, route },
      className: "gfd-recorded-relationship",
      markerEnd: { type: import_react17.MarkerType.ArrowClosed, color, width: 14, height: 14 },
      style: { stroke: color, strokeWidth: 1.8, ...relationship.attribution === "stage" ? { strokeDasharray: "6 5" } : {} },
      labelStyle: { fill: theme.textPrimary, fontSize: 12 },
      labelBgStyle: { fill: theme.bgElevated },
      labelBgPadding: [7, 4]
    });
  }
  (0, import_react16.useEffect)(() => {
    if (!camera || Object.is(lastCameraKey.current, camera.key)) return;
    lastCameraKey.current = camera.key;
    requestFocus(camera.nodeIds.length ? camera.nodeIds : void 0);
  }, [Boolean(camera), camera?.key]);
  const geometry = model ? JSON.stringify(model.nodes.map((node) => [node.node.id, node.parentId, node.position, node.width, node.height])) : "";
  (0, import_react16.useEffect)(() => {
    const element = wrapper.current;
    if (!element) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const width = element.clientWidth;
      setNarrow(width > 0 && width < NARROW_DIAGRAM_WIDTH);
      const decision = initialCameraDecision({
        width,
        alreadyInitialized: initiallyFocused.current,
        cameraOwned: camera !== void 0 || recordedFocus,
        hasVisibleSelection: !!selected && !!model?.nodes.some((node) => node.node.id === selected)
      });
      if (decision !== "wait") initiallyFocused.current = true;
      if (decision === "selection" && selected) requestFocus([selected]);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [model, selected, Boolean(camera), camera?.key, recordedFocus]);
  if (!model || !overlay || props.focusRequest !== void 0 && !camera) return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { role: "alert", className: props.className, style: { color: theme.textPrimary, fontFamily: theme.fontSans, ...props.style }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "This diagram cannot be shown yet. Its saved information or grouping needs checking." }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("details", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("summary", { children: "How to fix this diagram" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: result.error ?? (!overlay ? "Provide bounded recorded relationships with unique IDs, declared endpoints and supported attribution." : "Focus only declared diagram items using a bounded plain camera request.") })
    ] }),
    props.expandedGroupIds === void 0 && props.selectedNodeId === void 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", style: buttonStyle, onClick: () => {
      setLocalExpanded([]);
      setLocalSelected(void 0);
    }, children: "Reset view" })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
    "section",
    {
      className: props.className,
      "aria-label": props["aria-label"] ?? "Grouped flow diagram",
      "data-camera-focus": focusIds?.join(" ") ?? "overview",
      "data-narrow": narrow,
      "data-direction": model.direction,
      "data-investigation-focus": recordedFocus,
      style: { display: "flex", flexDirection: "column", width: "100%", height: 560, minHeight: 320, minWidth: 0, fontFamily: theme.fontSans, color: theme.textPrimary, ...props.style },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 0" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", style: buttonStyle, disabled: recordedFocus && !fitTargets?.length, onClick: () => {
            if (recordedFocus) {
              if (fitTargets?.length) requestFocus(fitTargets);
            } else requestFocus();
          }, children: recordedFocus ? "Fit recorded view" : "Fit diagram" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", style: buttonStyle, disabled: !selected || !canToggle, onClick: () => {
            if (!selected) return;
            requestFocus([selected]);
            const next = [.../* @__PURE__ */ new Set([...model.expandedGroupIds, ...getFlowDiagramAncestors(model.definition, selected)])];
            changeExpanded(next);
          }, children: "Reveal selection" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", style: buttonStyle, disabled: !highlightFocusIds.size, onClick: () => {
            if (highlightFocusIds.size) requestFocus([...highlightFocusIds]);
          }, children: recordedFocus ? "All recorded connections" : "Focus highlighted path" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { fontSize: 11, color: theme.textSecondary }, children: "Open a flow to see its steps. Missing information stays unknown." })
        ] }),
        recordedFocus && !fitTargets?.length && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { role: "status", children: "The recorded view cannot be fitted yet. Check its diagram mapping or expand the containing flow." }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { ref: wrapper, style: { flex: 1, minHeight: 220, minWidth: 0, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: "hidden", background: theme.bg }, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          import_react17.ReactFlow,
          {
            nodes,
            edges,
            nodeTypes: diagramNodeTypes,
            edgeTypes: recordedRelationshipEdgeTypes,
            nodesDraggable: false,
            nodesConnectable: false,
            nodesFocusable: false,
            edgesFocusable: false,
            minZoom: 0.1,
            maxZoom: 1.6,
            preventScrolling: false,
            proOptions: { hideAttribution: true },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ChartAutoRefit, { wrapperRef: wrapper, refitKey: geometry, padding: 0.06, focusNodeIds: focusIds, focusRequestKey: focusRequest, maxAutoZoom: 1, visualBounds, preserveViewport: true }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_react17.Background, { gap: 24, color: theme.border }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_react17.Controls, { showInteractive: false })
            ]
          }
        ) }),
        !!routing?.undrawn && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { role: "status", "data-routing-unavailable": routing.undrawn, style: { margin: "8px 0 0", fontSize: 12 }, children: [
          routing.undrawn,
          " recorded ",
          routing.undrawn === 1 ? "connection could" : "connections could",
          " not be drawn. Expand the flow or inspect the recorded evidence. The explanation is unchanged."
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { style: { margin: "8px 0 0", fontSize: 11, color: theme.textSecondary }, children: [
          "\u2713 Completed step \xB7 \xD7 Failed step \xB7 ? Unknown \xB7 Dashed relationship: not verified or recorded as not taken",
          overlay.length > 0 ? " \xB7 Warm backward links: recorded sources, not failed steps \xB7 Teal forward links: recorded impact, not proof of harm" : ""
        ] })
      ]
    }
  );
}

// src/components/StageNode/StageNode.tsx
var import_react18 = require("react");
var import_react19 = require("@xyflow/react");

// src/trace/safeRecordRead.ts
function ownDataField(value, key) {
  if (!value || typeof value !== "object") return void 0;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : void 0;
}
function optionalOwnDataField(value, key) {
  if (!value || typeof value !== "object") return void 0;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (descriptor && !("value" in descriptor))
    throw new TraceAdmissionError("malformed");
  return descriptor?.value;
}
function isPlainRecord(value) {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
var TRACE_WORK_LIMIT = 1e5;
var TraceAdmissionError = class extends Error {
  constructor(reason, items) {
    super(reason);
    this.reason = reason;
    this.items = items;
  }
};
var WorkBudget = class {
  constructor(limit2 = TRACE_WORK_LIMIT) {
    this.limit = limit2;
    this.items = 0;
  }
  spend(count2) {
    this.items += count2;
    if (this.items > this.limit)
      throw new TraceAdmissionError("too-large", this.items);
  }
};
function readOwnArray(value, budget) {
  const length = ownDataField(value, "length");
  if (!Array.isArray(value) || typeof length !== "number" || !Number.isInteger(length) || length < 0)
    throw new TraceAdmissionError("malformed");
  budget.spend(length);
  const result = [];
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    if (!descriptor || !("value" in descriptor))
      throw new TraceAdmissionError("malformed");
    result.push(descriptor.value);
  }
  return result;
}
function readName(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 4096)
    throw new TraceAdmissionError("malformed");
  return value;
}
function classifyAdmissionFailure(error) {
  try {
    const reason = ownDataField(error, "reason");
    if (reason !== "too-large" && reason !== "malformed")
      return { reason: "malformed" };
    const items = ownDataField(error, "items");
    if (reason === "too-large" && typeof items === "number" && Number.isSafeInteger(items) && items > 0)
      return { reason, items };
    return { reason: "malformed" };
  } catch {
    return { reason: "malformed" };
  }
}

// src/recordedValues/native.ts
var DateType = Date;
var MapType = Map;
var SetType = Set;
var dateTime = Date.prototype.getTime;
var mapSize = Object.getOwnPropertyDescriptor(Map.prototype, "size").get;
var setSize = Object.getOwnPropertyDescriptor(Set.prototype, "size").get;
var mapEach = Map.prototype.forEach;
var setEach = Set.prototype.forEach;
var mapPut = Map.prototype.set;
var setPut = Set.prototype.add;
function unsupported() {
  throw new Error("Unsupported recorded data.");
}
function nativeKind(value) {
  const prototype = Object.getPrototypeOf(value);
  return prototype === DateType.prototype ? "date" : prototype === MapType.prototype ? "map" : prototype === SetType.prototype ? "set" : void 0;
}
function nativeEpoch(value) {
  if (Reflect.ownKeys(value).length) unsupported();
  const epoch = dateTime.call(value);
  if (!Number.isFinite(epoch)) unsupported();
  return epoch;
}
function nativeSize(value, kind) {
  if (Reflect.ownKeys(value).length) unsupported();
  return (kind === "map" ? mapSize : setSize).call(value);
}
function nativeEntries(value, kind, size) {
  const entries = [];
  const maximum = size * (kind === "map" ? 2 : 1);
  if (kind === "map") mapEach.call(value, (item, key) => {
    if (entries.length + 2 > maximum) unsupported();
    entries.push(key, item);
  });
  else setEach.call(value, (item) => {
    if (entries.length >= maximum) unsupported();
    entries.push(item);
  });
  if (entries.length !== maximum) unsupported();
  return entries;
}
function newNative(kind, epoch) {
  return kind === "date" ? new DateType(epoch) : kind === "map" ? new MapType() : new SetType();
}
function putNative(output, kind, key, value) {
  if (kind === "map") mapPut.call(output, key, value);
  else setPut.call(output, key);
}

// src/recordedValues/native-copy.ts
function copyOwnedData(input) {
  const budget = new WorkBudget(), copied = /* @__PURE__ */ new WeakMap(), active = /* @__PURE__ */ new Set();
  const frames = [];
  function enter(value) {
    budget.spend(1);
    if (value === null || value === void 0 || typeof value === "string" || typeof value === "boolean" || typeof value === "bigint") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (!value || typeof value !== "object") unsupported();
    if (active.has(value)) unsupported();
    const previous = copied.get(value);
    if (previous) return previous;
    const native = nativeKind(value);
    if (native === "date") {
      const output2 = Object.freeze(newNative(native, nativeEpoch(value)));
      copied.set(value, output2);
      return output2;
    }
    if (native) {
      const size = nativeSize(value, native);
      budget.spend(size * (native === "map" ? 2 : 1));
      const entries = nativeEntries(value, native, size), output2 = newNative(native);
      copied.set(value, output2);
      active.add(value);
      frames.push({ kind: native, input: value, output: output2, entries, at: 0 });
      return output2;
    }
    const array2 = Array.isArray(value);
    if (array2 ? Object.getPrototypeOf(value) !== Array.prototype : !isPlainRecord(value)) unsupported();
    const arrayEntries = array2 ? readOwnArray(value, budget) : void 0;
    const allKeys = Reflect.ownKeys(value);
    budget.spend(allKeys.length);
    const keys = [];
    for (const key of allKeys) {
      if (array2 && key === "length") continue;
      if (typeof key !== "string") unsupported();
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) unsupported();
      if (array2 && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= arrayEntries.length)) unsupported();
      keys.push(key);
    }
    const output = array2 ? [] : /* @__PURE__ */ Object.create(null);
    copied.set(value, output);
    active.add(value);
    frames.push({ kind: "object", input: value, output, keys, at: 0 });
    return output;
  }
  const result = enter(input);
  while (frames.length) {
    const frame = frames[frames.length - 1];
    const length = frame.kind === "object" ? frame.keys.length : frame.entries.length;
    if (frame.at === length) {
      Object.freeze(frame.output);
      active.delete(frame.input);
      frames.pop();
      continue;
    }
    if (frame.kind === "object") {
      const key = frame.keys[frame.at++];
      Object.defineProperty(frame.output, key, { value: enter(optionalOwnDataField(frame.input, key)), enumerable: true, configurable: false, writable: false });
    } else if (frame.kind === "set") putNative(frame.output, "set", enter(frame.entries[frame.at++]));
    else if (frame.at % 2 === 0) frame.key = enter(frame.entries[frame.at++]);
    else putNative(frame.output, "map", frame.key, enter(frame.entries[frame.at++]));
  }
  return result;
}

// src/recordedValues/native-equality.ts
function sameOwnedData(a, b) {
  const queue = [[a, b]], budget = new WorkBudget();
  const forward = /* @__PURE__ */ new WeakMap(), reverse = /* @__PURE__ */ new WeakMap();
  try {
    for (let index = 0; index < queue.length; index++) {
      budget.spend(1);
      const [left, right] = queue[index];
      if (!left || !right || typeof left !== "object" || typeof right !== "object") {
        if (!Object.is(left, right)) return false;
        continue;
      }
      if (forward.has(left) || reverse.has(right)) {
        if (forward.get(left) !== right || reverse.get(right) !== left) return false;
        continue;
      }
      forward.set(left, right);
      reverse.set(right, left);
      const native = nativeKind(left);
      if (native !== nativeKind(right)) return false;
      if (native === "date") {
        if (nativeEpoch(left) !== nativeEpoch(right)) return false;
        continue;
      }
      if (native) {
        const size = nativeSize(left, native);
        if (size !== nativeSize(right, native)) return false;
        budget.spend(size * (native === "map" ? 2 : 1));
        const l = nativeEntries(left, native, size), r = nativeEntries(right, native, size);
        for (let entry = 0; entry < l.length; entry++) queue.push([l[entry], r[entry]]);
        continue;
      }
      const array2 = Array.isArray(left);
      if (array2 !== Array.isArray(right) || !array2 && (!isPlainRecord(left) || !isPlainRecord(right))) return false;
      if (array2 && optionalOwnDataField(left, "length") !== optionalOwnDataField(right, "length")) return false;
      const keys = Object.keys(left), otherKeys = Object.keys(right);
      if (keys.length !== otherKeys.length) return false;
      budget.spend(keys.length);
      for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
        queue.push([optionalOwnDataField(left, key), optionalOwnDataField(right, key)]);
      }
    }
    return true;
  } catch {
    return false;
  }
}

// src/recordedValues/format.ts
var UNAVAILABLE = "[Unavailable]";
var TRUNCATED = "[Truncated]";
var CIRCULAR = "[Circular]";
var stringify = JSON.stringify;
var DateType2 = Date;
var dateISO = Date.prototype.toISOString;
var bigString = BigInt.prototype.toString;
var OUTPUT_LIMIT = /* @__PURE__ */ Symbol("recorded-output-limit");
function limit(options, name, fallback2, low, high) {
  try {
    const value = optionalOwnDataField(options, name);
    return typeof value === "number" && Number.isFinite(value) ? Math.max(low, Math.min(high, Math.floor(value))) : fallback2;
  } catch {
    return fallback2;
  }
}
function formatRecordedValue(value, options = {}) {
  const maxChars = limit(options, "maxChars", 1e4, 16, 5e5);
  const maxItems = limit(options, "maxItems", 200, 1, 1e4);
  const maxDepth = limit(options, "maxDepth", 8, 0, 64);
  const indent = limit(options, "indent", 0, 0, 8);
  const active = /* @__PURE__ */ new WeakSet();
  let output = "", items = 0, bigLimit;
  function append(text3) {
    if (output.length + text3.length > maxChars) {
      const room = Math.max(0, maxChars - TRUNCATED.length - output.length);
      output = (output + text3.slice(0, room)).slice(0, maxChars - TRUNCATED.length) + TRUNCATED;
      throw OUTPUT_LIMIT;
    }
    output += text3;
  }
  function quote(text3) {
    const prefix = text3.slice(0, maxChars);
    append(stringify(prefix));
    if (prefix.length !== text3.length) {
      output = output.slice(0, maxChars - TRUNCATED.length) + TRUNCATED;
      throw OUTPUT_LIMIT;
    }
  }
  function newline(depth) {
    if (indent) append("\n" + " ".repeat(indent * depth));
  }
  function separator(at2, depth) {
    if (at2) append(",");
    newline(depth);
  }
  function native(value2, kind, depth) {
    if (kind === "date") {
      append("Date(");
      quote(dateISO.call(new DateType2(nativeEpoch(value2))));
      append(")");
      return;
    }
    const size = nativeSize(value2, kind), slots = size * (kind === "map" ? 2 : 1);
    append(kind === "map" ? `Map(${size}) {` : `Set(${size}) {`);
    if (slots > maxItems - items) {
      append(` ${TRUNCATED} }`);
      return;
    }
    const entries = nativeEntries(value2, kind, size);
    for (let at2 = 0; at2 < entries.length; at2 += kind === "map" ? 2 : 1) {
      if (at2) append(",");
      append(" ");
      visit(entries[at2], depth + 1);
      if (kind === "map") {
        append(" => ");
        visit(entries[at2 + 1], depth + 1);
      }
    }
    append(size ? " }" : "}");
  }
  function array2(value2, depth) {
    const length = optionalOwnDataField(value2, "length");
    if (Object.getPrototypeOf(value2) !== Array.prototype || typeof length !== "number" || !Number.isSafeInteger(length) || length < 0) {
      append(UNAVAILABLE);
      return;
    }
    append("[");
    let at2 = 0;
    for (; at2 < length; at2++) {
      separator(at2, depth + 1);
      if (items >= maxItems) {
        append(TRUNCATED);
        break;
      }
      const descriptor = Object.getOwnPropertyDescriptor(value2, at2);
      if (!descriptor || !("value" in descriptor)) append(UNAVAILABLE);
      else visit(descriptor.value, depth + 1);
    }
    if (at2 || length) newline(depth);
    append("]");
  }
  function record2(value2, depth) {
    const toJSON = Object.getOwnPropertyDescriptor(value2, "toJSON");
    if (toJSON && (!("value" in toJSON) || typeof toJSON.value === "function")) {
      append(UNAVAILABLE);
      return;
    }
    append("{");
    let at2 = 0;
    for (const key in value2) {
      const descriptor = Object.getOwnPropertyDescriptor(value2, key);
      if (!descriptor?.enumerable) continue;
      separator(at2++, depth + 1);
      if (items >= maxItems) {
        append(TRUNCATED);
        break;
      }
      quote(key);
      append(indent ? ": " : ":");
      if ("value" in descriptor) visit(descriptor.value, depth + 1);
      else append(UNAVAILABLE);
    }
    if (at2) newline(depth);
    append("}");
  }
  function visit(value2, depth) {
    if (++items > maxItems || depth > maxDepth) {
      append(TRUNCATED);
      return;
    }
    if (value2 === void 0) {
      append("undefined");
      return;
    }
    if (value2 === null) {
      append("null");
      return;
    }
    if (typeof value2 === "string") {
      quote(value2);
      return;
    }
    if (typeof value2 === "boolean") {
      append(value2 ? "true" : "false");
      return;
    }
    if (typeof value2 === "number") {
      append(Number.isFinite(value2) ? stringify(value2) : UNAVAILABLE);
      return;
    }
    if (typeof value2 === "bigint") {
      bigLimit ?? (bigLimit = 10n ** BigInt(maxChars));
      if (value2 >= bigLimit || value2 <= -bigLimit) append(`BigInt(${TRUNCATED})`);
      else append(bigString.call(value2) + "n");
      return;
    }
    if (typeof value2 !== "object") {
      append(UNAVAILABLE);
      return;
    }
    if (active.has(value2)) {
      append(CIRCULAR);
      return;
    }
    active.add(value2);
    const start = output.length;
    try {
      const kind = nativeKind(value2);
      if (kind) native(value2, kind, depth);
      else if (Array.isArray(value2)) array2(value2, depth);
      else if (isPlainRecord(value2)) record2(value2, depth);
      else append(UNAVAILABLE);
    } catch (error) {
      if (error === OUTPUT_LIMIT) throw error;
      output = output.slice(0, start);
      append(UNAVAILABLE);
    } finally {
      active.delete(value2);
    }
  }
  try {
    visit(value, 0);
  } catch (error) {
    if (error !== OUTPUT_LIMIT) return UNAVAILABLE;
  }
  return output;
}

// src/trace/recordedValuePreview.ts
var recordedPathLabel = (key) => key.replace(/\u001f/g, " \u203A ");

// src/components/StageNode/StageNode.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
var KEYFRAMES_ID = "fp-stage-node-keyframes";
var KEYFRAMES_CSS = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes fp-pulse {
    0%, 100% { opacity: var(--fp-node-pulse-opacity, 0.4); transform: scale(1); }
    50% { opacity: calc(var(--fp-node-pulse-opacity, 0.4) * 0.375); transform: scale(1.06); }
  }
  @keyframes fp-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
}
@media (prefers-reduced-motion: reduce) {
  [data-fp="stage-node"], [data-fp="stage-node"] * {
    animation: none !important;
    transition: none !important;
  }
}
`;
var TRACE_VALUE_LIMIT = 1;
var GEOMETRY_STYLE_KEYS = /* @__PURE__ */ new Set(["position", "inset", "top", "bottom", "left", "right", "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight", "display", "alignItems", "justifyContent", "flexDirection", "flexShrink", "overflow", "whiteSpace", "textOverflow", "transform", "zIndex", "pointerEvents", "boxSizing", "clipPath"]);
var traceText = (value, limit2) => value.length > limit2 ? `${value.slice(0, limit2 - 1)}\u2026` : value;
var ICON_SIZE = 16;
function StageIcon({ type, color, size, unstyled }) {
  const customIcon = useFootprintComponents().Icon;
  const s = ICON_SIZE;
  const props = { width: s, height: s, viewBox: `0 0 ${s} ${s}`, fill: "none", style: { flexShrink: 0, ...size && { width: size, height: size } } };
  const glyph = (() => {
    switch (type) {
      // LLM / AI call — brain/sparkle
      case "llm":
      case "ai":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "8", cy: "8", r: "6", stroke: color, strokeWidth: "1.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M5.5 8C5.5 6.5 6.5 5 8 5S10.5 6.5 10.5 8", stroke: color, strokeWidth: "1.2", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "8", cy: "9.5", r: "1", fill: color }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "8", y1: "2", x2: "8", y2: "3.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "12.5", y1: "4", x2: "11.2", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "3.5", y1: "4", x2: "4.8", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
        ] });
      // Tool / function call — gear
      case "tool":
      case "function":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "8", cy: "8", r: "3", stroke: color, strokeWidth: "1.5" }),
          [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = angle * Math.PI / 180;
            const x1 = 8 + Math.cos(rad) * 4.5;
            const y1 = 8 + Math.sin(rad) * 4.5;
            const x2 = 8 + Math.cos(rad) * 6;
            const y2 = 8 + Math.sin(rad) * 6;
            return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1, y1, x2, y2, stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }, angle);
          })
        ] });
      // RAG / retrieval — magnifying glass + doc
      case "rag":
      case "search":
      case "retrieval":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "7", cy: "7", r: "4", stroke: color, strokeWidth: "1.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "10", y1: "10", x2: "13.5", y2: "13.5", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "5.5", y1: "6", x2: "8.5", y2: "6", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "5.5", y1: "8", x2: "7.5", y2: "8", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
        ] });
      // Parse / process — diamond with arrows
      case "parse":
      case "process":
      case "transform":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", stroke: color, strokeWidth: "1.5", transform: "rotate(45 8 8)" }) });
      // Start / seed — play triangle
      case "start":
      case "seed":
      case "init":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M5 3.5L12.5 8L5 12.5V3.5Z", fill: color, opacity: "0.8" }) });
      // End / finalize — stop square
      case "end":
      case "finalize":
      case "output":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", fill: color, opacity: "0.8" }) });
      // Agent — person silhouette
      case "agent":
      case "orchestrator":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "8", cy: "5", r: "2.5", stroke: color, strokeWidth: "1.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M3.5 14C3.5 11 5.5 9 8 9S12.5 11 12.5 14", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" })
        ] });
      // Swarm — multi-agent
      case "swarm":
      case "multi-agent":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "5", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "11", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "8", cy: "11", r: "2", stroke: color, strokeWidth: "1.2" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "5", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "11", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" })
        ] });
      // Guard / guardrail — shield
      case "guard":
      case "guardrail":
      case "validate":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M8 2L3 5V9C3 11.5 5 13.5 8 14.5C11 13.5 13 11.5 13 9V5L8 2Z", stroke: color, strokeWidth: "1.5", strokeLinejoin: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M6 8L7.5 9.5L10 6.5", stroke: color, strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" })
        ] });
      // Stream — wave
      case "stream":
      case "streaming":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M2 8C4 5 6 11 8 8S12 5 14 8", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M2 11C4 8 6 14 8 11S12 8 14 11", stroke: color, strokeWidth: "1", strokeLinecap: "round", fill: "none", opacity: "0.5" })
        ] });
      // Memory / state — database cylinder
      case "memory":
      case "state":
      case "db":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("ellipse", { cx: "8", cy: "4.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "3", y1: "4.5", x2: "3", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "13", y1: "4.5", x2: "13", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("ellipse", { cx: "8", cy: "11.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" })
        ] });
      // System prompt — document with lines
      case "system-prompt":
      case "prompt":
      case "instructions":
      case "document":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "3.5", y: "2", width: "9", height: "12", rx: "1.5", stroke: color, strokeWidth: "1.3", fill: "none" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "5.5", y1: "5", x2: "10.5", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "5.5", y1: "7.5", x2: "10.5", y2: "7.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "5.5", y1: "10", x2: "8.5", y2: "10", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
        ] });
      // Messages / conversation — chat bubble
      case "messages":
      case "chat":
      case "conversation":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "2.5", y: "3", width: "11", height: "8", rx: "2", stroke: color, strokeWidth: "1.3", fill: "none" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M5.5 11L5.5 13.5L8.5 11", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "5", y1: "6", x2: "11", y2: "6", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("line", { x1: "5", y1: "8.5", x2: "9", y2: "8.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
        ] });
      // Loop — circular arrow
      case "loop":
      case "retry":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M12 8A4 4 0 1 1 8 4", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M8 1.5L10.5 4L8 6.5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })
        ] });
      // Lazy / service — cloud (deferred resolution, loaded on demand)
      case "lazy":
      case "service":
      case "cloud":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "path",
          {
            d: "M4.5 12C2.8 12 1.5 10.7 1.5 9C1.5 7.5 2.5 6.3 3.8 6C4 4 5.8 2.5 8 2.5C9.8 2.5 11.3 3.5 11.9 5C13.9 5.2 15.5 6.8 15.5 8.8C15.5 10.8 13.9 12.5 11.8 12.5H4.5",
            stroke: color,
            strokeWidth: "1.3",
            strokeLinecap: "round",
            fill: "none"
          }
        ) });
      // Decision — diamond (already handled by isDecider shape)
      case "decision":
      case "router":
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { ...props, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M8 2L14 8L8 14L2 8Z", stroke: color, strokeWidth: "1.5", fill: "none" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "8", cy: "8", r: "1.5", fill: color })
        ] });
      default:
        return null;
    }
  })();
  if (!glyph && !customIcon) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
    FootprintIcon,
    {
      name: type,
      part: "stage-icon",
      unstyled,
      style: { flexShrink: 0 },
      defaultStyle: { display: "inline-flex", alignItems: "center", justifyContent: "center", color, width: size, height: size },
      children: glyph
    }
  );
}
var StageNode = (0, import_react18.memo)(function StageNode2({
  data
}) {
  const { label, active, done, error, linked, icon, stepNumbers, dimmed, isSubflow, isLazy, isDecider, isFork, description, stageId, showStageId, retryAttempts, traceWorkflow, traceContext, suppressMotion } = data;
  const displayedContext = traceContext ?? (traceWorkflow ? "displayed" : void 0);
  const viewingTrace = displayedContext !== void 0;
  const unstyled = data.unstyled === true;
  const density = data.size === "sm" ? "compact" : data.size === "lg" ? "detailed" : "default";
  const metrics = componentStyles(density);
  const iconFootprint = `calc(${metrics.iconSize} + ${2 - (fontSize[density].body - fontSize.default.body)}px)`;
  const offset = (base, delta) => delta === 0 ? base : `calc(${base} ${delta < 0 ? "-" : "+"} ${Math.abs(delta)}px)`;
  const sx = (styles) => {
    if (unstyled) return Object.fromEntries(Object.entries(styles).filter(([key]) => GEOMETRY_STYLE_KEYS.has(key)));
    return {
      ...styles,
      ...typeof styles.fontSize === "number" && { fontSize: `calc(${metrics.body} + ${styles.fontSize - fontSize[density].body}px)` },
      ...styles.fontWeight === 400 && { fontWeight: metrics.weightNormal },
      ...styles.fontWeight === 500 && { fontWeight: metrics.weightMedium },
      ...typeof styles.fontWeight === "number" && styles.fontWeight >= 600 && {
        fontWeight: styles.fontWeight === 700 ? metrics.weightStrong : `calc(${metrics.weightStrong} ${styles.fontWeight < 700 ? "-" : "+"} ${Math.abs(styles.fontWeight - 700)})`
      },
      ...typeof styles.gap === "number" && { gap: offset(metrics.controlGap, styles.gap - 6) },
      ...typeof styles.borderRadius === "number" && { borderRadius: offset(metrics.radiusControl, styles.borderRadius - 6) },
      ...typeof styles.padding === "string" && /^\d+px(?: \d+px)*$/.test(styles.padding) && {
        padding: styles.padding.split(" ").map((part) => offset(metrics.spaceMd, Number.parseInt(part, 10) - 12)).join(" ")
      }
    };
  };
  const effectiveIcon = icon || (isLazy ? "lazy" : void 0);
  const isLazyUnresolved = isLazy && !done && !active;
  const injectedRef = (0, import_react18.useRef)(false);
  (0, import_react18.useEffect)(() => {
    if (unstyled) return;
    if (injectedRef.current) return;
    if (typeof document !== "undefined" && !document.getElementById(KEYFRAMES_ID)) {
      const styleEl = document.createElement("style");
      styleEl.id = KEYFRAMES_ID;
      styleEl.textContent = KEYFRAMES_CSS;
      document.head.appendChild(styleEl);
    }
    injectedRef.current = true;
  }, [unstyled]);
  const isOnPath = active || done;
  const showRetryBadge = typeof retryAttempts === "number" && retryAttempts > 1;
  const retryLabel = showRetryBadge ? `retried, attempt ${retryAttempts} of ${retryAttempts} ${error ? "failed" : "succeeded"}` : void 0;
  const isHero = data.emphasis === "hero";
  const isMuted = data.emphasis === "muted";
  const sizeScale = data.size === "lg" ? 1.3 : data.size === "sm" ? 0.85 : 1;
  const restingBg = isHero ? `color-mix(in srgb, ${theme.nodeMain} 12%, ${theme.bgSecondary})` : theme.bgSecondary;
  const restingBorder = isHero ? theme.nodeMain : theme.border;
  const restingShadow = isHero ? `0 0 10px color-mix(in srgb, ${theme.nodeMain} 22%, transparent)` : `0 2px 8px rgba(0,0,0,0.15)`;
  const bg = active ? theme.nodeCursor : isHero && done ? theme.nodeMain : done ? theme.nodeVisited : error ? theme.error : restingBg;
  const legacyBorderColor = active ? theme.nodeCursor : isHero && done ? theme.nodeMain : done ? theme.nodeVisited : error ? theme.error : restingBorder;
  const legacyShadow = active ? `0 0 22px color-mix(in srgb, ${theme.nodeCursor} 55%, transparent)` : isHero && done ? `0 0 12px color-mix(in srgb, ${theme.nodeMain} 30%, transparent)` : done ? `0 0 8px color-mix(in srgb, ${theme.nodeVisited} 20%, transparent)` : error ? `0 0 12px color-mix(in srgb, ${theme.error} 30%, transparent)` : restingShadow;
  const borderColor = v("--fp-node-border-color", legacyBorderColor);
  const borderWidth = v("--fp-node-border-width", isHero ? "2.5px" : isMuted ? "1px" : "2px");
  const borderStyle = isLazyUnresolved ? "dashed" : v("--fp-node-border-style", "solid");
  const nodeRadius = v("--fp-node-radius", theme.radius);
  const shadow = v("--fp-node-shadow", legacyShadow);
  const textColor = unstyled ? "currentColor" : active ? theme.onNodeCursor : done ? isHero ? theme.onNodeMain : theme.onNodeVisited : error ? theme.onNodeError : theme.textPrimary;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_react19.Handle, { type: "target", position: import_react19.Position.Top, style: sx({ opacity: 0 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "div",
      {
        "data-fp": "stage-node",
        "data-active": active || void 0,
        "data-done": done || void 0,
        "data-error": error || void 0,
        "data-unstyled": unstyled || void 0,
        "data-trace-role": traceWorkflow?.role,
        "data-trace-context": displayedContext,
        title: displayedContext === "outside" ? "Outside displayed trace. Recorded execution status is shown independently." : displayedContext === "displayed" ? "In displayed trace. Recorded execution status is shown independently." : void 0,
        "data-motion-suppressed": suppressMotion || void 0,
        style: sx({ width: "100%", display: "flex", justifyContent: "center" }),
        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
          "div",
          {
            style: sx({
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 6,
              // Trace emphasis uses rings and read links; every stage label stays readable.
              opacity: viewingTrace ? 1 : isMuted ? 0.5 : void 0
            }),
            children: [
              traceWorkflow && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
                isDecider ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                  "svg",
                  {
                    "data-fp": "trace-workflow-ring",
                    "aria-hidden": "true",
                    viewBox: "0 0 100 100",
                    preserveAspectRatio: "none",
                    style: sx({ position: "absolute", inset: -8, width: "calc(100% + 16px)", height: "calc(100% + 16px)", overflow: "visible", pointerEvents: "none", zIndex: 3 }),
                    children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("polygon", { points: "50,0 100,50 50,100 0,50", fill: "none", stroke: unstyled ? "currentColor" : traceWorkflow.color, strokeWidth: unstyled ? void 0 : 3, vectorEffect: "non-scaling-stroke" })
                  }
                ) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                  "div",
                  {
                    "data-fp": "trace-workflow-ring",
                    "aria-hidden": "true",
                    style: sx({ position: "absolute", inset: -8, border: `3px solid ${traceWorkflow.color}`, borderRadius: `calc(${nodeRadius} + 6px)`, pointerEvents: "none", zIndex: 3 })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                  "div",
                  {
                    "data-fp": "trace-workflow-caption",
                    style: sx({ position: "absolute", left: "50%", top: "calc(100% + 7px)", transform: "translateX(-50%)", zIndex: 12, display: "flex", alignItems: "center", gap: 4, width: "max-content", maxWidth: 220, height: 18, boxSizing: "border-box", overflow: "hidden", padding: "1px 5px", border: `1px solid ${traceWorkflow.color}`, borderRadius: 5, background: theme.bgSecondary, fontFamily: theme.fontSans, fontSize: 9, lineHeight: "14px", whiteSpace: "nowrap", pointerEvents: "none" }),
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "data-fp": "trace-workflow-role", style: sx({ flexShrink: 0, color: traceWorkflow.color, fontWeight: 700 }), children: traceWorkflow.role === "question" ? "Question" : traceWorkflow.role === "input" ? "Recorded input" : "Upstream read" }),
                      traceWorkflow.values.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "aria-hidden": "true", style: sx({ color: theme.textSecondary }), children: "\xB7" }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "data-fp": "trace-workflow-values", style: sx({ display: "flex", alignItems: "center", minWidth: 0, overflow: "hidden" }), children: traceWorkflow.values.slice(0, TRACE_VALUE_LIMIT).map((value, index) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                          "span",
                          {
                            "data-fp": "trace-workflow-value",
                            style: sx({ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: value.color, fontFamily: "ui-monospace, monospace", fontWeight: 600 }),
                            children: [
                              traceText(recordedPathLabel(value.key), 32),
                              value.preview === null ? " \xB7 preview unavailable" : ` = ${traceText(value.preview, 48)}`
                            ]
                          },
                          `${index}:${value.key}`
                        )) }),
                        traceWorkflow.values.length > TRACE_VALUE_LIMIT && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { "data-fp": "trace-workflow-more", style: sx({ flexShrink: 0, color: theme.textSecondary }), children: [
                          "+",
                          traceWorkflow.values.length - TRACE_VALUE_LIMIT,
                          " more"
                        ] })
                      ] })
                    ]
                  }
                )
              ] }),
              displayedContext === "outside" && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "div",
                {
                  "data-fp": "trace-context-caption",
                  style: sx({
                    position: "absolute",
                    left: "calc(50% + 12px)",
                    top: "calc(100% + 7px)",
                    zIndex: 12,
                    width: "max-content",
                    maxWidth: 220,
                    height: 18,
                    boxSizing: "border-box",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    padding: "1px 5px",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 5,
                    background: theme.bgSecondary,
                    color: theme.textSecondary,
                    fontFamily: theme.fontSans,
                    fontSize: 9,
                    lineHeight: "14px",
                    whiteSpace: "nowrap",
                    pointerEvents: "none"
                  }),
                  children: "Outside displayed trace"
                }
              ),
              stepNumbers && stepNumbers.length > 0 && isOnPath && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "div",
                {
                  style: sx({
                    position: "absolute",
                    top: -10,
                    left: -10,
                    display: "flex",
                    gap: 3,
                    zIndex: 10
                  }),
                  children: stepNumbers.map((num, i) => {
                    const isLatest = i === stepNumbers.length - 1;
                    const badgeBg = isLatest && active ? theme.nodeCursor : theme.nodeVisited;
                    const glow = isLatest && active ? `color-mix(in srgb, ${theme.nodeCursor} 50%, transparent)` : `color-mix(in srgb, ${theme.nodeVisited} 40%, transparent)`;
                    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                      "div",
                      {
                        style: sx({
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: badgeBg,
                          color: isLatest && active ? theme.onNodeCursor : theme.onNodeVisited,
                          fontSize: 11,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: v("--fp-node-badge-shadow", `0 0 8px ${glow}`)
                        }),
                        children: num
                      },
                      num
                    );
                  })
                }
              ),
              linked && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "div",
                {
                  style: sx({
                    position: "absolute",
                    inset: -6,
                    borderRadius: isDecider ? 0 : `calc(${nodeRadius} + 4px)`,
                    clipPath: isDecider ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : void 0,
                    border: `2px solid ${theme.primary}`,
                    opacity: v("--fp-node-pulse-opacity", "0.4"),
                    animation: suppressMotion ? "none" : "fp-pulse 2s ease-in-out infinite"
                  })
                }
              ),
              active && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "div",
                {
                  style: sx({
                    position: "absolute",
                    inset: -6,
                    borderRadius: isDecider ? 0 : `calc(${nodeRadius} + 4px)`,
                    clipPath: isDecider ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : void 0,
                    border: `2px solid ${theme.nodeCursor}`,
                    opacity: v("--fp-node-pulse-opacity", "0.3"),
                    animation: suppressMotion ? "none" : "fp-pulse 1.5s ease-out infinite"
                  })
                }
              ),
              active && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "div",
                {
                  "data-fp": "stage-cursor-badge",
                  style: sx({
                    position: "absolute",
                    top: -9,
                    right: -8,
                    zIndex: 11,
                    background: theme.nodeCursor,
                    color: theme.onNodeCursor,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: 0.6,
                    padding: "2px 6px",
                    borderRadius: 10,
                    boxShadow: v("--fp-node-badge-shadow", `0 0 10px color-mix(in srgb, ${theme.nodeCursor} 60%, transparent)`)
                  }),
                  children: viewingTrace ? "VIEWING" : "NOW"
                }
              ),
              showRetryBadge && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                "div",
                {
                  role: "img",
                  "aria-label": retryLabel,
                  title: retryLabel,
                  style: sx({
                    position: "absolute",
                    bottom: -9,
                    right: -8,
                    zIndex: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    background: theme.bgSecondary,
                    border: `1px solid ${theme.warning}`,
                    color: theme.warning,
                    fontFamily: theme.fontSans,
                    fontSize: 9,
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: 0.2,
                    padding: "2px 5px",
                    borderRadius: 9,
                    whiteSpace: "nowrap"
                  }),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "aria-hidden": "true", children: "\u21BA" }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { "aria-hidden": "true", children: [
                      "\xD7",
                      retryAttempts
                    ] })
                  ]
                }
              ),
              isDecider ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { "data-fp": "stage-node-body", style: sx({ position: "relative", width: 120, height: 72, color: textColor, filter: v("--fp-node-shape-shadow", "none") }), children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                  "div",
                  {
                    style: sx({
                      position: "absolute",
                      inset: 0,
                      background: bg,
                      clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                      border: "none",
                      boxShadow: shadow,
                      transition: suppressMotion ? "none" : "all 0.3s ease"
                    })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                  "div",
                  {
                    style: sx({
                      position: "absolute",
                      inset: `calc(-1 * ${v("--fp-node-border-width", "2px")})`,
                      clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                      background: borderColor,
                      zIndex: -1,
                      ...isLazyUnresolved ? {
                        background: "transparent"
                        // Dashed border via SVG for clip-path (CSS border doesn't work with clip-path)
                      } : {}
                    })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                  "div",
                  {
                    style: sx({
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      fontFamily: theme.fontSans,
                      zIndex: 1
                    }),
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: sx({ display: "flex", alignItems: "center", gap: 4 }), children: [
                        effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(StageIcon, { type: effectiveIcon, color: textColor, unstyled, size: unstyled ? void 0 : iconFootprint }),
                        !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: sx({ fontSize: 9, color: textColor }), children: "\u25C7" }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          "span",
                          {
                            style: sx({
                              fontSize: 11,
                              fontWeight: 600,
                              color: textColor,
                              whiteSpace: "nowrap"
                            }),
                            children: label
                          }
                        )
                      ] }),
                      description && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "span",
                        {
                          style: sx({
                            fontSize: 8,
                            fontWeight: 400,
                            color: textColor,
                            opacity: 0.7,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 100
                          }),
                          children: description
                        }
                      ),
                      showStageId && stageId && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "span",
                        {
                          style: sx({
                            fontSize: 8,
                            fontFamily: theme.fontMono,
                            color: textColor,
                            opacity: 0.55,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 100
                          }),
                          title: `stageId: ${stageId}`,
                          children: stageId
                        }
                      )
                    ]
                  }
                )
              ] }) : (
                /* Standard rectangular node */
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                  "div",
                  {
                    "data-fp": "stage-node-body",
                    style: sx({
                      background: bg,
                      color: textColor,
                      border: `${borderWidth} ${borderStyle} ${borderColor}`,
                      borderRadius: nodeRadius,
                      padding: description ? `${Math.round(6 * sizeScale)}px ${Math.round(12 * sizeScale)}px` : `${Math.round(7 * sizeScale)}px ${Math.round(14 * sizeScale)}px`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: description ? 2 : 0,
                      boxShadow: shadow,
                      transition: suppressMotion ? "none" : "all 0.3s ease",
                      fontFamily: theme.fontSans,
                      minWidth: 100,
                      justifyContent: "center"
                    }),
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: sx({ display: "flex", alignItems: "center", gap: 6 }), children: [
                        effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(StageIcon, { type: effectiveIcon, color: textColor, unstyled, size: unstyled ? void 0 : iconFootprint }),
                        done && !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: sx({ fontSize: 10, color: textColor }), children: "\u2713" }),
                        active && !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          "span",
                          {
                            style: sx({
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#fff",
                              animation: suppressMotion ? "none" : "fp-blink 1s ease-in-out infinite",
                              flexShrink: 0
                            })
                          }
                        ),
                        error && !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: sx({ fontSize: 10, color: textColor }), children: "\u2717" }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          "span",
                          {
                            style: sx({
                              fontSize: Math.round(13 * sizeScale),
                              fontWeight: isHero ? 700 : 500,
                              color: textColor,
                              whiteSpace: "nowrap"
                            }),
                            children: label
                          }
                        ),
                        isSubflow && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                          "span",
                          {
                            style: sx({
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 16,
                              height: 16,
                              borderRadius: 3,
                              border: `1.5px solid ${textColor}`,
                              position: "relative",
                              opacity: 0.7,
                              flexShrink: 0
                            }),
                            children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                              "span",
                              {
                                style: sx({
                                  width: 8,
                                  height: 8,
                                  borderRadius: 2,
                                  border: `1px solid ${textColor}`
                                })
                              }
                            )
                          }
                        )
                      ] }),
                      description && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "span",
                        {
                          style: sx({
                            fontSize: 10,
                            fontWeight: 400,
                            color: textColor,
                            opacity: 0.7,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 160
                          }),
                          children: description
                        }
                      ),
                      showStageId && stageId && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                        "span",
                        {
                          style: sx({
                            fontSize: 9,
                            fontFamily: theme.fontMono,
                            color: textColor,
                            opacity: 0.55,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 160
                          }),
                          title: `stageId: ${stageId}`,
                          children: stageId
                        }
                      )
                    ]
                  }
                )
              )
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_react19.Handle, { type: "source", position: import_react19.Position.Bottom, style: sx({ opacity: 0 }) })
  ] });
});

// src/components/TimeTravelDebugger/TimeTravelDebugger.tsx
var import_react44 = require("react");

// src/components/FlowchartView/_internal/devWarn.ts
function isDevModeEnv() {
  const proc = globalThis.process;
  return proc?.env?.NODE_ENV !== "production";
}
function devWarn(messageFn, ...extras) {
  if (!isDevModeEnv()) return;
  console.warn(messageFn(), ...extras);
}

// src/_internal/deprecate.ts
var announced = /* @__PURE__ */ new Set();
function warnDeprecated(what, useInstead) {
  if (announced.has(what)) return;
  announced.add(what);
  devWarn(
    () => `[footprint-explainable-ui] ${what} is deprecated and will be removed in the next major. ${useInstead}`
  );
}

// src/components/MemoryInspector/MemoryInspector.tsx
var import_react20 = require("react");
var import_jsx_runtime10 = require("react/jsx-runtime");
function ownEntries(memory) {
  try {
    return Object.entries(Object.getOwnPropertyDescriptors(memory)).filter(([, descriptor]) => descriptor.enumerable);
  } catch {
    return null;
  }
}
function MemoryInspector({
  data,
  snapshots,
  selectedIndex = 0,
  showTypes = false,
  highlightNew = true,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const { memory, newKeys } = (0, import_react20.useMemo)(() => {
    if (data) {
      return { memory: data, newKeys: /* @__PURE__ */ new Set() };
    }
    if (!snapshots || snapshots.length === 0) {
      return { memory: {}, newKeys: /* @__PURE__ */ new Set() };
    }
    const safeIdx = Math.min(selectedIndex, snapshots.length - 1);
    const merged = snapshots[safeIdx]?.memory ?? {};
    const nk = /* @__PURE__ */ new Set();
    if (highlightNew) {
      const prev = safeIdx > 0 ? snapshots[safeIdx - 1]?.memory ?? {} : {};
      for (const k of Object.keys(merged)) {
        if (!Object.prototype.hasOwnProperty.call(prev, k)) nk.add(k);
      }
    }
    return { memory: merged, newKeys: nk };
  }, [data, snapshots, selectedIndex, highlightNew]);
  const entries = ownEntries(memory);
  const ui = componentStyles(size);
  if (!entries) return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className, style, "data-fp": "memory-inspector", role: "region", "aria-label": "Memory state", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("pre", { children: "[Unavailable]" }) });
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className, style, "data-fp": "memory-inspector", role: "region", "aria-label": "Memory state", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { "data-fp": "memory-label", children: "Memory State" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("pre", { "data-fp": "memory-json", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(FootprintCode, { defaultStyle: void 0, children: formatRecordedValue(memory, { indent: 2 }) }) }),
      showTypes && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dl", { "data-fp": "memory-types", children: entries.map(([key, descriptor]) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { children: key }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dd", { children: "value" in descriptor ? typeof descriptor.value : "unavailable" })
      ] }, key)) })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    "div",
    {
      className,
      style: {
        padding: ui.padding,
        fontFamily: theme.fontSans,
        ...style
      },
      "data-fp": "memory-inspector",
      role: "region",
      "aria-label": "Memory state",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "span",
          {
            style: {
              fontSize: ui.label,
              fontWeight: ui.weightStrong,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            },
            children: "Memory State"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
          "div",
          {
            style: {
              marginTop: ui.spaceSm,
              background: theme.bgSecondary,
              border: `${ui.borderWidth} solid ${theme.border}`,
              borderRadius: ui.radiusPanel,
              padding: `${ui.padding} calc(${ui.padding} + ${ui.spaceXs})`,
              fontFamily: theme.fontMono,
              fontSize: ui.body,
              lineHeight: ui.lineHeight
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { style: { color: theme.textMuted }, children: "{" }),
              entries.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                "div",
                {
                  style: {
                    paddingLeft: ui.spaceLg,
                    color: theme.textMuted,
                    fontStyle: "italic"
                  },
                  children: "// empty"
                }
              ),
              entries.map(([key, descriptor], i) => {
                const isNew = newKeys.has(key);
                const isLast = i === entries.length - 1;
                return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                  "div",
                  {
                    style: {
                      paddingLeft: ui.spaceLg,
                      background: isNew ? `color-mix(in srgb, ${theme.success} 10%, transparent)` : "transparent",
                      borderRadius: ui.radiusControl,
                      marginLeft: `calc(-1 * ${ui.spaceXs})`,
                      marginRight: `calc(-1 * ${ui.spaceXs})`,
                      paddingRight: ui.spaceXs
                    },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { style: { color: theme.primary }, children: [
                        '"',
                        key,
                        '"'
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { style: { color: theme.textMuted }, children: ": " }),
                      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { style: { color: theme.success }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(FootprintCode, { defaultStyle: void 0, children: "value" in descriptor ? formatRecordedValue(descriptor.value) : "[Unavailable]" }) }),
                      showTypes && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                        "span",
                        {
                          style: {
                            color: theme.textMuted,
                            fontSize: ui.small,
                            marginLeft: ui.spaceSm,
                            opacity: 0.6
                          },
                          children: [
                            "(",
                            "value" in descriptor ? typeof descriptor.value : "unavailable",
                            ")"
                          ]
                        }
                      ),
                      !isLast && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { style: { color: theme.textMuted }, children: "," })
                    ]
                  },
                  key
                );
              }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { style: { color: theme.textMuted }, children: "}" })
            ]
          }
        )
      ]
    }
  );
}

// src/components/NarrativeLog/NarrativeLog.tsx
var import_react21 = require("react");
var import_jsx_runtime11 = require("react/jsx-runtime");
function NarrativeLog({
  snapshots,
  selectedIndex,
  narrative,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const entries = (0, import_react21.useMemo)(() => {
    if (narrative) {
      return [{ label: "Output", text: narrative, isCurrent: true }];
    }
    const idx = selectedIndex ?? snapshots.length - 1;
    return snapshots.slice(0, idx + 1).map((s, i) => ({
      label: s.stageLabel,
      text: s.narrative,
      isCurrent: i === idx
    }));
  }, [snapshots, selectedIndex, narrative]);
  const fs = fontSize[size];
  const pad = padding[size];
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className, style, "data-fp": "narrative-log", children: entries.map((entry, i) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { "data-fp": "narrative-entry", "data-current": entry.isCurrent, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: entry.label }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: entry.text })
    ] }, i)) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
    "div",
    {
      className,
      style: { padding: pad, fontFamily: theme.fontSans, ...style },
      "data-fp": "narrative-log",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          "span",
          {
            style: {
              fontSize: fs.label,
              fontWeight: 600,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            },
            children: "Execution Log"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { marginTop: 8, display: "flex", flexDirection: "column" }, children: entries.map((entry, i) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              gap: 10,
              padding: `${pad}px 0`,
              borderBottom: i < entries.length - 1 ? `1px solid ${theme.border}` : "none"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: 12,
                    flexShrink: 0,
                    paddingTop: 5
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
                      "div",
                      {
                        style: {
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: entry.isCurrent ? theme.primary : theme.success,
                          flexShrink: 0
                        }
                      }
                    ),
                    i < entries.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
                      "div",
                      {
                        style: {
                          width: 1,
                          flex: 1,
                          background: theme.border,
                          marginTop: 4
                        }
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
                  "span",
                  {
                    style: {
                      fontSize: fs.label,
                      fontWeight: 600,
                      color: entry.isCurrent ? theme.primary : theme.textMuted
                    },
                    children: entry.label
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
                  "div",
                  {
                    style: {
                      fontSize: fs.body,
                      lineHeight: 1.5,
                      color: entry.isCurrent ? theme.textPrimary : theme.textSecondary,
                      marginTop: 2
                    },
                    children: entry.text
                  }
                )
              ] })
            ]
          },
          i
        )) })
      ]
    }
  );
}

// src/components/GanttTimeline/GanttTimeline.tsx
var import_react23 = require("react");

// src/_internal/useTraceMotion.ts
var import_react22 = require("react");
var TRACE_MOTION_MS = 240;
var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function useTraceMotion() {
  const [enabled, setEnabled] = (0, import_react22.useState)(false);
  (0, import_react22.useEffect)(() => {
    let active = true;
    let media;
    try {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
      media = window.matchMedia(REDUCED_MOTION_QUERY);
      if (!media || typeof media.matches !== "boolean") return;
    } catch {
      return;
    }
    const update = () => {
      if (!active) return;
      try {
        setEnabled(media.matches === false);
      } catch {
        setEnabled(false);
      }
    };
    let unsubscribe;
    try {
      if (typeof media.addEventListener === "function" && typeof media.removeEventListener === "function") {
        media.addEventListener("change", update);
        unsubscribe = () => media.removeEventListener("change", update);
      }
    } catch {
    }
    if (!unsubscribe) {
      try {
        if (typeof media.addListener === "function" && typeof media.removeListener === "function") {
          media.addListener(update);
          unsubscribe = () => media.removeListener(update);
        }
      } catch {
      }
    }
    if (!unsubscribe) {
      active = false;
      return;
    }
    update();
    return () => {
      active = false;
      try {
        unsubscribe?.();
      } catch {
      }
    };
  }, []);
  return enabled;
}

// src/components/GanttTimeline/GanttTimeline.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
var NO_TIMING_NOTE = "No timing recorded \u2014 bars show the order stages ran, not how long they took.";
var NO_TIMING_HINT = "Durations come from footprintjs's metrics recorder; this run was recorded without one.";
var NO_DURATION = "\u2014";
function GanttTimeline({
  snapshots,
  selectedIndex = 0,
  onSelect,
  size = "default",
  unstyled = false,
  className,
  style,
  theme: themeMode,
  maxVisibleRows = 5
}) {
  const [expanded, setExpanded] = (0, import_react23.useState)(false);
  const activeRowRef = (0, import_react23.useRef)(null);
  const scrollContainerRef = (0, import_react23.useRef)(null);
  const totalWallTime = (0, import_react23.useMemo)(
    () => Math.max(...snapshots.map((s) => s.startMs + s.durationMs), 1),
    [snapshots]
  );
  const untimed = (0, import_react23.useMemo)(
    () => snapshots.length > 0 && snapshots.every((s) => s.durationMs === 0),
    [snapshots]
  );
  const rowDuration = (snap) => untimed ? NO_DURATION : `${snap.durationMs}ms`;
  const rowLabel = (snap, idx) => untimed ? `${snap.stageLabel}, step ${idx + 1} of ${snapshots.length}, no timing recorded` : `${snap.stageLabel}, ${snap.durationMs}ms`;
  const barGeometry = (snap, idx) => untimed ? { leftPct: idx / snapshots.length * 100, widthPct: 100 / snapshots.length } : {
    leftPct: snap.startMs / totalWallTime * 100,
    widthPct: Math.max(snap.durationMs / totalWallTime * 100, 1)
  };
  const ui = componentStyles(size);
  const motion = useTraceMotion() && !unstyled;
  const labelWidth = size === "compact" ? 50 : size === "detailed" ? 100 : 80;
  const msWidth = size === "compact" ? 28 : 36;
  const rowHeight = size === "compact" ? 18 : 22;
  const collapsible = maxVisibleRows > 0 && snapshots.length > maxVisibleRows;
  const showAll = expanded || !collapsible;
  (0, import_react23.useEffect)(() => {
    if (!showAll && activeRowRef.current && scrollContainerRef.current) {
      activeRowRef.current.scrollIntoView({
        block: "nearest",
        behavior: motion ? "smooth" : "auto"
      });
    }
  }, [selectedIndex, showAll, motion]);
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
      "div",
      {
        className,
        style,
        "data-fp": "gantt-timeline",
        "data-timing": untimed ? "none" : void 0,
        "data-expanded": showAll,
        "data-max-visible": maxVisibleRows,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { "data-fp": "gantt-header", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: size === "compact" ? "Timeline" : "Execution Timeline" }),
            collapsible && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(FootprintButton, { defaultStyle: void 0, onClick: () => setExpanded((value) => !value), "aria-expanded": expanded, children: expanded ? "Collapse" : `${snapshots.length - maxVisibleRows} more...` })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { role: "listbox", "aria-label": "Execution timeline", children: snapshots.map((snap, idx) => {
            const geometry = barGeometry(snap, idx);
            return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
              "div",
              {
                "data-fp": "gantt-bar",
                "data-selected": idx === selectedIndex,
                "data-visible": idx <= selectedIndex,
                "data-left-pct": geometry.leftPct,
                "data-width-pct": geometry.widthPct,
                role: "option",
                "aria-selected": idx === selectedIndex,
                "aria-label": rowLabel(snap, idx),
                tabIndex: onSelect ? 0 : void 0,
                onClick: () => onSelect?.(idx),
                onKeyDown: (event) => {
                  if (onSelect && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onSelect(idx);
                  }
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { "data-fp": "gantt-label", children: snap.stageLabel }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { "data-fp": "gantt-duration", children: rowDuration(snap) })
                ]
              },
              `${snap.stageName}-${idx}`
            );
          }) }),
          untimed ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { "data-fp": "gantt-no-timing", title: NO_TIMING_HINT, children: NO_TIMING_NOTE }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { "data-fp": "gantt-axis", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: "0ms" }),
            size !== "compact" && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { children: [
              (totalWallTime / 2).toFixed(1),
              "ms"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { children: [
              totalWallTime.toFixed(1),
              "ms"
            ] })
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
    "div",
    {
      className,
      style: { ...themeModeVars(themeMode), padding: ui.padding, fontFamily: theme.fontSans, ...style },
      "data-fp": "gantt-timeline",
      "data-timing": untimed ? "none" : void 0,
      "data-expanded": showAll,
      "data-max-visible": maxVisibleRows,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                "span",
                {
                  style: {
                    fontSize: ui.label,
                    fontWeight: ui.weightStrong,
                    color: theme.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em"
                  },
                  children: size === "compact" ? "Timeline" : "Execution Timeline"
                }
              ),
              collapsible && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                FootprintButton,
                {
                  onClick: () => setExpanded((e) => !e),
                  "aria-expanded": expanded,
                  defaultStyle: {
                    background: "none",
                    border: `${ui.borderWidth} solid ${theme.border}`,
                    borderRadius: ui.radiusControl,
                    color: theme.textSecondary,
                    fontSize: ui.small,
                    padding: `calc(${ui.spaceXs} / 2) ${ui.spaceSm}`,
                    cursor: "pointer",
                    fontFamily: theme.fontSans
                  },
                  children: expanded ? "Collapse" : `${snapshots.length - maxVisibleRows} more...`
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          "div",
          {
            ref: scrollContainerRef,
            role: "listbox",
            "aria-label": "Execution timeline",
            style: {
              marginTop: ui.spaceSm,
              display: "flex",
              flexDirection: "column",
              gap: ui.spaceXs,
              ...showAll ? {} : {
                maxHeight: maxVisibleRows * (rowHeight + 4),
                overflowY: "auto",
                scrollbarWidth: "thin"
              }
            },
            children: snapshots.map((snap, idx) => {
              const { leftPct, widthPct } = barGeometry(snap, idx);
              const isSelected = idx === selectedIndex;
              const isVisible = idx <= selectedIndex;
              return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
                "div",
                {
                  ref: isSelected ? activeRowRef : void 0,
                  "data-fp": "gantt-bar",
                  "data-selected": isSelected,
                  "data-visible": isVisible,
                  role: "option",
                  tabIndex: onSelect ? 0 : void 0,
                  onKeyDown: (event) => {
                    if (onSelect && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      onSelect(idx);
                    }
                  },
                  "aria-selected": isSelected,
                  "aria-label": rowLabel(snap, idx),
                  onClick: () => onSelect?.(idx),
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: size === "compact" ? 4 : 8,
                    cursor: onSelect ? "pointer" : "default",
                    opacity: isVisible ? 1 : 0.3,
                    transition: motion ? `opacity ${ui.duration} ${ui.easing}` : "none",
                    height: rowHeight,
                    flexShrink: 0
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                      "span",
                      {
                        "data-fp": "gantt-label",
                        title: snap.stageLabel,
                        style: {
                          width: labelWidth,
                          fontSize: ui.small,
                          color: isSelected ? theme.primary : theme.textMuted,
                          fontWeight: isSelected ? ui.weightStrong : ui.weightNormal,
                          textAlign: "right",
                          flexShrink: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        },
                        children: snap.stageLabel
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                      "div",
                      {
                        style: {
                          flex: 1,
                          height: size === "compact" ? 6 : 8,
                          position: "relative",
                          background: theme.bgTertiary,
                          borderRadius: ui.radiusControl
                        },
                        children: isVisible && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                          "div",
                          {
                            style: {
                              position: "absolute",
                              left: `${leftPct}%`,
                              top: 0,
                              width: `${widthPct}%`,
                              height: "100%",
                              borderRadius: ui.radiusControl,
                              background: isSelected ? theme.primary : theme.success,
                              transition: motion ? `width ${ui.duration} ${ui.easing}` : "none"
                            }
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                      "span",
                      {
                        "data-fp": "gantt-duration",
                        style: {
                          fontSize: ui.small,
                          color: theme.textMuted,
                          fontFamily: theme.fontMono,
                          width: msWidth,
                          flexShrink: 0
                        },
                        children: rowDuration(snap)
                      }
                    )
                  ]
                },
                `${snap.stageName}-${idx}`
              );
            })
          }
        ),
        untimed ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          "div",
          {
            "data-fp": "gantt-no-timing",
            title: NO_TIMING_HINT,
            style: {
              marginTop: ui.controlGap,
              fontSize: ui.small,
              color: theme.textMuted,
              fontStyle: "italic",
              lineHeight: ui.lineHeight
            },
            children: NO_TIMING_NOTE
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
          "div",
          {
            style: {
              marginTop: ui.spaceXs,
              marginLeft: labelWidth + (size === "compact" ? 4 : 8),
              marginRight: msWidth + (size === "compact" ? 4 : 8),
              display: "flex",
              justifyContent: "space-between",
              fontSize: `calc(${ui.small} - 1px)`,
              color: theme.textMuted,
              fontFamily: theme.fontMono
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: "0ms" }),
              size !== "compact" && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { children: [
                (totalWallTime / 2).toFixed(1),
                "ms"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { children: [
                totalWallTime.toFixed(1),
                "ms"
              ] })
            ]
          }
        )
      ]
    }
  );
}

// src/components/FlowchartView/TraceFlow.tsx
var import_react37 = require("react");
var import_react38 = require("@xyflow/react");

// src/components/LoopBackEdge/LoopBackEdge.tsx
var import_react24 = require("@xyflow/react");

// src/components/FlowchartView/_internal/loopRouting.ts
var LOOP_LANE_GAP = 56;
function loopLaneX(contentRights, gap = LOOP_LANE_GAP) {
  let max = -Infinity;
  for (const r of contentRights) if (r > max) max = r;
  if (!Number.isFinite(max)) max = 0;
  return max + gap;
}
function loopBackPath(source, target, laneX, radius2 = 22) {
  const { right: sx, centerY: sy } = source;
  const { right: tx, centerY: ty } = target;
  const r = Math.max(
    0,
    Math.min(radius2, Math.abs(sy - ty) / 2, laneX - sx, laneX - tx)
  );
  const up = ty <= sy;
  const vy1 = up ? sy - r : sy + r;
  const vy2 = up ? ty + r : ty - r;
  return [
    `M ${sx},${sy}`,
    `L ${laneX - r},${sy}`,
    `Q ${laneX},${sy} ${laneX},${vy1}`,
    `L ${laneX},${vy2}`,
    `Q ${laneX},${ty} ${laneX - r},${ty}`,
    `L ${tx},${ty}`
  ].join(" ");
}

// src/components/FlowchartView/_internal/groupLayout.ts
var GROUP_CONTAINER_NODE_TYPE = "groupContainer";
var DEFAULT_PADDING = 16;
var DEFAULT_HEADER = 44;
var DEFAULT_NODE_W = 200;
var DEFAULT_NODE_H = 80;
function footprintOf(node, fallbackW, fallbackH, resolver) {
  const style = node.style ?? {};
  const w = typeof style.width === "number" ? style.width : fallbackW;
  const h = typeof style.height === "number" ? style.height : fallbackH;
  if (!resolver) return { width: w, height: h };
  const positive = (value, fallback2) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback2;
  const styleW = positive(style.width, NaN), styleH = positive(style.height, NaN);
  const container = node.type === GROUP_CONTAINER_NODE_TYPE || node.data?.isGroupContainer === true;
  if (container && Number.isFinite(styleW) && Number.isFinite(styleH)) return { width: styleW, height: styleH };
  const resolved = resolver(node);
  const intrinsicW = positive(node.measured?.width, positive(node.width, fallbackW));
  const intrinsicH = positive(node.measured?.height, positive(node.height, fallbackH));
  return container ? {
    width: positive(styleW, positive(resolved?.width, intrinsicW)),
    height: positive(styleH, positive(resolved?.height, intrinsicH))
  } : {
    width: positive(resolved?.width, positive(styleW, intrinsicW)),
    height: positive(resolved?.height, positive(styleH, intrinsicH))
  };
}
function applyGroupLayout(graph, opts) {
  const padding2 = opts.padding ?? DEFAULT_PADDING;
  const headerHeight = opts.headerHeight ?? DEFAULT_HEADER;
  const nodeW = opts.nodeWidth ?? DEFAULT_NODE_W;
  const nodeH = opts.nodeHeight ?? DEFAULT_NODE_H;
  const baseLayout = opts.baseLayout;
  const requested = new Set(opts.groupedSubflowIds);
  const membersBySubflow = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) {
    const of = n.data?.subflowOf;
    if (of !== void 0 && requested.has(of)) {
      const arr = membersBySubflow.get(of) ?? [];
      arr.push(n);
      membersBySubflow.set(of, arr);
    }
  }
  const mountBySubflow = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) {
    const sfId = n.data?.subflowId;
    if (n.data?.isSubflow && sfId !== void 0 && requested.has(sfId) && membersBySubflow.has(sfId)) {
      mountBySubflow.set(sfId, n);
    }
  }
  const activeGroups = /* @__PURE__ */ new Set();
  for (const sfId of mountBySubflow.keys()) activeGroups.add(sfId);
  if (activeGroups.size === 0) {
    return graph;
  }
  const memberIds = /* @__PURE__ */ new Set();
  for (const sfId of activeGroups) {
    for (const m of membersBySubflow.get(sfId) ?? []) memberIds.add(m.id);
  }
  const containerNodes = [];
  const nestedMembers = [];
  const groupBox = /* @__PURE__ */ new Map();
  for (const sfId of activeGroups) {
    const members = membersBySubflow.get(sfId);
    const innerOnlyEdges = graph.edges.filter((e) => {
      const s = members.some((m) => m.id === e.source);
      const t = members.some((m) => m.id === e.target);
      return s && t;
    });
    const innerPositioned = baseLayout({ nodes: members, edges: innerOnlyEdges });
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const m of innerPositioned.nodes) {
      const p = m.position;
      const { width, height } = footprintOf(m, nodeW, nodeH, opts.nodeSize);
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x + width > maxX) maxX = p.x + width;
      if (p.y + height > maxY) maxY = p.y + height;
    }
    if (!Number.isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 0;
      maxY = 0;
    }
    const boxWidth = maxX - minX + padding2 * 2;
    const boxHeight = maxY - minY + headerHeight + padding2 * 2;
    groupBox.set(sfId, { width: boxWidth, height: boxHeight, minX, minY, members: innerPositioned.nodes });
  }
  const outerNodes = graph.nodes.filter((n) => !memberIds.has(n.id)).map((n) => {
    const box2 = n.data?.subflowId ? groupBox.get(n.data.subflowId) : void 0;
    return box2 ? {
      ...n,
      style: { ...n.style ?? {}, width: box2.width, height: box2.height },
      data: { ...n.data, isGroupContainer: true }
    } : n;
  });
  const outerEdges = graph.edges.filter(
    (e) => !memberIds.has(e.source) && !memberIds.has(e.target)
  );
  const outerPositioned = baseLayout({ nodes: outerNodes, edges: outerEdges });
  const outerPosById = new Map(outerPositioned.nodes.map((n) => [n.id, n.position]));
  for (const sfId of activeGroups) {
    const mount = mountBySubflow.get(sfId);
    const box2 = groupBox.get(sfId);
    const { width: boxWidth, height: boxHeight, minX, minY } = box2;
    const mountPos = outerPosById.get(mount.id) ?? mount.position ?? { x: 0, y: 0 };
    containerNodes.push({
      ...mount,
      type: GROUP_CONTAINER_NODE_TYPE,
      position: mountPos,
      style: { ...mount.style ?? {}, width: boxWidth, height: boxHeight },
      data: { ...mount.data, isGroupContainer: true }
    });
    for (const m of box2.members) {
      const relX = m.position.x - minX + padding2;
      const relY = m.position.y - minY + headerHeight + padding2;
      nestedMembers.push({
        ...m,
        parentId: mount.id,
        extent: "parent",
        position: { x: relX, y: relY }
      });
    }
  }
  const containerById = new Map(containerNodes.map((c) => [c.id, c]));
  const outerOut = outerPositioned.nodes.map(
    (n) => containerById.get(n.id) ?? n
  );
  return {
    nodes: [...outerOut, ...nestedMembers],
    edges: graph.edges
  };
}
function createGroupedLayout(opts) {
  return (graph) => applyGroupLayout(graph, opts);
}
var MAIN_CHART_BOX_ID = "__main_chart__";
function wrapInMainChartBox(graph, opts) {
  if (graph.nodes.length === 0) return graph;
  const padding2 = opts.padding ?? DEFAULT_PADDING;
  const headerHeight = opts.headerHeight ?? DEFAULT_HEADER;
  const nodeW = opts.nodeWidth ?? DEFAULT_NODE_W;
  const nodeH = opts.nodeHeight ?? DEFAULT_NODE_H;
  const mainId = opts.id ?? MAIN_CHART_BOX_ID;
  const positioned = opts.baseLayout(graph);
  const topLevel = positioned.nodes.filter((n) => n.parentId === void 0);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of topLevel) {
    const p = n.position;
    const { width, height } = footprintOf(n, nodeW, nodeH, opts.nodeSize);
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x + width > maxX) maxX = p.x + width;
    if (p.y + height > maxY) maxY = p.y + height;
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 0;
    maxY = 0;
  }
  const hasLoopEdge = graph.edges.some((e) => e.data?.kind === "loop");
  const loopReserve = hasLoopEdge ? LOOP_LANE_GAP : 0;
  const boxWidth = maxX - minX + padding2 * 2 + loopReserve;
  const boxHeight = maxY - minY + headerHeight + padding2 * 2;
  const container = {
    id: mainId,
    type: GROUP_CONTAINER_NODE_TYPE,
    position: { x: 0, y: 0 },
    style: { width: boxWidth, height: boxHeight },
    data: {
      label: opts.label ?? "Chart",
      isDecider: false,
      isFork: false,
      isStreaming: false,
      isSubflow: false,
      isGroupContainer: true,
      isMainChart: true,
      ...opts.kind !== void 0 && { kind: opts.kind },
      prevIds: [],
      nextIds: []
    }
  };
  const topLevelIds = new Set(topLevel.map((n) => n.id));
  const reparented = positioned.nodes.map((n) => {
    if (!topLevelIds.has(n.id)) return n;
    return {
      ...n,
      parentId: mainId,
      extent: "parent",
      position: {
        x: n.position.x - minX + padding2,
        y: n.position.y - minY + headerHeight + padding2
      }
    };
  });
  return { nodes: [container, ...reparented], edges: graph.edges };
}
function createMainChartBoxLayout(opts) {
  return (graph) => wrapInMainChartBox(graph, opts);
}

// src/components/LoopBackEdge/LoopBackEdge.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
var LOOP_DASH = "5 5";
var LOOP_STROKE_OPACITY_CAP = 0.55;
var LOOP_STROKE_WIDTH = 1.5;
function softenLoopStyle(style) {
  const passedStrokeOpacity = typeof style?.strokeOpacity === "number" ? style.strokeOpacity : 1;
  return {
    ...style,
    strokeDasharray: style?.strokeDasharray ?? LOOP_DASH,
    strokeOpacity: Math.min(passedStrokeOpacity, LOOP_STROKE_OPACITY_CAP),
    strokeWidth: LOOP_STROKE_WIDTH
  };
}
var LOOP_CORNER_RADIUS = 28;
function rightEdge(node) {
  return node.internals.positionAbsolute.x + (node.measured.width ?? 0);
}
function centerY(node) {
  return node.internals.positionAbsolute.y + (node.measured.height ?? 0) / 2;
}
function LoopBackEdge({ id, source, target, markerEnd, style, data }) {
  const path = (0, import_react24.useStore)((s) => {
    const src = s.nodeLookup.get(source);
    const tgt = s.nodeLookup.get(target);
    if (!src || !tgt) return "";
    const contentRights = [];
    for (const n of s.nodeLookup.values()) {
      if (n.type === GROUP_CONTAINER_NODE_TYPE) continue;
      contentRights.push(rightEdge(n));
    }
    const laneX = loopLaneX([...contentRights, rightEdge(src), rightEdge(tgt)], LOOP_LANE_GAP);
    return loopBackPath(
      { right: rightEdge(src), centerY: centerY(src) },
      { right: rightEdge(tgt), centerY: centerY(tgt) },
      laneX,
      LOOP_CORNER_RADIUS
    );
  });
  if (!path) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
    import_react24.BaseEdge,
    {
      id,
      path,
      markerEnd,
      style: data?.unstyled === true ? style : { ...softenLoopStyle(void 0), ...style },
      "aria-label": "Loop back"
    }
  );
}

// src/components/SmartStepEdge/SmartStepEdge.tsx
var import_react25 = require("@xyflow/react");
var import_react26 = require("@xyflow/react");

// src/components/FlowchartView/_internal/stepRouting.ts
function staggeredBendY(sourceBottom, targetTop, others, minGapFromTarget = 8) {
  let lowestSkippedBottom = -Infinity;
  for (const n of others) {
    const cy = (n.top + n.bottom) / 2;
    if (cy > sourceBottom && cy < targetTop && n.bottom > lowestSkippedBottom) {
      lowestSkippedBottom = n.bottom;
    }
  }
  if (lowestSkippedBottom === -Infinity) return null;
  return Math.min((lowestSkippedBottom + targetTop) / 2, targetTop - minGapFromTarget);
}
function forkFanBendY(sourceBottom, childTops, minGapFromTarget = 8) {
  if (childTops.length < 2) return null;
  const nearestTop = Math.min(...childTops);
  return Math.min((sourceBottom + nearestTop) / 2, nearestTop - minGapFromTarget);
}
function resolveStepBendY(forkBend, staggeredBend) {
  return staggeredBend ?? forkBend;
}

// src/components/SmartStepEdge/SmartStepEdge.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
function SmartStepEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style
}) {
  const bendY = (0, import_react25.useStore)((s) => {
    const src = s.nodeLookup.get(source);
    const tgt = s.nodeLookup.get(target);
    if (!src || !tgt) return null;
    const sourceBottom = src.internals.positionAbsolute.y + (src.measured.height ?? 0);
    const targetTop = tgt.internals.positionAbsolute.y;
    const childTops = [];
    for (const e of s.edges) {
      if (e.source !== source) continue;
      if (e.type === "recordedRead") continue;
      if (e.data?.kind === "loop") continue;
      const c = s.nodeLookup.get(e.target);
      if (c && c.type !== GROUP_CONTAINER_NODE_TYPE) {
        childTops.push(c.internals.positionAbsolute.y);
      }
    }
    const fan = forkFanBendY(sourceBottom, childTops);
    const others = [];
    for (const n of s.nodeLookup.values()) {
      if (n.id === source || n.id === target) continue;
      if (n.type === GROUP_CONTAINER_NODE_TYPE) continue;
      const top = n.internals.positionAbsolute.y;
      others.push({ top, bottom: top + (n.measured.height ?? 0) });
    }
    const staggered = staggeredBendY(sourceBottom, targetTop, others);
    return resolveStepBendY(fan, staggered);
  });
  const [path] = (0, import_react25.getSmoothStepPath)({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition ?? import_react26.Position.Bottom,
    targetX,
    targetY,
    targetPosition: targetPosition ?? import_react26.Position.Top,
    // Override the bend only for a staggered edge; otherwise let getSmoothStepPath
    // use its default centerY (== the built-in `smoothstep` path, byte-for-byte).
    ...bendY !== null ? { centerY: bendY } : {}
  });
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_react25.BaseEdge, { id, path, markerEnd, style });
}

// src/components/FlowchartView/_internal/dagreTraceLayout.ts
var import_dagre2 = __toESM(require("dagre"), 1);
var DEFAULT_NODE_W2 = 200;
var DEFAULT_NODE_H2 = 80;
function sizeOf(node, fallbackW, fallbackH, resolver) {
  const style = node.style ?? {};
  const styleW = typeof style.width === "number" ? style.width : void 0;
  const styleH = typeof style.height === "number" ? style.height : void 0;
  if (node.data?.isGroupContainer && styleW !== void 0 && styleH !== void 0) {
    return { width: styleW, height: styleH };
  }
  const resolved = resolver?.(node);
  if (resolved) return { width: resolved.width, height: resolved.height };
  return {
    width: styleW ?? fallbackW,
    height: styleH ?? fallbackH
  };
}
function reorderSiblingEdges(edges, siblingOrder) {
  const bySource = /* @__PURE__ */ new Map();
  for (const e of edges) {
    if (e.data?.kind === "loop") continue;
    const arr = bySource.get(e.source);
    if (arr) arr.push(e);
    else bySource.set(e.source, [e]);
  }
  const out = [];
  for (const [src, group] of bySource) {
    if (group.length < 2) {
      out.push(...group);
      continue;
    }
    const ordered = siblingOrder(src, group.map((e) => e.target));
    const byTarget = new Map(group.map((e) => [e.target, e]));
    const used = /* @__PURE__ */ new Set();
    for (const t of ordered) {
      const e = byTarget.get(t);
      if (e && !used.has(t)) {
        out.push(e);
        used.add(t);
      }
    }
    for (const e of group) if (!used.has(e.target)) out.push(e);
  }
  return out;
}
function dagreTraceLayout(graph, options = {}) {
  if (graph.nodes.length === 0) return graph;
  const direction = options.direction ?? "TB";
  const rankSep = options.rankSep ?? 80;
  const nodeSep = options.nodeSep ?? 60;
  const edgeSep = options.edgeSep ?? 20;
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W2;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H2;
  const g = new import_dagre2.default.graphlib.Graph({ compound: true });
  g.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep, edgesep: edgeSep });
  g.setDefaultEdgeLabel(() => ({}));
  const sizes = /* @__PURE__ */ new Map();
  const resolvedStyleSizes = /* @__PURE__ */ new Map();
  for (const node of graph.nodes) {
    const resolved = options.nodeSize?.(node);
    const size = sizeOf(node, fallbackW, fallbackH, options.nodeSize);
    sizes.set(node.id, size);
    if (resolved && resolved.width === size.width && resolved.height === size.height) {
      resolvedStyleSizes.set(node.id, resolved);
    }
    g.setNode(node.id, { width: size.width, height: size.height });
    if (node.parentId) {
      g.setParent(node.id, node.parentId);
    }
  }
  const layoutEdges = options.siblingOrder ? reorderSiblingEdges(graph.edges, options.siblingOrder) : graph.edges;
  for (const e of layoutEdges) {
    if (e.data?.kind === "loop") continue;
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      const label = {};
      const weight = options.edgeWeight?.(e);
      const minlen = options.edgeMinLen?.(e);
      if (typeof weight === "number") label.weight = weight;
      if (typeof minlen === "number") label.minlen = minlen;
      g.setEdge(e.source, e.target, label);
    }
  }
  import_dagre2.default.layout(g);
  const positioned = graph.nodes.map((node) => {
    const laidOut = g.node(node.id);
    if (!laidOut) return node;
    const size = sizes.get(node.id);
    let x = laidOut.x - size.width / 2;
    let y = laidOut.y - size.height / 2;
    if (node.parentId) {
      const parent = g.node(node.parentId);
      const parentSize = sizes.get(node.parentId);
      if (parent && parentSize) {
        x -= parent.x - parentSize.width / 2;
        y -= parent.y - parentSize.height / 2;
      }
    }
    const styleSize = resolvedStyleSizes.get(node.id);
    if (styleSize) {
      return {
        ...node,
        position: { x, y },
        style: { ...node.style ?? {}, width: styleSize.width, height: styleSize.height }
      };
    }
    return { ...node, position: { x, y } };
  });
  return { nodes: positioned, edges: graph.edges };
}
function createDagreTraceLayout(options = {}) {
  return (graph) => dagreTraceLayout(graph, options);
}

// src/model/flowchart.ts
function resolveFlowchartRenderer(value) {
  if (value === void 0) return "flat";
  if (value !== "flat" && value !== "isometric")
    throw new Error('Invalid flowchart options: renderer must be "flat" or "isometric".');
  return value;
}

// src/components/IsometricFlow/IsometricStageNode.tsx
var import_react27 = require("@xyflow/react");

// src/components/IsometricFlow/styles.ts
var isoStyles = {
  root: { position: "relative", width: 168, height: 116, overflow: "visible", boxSizing: "border-box" },
  slab: { position: "absolute", left: 0, top: 0, width: 168, height: 100, overflow: "visible", pointerEvents: "none" },
  icon: {
    position: "absolute",
    left: 77,
    top: 41,
    display: "flex",
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none"
  },
  steps: {
    position: "absolute",
    left: 4,
    top: 1,
    display: "flex",
    gap: 2,
    maxWidth: 112,
    flexWrap: "wrap",
    pointerEvents: "none"
  },
  step: { display: "inline-flex", minWidth: 14, height: 15, padding: "0 2px", alignItems: "center", justifyContent: "center" },
  status: { position: "absolute", right: 0, top: 2, padding: "2px 4px", pointerEvents: "none" },
  retry: { position: "absolute", right: 0, top: 82, padding: "2px 4px" },
  label: {
    position: "absolute",
    left: 0,
    top: 99,
    width: 168,
    overflow: "hidden",
    textAlign: "center",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    pointerEvents: "none"
  },
  trace: {
    position: "absolute",
    left: "50%",
    top: 118,
    transform: "translateX(-50%)",
    display: "block",
    width: "max-content",
    maxWidth: 220,
    overflow: "hidden",
    padding: "2px 5px",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    zIndex: 2
  }
};
var radius = v("--fp-node-radius", "4px");
var isoPaint = {
  step: { borderRadius: radius, fontSize: 9, lineHeight: 1 },
  status: { borderRadius: radius, fontSize: 8, fontWeight: 700, lineHeight: 1.2, letterSpacing: ".03em" },
  label: { fontSize: 11, fontWeight: 600, lineHeight: "17px" },
  trace: { borderRadius: radius, fontSize: 9, lineHeight: "13px" }
};

// src/components/IsometricFlow/IsometricStageNode.tsx
var import_jsx_runtime15 = require("react/jsx-runtime");
var TOP = "M26 50 82 22Q88 19 94 22L150 50Q156 53 150 56L94 84Q88 87 82 84L26 56Q20 53 26 50Z";
var LEFT_SIDE = "M20 53 88 87V95L24 63Q20 61 20 57Z";
var RIGHT_SIDE = "M88 87 156 53V57Q156 61 152 63L88 95Z";
function FallbackIcon({ name, data }) {
  let drawing;
  if (data.isDecider || name === "decision") {
    drawing = /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "m12 3 9 9-9 9-9-9 9-9Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M12 8v5m0 3h.01" })
    ] });
  } else if (data.isFork || name === "parallel") {
    drawing = /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M12 3v5M5 13V8h14v5M5 17v4m14-4v4" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("rect", { x: "2", y: "13", width: "6", height: "4", rx: "1" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("rect", { x: "16", y: "13", width: "6", height: "4", rx: "1" })
    ] });
  } else if (data.isSubflow || name === "agent") {
    drawing = /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("rect", { x: "3", y: "3", width: "18", height: "18", rx: "3" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("rect", { x: "6", y: "6", width: "5", height: "5", rx: "1" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("rect", { x: "13", y: "13", width: "5", height: "5", rx: "1" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M8.5 11v4.5H13" })
    ] });
  } else if (name === "rag" || name === "search") {
    drawing = /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("circle", { cx: "10", cy: "10", r: "6" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "m15 15 6 6M7 8h6m-6 4h4" })
    ] });
  } else if (name === "loop") {
    drawing = /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M19 7a8 8 0 1 0 1 8M19 3v5h-5" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "m10 8 5 4-5 4V8Z" })
    ] });
  } else if (name === "start") {
    drawing = /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_jsx_runtime15.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" }) });
  } else if (name === "end") {
    drawing = /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M13 3H5v18h14V9l-6-6Zm0 0v6h6" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "m8 15 3 3 5-6" })
    ] });
  } else if (name === "guard") {
    drawing = /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "m8 12 3 3 5-6" })
    ] });
  } else if (name === "parse") {
    drawing = /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_jsx_runtime15.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M3 5h18l-7 8v6l-4 2v-8L3 5Z" }) });
  } else if (name === "memory") {
    drawing = /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("rect", { x: "5", y: "3", width: "14", height: "18", rx: "1" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M8 7h8M8 11h8M8 15h5" })
    ] });
  } else {
    drawing = /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("rect", { x: "4", y: "5", width: "16", height: "14", rx: "3" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M8 9h8M8 13h5" })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: "100%",
      height: "100%",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.7",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      children: drawing
    }
  );
}
function IsometricStageNode({ data: input }) {
  const data = input;
  const tokens = useFootprintTheme();
  const { active, done, error, isSubflow, isDecider, isFork, traceWorkflow, traceContext, unstyled = false } = data;
  const label = typeof data.label === "string" ? data.label : "Recorded step";
  const description = typeof data.description === "string" ? data.description : "";
  const hero = data.emphasis === "hero";
  const fill = active ? theme.nodeCursor : done ? hero ? theme.nodeMain : theme.nodeVisited : error ? theme.error : hero ? `color-mix(in srgb, ${theme.nodeMain} 12%, ${theme.bgSecondary})` : theme.bgSecondary;
  const foreground = active ? theme.onNodeCursor : done ? hero ? theme.onNodeMain : theme.onNodeVisited : error ? theme.onNodeError : theme.textPrimary;
  const outline = v("--fp-node-border-color", theme.border);
  const outlineWidth = v("--fp-node-border-width", "1.25px");
  const declaredStyle = tokens.nodes?.borderStyle;
  const dash = data.isLazy && !active && !done || declaredStyle === "dashed" ? "4 3" : declaredStyle === "dotted" ? "1 3" : void 0;
  const status = active ? traceWorkflow || traceContext ? "VIEWING" : "NOW" : done ? "VISITED" : error ? "FAILED" : void 0;
  const retries = typeof data.retryAttempts === "number" && data.retryAttempts > 1 ? data.retryAttempts : void 0;
  const retryLabel = retries ? `retried, attempt ${retries} of ${retries} ${error ? "failed" : "succeeded"}` : void 0;
  const steps = data.stepNumbers?.filter(Number.isFinite) ?? [];
  const icon = typeof data.icon === "string" ? data.icon : isSubflow ? "agent" : isDecider ? "decision" : isFork ? "parallel" : "stage";
  const role = traceWorkflow?.role === "question" ? "Question" : traceWorkflow?.role === "input" ? "Recorded input" : "Upstream read";
  const traceValues = traceWorkflow?.values.map((value) => `${recordedPathLabel(value.key)}${value.preview === null ? " \xB7 preview unavailable" : ` = ${value.preview}`}`).join("; ");
  const facts = [
    label,
    description,
    isSubflow && "Subflow",
    isDecider && "Decision step",
    isFork && "Parallel branch point",
    active && "Selected step",
    done && "Recorded executed step",
    error && "Recorded failure",
    retryLabel,
    steps.length > 0 && `Execution steps ${steps.join(", ")}`,
    traceWorkflow && `${role}${traceValues ? `: ${traceValues}` : ""}`,
    traceContext === "outside" && "Outside displayed trace. Recorded execution status is shown independently."
  ].filter(Boolean).join(". ");
  const rootPaint = unstyled ? {} : { color: foreground, fontFamily: theme.fontSans };
  const badgePaint = unstyled ? {} : {
    color: foreground,
    background: fill,
    border: `1px solid ${outline}`,
    boxShadow: v("--fp-node-badge-shadow", "none"),
    fontFamily: theme.fontMono
  };
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
    "div",
    {
      className: "fp-isometric-stage iso-stage",
      "data-fp": "isometric-stage-node",
      "data-active": active || void 0,
      "data-done": done || void 0,
      "data-error": error || void 0,
      "data-dimmed": data.dimmed || void 0,
      "data-unstyled": unstyled || void 0,
      "data-trace-role": traceWorkflow?.role,
      "data-trace-context": traceContext,
      style: { ...isoStyles.root, ...rootPaint },
      role: "group",
      "aria-label": facts,
      title: facts,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          import_react27.Handle,
          {
            type: "target",
            position: import_react27.Position.Left,
            className: "iso-stage__handle",
            style: { left: 46, top: 40, width: 0, height: 0, minWidth: 0, minHeight: 0, border: 0, transform: "none", opacity: 0 }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          import_react27.Handle,
          {
            type: "source",
            position: import_react27.Position.Right,
            className: "iso-stage__handle",
            style: { left: 122, right: "auto", top: 78, width: 0, height: 0, minWidth: 0, minHeight: 0, border: 0, transform: "none", opacity: 0 }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
          "svg",
          {
            className: "iso-stage__slab",
            viewBox: "0 0 168 100",
            "aria-hidden": "true",
            focusable: "false",
            style: { ...isoStyles.slab, ...!unstyled && { filter: v("--fp-node-shape-shadow", `drop-shadow(1px 3px 1px color-mix(in srgb, ${theme.border} 20%, transparent))`) } },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
                "g",
                {
                  stroke: unstyled ? "currentColor" : outline,
                  strokeWidth: unstyled ? void 0 : outlineWidth,
                  strokeLinejoin: "round",
                  strokeDasharray: unstyled ? void 0 : dash,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: LEFT_SIDE, fill: unstyled ? "none" : `color-mix(in srgb, ${fill} 88%, ${outline})` }),
                    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: RIGHT_SIDE, fill: unstyled ? "none" : `color-mix(in srgb, ${fill} 76%, ${outline})` }),
                    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: TOP, fill: unstyled ? "none" : fill })
                  ]
                }
              ),
              traceWorkflow && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
                "path",
                {
                  d: TOP,
                  fill: "none",
                  stroke: unstyled ? "currentColor" : traceWorkflow.color,
                  strokeWidth: "3",
                  strokeLinejoin: "round",
                  transform: "translate(-5 -3) scale(1.06)"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("circle", { cx: "46", cy: "40", r: "2.2", fill: unstyled ? "currentColor" : outline }),
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("circle", { cx: "122", cy: "78", r: "2.2", fill: unstyled ? "currentColor" : outline })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "iso-stage__icon", "aria-hidden": "true", style: isoStyles.icon, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          FootprintIcon,
          {
            part: "stage-icon",
            name: icon,
            unstyled,
            defaultStyle: void 0,
            style: { display: "inline-flex", width: 22, height: 22 },
            children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(FallbackIcon, { name: icon, data })
          }
        ) }),
        steps.length > 0 && (active || done) && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "iso-stage__steps", "aria-hidden": "true", style: isoStyles.steps, children: steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "iso-stage__step", style: { ...isoStyles.step, ...badgePaint, ...!unstyled && isoPaint.step }, children: step }, `${index}:${step}`)) }),
        status && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "iso-stage__status", style: { ...isoStyles.status, ...badgePaint, ...!unstyled && isoPaint.status }, "aria-hidden": "true", children: status }),
        retries && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
          "span",
          {
            className: "iso-stage__retry",
            style: { ...isoStyles.retry, ...!unstyled && {
              ...isoPaint.step,
              color: theme.warning,
              background: theme.bgSecondary,
              border: `1px solid ${theme.warning}`,
              boxShadow: v("--fp-node-badge-shadow", "none")
            } },
            role: "img",
            "aria-label": retryLabel,
            title: retryLabel,
            children: [
              "\u21BB \xD7",
              retries
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "iso-stage__label", style: { ...isoStyles.label, ...!unstyled && { ...isoPaint.label, color: theme.textPrimary } }, "aria-hidden": "true", children: label }),
        traceWorkflow && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
          "span",
          {
            className: "iso-stage__trace",
            "data-fp": "trace-workflow-caption",
            title: `${role}${traceValues ? `: ${traceValues}` : ""}`,
            style: { ...isoStyles.trace, ...!unstyled && { ...isoPaint.trace, color: traceWorkflow.color, background: theme.bgSecondary, border: `1px solid ${traceWorkflow.color}`, fontFamily: theme.fontMono } },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("strong", { children: role }),
              traceValues && ` \xB7 ${traceValues}`
            ]
          }
        ),
        traceContext === "outside" && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          "span",
          {
            className: "iso-stage__trace",
            "data-fp": "trace-context-caption",
            style: { ...isoStyles.trace, ...!unstyled && { ...isoPaint.trace, color: theme.textSecondary, background: theme.bgSecondary, border: `1px solid ${theme.border}`, fontFamily: theme.fontMono } },
            children: "Outside displayed trace"
          }
        )
      ]
    }
  );
}

// src/components/IsometricFlow/IsometricEdge.tsx
var import_react28 = require("@xyflow/react");
var import_jsx_runtime16 = require("react/jsx-runtime");
function IsometricEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerStart,
  markerEnd,
  style,
  data,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  interactionWidth
}) {
  const unstyled = data?.unstyled === true;
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
    import_react28.BaseEdge,
    {
      id,
      path: `M${sourceX} ${sourceY}L${targetX} ${targetY}`,
      markerStart,
      markerEnd,
      interactionWidth,
      style: unstyled ? style : { stroke: theme.border, strokeWidth: 1.25, ...style },
      label,
      labelX: (sourceX + targetX) / 2,
      labelY: (sourceY + targetY) / 2,
      labelStyle: unstyled ? labelStyle : { fill: theme.textPrimary, fontFamily: theme.fontMono, fontSize: 10, ...labelStyle },
      labelShowBg,
      labelBgStyle: unstyled ? labelBgStyle : { fill: theme.bgSecondary, ...labelBgStyle },
      labelBgPadding,
      labelBgBorderRadius
    }
  );
}

// src/components/IsometricFlow/IsometricGrid.tsx
var import_react29 = require("react");
var import_react30 = require("@xyflow/react");
var import_jsx_runtime17 = require("react/jsx-runtime");
function IsometricGrid({ unstyled = false }) {
  const patternId = `isometric-floor-${(0, import_react29.useId)().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { x, y, zoom } = (0, import_react30.useViewport)();
  const width = (0, import_react30.useStore)((state) => state.width);
  const height = (0, import_react30.useStore)((state) => state.height);
  if (unstyled || ![x, y, zoom, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  const scale = Math.max(zoom, 0.01);
  const left = -x / scale - 64, top = -y / scale - 32;
  const worldWidth = width / scale + 128, worldHeight = height / scale + 64;
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(import_react30.ViewportPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(
    "svg",
    {
      "aria-hidden": "true",
      focusable: "false",
      className: "iso-floor",
      width: worldWidth,
      height: worldHeight,
      viewBox: `${left} ${top} ${worldWidth} ${worldHeight}`,
      style: { position: "absolute", left, top, width: worldWidth, height: worldHeight, pointerEvents: "none", zIndex: -1 },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("pattern", { id: patternId, width: "64", height: "32", patternUnits: "userSpaceOnUse", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M0 0 64 32M0 32 64 0", fill: "none", stroke: theme.border, strokeWidth: "0.7", opacity: "0.16" }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", { x: left, y: top, width: worldWidth, height: worldHeight, fill: `url(#${patternId})` })
      ]
    }
  ) });
}

// src/components/IsometricFlow/RendererContext.tsx
var import_react31 = require("react");
var import_jsx_runtime18 = require("react/jsx-runtime");
var RendererContext = (0, import_react31.createContext)("flat");
var DefaultStageNode = (0, import_react31.memo)(function DefaultStageNode2(props) {
  const renderer = (0, import_react31.useContext)(RendererContext);
  return renderer === "isometric" ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(IsometricStageNode, { ...props }) : /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(StageNode, { ...props, data: props.data });
});

// src/components/IsometricFlow/RendererGeometry.tsx
var import_react32 = require("react");
var import_react33 = require("@xyflow/react");
function RendererGeometry({ renderer, nodeIds }) {
  const updateNodeInternals = (0, import_react33.useUpdateNodeInternals)();
  const ids = JSON.stringify(nodeIds);
  const previous = (0, import_react32.useRef)(renderer);
  (0, import_react32.useEffect)(() => {
    const switched = previous.current !== renderer;
    previous.current = renderer;
    if (typeof window !== "undefined" && typeof window.DOMMatrixReadOnly === "function" && (switched || renderer === "isometric"))
      updateNodeInternals(JSON.parse(ids));
  }, [renderer, ids, updateNodeInternals]);
  return null;
}

// src/components/FlowchartView/_internal/isometricTraceLayout.ts
var ISOMETRIC_NODE_WIDTH = 168;
var ISOMETRIC_NODE_HEIGHT = 116;
var COS_30 = Math.sqrt(3) / 2;
var SIN_30 = 0.5;
var OUTER_PADDING = 32;
var CARD_GAP = 24;
function isContainer(node) {
  return node.type === GROUP_CONTAINER_NODE_TYPE || node.data.isGroupContainer === true;
}
function isStage(node) {
  return node.type === void 0 || node.type === "stage";
}
function dimension(value, fallback2) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback2;
}
function minimumCenterDistance(points) {
  if (points.length < 2) return Infinity;
  const byX = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const byY = byX.slice();
  const scratch = new Array(points.length);
  const squared = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  const visit = (from, to) => {
    if (to - from <= 3) {
      let best2 = Infinity;
      for (let i = from; i < to; i++) for (let j = i + 1; j < to; j++) best2 = Math.min(best2, squared(byX[i], byX[j]));
      const ordered = byX.slice(from, to).sort((a, b) => a.y - b.y || a.x - b.x);
      for (let i = 0; i < ordered.length; i++) byY[from + i] = ordered[i];
      return best2;
    }
    const middle = Math.floor((from + to) / 2);
    const middleX = byX[middle].x;
    let best = Math.min(visit(from, middle), visit(middle, to));
    let left = from, right = middle;
    for (let at2 = from; at2 < to; at2++) {
      scratch[at2] = right === to || left < middle && byY[left].y <= byY[right].y ? byY[left++] : byY[right++];
    }
    for (let at2 = from; at2 < to; at2++) byY[at2] = scratch[at2];
    let count2 = 0;
    for (let at2 = from; at2 < to; at2++) {
      if ((byY[at2].x - middleX) ** 2 < best) scratch[count2++] = byY[at2];
    }
    for (let i = 0; i < count2; i++) {
      for (let j = i + 1; j < count2 && j <= i + 7; j++) {
        if ((scratch[j].y - scratch[i].y) ** 2 >= best) break;
        best = Math.min(best, squared(scratch[i], scratch[j]));
      }
    }
    return best;
  };
  return Math.sqrt(visit(0, points.length));
}
function createIsometricTraceLayout(options = {}) {
  const fixedStageNodes = options.fixedStageNodes !== false;
  return (graph) => {
    if (graph.nodes.length === 0) return graph;
    const nodes = graph.nodes.map((node) => fixedStageNodes && isStage(node) && !isContainer(node) ? { ...node, style: { ...node.style, width: ISOMETRIC_NODE_WIDTH, height: ISOMETRIC_NODE_HEIGHT } } : node);
    const ids = new Set(nodes.map((node) => node.id));
    const outer = nodes.filter((node) => !node.parentId || !ids.has(node.parentId));
    if (!outer.length) return { ...graph, nodes };
    const footprints = /* @__PURE__ */ new Map();
    let maxWidth = 0, maxHeight = 0, hasContainers = false;
    for (const node of outer) {
      const container = isContainer(node);
      const fixed = fixedStageNodes && isStage(node) && !container;
      const styleWidth = dimension(node.style?.width, NaN);
      const styleHeight = dimension(node.style?.height, NaN);
      const resolved = fixed || container && Number.isFinite(styleWidth) && Number.isFinite(styleHeight) ? void 0 : options.nodeSize?.(node);
      const fallbackWidth = dimension(node.measured?.width, dimension(node.width, ISOMETRIC_NODE_WIDTH));
      const fallbackHeight = dimension(node.measured?.height, dimension(node.height, ISOMETRIC_NODE_HEIGHT));
      const width = container ? dimension(styleWidth, dimension(resolved?.width, fallbackWidth)) : fixed ? ISOMETRIC_NODE_WIDTH : dimension(resolved?.width, dimension(styleWidth, fallbackWidth));
      const height = container ? dimension(styleHeight, dimension(resolved?.height, fallbackHeight)) : fixed ? ISOMETRIC_NODE_HEIGHT : dimension(resolved?.height, dimension(styleHeight, fallbackHeight));
      footprints.set(node.id, { width, height });
      maxWidth = Math.max(maxWidth, width);
      maxHeight = Math.max(maxHeight, height);
      hasContainers || (hasContainers = container);
    }
    const outerIds = new Set(outer.map((node) => node.id));
    const layout = createDagreTraceLayout({
      direction: "LR",
      rankSep: Math.max(hasContainers ? 104 : 64, maxHeight * (hasContainers ? 0.75 : 0.4)),
      nodeSep: Math.max(hasContainers ? 112 : 84, maxWidth * (hasContainers ? 0.6 : 0.4)),
      edgeSep: 32
    });
    const positioned = layout({
      // These sizes are private layout inputs. Restore original custom styles
      // below so fallback dimensions cannot suppress xyflow measurement.
      nodes: outer.map(({ parentId: _parentId, ...node }) => ({
        ...node,
        style: { ...node.style, ...footprints.get(node.id) }
      })),
      edges: graph.edges.filter((edge) => outerIds.has(edge.source) && outerIds.has(edge.target))
    });
    const projected = positioned.nodes.map((node) => {
      const { width, height } = footprints.get(node.id);
      const x = node.position.x + width / 2, y = node.position.y + height / 2;
      return { id: node.id, width, height, x: COS_30 * (x - y), y: SIN_30 * (x + y) };
    });
    const distance2 = minimumCenterDistance(projected);
    const spread = distance2 > 0 ? Math.max(1, Math.hypot(maxWidth + CARD_GAP, maxHeight + CARD_GAP) / distance2) : 1;
    let minX = Infinity, minY = Infinity;
    for (const node of projected) {
      minX = Math.min(minX, node.x * spread - node.width / 2);
      minY = Math.min(minY, node.y * spread - node.height / 2);
    }
    const positions = new Map(projected.map((node) => [node.id, {
      x: node.x * spread - node.width / 2 - minX + OUTER_PADDING,
      y: node.y * spread - node.height / 2 - minY + OUTER_PADDING
    }]));
    return { ...graph, nodes: nodes.map((node) => positions.has(node.id) ? { ...node, position: positions.get(node.id) } : node), edges: graph.edges };
  };
}
var isometricTraceLayout = createIsometricTraceLayout();

// src/components/FlowchartView/_internal/MeasuredNodeSizes.tsx
var import_react34 = require("react");
var import_react35 = require("@xyflow/react");

// src/components/FlowchartView/_internal/measuredFootprints.ts
function extractMeasuredFootprints(entries) {
  const sizes = /* @__PURE__ */ new Map();
  for (const [id, node] of entries) {
    const width = node.measured?.width;
    const height = node.measured?.height;
    if (typeof width === "number" && typeof height === "number" && Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      const roundedWidth = Math.round(width), roundedHeight = Math.round(height);
      if (roundedWidth > 0 && roundedHeight > 0) {
        sizes.set(id, { width: roundedWidth, height: roundedHeight });
      }
    }
  }
  return sizes;
}
function readMeasuredFootprints(entries, includeHiddenNodes = false) {
  const relevant = [];
  let visibleCount = 0;
  for (const entry of entries) {
    if (!entry[1].hidden) visibleCount++;
    if (includeHiddenNodes || !entry[1].hidden) relevant.push(entry);
  }
  const sizes = extractMeasuredFootprints(relevant);
  const ready = visibleCount > 0 && sizes.size === relevant.length;
  for (const [id, node] of relevant) {
    if (node.data?.isGroupContainer === true) sizes.delete(id);
  }
  return { sizes, ready };
}
function sameFootprints(a, b) {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const [id, s] of a) {
    const t = b.get(id);
    if (!t || t.width !== s.width || t.height !== s.height) return false;
  }
  return true;
}

// src/components/FlowchartView/_internal/MeasuredNodeSizes.tsx
function MeasuredNodeSizes({
  onSizes,
  includeHiddenNodes = false
}) {
  const measurement = (0, import_react35.useStore)(
    (s) => readMeasuredFootprints(s.nodeLookup, includeHiddenNodes),
    (previous, next) => previous.ready === next.ready && sameFootprints(previous.sizes, next.sizes)
  );
  const lastPublished = (0, import_react34.useRef)(null);
  (0, import_react34.useEffect)(() => {
    if (!measurement.ready) return;
    const previous = lastPublished.current;
    if (previous?.onSizes === onSizes && sameFootprints(previous.sizes, measurement.sizes)) return;
    lastPublished.current = { onSizes, sizes: measurement.sizes };
    onSizes(measurement.sizes);
  }, [measurement, onSizes]);
  return null;
}

// src/components/FlowchartView/RecordedReadEdge.tsx
var import_react36 = require("@xyflow/react");

// src/components/FlowchartView/_internal/recordedReadGeometry.ts
var RECORDED_READ_LABEL_WIDTH = 220;
var RECORDED_READ_LABEL_HEIGHT = 20;
function recordedReadGeometry(nodes, source, target, lane) {
  const from = nodes.get(source), to = nodes.get(target);
  if (!from || !to || from.hidden || to.hidden || !Number.isSafeInteger(lane) || lane < 0) return null;
  const sx = from.internals.positionAbsolute.x, tx = to.internals.positionAbsolute.x;
  const fromY = from.internals.positionAbsolute.y, toY = to.internals.positionAbsolute.y;
  const fromHeight = from.measured?.height, toHeight = to.measured?.height;
  if (![sx, tx, fromY, toY].every(Number.isFinite) || !positiveFinite(fromHeight) || !positiveFinite(toHeight)) return null;
  let left = Math.min(sx, tx);
  for (const node of nodes.values()) {
    if (node.hidden || node.type === GROUP_CONTAINER_NODE_TYPE) continue;
    const x2 = node.internals.positionAbsolute.x;
    if (Number.isFinite(x2)) left = Math.min(left, x2);
  }
  const sy = fromY + fromHeight / 2, ty = toY + toHeight / 2;
  const x = left - 36 - lane % 6 * 18;
  const label = {
    x: x - RECORDED_READ_LABEL_WIDTH / 2,
    y: (sy + ty) / 2 - RECORDED_READ_LABEL_HEIGHT / 2,
    width: RECORDED_READ_LABEL_WIDTH,
    height: RECORDED_READ_LABEL_HEIGHT
  };
  const minX = Math.min(x - 8, label.x), maxX = Math.max(sx, tx, label.x + label.width) + 8;
  const minY = Math.min(sy, ty, label.y) - 8, maxY = Math.max(sy, ty, label.y + label.height) + 8;
  return {
    path: `M ${sx} ${sy} C ${x} ${sy}, ${x} ${ty}, ${tx} ${ty}`,
    label,
    bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  };
}

// src/components/FlowchartView/RecordedReadEdge.tsx
var import_jsx_runtime19 = require("react/jsx-runtime");
function RecordedReadEdge({ id, source, target, markerEnd, style, data }) {
  const lane = typeof data?.lane === "number" ? data.lane : 0;
  const unstyled = data?.unstyled === true;
  const ui = componentStyles();
  const geometry = (0, import_react36.useStore)((state) => {
    const route = recordedReadGeometry(state.nodeLookup, source, target, lane);
    return route ? JSON.stringify(route) : "";
  });
  if (!geometry) return null;
  const { path, label: box2 } = JSON.parse(geometry);
  const key = typeof data?.key === "string" ? data.key : "";
  const pathLabel = recordedPathLabel(key);
  const label = `${pathLabel.length > 36 ? `${pathLabel.slice(0, 35)}\u2026` : pathLabel} \xB7 recorded read`;
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(import_jsx_runtime19.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
      "g",
      {
        "data-fp": "trace-workflow-read",
        role: "img",
        "aria-label": `Recorded read ${pathLabel} from ${String(data?.sourceRuntimeStageId)} to ${String(data?.targetRuntimeStageId)}`,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("title", { children: `Recorded stage read: ${pathLabel}. ${String(data?.sourceRuntimeStageId)} \u2192 ${String(data?.targetRuntimeStageId)}` }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            import_react36.BaseEdge,
            {
              id,
              path,
              markerEnd,
              interactionWidth: 0,
              style: unstyled ? style : { strokeDasharray: "6 4", animation: "none", transition: "none", ...style }
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_react36.EdgeLabelRenderer, { children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
      "span",
      {
        "data-fp": "trace-workflow-read-label",
        "aria-hidden": "true",
        style: {
          position: "absolute",
          transform: `translate(-50%, -50%) translate(${box2.x + box2.width / 2}px,${box2.y + box2.height / 2}px)`,
          width: "max-content",
          maxWidth: box2.width,
          height: box2.height,
          boxSizing: "border-box",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          ...!unstyled && {
            padding: `calc(${ui.spaceXs} - 1px) calc(${ui.spaceXs} + 1px)`,
            borderRadius: `calc(${ui.radiusControl} - 2px)`,
            fontFamily: theme.fontSans,
            fontSize: ui.small,
            lineHeight: "14px",
            fontWeight: `calc(${ui.weightStrong} - 100)`,
            color: style?.stroke,
            background: theme.bgPrimary,
            opacity: 0.96
          }
        },
        children: label
      }
    ) })
  ] });
}

// src/components/FlowchartView/TraceFlow.tsx
var import_jsx_runtime20 = require("react/jsx-runtime");
var Y_STEP = 100;
var X_SPREAD = 200;
var defaultTraceFlowLayout = (graph) => {
  if (graph.nodes.length === 0) return { nodes: [], edges: graph.edges };
  const branchChildrenOf = /* @__PURE__ */ new Map();
  const nextChildrenOf = /* @__PURE__ */ new Map();
  const hasIncomingForward = /* @__PURE__ */ new Set();
  for (const e of graph.edges) {
    const kind = e.data?.kind;
    if (kind === "loop") continue;
    hasIncomingForward.add(e.target);
    if (kind === "fork-branch" || kind === "decision-branch") {
      const arr = branchChildrenOf.get(e.source) ?? [];
      arr.push(e.target);
      branchChildrenOf.set(e.source, arr);
    } else {
      const arr = nextChildrenOf.get(e.source) ?? [];
      arr.push(e.target);
      nextChildrenOf.set(e.source, arr);
    }
  }
  const seed = graph.nodes.find((n) => !hasIncomingForward.has(n.id)) ?? graph.nodes[0];
  const positions = /* @__PURE__ */ new Map();
  function layoutSubtree(nodeId, x, y) {
    if (positions.has(nodeId)) {
      return positions.get(nodeId).y;
    }
    positions.set(nodeId, { x, y });
    let deepestBranchY = y;
    const branches = branchChildrenOf.get(nodeId) ?? [];
    if (branches.length > 0) {
      const childY = y + Y_STEP;
      const totalWidth = (branches.length - 1) * X_SPREAD;
      const startX = x - totalWidth / 2;
      for (let i = 0; i < branches.length; i++) {
        const childId = branches[i];
        const childX = startX + i * X_SPREAD;
        const subtreeBottom = layoutSubtree(childId, childX, childY);
        if (subtreeBottom > deepestBranchY) deepestBranchY = subtreeBottom;
      }
    }
    const nextChildren = nextChildrenOf.get(nodeId) ?? [];
    if (nextChildren.length > 0) {
      const nextY = branches.length > 0 ? deepestBranchY + Y_STEP : y + Y_STEP;
      const totalWidth = (nextChildren.length - 1) * X_SPREAD;
      const startX = x - totalWidth / 2;
      let deepestNextY = nextY;
      for (let i = 0; i < nextChildren.length; i++) {
        const childId = nextChildren[i];
        const childX = startX + i * X_SPREAD;
        const subtreeBottom = layoutSubtree(childId, childX, nextY);
        if (subtreeBottom > deepestNextY) deepestNextY = subtreeBottom;
      }
      return deepestNextY;
    }
    return deepestBranchY;
  }
  layoutSubtree(seed.id, 0, 0);
  let maxY = 0;
  for (const p of positions.values()) {
    if (p.y > maxY) maxY = p.y;
  }
  let orphanY = maxY + Y_STEP;
  for (const n of graph.nodes) {
    if (!positions.has(n.id)) {
      positions.set(n.id, { x: 0, y: orphanY });
      orphanY += Y_STEP;
    }
  }
  return {
    nodes: graph.nodes.map((n) => ({
      ...n,
      position: positions.get(n.id) ?? n.position
    })),
    edges: graph.edges
  };
};
var DEFAULT_EDGE_COLORS = {
  next: rawDefaults.colors.textMuted,
  forkBranch: rawDefaults.colors.textMuted,
  decisionBranch: rawDefaults.colors.primary,
  loop: rawDefaults.colors.warning
};
function styleEdge(edge, colors, renderer, unstyled) {
  const kind = edge.data?.kind ?? "next";
  const color = kind === "loop" ? colors.loop : kind === "fork-branch" ? colors.forkBranch : kind === "decision-branch" ? colors.decisionBranch : colors.next;
  const styled = {
    ...edge,
    // Loop back-edges use the custom `loopBack` edge — a curve routed along the
    // right margin (clear of the spine) instead of a straight/step center line.
    // Every other edge uses `smartStep`: a smoothstep superset that routes a
    // RANK-SKIPPING edge around the node it skips (else identical to smoothstep).
    type: edge.type ?? (kind === "loop" ? "loopBack" : renderer === "isometric" ? "isometric" : "smartStep"),
    animated: edge.animated ?? false,
    style: { ...!unstyled && { stroke: color, strokeWidth: 1.5, ...kind === "loop" && { strokeDasharray: "4 3" } }, ...edge.style },
    markerEnd: edge.markerEnd !== void 0 ? edge.markerEnd : unstyled ? void 0 : { type: import_react38.MarkerType.ArrowClosed, color: typeof edge.style?.stroke === "string" ? edge.style.stroke : color, width: 16, height: 16 },
    ...unstyled && { data: { ...edge.data, unstyled: true } }
  };
  return styled;
}
var DEFAULT_NODE_TYPES = { stageNode: DefaultStageNode, groupContainer: GroupContainerNode };
var DEFAULT_EDGE_TYPES = { loopBack: LoopBackEdge, smartStep: SmartStepEdge, recordedRead: RecordedReadEdge, isometric: IsometricEdge };
function toStageNode(node) {
  if (node.type !== void 0 && node.type !== "stage") {
    return node;
  }
  const data = node.data;
  const stageData = {
    // Pass the source data through WHOLE. An allow-list here dropped every
    // field it did not name: the consumer's OWN custom fields (which the
    // `nodeTypes` extension contract promises a swapped-in renderer can read
    // off `data`) and the recorder's own metadata the bundled renderer
    // happens not to use — isStreaming, isPausable, branchIds, defaultBranch,
    // prevIds, nextIds, subflowOf. A renderer cannot read what never arrived.
    ...data,
    // Then the fields this function OWNS. Run status is blank here by design
    // — `<TraceFlow>` is the structure-only chart; `<TracedFlow>` is the one
    // that paints an overlay — so these must win over anything the source
    // data carried.
    label: data.label,
    isDecider: data.isDecider,
    isFork: data.isFork,
    isSubflow: data.isSubflow,
    active: false,
    done: false,
    error: false
  };
  return {
    ...node,
    type: "stageNode",
    data: stageData
  };
}
var EMPTY_GRAPH = { nodes: [], edges: [] };
function subscribeToRecorder(recorder) {
  return (listener) => {
    if (!recorder) return () => {
    };
    return recorder.subscribe(listener);
  };
}
function getRecorderVersion(recorder) {
  return () => {
    if (!recorder) return 0;
    return recorder.version();
  };
}
function TraceFlow(props) {
  const proc = globalThis.process;
  const isDev = proc?.env?.NODE_ENV !== "production";
  if (isDev && !props.recorder && !props.graph) {
    console.warn(
      "[TraceFlow] neither `recorder` nor `graph` prop was provided \u2014 rendering an empty chart. Pass one of: <TraceFlow recorder={handle} /> OR <TraceFlow graph={{nodes, edges}} />."
    );
  }
  const renderer = resolveFlowchartRenderer(props.renderer);
  const [measurement, setMeasurement] = (0, import_react37.useState)(null);
  const measuredSizes = measurement?.renderer === renderer ? measurement.sizes : null;
  const acceptMeasurements = (0, import_react37.useCallback)((sizes) => setMeasurement({ renderer, sizes }), [renderer]);
  const fixedStageNodes = !props.nodeTypes?.stageNode;
  const isometricLayout = (0, import_react37.useMemo)(() => createIsometricTraceLayout({
    nodeSize: measuredSizes ? (node) => measuredSizes.get(node.id) : void 0,
    fixedStageNodes
  }), [measuredSizes, fixedStageNodes]);
  const layout = props.layout ?? (renderer === "isometric" ? isometricLayout : dagreTraceLayout);
  const edgeColors = (0, import_react37.useMemo)(
    () => ({ ...DEFAULT_EDGE_COLORS, ...props.edgeColors ?? {} }),
    [props.edgeColors]
  );
  const subscribe = (0, import_react37.useMemo)(
    () => subscribeToRecorder(props.recorder),
    [props.recorder]
  );
  const getVersion = (0, import_react37.useMemo)(
    () => getRecorderVersion(props.recorder),
    [props.recorder]
  );
  const version = (0, import_react37.useSyncExternalStore)(subscribe, getVersion, getVersion);
  const { recorder, graph: graphProp } = props;
  const graph = (0, import_react37.useMemo)(() => {
    if (recorder) return recorder.getGraph();
    if (graphProp) return graphProp;
    return EMPTY_GRAPH;
  }, [recorder, graphProp, version]);
  const positioned = (0, import_react37.useMemo)(() => {
    if (layout === "passthrough") return graph;
    return layout(graph);
  }, [graph, layout]);
  const reactFlowNodes = (0, import_react37.useMemo)(
    () => positioned.nodes.map((source) => {
      const node = toStageNode(source);
      return props.unstyled ? { ...node, data: { ...node.data, unstyled: true } } : node;
    }),
    [positioned.nodes, props.unstyled]
  );
  const reactFlowEdges = (0, import_react37.useMemo)(
    () => positioned.edges.map((e) => styleEdge(e, edgeColors, renderer, !!props.unstyled)),
    [positioned.edges, edgeColors, renderer, props.unstyled]
  );
  const onNodeClickRef = props.onNodeClick;
  const handleNodeClick = (0, import_react37.useCallback)(
    (_, node) => {
      onNodeClickRef?.(node.id);
    },
    [onNodeClickRef]
  );
  const { nodeTypes: userNodeTypes, edgeTypes: userEdgeTypes } = props;
  const mergedNodeTypes = (0, import_react37.useMemo)(
    () => userNodeTypes ? { ...DEFAULT_NODE_TYPES, ...userNodeTypes } : DEFAULT_NODE_TYPES,
    [userNodeTypes]
  );
  const mergedEdgeTypes = (0, import_react37.useMemo)(
    () => userEdgeTypes ? { ...DEFAULT_EDGE_TYPES, ...userEdgeTypes } : DEFAULT_EDGE_TYPES,
    [userEdgeTypes]
  );
  const wrapperRef = (0, import_react37.useRef)(null);
  const geometryKey = chartLayoutKey(positioned.nodes);
  const refitKey = renderer === "isometric" ? JSON.stringify([renderer, geometryKey]) : geometryKey;
  return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
    "div",
    {
      ref: wrapperRef,
      "data-fp": "trace-flow",
      "data-fp-renderer": renderer,
      "data-unstyled": props.unstyled || void 0,
      className: props.className,
      style: {
        width: "100%",
        height: "100%",
        minHeight: 300,
        ...props.style
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(RendererContext.Provider, { value: renderer, children: /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(
        import_react38.ReactFlow,
        {
          nodes: reactFlowNodes,
          edges: reactFlowEdges,
          nodeTypes: mergedNodeTypes,
          edgeTypes: mergedEdgeTypes,
          onNodeClick: handleNodeClick,
          proOptions: { hideAttribution: true },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(ChartAutoRefit, { wrapperRef, refitKey }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(RendererGeometry, { renderer, nodeIds: positioned.nodes.map((node) => node.id) }),
            renderer === "isometric" && props.layout === void 0 && /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(MeasuredNodeSizes, { onSizes: acceptMeasurements }),
            !props.unstyled && (renderer === "isometric" ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(IsometricGrid, {}) : /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_react38.Background, { variant: import_react38.BackgroundVariant.Dots, gap: 20, size: 1 })),
            props.children
          ]
        }
      ) })
    }
  );
}

// src/components/FlowchartView/TracedFlow.tsx
var import_react42 = require("react");
var import_react43 = require("@xyflow/react");

// src/components/FlowchartView/_internal/snapLinearSuccessors.ts
function snapLinearSuccessors(graph, options = {}) {
  if (graph.nodes.length === 0) return graph;
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W2;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H2;
  const byId = /* @__PURE__ */ new Map();
  const width = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) {
    byId.set(n.id, n);
    width.set(n.id, sizeOf(n, fallbackW, fallbackH, options.nodeSize).width);
  }
  const preds = /* @__PURE__ */ new Map();
  const outDegree = /* @__PURE__ */ new Map();
  const seenEdge = /* @__PURE__ */ new Set();
  for (const e of graph.edges) {
    if (e.data?.kind === "loop") continue;
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    const key = `${e.source}\0${e.target}`;
    if (seenEdge.has(key)) continue;
    seenEdge.add(key);
    const list2 = preds.get(e.target);
    if (list2) list2.push(e.source);
    else preds.set(e.target, [e.source]);
    outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + 1);
  }
  const workingX = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) workingX.set(n.id, n.position.x);
  const centerX = (id) => workingX.get(id) + width.get(id) / 2;
  const order = [...graph.nodes].sort(
    (a, b) => a.position.y - b.position.y || a.position.x - b.position.x || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
  for (const n of order) {
    const p = preds.get(n.id);
    if (!p || p.length !== 1) continue;
    const pid = p[0];
    if ((outDegree.get(pid) ?? 0) !== 1) continue;
    const P = byId.get(pid);
    if ((n.parentId ?? void 0) !== (P.parentId ?? void 0)) continue;
    workingX.set(n.id, centerX(pid) - width.get(n.id) / 2);
  }
  const nodes = graph.nodes.map((n) => {
    const nx = workingX.get(n.id);
    return nx === n.position.x ? n : { ...n, position: { x: nx, y: n.position.y } };
  });
  return { nodes, edges: graph.edges };
}
function createSnappedDagreLayout(base, options = {}) {
  return (graph) => snapLinearSuccessors(base(graph), options);
}

// src/components/FlowchartView/_internal/centerForkParents.ts
function centerForkParents(graph, options = {}) {
  if (graph.nodes.length === 0) return graph;
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W2;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H2;
  const byId = /* @__PURE__ */ new Map();
  const width = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) {
    byId.set(n.id, n);
    width.set(n.id, sizeOf(n, fallbackW, fallbackH, options.nodeSize).width);
  }
  const childrenOf = /* @__PURE__ */ new Map();
  const predsOf = /* @__PURE__ */ new Map();
  const outDegree = /* @__PURE__ */ new Map();
  const inDegree = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set();
  for (const e of graph.edges) {
    if (e.data?.kind === "loop") continue;
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    const key = `${e.source} ${e.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const cl = childrenOf.get(e.source);
    if (cl) cl.push(e.target);
    else childrenOf.set(e.source, [e.target]);
    const pl = predsOf.get(e.target);
    if (pl) pl.push(e.source);
    else predsOf.set(e.target, [e.source]);
    outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + 1);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }
  const workingX = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) workingX.set(n.id, n.position.x);
  const centerX = (id) => workingX.get(id) + width.get(id) / 2;
  const nodeSep = options.nodeSep ?? 60;
  const clampX = (id, desiredX) => {
    const w = width.get(id);
    const x0 = workingX.get(id);
    const self = byId.get(id);
    let minX = -Infinity;
    let maxX = Infinity;
    for (const m of graph.nodes) {
      if (m.id === id || m.parentId !== self.parentId) continue;
      if (Math.abs(m.position.y - self.position.y) > 1) continue;
      const mLeft = workingX.get(m.id);
      const mRight = mLeft + width.get(m.id);
      if (mRight <= x0) minX = Math.max(minX, mRight + nodeSep);
      else if (mLeft >= x0 + w) maxX = Math.min(maxX, mLeft - nodeSep - w);
    }
    return minX <= maxX ? Math.max(minX, Math.min(maxX, desiredX)) : x0;
  };
  const evenFanKids = (forkCenter, kids) => {
    if (kids.length < 2) return;
    const sorted = [...kids].sort((a, b) => centerX(a) - centerX(b));
    let gap = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      gap = Math.max(gap, width.get(sorted[i]) / 2 + nodeSep + width.get(sorted[i + 1]) / 2);
    }
    const mid = (sorted.length - 1) / 2;
    for (let i = 0; i < sorted.length; i++) {
      workingX.set(sorted[i], forkCenter + (i - mid) * gap - width.get(sorted[i]) / 2);
    }
  };
  const order = [...graph.nodes].sort(
    (a, b) => b.position.y - a.position.y || a.position.x - b.position.x || a.id.localeCompare(b.id)
  );
  for (const n of order) {
    const outD = outDegree.get(n.id) ?? 0;
    const inD = inDegree.get(n.id) ?? 0;
    const isFork = outD >= 2 && inD <= 1;
    const isMerge = inD >= 2 && outD <= 1;
    if (!isFork && !isMerge) continue;
    const kin = ((isFork ? childrenOf.get(n.id) : predsOf.get(n.id)) ?? []).filter(
      (k) => byId.get(k)?.parentId === n.parentId
      // same compound only
    );
    if (kin.length < 2) continue;
    const centers = kin.map(centerX);
    const wN = width.get(n.id);
    const span = (Math.min(...centers) + Math.max(...centers)) / 2;
    workingX.set(n.id, clampX(n.id, span - wN / 2));
    if (isFork) {
      const succSets = kin.map((k) => childrenOf.get(k) ?? []);
      const isDiamond = kin.length >= 2 && succSets[0].some((s) => succSets.every((ss) => ss.includes(s)));
      if (isDiamond) evenFanKids(centerX(n.id), kin);
    }
    const stepOf = isFork ? predsOf : childrenOf;
    let curId = n.id;
    const walked = /* @__PURE__ */ new Set([curId]);
    for (; ; ) {
      const nexts = stepOf.get(curId);
      if (!nexts || nexts.length !== 1) break;
      const m = nexts[0];
      if (walked.has(m)) break;
      if ((outDegree.get(m) ?? 0) > 1) break;
      if ((inDegree.get(m) ?? 0) > 1) break;
      if (byId.get(m)?.parentId !== byId.get(curId)?.parentId) break;
      workingX.set(m, clampX(m, centerX(curId) - width.get(m) / 2));
      walked.add(m);
      curId = m;
    }
  }
  for (const n of order) {
    const outD = outDegree.get(n.id) ?? 0;
    const inD = inDegree.get(n.id) ?? 0;
    if (!(outD >= 2 && inD <= 1)) continue;
    const kids = (childrenOf.get(n.id) ?? []).filter(
      (k) => byId.get(k)?.parentId === n.parentId
    );
    if (kids.length < 2) continue;
    const succSets = kids.map((k) => childrenOf.get(k) ?? []);
    const isDiamond = succSets[0].some((s) => succSets.every((ss) => ss.includes(s)));
    if (isDiamond) continue;
    const ps = predsOf.get(n.id);
    if (!ps || ps.length !== 1) continue;
    const pred = ps[0];
    if ((outDegree.get(pred) ?? 0) !== 1) continue;
    if (byId.get(pred)?.parentId !== byId.get(n.id)?.parentId) continue;
    const before = centerX(n.id);
    workingX.set(n.id, clampX(n.id, centerX(pred) - width.get(n.id) / 2));
    const delta = centerX(n.id) - before;
    if (delta === 0) continue;
    for (const k of kids) workingX.set(k, clampX(k, workingX.get(k) + delta));
  }
  const nodes = graph.nodes.map(
    (n) => workingX.get(n.id) === n.position.x ? n : { ...n, position: { x: workingX.get(n.id), y: n.position.y } }
  );
  return { nodes, edges: graph.edges };
}
function withForkCentering(base, options = {}) {
  return (graph) => centerForkParents(base(graph), options);
}

// src/components/FlowchartView/_internal/notifyChange.ts
function createNotifier(label = "notifier") {
  const listeners = /* @__PURE__ */ new Set();
  let v2 = 0;
  let pending = false;
  function flush() {
    if (!pending) return;
    pending = false;
    const snapshot = Array.from(listeners);
    for (const l of snapshot) {
      try {
        l();
      } catch (err) {
        devWarn(
          () => `[${label}] subscribe() listener threw \u2014 isolated; other subscribers continue.`,
          err
        );
      }
    }
  }
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    version() {
      return v2;
    },
    notify() {
      v2 += 1;
      if (pending) return;
      pending = true;
      queueMicrotask(flush);
    },
    flushPending() {
      flush();
    }
  };
}

// src/components/FlowchartView/createTraceRuntimeOverlay.ts
function parseStageIdFromRuntimeStageId(runtimeStageId) {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}
function createTraceRuntimeOverlay(options = {}) {
  const id = options.id ?? "trace-runtime-overlay";
  const startTime = performance.now();
  let executionOrder = [];
  const recordedRuntimeStageIds = /* @__PURE__ */ new Set();
  const errors = /* @__PURE__ */ new Map();
  const retryAttempts = /* @__PURE__ */ new Map();
  let running = false;
  const notifier = createNotifier("traceRuntimeOverlay");
  const notifyChange = notifier.notify;
  function pushStep(runtimeStageId, stageId, stageName) {
    if (recordedRuntimeStageIds.has(runtimeStageId)) return;
    recordedRuntimeStageIds.add(runtimeStageId);
    executionOrder.push({
      runtimeStageId,
      stageId,
      stageName,
      timestampMs: performance.now() - startTime
    });
    notifyChange();
  }
  const recorder = {
    id,
    onRunStart() {
      running = true;
      notifyChange();
    },
    onRunEnd() {
      running = false;
      notifyChange();
    },
    onStageExecuted(event) {
      const runtimeStageId = event.traversalContext.runtimeStageId;
      const baseStageId = parseStageIdFromRuntimeStageId(runtimeStageId);
      pushStep(runtimeStageId, baseStageId, event.stageName);
    },
    onStageRetry(event) {
      const runtimeStageId = event.traversalContext?.runtimeStageId;
      if (!runtimeStageId) return;
      const attempt = event.attempt;
      const attemptsMade = typeof attempt === "number" && Number.isFinite(attempt) && attempt >= 1 ? Math.floor(attempt) + 1 : (retryAttempts.get(runtimeStageId) ?? 1) + 1;
      const known = retryAttempts.get(runtimeStageId) ?? 1;
      if (attemptsMade > known) {
        retryAttempts.set(runtimeStageId, attemptsMade);
        notifyChange();
      }
    },
    onError(event) {
      const fallbackId = event.stageId ?? (event.traversalContext ? parseStageIdFromRuntimeStageId(event.traversalContext.runtimeStageId) : event.stageName);
      errors.set(fallbackId, event.message ?? "error");
      notifyChange();
    }
  };
  return {
    recorder,
    getOverlay() {
      return {
        executionOrder: executionOrder.map((s) => ({ ...s })),
        errors: new Map(errors),
        running,
        retryAttempts: new Map(retryAttempts)
      };
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset() {
      executionOrder = [];
      recordedRuntimeStageIds.clear();
      errors.clear();
      retryAttempts.clear();
      running = false;
    },
    seed(overlay) {
      executionOrder = overlay.executionOrder.map((s) => ({ ...s }));
      recordedRuntimeStageIds.clear();
      for (const step of executionOrder) recordedRuntimeStageIds.add(step.runtimeStageId);
      errors.clear();
      for (const [stageId, message] of overlay.errors) errors.set(stageId, message);
      retryAttempts.clear();
      if (overlay.retryAttempts) {
        for (const [rsid, attempts] of overlay.retryAttempts) retryAttempts.set(rsid, attempts);
      }
      running = overlay.running;
      notifyChange();
    }
  };
}
function sliceOverlay(overlay, index) {
  const order = overlay.executionOrder;
  if (order.length === 0) {
    return {
      doneStageIds: /* @__PURE__ */ new Set(),
      activeStageId: null,
      executedStageIds: /* @__PURE__ */ new Set(),
      executedOrderIds: [],
      errors: overlay.errors,
      retryAttempts: projectRetryAttempts(overlay, -1)
    };
  }
  if (index >= order.length) {
    const allDone = new Set(order.map((s) => s.stageId));
    return {
      doneStageIds: allDone,
      activeStageId: null,
      executedStageIds: new Set(allDone),
      executedOrderIds: order.map((s) => s.stageId),
      errors: overlay.errors,
      retryAttempts: projectRetryAttempts(overlay, order.length - 1)
    };
  }
  const clampedIndex = Math.max(0, Math.min(index, order.length - 1));
  const doneStageIds = /* @__PURE__ */ new Set();
  for (let i = 0; i < clampedIndex; i++) {
    doneStageIds.add(order[i].stageId);
  }
  const activeStep = order[clampedIndex];
  const activeStageId = activeStep ? activeStep.stageId : null;
  const executedStageIds = new Set(doneStageIds);
  if (activeStageId) executedStageIds.add(activeStageId);
  const executedOrderIds = order.slice(0, clampedIndex + 1).map((s) => s.stageId);
  return {
    doneStageIds,
    activeStageId,
    executedStageIds,
    executedOrderIds,
    errors: overlay.errors,
    retryAttempts: projectRetryAttempts(overlay, clampedIndex)
  };
}
var NO_RETRIES = /* @__PURE__ */ new Map();
function projectRetryAttempts(overlay, upToIndex) {
  const source = overlay.retryAttempts;
  if (!source || source.size === 0) return NO_RETRIES;
  const order = overlay.executionOrder;
  const out = /* @__PURE__ */ new Map();
  for (let i = 0; i <= upToIndex && i < order.length; i++) {
    const step = order[i];
    const attempts = source.get(step.runtimeStageId);
    if (attempts !== void 0 && attempts > 1) out.set(step.stageId, attempts);
  }
  const stepped = new Set(order.map((s) => s.runtimeStageId));
  for (const [runtimeStageId, attempts] of source) {
    if (attempts > 1 && !stepped.has(runtimeStageId)) {
      out.set(parseStageIdFromRuntimeStageId(runtimeStageId), attempts);
    }
  }
  return out;
}

// src/components/FlowchartView/_internal/subflowDrill.ts
function findMountNode(graph, drillKey) {
  return graph.nodes.find((n) => n.id === drillKey && n.data?.isSubflow === true) ?? graph.nodes.find((n) => n.data?.isSubflow === true && n.data?.subflowId === drillKey);
}
function resolveDrillScope(graph, drillKey) {
  for (const n of graph.nodes) {
    if (n.data?.subflowOf === drillKey) return drillKey;
  }
  const local = graph.nodes.find((n) => n.id === drillKey)?.data?.subflowId;
  if (typeof local === "string" && local !== drillKey) {
    for (const n of graph.nodes) {
      if (n.data?.subflowOf === local) return local;
    }
  }
  const mount = graph.nodes.find(
    (n) => n.data?.isSubflow === true && n.data?.subflowId === drillKey
  );
  if (mount !== void 0 && mount.id !== drillKey) {
    for (const n of graph.nodes) {
      if (n.data?.subflowOf === mount.id) return mount.id;
    }
  }
  return drillKey;
}
function filterGraphForDrill(graph, currentSubflowId) {
  if (graph.nodes.length === 0) return graph;
  const scope = currentSubflowId === null ? null : resolveDrillScope(graph, currentSubflowId);
  const matchesScope = (subflowOf) => scope === null ? subflowOf === void 0 : subflowOf === scope;
  const visibleIds = /* @__PURE__ */ new Set();
  for (const n of graph.nodes) {
    if (matchesScope(n.data?.subflowOf)) visibleIds.add(n.id);
  }
  if (visibleIds.size === graph.nodes.length) return graph;
  return {
    nodes: graph.nodes.filter((n) => visibleIds.has(n.id)),
    edges: graph.edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
  };
}
function buildSubflowBreadcrumb(graph, currentSubflowId) {
  const trail = [];
  const seen = /* @__PURE__ */ new Set();
  let key = currentSubflowId ?? void 0;
  while (key !== void 0 && !seen.has(key)) {
    seen.add(key);
    const mount = findMountNode(graph, key);
    if (mount === void 0) {
      trail.unshift({ subflowId: key, label: key });
      break;
    }
    trail.unshift({ subflowId: mount.id, label: mount.data?.label ?? mount.id });
    key = mount.data?.subflowOf;
  }
  return [{ subflowId: null, label: "Chart" }, ...trail];
}

// src/components/FlowchartView/_internal/collapseGraph.ts
function scopesOf(node) {
  const local = node.data?.subflowId;
  return typeof local === "string" && local !== node.id ? [node.id, local] : [node.id];
}
function collapseTraceGraph(graph, hide) {
  const hiddenNodeIds = [];
  const removed = /* @__PURE__ */ new Set();
  const removedScopes = /* @__PURE__ */ new Set();
  for (const node of graph.nodes) {
    if (!hide(node)) continue;
    hiddenNodeIds.push(node.id);
    removed.add(node.id);
    for (const scope of scopesOf(node)) removedScopes.add(scope);
  }
  if (hiddenNodeIds.length === 0) return { graph, hiddenNodeIds };
  let grew = true;
  while (grew) {
    grew = false;
    for (const node of graph.nodes) {
      if (removed.has(node.id)) continue;
      const parent = node.data?.subflowOf;
      if (parent !== void 0 && removedScopes.has(parent)) {
        removed.add(node.id);
        for (const scope of scopesOf(node)) removedScopes.add(scope);
        grew = true;
      }
    }
  }
  const viaOf = (e) => Array.isArray(e.data?.via) ? e.data.via : [];
  let edges = [...graph.edges];
  for (const hiddenId of removed) {
    const incoming = edges.filter((e) => e.target === hiddenId && e.source !== hiddenId);
    const outgoing = edges.filter((e) => e.source === hiddenId && e.target !== hiddenId);
    edges = edges.filter((e) => e.source !== hiddenId && e.target !== hiddenId);
    for (const inEdge of incoming) {
      for (const outEdge of outgoing) {
        if (inEdge.source === outEdge.target) continue;
        const kind = inEdge.data?.kind === "loop" || outEdge.data?.kind === "loop" ? "loop" : outEdge.data?.kind ?? inEdge.data?.kind ?? "next";
        const via = [.../* @__PURE__ */ new Set([...viaOf(inEdge), hiddenId, ...viaOf(outEdge)])];
        edges.push({
          id: `${inEdge.source}->${outEdge.target}~collapsed`,
          source: inEdge.source,
          target: outEdge.target,
          data: { kind, via }
        });
      }
    }
  }
  const byEndpoints = /* @__PURE__ */ new Map();
  for (const e of edges) {
    const key = `${e.source}\0${e.target}`;
    const kept = byEndpoints.get(key);
    if (kept === void 0) {
      byEndpoints.set(key, e);
      continue;
    }
    const mergedVia = [.../* @__PURE__ */ new Set([...viaOf(kept), ...viaOf(e)])];
    if (mergedVia.length > viaOf(kept).length) {
      byEndpoints.set(key, {
        ...kept,
        data: { ...kept.data ?? { kind: "next" }, via: mergedVia }
      });
    }
  }
  const dedupedEdges = [...byEndpoints.values()];
  return {
    graph: {
      nodes: graph.nodes.filter((n) => !removed.has(n.id)),
      edges: dedupedEdges
    },
    hiddenNodeIds
  };
}

// src/components/FlowchartView/_internal/overlayProjection.ts
function aggregateMountStatus(slice, graph, currentSubflowId) {
  if (graph.nodes.length === 0) return slice;
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const mounts = graph.nodes.filter((n) => n.data?.isSubflow && n.data?.subflowId);
  const doneIds = new Set(slice.doneStageIds);
  let activeId = slice.activeStageId;
  for (const mount of mounts) {
    const scope = resolveDrillScope(graph, mount.id);
    const members = graph.nodes.filter((n) => n.data?.subflowOf === scope);
    if (members.length === 0) continue;
    const anyActive = members.some((m) => m.id === slice.activeStageId);
    const allDone = members.every((m) => slice.doneStageIds.has(m.id));
    if (allDone) doneIds.add(mount.id);
    else if (anyActive && currentSubflowId === null) {
      activeId = mount.id;
    }
  }
  if (activeId !== null && !nodeIds.has(activeId)) {
    for (const ancestor of pathAncestorsOf(activeId)) {
      if (nodeIds.has(ancestor)) {
        activeId = ancestor;
        break;
      }
    }
  }
  return { ...slice, doneStageIds: doneIds, activeStageId: activeId };
}
function pathAncestorsOf(stageId) {
  const ancestors = [];
  let id = stageId;
  for (; ; ) {
    const cut = id.lastIndexOf("/");
    if (cut < 0) break;
    id = id.slice(0, cut);
    ancestors.push(id);
  }
  return ancestors;
}
var NO_IDS = /* @__PURE__ */ new Set();
function cursorStandInIds(activeStageId) {
  if (activeStageId === null || activeStageId.length === 0) return NO_IDS;
  return /* @__PURE__ */ new Set([activeStageId, ...pathAncestorsOf(activeStageId)]);
}
function edgeCarriesCursor(via, standIns) {
  if (standIns.size === 0 || !Array.isArray(via)) return false;
  return via.some((v2) => typeof v2 === "string" && standIns.has(v2));
}

// src/components/FlowchartView/_internal/useSubflowDrill.ts
var import_react39 = require("react");
function useSubflowDrill(graph, onSubflowChange, controlledSubflowId) {
  const isControlled = controlledSubflowId !== void 0;
  const [ownSubflowId, setOwnSubflowId] = (0, import_react39.useState)(null);
  const currentSubflowId = isControlled ? controlledSubflowId : ownSubflowId;
  const lastGraphRef = (0, import_react39.useRef)(null);
  if (!isControlled && lastGraphRef.current !== graph) {
    lastGraphRef.current = graph;
    if (ownSubflowId !== null && findMountNode(graph, ownSubflowId) === void 0) {
      queueMicrotask(() => setOwnSubflowId(null));
    }
  }
  const lastNotifiedRef = (0, import_react39.useRef)(void 0);
  (0, import_react39.useEffect)(() => {
    if (isControlled) return;
    if (lastNotifiedRef.current === currentSubflowId) return;
    lastNotifiedRef.current = currentSubflowId;
    onSubflowChange?.(currentSubflowId);
  }, [isControlled, currentSubflowId, onSubflowChange]);
  const setCurrentSubflowId = (0, import_react39.useCallback)(
    (id) => {
      if (isControlled) onSubflowChange?.(id);
      else setOwnSubflowId(id);
    },
    [isControlled, onSubflowChange]
  );
  const drillInto = (0, import_react39.useCallback)(
    (mountNodeId) => setCurrentSubflowId(mountNodeId),
    [setCurrentSubflowId]
  );
  const drillUp = (0, import_react39.useCallback)(() => setCurrentSubflowId(null), [setCurrentSubflowId]);
  return { currentSubflowId, drillInto, drillUp, setCurrentSubflowId };
}

// src/components/FlowchartView/_internal/TraceWorkflowAutoRefit.tsx
var import_react40 = require("react");
var import_react41 = require("@xyflow/react");

// src/components/FlowchartView/_internal/traceWorkflowProjection.ts
function traceWorkflowPaintBounds(nodes, stageIds, reads = []) {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const id of stageIds) {
    const node = nodes.get(id);
    if (!node || node.hidden) continue;
    const { x, y } = node.internals.positionAbsolute;
    const width = node.measured?.width, height = node.measured?.height;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !positiveFinite(width) || !positiveFinite(height)) return void 0;
    const captionHalfWidth = Math.max(width / 2 + 8, 110);
    left = Math.min(left, x + width / 2 - captionHalfWidth);
    right = Math.max(right, x + width / 2 + captionHalfWidth);
    top = Math.min(top, y - 8);
    bottom = Math.max(bottom, y + height + 26);
  }
  for (const [lane, read] of reads.entries()) {
    const route = recordedReadGeometry(nodes, read.source, read.target, lane);
    if (!route) return void 0;
    left = Math.min(left, route.bounds.x);
    top = Math.min(top, route.bounds.y);
    right = Math.max(right, route.bounds.x + route.bounds.width);
    bottom = Math.max(bottom, route.bounds.y + route.bounds.height);
  }
  if (![left, top, right, bottom].every(Number.isFinite)) return void 0;
  return { x: left, y: top, width: right - left, height: bottom - top };
}
function projectTraceWorkflow(overlay, visible) {
  const stages = /* @__PURE__ */ new Map();
  const reads = [];
  if (!overlay) return { stages, reads };
  const visibleCounts = /* @__PURE__ */ new Map();
  for (const node of visible) {
    if (!node.hidden) visibleCounts.set(node.id, (visibleCounts.get(node.id) ?? 0) + 1);
  }
  const candidates = /* @__PURE__ */ new Map();
  const runtimeCounts = /* @__PURE__ */ new Map();
  for (const stage of overlay.stages) {
    runtimeCounts.set(stage.runtimeStageId, (runtimeCounts.get(stage.runtimeStageId) ?? 0) + 1);
    const stamp = stage.runtimeStageId.lastIndexOf("#");
    if (stamp <= 0 || !/^(0|[1-9]\d*)$/.test(stage.runtimeStageId.slice(stamp + 1)) || stage.runtimeStageId.slice(0, stamp) !== stage.stageId || visibleCounts.get(stage.stageId) !== 1) continue;
    const group = candidates.get(stage.stageId) ?? [];
    group.push(stage);
    candidates.set(stage.stageId, group);
  }
  const nodeByRuntime = /* @__PURE__ */ new Map();
  for (const [id, group] of candidates) {
    const selected = group.length === 1 ? group[0] : group.find((stage) => stage.runtimeStageId === overlay.focusRuntimeStageId);
    if (!selected || runtimeCounts.get(selected.runtimeStageId) !== 1) continue;
    stages.set(id, selected);
    nodeByRuntime.set(selected.runtimeStageId, id);
  }
  const seen = /* @__PURE__ */ new Set();
  for (const read of overlay.reads) {
    const source = nodeByRuntime.get(read.sourceRuntimeStageId);
    const target = nodeByRuntime.get(read.targetRuntimeStageId);
    if (!source || !target) continue;
    const id = JSON.stringify([read.key, read.sourceRuntimeStageId, read.targetRuntimeStageId]);
    if (seen.has(id)) continue;
    seen.add(id);
    reads.push({ ...read, source, target });
  }
  return { stages, reads };
}

// src/components/FlowchartView/_internal/TraceWorkflowAutoRefit.tsx
var import_jsx_runtime21 = require("react/jsx-runtime");
function TraceWorkflowAutoRefit({ stages, reads, ...props }) {
  const boundsKey = (0, import_react41.useStore)((state) => {
    const bounds = traceWorkflowPaintBounds(state.nodeLookup, stages.keys(), reads);
    return bounds ? JSON.stringify(bounds) : "";
  });
  const visualBounds = (0, import_react40.useMemo)(() => boundsKey ? JSON.parse(boundsKey) : void 0, [boundsKey]);
  return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(ChartAutoRefit, { ...props, visualBounds });
}

// src/components/FlowchartView/SubflowBreadcrumbBar.tsx
var import_jsx_runtime22 = require("react/jsx-runtime");
function SubflowBreadcrumbBar({ entries, onNavigate, unstyled = false }) {
  const ui = componentStyles();
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
    "div",
    {
      "data-fp": "subflow-breadcrumb",
      style: unstyled ? void 0 : {
        display: "flex",
        alignItems: "center",
        gap: ui.controlGap,
        padding: `calc(${ui.spaceSm} - 2px) ${ui.spaceMd}`,
        fontSize: ui.label,
        background: theme.bgSecondary,
        borderBottom: `${ui.borderWidth} solid ${theme.border}`,
        flexShrink: 0
      },
      "aria-label": "Subflow breadcrumb",
      children: entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
          "span",
          {
            style: unstyled ? void 0 : { display: "inline-flex", alignItems: "center", gap: ui.controlGap },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
                FootprintButton,
                {
                  part: "subflow-breadcrumb-button",
                  unstyled,
                  type: "button",
                  onClick: () => onNavigate(entry.subflowId),
                  disabled: isLast,
                  defaultStyle: {
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    fontSize: ui.label,
                    fontWeight: isLast ? `calc(${ui.weightStrong} - 100)` : ui.weightMedium,
                    color: isLast ? theme.textPrimary : theme.primary,
                    cursor: isLast ? "default" : "pointer",
                    textDecoration: isLast ? "none" : "underline",
                    fontFamily: "inherit"
                  },
                  children: entry.label
                }
              ),
              !isLast && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { style: unstyled ? void 0 : { color: theme.textMuted }, children: "\u203A" })
            ]
          },
          entry.subflowId ?? "__top__"
        );
      })
    }
  );
}

// src/components/FlowchartView/TracedFlow.tsx
var import_jsx_runtime23 = require("react/jsx-runtime");
var DEFAULT_COLORS = {
  default: theme.textMuted,
  done: theme.success,
  active: theme.primary,
  error: theme.error,
  loop: theme.warning
};
var ACCESSORY_THEME_STYLE = {
  "--xy-controls-button-background-color": theme.bgSecondary,
  "--xy-controls-button-background-color-hover": theme.bgTertiary,
  "--xy-controls-button-color": theme.textPrimary,
  "--xy-controls-button-color-hover": theme.textPrimary,
  "--xy-controls-button-border-color": theme.border,
  "--xy-controls-box-shadow": componentStyles().shadowPanel,
  "--xy-minimap-background-color": theme.bgSecondary,
  "--xy-minimap-mask-background-color": `color-mix(in srgb, ${theme.bgPrimary} 60%, transparent)`,
  "--xy-minimap-mask-stroke-color": theme.border,
  "--xy-minimap-node-background-color": theme.bgTertiary,
  "--xy-minimap-node-stroke-color": theme.border,
  "--xy-edge-label-background-color": theme.bgSecondary,
  "--xy-edge-label-color": theme.textPrimary
};
var EMPTY_SET = /* @__PURE__ */ new Set();
function deriveOverlayFields(node, doneStageIds, activeStageId, errorMessage, executedOrderIds, coActiveStageIds, retryAttempts) {
  const isDone = doneStageIds.has(node.id);
  const isActive = activeStageId === node.id || coActiveStageIds.has(node.id);
  const wasExecuted = isDone || isActive;
  const hasError = !!errorMessage;
  const dimmed = !wasExecuted && executedOrderIds.length > 0;
  let stepNumbers;
  if (executedOrderIds.length > 0) {
    const nums = [];
    for (let i = 0; i < executedOrderIds.length; i++) {
      if (executedOrderIds[i] === node.id) nums.push(i + 1);
    }
    if (nums.length > 0) stepNumbers = nums;
  }
  return {
    active: isActive,
    done: isDone,
    error: hasError,
    dimmed,
    ...errorMessage && { errorMessage },
    ...stepNumbers && { stepNumbers },
    // Attempts are only ever interesting above 1 — a stage that ran once is
    // the silent default, and "×1" on every node would be noise, not truth.
    ...retryAttempts !== void 0 && retryAttempts > 1 && { retryAttempts }
  };
}
function toStageNodeWithOverlay(node, doneStageIds, activeStageId, errorMessage, executedOrderIds, coActiveStageIds, retryAttempts, suppressDimming = false) {
  const overlayFields = deriveOverlayFields(
    node,
    doneStageIds,
    activeStageId,
    errorMessage,
    executedOrderIds,
    coActiveStageIds,
    retryAttempts
  );
  const { dimmed } = overlayFields;
  if (node.type !== void 0 && node.type !== "stage") {
    const consumerData = node.data ?? {};
    const consumerActive = consumerData.active === true;
    const consumerDone = consumerData.done === true;
    const consumerError = consumerData.error === true;
    const finalActive = consumerActive || overlayFields.active;
    const finalDone = consumerDone || overlayFields.done;
    const finalError = consumerError || overlayFields.error;
    const finalDimmed = !finalActive && !finalDone && dimmed;
    return {
      ...node,
      data: {
        ...node.data,
        active: finalActive,
        done: finalDone,
        error: finalError,
        ...overlayFields.errorMessage !== void 0 && consumerData.errorMessage === void 0 && {
          errorMessage: overlayFields.errorMessage
        },
        ...finalDimmed && { dimmed: true },
        ...overlayFields.stepNumbers && { stepNumbers: overlayFields.stepNumbers },
        ...overlayFields.retryAttempts !== void 0 && consumerData.retryAttempts === void 0 && {
          retryAttempts: overlayFields.retryAttempts
        }
      },
      ...finalDimmed && !suppressDimming && { style: { ...node.style ?? {}, opacity: 0.35 } }
    };
  }
  const stageData = {
    // Same pass-through rule as the custom-node branch above (and as
    // TraceFlow's `toStageNode`): the source data goes through WHOLE, so a
    // consumer's custom fields and the recorder's own metadata
    // (isStreaming, isPausable, branchIds, defaultBranch, prevIds, nextIds,
    // subflowOf) survive into `data` for a swapped-in renderer to read.
    ...node.data,
    label: node.data.label,
    isDecider: node.data.isDecider,
    isFork: node.data.isFork,
    isSubflow: node.data.isSubflow,
    // Overlay LAST — run status is derived here and always wins.
    ...overlayFields
  };
  return {
    ...node,
    type: "stageNode",
    data: stageData,
    ...dimmed && !suppressDimming && { style: { ...node.style ?? {}, opacity: 0.35 } }
  };
}
function styleEdgeWithOverlay(edge, doneStageIds, activeStageId, colors, cursorStandIns, suppressMotion = false, errors = /* @__PURE__ */ new Map(), unstyled = false, errorColorEnabled = false, renderer = "flat") {
  const kind = edge.data?.kind ?? "next";
  const sourceExecuted = doneStageIds.has(edge.source) || activeStageId === edge.source;
  const targetExecuted = doneStageIds.has(edge.target) || activeStageId === edge.target;
  const traversed = sourceExecuted && targetExecuted;
  const carriesCursor = edgeCarriesCursor(edge.data?.via, cursorStandIns);
  const isLeadingEdge = carriesCursor || activeStageId === edge.source && !doneStageIds.has(edge.target);
  const hasError = !!errors.get(edge.source) || !!errors.get(edge.target);
  let color = colors.default;
  if (carriesCursor) color = colors.active;
  else if (errorColorEnabled && hasError) color = colors.error;
  else if (kind === "loop") color = colors.loop;
  else if (isLeadingEdge) color = colors.active;
  else if (traversed) color = colors.done;
  const styled = {
    ...edge,
    // Loop back-edges use the custom `loopBack` edge — a curve routed along the
    // right margin (clear of the spine). It reads node bounds from the store
    // and anchors on right edges itself, so it needs NO dedicated loop handles
    // on the node (the old approach broke for any node missing them).
    // Every other edge uses `smartStep`: a smoothstep superset that routes a
    // RANK-SKIPPING edge around the node it skips (else identical to smoothstep).
    type: edge.type ?? (kind === "loop" ? "loopBack" : renderer === "isometric" ? "isometric" : "smartStep"),
    animated: !suppressMotion && (edge.animated ?? isLeadingEdge),
    style: {
      ...!unstyled && {
        stroke: color,
        strokeWidth: kind === "loop" ? 1.5 : traversed || carriesCursor ? 2 : 1.5,
        ...kind === "loop" && { strokeDasharray: "4 3" }
      },
      ...edge.style
    },
    markerEnd: edge.markerEnd !== void 0 ? edge.markerEnd : unstyled ? void 0 : { type: import_react43.MarkerType.ArrowClosed, color: typeof edge.style?.stroke === "string" ? edge.style.stroke : color, width: 16, height: 16 },
    ...unstyled && { data: { ...edge.data, unstyled: true } }
  };
  return styled;
}
var DEFAULT_NODE_TYPES2 = {
  stageNode: DefaultStageNode,
  groupContainer: GroupContainerNode
};
var DEFAULT_EDGE_TYPES2 = { loopBack: LoopBackEdge, smartStep: SmartStepEdge, recordedRead: RecordedReadEdge, isometric: IsometricEdge };
function TracedFlow({
  renderer: rendererProp,
  graph,
  overlay,
  scrubIndex,
  layout: layoutProp,
  layoutOptions,
  colors: colorOverrides,
  onNodeClick,
  onSubflowChange,
  currentSubflowId: controlledSubflowId,
  collapseNode,
  groupedSubflows,
  mainChartBox,
  nodeTypes: userNodeTypes,
  edgeTypes: userEdgeTypes,
  coActiveStageIds,
  sliceCone,
  traceWorkflow,
  background,
  breadcrumb: renderBreadcrumb,
  minZoom = 0.1,
  maxZoom,
  viewport,
  defaultViewport,
  onViewportChange,
  autoFit = true,
  theme: themeMode,
  unstyled = false,
  children,
  className,
  style
}) {
  const renderer = resolveFlowchartRenderer(rendererProp);
  const motionEnabled = useTraceMotion();
  const suppressMotion = unstyled || !!traceWorkflow || !motionEnabled;
  const errorColorEnabled = colorOverrides?.error !== void 0;
  const investigationSeen = (0, import_react42.useRef)(false);
  if (traceWorkflow) investigationSeen.current = true;
  const layout = layoutProp ?? dagreTraceLayout;
  (0, import_react42.useEffect)(() => {
    if (layoutProp === dagreTraceLayout) {
      devWarn(
        () => "[footprint-explainable-ui] <TracedFlow layout={dagreTraceLayout}> bypasses the built-in measure-then-layout pipeline (content-exact sizing, fork/merge centering, straight spines). OMIT the `layout` prop to use it \u2014 passing the raw dagreTraceLayout silently forfeits every layout improvement eui ships."
      );
    }
  }, [layoutProp]);
  (0, import_react42.useEffect)(() => {
    if (layoutOptions !== void 0 && layoutProp !== void 0)
      devWarn(() => "[footprint-explainable-ui] TracedFlow layoutOptions applies only to the default measured layout; the supplied layout owns its options.");
  }, [layoutOptions, layoutProp]);
  const colors = (0, import_react42.useMemo)(
    () => ({ ...DEFAULT_COLORS, ...colorOverrides ?? {} }),
    [colorOverrides]
  );
  const mergedNodeTypes = (0, import_react42.useMemo)(
    () => userNodeTypes ? { ...DEFAULT_NODE_TYPES2, ...userNodeTypes } : DEFAULT_NODE_TYPES2,
    [userNodeTypes]
  );
  const mergedEdgeTypes = (0, import_react42.useMemo)(
    () => userEdgeTypes ? { ...DEFAULT_EDGE_TYPES2, ...userEdgeTypes } : DEFAULT_EDGE_TYPES2,
    [userEdgeTypes]
  );
  const effectiveGraph = (0, import_react42.useMemo)(
    () => collapseNode ? collapseTraceGraph(graph, collapseNode).graph : graph,
    [graph, collapseNode]
  );
  const drill = useSubflowDrill(effectiveGraph, onSubflowChange, controlledSubflowId);
  const groupedSet = (0, import_react42.useMemo)(() => new Set(groupedSubflows ?? []), [groupedSubflows]);
  const filteredGraph = (0, import_react42.useMemo)(() => {
    const base = filterGraphForDrill(effectiveGraph, drill.currentSubflowId);
    if (groupedSet.size === 0) return base;
    const baseIds = new Set(base.nodes.map((n) => n.id));
    const extraNodes = effectiveGraph.nodes.filter(
      (n) => n.data?.subflowOf !== void 0 && groupedSet.has(n.data.subflowOf) && !baseIds.has(n.id)
    );
    if (extraNodes.length === 0) return base;
    const allIds = /* @__PURE__ */ new Set([...baseIds, ...extraNodes.map((n) => n.id)]);
    const baseEdgeIds = new Set(base.edges.map((e) => e.id));
    const extraEdges = effectiveGraph.edges.filter(
      (e) => !baseEdgeIds.has(e.id) && allIds.has(e.source) && allIds.has(e.target)
    );
    return { nodes: [...base.nodes, ...extraNodes], edges: [...base.edges, ...extraEdges] };
  }, [effectiveGraph, drill.currentSubflowId, groupedSet]);
  const breadcrumb = (0, import_react42.useMemo)(
    () => buildSubflowBreadcrumb(effectiveGraph, drill.currentSubflowId),
    [effectiveGraph, drill.currentSubflowId]
  );
  const [measurement, setMeasurement] = (0, import_react42.useState)(null);
  const measuredSizes = measurement?.renderer === renderer ? measurement.sizes : null;
  const acceptMeasurements = (0, import_react42.useCallback)((sizes) => setMeasurement({ renderer, sizes }), [renderer]);
  const fixedStageNodes = !userNodeTypes?.stageNode;
  const positioned = (0, import_react42.useMemo)(() => {
    const nodeSize = layoutOptions?.nodeSize || measuredSizes ? (n) => layoutOptions?.nodeSize?.(n) ?? measuredSizes?.get(n.id) : void 0;
    const sizeOpts = { nodeSize, nodeWidth: layoutOptions?.nodeWidth, nodeHeight: layoutOptions?.nodeHeight };
    const nodeSep = layoutOptions?.nodeSep ?? 36;
    const dagreBase = withForkCentering(
      createSnappedDagreLayout(
        createDagreTraceLayout({ ...layoutOptions, ...sizeOpts, direction: "TB", rankSep: layoutOptions?.rankSep ?? 52, nodeSep }),
        sizeOpts
      ),
      { ...sizeOpts, nodeSep }
      // same nodeSep → clamp preserves dagre's reserved gap
    );
    const isometricNodeSize = (node) => fixedStageNodes && !node.data.isGroupContainer && (node.type === void 0 || node.type === "stage") ? { width: ISOMETRIC_NODE_WIDTH, height: ISOMETRIC_NODE_HEIGHT } : nodeSize?.(node);
    const isometricBase = createIsometricTraceLayout({ nodeSize: isometricNodeSize, fixedStageNodes });
    const isometricBounds = renderer === "isometric" && layoutProp === void 0 ? { nodeSize: isometricNodeSize } : {};
    const realBase = layout === "passthrough" ? (g) => g : layoutProp === void 0 ? renderer === "isometric" ? isometricBase : dagreBase : layout;
    if (groupedSet.size > 0) {
      const grouped = applyGroupLayout(filteredGraph, {
        groupedSubflowIds: [...groupedSet],
        baseLayout: realBase,
        ...isometricBounds
      });
      return mainChartBox ? wrapInMainChartBox(grouped, { baseLayout: (g) => g, ...isometricBounds, ...mainChartBox }) : grouped;
    }
    if (mainChartBox) {
      return wrapInMainChartBox(filteredGraph, { baseLayout: realBase, ...isometricBounds, ...mainChartBox });
    }
    return realBase(filteredGraph);
  }, [filteredGraph, layout, layoutProp, layoutOptions, groupedSet, mainChartBox, measuredSizes, renderer, fixedStageNodes]);
  const slice = (0, import_react42.useMemo)(() => {
    const empty = {
      doneStageIds: /* @__PURE__ */ new Set(),
      activeStageId: null,
      executedStageIds: /* @__PURE__ */ new Set(),
      executedOrderIds: [],
      errors: /* @__PURE__ */ new Map(),
      retryAttempts: /* @__PURE__ */ new Map()
    };
    if (!overlay) return empty;
    const idx = scrubIndex ?? Math.max(0, overlay.executionOrder.length - 1);
    return aggregateMountStatus(sliceOverlay(overlay, idx), effectiveGraph, drill.currentSubflowId);
  }, [overlay, scrubIndex, effectiveGraph, drill.currentSubflowId]);
  const reactFlowNodes = (0, import_react42.useMemo)(
    () => positioned.nodes.map((n) => {
      const node = toStageNodeWithOverlay(
        n,
        slice.doneStageIds,
        slice.activeStageId,
        slice.errors.get(n.id),
        slice.executedOrderIds,
        coActiveStageIds ?? EMPTY_SET,
        slice.retryAttempts?.get(n.id),
        unstyled || !!traceWorkflow
      );
      return { ...node, data: { ...node.data, ...unstyled && { unstyled: true }, suppressMotion: suppressMotion || node.data.suppressMotion === true } };
    }),
    [positioned.nodes, slice, coActiveStageIds, suppressMotion, traceWorkflow, unstyled]
  );
  const cursorStandIns = (0, import_react42.useMemo)(() => cursorStandInIds(slice.activeStageId), [slice.activeStageId]);
  const reactFlowEdges = (0, import_react42.useMemo)(
    () => positioned.edges.map(
      (e) => styleEdgeWithOverlay(e, slice.doneStageIds, slice.activeStageId, colors, cursorStandIns, suppressMotion, slice.errors, unstyled, errorColorEnabled, renderer)
    ),
    [positioned.edges, slice, colors, cursorStandIns, suppressMotion, unstyled, errorColorEnabled, renderer]
  );
  const workflowProjection = (0, import_react42.useMemo)(() => projectTraceWorkflow(traceWorkflow, positioned.nodes), [traceWorkflow, positioned.nodes]);
  const workflowNodes = (0, import_react42.useMemo)(() => {
    if (!traceWorkflow) return reactFlowNodes;
    return reactFlowNodes.map((node) => {
      const stage = workflowProjection.stages.get(node.id);
      return {
        ...node,
        data: {
          ...node.data,
          dimmed: false,
          traceContext: stage ? "displayed" : "outside",
          ...stage ? { traceWorkflow: stage } : {}
        },
        // Inspection removes system fading, including group/pill dimming.
        // Authored opacity remains a host choice, including for custom nodes.
        style: unstyled ? node.style : {
          ...node.style,
          opacity: node.style?.opacity ?? 1,
          transition: motionEnabled ? `opacity ${TRACE_MOTION_MS}ms ease` : "none",
          animation: "none"
        }
      };
    });
  }, [traceWorkflow, reactFlowNodes, workflowProjection, motionEnabled, unstyled]);
  const workflowEdges = (0, import_react42.useMemo)(() => {
    if (!traceWorkflow) return reactFlowEdges;
    const execution = reactFlowEdges.map((edge) => ({
      ...edge,
      animated: false,
      style: unstyled ? edge.style : { animation: "none", transition: motionEnabled ? `opacity ${TRACE_MOTION_MS}ms ease` : "none", opacity: 0.4, ...edge.style }
    }));
    const reads = workflowProjection.reads.map((read, lane) => ({
      id: `recorded-read:${JSON.stringify([traceWorkflow.scopeKey, read.key, read.sourceRuntimeStageId, read.targetRuntimeStageId])}`,
      source: read.source,
      target: read.target,
      type: "recordedRead",
      animated: false,
      selectable: false,
      zIndex: 2,
      data: { kind: "recorded-read", ...read, lane, scopeKey: traceWorkflow.scopeKey, ...unstyled && { unstyled: true } },
      ...!unstyled && {
        style: { stroke: read.color, strokeWidth: 2, strokeDasharray: "6 4", animation: "none", transition: "none" },
        markerEnd: { type: import_react43.MarkerType.ArrowClosed, color: read.color, width: 14, height: 14 }
      }
    }));
    return [...execution, ...reads];
  }, [traceWorkflow, reactFlowEdges, workflowProjection, motionEnabled, unstyled]);
  const [coneRevealed, setConeRevealed] = (0, import_react42.useState)(false);
  (0, import_react42.useEffect)(() => {
    if (!sliceCone || traceWorkflow || unstyled) return;
    setConeRevealed(false);
    const raf = requestAnimationFrame(() => setConeRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, [sliceCone, traceWorkflow, unstyled]);
  const conedNodes = (0, import_react42.useMemo)(() => {
    if (traceWorkflow) return workflowNodes;
    if (unstyled) return reactFlowNodes;
    if (!sliceCone || sliceCone.size === 0) return reactFlowNodes;
    return reactFlowNodes.map((n) => {
      const depth = sliceCone.get(n.id);
      if (depth === void 0) {
        return { ...n, style: { ...n.style, opacity: 0.22, transition: "opacity 260ms ease" } };
      }
      return {
        ...n,
        style: {
          ...n.style,
          opacity: coneRevealed ? 1 : 0.22,
          transition: "opacity 320ms ease",
          transitionDelay: `${depth * 90}ms`
        }
      };
    });
  }, [traceWorkflow, workflowNodes, reactFlowNodes, sliceCone, coneRevealed, unstyled]);
  const conedEdges = (0, import_react42.useMemo)(() => {
    if (traceWorkflow) return workflowEdges;
    if (unstyled) return reactFlowEdges;
    if (!sliceCone || sliceCone.size === 0) return reactFlowEdges;
    return reactFlowEdges.map((e) => {
      const inCone = sliceCone.has(e.source) && sliceCone.has(e.target);
      return inCone ? e : { ...e, style: { ...e.style, opacity: 0.12, transition: "opacity 260ms ease" } };
    });
  }, [traceWorkflow, workflowEdges, reactFlowEdges, sliceCone, unstyled]);
  const handleNodeClick = (0, import_react42.useCallback)(
    (_, node) => {
      const data = node.data ?? {};
      const isGrouped = groupedSet.has(node.id) || !!data.subflowId && groupedSet.has(data.subflowId);
      if (data.isSubflow && !isGrouped) {
        drill.drillInto(node.id);
      }
      onNodeClick?.(node.id);
    },
    [drill, onNodeClick, groupedSet]
  );
  const wrapperRef = (0, import_react42.useRef)(null);
  const layoutKey = chartLayoutKey(positioned.nodes);
  const refitKey = JSON.stringify([
    chartLayoutKey(filteredGraph.nodes),
    chartTopologyKey(positioned.nodes),
    // A custom layout is an authored layout. Default measured-layout settling
    // must not take camera ownership back after a manual pan/zoom.
    layoutProp !== void 0 ? layoutKey : null,
    ...renderer === "isometric" ? [renderer] : []
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
    "div",
    {
      ref: wrapperRef,
      "data-fp": "traced-flow",
      "data-fp-renderer": renderer,
      "data-unstyled": unstyled || void 0,
      className,
      style: {
        // The one-word switch, applied to this chart's own root so a chart
        // mounted alone in a light app is light (see theme/mode.ts).
        ...!unstyled && themeModeVars(themeMode),
        ...!unstyled && ACCESSORY_THEME_STYLE,
        width: "100%",
        height: "100%",
        minHeight: 300,
        display: "flex",
        flexDirection: "column",
        ...style
      },
      children: [
        breadcrumb.length > 1 && renderBreadcrumb !== false && (renderBreadcrumb ? renderBreadcrumb({ entries: breadcrumb, onNavigate: drill.setCurrentSubflowId, unstyled }) : /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(SubflowBreadcrumbBar, { entries: breadcrumb, onNavigate: drill.setCurrentSubflowId, unstyled })),
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { flex: 1, minHeight: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(RendererContext.Provider, { value: renderer, children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
          import_react43.ReactFlow,
          {
            nodes: conedNodes,
            edges: conedEdges,
            nodeTypes: mergedNodeTypes,
            edgeTypes: mergedEdgeTypes,
            onNodeClick: handleNodeClick,
            minZoom,
            maxZoom,
            viewport,
            defaultViewport,
            onViewportChange,
            proOptions: { hideAttribution: true },
            children: [
              autoFit !== false && viewport === void 0 && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
                TraceWorkflowAutoRefit,
                {
                  wrapperRef,
                  refitKey,
                  layoutKey,
                  padding: typeof autoFit === "object" ? autoFit.padding ?? 0.18 : 0.18,
                  maxAutoZoom: typeof autoFit === "object" ? autoFit.maxZoom : void 0,
                  preserveViewport: investigationSeen.current,
                  stages: workflowProjection.stages,
                  reads: workflowProjection.reads
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(RendererGeometry, { renderer, nodeIds: positioned.nodes.map((node) => node.id) }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(MeasuredNodeSizes, { onSizes: acceptMeasurements }),
              background !== false && (!unstyled || background !== void 0) && (renderer === "isometric" && background === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(IsometricGrid, {}) : /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_react43.Background, { variant: import_react43.BackgroundVariant.Dots, gap: 20, size: 1, ...background })),
              children
            ]
          }
        ) }) })
      ]
    }
  );
}

// src/components/TimeTravelDebugger/TimeTravelDebugger.tsx
var import_jsx_runtime24 = require("react/jsx-runtime");
function TimeTravelDebugger({
  snapshots,
  graph,
  runtimeOverlay,
  showGantt = true,
  layout = "horizontal",
  title = "Time-Travel Debugger",
  size = "default",
  unstyled = false,
  className,
  style
}) {
  warnDeprecated(
    "TimeTravelDebugger",
    "Use <SnapshotPanel> (same panels, controlled cursor), <ExplainableShell> (those plus the chart and drill-down), or the footprint-viewer package."
  );
  const [selectedIndex, setSelectedIndex] = (0, import_react44.useState)(0);
  const fs = fontSize[size];
  const pad = padding[size];
  if (snapshots.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
      "div",
      {
        className,
        style: {
          padding: pad * 2,
          textAlign: "center",
          color: theme.textMuted,
          ...style
        },
        children: "No snapshots to debug"
      }
    );
  }
  const isHorizontal = layout === "horizontal";
  const handleNodeClick = (stageId) => {
    const idx = snapshots.findIndex(
      (s) => s.stageName === stageId || s.stageLabel === stageId
    );
    if (idx >= 0) setSelectedIndex(idx);
  };
  const chart = runtimeOverlay ? /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
    TracedFlow,
    {
      graph,
      overlay: runtimeOverlay,
      scrubIndex: selectedIndex,
      onNodeClick: handleNodeClick
    }
  ) : /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(TraceFlow, { graph, onNodeClick: handleNodeClick });
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className, style, "data-fp": "time-travel-debugger", children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("h3", { children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
        "input",
        {
          type: "range",
          min: 0,
          max: snapshots.length - 1,
          value: selectedIndex,
          onChange: (e) => setSelectedIndex(parseInt(e.target.value))
        }
      ),
      chart,
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
        MemoryInspector,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
        NarrativeLog,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      showGantt && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
        GanttTimeline,
        {
          snapshots,
          selectedIndex,
          onSelect: setSelectedIndex,
          unstyled: true
        }
      )
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
    "div",
    {
      className,
      style: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: theme.bgPrimary,
        fontFamily: theme.fontSans,
        overflow: "hidden",
        ...style
      },
      "data-fp": "time-travel-debugger",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
          "div",
          {
            style: {
              padding: `${pad}px ${pad + 4}px`,
              borderBottom: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                      "span",
                      {
                        style: {
                          fontSize: fs.body + 2,
                          fontWeight: 600,
                          color: theme.textPrimary
                        },
                        children: title
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                      "span",
                      {
                        style: {
                          fontSize: fs.small,
                          color: theme.textMuted
                        },
                        children: "Scrub to replay execution"
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                  ScrubButton,
                  {
                    label: "\u25C0",
                    disabled: selectedIndex === 0,
                    onClick: () => setSelectedIndex((i) => Math.max(0, i - 1))
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                  "input",
                  {
                    type: "range",
                    min: 0,
                    max: snapshots.length - 1,
                    value: selectedIndex,
                    onChange: (e) => setSelectedIndex(parseInt(e.target.value)),
                    style: {
                      flex: 1,
                      height: 4,
                      accentColor: theme.primary,
                      cursor: "pointer"
                    }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                  ScrubButton,
                  {
                    label: "\u25B6",
                    disabled: selectedIndex === snapshots.length - 1,
                    onClick: () => setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1))
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
                  "span",
                  {
                    style: {
                      fontSize: fs.small,
                      color: theme.textMuted,
                      flexShrink: 0,
                      fontFamily: theme.fontMono
                    },
                    children: [
                      selectedIndex + 1,
                      "/",
                      snapshots.length
                    ]
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: isHorizontal ? "row" : "column",
              overflow: "hidden"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                "div",
                {
                  style: {
                    flex: 1,
                    overflow: "hidden",
                    borderRight: isHorizontal ? `1px solid ${theme.border}` : "none",
                    borderBottom: !isHorizontal ? `1px solid ${theme.border}` : "none"
                  },
                  children: chart
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { style: { flex: 1, overflow: "auto" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                  MemoryInspector,
                  {
                    snapshots,
                    selectedIndex,
                    size
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                  "div",
                  {
                    style: {
                      height: 1,
                      background: theme.border,
                      margin: `0 ${pad}px`
                    }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                  NarrativeLog,
                  {
                    snapshots,
                    selectedIndex,
                    size
                  }
                )
              ] })
            ]
          }
        ),
        showGantt && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
          "div",
          {
            style: {
              borderTop: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
              GanttTimeline,
              {
                snapshots,
                selectedIndex,
                onSelect: setSelectedIndex,
                size
              }
            )
          }
        )
      ]
    }
  );
}
function ScrubButton({
  label,
  disabled,
  onClick
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
    "button",
    {
      onClick,
      disabled,
      style: {
        background: theme.bgTertiary,
        border: `1px solid ${theme.border}`,
        color: disabled ? theme.textMuted : theme.textPrimary,
        borderRadius: 6,
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontSize: 12,
        flexShrink: 0
      },
      children: label
    }
  );
}

// src/components/FlowchartView/SubflowBreadcrumb.tsx
var import_react45 = require("react");
var import_jsx_runtime25 = require("react/jsx-runtime");
var SubflowBreadcrumb = (0, import_react45.memo)(function SubflowBreadcrumb2({
  breadcrumbs,
  onNavigate,
  unstyled = false
}) {
  const ui = componentStyles();
  const sx = (value) => unstyled ? void 0 : value;
  const nativeButton = !useFootprintComponents().Button;
  warnDeprecated(
    "SubflowBreadcrumb",
    "It renders the legacy useSubflowNavigation stack. Use <TracedFlow> (which draws its own trail), or buildSubflowBreadcrumb(graph, mountNodeId)."
  );
  if (breadcrumbs.length <= 1) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
    "div",
    {
      "data-fp": "subflow-breadcrumb",
      style: sx({
        display: "flex",
        alignItems: "center",
        gap: ui.spaceXs,
        padding: `${ui.controlGap} ${ui.padding}`,
        background: theme.bgSecondary,
        borderBottom: `${ui.borderWidth} solid ${theme.border}`,
        fontSize: ui.body,
        fontFamily: theme.fontSans,
        flexShrink: 0,
        overflowX: "auto"
      }),
      children: breadcrumbs.map((crumb, i) => {
        const isLast = i === breadcrumbs.length - 1;
        return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("span", { style: sx({ display: "flex", alignItems: "center", gap: ui.spaceXs }), children: [
          i > 0 && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("span", { style: sx({ color: theme.textMuted, fontSize: ui.small }), children: "\u203A" }),
          isLast ? /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("span", { style: sx({ display: "flex", alignItems: "center", gap: ui.controlGap }), children: [
            /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
              "span",
              {
                style: sx({
                  color: theme.primary,
                  fontWeight: ui.weightStrong
                }),
                children: crumb.label
              }
            ),
            crumb.description && /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(
              "span",
              {
                style: sx({
                  color: theme.textMuted,
                  fontWeight: ui.weightNormal,
                  fontSize: ui.label
                }),
                children: [
                  "\u2014 ",
                  crumb.description
                ]
              }
            )
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
            FootprintButton,
            {
              onClick: () => onNavigate(i),
              defaultStyle: sx({
                background: "none",
                border: "none",
                color: theme.textSecondary,
                cursor: "pointer",
                padding: `calc(${ui.spaceXs} / 2) ${ui.spaceXs}`,
                borderRadius: ui.radiusControl,
                fontSize: ui.body,
                fontFamily: "inherit",
                fontWeight: ui.weightMedium,
                transition: `color ${ui.fastDuration} ${ui.easing}`
              }),
              onMouseEnter: (e) => {
                if (!unstyled && nativeButton) e.currentTarget.style.color = theme.primary;
              },
              onMouseLeave: (e) => {
                if (!unstyled && nativeButton) e.currentTarget.style.color = theme.textSecondary;
              },
              children: crumb.label
            }
          )
        ] }, `${crumb.label}-${i}`);
      })
    }
  );
});

// src/components/FlowchartView/useSubflowNavigation.ts
var import_react46 = require("react");
var EMPTY_GRAPH2 = { nodes: [], edges: [] };
function useSubflowNavigation(rootGraph) {
  warnDeprecated(
    "useSubflowNavigation",
    "It keys the drill by the child chart's LOCAL subflowId, which is not unique across two mounts of the same chart. Use <TracedFlow>'s built-in drill (currentSubflowId + onSubflowChange), or filterGraphForDrill + buildSubflowBreadcrumb with the MOUNT NODE'S id."
  );
  const [stack, setStack] = (0, import_react46.useState)([]);
  const safeRootGraph = rootGraph ?? EMPTY_GRAPH2;
  const subflowMounts = (0, import_react46.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    for (const node of safeRootGraph.nodes) {
      if (!node.data?.isSubflow) continue;
      const subflowId = typeof node.data.subflowId === "string" ? node.data.subflowId : node.id;
      const label = typeof node.data.label === "string" ? node.data.label : node.id;
      const entry = {
        subflowId,
        label
      };
      if (typeof node.data.description === "string") {
        entry.description = node.data.description;
      }
      map.set(node.id, entry);
      map.set(subflowId, entry);
    }
    return map;
  }, [safeRootGraph]);
  const breadcrumbs = (0, import_react46.useMemo)(() => {
    const rootLabel = "Flowchart";
    const root = { label: rootLabel };
    return [root, ...stack];
  }, [stack]);
  const handleNodeClick = (0, import_react46.useCallback)(
    (nodeId) => {
      const mount = subflowMounts.get(nodeId);
      if (!mount) return false;
      setStack((prev) => {
        const entry = {
          label: mount.label,
          subflowId: mount.subflowId
        };
        if (mount.description !== void 0) entry.description = mount.description;
        return [...prev, entry];
      });
      return true;
    },
    [subflowMounts]
  );
  const navigateTo = (0, import_react46.useCallback)((level) => {
    if (level === 0) {
      setStack([]);
    } else {
      setStack((prev) => prev.slice(0, level));
    }
  }, []);
  const top = stack[stack.length - 1];
  return {
    breadcrumbs,
    // TODO(recorder-driven-nesting): swap to per-subflow graph when
    // child charts attach their own recorders.
    currentGraph: safeRootGraph,
    currentSubflowId: top?.subflowId ?? null,
    currentSubflowNodeName: top?.label ?? null,
    handleNodeClick,
    navigateTo,
    isInSubflow: stack.length > 0
  };
}

// src/components/FlowchartView/SubflowTree.tsx
var import_react47 = require("react");
var import_jsx_runtime26 = require("react/jsx-runtime");
function graphToSubflowEntries(graph) {
  if (!graph?.nodes?.length) return [];
  const entries = [];
  for (const node of graph.nodes) {
    if (!node.data?.isSubflow) continue;
    const entry = {
      name: typeof node.data.label === "string" ? node.data.label : node.id,
      isSubflow: true,
      nodeId: node.id
    };
    if (typeof node.data.description === "string") entry.description = node.data.description;
    if (typeof node.data.subflowId === "string") entry.subflowId = node.data.subflowId;
    entries.push(entry);
  }
  return entries;
}
var TreeNode = (0, import_react47.memo)(function TreeNode2({
  entry,
  depth,
  activeStage,
  doneStages,
  onNodeSelect,
  unstyled = false,
  size = "default"
}) {
  const [expanded, setExpanded] = (0, import_react47.useState)(true);
  const ui = componentStyles(size);
  const sx = (value) => unstyled ? void 0 : value;
  const nativeButton = !useFootprintComponents().Button;
  const hasChildren = entry.children && entry.children.length > 0;
  const isActive = activeStage === entry.name;
  const isDone = doneStages?.has(entry.name);
  const handleClick = (0, import_react47.useCallback)(() => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
    onNodeSelect?.(entry.name, !!entry.isSubflow, entry.nodeId);
  }, [hasChildren, onNodeSelect, entry.name, entry.isSubflow, entry.nodeId]);
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(import_jsx_runtime26.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(
      FootprintButton,
      {
        onClick: handleClick,
        "data-fp": "subflow-tree-node",
        "aria-current": isActive ? "step" : void 0,
        "data-state": isActive ? "active" : isDone ? "done" : "pending",
        defaultStyle: sx({
          display: "flex",
          alignItems: "center",
          gap: ui.controlGap,
          width: "100%",
          border: "none",
          background: isActive ? `color-mix(in srgb, ${theme.primary} 15%, transparent)` : "transparent",
          cursor: "pointer",
          padding: `${ui.spaceXs} ${ui.spaceSm} ${ui.spaceXs} calc(${ui.spaceSm} + ${depth} * ${ui.spaceLg})`,
          fontFamily: theme.fontSans,
          fontSize: ui.body,
          textAlign: "left",
          borderRadius: ui.radiusControl,
          transition: `background ${ui.fastDuration} ${ui.easing}`
        }),
        onMouseEnter: (e) => {
          if (!unstyled && nativeButton && !isActive) {
            e.currentTarget.style.background = `color-mix(in srgb, ${theme.textMuted} 10%, transparent)`;
          }
        },
        onMouseLeave: (e) => {
          if (!unstyled && nativeButton && !isActive) {
            e.currentTarget.style.background = "transparent";
          }
        },
        children: [
          hasChildren ? /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
            "span",
            {
              style: sx({
                fontSize: ui.small,
                color: theme.textMuted,
                width: `calc(${ui.iconSize} - 2px)`,
                textAlign: "center",
                flexShrink: 0,
                transition: `transform ${ui.fastDuration} ${ui.easing}`,
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                display: "inline-block"
              }),
              children: "\u25B6"
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { style: sx({ width: `calc(${ui.iconSize} - 2px)`, flexShrink: 0 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
            "span",
            {
              style: sx({
                width: `calc(${ui.iconSize} * 3 / 7)`,
                height: `calc(${ui.iconSize} * 3 / 7)`,
                borderRadius: "50%",
                flexShrink: 0,
                background: isActive ? theme.primary : isDone ? theme.success : theme.border
              })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("span", { style: sx({ display: "flex", flexDirection: "column", minWidth: 0 }), children: [
            /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(
              "span",
              {
                style: sx({
                  color: isActive ? theme.primary : isDone ? theme.textPrimary : theme.textSecondary,
                  fontWeight: isActive ? ui.weightStrong : entry.isSubflow ? ui.weightMedium : ui.weightNormal,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }),
                children: [
                  entry.name,
                  entry.isSubflow && /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { style: sx({ opacity: 0.5, marginLeft: ui.spaceXs, fontSize: ui.small }), children: "\u229E" })
                ]
              }
            ),
            entry.description && /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
              "span",
              {
                style: sx({
                  color: theme.textMuted,
                  fontSize: ui.small,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }),
                children: entry.description
              }
            )
          ] })
        ]
      }
    ),
    hasChildren && expanded && /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { children: entry.children.map((child, i) => /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
      TreeNode2,
      {
        entry: child,
        depth: depth + 1,
        activeStage,
        doneStages,
        onNodeSelect,
        unstyled,
        size
      },
      child.nodeId ?? child.subflowId ?? `${child.name}-${i}`
    )) })
  ] });
});
var SectionLabel = (0, import_react47.memo)(function SectionLabel2({ children, unstyled = false, size = "default" }) {
  const ui = componentStyles(size);
  const sx = (value) => unstyled ? void 0 : value;
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
    "div",
    {
      style: sx({
        padding: `${ui.spaceXs} ${ui.padding} ${ui.spaceSm}`,
        fontSize: ui.small,
        fontWeight: ui.weightStrong,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: theme.textMuted
      }),
      children
    }
  );
});
var SubflowTree = (0, import_react47.memo)(function SubflowTree2({
  graph,
  activeStage,
  doneStages,
  onNodeSelect,
  unstyled = false,
  size = "default",
  className,
  style
}) {
  const ui = componentStyles(size);
  const subflowStages = (0, import_react47.useMemo)(() => graphToSubflowEntries(graph), [graph]);
  if (subflowStages.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(
    "div",
    {
      className,
      "data-fp": "subflow-tree",
      style: {
        ...unstyled ? {} : {
          fontFamily: theme.fontSans,
          fontSize: ui.body,
          background: theme.bgPrimary,
          borderRight: `${ui.borderWidth} solid ${theme.border}`,
          overflowY: "auto",
          overflowX: "hidden",
          padding: `${ui.spaceSm} 0`
        },
        ...style
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(SectionLabel, { unstyled, size, children: "Subflows" }),
        subflowStages.map((entry, i) => /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
          TreeNode,
          {
            entry,
            depth: 0,
            activeStage,
            doneStages,
            onNodeSelect,
            unstyled,
            size
          },
          entry.nodeId ?? entry.subflowId ?? `${entry.name}-${i}`
        ))
      ]
    }
  );
});

// src/components/FlowchartView/_internal/keys.ts
function asStageId(s) {
  return s;
}
function asRuntimeStageId(s) {
  return s;
}

// src/components/FlowchartView/_internal/walkSubflowSpecInto.ts
function walkSubflowSpecInto(spec, subflowPath, sink) {
  walkNode(spec, subflowPath, sink, /* @__PURE__ */ new Set());
}
function qid(subflowPath, localId) {
  return `${subflowPath}/${localId}`;
}
function walkNode(node, subflowPath, sink, visited) {
  const fullId = qid(subflowPath, node.id);
  if (visited.has(fullId)) return;
  visited.add(fullId);
  if (node.isLoopReference) return;
  if (node.isSubflowRoot && node.subflowId !== void 0 && node.subflowStructure) {
    const nestedPath = `${subflowPath}/${node.subflowId}`;
    walkNode(node.subflowStructure, nestedPath, sink, visited);
  }
  const type = node.type ?? "stage";
  const isDecider = type === "decider" || type === "selector" || node.hasDecider === true || node.hasSelector === true;
  const isFork = type === "fork";
  const isStreaming = type === "streaming";
  const isSubflow = !!node.isSubflowRoot;
  const data = {
    label: node.name,
    isDecider,
    isFork,
    isStreaming,
    isSubflow,
    subflowOf: subflowPath,
    prevIds: [],
    nextIds: []
  };
  if (node.description !== void 0) data.description = node.description;
  if (node.icon !== void 0) data.icon = node.icon;
  if (node.subflowId !== void 0) data.subflowId = node.subflowId;
  if (node.isLazy === true) data.isLazy = true;
  if (node.isPausable === true) data.isPausable = true;
  sink.upsertNode({
    id: asStageId(fullId),
    type: "stage",
    position: { x: 0, y: 0 },
    data
  });
  if (node.children && node.children.length > 0) {
    const edgeKind = type === "fork" ? "fork-branch" : "decision-branch";
    for (const child of node.children) {
      const childFullId = qid(subflowPath, child.id);
      const edgeId = `${fullId}->${childFullId}:${edgeKind}${edgeKind === "decision-branch" ? `:${child.id}` : ""}`;
      const edgeData = { kind: edgeKind };
      if (edgeKind === "decision-branch") edgeData.label = child.id;
      const edge = {
        id: edgeId,
        source: fullId,
        target: childFullId,
        data: edgeData
      };
      if (edgeKind === "decision-branch") edge.label = child.id;
      sink.pushEdge(edge);
      walkNode(child, subflowPath, sink, visited);
    }
  }
  if (node.next) {
    if (node.next.isLoopReference && node.loopTarget) {
      const loopFullId = qid(subflowPath, node.loopTarget);
      sink.pushEdge({
        id: `${fullId}->${loopFullId}:loop`,
        source: fullId,
        target: loopFullId,
        data: { kind: "loop" }
      });
    } else {
      const nextFullId = qid(subflowPath, node.next.id);
      const edgeId = `${fullId}->${nextFullId}:next`;
      sink.pushEdge({
        id: edgeId,
        source: fullId,
        target: nextFullId,
        data: { kind: "next" }
      });
      walkNode(node.next, subflowPath, sink, visited);
    }
  }
}

// src/components/FlowchartView/traceStructureRecorder.ts
function createTraceStructureRecorder(options = {}) {
  const id = options.id ?? "trace-structure";
  const onChange = options.onChange;
  let nodes = [];
  let edges = [];
  const nodeIndex = /* @__PURE__ */ new Map();
  const seenEdgeIds = /* @__PURE__ */ new Set();
  const prevIdsOf = /* @__PURE__ */ new Map();
  const nextIdsOf = /* @__PURE__ */ new Map();
  const pendingMountPatches = /* @__PURE__ */ new Map();
  const notifier = createNotifier("traceStructureRecorder");
  function notifyChange() {
    if (onChange) {
      try {
        onChange({ nodes, edges });
      } catch (err) {
        devWarn(
          () => "[traceStructureRecorder] onChange callback threw \u2014 isolated.",
          err
        );
      }
    }
    notifier.notify();
  }
  function upsertNode(node) {
    const existing = nodeIndex.get(node.id);
    if (existing !== void 0) {
      nodes[existing] = {
        ...nodes[existing],
        ...node,
        data: { ...nodes[existing].data, ...node.data }
      };
    } else {
      nodeIndex.set(node.id, nodes.length);
      nodes.push(node);
    }
  }
  function pushEdge(edge) {
    if (seenEdgeIds.has(edge.id)) return;
    seenEdgeIds.add(edge.id);
    edges.push(edge);
    const kind = edge.data?.kind;
    if (kind === "loop") return;
    const source = asStageId(edge.source);
    const target = asStageId(edge.target);
    const nextArr = nextIdsOf.get(source) ?? [];
    nextArr.push(target);
    nextIdsOf.set(source, nextArr);
    const prevArr = prevIdsOf.get(target) ?? [];
    prevArr.push(source);
    prevIdsOf.set(target, prevArr);
    syncNeighborsOnto(source);
    syncNeighborsOnto(target);
  }
  function applyMountPatch(event) {
    const existing = nodeIndex.get(event.rootStageId);
    if (existing === void 0) return false;
    const node = nodes[existing];
    const data = {
      ...node.data,
      isSubflow: true,
      subflowId: event.subflowId
    };
    if (event.isLazy === true) data.isLazy = true;
    nodes[existing] = { ...node, data };
    return true;
  }
  function syncNeighborsOnto(stageId) {
    const idx = nodeIndex.get(stageId);
    if (idx === void 0) return;
    const node = nodes[idx];
    const prevs = prevIdsOf.get(stageId);
    const nexts = nextIdsOf.get(stageId);
    node.data.prevIds = prevs ? prevs.slice() : [];
    node.data.nextIds = nexts ? nexts.slice() : [];
  }
  const recorder = {
    id,
    onStageAdded(event) {
      const spec = event.spec;
      const type = event.type;
      const isDecider = type === "decider" || type === "selector" || spec.hasDecider === true || spec.hasSelector === true;
      const isFork = type === "fork";
      const isStreaming = type === "streaming";
      const isSubflow = !!spec.isSubflowRoot;
      const stageId = asStageId(event.stageId);
      const data = {
        label: event.name,
        isDecider,
        isFork,
        isStreaming,
        isSubflow,
        // L8.0 — seed prev/next from any edges that already fired
        // pointing AT this node. Convergence case: a fork-branch edge
        // from LoadOrder fires BEFORE the child's onStageAdded; this
        // line ensures the child's prevIds picks up the back-pointer.
        // Atomic copy (not shared ref) — see `syncNeighborsOnto` for
        // the panel-flagged consumer-safety rationale.
        prevIds: (prevIdsOf.get(stageId) ?? []).slice(),
        nextIds: (nextIdsOf.get(stageId) ?? []).slice()
      };
      if (spec.description !== void 0) data.description = spec.description;
      if (spec.icon !== void 0) data.icon = spec.icon;
      if (spec.subflowId !== void 0) data.subflowId = spec.subflowId;
      if (spec.isLazy === true) data.isLazy = true;
      if (event.isPausable === true) data.isPausable = true;
      upsertNode({
        id: event.stageId,
        type: "stage",
        // No layout here — downstream consumer applies positions.
        position: { x: 0, y: 0 },
        data
      });
      const pending = pendingMountPatches.get(event.stageId);
      if (pending) {
        pendingMountPatches.delete(event.stageId);
        for (const mount of pending) applyMountPatch(mount);
      }
      notifyChange();
    },
    onEdgeAdded(event) {
      const edgeId = `${event.from}->${event.to}:${event.kind}${event.label ? `:${event.label}` : ""}`;
      const data = { kind: event.kind };
      if (event.label !== void 0) data.label = event.label;
      const edge = {
        id: edgeId,
        source: event.from,
        target: event.to,
        data
      };
      if (event.label !== void 0) edge.label = event.label;
      pushEdge(edge);
      notifyChange();
    },
    onLoopEdgeAdded(event) {
      const edgeId = `${event.from}->${event.to}:loop`;
      pushEdge({
        id: edgeId,
        source: event.from,
        target: event.to,
        data: { kind: "loop" }
      });
      notifyChange();
    },
    onDeciderComplete(event) {
      const existing = nodeIndex.get(event.decider);
      if (existing === void 0) {
        devWarn(
          () => `[traceStructureRecorder] onDeciderComplete fired for unknown stageId "${event.decider}" \u2014 branch metadata dropped. Did the upstream fire onStageAdded for this id first?`
        );
        return;
      }
      const node = nodes[existing];
      const data = {
        ...node.data,
        branchIds: event.branchIds,
        // A sealed branch list IS decider-ness — engines that stamp neither
        // `type: 'decider'` nor `spec.hasDecider` still get a decision node.
        isDecider: true
      };
      if (event.defaultBranch !== void 0) data.defaultBranch = event.defaultBranch;
      nodes[existing] = { ...node, data };
      notifyChange();
    },
    onSubflowMounted(event) {
      if (!applyMountPatch(event)) {
        const queued = pendingMountPatches.get(event.rootStageId);
        if (queued) queued.push(event);
        else pendingMountPatches.set(event.rootStageId, [event]);
      }
      const subflowPath = event.subflowPath ?? event.subflowId;
      if (event.subflowSpec) {
        walkSubflowSpecInto(event.subflowSpec, subflowPath, {
          upsertNode,
          pushEdge
        });
      }
      notifyChange();
    }
  };
  return {
    recorder,
    getGraph() {
      return {
        nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
        edges: edges.map((e) => ({ ...e, data: e.data ? { ...e.data } : void 0 }))
      };
    },
    getGraphRef() {
      return { nodes, edges };
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset() {
      nodes = [];
      edges = [];
      nodeIndex.clear();
      seenEdgeIds.clear();
      prevIdsOf.clear();
      nextIdsOf.clear();
      pendingMountPatches.clear();
    }
  };
}

// src/components/SlotPillNode/SlotPillNode.tsx
var import_react48 = require("@xyflow/react");
var import_jsx_runtime27 = require("react/jsx-runtime");
function SlotPillNode({ data }) {
  const d = data;
  const lit = !!(d.active || d.selected);
  const unstyled = d.unstyled === true;
  const ui = componentStyles();
  const accent = lit ? theme.primary : d.done ? theme.nodeVisited : theme.textMuted;
  const opacity = d.dimmed && !lit ? 0.45 : 1;
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(
    "div",
    {
      "data-fp": "slot-pill-node",
      "data-active": lit || void 0,
      "data-done": d.done || void 0,
      "data-unstyled": unstyled || void 0,
      style: {
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        ...!unstyled && {
          gap: ui.spaceSm,
          padding: `0 ${ui.spaceMd}`,
          borderRadius: v("--fp-node-radius", "999px"),
          // full pill unless explicitly themed
          border: `${v("--fp-node-border-width", `calc(${ui.borderWidth} + 0.5px)`)} ${v("--fp-node-border-style", "solid")} ${v("--fp-node-border-color", lit ? theme.primary : theme.border)}`,
          // Fills derive from the theme so the pill follows dark/light — the lit
          // state is a faint primary tint over the resting node bg, unlit is the
          // resting bg itself (visible against the canvas via the border).
          background: lit ? `color-mix(in srgb, ${theme.primary} 14%, ${theme.bgSecondary})` : theme.bgSecondary,
          boxShadow: v("--fp-node-shadow", lit ? `0 0 0 2px color-mix(in srgb, ${theme.primary} 25%, transparent)` : "none"),
          opacity,
          fontSize: ui.body,
          fontWeight: `calc(${ui.weightStrong} - 100)`,
          color: lit ? theme.textPrimary : theme.textSecondary,
          transition: `opacity ${ui.fastDuration}, box-shadow ${ui.fastDuration}, border-color ${ui.fastDuration}`
        }
      },
      title: d.label,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
          "span",
          {
            "aria-hidden": true,
            style: {
              flexShrink: 0,
              width: 8,
              height: 8,
              ...!unstyled && { borderRadius: "50%", background: accent }
            }
          }
        ),
        d.icon ? /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { "aria-hidden": true, style: { flexShrink: 0 }, children: d.icon }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis" }, children: d.label }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_react48.Handle, { type: "target", position: import_react48.Position.Top, style: unstyled ? void 0 : { opacity: 0 } }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_react48.Handle, { type: "source", position: import_react48.Position.Bottom, style: unstyled ? void 0 : { opacity: 0 } })
      ]
    }
  );
}

// src/components/FlowchartView/_internal/traceGroupLayout.ts
function buildAdjacency(graph, fallbackW, fallbackH, nodeSize) {
  const preds = /* @__PURE__ */ new Map();
  const branchSuccs = /* @__PURE__ */ new Map();
  const width = /* @__PURE__ */ new Map();
  const height = /* @__PURE__ */ new Map();
  const resolvedStyle = /* @__PURE__ */ new Map();
  const ids = /* @__PURE__ */ new Set();
  for (const n of graph.nodes) {
    ids.add(n.id);
    const s = sizeOf(n, fallbackW, fallbackH, nodeSize);
    width.set(n.id, s.width);
    height.set(n.id, s.height);
    const resolved = nodeSize?.(n);
    if (resolved && resolved.width === s.width && resolved.height === s.height) {
      resolvedStyle.set(n.id, resolved);
    }
    preds.set(n.id, []);
    branchSuccs.set(n.id, []);
  }
  const seen = /* @__PURE__ */ new Set();
  for (const e of graph.edges) {
    if (e.data?.kind === "loop") continue;
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    const key = `${e.source}\0${e.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    preds.get(e.target).push(e.source);
    if (e.data?.kind === "fork-branch" || e.data?.kind === "decision-branch") {
      branchSuccs.get(e.source).push(e.target);
    }
  }
  return { preds, branchSuccs, width, height, resolvedStyle };
}
function assignRanks(preds, ids) {
  const rank = /* @__PURE__ */ new Map();
  const inProgress = /* @__PURE__ */ new Set();
  const visit = (id) => {
    const memo5 = rank.get(id);
    if (memo5 !== void 0) return memo5;
    if (inProgress.has(id)) return 0;
    inProgress.add(id);
    const ps = preds.get(id) ?? [];
    let r = 0;
    for (const p of ps) {
      const pr = visit(p);
      if (pr + 1 > r) r = pr + 1;
    }
    inProgress.delete(id);
    rank.set(id, r);
    return r;
  };
  for (const id of ids) visit(id);
  return rank;
}
function spanCenter(ids, center, width) {
  let left = Infinity;
  let right = -Infinity;
  for (const id of ids) {
    const c = center.get(id);
    if (c === void 0) continue;
    const w = width.get(id) ?? 0;
    if (c - w / 2 < left) left = c - w / 2;
    if (c + w / 2 > right) right = c + w / 2;
  }
  if (!Number.isFinite(left)) return 0;
  return (left + right) / 2;
}
function ancestorsOf(start, preds) {
  const seen = /* @__PURE__ */ new Set();
  const stack = [start];
  while (stack.length) {
    const n = stack.pop();
    if (seen.has(n)) continue;
    seen.add(n);
    for (const p of preds.get(n) ?? []) if (!seen.has(p)) stack.push(p);
  }
  return seen;
}
function lowestCommonAncestor(inputs, preds, rank) {
  if (inputs.length === 0) return void 0;
  let common = ancestorsOf(inputs[0], preds);
  for (let i = 1; i < inputs.length && common.size > 0; i++) {
    const a = ancestorsOf(inputs[i], preds);
    common = new Set([...common].filter((x) => a.has(x)));
  }
  let best;
  let bestRank = -Infinity;
  for (const id of common) {
    const r = rank.get(id) ?? -Infinity;
    if (r > bestRank) bestRank = r, best = id;
  }
  return best;
}
function orderBand(ids, preds, center, insertionIndex, siblingOrder) {
  if (siblingOrder && ids.length > 1) {
    const parents = new Set(ids.map((id) => preds.get(id)?.[0]));
    if (parents.size === 1) {
      const parent = [...parents][0];
      if (parent !== void 0) {
        const ordered = siblingOrder(parent, ids);
        const used = /* @__PURE__ */ new Set();
        const out = [];
        for (const id of ordered) if (ids.includes(id) && !used.has(id)) out.push(id), used.add(id);
        for (const id of ids) if (!used.has(id)) out.push(id);
        return out;
      }
    }
  }
  return [...ids].sort((a, b) => {
    const pa = preds.get(a)?.[0];
    const pb = preds.get(b)?.[0];
    const ca = pa !== void 0 ? center.get(pa) : void 0;
    const cb = pb !== void 0 ? center.get(pb) : void 0;
    if (ca !== void 0 && cb !== void 0 && ca !== cb) return ca - cb;
    return (insertionIndex.get(a) ?? 0) - (insertionIndex.get(b) ?? 0);
  });
}
function traceGroupLayout(graph, options = {}) {
  if (graph.nodes.length === 0) return { nodes: graph.nodes, edges: graph.edges };
  if (graph.nodes.length === 1) {
    const only = graph.nodes[0];
    return { nodes: [{ ...only, position: { x: 0, y: 0 } }], edges: graph.edges };
  }
  const rankSep = options.rankSep ?? 80;
  const nodeSep = options.nodeSep ?? 60;
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W2;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H2;
  const mergeCentering = options.enableMergeCentering ?? true;
  const mergeAlign = options.mergeAlign ?? "span";
  const ids = graph.nodes.map((n) => n.id);
  const insertionIndex = new Map(ids.map((id, i) => [id, i]));
  const { preds, branchSuccs, width, height, resolvedStyle } = buildAdjacency(
    graph,
    fallbackW,
    fallbackH,
    options.nodeSize
  );
  const rank = assignRanks(preds, ids);
  let maxRank = 0;
  for (const r of rank.values()) if (r > maxRank) maxRank = r;
  for (const id of ids) if (!rank.has(id)) rank.set(id, maxRank + 1);
  maxRank = 0;
  for (const r of rank.values()) if (r > maxRank) maxRank = r;
  const byRank = /* @__PURE__ */ new Map();
  const bandMaxH = /* @__PURE__ */ new Map();
  for (const id of ids) {
    const r = rank.get(id);
    (byRank.get(r) ?? byRank.set(r, []).get(r)).push(id);
    bandMaxH.set(r, Math.max(bandMaxH.get(r) ?? 0, height.get(id)));
  }
  const bandTop = /* @__PURE__ */ new Map();
  let yAcc = 0;
  for (let r = 0; r <= maxRank; r++) {
    bandTop.set(r, yAcc);
    yAcc += (bandMaxH.get(r) ?? fallbackH) + rankSep;
  }
  const center = /* @__PURE__ */ new Map();
  const mergeCenterX = (ps) => {
    if (mergeAlign === "fork-origin") {
      const lca = lowestCommonAncestor(ps, preds, rank);
      const lcaC = lca !== void 0 ? center.get(lca) : void 0;
      if (lcaC !== void 0) return lcaC;
    }
    return spanCenter(ps, center, width);
  };
  for (let r = 0; r <= maxRank; r++) {
    const band = orderBand(byRank.get(r) ?? [], preds, center, insertionIndex, options.siblingOrder);
    let cursor = -Infinity;
    let i = 0;
    while (i < band.length) {
      const id = band[i];
      const ps = preds.get(id) ?? [];
      const parent = ps.length === 1 ? ps[0] : void 0;
      const parentBranches = parent !== void 0 ? branchSuccs.get(parent) ?? [] : [];
      const isForkChild = parent !== void 0 && parentBranches.length >= 2 && parentBranches.includes(id);
      if (isForkChild) {
        const run = [];
        let j = i;
        while (j < band.length) {
          const cand = band[j];
          const cps = preds.get(cand) ?? [];
          if (cps.length === 1 && cps[0] === parent && parentBranches.includes(cand)) run.push(cand), j++;
          else break;
        }
        const totalW = run.reduce((s, rid) => s + width.get(rid), 0) + (run.length - 1) * nodeSep;
        let left = (center.get(parent) ?? 0) - totalW / 2;
        if (cursor !== -Infinity && left < cursor) left = cursor;
        let x = left;
        for (const rid of run) {
          const w = width.get(rid);
          center.set(rid, x + w / 2);
          x += w + nodeSep;
        }
        cursor = x;
        i = j;
      } else {
        const w = width.get(id);
        let desired;
        if (ps.length === 0) desired = (cursor === -Infinity ? 0 : cursor) + w / 2;
        else if (ps.length === 1) desired = center.get(ps[0]) ?? 0;
        else desired = mergeCenterX(ps);
        const cursorCenter = cursor === -Infinity ? -Infinity : cursor + w / 2;
        const c = Math.max(cursorCenter, desired);
        center.set(id, c);
        cursor = c + w / 2 + nodeSep;
        i++;
      }
    }
  }
  if (mergeCentering) {
    for (let r = maxRank; r >= 1; r--) {
      for (const id of byRank.get(r) ?? []) {
        const ps = preds.get(id) ?? [];
        if (ps.length > 1) center.set(id, mergeCenterX(ps));
      }
    }
  }
  const centerById = center;
  const positioned = graph.nodes.map((n) => {
    const r = rank.get(n.id);
    const w = width.get(n.id);
    const h = height.get(n.id);
    let x = (centerById.get(n.id) ?? 0) - w / 2;
    let y = (bandTop.get(r) ?? 0) + ((bandMaxH.get(r) ?? h) - h) / 2;
    if (n.parentId) {
      const pr = rank.get(n.parentId);
      const pw = width.get(n.parentId);
      const ph = height.get(n.parentId);
      if (pr !== void 0 && pw !== void 0 && ph !== void 0) {
        const parentX = (centerById.get(n.parentId) ?? 0) - pw / 2;
        const parentY = (bandTop.get(pr) ?? 0) + ((bandMaxH.get(pr) ?? ph) - ph) / 2;
        x -= parentX;
        y -= parentY;
      }
    }
    const styleSize = resolvedStyle.get(n.id);
    if (styleSize) {
      return { ...n, position: { x, y }, style: { ...n.style ?? {}, width: styleSize.width, height: styleSize.height } };
    }
    return { ...n, position: { x, y } };
  });
  return { nodes: positioned, edges: graph.edges };
}
function createTraceGroupLayout(options = {}) {
  return (graph) => traceGroupLayout(graph, options);
}

// src/components/FlowchartView/createNodeViewRecorder.ts
function baseStageIdOf(runtimeStageId) {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}
function createNodeViewRecorder(options) {
  const id = options.id ?? "node-view";
  const structure = options.structure;
  if (!structure) {
    throw new Error(
      "[createNodeViewRecorder] `structure` option is required. Pass the handle returned by `createTraceStructureRecorder()`."
    );
  }
  let executionsOf = /* @__PURE__ */ new Map();
  let commitRefsOf = /* @__PURE__ */ new Map();
  let stageIdOfRuntimeStageId = /* @__PURE__ */ new Map();
  let attemptsOfRuntimeStageId = /* @__PURE__ */ new Map();
  const notifier = createNotifier("node-view");
  const unsubStructure = structure.subscribe(() => notifier.notify());
  function recordExecution(event) {
    const rsid = event.traversalContext?.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createNodeViewRecorder] onStageExecuted event without traversalContext.runtimeStageId \u2014 execution attribution dropped (stage=${event.stageName}).`
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf(rsid));
    const runtimeStageId = asRuntimeStageId(rsid);
    const execList = executionsOf.get(stageId) ?? [];
    const record2 = {
      runtimeStageId,
      ...event.traversalContext.iteration !== void 0 && {
        iteration: event.traversalContext.iteration
      },
      ...event.startTime !== void 0 && { startMs: event.startTime },
      ...event.endTime !== void 0 && { endMs: event.endTime }
    };
    execList.push(record2);
    executionsOf.set(stageId, execList);
    stageIdOfRuntimeStageId.set(runtimeStageId, stageId);
    notifier.notify();
  }
  function recordError(event) {
    const rsid = event.traversalContext?.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createNodeViewRecorder] onError event without traversalContext.runtimeStageId \u2014 error attribution dropped (stage=${event.stageName}).`
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf(rsid));
    const runtimeStageId = asRuntimeStageId(rsid);
    const execList = executionsOf.get(stageId);
    const matchIdx = execList ? execList.findIndex((e) => e.runtimeStageId === runtimeStageId) : -1;
    if (!execList || matchIdx === -1) {
      const synth = {
        runtimeStageId,
        errorMessage: event.message ?? "error"
      };
      if (execList) {
        execList.push(synth);
      } else {
        executionsOf.set(stageId, [synth]);
      }
    } else {
      const match = execList[matchIdx];
      execList[matchIdx] = { ...match, errorMessage: event.message ?? "error" };
    }
    stageIdOfRuntimeStageId.set(runtimeStageId, stageId);
    notifier.notify();
  }
  function recordRetry(event) {
    const rsid = event.traversalContext?.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createNodeViewRecorder] onStageRetry event without traversalContext.runtimeStageId \u2014 attempt attribution dropped (stage=${event.stageName}).`
      );
      return;
    }
    const attempt = event.attempt;
    const prior = attemptsOfRuntimeStageId.get(rsid);
    const attemptsMade = typeof attempt === "number" && Number.isFinite(attempt) && attempt >= 1 ? Math.floor(attempt) + 1 : (prior?.attempts ?? 1) + 1;
    attemptsOfRuntimeStageId.set(rsid, {
      attempts: Math.max(attemptsMade, prior?.attempts ?? 0),
      ...typeof event.maxAttempts === "number" && Number.isFinite(event.maxAttempts) ? { maxAttempts: event.maxAttempts } : prior?.maxAttempts !== void 0 ? { maxAttempts: prior.maxAttempts } : {}
    });
    notifier.notify();
  }
  function recordCommit(event) {
    const rsid = event.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createNodeViewRecorder] onCommit event without runtimeStageId \u2014 commit attribution dropped (stage=${event.stage ?? event.stageId ?? "?"}).`
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf(rsid));
    const refs = commitRefsOf.get(stageId) ?? [];
    refs.push(asRuntimeStageId(rsid));
    commitRefsOf.set(stageId, refs);
    stageIdOfRuntimeStageId.set(asRuntimeStageId(rsid), stageId);
    notifier.notify();
  }
  const recorder = {
    id,
    onStageExecuted: recordExecution,
    onError: recordError,
    onStageRetry: recordRetry,
    onCommit: recordCommit,
    // onRunStart / onRunEnd — no-op for now (state stays alive across
    // runs; consumers call .reset() between runs if they want fresh
    // state). Listed for shape conformance with FlowRecorder.
    onRunStart() {
    },
    onRunEnd() {
    }
  };
  function buildView(structNode) {
    const stageId = asStageId(structNode.id);
    const execs = executionsOf.get(stageId) ?? [];
    const commitRefs = commitRefsOf.get(stageId) ?? [];
    const visitedInRun = execs.length > 0;
    const executionCount = execs.length;
    const firstExecutedAt = execs.length > 0 && execs[0].startMs !== void 0 ? execs[0].startMs : null;
    const lastExecutedAt = execs.length > 0 && execs[execs.length - 1].endMs !== void 0 ? execs[execs.length - 1].endMs : null;
    let totalDurationMs = 0;
    let errorCount = 0;
    for (const e of execs) {
      if (e.startMs !== void 0 && e.endMs !== void 0) {
        totalDurationMs += e.endMs - e.startMs;
      }
      if (e.errorMessage) errorCount++;
    }
    const withAttempts = execs.map((e) => {
      const attemptInfo = attemptsOfRuntimeStageId.get(e.runtimeStageId);
      if (!attemptInfo || attemptInfo.attempts <= 1) return { ...e };
      return {
        ...e,
        attempts: attemptInfo.attempts,
        ...attemptInfo.maxAttempts !== void 0 && { maxAttempts: attemptInfo.maxAttempts }
      };
    });
    const retriedExecutionCount = withAttempts.filter(
      (e) => e.attempts !== void 0 && e.attempts > 1
    ).length;
    const d = structNode.data;
    return {
      stageId,
      label: d.label,
      type: structNode.type ?? "stage",
      isDecider: d.isDecider,
      isFork: d.isFork,
      isSubflow: d.isSubflow,
      isStreaming: d.isStreaming,
      isPausable: d.isPausable === true,
      ...d.description !== void 0 && { description: d.description },
      ...d.icon !== void 0 && { icon: d.icon },
      ...d.subflowId !== void 0 && { subflowId: d.subflowId },
      // L8.1 Panel 2 must-fix: branchIds is a live ref from the
      // structure translator's internal graph — defensive copy via
      // slice() prevents consumer mutation from corrupting it.
      ...d.branchIds !== void 0 && { branchIds: d.branchIds.slice() },
      ...d.defaultBranch !== void 0 && { defaultBranch: d.defaultBranch },
      // Note: structure translator always sets prevIds/nextIds (never
      // undefined). The slice() copies defend against consumer mutation.
      prevIds: d.prevIds.slice(),
      nextIds: d.nextIds.slice(),
      executions: withAttempts,
      visitedInRun,
      executionCount,
      firstExecutedAt,
      lastExecutedAt,
      totalDurationMs,
      errorCount,
      retriedExecutionCount,
      commitRuntimeStageIds: commitRefs.slice()
    };
  }
  let cachedIndex = null;
  let cachedOwnVersion = -1;
  let cachedStructureVersion = -1;
  return {
    recorder,
    getIndex() {
      const own2 = notifier.version();
      const struct = structure.version();
      if (cachedIndex !== null && cachedOwnVersion === own2 && cachedStructureVersion === struct) {
        return cachedIndex;
      }
      const graphRef = structure.getGraphRef();
      const byStageId = /* @__PURE__ */ new Map();
      const byRuntimeStageId = /* @__PURE__ */ new Map();
      const all = [];
      for (const structNode of graphRef.nodes) {
        const view = buildView(structNode);
        byStageId.set(view.stageId, view);
        all.push(view);
        for (const exec of view.executions) {
          byRuntimeStageId.set(exec.runtimeStageId, view);
        }
        for (const rsid of view.commitRuntimeStageIds) {
          byRuntimeStageId.set(rsid, view);
        }
      }
      cachedIndex = { byStageId, byRuntimeStageId, all };
      cachedOwnVersion = own2;
      cachedStructureVersion = struct;
      return cachedIndex;
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset() {
      executionsOf = /* @__PURE__ */ new Map();
      commitRefsOf = /* @__PURE__ */ new Map();
      stageIdOfRuntimeStageId = /* @__PURE__ */ new Map();
      attemptsOfRuntimeStageId = /* @__PURE__ */ new Map();
      cachedIndex = null;
      cachedOwnVersion = -1;
      cachedStructureVersion = -1;
      void unsubStructure;
    }
  };
}

// src/components/FlowchartView/createCommitFlowRecorder.ts
function baseStageIdOf2(runtimeStageId) {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}
function createCommitFlowRecorder(options) {
  const id = options.id ?? "commit-flow";
  const structure = options.structure;
  if (!structure) {
    throw new Error(
      "[createCommitFlowRecorder] `structure` option is required. Pass the handle returned by `createTraceStructureRecorder()`."
    );
  }
  let rawCommits = [];
  let attemptsOfRuntimeStageId = /* @__PURE__ */ new Map();
  const notifier = createNotifier("commit-flow");
  const unsubStructure = structure.subscribe(() => notifier.notify());
  function recordCommit(event) {
    const rsid = event.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createCommitFlowRecorder] onCommit without runtimeStageId \u2014 commit dropped (stage=${event.stage ?? event.stageId ?? "?"}).`
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf2(rsid));
    rawCommits.push({
      runtimeStageId: asRuntimeStageId(rsid),
      stageId,
      commitIdx: rawCommits.length,
      updates: event.updates ? { ...event.updates } : {},
      reads: event.reads ? [...event.reads] : []
    });
    notifier.notify();
  }
  function recordRetry(event) {
    const rsid = event.traversalContext?.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createCommitFlowRecorder] onStageRetry without runtimeStageId \u2014 attempt attribution dropped (stage=${event.stageName}).`
      );
      return;
    }
    const attempt = event.attempt;
    const prior = attemptsOfRuntimeStageId.get(rsid) ?? 1;
    const attemptsMade = typeof attempt === "number" && Number.isFinite(attempt) && attempt >= 1 ? Math.floor(attempt) + 1 : prior + 1;
    if (attemptsMade > prior) {
      attemptsOfRuntimeStageId.set(rsid, attemptsMade);
      notifier.notify();
    }
  }
  const recorder = {
    id,
    onCommit: recordCommit,
    onStageRetry: recordRetry,
    onStageExecuted() {
    },
    onError() {
    },
    onRunStart() {
    },
    onRunEnd() {
    }
  };
  function buildIndex() {
    const graphRef = structure.getGraphRef();
    const nodeByStageId = /* @__PURE__ */ new Map();
    for (const n of graphRef.nodes) nodeByStageId.set(n.id, n);
    const writersOf = /* @__PURE__ */ new Map();
    for (const rc of rawCommits) {
      for (const k of Object.keys(rc.updates)) {
        const list2 = writersOf.get(k) ?? [];
        list2.push({ commitIdx: rc.commitIdx, runtimeStageId: rc.runtimeStageId });
        writersOf.set(k, list2);
      }
    }
    const commitsOfStage = /* @__PURE__ */ new Map();
    for (const rc of rawCommits) {
      const list2 = commitsOfStage.get(rc.stageId) ?? [];
      list2.push(rc.commitIdx);
      commitsOfStage.set(rc.stageId, list2);
    }
    const commits = [];
    const byRuntimeStageId = /* @__PURE__ */ new Map();
    const dataEdges = [];
    for (const rc of rawCommits) {
      const structNode = nodeByStageId.get(rc.stageId);
      const structuralPrevIds = (structNode?.data.prevIds ?? []).slice();
      const structuralNextIds = (structNode?.data.nextIds ?? []).slice();
      const runtimePrevIds = [];
      for (const pStageId of structuralPrevIds) {
        const list2 = commitsOfStage.get(pStageId);
        if (!list2) continue;
        let chosenIdx = null;
        for (let i = list2.length - 1; i >= 0; i--) {
          if (list2[i] < rc.commitIdx) {
            chosenIdx = list2[i];
            break;
          }
        }
        if (chosenIdx !== null) {
          runtimePrevIds.push(rawCommits[chosenIdx].runtimeStageId);
        }
      }
      const runtimeNextIds = [];
      for (const nStageId of structuralNextIds) {
        const list2 = commitsOfStage.get(nStageId);
        if (!list2) continue;
        let chosenIdx = null;
        for (let i = 0; i < list2.length; i++) {
          if (list2[i] > rc.commitIdx) {
            chosenIdx = list2[i];
            break;
          }
        }
        if (chosenIdx !== null) {
          runtimeNextIds.push(rawCommits[chosenIdx].runtimeStageId);
        }
      }
      const dataDependencies = [];
      for (const key of rc.reads) {
        const writers = writersOf.get(key);
        let source = null;
        if (writers) {
          for (let i = writers.length - 1; i >= 0; i--) {
            if (writers[i].commitIdx < rc.commitIdx) {
              source = writers[i];
              break;
            }
          }
        }
        if (source) {
          dataDependencies.push({
            key,
            sourceRuntimeStageId: source.runtimeStageId,
            sourceCommitIdx: source.commitIdx
          });
          dataEdges.push(
            Object.freeze({ from: source.commitIdx, to: rc.commitIdx, key })
          );
        } else {
          dataDependencies.push({
            key,
            sourceRuntimeStageId: null,
            sourceCommitIdx: null
          });
        }
      }
      const attempts = attemptsOfRuntimeStageId.get(rc.runtimeStageId);
      const view = {
        runtimeStageId: rc.runtimeStageId,
        stageId: rc.stageId,
        commitIdx: rc.commitIdx,
        structuralPrevIds,
        structuralNextIds,
        runtimePrevIds,
        runtimeNextIds,
        dataDependencies,
        updates: { ...rc.updates },
        reads: rc.reads.slice(),
        ...attempts !== void 0 && attempts > 1 && { attempts }
      };
      commits.push(view);
      byRuntimeStageId.set(view.runtimeStageId, view);
    }
    return { commits, byRuntimeStageId, dataEdges };
  }
  let cachedIndex = null;
  let cachedOwnVersion = -1;
  let cachedStructureVersion = -1;
  return {
    recorder,
    getIndex() {
      const own2 = notifier.version();
      const struct = structure.version();
      if (cachedIndex !== null && cachedOwnVersion === own2 && cachedStructureVersion === struct) {
        return cachedIndex;
      }
      cachedIndex = buildIndex();
      cachedOwnVersion = own2;
      cachedStructureVersion = struct;
      return cachedIndex;
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset() {
      rawCommits = [];
      attemptsOfRuntimeStageId = /* @__PURE__ */ new Map();
      cachedIndex = null;
      cachedOwnVersion = -1;
      cachedStructureVersion = -1;
      void unsubStructure;
    }
  };
}
function backtraceDataFlow(index, startRuntimeStageId) {
  const start = index.byRuntimeStageId.get(startRuntimeStageId);
  if (!start) return [];
  const visitedIdx = /* @__PURE__ */ new Set([start.commitIdx]);
  const queue = [start.commitIdx];
  const collectedIdxs = /* @__PURE__ */ new Set([start.commitIdx]);
  let head = 0;
  while (head < queue.length) {
    const cur = index.commits[queue[head++]];
    if (!cur) continue;
    for (const dep of cur.dataDependencies) {
      if (dep.sourceCommitIdx === null) continue;
      if (visitedIdx.has(dep.sourceCommitIdx)) continue;
      visitedIdx.add(dep.sourceCommitIdx);
      collectedIdxs.add(dep.sourceCommitIdx);
      queue.push(dep.sourceCommitIdx);
    }
  }
  return Array.from(collectedIdxs).sort((a, b) => a - b).map((idx) => index.commits[idx]).filter((c) => c !== void 0);
}

// src/components/FlowchartView/createTraceBundle.ts
function createTraceBundle(options = {}) {
  const structure = createTraceStructureRecorder(options.structure);
  const runtimeOverlay = createTraceRuntimeOverlay(options.runtimeOverlay);
  const nodeView = createNodeViewRecorder({
    ...options.nodeView ?? {},
    structure
  });
  const commitFlow = createCommitFlowRecorder({
    ...options.commitFlow ?? {},
    structure
  });
  return {
    structure,
    runtimeOverlay,
    nodeView,
    commitFlow,
    attachTo(executor) {
      executor.attachFlowRecorder(runtimeOverlay.recorder);
      executor.attachFlowRecorder(nodeView.recorder);
      executor.attachFlowRecorder(commitFlow.recorder);
      if (typeof executor.attachScopeRecorder === "function") {
        executor.attachScopeRecorder(nodeView.recorder);
        executor.attachScopeRecorder(commitFlow.recorder);
      } else {
        devWarn(
          () => "[createTraceBundle] executor.attachScopeRecorder is missing \u2014 NodeView.commitRuntimeStageIds[] AND CommitFlow.commits[] will be empty. Upgrade to footprintjs v6.0+."
        );
      }
    }
  };
}

// src/components/FlowchartView/_internal/useTranslator.ts
var import_react49 = require("react");
function useTranslator(handle, getSnapshot) {
  const subscribe = (0, import_react49.useMemo)(() => handle.subscribe.bind(handle), [handle]);
  const getVersion = (0, import_react49.useMemo)(() => handle.version.bind(handle), [handle]);
  const version = (0, import_react49.useSyncExternalStore)(subscribe, getVersion, getVersion);
  return (0, import_react49.useMemo)(() => getSnapshot(), [version, getSnapshot]);
}

// src/components/FlowchartView/walkHelpers.ts
function walkForward(index, startId, options = {}) {
  return bfsWalk(index, startId, (n) => n.nextIds, options);
}
function walkBackward(index, startId, options = {}) {
  return bfsWalk(index, startId, (n) => n.prevIds, options);
}
function backtraceStructural(index, stageId, options = {}) {
  const start = index.byStageId.get(stageId);
  if (!start) return [];
  const chain = [start];
  const cap = options.maxDepth ?? index.all.length;
  const visited = /* @__PURE__ */ new Set([stageId]);
  let cur = start;
  let hops = 0;
  while (cur && hops < cap) {
    if (cur.prevIds.length === 0 || cur.prevIds.length > 1) {
      break;
    }
    const nextId = cur.prevIds[0];
    if (visited.has(nextId)) break;
    visited.add(nextId);
    const next = index.byStageId.get(nextId);
    if (!next) break;
    if (options.onlyVisited && !next.visitedInRun) break;
    chain.unshift(next);
    cur = next;
    hops++;
  }
  return chain;
}
function forwardtraceStructural(index, stageId, options = {}) {
  const start = index.byStageId.get(stageId);
  if (!start) return [];
  const chain = [start];
  const cap = options.maxDepth ?? index.all.length;
  const visited = /* @__PURE__ */ new Set([stageId]);
  let cur = start;
  let hops = 0;
  while (cur && hops < cap) {
    if (cur.nextIds.length === 0 || cur.nextIds.length > 1) break;
    const nextId = cur.nextIds[0];
    if (visited.has(nextId)) break;
    visited.add(nextId);
    const next = index.byStageId.get(nextId);
    if (!next) break;
    if (options.onlyVisited && !next.visitedInRun) break;
    chain.push(next);
    cur = next;
    hops++;
  }
  return chain;
}
function bfsWalk(index, startId, neighborsOf, options) {
  const start = index.byStageId.get(startId);
  if (!start) return [];
  const cap = options.maxDepth ?? index.all.length;
  const visited = /* @__PURE__ */ new Set();
  visited.add(startId);
  const out = [];
  if (options.includeStart) out.push(start);
  const queue = [[start, 0]];
  let head = 0;
  while (head < queue.length) {
    const [node, depth] = queue[head++];
    if (depth >= cap) continue;
    for (const neighborId of neighborsOf(node)) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      const neighbor = index.byStageId.get(neighborId);
      if (!neighbor) continue;
      if (options.onlyVisited && !neighbor.visitedInRun) continue;
      out.push(neighbor);
      queue.push([neighbor, depth + 1]);
    }
  }
  return out;
}

// src/components/FlowchartView/NodeInspector.tsx
var import_react50 = require("react");
var import_jsx_runtime28 = require("react/jsx-runtime");
function NodeInspector({
  index,
  selectedId,
  onNavigate,
  onlyVisited = false,
  className,
  style
}) {
  const view = selectedId ? index.byStageId.get(selectedId) ?? null : null;
  const prevChain = (0, import_react50.useMemo)(
    () => view ? backtraceStructural(index, view.stageId, { onlyVisited }) : [],
    [index, view, onlyVisited]
  );
  const nextChain = (0, import_react50.useMemo)(
    () => view ? forwardtraceStructural(index, view.stageId, { onlyVisited }) : [],
    [index, view, onlyVisited]
  );
  if (!view) {
    return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
      "div",
      {
        className,
        style: {
          padding: 16,
          color: theme.textMuted,
          fontStyle: "italic",
          ...style
        },
        children: "Select a stage to inspect."
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(
    "div",
    {
      className,
      style: {
        padding: 14,
        color: theme.textPrimary,
        fontSize: 13,
        overflow: "auto",
        ...style
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { style: { fontSize: 16, fontWeight: 700, color: theme.textPrimary }, children: view.label }),
          /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { style: { fontSize: 11, fontFamily: "monospace", color: theme.textMuted, marginTop: 2 }, children: [
            view.stageId,
            " \xB7 ",
            view.type,
            view.isDecider && " \xB7 decider",
            view.isFork && " \xB7 fork",
            view.isSubflow && " \xB7 subflow",
            view.isStreaming && " \xB7 streaming",
            view.isPausable && " \xB7 pausable"
          ] }),
          view.description && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { style: { fontSize: 12, color: theme.textSecondary, marginTop: 6 }, children: view.description })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(Section, { title: "Runtime", children: [
          /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Row, { label: "Visited", value: view.visitedInRun ? "yes" : "no" }),
          view.visitedInRun && /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(import_jsx_runtime28.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Row, { label: "Executions", value: String(view.executionCount) }),
            view.firstExecutedAt !== null && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Row, { label: "First at", value: `${view.firstExecutedAt.toFixed(1)}ms` }),
            view.lastExecutedAt !== null && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Row, { label: "Last at", value: `${view.lastExecutedAt.toFixed(1)}ms` }),
            view.totalDurationMs > 0 && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Row, { label: "Total", value: `${view.totalDurationMs.toFixed(1)}ms` }),
            view.errorCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Row, { label: "Errors", value: String(view.errorCount), valueColor: theme.error })
          ] })
        ] }),
        prevChain.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Section, { title: `Prev chain (${prevChain.length - 1} hops)`, children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Crumbs, { nodes: prevChain.slice(0, -1), onClick: onNavigate }) }),
        view.prevIds.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Section, { title: "Multiple prev (convergence)", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
          Crumbs,
          {
            nodes: view.prevIds.map((id) => index.byStageId.get(id)).filter((n) => n !== void 0),
            onClick: onNavigate
          }
        ) }),
        nextChain.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Section, { title: `Next chain (${nextChain.length - 1} hops)`, children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Crumbs, { nodes: nextChain.slice(1), onClick: onNavigate }) }),
        view.nextIds.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Section, { title: "Multiple next (fork/decider)", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
          Crumbs,
          {
            nodes: view.nextIds.map((id) => index.byStageId.get(id)).filter((n) => n !== void 0),
            onClick: onNavigate
          }
        ) }),
        view.commitRuntimeStageIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Section, { title: `Commits (${view.commitRuntimeStageIds.length})`, children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { style: { fontFamily: "monospace", fontSize: 11, color: theme.textSecondary }, children: view.commitRuntimeStageIds.map((rsid) => /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { children: rsid }, rsid)) }) })
      ]
    }
  );
}
function Section({ title, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { style: { marginBottom: 14 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
      "div",
      {
        style: {
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: theme.textMuted,
          marginBottom: 6
        },
        children: title
      }
    ),
    children
  ] });
}
function Row({ label, value, valueColor }) {
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("span", { style: { color: theme.textMuted }, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("span", { style: { color: valueColor ?? theme.textSecondary, fontFamily: "monospace" }, children: value })
  ] });
}
function Crumbs({ nodes, onClick }) {
  if (nodes.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: nodes.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
      "button",
      {
        onClick: onClick ? () => onClick(n.stageId) : void 0,
        style: {
          fontSize: 11,
          fontFamily: "monospace",
          padding: "3px 8px",
          borderRadius: 4,
          border: `1px solid ${theme.border}`,
          background: "transparent",
          color: n.visitedInRun ? theme.success : theme.textSecondary,
          cursor: onClick ? "pointer" : "default"
        },
        children: n.label
      }
    ),
    i < nodes.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("span", { style: { color: theme.textMuted, fontSize: 10 }, children: "\u203A" })
  ] }, n.stageId)) });
}

// src/components/FlowchartView/CommitInspector.tsx
var import_react51 = require("react");
var import_jsx_runtime29 = require("react/jsx-runtime");
function CommitInspector({
  index,
  selectedRuntimeStageId,
  onNavigate,
  className,
  style
}) {
  const view = selectedRuntimeStageId ? index.byRuntimeStageId.get(selectedRuntimeStageId) ?? null : null;
  const lineage = (0, import_react51.useMemo)(
    () => view ? backtraceDataFlow(index, view.runtimeStageId) : [],
    [index, view]
  );
  if (!view) {
    return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
      "div",
      {
        className,
        style: {
          padding: 16,
          color: theme.textMuted,
          fontStyle: "italic",
          ...style
        },
        children: "Select a commit to inspect."
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)(
    "div",
    {
      className,
      style: {
        padding: 14,
        color: theme.textPrimary,
        fontSize: 13,
        overflow: "auto",
        ...style
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { style: { fontSize: 16, fontWeight: 700, color: theme.textPrimary }, children: view.stageId }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)(
            "div",
            {
              style: {
                fontSize: 11,
                fontFamily: "monospace",
                color: theme.textMuted,
                marginTop: 2
              },
              children: [
                view.runtimeStageId,
                " \xB7 commitIdx ",
                view.commitIdx
              ]
            }
          )
        ] }),
        view.structuralPrevIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Section2, { title: "Structural prev (chart shape)", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(PlainTags, { labels: view.structuralPrevIds }) }),
        view.structuralNextIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Section2, { title: "Structural next (chart shape)", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(PlainTags, { labels: view.structuralNextIds }) }),
        view.runtimePrevIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Section2, { title: "Runtime prev (this execution)", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(RuntimeRefs, { refs: view.runtimePrevIds, onClick: onNavigate }) }),
        view.runtimeNextIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Section2, { title: "Runtime next (this execution)", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(RuntimeRefs, { refs: view.runtimeNextIds, onClick: onNavigate }) }),
        Object.keys(view.updates).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Section2, { title: `Updates (${Object.keys(view.updates).length})`, children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(KeyValueGrid, { entries: Object.entries(Object.getOwnPropertyDescriptors(view.updates)).filter(([, descriptor]) => descriptor.enumerable) }) }),
        view.reads.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Section2, { title: `Reads (${view.reads.length})`, children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(PlainTags, { labels: view.reads }) }),
        view.dataDependencies.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Section2, { title: `Data dependencies (${view.dataDependencies.length})`, children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("table", { style: { fontSize: 11, fontFamily: "monospace", width: "100%", borderCollapse: "collapse" }, children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("tbody", { children: view.dataDependencies.map((dep) => /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("td", { style: { color: theme.textSecondary, padding: "2px 8px 2px 0" }, children: dep.key }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("td", { style: { color: dep.sourceRuntimeStageId ? theme.textPrimary : theme.textMuted }, children: dep.sourceRuntimeStageId ? /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)(
            "button",
            {
              onClick: onNavigate ? () => onNavigate(dep.sourceRuntimeStageId) : void 0,
              style: crumbButtonStyle(onNavigate !== void 0),
              children: [
                "\u2190 ",
                dep.sourceRuntimeStageId
              ]
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("em", { children: "(no prior writer \u2014 default or external)" }) })
        ] }, dep.key)) }) }) }),
        lineage.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Section2, { title: `Lineage chain (${lineage.length - 1} ancestor commits)`, children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: lineage.slice(0, -1).map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
            "button",
            {
              onClick: onNavigate ? () => onNavigate(c.runtimeStageId) : void 0,
              style: crumbButtonStyle(onNavigate !== void 0),
              children: c.runtimeStageId
            }
          ),
          i < lineage.length - 2 && /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { style: { color: theme.textMuted, fontSize: 10 }, children: "\u2192" })
        ] }, c.runtimeStageId)) }) })
      ]
    }
  );
}
function Section2({ title, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { style: { marginBottom: 14 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
      "div",
      {
        style: {
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: theme.textMuted,
          marginBottom: 6
        },
        children: title
      }
    ),
    children
  ] });
}
function PlainTags({ labels }) {
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: labels.map((l) => /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
    "span",
    {
      style: {
        fontSize: 11,
        fontFamily: "monospace",
        padding: "2px 6px",
        borderRadius: 3,
        background: "var(--fp-bg-secondary, transparent)",
        color: theme.textSecondary
      },
      children: l
    },
    l
  )) });
}
function RuntimeRefs({
  refs,
  onClick
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: refs.map((r) => /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
    "button",
    {
      onClick: onClick ? () => onClick(r) : void 0,
      style: crumbButtonStyle(onClick !== void 0),
      children: r
    },
    r
  )) });
}
function KeyValueGrid({ entries }) {
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("table", { style: { fontSize: 11, fontFamily: "monospace", width: "100%", borderCollapse: "collapse" }, children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("tbody", { children: entries.map(([k, descriptor]) => /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("tr", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("td", { style: { color: theme.textSecondary, padding: "2px 8px 2px 0", verticalAlign: "top" }, children: k }),
    /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("td", { style: { color: theme.textPrimary, wordBreak: "break-word" }, children: "value" in descriptor ? typeof descriptor.value === "string" ? descriptor.value : formatRecordedValue(descriptor.value) : "[Unavailable]" })
  ] }, k)) }) });
}
function crumbButtonStyle(clickable) {
  return {
    fontSize: 11,
    fontFamily: "monospace",
    padding: "3px 8px",
    borderRadius: 4,
    border: `1px solid ${theme.border}`,
    background: "transparent",
    color: theme.textSecondary,
    cursor: clickable ? "pointer" : "default"
  };
}

// src/components/FlowchartView/buildCommitChainTree.ts
function indexGraph(graph) {
  const byStageId = /* @__PURE__ */ new Map();
  const allNodeIds = [];
  for (const node of graph.nodes) {
    const stageId = asStageId(node.id);
    allNodeIds.push(stageId);
    byStageId.set(stageId, { branchChildren: [], linearNext: [] });
  }
  for (const edge of graph.edges) {
    const kind = edge.data?.kind;
    if (kind === "loop") continue;
    const sourceEntry = byStageId.get(asStageId(edge.source));
    if (!sourceEntry) continue;
    const target = asStageId(edge.target);
    if (!byStageId.has(target)) continue;
    if (kind === "fork-branch" || kind === "decision-branch") {
      sourceEntry.branchChildren.push(target);
    } else {
      sourceEntry.linearNext.push(target);
    }
  }
  return { byStageId, allNodeIds };
}
function findSeed(graph, fromStageId) {
  if (fromStageId) {
    const n = graph.nodes.find((n2) => n2.id === fromStageId);
    return n ? asStageId(n.id) : null;
  }
  const hasIncoming = /* @__PURE__ */ new Set();
  for (const e of graph.edges) {
    if (e.data?.kind !== "loop") hasIncoming.add(e.target);
  }
  const seed = graph.nodes.find((n) => !hasIncoming.has(n.id)) ?? graph.nodes[0];
  return seed ? asStageId(seed.id) : null;
}
function bfsReachable(startId, index) {
  const reachable = /* @__PURE__ */ new Set([startId]);
  const order = [startId];
  const queue = [startId];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const entry = index.byStageId.get(cur);
    if (!entry) continue;
    for (const next of [...entry.branchChildren, ...entry.linearNext]) {
      if (reachable.has(next)) continue;
      reachable.add(next);
      order.push(next);
      queue.push(next);
    }
  }
  return { order, reachable };
}
function findConvergence(branches, index) {
  if (branches.length < 2) return null;
  const firstWalk = bfsReachable(branches[0], index);
  const reachableSets = [firstWalk.reachable];
  for (let i = 1; i < branches.length; i++) {
    reachableSets.push(bfsReachable(branches[i], index).reachable);
  }
  const startSet = new Set(branches);
  for (const candidate of firstWalk.order) {
    if (startSet.has(candidate)) continue;
    if (reachableSets.every((s) => s.has(candidate))) {
      return candidate;
    }
  }
  return null;
}
function walkChain(startId, untilId, index, visited) {
  const items = [];
  let cur = startId;
  while (cur !== null && cur !== untilId) {
    if (visited.has(cur)) break;
    visited.add(cur);
    const entry = index.byStageId.get(cur);
    if (!entry) break;
    const branches = entry.branchChildren;
    const linearNexts = entry.linearNext;
    items.push({ kind: "leaf", stageId: cur });
    if (branches.length >= 2) {
      const convergence = findConvergence(branches, index);
      const branchChains = [];
      for (const b of branches) {
        const branchVisited = new Set(visited);
        const sub = walkChain(b, convergence, index, branchVisited);
        if (sub !== null) branchChains.push(sub);
        for (const v2 of branchVisited) visited.add(v2);
      }
      if (branchChains.length > 0) {
        items.push({ kind: "parallel", branches: branchChains });
      }
      cur = convergence;
    } else if (branches.length === 1 && linearNexts.length === 0) {
      cur = branches[0];
    } else if (linearNexts.length >= 1) {
      if (linearNexts.length > 1) {
        devWarn(
          () => `[buildCommitChainTree] stage '${cur}' has ${linearNexts.length} linear-next edges; chain decomposition follows only the first ('${linearNexts[0]}'). Use 'fork-branch' or 'decision-branch' edge kinds to express parallel/conditional splits.`
        );
      }
      cur = linearNexts[0];
    } else {
      cur = null;
    }
  }
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  return { kind: "serial", items };
}
function structureAsChainTree(graph, options = {}) {
  if (graph.nodes.length === 0) return null;
  const index = indexGraph(graph);
  const seed = findSeed(graph, options.rootStageId);
  if (!seed) return null;
  const visited = /* @__PURE__ */ new Set();
  return walkChain(seed, null, index, visited);
}
function buildCommitChainTree(graph, commitFlow, options = {}) {
  const structural = structureAsChainTree(graph, options);
  if (!structural) return null;
  const commitsByStageId = /* @__PURE__ */ new Map();
  for (const c of commitFlow.commits) {
    const list2 = commitsByStageId.get(c.stageId) ?? [];
    list2.push(c);
    commitsByStageId.set(c.stageId, list2);
  }
  return decorate(structural, commitsByStageId);
}
function decorate(node, commitsByStageId) {
  if (node.kind === "leaf") {
    return {
      kind: "leaf",
      stageId: node.stageId,
      commits: commitsByStageId.get(node.stageId) ?? []
    };
  }
  if (node.kind === "serial") {
    return {
      kind: "serial",
      items: node.items.map((n) => decorate(n, commitsByStageId))
    };
  }
  return {
    kind: "parallel",
    branches: node.branches.map((b) => decorate(b, commitsByStageId))
  };
}

// src/components/FlowchartView/CommitChainView.tsx
var import_jsx_runtime30 = require("react/jsx-runtime");
function CommitChainView({
  chain,
  selectedRuntimeStageId = null,
  onSelectCommit,
  resolveLabel,
  revealedThroughCommitIdx = null,
  className,
  style
}) {
  if (!chain) {
    return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
      "div",
      {
        className,
        style: {
          padding: 16,
          color: theme.textMuted,
          fontStyle: "italic",
          ...style
        },
        children: "No chain to display."
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
    "div",
    {
      className,
      style: {
        padding: 12,
        color: theme.textPrimary,
        fontSize: 12,
        overflow: "auto",
        ...style
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
        ChainShell,
        {
          node: chain,
          renderLeaf: (leaf) => /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
            Leaf,
            {
              leaf,
              selectedRuntimeStageId,
              onSelectCommit,
              resolveLabel,
              revealedThroughCommitIdx
            }
          )
        }
      )
    }
  );
}
function ChainShell({ node, renderLeaf }) {
  if (node.kind === "leaf") {
    return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(import_jsx_runtime30.Fragment, { children: renderLeaf(node) });
  }
  if (node.kind === "serial") {
    return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0
        },
        children: node.items.map((child, i) => /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(
          "div",
          {
            style: { display: "flex", flexDirection: "column", alignItems: "center" },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(ChainShell, { node: child, renderLeaf }),
              i < node.items.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(Connector, { orientation: "vertical" })
            ]
          },
          chainKey(child, i)
        ))
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(ForkMarker, {}),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 18,
              padding: "4px 0",
              borderLeft: `1px dashed ${theme.border}`,
              borderRight: `1px dashed ${theme.border}`,
              paddingLeft: 12,
              paddingRight: 12
            },
            children: node.branches.map((branch, i) => /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 120
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(ChainShell, { node: branch, renderLeaf })
              },
              chainKey(branch, i)
            ))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(ForkMarker, {})
      ]
    }
  );
}
function chainKey(node, fallbackIndex) {
  const leaf = firstLeafOf(node);
  return leaf ? `${node.kind}:${leaf.stageId}` : `${node.kind}:idx${fallbackIndex}`;
}
function firstLeafOf(node) {
  if (node.kind === "leaf") return node;
  if (node.kind === "serial") {
    for (const item of node.items) {
      const l = firstLeafOf(item);
      if (l) return l;
    }
    return null;
  }
  for (const branch of node.branches) {
    const l = firstLeafOf(branch);
    if (l) return l;
  }
  return null;
}
function Leaf({
  leaf,
  selectedRuntimeStageId,
  onSelectCommit,
  resolveLabel,
  revealedThroughCommitIdx
}) {
  const label = resolveLabel ? resolveLabel(leaf.stageId) : leaf.stageId;
  const commits = "commits" in leaf ? leaf.commits : [];
  if (commits.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(
      "div",
      {
        style: {
          ...boxBaseStyle,
          borderStyle: "dashed",
          color: theme.textMuted,
          background: "transparent"
        },
        title: `${leaf.stageId} \u2014 not executed in this run`,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { style: { fontWeight: 600 }, children: label }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { style: { fontSize: 10, fontStyle: "italic" }, children: "not executed" })
        ]
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: commits.map((c, i) => {
    const isSelected = c.runtimeStageId === selectedRuntimeStageId;
    const clickable = onSelectCommit !== void 0;
    const isRevealed = revealedThroughCommitIdx === null || c.commitIdx <= revealedThroughCommitIdx;
    return /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(
      "button",
      {
        type: "button",
        onClick: clickable ? () => onSelectCommit(c.runtimeStageId) : void 0,
        style: {
          ...boxBaseStyle,
          cursor: clickable ? "pointer" : "default",
          borderColor: isSelected ? theme.success : theme.border,
          borderWidth: isSelected ? 2 : 1,
          // Mixed FROM the same role the border uses, so one `success`
          // override moves both (raw rgba here was unthemeable).
          background: isSelected ? `color-mix(in srgb, ${theme.success} 8%, transparent)` : "transparent",
          color: theme.textPrimary,
          textAlign: "left",
          fontFamily: "inherit",
          padding: "6px 10px",
          opacity: isRevealed ? 1 : 0.35
        },
        "aria-disabled": !isRevealed,
        "aria-current": isSelected ? "true" : void 0,
        title: c.runtimeStageId,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { style: { fontWeight: 600 }, children: [
            label,
            commits.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("span", { style: { color: theme.textMuted, fontWeight: 400, marginLeft: 6 }, children: [
              "iter ",
              i + 1,
              "/",
              commits.length
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(
            "div",
            {
              style: {
                fontSize: 10,
                fontFamily: "monospace",
                color: theme.textMuted,
                marginTop: 2
              },
              children: [
                "#",
                c.commitIdx,
                " \xB7 ",
                c.runtimeStageId
              ]
            }
          )
        ]
      },
      c.commitIdx
    );
  }) });
}
function Connector({ orientation }) {
  return orientation === "vertical" ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
    "div",
    {
      "aria-hidden": true,
      style: {
        width: 1,
        height: 12,
        background: theme.border
      }
    }
  ) : /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
    "div",
    {
      "aria-hidden": true,
      style: {
        height: 1,
        width: 12,
        background: theme.border
      }
    }
  );
}
function ForkMarker() {
  return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
    "div",
    {
      "aria-hidden": true,
      style: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: theme.border,
        margin: "2px 0"
      }
    }
  );
}
var boxBaseStyle = {
  display: "inline-block",
  minWidth: 110,
  padding: "6px 10px",
  border: `1px solid ${theme.border}`,
  borderRadius: 4,
  fontSize: 12,
  color: theme.textPrimary,
  background: "transparent"
};

// src/components/FlowchartView/TraceExplorerShell.tsx
var import_react53 = require("react");

// src/components/FlowchartView/RunSlider.tsx
var import_react52 = require("react");
var import_jsx_runtime31 = require("react/jsx-runtime");
function RunSlider({
  index,
  cursorRuntimeStageId,
  onCursorChange,
  renderLabel,
  className,
  style
}) {
  const total = index.commits.length;
  const cursorCommitIdx = (0, import_react52.useMemo)(() => {
    if (!cursorRuntimeStageId) return 0;
    const view = index.byRuntimeStageId.get(cursorRuntimeStageId);
    return view ? view.commitIdx : 0;
  }, [index, cursorRuntimeStageId]);
  const handleSliderChange = (0, import_react52.useCallback)(
    (e) => {
      const value = Number(e.target.value);
      const view = index.commits[value];
      onCursorChange(view ? view.runtimeStageId : null);
    },
    [index, onCursorChange]
  );
  const label = (0, import_react52.useMemo)(() => {
    const commit = index.commits[cursorCommitIdx] ?? null;
    const rsid = cursorRuntimeStageId ?? commit?.runtimeStageId ?? null;
    if (renderLabel)
      return renderLabel({
        commitIdx: cursorCommitIdx,
        total,
        runtimeStageId: rsid,
        commit,
        index
      });
    if (total === 0) return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("span", { style: { color: theme.textMuted }, children: "No commits yet" });
    return /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("span", { style: { fontFamily: "monospace", fontSize: 11, color: theme.textSecondary }, children: [
      "#",
      cursorCommitIdx + 1,
      " / ",
      total,
      " \xB7 ",
      commit?.runtimeStageId ?? "\u2014"
    ] });
  }, [renderLabel, cursorCommitIdx, total, index, cursorRuntimeStageId]);
  const disabled = total < 2;
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)(
    "div",
    {
      className,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",
        background: theme.bgSecondary,
        border: `1px solid ${theme.border}`,
        borderRadius: 6,
        ...style
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
          "span",
          {
            style: {
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: theme.textMuted
            },
            children: "Time"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
          "input",
          {
            type: "range",
            min: 0,
            max: Math.max(0, total - 1),
            step: 1,
            value: Math.min(cursorCommitIdx, Math.max(0, total - 1)),
            onChange: handleSliderChange,
            disabled,
            "aria-label": "Commit time cursor",
            "aria-valuemin": 0,
            "aria-valuemax": Math.max(0, total - 1),
            "aria-valuenow": cursorCommitIdx,
            "aria-valuetext": total === 0 ? "no commits" : `commit ${cursorCommitIdx + 1} of ${total}`,
            style: { flex: 1, accentColor: theme.success }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("div", { style: { minWidth: 200, textAlign: "right" }, children: label })
      ]
    }
  );
}

// src/components/FlowchartView/TraceExplorerShell.tsx
var import_jsx_runtime32 = require("react/jsx-runtime");
function TraceExplorerShell({
  bundle,
  selectedRuntimeStageId: controlledSel,
  onSelectionChange,
  slots,
  className,
  style
}) {
  const [internalSel, setInternalSel] = (0, import_react53.useState)(null);
  const isControlled = controlledSel !== void 0;
  const selectedRuntimeStageId = isControlled ? controlledSel : internalSel;
  const handleSelect = (0, import_react53.useCallback)(
    (rsid) => {
      if (!isControlled) setInternalSel(rsid);
      onSelectionChange?.(rsid);
    },
    [isControlled, onSelectionChange]
  );
  const handleSelectCommit = (0, import_react53.useCallback)(
    (rsid) => handleSelect(rsid),
    [handleSelect]
  );
  const selectedStageId = (0, import_react53.useMemo)(() => {
    if (!selectedRuntimeStageId) return null;
    const hashIdx = selectedRuntimeStageId.lastIndexOf("#");
    if (hashIdx <= 0) return null;
    return asStageId(selectedRuntimeStageId.slice(0, hashIdx));
  }, [selectedRuntimeStageId]);
  const ChainPane = (0, import_react53.useMemo)(
    () => slots?.chain ?? DefaultChainPane,
    [slots?.chain]
  );
  const CommitPane = (0, import_react53.useMemo)(
    () => slots?.commitInspector ?? DefaultCommitPane,
    [slots?.commitInspector]
  );
  const NodePane = (0, import_react53.useMemo)(
    () => slots?.nodeInspector ?? DefaultNodePane,
    [slots?.nodeInspector]
  );
  const SliderPane = (0, import_react53.useMemo)(() => {
    if (slots && "slider" in slots) {
      return slots.slider ?? null;
    }
    return DefaultSliderPane;
  }, [slots]);
  const chain = useTranslator(
    bundle.commitFlow,
    () => buildCommitChainTree(bundle.structure.getGraph(), bundle.commitFlow.getIndex())
  );
  const commitIndex = useTranslator(
    bundle.commitFlow,
    () => bundle.commitFlow.getIndex()
  );
  const nodeIndex = useTranslator(bundle.nodeView, () => bundle.nodeView.getIndex());
  const handleStageNavigate = (0, import_react53.useCallback)(
    (stageId) => {
      const candidates = commitIndex.commits.filter((c) => c.stageId === stageId);
      const first = candidates[0];
      handleSelect(first ? first.runtimeStageId : null);
    },
    [commitIndex, handleSelect]
  );
  const revealedThroughCommitIdx = (0, import_react53.useMemo)(() => {
    if (!selectedRuntimeStageId) return null;
    const view = commitIndex.byRuntimeStageId.get(selectedRuntimeStageId);
    return view ? view.commitIdx : -1;
  }, [selectedRuntimeStageId, commitIndex]);
  const layoutStyle = (0, import_react53.useMemo)(
    () => SliderPane ? SHELL_STYLE_WITH_SLIDER : SHELL_STYLE_NO_SLIDER,
    [SliderPane]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className, style: { ...layoutStyle, ...style }, children: [
    SliderPane && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(Pane, { area: "slider", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
      SliderPane,
      {
        index: commitIndex,
        cursorRuntimeStageId: selectedRuntimeStageId,
        onCursorChange: handleSelect
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(Pane, { area: "chain", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
      ChainPane,
      {
        chain,
        selectedRuntimeStageId,
        onSelectCommit: handleSelectCommit,
        revealedThroughCommitIdx
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(Pane, { area: "commit", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
      CommitPane,
      {
        index: commitIndex,
        selectedRuntimeStageId,
        onNavigate: handleSelectCommit
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(Pane, { area: "node", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
      NodePane,
      {
        index: nodeIndex,
        selectedStageId,
        onNavigate: handleStageNavigate
      }
    ) })
  ] });
}
function DefaultChainPane({
  chain,
  selectedRuntimeStageId,
  onSelectCommit,
  revealedThroughCommitIdx
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
    CommitChainView,
    {
      chain,
      selectedRuntimeStageId,
      onSelectCommit,
      revealedThroughCommitIdx
    }
  );
}
function DefaultCommitPane({
  index,
  selectedRuntimeStageId,
  onNavigate
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
    CommitInspector,
    {
      index,
      selectedRuntimeStageId,
      onNavigate
    }
  );
}
function DefaultNodePane({ index, selectedStageId, onNavigate }) {
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(NodeInspector, { index, selectedId: selectedStageId, onNavigate });
}
function DefaultSliderPane({
  index,
  cursorRuntimeStageId,
  onCursorChange
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
    RunSlider,
    {
      index,
      cursorRuntimeStageId,
      onCursorChange
    }
  );
}
var SHELL_STYLE_WITH_SLIDER = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1fr)",
  gridTemplateRows: "auto 1fr auto",
  gridTemplateAreas: '"slider slider" "chain commit" "node node"',
  gap: 12,
  padding: 12,
  background: theme.bgPrimary,
  color: theme.textPrimary
};
var SHELL_STYLE_NO_SLIDER = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1fr)",
  gridTemplateRows: "1fr auto",
  gridTemplateAreas: '"chain commit" "node node"',
  gap: 12,
  padding: 12,
  background: theme.bgPrimary,
  color: theme.textPrimary
};
var PANE_BASE_STYLE = {
  border: `1px solid ${theme.border}`,
  borderRadius: 6,
  background: theme.bgSecondary,
  overflow: "auto",
  minHeight: 0
  // permit shrinking inside grid
};
function Pane({ area, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { role: "region", "aria-label": area, style: { ...PANE_BASE_STYLE, gridArea: area }, children });
}

// src/adapters/overlayFromSnapshot.ts
function baseStageIdOf3(runtimeStageId) {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}
function overlayFromSnapshot(snapshot, options = {}) {
  const commitLog = snapshot?.commitLog;
  const executionOrder = [];
  if (Array.isArray(commitLog)) {
    const seen = /* @__PURE__ */ new Set();
    for (const entry of commitLog) {
      if (entry === null || typeof entry !== "object") continue;
      const bundle = entry;
      const runtimeStageId = bundle.runtimeStageId;
      if (typeof runtimeStageId !== "string" || runtimeStageId.length === 0) continue;
      if (seen.has(runtimeStageId)) continue;
      seen.add(runtimeStageId);
      const stageId = baseStageIdOf3(runtimeStageId);
      executionOrder.push({
        runtimeStageId,
        stageId,
        // `bundle.stage` is the stage's display name; fall back to the id
        // rather than inventing a label when an older engine omitted it.
        stageName: typeof bundle.stage === "string" && bundle.stage.length > 0 ? bundle.stage : stageId,
        timestampMs: 0
        // see "honest absence" in the module JSDoc
      });
    }
  }
  return {
    executionOrder,
    errors: /* @__PURE__ */ new Map(),
    running: false,
    retryAttempts: retryAttemptsFrom(snapshot, options.narrativeEntries)
  };
}
function retryAttemptsFrom(snapshot, entries) {
  const attempts = retryAttemptsFromNarrative(entries);
  for (const [runtimeStageId, count2] of attemptsFromTrees(snapshot)) attempts.set(runtimeStageId, count2);
  return new Map([...attempts].sort(([a], [b]) => compareExecutionIndex(a, b)));
}
function compareExecutionIndex(a, b) {
  const x = executionIndexOf(a);
  const y = executionIndexOf(b);
  return x === y ? 0 : x < y ? -1 : 1;
}
function executionIndexOf(runtimeStageId) {
  const hashIdx = runtimeStageId.lastIndexOf("#");
  const index = hashIdx >= 0 ? Number(runtimeStageId.slice(hashIdx + 1)) : Number.NaN;
  return Number.isFinite(index) ? index : Number.POSITIVE_INFINITY;
}
function attemptsFromTrees(snapshot) {
  const counts = /* @__PURE__ */ new Map();
  const roots = [snapshot?.executionTree];
  const subflowResults = snapshot?.subflowResults;
  if (subflowResults !== null && typeof subflowResults === "object") {
    for (const result of Object.values(subflowResults)) {
      const treeContext = isObject(result) ? result.treeContext : void 0;
      roots.push(isObject(treeContext) ? treeContext.stageContexts : void 0);
    }
  }
  const seen = /* @__PURE__ */ new Set();
  const stack = roots.filter(isObject);
  while (stack.length > 0) {
    const node = stack.pop();
    if (seen.has(node)) continue;
    seen.add(node);
    const count2 = isObject(node.attemptSummary) ? node.attemptSummary.count : void 0;
    const runtimeStageId = node.runtimeStageId;
    if (typeof count2 === "number" && Number.isInteger(count2) && count2 > 1 && typeof runtimeStageId === "string" && runtimeStageId.length > 0) {
      counts.set(runtimeStageId, count2);
    }
    if (isObject(node.next)) stack.push(node.next);
    if (Array.isArray(node.children)) {
      for (const child of node.children) if (isObject(child)) stack.push(child);
    }
  }
  return counts;
}
function isObject(value) {
  return value !== null && typeof value === "object";
}
function retryAttemptsFromNarrative(entries) {
  const attempts = /* @__PURE__ */ new Map();
  if (!Array.isArray(entries)) return attempts;
  for (const entry of entries) {
    if (entry === null || typeof entry !== "object") continue;
    if (entry.type !== "retry") continue;
    const runtimeStageId = entry.runtimeStageId;
    if (typeof runtimeStageId !== "string" || runtimeStageId.length === 0) continue;
    attempts.set(runtimeStageId, (attempts.get(runtimeStageId) ?? 1) + 1);
  }
  return attempts;
}

// src/adapters/graphFromStructure.ts
function looksLikeStructure(value) {
  if (value === null || typeof value !== "object") return false;
  const n = value;
  return typeof n.id === "string" && typeof n.name === "string";
}
function convergenceEdges(node, targetId) {
  const children = node.children;
  const isBranching = (node.type === "fork" || node.type === "decider" || node.type === "selector") && Array.isArray(children) && children.length > 0;
  if (!isBranching) return [{ from: node.id, to: targetId }];
  const edges = [];
  for (const child of children) {
    if (child.isLoopReference) continue;
    if (child.next?.isLoopReference) continue;
    edges.push({ from: child.id, to: child.convergeAt ?? targetId });
  }
  return edges;
}
function graphFromStructure(structure) {
  const trace = createTraceStructureRecorder({ id: "graph-from-structure" });
  if (!looksLikeStructure(structure)) return trace.getGraph();
  const rec = trace.recorder;
  const announced2 = /* @__PURE__ */ new Set();
  const walked = /* @__PURE__ */ new Set();
  const announce = (node) => {
    if (announced2.has(node.id)) return;
    announced2.add(node.id);
    rec.onStageAdded?.({
      stageId: node.id,
      name: node.name,
      // The serialized spelling of a decision stage is `type: 'decider'`;
      // the live builder's is `type: 'stage'` + `spec.hasDecider`. The
      // recorder reads BOTH, so either front door yields the same node.
      type: node.type ?? "stage",
      ...node.isPausable === true ? { isPausable: true } : {},
      spec: node
    });
  };
  const mounted = /* @__PURE__ */ new Set();
  const mount = (node) => {
    if (!node.isSubflowRoot || node.subflowId === void 0 || mounted.has(node.id)) return;
    mounted.add(node.id);
    rec.onSubflowMounted?.({
      subflowId: node.subflowId,
      subflowName: node.subflowName ?? node.name,
      rootStageId: node.id,
      ...node.isLazy === true ? { isLazy: true } : {},
      ...node.subflowStructure ? { subflowSpec: node.subflowStructure } : {},
      subflowPath: node.subflowId
    });
  };
  const walk = (node) => {
    if (node.isLoopReference || walked.has(node.id)) return;
    walked.add(node.id);
    announce(node);
    mount(node);
    const children = node.children ?? [];
    if (children.length > 0) {
      const kind = node.type === "fork" ? "fork-branch" : "decision-branch";
      for (const child of children) {
        announce(child);
        rec.onEdgeAdded?.({
          from: node.id,
          to: child.id,
          kind,
          ...kind === "decision-branch" ? { label: child.id } : {}
        });
        mount(child);
      }
      const isDecision = node.type === "decider" || node.type === "selector" || node.hasDecider === true || node.hasSelector === true;
      if (isDecision) {
        rec.onDeciderComplete?.({
          decider: node.id,
          type: node.hasSelector === true || node.type === "selector" ? "selector" : "decider",
          branchIds: node.branchIds ?? children.map((c) => c.id)
          // `defaultBranch` is deliberately absent — see the module JSDoc.
        });
      }
      for (const child of children) walk(child);
    }
    const next = node.next;
    if (!next) return;
    if (next.isLoopReference) {
      rec.onLoopEdgeAdded?.({ from: node.id, to: node.loopTarget ?? next.id });
      return;
    }
    announce(next);
    for (const edge of convergenceEdges(node, next.id)) {
      rec.onEdgeAdded?.({ from: edge.from, to: edge.to, kind: "next" });
    }
    mount(next);
    walk(next);
  };
  walk(structure);
  return trace.getGraph();
}

// src/components/GroupedFlowInvestigation/GroupedFlowInvestigation.tsx
var import_react57 = require("react");

// src/components/InvestigationPanel/InvestigationPanel.tsx
var import_react56 = require("react");

// src/components/InvestigationPanel/wording/banks.ts
var gapMessages = Object.freeze({
  "not-collected": "Some evidence was not collected.",
  "untracked-input": "An input's earlier origin is unknown.",
  redacted: "Some evidence is hidden.",
  conservative: "The recorded relationship is uncertain.",
  "scope-boundary": "Evidence stops at an execution boundary.",
  "invalid-data": "Some recorded evidence could not be read.",
  unavailable: "Some evidence is unavailable.",
  timeout: "The evidence search reached its time allowance.",
  cancelled: "The evidence search was cancelled.",
  cycle: "A repeated dependency could not be resolved.",
  "node-limit": "The evidence search reached its item allowance.",
  "depth-limit": "The evidence search reached its depth allowance.",
  "edge-limit": "The evidence search reached its relationship allowance.",
  "call-limit": "The evidence search reached its request allowance.",
  truncated: "The recorded evidence is incomplete.",
  "strategy-failed": "Candidate ordering is unavailable.",
  "not-checked": "Some evidence has not been checked.",
  "no-match": "No matching evidence was found.",
  ambiguous: "More than one explanation remains possible.",
  stale: "Some evidence belongs to an earlier recording.",
  incompatible: "Some evidence uses an unsupported format.",
  unsupported: "Some evidence is unsupported.",
  "not-permitted": "Some evidence is unavailable for this view."
});
var attentionNames = Object.freeze({
  error: "Recorded error",
  "unknown-effect": "Outcome unknown",
  "gave-up": "Stopped retrying",
  timeout: "Timed out",
  retried: "Retried",
  "quality-drop": "Quality changed",
  "not-collected": "Evidence unavailable",
  outlier: "Unusual result"
});

// src/components/InvestigationPanel/wording/gapMessage.ts
var longestGapCode = Math.max(...Object.keys(gapMessages).map((code) => code.length));

// src/components/InvestigationPanel/wording/markLabel.ts
function resolveInvestigationMarkLabel(labels, kind) {
  const fallback2 = Object.prototype.hasOwnProperty.call(attentionNames, kind) ? attentionNames[kind] : kind;
  if (!labels || typeof labels !== "object") return fallback2;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(labels, kind);
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, "value")) return fallback2;
    const value = descriptor.value;
    return typeof value === "string" && value.length > 0 && value.length <= 512 ? value : fallback2;
  } catch {
    return fallback2;
  }
}

// src/displayAdmission/limits.ts
var investigationDisplayLimits = Object.freeze({
  maxTextCodeUnits: 65536,
  maxStringCodeUnits: 2048,
  maxItemsPerList: 256,
  maxMarksPerItem: 16,
  maxReferencesPerList: 32,
  maxGapsPerList: 128,
  maxEdgesPerList: 512
});
var failureExplanationDisplayLimits = Object.freeze({
  maxTextCodeUnits: 262144,
  maxItemsPerList: 1024,
  maxTotalListItems: 4096,
  maxReferenceOrUnknownCodeUnits: 4096,
  maxFindingCodeUnits: 80,
  findingCodePattern: "^[A-Z][A-Z0-9_]{1,79}$"
});

// src/displayAdmission/tokens.ts
var schemaFields = /* @__PURE__ */ new Set([
  "problem",
  "recordedCause",
  "suggestedNextStep",
  "text",
  "configuredText",
  "wordingSource",
  "evidenceRefs",
  "unknowns",
  "canonicalFindings",
  "causes",
  "consequences",
  "diagnosticFailures",
  "code",
  "summary",
  "level",
  "nodes",
  "nodeId",
  "attention",
  "kind",
  "reason",
  "evidence",
  "confidence",
  "gaps",
  "from",
  "to",
  "attribution",
  "edges",
  "backward",
  "rootCause",
  "path",
  "alternatives",
  "impact",
  "projection",
  "requestedNodeId",
  "length"
]);
var codes = /* @__PURE__ */ new Set([
  "invalid-own-field",
  "accessor-field",
  "invalid-value",
  "invalid-enum",
  "invalid-code",
  "duplicate-identity",
  "selection-mismatch",
  "inconsistent-evidence",
  "limit-exceeded",
  "unreadable-input"
]);
var limitNames = /* @__PURE__ */ new Set([
  ...Object.keys(investigationDisplayLimits),
  ...Object.keys(failureExplanationDisplayLimits).filter((key) => key !== "findingCodePattern")
]);
var emptyPath = Object.freeze([]);
var unreadableDiagnostic = Object.freeze({ code: "unreadable-input", path: emptyPath });
var refusals = /* @__PURE__ */ new WeakMap();
function copyDisplayPath(path) {
  try {
    if (!Array.isArray(path)) return void 0;
    const descriptor = Object.getOwnPropertyDescriptor(path, "length");
    if (!descriptor || !("value" in descriptor)) return void 0;
    const length = descriptor.value;
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || length > 8) return void 0;
    const copy = [];
    for (let index = 0; index < length; index++) {
      const part = Object.getOwnPropertyDescriptor(path, String(index));
      if (!part || !("value" in part)) return void 0;
      const value = part.value;
      if (typeof value === "string" && schemaFields.has(value)) copy.push(value);
      else if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 1024) copy.push(value);
      else return void 0;
    }
    return Object.freeze(copy);
  } catch {
    return void 0;
  }
}
function copyLimitDetails(details) {
  try {
    if (!details || typeof details !== "object") return void 0;
    const own2 = (key) => {
      const field4 = Object.getOwnPropertyDescriptor(details, key);
      return field4 && "value" in field4 ? field4.value : void 0;
    };
    const limit2 = own2("limit"), maximum = own2("maximum"), observed = own2("observed");
    if (typeof limit2 !== "string" || !limitNames.has(limit2) || typeof maximum !== "number" || !Number.isSafeInteger(maximum) || maximum < 0 || typeof observed !== "number" || !Number.isSafeInteger(observed) || observed < 0) return void 0;
    return Object.freeze({ limit: limit2, maximum, observed });
  } catch {
    return void 0;
  }
}
function throwDiagnostic(diagnostic) {
  const token = Object.freeze(/* @__PURE__ */ Object.create(null));
  refusals.set(token, diagnostic);
  throw token;
}
function refuseDisplay(code, path, details) {
  const copiedPath = copyDisplayPath(path);
  if (!copiedPath || !codes.has(code) || details !== void 0 && code !== "limit-exceeded")
    return throwDiagnostic(unreadableDiagnostic);
  if (code === "limit-exceeded") {
    const copiedDetails = details === void 0 ? void 0 : copyLimitDetails(details);
    if (details !== void 0 && !copiedDetails) return throwDiagnostic(unreadableDiagnostic);
    return throwDiagnostic(Object.freeze({ code, path: copiedPath, ...copiedDetails }));
  }
  return throwDiagnostic(Object.freeze({ code, path: copiedPath }));
}
function deliberateDisplayRefusal(thrown) {
  if (typeof thrown === "object" && thrown !== null || typeof thrown === "function")
    return refusals.get(thrown);
  return void 0;
}

// src/displayAdmission/reader.ts
function checkedPath(path) {
  const copy = copyDisplayPath(path);
  if (!copy) refuseDisplay("unreadable-input", []);
  return copy;
}
function readOwnField(value, key, path = []) {
  const at2 = checkedPath(path);
  if (typeof key !== "string") refuseDisplay("unreadable-input", []);
  if (!value || typeof value !== "object") refuseDisplay("invalid-own-field", at2);
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (descriptor === void 0) return void 0;
  if (!("value" in descriptor)) refuseDisplay("accessor-field", at2);
  return descriptor.value;
}
var DisplayReader = class {
  constructor(limits) {
    this.limits = limits;
    this.textCodeUnits = 0;
    this.listItems = 0;
  }
  field(value, key, path) {
    return readOwnField(value, key, path);
  }
  fail(code, path, details) {
    return refuseDisplay(code, path, details);
  }
  text(value, path, maximum, limit2) {
    const at2 = checkedPath(path);
    if (typeof value !== "string" || value.length === 0) this.fail("invalid-value", at2);
    if (value.length > maximum) this.fail("limit-exceeded", at2, { limit: limit2, maximum, observed: value.length });
    this.textCodeUnits += value.length;
    if (this.textCodeUnits > this.limits.maxTextCodeUnits)
      this.fail("limit-exceeded", at2, { limit: "maxTextCodeUnits", maximum: this.limits.maxTextCodeUnits, observed: this.textCodeUnits });
    return value;
  }
  list(value, path, maximum, limit2, parse) {
    const at2 = checkedPath(path);
    if (!Array.isArray(value)) this.fail("invalid-value", at2);
    const length = this.field(value, "length", [...at2, "length"]);
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0) this.fail("invalid-value", at2);
    if (length > maximum) this.fail("limit-exceeded", at2, { limit: limit2, maximum, observed: length });
    this.listItems += length;
    if (this.limits.maxTotalListItems !== void 0 && this.listItems > this.limits.maxTotalListItems)
      this.fail("limit-exceeded", at2, { limit: "maxTotalListItems", maximum: this.limits.maxTotalListItems, observed: this.listItems });
    const copy = [];
    for (let index = 0; index < length; index++) {
      const entryPath = [...at2, index];
      copy.push(parse(this.field(value, String(index), entryPath), entryPath));
    }
    return copy;
  }
  /** Exact only for a successfully completed schema parser. */
  usage() {
    return Object.freeze({ textCodeUnits: this.textCodeUnits, listItems: this.listItems });
  }
};
function runDisplayCheck(limits, parse) {
  try {
    const reader = new DisplayReader(limits);
    const value = parse(reader);
    return Object.freeze({ ok: true, value, usage: reader.usage() });
  } catch (thrown) {
    return Object.freeze({ ok: false, diagnostic: deliberateDisplayRefusal(thrown) ?? unreadableDiagnostic });
  }
}

// src/components/InvestigationPanel/admission.ts
var reasons = {
  ERROR_RECORDED: true,
  UNKNOWN_EFFECT_RECORDED: true,
  RETRY_STOP_RECORDED: true,
  TIMEOUT_RECORDED: true,
  RETRY_RECORDED: true,
  QUALITY_DROP_RECORDED: true,
  EVIDENCE_NOT_COLLECTED: true,
  OUTLIER_RECORDED: true,
  BUSINESS_RULE_MATCHED: true
};
var at = (path, key) => [...path, key];
var Admission = class {
  constructor(reader) {
    this.reader = reader;
    this.attention = (value, path) => {
      const reason = this.field(value, "reason", at(path, "reason"));
      if (typeof reason !== "string" || !Object.prototype.hasOwnProperty.call(reasons, reason))
        this.reader.fail("invalid-enum", at(path, "reason"));
      return {
        kind: this.text(this.field(value, "kind", at(path, "kind")), at(path, "kind")),
        reason,
        evidence: this.evidence(this.field(value, "evidence", at(path, "evidence")), at(path, "evidence"))
      };
    };
  }
  field(value, key, path) {
    return this.reader.field(value, key, path);
  }
  text(value, path) {
    return this.reader.text(value, path, investigationDisplayLimits.maxStringCodeUnits, "maxStringCodeUnits");
  }
  confidence(value, path) {
    if (value !== "complete" && value !== "incomplete") this.reader.fail("invalid-enum", path);
    return value;
  }
  evidence(value, path) {
    return this.reader.list(value, path, investigationDisplayLimits.maxReferencesPerList, "maxReferencesPerList", (entry, entryPath) => this.text(entry, entryPath));
  }
  gaps(value, path) {
    return this.reader.list(value, path, investigationDisplayLimits.maxGapsPerList, "maxGapsPerList", (entry, entryPath) => {
      const code = this.field(entry, "code", at(entryPath, "code"));
      if (typeof code !== "string" || !Object.prototype.hasOwnProperty.call(gapMessages, code))
        this.reader.fail("invalid-enum", at(entryPath, "code"));
      const nodeId = this.field(entry, "nodeId", at(entryPath, "nodeId"));
      return {
        code,
        ...nodeId !== void 0 && { nodeId: this.text(nodeId, at(entryPath, "nodeId")) },
        evidence: this.evidence(this.field(entry, "evidence", at(entryPath, "evidence")), at(entryPath, "evidence"))
      };
    });
  }
  edges(value, members, path) {
    return this.reader.list(value, path, investigationDisplayLimits.maxEdgesPerList, "maxEdgesPerList", (entry, entryPath) => {
      const from = this.text(this.field(entry, "from", at(entryPath, "from")), at(entryPath, "from"));
      const to = this.text(this.field(entry, "to", at(entryPath, "to")), at(entryPath, "to"));
      const kind = this.field(entry, "kind", at(entryPath, "kind"));
      const attribution = this.field(entry, "attribution", at(entryPath, "attribution"));
      if (!members.has(from)) this.reader.fail("inconsistent-evidence", at(entryPath, "from"));
      if (!members.has(to)) this.reader.fail("inconsistent-evidence", at(entryPath, "to"));
      if (kind !== "data" && kind !== "control") this.reader.fail("invalid-enum", at(entryPath, "kind"));
      if (!admitsRecordedAttribution(attribution, kind))
        this.reader.fail(attribution === "recorded-write" && kind === "control" ? "inconsistent-evidence" : "invalid-enum", at(entryPath, "attribution"));
      return { from, to, kind, attribution, evidence: this.evidence(this.field(entry, "evidence", at(entryPath, "evidence")), at(entryPath, "evidence")) };
    });
  }
  backward(value, selected, root, path, alternatives) {
    const nodesPath = ["backward", "nodes"];
    const nodes = this.reader.list(this.field(value, "nodes", nodesPath), nodesPath, investigationDisplayLimits.maxItemsPerList, "maxItemsPerList", (entry, entryPath) => this.text(entry, entryPath));
    const members = new Set(nodes);
    if (members.size !== nodes.length) this.reader.fail("duplicate-identity", nodesPath);
    if (nodes.length > 0 && !members.has(selected)) this.reader.fail("inconsistent-evidence", nodesPath);
    const confidence = this.confidence(this.field(value, "confidence", ["backward", "confidence"]), ["backward", "confidence"]);
    const gaps = this.gaps(this.field(value, "gaps", ["backward", "gaps"]), ["backward", "gaps"]);
    if (root !== void 0) {
      if (!members.has(root)) this.reader.fail("inconsistent-evidence", nodesPath);
      if (confidence !== "complete") this.reader.fail("inconsistent-evidence", ["backward", "confidence"]);
      if (gaps.length) this.reader.fail("inconsistent-evidence", ["backward", "gaps"]);
    }
    const edges = this.edges(this.field(value, "edges", ["backward", "edges"]), members, ["backward", "edges"]);
    if (path.some((id) => !members.has(id))) this.reader.fail("inconsistent-evidence", ["path"]);
    if (alternatives.some((id) => !members.has(id))) this.reader.fail("inconsistent-evidence", ["alternatives"]);
    if (root !== void 0 && edges.some((edge) => edge.attribution === "stage")) this.reader.fail("inconsistent-evidence", ["backward", "edges"]);
    const links = /* @__PURE__ */ new Map();
    for (const edge of edges) {
      const targets = links.get(edge.from) ?? /* @__PURE__ */ new Set();
      targets.add(edge.to);
      links.set(edge.from, targets);
    }
    for (let index = 1; index < path.length; index++)
      if (!links.get(path[index - 1])?.has(path[index])) this.reader.fail("inconsistent-evidence", ["path", index]);
    return { nodes, edges, confidence, gaps };
  }
  impact(value, selected, visual) {
    const nodesPath = ["impact", "nodes"];
    const nodes = this.reader.list(this.field(value, "nodes", nodesPath), nodesPath, investigationDisplayLimits.maxItemsPerList, "maxItemsPerList", (entry, entryPath) => this.text(entry, entryPath));
    if (new Set(nodes).size !== nodes.length) this.reader.fail("duplicate-identity", nodesPath);
    return {
      nodes,
      confidence: this.confidence(this.field(value, "confidence", ["impact", "confidence"]), ["impact", "confidence"]),
      gaps: this.gaps(this.field(value, "gaps", ["impact", "gaps"]), ["impact", "gaps"]),
      ...visual && this.field(value, "edges", ["impact", "edges"]) !== void 0 ? { edges: this.edges(this.field(value, "edges", ["impact", "edges"]), /* @__PURE__ */ new Set([selected, ...nodes]), ["impact", "edges"]) } : {}
    };
  }
};
function readAttention(value, reader) {
  const nodes = reader.reader.list(reader.field(value, "nodes", ["nodes"]), ["nodes"], investigationDisplayLimits.maxItemsPerList, "maxItemsPerList", (entry, entryPath) => ({
    nodeId: reader.text(reader.field(entry, "nodeId", at(entryPath, "nodeId")), at(entryPath, "nodeId")),
    attention: reader.reader.list(reader.field(entry, "attention", at(entryPath, "attention")), at(entryPath, "attention"), investigationDisplayLimits.maxMarksPerItem, "maxMarksPerItem", reader.attention)
  }));
  if (new Set(nodes.map((node) => node.nodeId)).size !== nodes.length) reader.reader.fail("duplicate-identity", ["nodes"]);
  return {
    nodes,
    confidence: reader.confidence(reader.field(value, "confidence", ["confidence"]), ["confidence"]),
    gaps: reader.gaps(reader.field(value, "gaps", ["gaps"]), ["gaps"])
  };
}
function readExplanation(value, requested, visual, reader) {
  const nodeId = reader.text(reader.field(value, "nodeId", ["nodeId"]), ["nodeId"]);
  if (nodeId !== requested) reader.reader.fail("selection-mismatch", ["nodeId"]);
  const path = reader.reader.list(reader.field(value, "path", ["path"]), ["path"], investigationDisplayLimits.maxItemsPerList, "maxItemsPerList", (entry, entryPath) => reader.text(entry, entryPath));
  const alternatives = reader.reader.list(reader.field(value, "alternatives", ["alternatives"]), ["alternatives"], investigationDisplayLimits.maxItemsPerList, "maxItemsPerList", (entry, entryPath) => reader.text(entry, entryPath));
  if (path.length && path[0] !== nodeId) reader.reader.fail("inconsistent-evidence", ["path", 0]);
  if (new Set(path).size !== path.length) reader.reader.fail("duplicate-identity", ["path"]);
  if (new Set(alternatives).size !== alternatives.length) reader.reader.fail("duplicate-identity", ["alternatives"]);
  const confidence = reader.confidence(reader.field(value, "confidence", ["confidence"]), ["confidence"]);
  const gaps = reader.gaps(reader.field(value, "gaps", ["gaps"]), ["gaps"]);
  const root = reader.field(value, "rootCause", ["rootCause"]);
  const rootCause = root === void 0 ? void 0 : reader.text(root, ["rootCause"]);
  if (rootCause !== void 0 && (alternatives.length || path[path.length - 1] !== rootCause)) reader.reader.fail("inconsistent-evidence", ["rootCause"]);
  return {
    nodeId,
    attention: reader.reader.list(reader.field(value, "attention", ["attention"]), ["attention"], investigationDisplayLimits.maxMarksPerItem, "maxMarksPerItem", reader.attention),
    ...rootCause !== void 0 && { rootCause },
    path,
    alternatives,
    impact: reader.impact(reader.field(value, "impact", ["impact"]), nodeId, visual),
    ...visual && reader.field(value, "backward", ["backward"]) !== void 0 ? { backward: reader.backward(reader.field(value, "backward", ["backward"]), nodeId, rootCause, path, alternatives) } : {},
    confidence,
    gaps
  };
}
function checkInvestigationAttention(value) {
  return runDisplayCheck(investigationDisplayLimits, (reader) => readAttention(value, new Admission(reader)));
}
function checkInvestigationExplanation(value, requestedNodeId, projection = "text") {
  return runDisplayCheck(investigationDisplayLimits, (reader) => {
    if (projection !== "text" && projection !== "relationships") reader.fail("invalid-enum", ["projection"]);
    return readExplanation(value, requestedNodeId, projection === "relationships", new Admission(reader));
  });
}
function admitAttention(value) {
  const result = checkInvestigationAttention(value);
  return result.ok ? result.value : void 0;
}
function admitExplanation(value, requested) {
  const result = checkInvestigationExplanation(value, requested);
  return result.ok ? result.value : void 0;
}
function admitVisualExplanation(value, requested) {
  const result = checkInvestigationExplanation(value, requested, "relationships");
  return result.ok ? result.value : void 0;
}
function displayLabel(labels, nodeId) {
  try {
    const label = readOwnField(labels, nodeId);
    return typeof label === "string" && label.length > 0 && label.length <= 512 ? label : nodeId;
  } catch {
    return nodeId;
  }
}

// src/components/InvestigationPanel/useInvestigationQuery.ts
var import_react54 = require("react");
function useInvestigationQuery(port, admit) {
  const owner = port.binding;
  const currentOwner = (0, import_react54.useRef)(null);
  const committedAdmission = (0, import_react54.useRef)(null);
  const active = (0, import_react54.useRef)(null);
  const [state, setState] = (0, import_react54.useState)(null);
  const [selection, setSelection] = (0, import_react54.useState)(null);
  useIsomorphicLayoutEffect(() => {
    const strategyChanged = committedAdmission.current !== null && committedAdmission.current !== admit;
    currentOwner.current = owner;
    committedAdmission.current = admit;
    if (strategyChanged) setState(null);
    else if (!active.current) setState((previous) => previous?.owner === owner && previous.status === "loading" ? null : previous);
    return () => {
      currentOwner.current = null;
      active.current?.abort();
      active.current = null;
    };
  }, [owner, admit]);
  const close = () => {
    if (currentOwner.current !== owner || committedAdmission.current !== admit) return;
    active.current?.abort();
    active.current = null;
    setState(null);
  };
  const select = (nodeId) => {
    if (currentOwner.current !== owner || committedAdmission.current !== admit) return;
    close();
    setSelection({ owner, nodeId });
  };
  const query = (nodeId) => {
    const controller = new AbortController();
    if (currentOwner.current !== owner || committedAdmission.current !== admit) {
      controller.abort();
      return controller;
    }
    active.current?.abort();
    active.current = controller;
    setSelection({ owner, nodeId });
    setState({ owner, admission: admit, nodeId, request: controller, status: "loading" });
    Promise.resolve().then(() => {
      if (controller.signal.aborted || currentOwner.current !== owner || committedAdmission.current !== admit) return void 0;
      return port.explain(nodeId, { signal: controller.signal });
    }).then((value) => {
      if (active.current !== controller || controller.signal.aborted || currentOwner.current !== owner || committedAdmission.current !== admit) return;
      const result = admit(value, nodeId);
      setState(result ? { owner, admission: admit, nodeId, request: controller, status: "ready", result } : { owner, admission: admit, nodeId, request: controller, status: "refused" });
    }, () => {
      if (active.current === controller && !controller.signal.aborted && currentOwner.current === owner && committedAdmission.current === admit)
        setState({ owner, admission: admit, nodeId, request: controller, status: "error" });
    });
    return controller;
  };
  return {
    owner,
    currentOwner,
    active,
    selected: state?.owner === owner && state.admission === admit ? state : null,
    selection: selection?.owner === owner ? selection.nodeId : void 0,
    query,
    close,
    select
  };
}

// src/components/InvestigationPanel/coverage/CoverageSection.tsx
var import_react55 = require("react");

// src/components/InvestigationPanel/coverage/groupGaps.ts
function groupGaps(gaps) {
  const groups = /* @__PURE__ */ new Map();
  for (const entry of gaps) {
    const entries = groups.get(entry.code);
    if (entries) entries.push(entry);
    else groups.set(entry.code, [entry]);
  }
  return Object.freeze([...groups].map(([code, entries]) => Object.freeze({ code, entries: Object.freeze(entries) })));
}

// src/components/InvestigationPanel/coverage/GroupedGapList.tsx
var import_jsx_runtime33 = require("react/jsx-runtime");
var codeStyle = { fontFamily: theme.fontMono };
function GroupedGapList({ gaps }) {
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("ul", { "aria-label": "Supplied gap groups", children: groupGaps(gaps).map((group) => /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("li", { style: { marginBlock: 12 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("p", { role: "status", children: gapMessages[group.code] }),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("p", { children: [
      group.entries.length,
      " supplied ",
      group.entries.length === 1 ? "entry" : "entries"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("details", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("summary", { children: [
        "View supplied entries for ",
        group.code
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("ol", { "aria-label": `Supplied entries for ${group.code}`, children: group.entries.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("li", { children: [
        entry.nodeId !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("p", { children: [
          "Supplied item ID: ",
          /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("code", { style: codeStyle, children: entry.nodeId })
        ] }),
        entry.evidence.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("ul", { "aria-label": "Supplied evidence references", children: entry.evidence.map((reference, position) => /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("code", { style: codeStyle, children: reference }) }, position)) }) : /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("p", { children: "No evidence references were supplied for this entry." })
      ] }, index)) })
    ] })
  ] }, group.code)) });
}

// src/components/InvestigationPanel/coverage/CoverageSection.tsx
var import_jsx_runtime34 = require("react/jsx-runtime");
var headings = {
  attention: "Attention evidence coverage",
  overall: "Overall reported coverage; direction not supplied",
  backward: "Backward evidence coverage",
  impact: "Affected-item coverage"
};
var absent = {
  attention: "Attention evidence coverage was not supplied. Coverage remains unknown.",
  overall: "Overall evidence coverage was not supplied. Coverage remains unknown.",
  backward: "Backward evidence was not supplied. Backward coverage remains unknown.",
  impact: "Affected-item coverage was not supplied. Unlisted effects remain unknown."
};
function CoverageSection({ context, coverage }) {
  const headingId = (0, import_react55.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("section", { "aria-labelledby": headingId, style: { marginBlock: 16 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("h4", { id: headingId, children: headings[context] }),
    coverage === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { role: "status", children: absent[context] }) : /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(import_jsx_runtime34.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)("p", { children: [
        "Source-reported confidence: ",
        coverage.confidence,
        "."
      ] }),
      coverage.confidence === "incomplete" && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { role: "status", children: "The supplied coverage is incomplete. Unreported evidence remains unknown." }),
      coverage.gaps.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(GroupedGapList, { gaps: coverage.gaps }) : /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("p", { children: "No gap entries were supplied. This does not verify completeness." })
    ] })
  ] });
}

// src/components/InvestigationPanel/coverage/supportsRecordedRoot.ts
function supportsRecordedRoot(result) {
  return typeof result.rootCause === "string" && result.rootCause.length > 0 && result.backward?.confidence === "complete" && result.backward.gaps.length === 0;
}

// src/components/InvestigationPanel/coverageMode.ts
function resolveCoverageMode(value) {
  if (value === void 0) return "overall";
  return value === "overall" || value === "directional" ? value : void 0;
}

// src/components/InvestigationPanel/InvestigationPanel.tsx
var import_jsx_runtime35 = require("react/jsx-runtime");
var box = {
  color: theme.textPrimary,
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  padding: 20,
  fontFamily: theme.fontSans,
  lineHeight: 1.5,
  minWidth: 0,
  overflowWrap: "anywhere"
};
var button = {
  color: theme.textPrimary,
  background: theme.bgSecondary,
  border: `1px solid ${theme.border}`,
  borderRadius: 6,
  padding: "6px 10px",
  font: "inherit",
  cursor: "pointer"
};
var row = {
  borderBlockEnd: `1px solid ${theme.border}`,
  paddingBlock: 12
};
function Badges({ marks, markLabels }) {
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(import_jsx_runtime35.Fragment, { children: marks.map((mark, index) => /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
    "span",
    {
      style: {
        display: "inline-block",
        marginInlineEnd: 6,
        marginBlock: 3,
        padding: "2px 7px",
        borderRadius: 4,
        background: theme.accentBg
      },
      children: resolveInvestigationMarkLabel(markLabels, mark.kind)
    },
    index
  )) });
}
function Gaps({ gaps }) {
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(import_jsx_runtime35.Fragment, { children: gaps.map((gap, index) => /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { role: "status", children: gapMessages[gap.code] }, index)) });
}
function otherCandidates(nodeId, alternatives) {
  return {
    selectedWasCandidate: alternatives.includes(nodeId),
    otherCandidateIds: alternatives.filter((id) => id !== nodeId)
  };
}
function InvestigationPanel(props) {
  const coverageMode = resolveCoverageMode(props.coverageMode);
  if (!coverageMode) return /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("section", { "aria-label": "Investigation", className: props.className, style: { ...box, ...props.style }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("h2", { children: "Needs attention" }),
    /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { role: "alert", children: "Investigation is unavailable for this coverage mode." })
  ] });
  if (!props.port)
    return /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(
      "section",
      {
        "aria-label": "Investigation",
        className: props.className,
        style: { ...box, ...props.style },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("h2", { children: "Needs attention" }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { role: "status", children: "Investigation is unavailable for this recording." })
        ]
      }
    );
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(BoundInvestigationPanel, { ...props, coverageMode, port: props.port });
}
function BoundInvestigationPanel(props) {
  const controller = useInvestigationQuery(
    props.port,
    props.coverageMode === "directional" ? admitVisualExplanation : admitExplanation
  );
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(InvestigationPanelView, { ...props, controller });
}
function InvestigationPanelView({ port, className, style, controller, markLabels, coverageMode = "overall", showAttention = true, focusExternalRequests = true }) {
  const attention = (0, import_react56.useMemo)(
    () => showAttention ? admitAttention(port.attention) : void 0,
    [port.attention, showAttention]
  );
  const { owner, currentOwner, active, selected } = controller;
  const candidates = selected?.status === "ready" ? otherCandidates(selected.result.nodeId, selected.result.alternatives) : void 0;
  const explanationElement = (0, import_react56.useRef)(null);
  const attentionElements = (0, import_react56.useRef)(/* @__PURE__ */ new Map());
  const returnTo = (0, import_react56.useRef)(null);
  const focusIntent = (0, import_react56.useRef)(null);
  const [page, setPage] = (0, import_react56.useState)({ owner, count: 20 });
  const visible = page.owner === owner ? page.count : 20;
  const [showPath, setShowPath] = (0, import_react56.useState)(false);
  const [showImpact, setShowImpact] = (0, import_react56.useState)(false);
  const [showAlternatives, setShowAlternatives] = (0, import_react56.useState)(false);
  const lastRequest = (0, import_react56.useRef)(null);
  useIsomorphicLayoutEffect(() => {
    if (returnTo.current?.owner !== owner) returnTo.current = null;
    return () => {
      focusIntent.current = null;
    };
  }, [owner]);
  useIsomorphicLayoutEffect(() => {
    if (!selected || selected.request === lastRequest.current) return;
    lastRequest.current = selected.request;
    setShowPath(false);
    setShowImpact(false);
    setShowAlternatives(false);
    if (focusExternalRequests) focusIntent.current = { owner, kind: "explanation", request: selected.request };
  });
  useIsomorphicLayoutEffect(() => {
    const intent = focusIntent.current;
    if (!intent || intent.owner !== owner || currentOwner.current !== owner)
      return;
    if (intent.kind === "explanation") {
      if (selected?.request !== intent.request || active.current !== intent.request || intent.request.signal.aborted)
        return;
      focusIntent.current = null;
      explanationElement.current?.focus();
    } else if (!selected) {
      focusIntent.current = null;
      attentionElements.current.get(intent.nodeId)?.focus();
    }
  });
  const close = () => {
    const target = returnTo.current;
    focusIntent.current = target?.owner === owner ? { ...target, kind: "attention" } : null;
    controller.close();
  };
  const query = (nodeId, fromAttention = false) => {
    if (fromAttention) returnTo.current = { owner, nodeId };
    const request = controller.query(nodeId);
    focusIntent.current = { owner, kind: "explanation", request };
  };
  const label = (nodeId) => displayLabel(port.labels, nodeId);
  const item = (nodeId, index) => /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("li", { style: row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("span", { children: label(nodeId) }),
    " ",
    /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
      "button",
      {
        type: "button",
        style: button,
        "aria-label": `Investigate related item ${index + 1}`,
        onClick: () => query(nodeId),
        children: "Investigate"
      }
    )
  ] }, `${index}:${nodeId}`);
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(
    "section",
    {
      "aria-label": "Investigation",
      className,
      style: { ...box, ...style },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("h2", { style: { marginBlockStart: 0 }, children: showAttention ? "Needs attention" : "Understand this step" }),
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { style: { color: theme.textSecondary }, children: "Choose an item to inspect its recorded causes and effects." }),
        showAttention && (!attention ? /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { role: "alert", children: "The attention list could not be verified." }) : /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
          coverageMode === "directional" ? /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(CoverageSection, { context: "attention", coverage: attention }) : /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(Gaps, { gaps: attention.gaps }),
          attention.confidence === "incomplete" && attention.nodes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { role: "status", children: "Attention coverage is incomplete. Other outcomes remain unknown." }),
          !attention.nodes.length ? /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { children: attention.confidence === "incomplete" || attention.gaps.length ? "No attention items are available. Coverage is unknown." : "No attention items were reported in the supplied evidence." }) : /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("ul", { style: { listStyle: "none", padding: 0 }, children: attention.nodes.slice(0, selected ? 20 : visible).map((node, index) => /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("li", { style: row, children: [
            /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("div", { children: label(node.nodeId) }),
            /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(Badges, { marks: node.attention, markLabels }),
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
              "button",
              {
                ref: (element) => {
                  if (element)
                    attentionElements.current.set(node.nodeId, element);
                  else attentionElements.current.delete(node.nodeId);
                },
                type: "button",
                style: button,
                "aria-label": `Investigate item ${index + 1}`,
                onClick: () => query(node.nodeId, true),
                children: "Investigate"
              }
            )
          ] }, node.nodeId)) }),
          !selected && attention.nodes.length > visible && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
            "button",
            {
              type: "button",
              style: button,
              onClick: () => setPage({ owner, count: visible + 20 }),
              children: "Show more attention items"
            }
          )
        ] })),
        selected && /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(
          "section",
          {
            ref: explanationElement,
            tabIndex: -1,
            "aria-label": "Selected explanation",
            "aria-busy": selected.status === "loading",
            style: {
              borderBlockStart: `1px solid ${theme.border}`,
              marginBlockStart: 20,
              paddingBlockStart: 16
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("button", { type: "button", style: button, onClick: close, children: "Close investigation" }),
              /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("h3", { children: label(selected.nodeId) }),
              selected.status === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { role: "status", children: "Loading explanation\u2026" }) : selected.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { role: "alert", children: "Explanation unavailable. Try again." }),
                /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
                  "button",
                  {
                    type: "button",
                    style: button,
                    onClick: () => query(selected.nodeId),
                    children: "Try again"
                  }
                )
              ] }) : selected.status === "refused" ? /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { role: "alert", children: "This explanation could not be verified." }),
                /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { children: "Its evidence is unsupported, too large, or from a different selection." })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(Badges, { marks: selected.result.attention, markLabels }),
                /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("h4", { children: selected.result.rootCause ? coverageMode === "directional" && !supportsRecordedRoot(selected.result) ? "Reported root cause" : "Supported root cause" : "Root cause unknown" }),
                selected.result.rootCause && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { children: label(selected.result.rootCause) }),
                !selected.result.rootCause && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { children: "The supplied evidence does not establish one root cause." }),
                coverageMode === "directional" ? /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(CoverageSection, { context: "backward", coverage: selected.result.backward }),
                  /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(CoverageSection, { context: "overall", coverage: selected.result })
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
                  !!selected.result.gaps.length && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("h4", { children: "Evidence coverage" }),
                  /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(Gaps, { gaps: selected.result.gaps }),
                  selected.result.confidence === "incomplete" && !selected.result.gaps.length && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { role: "status", children: "The recorded explanation is incomplete." })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)("details", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("summary", { children: "Recorded evidence references" }),
                  /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("ul", { children: [
                    ...selected.result.attention.flatMap(
                      (mark) => mark.evidence
                    ),
                    ...selected.result.gaps.flatMap((gap) => gap.evidence),
                    ...selected.result.impact.gaps.flatMap(
                      (gap) => gap.evidence
                    ),
                    ...coverageMode === "directional" ? selected.result.backward?.gaps.flatMap((gap) => gap.evidence) ?? [] : []
                  ].map((reference, index) => /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("li", { children: reference }, index)) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
                  "button",
                  {
                    type: "button",
                    style: button,
                    "aria-expanded": showPath,
                    onClick: () => setShowPath((value) => !value),
                    children: showPath ? "Hide recorded path" : "Show recorded path"
                  }
                ),
                showPath && /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("h4", { children: "Recorded dependency path" }),
                  selected.result.path.length ? /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("ol", { children: selected.result.path.map(item) }) : /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { children: "No dependency path was supplied." })
                ] }),
                candidates && !!selected.result.alternatives.length && /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("h4", { children: "Other candidates" }),
                  candidates.selectedWasCandidate && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { children: "The selected item is included in the supplied candidate list." }),
                  candidates.otherCandidateIds.length ? /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { children: "These candidates remain uncertain." }),
                    /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
                      "button",
                      {
                        type: "button",
                        style: button,
                        "aria-expanded": showAlternatives,
                        onClick: () => setShowAlternatives((value) => !value),
                        children: showAlternatives ? "Hide other candidates" : "Show other candidates"
                      }
                    ),
                    showAlternatives && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("ul", { children: candidates.otherCandidateIds.map(item) })
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { children: "No other candidates were supplied. This does not establish one root cause." })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("div", { style: { marginBlockStart: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
                  "button",
                  {
                    type: "button",
                    style: button,
                    "aria-expanded": showImpact,
                    onClick: () => setShowImpact((value) => !value),
                    children: showImpact ? "Hide affected items" : "Show affected items"
                  }
                ) }),
                coverageMode === "directional" && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(CoverageSection, { context: "impact", coverage: selected.result.impact }),
                showImpact && /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("h4", { children: "Affected items" }),
                  coverageMode === "overall" && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(Gaps, { gaps: selected.result.impact.gaps }),
                  coverageMode === "overall" && selected.result.impact.confidence === "incomplete" && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { role: "status", children: "Affected-item coverage is incomplete. Unlisted items remain unknown." }),
                  selected.result.impact.nodes.length ? /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("ul", { children: selected.result.impact.nodes.map(item) }) : /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { children: "No affected items were reported in the supplied evidence." })
                ] })
              ] })
            ]
          }
        )
      ]
    }
  );
}

// src/components/GroupedFlowInvestigation/projection.ts
function projectInvestigation(definition, result, direction) {
  const known = new Map(definition.nodes.map((node) => [node.id, node]));
  const source = direction === "cause" ? result.backward : result.impact;
  const references = direction === "cause" ? result.backward?.nodes ?? result.path : result.impact.nodes;
  const ids = /* @__PURE__ */ new Set([result.nodeId, ...references, ...direction === "cause" && result.rootCause ? [result.rootCause] : []]);
  const relationshipIds = new Set(definition.edges.map((edge) => edge.id));
  const relationships = [];
  let sequence = 0;
  for (const edge of source?.edges ?? []) {
    ids.add(edge.from);
    ids.add(edge.to);
    if (!known.has(edge.from) || !known.has(edge.to)) continue;
    let id;
    do {
      id = `recorded-dependency:${sequence++}`;
    } while (relationshipIds.has(id));
    relationshipIds.add(id);
    relationships.push({
      id,
      source: edge.from,
      target: edge.to,
      kind: edge.kind,
      attribution: edge.attribution,
      evidence: edge.evidence,
      direction: direction === "cause" ? "backward" : "forward"
    });
  }
  const nodeIds = [...ids].filter((id) => known.has(id));
  const groupIds = /* @__PURE__ */ new Set();
  for (const id of nodeIds) {
    let parent = known.get(id)?.parentId;
    while (parent !== void 0) {
      groupIds.add(parent);
      parent = known.get(parent)?.parentId;
    }
  }
  return {
    nodeIds,
    groupIds: [...groupIds],
    relationships,
    unmapped: ids.size - nodeIds.length,
    relationshipsAvailable: source?.edges !== void 0,
    confidence: source?.confidence,
    gaps: source?.gaps ?? []
  };
}

// src/components/GroupedFlowInvestigation/DependencyEvidence.tsx
var import_jsx_runtime36 = require("react/jsx-runtime");
function DependencyEvidence({ result, direction, labels }) {
  const source = direction === "cause" ? result.backward : result.impact;
  if (!source?.edges) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("details", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("summary", { children: [
      "Recorded dependency evidence (",
      source.edges.length,
      ")"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("p", { children: "These are the returned relationships, including references outside this diagram. Names do not establish identity or a cause." }),
    /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("ol", { children: source.edges.slice(0, 64).map((edge, index) => /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("li", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("span", { children: [
        displayLabel(labels, edge.from),
        " \u2192 ",
        displayLabel(labels, edge.to),
        " \xB7 ",
        edge.kind,
        " \xB7 ",
        edge.attribution
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("ul", { children: edge.evidence.map((reference, at2) => /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("li", { children: reference }, at2)) })
    ] }, index)) }),
    source.edges.length > 64 && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("p", { children: [
      source.edges.length - 64,
      " additional relationships are retained in the admitted result and not expanded here."
    ] }),
    !source.edges.length && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("p", { children: "No relationships were returned for this direction. This is not evidence of success or absence of external effects." })
  ] });
}

// src/components/GroupedFlowInvestigation/GroupedFlowInvestigation.tsx
var import_jsx_runtime37 = require("react/jsx-runtime");
var action = { font: "inherit", fontSize: 12, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "7px 12px", background: theme.bgElevated, color: theme.textPrimary, cursor: "pointer" };
function GroupedFlowInvestigation(props) {
  const admitted = (0, import_react57.useMemo)(() => {
    return projectGroupedFlowDiagram(props.definition, { observation: props.observation });
  }, [props.definition, props.observation]);
  const coverageMode = resolveCoverageMode(props.coverageMode);
  if (!coverageMode) return /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("section", { className: props.className, style: props.style, children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { role: "alert", children: "Investigation is unavailable for this coverage mode." }) });
  if (!admitted.model) return /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(GroupedFlowDiagram, { definition: props.definition, observation: props.observation, className: props.className, style: props.style });
  if (!props.port) return /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("section", { className: props.className, style: props.style, children: [
    /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(GroupedFlowDiagram, { definition: admitted.model.definition, observation: props.observation, direction: props.direction }),
    /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(InvestigationPanel, { port: null })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(BoundGroupedFlowInvestigation, { ...props, coverageMode, port: props.port, admitted: admitted.model });
}
function BoundGroupedFlowInvestigation({ admitted, port, ...props }) {
  const controller = useInvestigationQuery(port, admitVisualExplanation);
  const { owner, selected } = controller;
  const ready = selected?.status === "ready" ? selected : void 0;
  const committedResult = (0, import_react57.useRef)(void 0);
  useIsomorphicLayoutEffect(() => {
    committedResult.current = ready ? { owner, request: ready.request } : void 0;
    return () => {
      committedResult.current = void 0;
    };
  }, [owner, ready]);
  const [expansion, setExpansion] = (0, import_react57.useState)({ owner, ids: [] });
  const [mode, setMode] = (0, import_react57.useState)();
  const [focusCommand, setFocusCommand] = (0, import_react57.useState)();
  const [view, setView] = (0, import_react57.useState)();
  const activeView = view?.request === ready?.request ? view : void 0;
  const whole = activeView?.whole ?? false;
  const phase = mode && mode.request === selected?.request ? mode.value : "cause";
  const diagramBindings = (0, import_react57.useRef)(/* @__PURE__ */ new WeakMap());
  const nextDiagramBinding = (0, import_react57.useRef)(0);
  const diagramBindingKey = (0, import_react57.useMemo)(() => {
    let key = diagramBindings.current.get(owner);
    if (key === void 0) {
      key = nextDiagramBinding.current++;
      diagramBindings.current.set(owner, key);
    }
    return key;
  }, [owner]);
  const known = (0, import_react57.useMemo)(() => new Map(admitted.definition.nodes.map((node) => [node.id, node])), [admitted.definition]);
  const states = (0, import_react57.useMemo)(() => new Map(Object.entries(admitted.nodeStates ?? {})), [admitted]);
  const projected = (0, import_react57.useMemo)(() => ready ? projectInvestigation(admitted.definition, ready.result, phase) : void 0, [admitted.definition, ready, phase]);
  const currentIds = expansion.owner === owner ? expansion.ids : [];
  const automaticExpansion = (0, import_react57.useRef)(void 0);
  const needsReveal = ready && (automaticExpansion.current?.request !== ready.request || automaticExpansion.current?.phase !== phase);
  const expandedGroupIds = needsReveal ? [.../* @__PURE__ */ new Set([...currentIds, ...projected?.groupIds ?? []])] : currentIds;
  useIsomorphicLayoutEffect(() => {
    if (!ready || !needsReveal) return;
    automaticExpansion.current = { request: ready.request, phase };
    setExpansion({ owner, ids: expandedGroupIds });
  });
  const selectedId = controller.selection && known.has(controller.selection) ? controller.selection : null;
  const activeFocusCommand = focusCommand?.request === ready?.request && focusCommand?.phase === phase ? focusCommand : void 0;
  const cameraKey = (0, import_react57.useMemo)(() => ({ owner, request: ready?.request, phase, command: activeFocusCommand, view: activeView }), [owner, ready?.request, phase, activeFocusCommand, activeView]);
  const recordedFitIds = projected?.nodeIds ?? [];
  const focusNodeIds = ready && activeFocusCommand ? selectedId ? [selectedId] : [] : recordedFitIds;
  const choose = (nodeId) => {
    if (!known.has(nodeId)) return;
    if (states.get(nodeId) === "failed") controller.query(nodeId);
    else controller.select(nodeId);
  };
  const root = ready?.result.rootCause;
  const reportedRoot = props.coverageMode === "directional" && ready && !supportsRecordedRoot(ready.result);
  let mappedRoot = root && known.has(root) ? root : void 0;
  for (let id = mappedRoot; id !== void 0; id = known.get(id)?.parentId) {
    if (states.get(id) === "not-run") {
      mappedRoot = void 0;
      break;
    }
  }
  const summary = selected?.status === "loading" ? "Checking recorded evidence\u2026" : ready && mappedRoot ? `${reportedRoot ? "Reported" : "Supported"} cause: ${known.get(mappedRoot).label}. ${phase === "cause" ? "The recorded path is highlighted below." : "Showing recorded affected items below."}` : ready && root && !known.has(root) ? `The ${reportedRoot ? "reported" : "supported"} cause is not shown in this diagram. No substitute card is labelled.` : ready || selected?.status === "error" || selected?.status === "refused" ? "Cause unknown. The available evidence does not support a cause on this diagram." : "Select a failed item, or select another item and choose Investigate selected item.";
  const changeView = () => {
    if (!ready || controller.currentOwner.current !== owner || committedResult.current?.owner !== owner || committedResult.current.request !== ready.request) return;
    setView({ request: ready.request, whole: !whole });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(
    "section",
    {
      className: props.className,
      "aria-label": props["aria-label"] ?? "Grouped flow investigation",
      style: { display: "grid", gap: 16, minWidth: 0, color: theme.textPrimary, fontFamily: theme.fontSans, ...props.style },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("div", { role: "status", "aria-label": "Cause summary", "aria-live": "polite", style: { padding: "12px 16px", border: `1px solid ${theme.border}`, borderRadius: 10, background: theme.bgElevated }, children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("strong", { children: summary }) }),
        ready && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("strong", { children: whole ? "Whole flow" : phase === "cause" ? "Cause focus" : "Impact focus" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { type: "button", style: action, onClick: changeView, children: whole ? "Focus on recorded links" : "Show whole flow" }),
          !whole && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("span", { style: { fontSize: 12, color: theme.textSecondary }, children: "Workflow arrows are hidden so the recorded connections are easier to follow." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(RecordedFocusContext.Provider, { value: { focused: !!ready && !whole, fitNodeIds: recordedFitIds }, children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
          GroupedFlowDiagram,
          {
            definition: admitted.definition,
            observation: props.observation,
            direction: props.direction,
            selectedNodeId: selectedId,
            onSelectNode: choose,
            expandedGroupIds,
            onExpandedGroupIdsChange: (ids) => setExpansion({ owner, ids }),
            highlight: projected ? { nodeIds: projected.nodeIds, ...phase === "cause" && mappedRoot && !reportedRoot ? { rootCauseId: mappedRoot } : {} } : void 0,
            recordedRelationships: projected?.relationships,
            focusRequest: ready && (whole || focusNodeIds.length) ? { key: cameraKey, nodeIds: whole ? [] : focusNodeIds } : void 0
          },
          diagramBindingKey
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { type: "button", style: action, disabled: !selectedId || selected?.status === "loading", onClick: () => {
            if (selectedId) controller.query(selectedId);
          }, children: "Investigate selected item" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { type: "button", style: action, disabled: !ready, "aria-pressed": phase === "cause", onClick: () => {
            if (ready) setMode({ request: ready.request, value: "cause" });
          }, children: "Why it happened" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { type: "button", style: action, disabled: !ready, "aria-pressed": phase === "impact", onClick: () => {
            if (ready) setMode({ request: ready.request, value: "impact" });
          }, children: "What it affected" }),
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("button", { type: "button", style: action, disabled: !ready || !selectedId, onClick: () => {
            if (ready) setFocusCommand((previous) => ({ request: ready.request, phase, count: (previous?.count ?? 0) + 1 }));
          }, children: "Back to selected item" })
        ] }),
        projected && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { role: "status", children: [
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { children: phase === "cause" ? "Dependency arrows point from an item toward its recorded source. They do not show execution order or prove how a value was used." : "Arrows show returned recorded relationships to linked items, not proof of harm or delivery." }),
          !projected.relationshipsAvailable && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { children: phase === "cause" ? "Backward connections were not provided. References can be shown, but missing links remain unknown." : "Impact connections were not provided. The full effect of these references remains unknown." }),
          projected.confidence === "incomplete" && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { children: "Some evidence is missing. The highlighted references do not establish the full dependency picture." }),
          projected.unmapped > 0 && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("p", { children: [
            projected.unmapped,
            " recorded ",
            projected.unmapped === 1 ? "item is" : "items are",
            " not shown in this diagram. No substitute item has been selected."
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(InvestigationPanelView, { port, controller, markLabels: props.markLabels, coverageMode: props.coverageMode, showAttention: false, focusExternalRequests: false }),
        ready && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(DependencyEvidence, { result: ready.result, direction: phase, labels: port.labels })
      ]
    }
  );
}

// src/adapters/fromRuntimeSnapshot.ts
function looksLikeNarrativeEntry(value) {
  if (value === null || typeof value !== "object") return false;
  const e = value;
  return typeof e.type === "string" && typeof e.text === "string" && typeof e.depth === "number";
}
function readEntries(data) {
  const candidate = Array.isArray(data) ? data : isPlainRecord2(data) && Array.isArray(data.entries) ? data.entries : void 0;
  if (!candidate || candidate.length === 0) return void 0;
  return looksLikeNarrativeEntry(candidate[0]) ? candidate : void 0;
}
function narrativeRecorderFromSnapshot(runtime) {
  const recorders = isPlainRecord2(runtime) ? runtime.recorders : void 0;
  if (!Array.isArray(recorders)) return void 0;
  let firstMatch;
  for (const rec of recorders) {
    if (!isPlainRecord2(rec)) continue;
    const entries = readEntries(rec.data);
    if (!entries) continue;
    const match = { id: typeof rec.id === "string" ? rec.id : "", entries };
    const name = typeof rec.name === "string" ? rec.name : "";
    if (/narrative|story/i.test(name)) return match;
    firstMatch ?? (firstMatch = match);
  }
  return firstMatch;
}
function narrativeFromSnapshot(runtime) {
  return narrativeRecorderFromSnapshot(runtime)?.entries;
}
var COMMIT_PATH_DELIM = "";
var UNSAFE_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
function isSummaryMarker(value) {
  return value !== null && typeof value === "object" && (value.__writeSummary === true || value.__readSummary === true);
}
function isPlainRecord2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function mergeWritePatch(base, patch) {
  if (isSummaryMarker(patch)) return patch;
  if (patch === null || typeof patch !== "object") return patch;
  if (Array.isArray(patch)) return patch;
  if (isSummaryMarker(base) || !isPlainRecord2(base)) {
    base = {};
  }
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (UNSAFE_KEYS.has(key)) continue;
    out[key] = mergeWritePatch(out[key], value);
  }
  return out;
}
function getPath(root, segs) {
  let cur = root;
  for (const seg of segs) {
    if (!isPlainRecord2(cur) && !Array.isArray(cur)) return void 0;
    cur = cur[seg];
  }
  return cur;
}
function setPath(memory, segs, value) {
  if (segs.some((s) => UNSAFE_KEYS.has(s))) return;
  let obj = memory;
  for (let i = 0; i < segs.length - 1; i++) {
    const cur = obj[segs[i]];
    const next = Array.isArray(cur) ? cur.slice() : isPlainRecord2(cur) && !isSummaryMarker(cur) ? { ...cur } : {};
    obj[segs[i]] = next;
    obj = next;
  }
  const last = segs[segs.length - 1];
  if (value === void 0) {
    delete obj[last];
  } else {
    obj[last] = value;
  }
}
function applyCommitBundle(memory, bundle) {
  const trace = Array.isArray(bundle.trace) ? bundle.trace : void 0;
  if (trace) {
    for (const op of trace) {
      if (!op || typeof op.path !== "string") continue;
      const segs = op.path.split(COMMIT_PATH_DELIM);
      if (op.verb === "merge") {
        setPath(memory, segs, mergeWritePatch(getPath(memory, segs), getPath(bundle.updates, segs)));
      } else if (op.verb === "append") {
        const tail = getPath(bundle.overwrite, segs);
        const current = getPath(memory, segs);
        setPath(memory, segs, Array.isArray(current) && Array.isArray(tail) ? [...current, ...tail] : tail);
      } else if (op.verb === "delete") {
        setPath(memory, segs, void 0);
      } else {
        setPath(memory, segs, getPath(bundle.overwrite, segs));
      }
    }
    return;
  }
  if (isPlainRecord2(bundle.overwrite)) {
    for (const [key, value] of Object.entries(bundle.overwrite)) setPath(memory, [key], value);
  }
  if (isPlainRecord2(bundle.updates)) {
    for (const [key, value] of Object.entries(bundle.updates)) {
      setPath(memory, [key], mergeWritePatch(memory[key], value));
    }
  }
}
function indexCommitLog(commitLog) {
  const index = /* @__PURE__ */ new Map();
  if (!Array.isArray(commitLog)) return index;
  for (const entry of commitLog) {
    if (!isPlainRecord2(entry)) continue;
    const bundle = entry;
    if (typeof bundle.runtimeStageId !== "string" || bundle.runtimeStageId.length === 0) continue;
    if (!isPlainRecord2(bundle.overwrite) && !isPlainRecord2(bundle.updates) && !Array.isArray(bundle.trace)) {
      continue;
    }
    const list2 = index.get(bundle.runtimeStageId);
    if (list2) list2.push(bundle);
    else index.set(bundle.runtimeStageId, [bundle]);
  }
  return index;
}
function toVisualizationSnapshots(runtime, narrativeEntries) {
  const entries = narrativeEntries?.length ? narrativeEntries : narrativeFromSnapshot(runtime);
  const stageNarrativeMap = entries?.length ? buildStageNarrativeMap(entries) : /* @__PURE__ */ new Map();
  if (runtime?.executionTree === null || typeof runtime?.executionTree !== "object") return [];
  const stageTimings = extractStageTimings(runtime.recorders);
  const commitIndex = indexCommitLog(runtime.commitLog);
  const snapshots = [];
  flattenTree(runtime.executionTree, snapshots, runtime.sharedState, 0, runtime.subflowResults, {}, stageNarrativeMap, stageTimings, commitIndex);
  return snapshots;
}
function readStepDurations(data) {
  if (!isPlainRecord2(data)) return void 0;
  const steps = data.steps;
  if (!isPlainRecord2(steps)) return void 0;
  const first = Object.values(steps)[0];
  if (!isPlainRecord2(first) || typeof first.duration !== "number") return void 0;
  return steps;
}
function readAggregateDurations(data) {
  if (!isPlainRecord2(data)) return void 0;
  const stages = data.stages;
  if (!isPlainRecord2(stages)) return void 0;
  const first = Object.values(stages)[0];
  if (!isPlainRecord2(first) || typeof first.totalDuration !== "number") return void 0;
  return stages;
}
function extractStageTimings(recorders) {
  const byRuntimeStageId = /* @__PURE__ */ new Map();
  const byStageName = /* @__PURE__ */ new Map();
  if (!recorders) return { byRuntimeStageId, byStageName };
  for (const rec of recorders) {
    const steps = readStepDurations(rec?.data);
    if (steps) {
      for (const [runtimeStageId, step] of Object.entries(steps)) {
        const d = step?.duration;
        if (typeof d !== "number" || d <= 0 || byRuntimeStageId.has(runtimeStageId)) continue;
        byRuntimeStageId.set(runtimeStageId, Math.round(d));
      }
    }
    const stages = readAggregateDurations(rec?.data);
    if (stages) {
      for (const [stageName, metrics] of Object.entries(stages)) {
        if (typeof metrics.totalDuration === "number" && metrics.totalDuration > 0) {
          byStageName.set(stageName, Math.round(metrics.totalDuration));
        }
      }
    }
  }
  return { byRuntimeStageId, byStageName };
}
function buildStageNarrativeMap(entries) {
  const map = /* @__PURE__ */ new Map();
  let currentStageName;
  for (const entry of entries) {
    if (entry.stageName) {
      currentStageName = entry.stageName;
    }
    if (currentStageName) {
      if (!map.has(currentStageName)) {
        map.set(currentStageName, []);
      }
      const indent = "  ".repeat(entry.depth);
      map.get(currentStageName).push(`${indent}${entry.text}`);
    }
  }
  return map;
}
function flattenTree(node, out, sharedState, accumulatedMs = 0, subflowResults, cumulativeMemory = {}, stageNarrativeMap = /* @__PURE__ */ new Map(), stageTimings = {
  byRuntimeStageId: /* @__PURE__ */ new Map(),
  byStageName: /* @__PURE__ */ new Map()
}, commitIndex = /* @__PURE__ */ new Map()) {
  const frameFor = (node2, start, inherited) => ({
    node: node2,
    start,
    inherited,
    phase: "enter",
    end: start,
    childrenStart: start,
    childIndex: 0,
    waiting: false
  });
  const frames = [frameFor(node, accumulatedMs, cumulativeMemory)];
  const active = /* @__PURE__ */ new Set();
  const seen = /* @__PURE__ */ new Set();
  let completedMs = accumulatedMs;
  while (frames.length) {
    const frame = frames[frames.length - 1];
    if (frame.phase === "enter") {
      if (active.has(frame.node))
        throw new Error("Recorded stage tree contains a cycle");
      if (seen.has(frame.node))
        throw new Error("Recorded stage tree contains shared nodes");
      seen.add(frame.node);
      active.add(frame.node);
      const node2 = frame.node;
      if (node2.children && !Array.isArray(node2.children))
        throw new Error("Recorded stage tree has an invalid child list");
      const accumulatedMs2 = frame.start;
      const cumulativeMemory2 = frame.inherited;
      const stageName = node2.name ?? node2.id;
      const durationMs = (node2.runtimeStageId ? stageTimings.byRuntimeStageId.get(node2.runtimeStageId) : void 0) ?? (stageName ? stageTimings.byStageName.get(stageName) : void 0) ?? (typeof node2.metrics?.durationMs === "number" ? node2.metrics.durationMs : 0);
      const startMs = accumulatedMs2;
      const stageId = node2.id || node2.name || "unknown";
      const displayName = node2.name || node2.id || "unknown";
      const stageLines = stageNarrativeMap.get(stageId) ?? stageNarrativeMap.get(displayName);
      let narrative;
      if (stageLines) {
        narrative = stageLines.join("\n");
      } else {
        const parts = [`${displayName} executed.`];
        if (node2.description) parts.push(node2.description);
        if (node2.stageWrites) {
          const keys = Object.keys(node2.stageWrites);
          if (keys.length > 0) parts.push(`Wrote: ${keys.join(", ")}`);
        }
        narrative = parts.join("\n");
      }
      const memory = { ...cumulativeMemory2 };
      const bundles = node2.runtimeStageId ? commitIndex.get(node2.runtimeStageId) : void 0;
      if (bundles && bundles.length > 0) {
        for (const bundle of bundles) applyCommitBundle(memory, bundle);
      } else if (node2.stageWrites) {
        for (const [key, value] of Object.entries(node2.stageWrites)) {
          if (UNSAFE_KEYS.has(key)) continue;
          if (value === void 0) {
            delete memory[key];
          } else {
            memory[key] = mergeWritePatch(memory[key], value);
          }
        }
      }
      const sfResult = (node2.runtimeStageId && subflowResults && Object.prototype.hasOwnProperty.call(
        subflowResults,
        node2.runtimeStageId
      ) ? subflowResults[node2.runtimeStageId] : void 0) ?? (subflowResults && Object.prototype.hasOwnProperty.call(
        subflowResults,
        node2.subflowId ?? stageId
      ) ? subflowResults[node2.subflowId ?? stageId] : void 0);
      out.push({
        stageName: displayName,
        stageLabel: stageId,
        runtimeStageId: node2.runtimeStageId ?? void 0,
        memory,
        narrative,
        startMs,
        durationMs,
        status: "done",
        ...node2.description ? { description: node2.description } : void 0,
        ...node2.subflowId ? { subflowId: node2.subflowId } : void 0,
        ...sfResult ? { subflowResult: sfResult } : void 0
      });
      frame.memory = memory;
      frame.end = startMs + durationMs;
      frame.childrenStart = frame.end;
      frame.phase = "children";
    }
    if (frame.phase === "children") {
      if (frame.waiting) {
        frame.end = Math.max(frame.end, completedMs);
        frame.waiting = false;
      }
      if (frame.node.children && frame.childIndex < frame.node.children.length) {
        const child = frame.node.children[frame.childIndex++];
        if (!child || typeof child !== "object")
          throw new Error("Recorded stage tree has an invalid child");
        frame.waiting = true;
        frames.push(frameFor(child, frame.childrenStart, frame.memory));
        continue;
      }
      frame.phase = "continuation";
    }
    if (frame.phase === "continuation" && frame.node.next) {
      frame.phase = "return";
      frames.push(frameFor(frame.node.next, frame.end, frame.memory));
      continue;
    }
    completedMs = frame.phase === "return" ? completedMs : frame.end;
    active.delete(frame.node);
    frames.pop();
  }
  return completedMs;
}
function subflowResultToSnapshots(subflowResult, narrativeEntries, subflowResults) {
  if (!subflowResult || typeof subflowResult !== "object") return [];
  const sf = subflowResult;
  if (!sf.treeContext?.stageContexts) return [];
  const runtime = {
    sharedState: sf.treeContext.globalContext ?? {},
    executionTree: sf.treeContext.stageContexts,
    commitLog: sf.treeContext.history ?? [],
    ...subflowResults ? { subflowResults } : void 0
  };
  const snapshots = toVisualizationSnapshots(runtime, narrativeEntries);
  const prefix = sf.subflowId ? `${sf.subflowId}/` : "";
  if (prefix) {
    for (const snap of snapshots) {
      if (snap.stageName.startsWith(prefix)) {
        snap.stageName = snap.stageName.slice(prefix.length);
      }
      if (snap.stageLabel.startsWith(prefix)) {
        snap.stageLabel = snap.stageLabel.slice(prefix.length);
      }
    }
  }
  return snapshots;
}

// src/progressiveRendering/scheduler/task.ts
var BACKGROUND_TIMEOUT_MS = 100;
function scheduleTask(callback, options = {}) {
  const host = globalThis;
  const { signal, background = false } = options;
  if (signal?.aborted) return () => void 0;
  let finished = false, nativeCallbackThrew = false;
  let timer;
  let idle;
  let native;
  const clean = (fromNative = false) => {
    if (timer !== void 0) clearTimeout(timer);
    if (idle !== void 0) host.cancelIdleCallback?.(idle);
    if (!fromNative) native?.abort();
    signal?.removeEventListener("abort", cancel);
  };
  function cancel() {
    if (!finished) {
      finished = true;
      clean();
    }
  }
  const run = (fromNative = false) => {
    if (finished) return;
    finished = true;
    clean(fromNative);
    try {
      callback();
    } catch (error) {
      nativeCallbackThrew = fromNative;
      throw error;
    }
  };
  const fallback2 = (delay = 0) => {
    if (!finished && timer === void 0) timer = setTimeout(() => run(), delay);
  };
  signal?.addEventListener("abort", cancel, { once: true });
  if (background && typeof host.requestIdleCallback === "function") {
    fallback2(BACKGROUND_TIMEOUT_MS);
    try {
      idle = host.requestIdleCallback(() => run(), { timeout: BACKGROUND_TIMEOUT_MS });
    } catch {
    }
  } else if (typeof host.scheduler?.postTask === "function") {
    native = new AbortController();
    if (background) fallback2(BACKGROUND_TIMEOUT_MS);
    try {
      const pending = host.scheduler.postTask(() => run(true), { priority: background ? "background" : "user-visible", signal: native.signal });
      Promise.resolve(pending).catch((error) => {
        if (nativeCallbackThrew) setTimeout(() => {
          throw error;
        }, 0);
        else if (!finished) fallback2();
      });
    } catch (error) {
      if (nativeCallbackThrew) setTimeout(() => {
        throw error;
      }, 0);
      else fallback2();
    }
  } else fallback2(background ? BACKGROUND_TIMEOUT_MS : 0);
  return cancel;
}

// src/progressiveRendering/scheduler/visual.ts
var FRAME_FALLBACK_MS = 100;
function scheduleVisual(callback) {
  const host = globalThis;
  let finished = false;
  let frame;
  let timer;
  const clean = () => {
    if (timer !== void 0) clearTimeout(timer);
    if (frame !== void 0) host.cancelAnimationFrame?.(frame);
  };
  const run = () => {
    if (!finished) {
      finished = true;
      clean();
      callback();
    }
  };
  const hidden = typeof document !== "undefined" && document.hidden;
  timer = setTimeout(run, hidden ? 0 : FRAME_FALLBACK_MS);
  if (!hidden && typeof host.requestAnimationFrame === "function") {
    try {
      frame = host.requestAnimationFrame(run);
    } catch {
    }
  } else {
    clearTimeout(timer);
    timer = setTimeout(run, 0);
  }
  return () => {
    if (!finished) {
      finished = true;
      clean();
    }
  };
}

// src/progressiveRendering/scheduler/yield.ts
function cancelled() {
  const error = new Error("Preparation was cancelled.");
  error.name = "AbortError";
  return error;
}
function yieldToHost(signal) {
  if (signal?.aborted) return Promise.reject(cancelled());
  return new Promise((resolve, reject) => {
    let finished = false;
    let cancel = () => void 0;
    const abort = () => {
      if (finished) return;
      finished = true;
      cancel();
      signal?.removeEventListener("abort", abort);
      reject(cancelled());
    };
    signal?.addEventListener("abort", abort, { once: true });
    cancel = scheduleTask(() => {
      if (finished) return;
      finished = true;
      signal?.removeEventListener("abort", abort);
      resolve();
    }, { signal });
  });
}

// src/trace/readProvenance.ts
function readTraceWrites(value, budget, allowMissing = false) {
  if (value === void 0 && allowMissing) return [];
  return readOwnArray(value, budget).map((write) => {
    const path = readName(optionalOwnDataField(write, "path"));
    const reads = optionalOwnDataField(write, "readKeys");
    return { path, ...reads === void 0 ? {} : {
      readKeys: [...new Set(readOwnArray(reads, budget).map(readName))]
    } };
  });
}

// src/trace/readTiming.ts
var count = (value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 2 ** 52;
var unavailable = () => {
  throw new TraceAdmissionError("malformed");
};
function readCommitTiming(entry) {
  const idx = optionalOwnDataField(entry, "idx"), beganAt = optionalOwnDataField(entry, "beganAt"), sawUntil = optionalOwnDataField(entry, "sawUntil");
  if (idx !== void 0 && !count(idx)) unavailable();
  if (beganAt !== void 0 && (!count(beganAt) || idx === void 0 || beganAt >= idx)) unavailable();
  if (sawUntil !== void 0 && (!count(sawUntil) || beganAt === void 0 || sawUntil <= beganAt || sawUntil > idx)) unavailable();
  return {
    ...idx === void 0 ? {} : { idx },
    ...beganAt === void 0 ? {} : { beganAt },
    ...sawUntil === void 0 ? {} : { sawUntil }
  };
}
function indexReadWindows(log) {
  const stamped = log.some((entry) => entry.beganAt !== void 0 || entry.sawUntil !== void 0);
  let prior;
  for (const entry of log) {
    if (entry.idx === void 0) {
      if (stamped) unavailable();
      continue;
    }
    if (prior !== void 0 && (entry.idx <= prior || stamped && entry.idx !== prior + 1)) unavailable();
    prior = entry.idx;
  }
  const positionOf = (native) => {
    let low = 0, high = log.length;
    while (low < high) {
      const middle = low + high >>> 1;
      if (log[middle].idx < native) low = middle + 1;
      else high = middle;
    }
    return low;
  };
  return log.map((entry, position) => entry.beganAt === void 0 ? { start: position, end: position } : { start: positionOf(entry.beganAt), end: positionOf(entry.sawUntil ?? entry.beganAt) });
}

// src/trace/traceScope.ts
function emptyVisitPhase(entry, traceLength, budget) {
  const phase = ownDataField(entry, "phase");
  if (phase !== "exit" && phase !== "repeat" || traceLength !== 0 || !entry || typeof entry !== "object") return void 0;
  for (const field4 of ["overwrite", "updates"]) {
    const descriptor = Object.getOwnPropertyDescriptor(entry, field4);
    if (descriptor && !("value" in descriptor)) return void 0;
    const value = descriptor?.value;
    if (value === void 0) continue;
    if (!isPlainRecord(value)) return void 0;
    const keys = Object.keys(value);
    budget.spend(keys.length);
    if (keys.length) return void 0;
  }
  const redactions = Object.getOwnPropertyDescriptor(entry, "redactedPaths");
  if (redactions && !("value" in redactions)) return void 0;
  if (redactions?.value !== void 0 && (!Array.isArray(redactions.value) || ownDataField(redactions.value, "length") !== 0)) return void 0;
  return phase;
}
function childTraceScope(result, invocationPath, readsAvailable, nestedReadTracking) {
  const unavailable2 = (reason, items) => ({
    invocationPath,
    commitLog: [],
    executionTree: void 0,
    availability: {
      ok: false,
      reason,
      ...items === void 0 ? {} : { items }
    },
    readsAvailable: readsAvailable ?? false,
    ...nestedReadTracking === true ? { nestedReadTracking: true } : {},
    mountLabels: /* @__PURE__ */ new Map()
  });
  try {
    const budget = new WorkBudget();
    if (invocationPath.length === 0 || invocationPath.length > 128 || invocationPath.some(
      (part) => typeof part !== "string" || part.length === 0 || part.length > 4096
    ) || invocationPath.join("").length > 8192)
      return unavailable2("malformed");
    const context = ownDataField(result, "treeContext");
    const rawHistory = ownDataField(context, "history");
    if (rawHistory === void 0) return unavailable2("no-history");
    const history = readOwnArray(rawHistory, budget);
    if (history.length === 0) return unavailable2("no-history");
    const mountInvocation = invocationPath[invocationPath.length - 1];
    const firstId = ownDataField(history[0], "runtimeStageId");
    const start = firstId === "" || firstId === mountInvocation ? ownDataField(history[0], "overwrite") : void 0;
    const startKeys = [];
    if (isPlainRecord(start)) {
      const keys = Object.keys(start);
      budget.spend(keys.length);
      for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(start, key);
        if (descriptor && "value" in descriptor && descriptor.value !== void 0)
          startKeys.push(readName(key));
      }
    }
    const timings = history.map(readCommitTiming);
    indexReadWindows(timings);
    const recordedCommits = history.map((entry, index) => {
      const runtimeStageId = ownDataField(entry, "runtimeStageId");
      if (index === 0 && (runtimeStageId === "" || runtimeStageId === mountInvocation))
        return null;
      const trace = readTraceWrites(ownDataField(entry, "trace"), budget);
      const phase = emptyVisitPhase(entry, trace.length, budget);
      return {
        ...timings[index],
        stage: readName(ownDataField(entry, "stage")),
        stageId: readName(ownDataField(entry, "stageId")),
        runtimeStageId: readName(runtimeStageId),
        trace,
        ...phase ? { phase } : {}
      };
    });
    const executionTree = {};
    const queue = [
      [ownDataField(context, "stageContexts"), executionTree]
    ];
    const seen = /* @__PURE__ */ new Set();
    const runtimeIds = /* @__PURE__ */ new Set();
    const mountLabels = /* @__PURE__ */ new Map();
    let ownReads = false;
    for (let index = 0; index < queue.length; index++) {
      budget.spend(1);
      const [node, target] = queue[index];
      if (!isPlainRecord(node) || seen.has(node))
        return unavailable2("malformed");
      seen.add(node);
      target.runtimeStageId = readName(ownDataField(node, "runtimeStageId"));
      if (runtimeIds.has(target.runtimeStageId))
        return unavailable2("malformed");
      runtimeIds.add(target.runtimeStageId);
      const readDescriptor = Object.getOwnPropertyDescriptor(
        node,
        "stageReads"
      );
      if (readDescriptor && !("value" in readDescriptor))
        return unavailable2("malformed");
      const reads = ownDataField(node, "stageReads");
      if (reads !== void 0 && !isPlainRecord(reads))
        return unavailable2("malformed");
      if (isPlainRecord(reads)) {
        const keys = Object.keys(reads);
        budget.spend(keys.length);
        if (keys.some((key) => key.length > 4096))
          return unavailable2("malformed");
        target.stageReads = Object.fromEntries(keys.map((key) => [key, true]));
        ownReads || (ownReads = keys.length > 0);
      }
      const subflowId = ownDataField(node, "subflowId");
      if (typeof subflowId === "string" && subflowId.length > 0) {
        const name = optionalOwnDataField(node, "name");
        mountLabels.set(
          target.runtimeStageId,
          readName(
            typeof name === "string" && name.length > 0 ? name : subflowId
          )
        );
      }
      const next = ownDataField(node, "next");
      if (next !== void 0 && next !== null) {
        target.next = {};
        queue.push([next, target.next]);
      }
      const children = ownDataField(node, "children");
      if (children !== void 0)
        target.children = readOwnArray(children, budget).map((child) => {
          const projected = {};
          queue.push([child, projected]);
          return projected;
        });
    }
    const commitLog = recordedCommits.filter(
      (entry) => entry !== null
    );
    if (commitLog.some((entry) => !runtimeIds.has(entry.runtimeStageId)))
      return unavailable2("malformed");
    return {
      invocationPath,
      commitLog,
      executionTree,
      availability: { ok: true },
      readsAvailable: readsAvailable ?? (ownReads || commitLog.some((entry) => entry.trace.some((write) => write.readKeys !== void 0))),
      ...nestedReadTracking === true ? { nestedReadTracking: true } : {},
      mountLabels,
      startKeys: Object.freeze(startKeys)
    };
  } catch (error) {
    const failure = classifyAdmissionFailure(error);
    return unavailable2(failure.reason, failure.items);
  }
}

// src/progressiveRendering/prepare/data.ts
function invalid() {
  return new Error("Recorded subflow evidence could not be prepared.");
}
function abortError() {
  const error = new Error("Recorded subflow request was cancelled.");
  error.name = "AbortError";
  return error;
}
function checkSignal(signal) {
  if (signal?.aborted) throw abortError();
}
var own = optionalOwnDataField;
function copyData(input) {
  try {
    return copyOwnedData(input);
  } catch {
    throw invalid();
  }
}
function readonlyMap(entries) {
  const map = new Map(entries);
  const view = {
    get size() {
      return map.size;
    },
    get: (key) => map.get(key),
    has: (key) => map.has(key),
    entries: () => map.entries(),
    keys: () => map.keys(),
    values: () => map.values(),
    forEach(callback, thisArg) {
      map.forEach((value, key) => callback.call(thisArg, value, key, view));
    },
    [Symbol.iterator]: () => map[Symbol.iterator]()
  };
  return Object.freeze(view);
}

// src/progressiveRendering/prepare/admission.ts
function admitGraph(input, prefix) {
  const graph = copyData(input);
  const budget = new WorkBudget();
  const nodes = readOwnArray(own(graph, "nodes"), budget);
  const edges = readOwnArray(own(graph, "edges"), budget);
  const ids = /* @__PURE__ */ new Set();
  for (const node of nodes) {
    const id = readName(own(node, "id"));
    if (ids.has(id) || prefix && !id.startsWith(prefix)) throw invalid();
    ids.add(id);
    const position = own(node, "position");
    const data = own(node, "data");
    if (typeof own(position, "x") !== "number" || typeof own(position, "y") !== "number" || !isPlainRecord(data) || typeof own(data, "label") !== "string") throw invalid();
    for (const flag of ["isDecider", "isFork", "isSubflow", "isStreaming"]) if (typeof own(data, flag) !== "boolean") throw invalid();
    for (const field4 of ["prevIds", "nextIds"]) for (const id2 of readOwnArray(own(data, field4), budget)) readName(id2);
    const parent = own(node, "parentId");
    if (parent !== void 0 && (typeof parent !== "string" || prefix && !parent.startsWith(prefix))) throw invalid();
    const subflowOf = own(own(node, "data"), "subflowOf");
    if (subflowOf !== void 0 && (typeof subflowOf !== "string" || prefix && subflowOf !== prefix.slice(0, -1) && !subflowOf.startsWith(prefix))) throw invalid();
  }
  const edgeIds = /* @__PURE__ */ new Set();
  for (const edge of edges) {
    const id = readName(own(edge, "id"));
    if (edgeIds.has(id) || !ids.has(readName(own(edge, "source"))) || !ids.has(readName(own(edge, "target")))) throw invalid();
    edgeIds.add(id);
  }
  return graph;
}
function admitNarrative(input) {
  if (input === void 0) return void 0;
  const entries = copyData(input);
  for (const entry of readOwnArray(entries, new WorkBudget())) {
    if (!isPlainRecord(entry) || typeof own(entry, "text") !== "string" || typeof own(entry, "type") !== "string" || typeof own(entry, "depth") !== "number") throw invalid();
    const runtimeId = own(entry, "runtimeStageId");
    if (runtimeId !== void 0) readName(runtimeId);
  }
  return entries;
}
function admitLoaded(input, request) {
  if (!isPlainRecord(input)) throw invalid();
  const result = copyData(own(input, "result"));
  const resultId = own(result, "subflowId");
  if (resultId !== void 0 && resultId !== request.subflowId) throw invalid();
  const scope = childTraceScope(result, request.invocationPath);
  if (!scope.availability.ok) throw invalid();
  if (treeRuntimeIds(scope.executionTree).some((id) => !id.startsWith(`${request.subflowId}/`))) throw invalid();
  const graphInput = own(input, "graph"), narrative = admitNarrative(own(input, "narrativeEntries"));
  return Object.freeze({
    result,
    ...graphInput !== void 0 && { graph: admitGraph(graphInput, `${request.subflowId}/`) },
    ...narrative !== void 0 && { narrativeEntries: narrative }
  });
}
function treeRuntimeIds(tree) {
  const ids = [], stack = [tree], seen = /* @__PURE__ */ new Set(), budget = new WorkBudget();
  while (stack.length) {
    budget.spend(1);
    const node = stack.pop();
    if (!isPlainRecord(node) || seen.has(node)) throw invalid();
    seen.add(node);
    ids.push(readName(own(node, "runtimeStageId")));
    const next = own(node, "next");
    if (next !== void 0 && next !== null) stack.push(next);
    const children = own(node, "children");
    if (children !== void 0) stack.push(...readOwnArray(children, budget).reverse());
  }
  return ids;
}
function admitPrepared(input, request) {
  const loaded = admitLoaded(input, request);
  const expected = treeRuntimeIds(own(own(loaded.result, "treeContext"), "stageContexts"));
  const snapshots = copyData(own(input, "snapshots"));
  const entries = readOwnArray(snapshots, new WorkBudget());
  if (!entries.length || entries.length !== expected.length) throw invalid();
  entries.forEach((entry, index) => {
    if (own(entry, "runtimeStageId") !== expected[index] || !isPlainRecord(own(entry, "memory")) || typeof own(entry, "stageName") !== "string" || typeof own(entry, "stageLabel") !== "string" || typeof own(entry, "narrative") !== "string" || typeof own(entry, "startMs") !== "number" || typeof own(entry, "durationMs") !== "number") throw invalid();
  });
  return Object.freeze({ ...loaded, snapshots });
}

// src/progressiveRendering/prepare.ts
async function prepareSubflow(value, request, options) {
  try {
    checkSignal(options.signal);
    await yieldToHost(options.signal);
    checkSignal(options.signal);
    const loaded = admitLoaded(value, request);
    const snapshots = subflowResultToSnapshots(loaded.result, loaded.narrativeEntries ? [...loaded.narrativeEntries] : void 0);
    checkSignal(options.signal);
    return admitPrepared({ ...loaded, snapshots }, request);
  } catch {
    throw options.signal.aborted ? abortError() : invalid();
  }
}

// src/progressiveRendering/source/request.ts
function readPath(input, empty = true) {
  const path = readOwnArray(input, new WorkBudget()).map(readName);
  if (!empty && !path.length || path.length > 128 || path.join("").length > 8192 || new Set(path).size !== path.length) throw invalid();
  return Object.freeze(path);
}
function pathKey(path) {
  return JSON.stringify(readPath(path));
}
function normalizeRequest(input, root, states) {
  if (!isPlainRecord(input)) throw invalid();
  const path = readPath(own(input, "invocationPath"), false);
  const mountRuntimeStageId = readName(own(input, "mountRuntimeStageId"));
  const subflowId = readName(own(input, "subflowId"));
  if (path.at(-1) !== mountRuntimeStageId) throw invalid();
  const runId = own(root, "runId"), suppliedRun = own(input, "runId");
  if (runId !== void 0 && (typeof runId !== "string" || !runId.length)) throw invalid();
  if (suppliedRun !== void 0 && suppliedRun !== runId) throw invalid();
  let tree = own(root, "executionTree"), parentSubflow;
  for (let depth = 0; depth < path.length; depth++) {
    const selected = recordedMount(tree, path[depth]);
    if (parentSubflow && !selected.startsWith(`${parentSubflow}/`)) throw invalid();
    if (depth === path.length - 1) {
      if (selected !== subflowId) throw invalid();
      break;
    }
    const ancestry = path.slice(0, depth + 1), state = states.get(pathKey(ancestry));
    const result = state?.status === "ready" ? state.value.result : own(own(root, "subflowResults"), path[depth]);
    if (!childTraceScope(result, ancestry).availability.ok) throw invalid();
    const resultId = own(result, "subflowId");
    if (resultId !== void 0 && resultId !== selected) throw invalid();
    tree = own(own(result, "treeContext"), "stageContexts");
    parentSubflow = selected;
  }
  return Object.freeze({ invocationPath: path, mountRuntimeStageId, subflowId, ...typeof runId === "string" && { runId } });
}
function recordedMount(tree, runtimeId) {
  const stack = [tree], seen = /* @__PURE__ */ new Set(), budget = new WorkBudget();
  let matches = 0;
  let subflowId;
  while (stack.length) {
    budget.spend(1);
    const node = stack.pop();
    if (!isPlainRecord(node) || seen.has(node)) throw invalid();
    seen.add(node);
    if (own(node, "runtimeStageId") === runtimeId) {
      const recordedSubflow = own(node, "subflowId");
      subflowId = readName(recordedSubflow);
      matches++;
    }
    const next = own(node, "next");
    if (next !== void 0 && next !== null) stack.push(next);
    const children = own(node, "children");
    if (children !== void 0) stack.push(...readOwnArray(children, budget));
  }
  if (matches !== 1 || !subflowId) throw invalid();
  return subflowId;
}

// src/progressiveRendering/source/ownership.ts
function ownedGraphIds(nodes, mount) {
  const mounts = /* @__PURE__ */ new Map();
  for (const node of nodes) if (node.data.isSubflow) {
    for (const key of new Set([node.id, node.data.subflowId].filter((key2) => typeof key2 === "string"))) {
      const candidates = mounts.get(key) ?? [];
      candidates.push(node);
      mounts.set(key, candidates);
    }
  }
  const owned = /* @__PURE__ */ new Set();
  for (const node of nodes) {
    let parent = node.data.subflowOf;
    const seen = /* @__PURE__ */ new Set([node.id]);
    while (parent !== void 0 && !seen.has(parent)) {
      if (parent === mount) {
        owned.add(node.id);
        break;
      }
      seen.add(parent);
      const candidates = mounts.get(parent);
      if (candidates?.length !== 1) break;
      parent = candidates[0].data.subflowOf;
    }
  }
  return owned;
}

// src/progressiveRendering/source/views.ts
function rootFields(snapshot) {
  if (!isPlainRecord(snapshot)) throw invalid();
  const result = /* @__PURE__ */ Object.create(null);
  for (const field4 of Object.keys(snapshot)) {
    const descriptor = Object.getOwnPropertyDescriptor(snapshot, field4);
    if (descriptor && "value" in descriptor) result[field4] = descriptor.value;
  }
  for (const field4 of [
    "sharedState",
    "executionTree",
    "commitLog",
    "runId",
    "logAddress",
    "nestedReadTracking",
    "subflowResults",
    "recorders",
    "initialState",
    "commitValues",
    "writeProvenance"
  ]) {
    const descriptor = Object.getOwnPropertyDescriptor(snapshot, field4);
    if (!descriptor) continue;
    if (!("value" in descriptor)) throw invalid();
    result[field4] = descriptor.value;
  }
  if (!isPlainRecord(result.sharedState) || !Array.isArray(result.commitLog)) throw invalid();
  return Object.freeze(result);
}
function sourceView(root, narrative, states, revision, previous, rootRevision = 0) {
  if (previous) return Object.freeze({ revision, rootRevision, snapshot: previous.snapshot, narrativeEntries: previous.narrativeEntries, scopes: readonlyMap(states) });
  const results = /* @__PURE__ */ Object.create(null);
  if (root.subflowResults !== void 0) {
    if (!isPlainRecord(root.subflowResults)) throw invalid();
    for (const key of Object.keys(root.subflowResults)) if (key.includes("#")) results[key] = own(root.subflowResults, key);
  }
  const entries = [...narrative];
  for (const state of states.values()) if (state.status === "ready") {
    results[state.request.mountRuntimeStageId] = state.value.result;
    if (state.value.narrativeEntries) entries.push(...state.value.narrativeEntries);
  }
  return Object.freeze({
    revision,
    rootRevision,
    snapshot: Object.freeze({ ...root, subflowResults: Object.freeze(results) }),
    narrativeEntries: Object.freeze(entries),
    scopes: readonlyMap(states)
  });
}
function scopedGraph(root, path, states) {
  let nodes = root.nodes, edges = root.edges, changed = false;
  for (let length = 1; length <= path.length; length++) {
    const scope = states.get(JSON.stringify(path.slice(0, length)));
    if (scope?.status !== "ready" || !scope.value.graph) continue;
    const removed = ownedGraphIds(nodes, scope.request.subflowId);
    if (!removed.size && !scope.value.graph.nodes.length && !scope.value.graph.edges.length) continue;
    changed = true;
    const retainedNodes = nodes.filter((node) => !removed.has(node.id));
    const retainedNodeIds = new Set(retainedNodes.map((node) => node.id));
    if (scope.value.graph.nodes.some((node) => retainedNodeIds.has(node.id))) throw invalid();
    nodes = [...retainedNodes, ...scope.value.graph.nodes];
    const retainedEdges = edges.filter((edge) => !removed.has(edge.source) && !removed.has(edge.target));
    const retainedIds = new Set(retainedEdges.map((edge) => edge.id));
    if (scope.value.graph.edges.some((edge) => retainedIds.has(edge.id))) throw invalid();
    edges = [...retainedEdges, ...scope.value.graph.edges];
  }
  if (!changed) return root;
  return Object.freeze({ nodes: Object.freeze(nodes), edges: Object.freeze(edges) });
}

// src/progressiveRendering/source/live.ts
function assertPrefix(previous, next) {
  const before = readOwnArray(previous, new WorkBudget()), after = readOwnArray(next, new WorkBudget());
  if (after.length < before.length) throw invalid();
  if (!sameOwnedData(before, after.slice(0, before.length))) throw invalid();
}
function treeIds(tree) {
  const ids = /* @__PURE__ */ new Set(), seen = /* @__PURE__ */ new Set(), budget = new WorkBudget();
  const queue = tree === null || tree === void 0 ? [] : [tree];
  for (let index = 0; index < queue.length; index++) {
    budget.spend(1);
    const node = queue[index];
    if (!isPlainRecord(node) || seen.has(node)) throw invalid();
    seen.add(node);
    const id = own(node, "runtimeStageId");
    if (id !== void 0) {
      const name = readName(id);
      if (ids.has(name)) throw invalid();
      ids.add(name);
    }
    const next = own(node, "next");
    if (next !== void 0 && next !== null) queue.push(next);
    const children = own(node, "children");
    if (children !== void 0) queue.push(...readOwnArray(children, budget));
  }
  return ids;
}
function assertTreePrefix(previous, next) {
  for (const id of previous) if (!next.has(id)) throw invalid();
}
function assertCumulativeChild(before, after) {
  const oldContext = own(before, "treeContext"), newContext = own(after, "treeContext");
  const oldHistory = own(oldContext, "history");
  if (oldHistory !== void 0) assertPrefix(oldHistory, own(newContext, "history"));
  assertTreePrefix(treeIds(own(oldContext, "stageContexts")), treeIds(own(newContext, "stageContexts")));
}
function admitCohort(value, previous) {
  const original = own(value, "snapshot");
  const input = copyData(rootFields(original)), run = own(input, "runId");
  if (run !== void 0 && typeof run !== "string") throw invalid();
  const history = input.commitLog;
  const inline = input.subflowResults;
  if (inline !== void 0 && !isPlainRecord(inline)) throw invalid();
  const fields = Object.freeze({ ...input, commitLog: history, ...inline !== void 0 && { subflowResults: inline } });
  const ids = treeIds(fields.executionTree);
  const bootstrap = (run === void 0 || run === "") && ids.size === 0 && readOwnArray(history, new WorkBudget()).length === 0 && (inline === void 0 || Object.keys(inline).length === 0);
  if (run === "" && !bootstrap) throw invalid();
  if (previous && !previous.bootstrap && run !== own(previous.fields, "runId")) throw invalid();
  if (previous) {
    assertPrefix(previous.fields.commitLog, history);
    assertTreePrefix(previous.treeIds, ids);
    const oldInline = previous.fields.subflowResults;
    if (oldInline !== void 0 && !isPlainRecord(oldInline)) throw invalid();
    if (isPlainRecord(oldInline)) {
      for (const key of Object.keys(oldInline)) if (key.includes("#")) {
        const before = own(oldInline, key), after = own(inline, key);
        if (after === void 0) throw invalid();
        assertCumulativeChild(before, after);
      }
    }
  }
  const candidateGraph = admitGraph(own(value, "graph"));
  const graph = previous && sameOwnedData(previous.graph, candidateGraph) ? previous.graph : candidateGraph;
  const suppliedNarrative = own(value, "narrativeEntries");
  const narrative = copyData(suppliedNarrative ?? narrativeRecorderFromSnapshot({ recorders: copyData(input.recorders) })?.entries ?? []);
  for (const entry of readOwnArray(narrative, new WorkBudget())) {
    if (!isPlainRecord(entry) || typeof own(entry, "text") !== "string" || typeof own(entry, "type") !== "string" || typeof own(entry, "depth") !== "number") throw invalid();
  }
  return Object.freeze({ fields, graph, narrative, treeIds: ids, bootstrap });
}

// src/progressiveRendering/source/controller.ts
function createRecordingSource(options) {
  let cohort = admitCohort(options), pendingRoot;
  const loader = options.loadSubflow, hostPrepare = options.prepareSubflow;
  const max = options.maxCachedSubflows ?? 64;
  if (!Number.isInteger(max) || max < 1 || max > 64 || loader !== void 0 && typeof loader !== "function") throw invalid();
  let states = /* @__PURE__ */ new Map();
  const jobs = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set(), ready = /* @__PURE__ */ new Map();
  const graphs = /* @__PURE__ */ new Map();
  let disposed = false, revision = 0, rootRevision = 0;
  let snapshot = sourceView(cohort.fields, cohort.narrative, states, revision), cancelVisual;
  let publication;
  const alive = (job) => !disposed && jobs.get(job.key) === job && !job.controller.signal.aborted;
  const emit = (dataChanged = false) => {
    if (disposed) return;
    snapshot = sourceView(cohort.fields, cohort.narrative, states, ++revision, dataChanged ? void 0 : snapshot, rootRevision);
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
      }
    }
    if (publication) queuePublication();
  };
  const settle = (job, error) => {
    for (const lease2 of job.leases) {
      lease2.clean();
      error ? lease2.reject(error) : lease2.resolve(job.value);
    }
    job.leases.clear();
  };
  const cancelJob = (job, notify = true) => {
    job.cancelStart?.();
    job.controller.abort();
    ready.delete(job.key);
    jobs.delete(job.key);
    states.delete(job.key);
    settle(job, abortError());
    if (notify) emit();
  };
  function candidateStates(target) {
    if (target === cohort) return new Map(states);
    const result = /* @__PURE__ */ new Map();
    for (const [key, state] of [...states].sort((a, b) => a[1].request.invocationPath.length - b[1].request.invocationPath.length)) {
      try {
        normalizeRequest(state.request, target.fields, result);
      } catch {
        continue;
      }
      const authoritative = own(target.fields.subflowResults, state.request.mountRuntimeStageId);
      if (authoritative !== void 0 && !sameOwnedData(authoritative, own(cohort.fields.subflowResults, state.request.mountRuntimeStageId))) {
        admitLoaded({ result: authoritative }, state.request);
        if (state.status === "ready") assertCumulativeChild(state.value.result, authoritative);
        continue;
      }
      result.set(key, state);
      if (state.status === "ready") {
        try {
          scopedGraph(target.graph, state.request.invocationPath, result);
        } catch {
          const { graph: _oldGraph, ...value } = state.value;
          result.set(key, Object.freeze({ ...state, value: Object.freeze(value) }));
        }
      }
    }
    return result;
  }
  function queuePublication() {
    if (!pendingRoot && !ready.size) {
      publication = void 0;
      cancelVisual?.();
      cancelVisual = void 0;
      return;
    }
    const target = pendingRoot ?? cohort, nextStates = candidateStates(target), complete = [];
    for (const job of [...ready.values()]) if (alive(job)) {
      try {
        normalizeRequest(job.request, target.fields, nextStates);
        const authoritative = own(target.fields.subflowResults, job.request.mountRuntimeStageId);
        if (authoritative !== void 0 && !sameOwnedData(authoritative, job.value.result)) throw invalid();
        const state = Object.freeze({ status: "ready", request: job.request, value: job.value });
        const geometry = new Map(nextStates);
        geometry.set(job.key, state);
        scopedGraph(target.graph, job.request.invocationPath, geometry);
        nextStates.set(job.key, state);
        complete.push(job);
      } catch {
        cancelJob(job, false);
        nextStates.delete(job.key);
      }
    }
    const rootChanged = pendingRoot !== void 0;
    publication = {
      cohort: target,
      states: nextStates,
      view: sourceView(target.fields, target.narrative, nextStates, revision + 1, void 0, rootRevision + Number(rootChanged)),
      jobs: complete,
      rootChanged
    };
    if (!cancelVisual) cancelVisual = scheduleVisual(flush);
  }
  function flush() {
    cancelVisual = void 0;
    const next = publication;
    publication = void 0;
    if (!next || disposed) return;
    cohort = next.cohort;
    pendingRoot = void 0;
    states = next.states;
    if (next.rootChanged) rootRevision++;
    snapshot = Object.freeze({ ...next.view, revision: ++revision, rootRevision });
    ready.clear();
    for (const job of next.jobs) {
      jobs.delete(job.key);
      settle(job);
    }
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
      }
    }
  }
  const fail = (job, message) => {
    if (!alive(job)) return;
    states.set(job.key, Object.freeze({ status: "error", request: job.request, message }));
    jobs.delete(job.key);
    ready.delete(job.key);
    emit();
    settle(job, new Error(message));
  };
  const run = async (job) => {
    if (!alive(job) || job.started) return;
    job.started = true;
    let preparing = false;
    try {
      const existing = own(cohort.fields.subflowResults, job.request.mountRuntimeStageId);
      if (existing === void 0 && !loader) throw invalid();
      const loaded = existing !== void 0 ? { result: existing } : await loader(job.request, { signal: job.controller.signal });
      if (!alive(job)) return;
      preparing = true;
      states.set(job.key, Object.freeze({ status: "preparing", request: job.request }));
      emit();
      await yieldToHost(job.controller.signal);
      if (!alive(job)) return;
      const admitted = admitLoaded(loaded, job.request);
      const prepared = await (hostPrepare ?? prepareSubflow)(admitted, job.request, { signal: job.controller.signal });
      if (!alive(job)) return;
      job.value = admitPrepared(prepared, job.request);
      const target = pendingRoot ?? cohort, graphCandidate = candidateStates(target);
      normalizeRequest(job.request, target.fields, graphCandidate);
      graphCandidate.set(job.key, { status: "ready", request: job.request, value: job.value });
      scopedGraph(target.graph, job.request.invocationPath, graphCandidate);
      ready.set(job.key, job);
      queuePublication();
    } catch {
      fail(job, preparing ? "Recorded subflow evidence could not be prepared." : "Recorded subflow could not be loaded.");
    }
  };
  const queue = (job, background) => {
    job.cancelStart?.();
    job.queuedBackground = background;
    job.cancelStart = scheduleTask(() => {
      void run(job);
    }, { background, signal: job.controller.signal });
  };
  const lease = (job, signal) => new Promise((resolve, reject) => {
    const onAbort = () => {
      if (!job.leases.delete(interest)) return;
      interest.clean();
      reject(abortError());
      if (!job.leases.size && alive(job)) cancelJob(job);
    };
    const interest = { resolve, reject, clean: () => signal?.removeEventListener("abort", onAbort) };
    job.leases.add(interest);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
  const source = {
    get rootSnapshot() {
      return cohort.fields;
    },
    get rootGraph() {
      return cohort.graph;
    },
    canLoadSubflows: typeof loader === "function",
    update(value) {
      if (disposed) throw new Error("The recording source was disposed.");
      let target, valid;
      try {
        target = admitCohort(value, pendingRoot ?? cohort);
        valid = candidateStates(target);
      } catch {
        throw new Error("Live updates require a complete cumulative recording from the same run.");
      }
      for (const job of [...jobs.values()]) {
        const provided = own(target.fields.subflowResults, job.request.mountRuntimeStageId);
        if (!valid.has(job.key) || provided !== void 0 && !sameOwnedData(provided, own(cohort.fields.subflowResults, job.request.mountRuntimeStageId))) cancelJob(job, false);
      }
      pendingRoot = target;
      queuePublication();
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      if (disposed) return () => void 0;
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getKey: pathKey,
    load(input, interests = {}) {
      try {
        if (disposed) throw abortError();
        checkSignal(interests.signal);
        const request = normalizeRequest(input, cohort.fields, states), key = pathKey(request.invocationPath);
        const found = states.get(key);
        if (found?.status === "ready") return Promise.resolve(found.value);
        for (const [otherKey, state] of states) if (otherKey !== key && state.request.mountRuntimeStageId === request.mountRuntimeStageId) throw invalid();
        let job = jobs.get(key);
        if (job) {
          const result2 = lease(job, interests.signal);
          if (!interests.background && !job.started && job.queuedBackground) queue(job, false);
          return result2;
        }
        if (!loader && own(cohort.fields.subflowResults, request.mountRuntimeStageId) === void 0) return Promise.reject(new Error("Recorded subflow loading is unavailable."));
        if (!found && states.size >= max) return Promise.reject(new Error("The retained subflow limit was reached. Existing evidence was kept."));
        job = { key, request, controller: new AbortController(), leases: /* @__PURE__ */ new Set(), started: false, queuedBackground: interests.background === true };
        jobs.set(key, job);
        states.set(key, Object.freeze({ status: "loading", request }));
        const result = lease(job, interests.signal);
        emit();
        if (alive(job)) {
          queue(job, interests.background === true);
        }
        return result;
      } catch {
        return Promise.reject(disposed || interests.signal?.aborted ? abortError() : new Error("Recorded subflow request is unavailable."));
      }
    },
    getGraph(path) {
      const admitted = readPath(path), layers = [];
      let lastLayerDepth = 0;
      for (let depth = 1; depth <= admitted.length; depth++) {
        const scope = states.get(pathKey(admitted.slice(0, depth)));
        if (scope?.status === "ready" && scope.value.graph) {
          layers.push(scope.value.graph);
          lastLayerDepth = depth;
        }
      }
      if (!layers.length) return cohort.graph;
      const key = pathKey(admitted.slice(0, lastLayerDepth)), cached = graphs.get(key);
      if (cached && cached.root === cohort.graph && cached.layers.length === layers.length && layers.every((layer, index) => layer === cached.layers[index])) return cached.value;
      const value = scopedGraph(cohort.graph, admitted, states);
      graphs.set(key, { root: cohort.graph, layers, value });
      return value;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelVisual?.();
      publication = void 0;
      pendingRoot = void 0;
      ready.clear();
      listeners.clear();
      graphs.clear();
      for (const job of jobs.values()) {
        job.cancelStart?.();
        job.controller.abort();
        settle(job, abortError());
      }
      jobs.clear();
    }
  };
  return Object.freeze(source);
}

// src/progressiveRendering/worker/protocol.ts
var PROTOCOL = "fp-subflow-prepare:1";
function field3(value, key) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : void 0;
}
function readWorkerMessage(value) {
  try {
    if (!value || typeof value !== "object" || field3(value, "protocol") !== PROTOCOL) return;
    const type = field3(value, "type"), id = field3(value, "id");
    if (type !== "prepare" && type !== "cancel" && type !== "result" || typeof id !== "string" || !id.length || id.length > 64) return;
    if (type === "cancel") return { type, id };
    if (type === "prepare") return { type, id, value: field3(value, "value"), request: field3(value, "request") };
    const ok = field3(value, "ok") === true;
    return { type, id, ok, ...ok ? { value: field3(value, "value") } : {} };
  } catch {
    return;
  }
}
function workerMessage(type, id, fields) {
  return Object.freeze({ protocol: PROTOCOL, type, id, ...fields });
}
function preparationFailed() {
  return new Error("Subflow preparation could not be completed.");
}
function preparationCancelled() {
  const error = new Error("Preparation was cancelled.");
  error.name = "AbortError";
  return error;
}

// src/progressiveRendering/worker/bridge.ts
var nextBridge = 0;
function createSubflowWorkerPreparation(worker) {
  const owner = ++nextBridge;
  let nextRequest = 0, disposed = false, failed = false;
  const pending = /* @__PURE__ */ new Map();
  const cancelRemote = (id) => {
    try {
      worker.postMessage(workerMessage("cancel", id));
    } catch {
    }
  };
  const take = (id) => {
    const item = pending.get(id);
    if (item) {
      pending.delete(id);
      item.signal.removeEventListener("abort", item.abort);
    }
    return item;
  };
  const unreadable = () => {
    failed = true;
    for (const id of pending.keys()) take(id)?.reject(preparationFailed());
  };
  const receive = (event) => {
    if (disposed || failed) return;
    let message;
    try {
      message = readWorkerMessage(event.data);
    } catch {
      unreadable();
      return;
    }
    if (!message || message.type !== "result") return;
    const item = take(message.id);
    if (!item) return;
    if (message.ok && message.value !== void 0) item.resolve(message.value);
    else item.reject(preparationFailed());
  };
  worker.addEventListener("message", receive);
  worker.addEventListener("error", unreadable);
  worker.addEventListener("messageerror", unreadable);
  const prepare = (value, request, { signal }) => {
    if (disposed) throw new Error("Preparation worker has been disposed.");
    if (failed) return Promise.reject(preparationFailed());
    if (signal.aborted) return Promise.reject(preparationCancelled());
    const id = `${owner}:${++nextRequest}`;
    return new Promise((resolve, reject) => {
      const abort = () => {
        take(id)?.reject(preparationCancelled());
        cancelRemote(id);
      };
      pending.set(id, { signal, abort, resolve, reject });
      signal.addEventListener("abort", abort, { once: true });
      try {
        worker.postMessage(workerMessage("prepare", id, { value, request }));
      } catch {
        take(id)?.reject(preparationFailed());
      }
    });
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    worker.removeEventListener("message", receive);
    worker.removeEventListener("error", unreadable);
    worker.removeEventListener("messageerror", unreadable);
    for (const id of pending.keys()) {
      take(id)?.reject(new Error("Preparation worker has been disposed."));
      cancelRemote(id);
    }
  };
  return Object.freeze(Object.assign(prepare, { dispose }));
}

// src/progressiveRendering/worker/handler.ts
function attachSubflowWorker(port) {
  let disposed = false;
  const active = /* @__PURE__ */ new Map();
  const send = (message) => {
    try {
      port.postMessage(message);
    } catch {
    }
  };
  const receive = (event) => {
    if (disposed) return;
    let message;
    try {
      message = readWorkerMessage(event.data);
    } catch {
      return;
    }
    if (!message) return;
    if (message.type === "cancel") {
      active.get(message.id)?.abort();
      active.delete(message.id);
      return;
    }
    if (message.type !== "prepare" || active.has(message.id)) return;
    const { id } = message;
    const control2 = new AbortController();
    active.set(id, control2);
    const current = () => !disposed && !control2.signal.aborted && active.get(id) === control2;
    Promise.resolve().then(() => {
      if (!current()) return;
      return prepareSubflow(message.value, message.request, { signal: control2.signal });
    }).then((value) => {
      if (!current()) return;
      try {
        port.postMessage(workerMessage("result", id, { ok: true, value }));
      } catch {
        send(workerMessage("result", id, { ok: false }));
      }
    }, () => {
      if (current()) send(workerMessage("result", id, { ok: false }));
    }).finally(() => {
      if (active.get(id) === control2) active.delete(id);
    });
  };
  port.addEventListener("message", receive);
  return () => {
    if (disposed) return;
    disposed = true;
    port.removeEventListener("message", receive);
    for (const control2 of active.values()) control2.abort();
    active.clear();
  };
}

// src/progressiveRendering/options.ts
function resolveProgressiveRenderingOptions(input) {
  if (input === void 0) return {};
  if (!input || typeof input !== "object" || Array.isArray(input) || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) throw new Error("Invalid rendering options: expected plain data.");
  const read = (key) => {
    const d = Object.getOwnPropertyDescriptor(input, key);
    if (d && !("value" in d)) throw new Error("Invalid rendering options: accessors are unsupported.");
    return d?.value;
  };
  const loadingIndicator = read("loadingIndicator"), prefetch = read("prefetch");
  if (loadingIndicator !== void 0 && !["skeleton", "spinner", "text"].includes(loadingIndicator))
    throw new Error("Invalid rendering options: unknown loadingIndicator.");
  if (prefetch !== void 0 && !["none", "idle"].includes(prefetch))
    throw new Error("Invalid rendering options: unknown prefetch.");
  return { ...loadingIndicator !== void 0 && { loadingIndicator }, ...prefetch !== void 0 && { prefetch } };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CommitChainView,
  CommitInspector,
  FootprintBadge,
  FootprintButton,
  FootprintCheckbox,
  FootprintCode,
  FootprintIcon,
  FootprintInput,
  FootprintLoadStatus,
  FootprintTab,
  FootprintTheme,
  FootprintTooltip,
  GROUP_CONTAINER_NODE_TYPE,
  GroupContainerNode,
  GroupedFlowDiagram,
  GroupedFlowInvestigation,
  ISOMETRIC_NODE_HEIGHT,
  ISOMETRIC_NODE_WIDTH,
  IsometricEdge,
  IsometricGrid,
  IsometricStageNode,
  LoopBackEdge,
  MAIN_CHART_BOX_ID,
  NodeInspector,
  RunSlider,
  SlotPillNode,
  SmartStepEdge,
  StageNode,
  SubflowBreadcrumb,
  SubflowTree,
  TimeTravelDebugger,
  TraceExplorerShell,
  TraceFlow,
  TracedFlow,
  applyGroupLayout,
  asRuntimeStageId,
  asStageId,
  attachSubflowWorker,
  backtraceDataFlow,
  backtraceStructural,
  buildCommitChainTree,
  buildSubflowBreadcrumb,
  collapseTraceGraph,
  componentStyles,
  createCommitFlowRecorder,
  createDagreTraceLayout,
  createGroupedLayout,
  createIsometricTraceLayout,
  createMainChartBoxLayout,
  createNodeViewRecorder,
  createRecordingSource,
  createSnappedDagreLayout,
  createSubflowWorkerPreparation,
  createTraceBundle,
  createTraceGroupLayout,
  createTraceRuntimeOverlay,
  createTraceStructureRecorder,
  dagreTraceLayout,
  defaultTraceFlowLayout,
  filterGraphForDrill,
  forwardtraceStructural,
  getFlowDiagramAncestors,
  graphFromStructure,
  isometricTraceLayout,
  overlayFromSnapshot,
  prepareSubflow,
  projectGroupedFlowDiagram,
  resolveProgressiveRenderingOptions,
  sliceOverlay,
  snapLinearSuccessors,
  structureAsChainTree,
  themeModeVars,
  tokensToCSSVars,
  traceGroupLayout,
  useFootprintComponents,
  useFootprintTheme,
  useSubflowNavigation,
  useTranslator,
  walkBackward,
  walkForward,
  wrapInMainChartBox
});
//# sourceMappingURL=flowchart.cjs.map