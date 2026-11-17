import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { exportSurface } from "./exportSurface";
import ledger from "./fixtures/public-exports.json";

function consumerContract(manifest: Record<string, unknown>) {
  return Object.fromEntries(
    // Version is release bookkeeping; every frozen consumer field stays exact.
    Object.keys(ledger.packageContract).filter(key => key !== "version").map(key => [key, manifest[key]])
  );
}
const consumerFields = Object.keys(ledger.packageContract).filter(key => key !== "version");
function leafPaths(value: unknown, path: string[]): string[][] {
  return value !== null && typeof value === "object"
    ? Object.entries(value).flatMap(([key, child]) => leafPaths(child, [...path, key]))
    : [path];
}
const consumerLeaves = consumerFields.flatMap(key =>
  leafPaths((ledger.packageContract as Record<string, unknown>)[key], [key])
    .map(path => ({ path, label: path.join(".") }))
);

const groupedFlowExports = [
  { name: "GroupedFlowDiagram", kind: "value" },
  { name: "GroupedFlowDiagramProps", kind: "type" },
  { name: "projectGroupedFlowDiagram", kind: "value" },
  { name: "getFlowDiagramAncestors", kind: "value" },
  { name: "GroupedFlowInvestigation", kind: "value" },
  { name: "GroupedFlowInvestigationProps", kind: "type" },
  ...[
    "FlowDiagramNode", "FlowDiagramEdge", "FlowDiagramDefinition", "FlowDiagramNodeState",
    "FlowDiagramEdgeState", "FlowDiagramObservation", "FlowDiagramHighlight", "FlowDiagramFocusRequest", "FlowDiagramRecordedRelationship",
    "GroupedFlowDiagramModelOptions", "PositionedFlowDiagramNode", "PositionedFlowDiagramEdge",
    "GroupedFlowDiagramModel", "GroupedFlowDiagramModelResult",
  ].map(name => ({ name, kind: "type" })),
];

const flowchartOptionExports = ["FlowchartOptions", "FlowchartRenderer"]
  .map(name => ({ name, kind: "type" }));

const isometricExports = [
  ...["IsometricStageNode", "IsometricEdge", "IsometricGrid", "createIsometricTraceLayout",
    "isometricTraceLayout", "ISOMETRIC_NODE_WIDTH", "ISOMETRIC_NODE_HEIGHT",
  ].map(name => ({ name, kind: "value" })),
  { name: "IsometricTraceLayoutOptions", kind: "type" },
];

const traceWorkflowExports = [
  { name: "TraceWorkflowOverlay", kind: "type" },
  { name: "TraceWorkflowStage", kind: "type" },
  { name: "TraceWorkflowRead", kind: "type" },
];

const displayPreflightExports = [
  ...["checkInvestigationAttention", "checkInvestigationExplanation", "checkFailureExplanationDisplay",
    "investigationDisplayLimits", "failureExplanationDisplayLimits",
  ].map(name => ({ name, kind: "value" })),
  ...["DisplayCheckResult", "DisplayDiagnostic", "DisplayDiagnosticCode", "DisplayLimitName",
    "DisplayPath", "DisplaySchemaField", "DisplayUsage", "InvestigationAttentionDisplay",
    "InvestigationTextDisplay", "InvestigationRelationshipDisplay",
  ].map(name => ({ name, kind: "type" })),
];

const stageActivityExports = [
  { name: "StageActivityPanel", kind: "value" },
  { name: "projectStageActivity", kind: "value" },
  { name: "formatStageActivitySummary", kind: "value" },
  ...[
    "StageActivityPanelProps", "StageActivityInput", "StageActivityView",
    "StageActivityEvent", "StageActivityVariable", "StageActivityValue",
    "StageActivityWriter", "StageActivityTraceTarget",
  ].map(name => ({ name, kind: "type" })),
];

const themePrimitiveExports = [
  ...["componentStyles", "useFootprintComponents", "FootprintButton", "FootprintTab", "FootprintInput",
    "FootprintCheckbox", "FootprintBadge", "FootprintCode", "FootprintTooltip", "FootprintIcon",
  ].map(name => ({ name, kind: "value" })),
  ...["FootprintThemeProps", "FootprintComponents", "FootprintPrimitiveOptions", "FootprintButtonProps",
    "FootprintInputProps", "FootprintCheckboxProps", "FootprintBadgeProps", "FootprintCodeProps",
    "FootprintTooltipProps", "FootprintTooltipAdapterProps", "FootprintIconProps", "FootprintIconAdapterProps",
  ].map(name => ({ name, kind: "type" })),
];

describe("M1 — preserve every existing public home and value/type kind", () => {
  it("keeps all root and flowchart names, including deprecations and duplicate homes", () => {
    expect(
      exportSurface({ ".": "src/index.ts", "./flowchart": "src/flowchart.ts" })
    ).toEqual({
      ...ledger.entries,
      // Keep the historical baseline intact; these reviewed additive APIs
      // are the only permitted extension to its exact export contract.
      ".": [
        ...ledger.entries["."],
        { name: "InvestigationPanel", kind: "value" },
        { name: "InvestigationPanelProps", kind: "type" },
        { name: "InvestigationPort", kind: "type" },
        { name: "InvestigationResult", kind: "type" },
        { name: "FailureExplanationView", kind: "value" },
        { name: "FailureExplanationViewProps", kind: "type" },
        { name: "FailureExplanationDisplay", kind: "type" },
        { name: "FailureExplanationDisplaySection", kind: "type" },
        { name: "FailureExplanationDisplayFinding", kind: "type" },
        { name: "projectTraceInvocation", kind: "value" },
        { name: "TraceInvocationOptions", kind: "type" },
        { name: "TraceInvocationProjection", kind: "type" },
        { name: "TraceWalkOptions", kind: "type" },
        { name: "TraceWalkScope", kind: "type" },
        ...groupedFlowExports,
        ...traceWorkflowExports,
        ...stageActivityExports,
        ...themePrimitiveExports,
        ...flowchartOptionExports,
        ...displayPreflightExports,
        ...["paperLight", "paperDark"].map(name => ({ name, kind: "value" })),
        { name: "useLensWorkbench", kind: "value" },
        ...["LensTheme", "LensView", "LensCommentaryOptions", "ReplayControlsOptions", "LensLayoutDefinition", "LensLayoutSurface", "LensWorkbenchContextValue", "LensWorkbenchActions", "LensWorkbenchSurfaces", "LensWorkbenchLayout"]
          .map(name => ({ name, kind: "type" })),
      ].sort((a, b) => a.name.localeCompare(b.name)),
      "./flowchart": [
        ...ledger.entries["./flowchart"],
        ...groupedFlowExports,
        ...traceWorkflowExports,
        ...themePrimitiveExports,
        ...flowchartOptionExports,
        ...isometricExports,
        ...["FootprintTheme", "useFootprintTheme", "tokensToCSSVars", "themeModeVars"].map(name => ({ name, kind: "value" })),
        ...["ThemeTokens", "ThemeMode"].map(name => ({ name, kind: "type" })),
      ].sort((a, b) => a.name.localeCompare(b.name)),
    });
    expect(ledger.policy).toBe(
      "retain every existing name at every existing door for the first major"
    );
  });

  it("keeps the source pilot unpublished and the current consumer contract unchanged", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8")
    );
    expect(consumerContract(manifest)).toEqual(consumerContract(ledger.packageContract));
    expect(manifest.exports).not.toHaveProperty("./record");
  });

  it.each(["0.40.0", "1.0.0"])("allows release bookkeeping version %s without changing the consumer contract", version => {
    const manifest = { ...structuredClone(ledger.packageContract), version };
    expect(consumerContract(manifest)).toEqual(consumerContract(ledger.packageContract));
  });

  it.each(consumerFields)("still detects a changed or missing frozen consumer field: %s", key => {
    const changed: Record<string, unknown> = structuredClone(ledger.packageContract);
    changed[key] = "deliberately incompatible";
    expect(consumerContract(changed)).not.toEqual(consumerContract(ledger.packageContract));
    delete changed[key];
    expect(consumerContract(changed)).not.toEqual(consumerContract(ledger.packageContract));
  });

  it.each(consumerLeaves)("still detects a nested consumer-contract mutation: $label", ({ path }) => {
    const changed: Record<string, unknown> = structuredClone(ledger.packageContract);
    let owner = changed;
    for (const key of path.slice(0, -1)) owner = owner[key] as Record<string, unknown>;
    owner[path[path.length - 1]!] = "deliberately incompatible";
    expect(consumerContract(changed)).not.toEqual(consumerContract(ledger.packageContract));
  });

  it("distinguishes a real class export from its type-only alias", () => {
    const actual = exportSurface({
      control: "test/migration/fixtures/export-kinds.ts",
    });
    expect(actual.control).toEqual([
      { name: "RuntimeValue", kind: "value" },
      { name: "Shape", kind: "type" },
      { name: "TypeOnlyValue", kind: "type" },
    ]);
    expect(actual.control).not.toContainEqual({
      name: "TypeOnlyValue",
      kind: "value",
    });
    expect(actual.control).not.toContainEqual({
      name: "MissingExport",
      kind: "value",
    });
  });
});
