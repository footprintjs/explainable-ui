import { forwardRef, type ComponentProps, type ReactNode } from "react";
import type { FootprintIconAdapterProps, TraceGraph } from "footprint-explainable-ui";
import { GroupContainerNode } from "footprint-explainable-ui/flowchart";

export type NodeIconMode = "recorded" | "builtin" | "custom";

type ExampleIconRole =
  | "input"
  | "check"
  | "compute"
  | "result"
  | "subflow"
  | "parallel"
  | "loop"
  | "transform"
  | "lookup"
  | "note";

const builtinIconByRole: Record<ExampleIconRole, string> = {
  input: "start",
  check: "guard",
  compute: "tool",
  result: "end",
  subflow: "agent",
  parallel: "decision",
  loop: "loop",
  transform: "parse",
  lookup: "rag",
  note: "memory",
};

/** Explicit presentation roles for the example charts, keyed by exact node ID. */
const roleByNodeId = new Map<string, ExampleIconRole>([
  ["source", "input"], ["input", "input"], ["seed", "input"], ["cart", "input"],
  ["load-numbers", "input"], ["load-rates", "input"], ["load-order", "input"],
  ["load-symbol", "input"], ["load-request", "input"],
  ["discount", "compute"], ["total", "result"], ["check", "check"],
  ["check-limit", "check"], ["pick-base", "compute"], ["audit", "note"],
  ["assess-risk", "compute"], ["quote", "compute"], ["fetch-rates", "lookup"],
  ["choose-shipping", "check"], ["label", "result"], ["manual", "result"],
  ["run-calculations", "parallel"], ["fork", "parallel"], ["parallel", "parallel"],
  ["items", "compute"], ["delivery", "compute"], ["combine", "result"],
  ["loop", "loop"], ["retry", "loop"], ["refine", "loop"], ["review", "check"],
  ["fetch-quote", "lookup"], ["settle", "result"], ["sum", "compute"],
  ["format-result", "result"], ["prepare-result", "result"], ["report", "result"],
  ["clean", "transform"], ["scale", "transform"],
  ["first/clean", "transform"], ["first/scale", "transform"], ["first/sum", "compute"],
  ["second/clean", "transform"], ["second/scale", "transform"], ["second/sum", "compute"],
  ["pipeline/load-input", "input"], ["pipeline/prepare/clean", "transform"],
  ["pipeline/prepare/scale", "transform"], ["pipeline/prepare/sum", "compute"],
  ["pipeline/summarize", "result"],
]);

function isExampleRole(value: unknown): value is ExampleIconRole {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(builtinIconByRole, value);
}

function roleForNode(node: TraceGraph["nodes"][number]): ExampleIconRole | undefined {
  // A caller can declare a role for its own stage without guessing from text.
  if (isExampleRole(node.data.exampleIconRole)) return node.data.exampleIconRole;
  if (node.data.isSubflow) return "subflow";
  const knownRole = roleByNodeId.get(node.id);
  if (knownRole) return knownRole;
  if (node.data.isFork) return "parallel";
  if (node.data.isDecider) return "check";
  return undefined;
}

/**
 * Presentation only. Recorded mode returns the original graph. The other two
 * modes explicitly replace icons on recognized stage nodes for comparison.
 * Unmatched authored icons, IDs, positions, scope data and edges are retained.
 */
export function applyExampleNodeIcons(graph: TraceGraph, mode: NodeIconMode): TraceGraph {
  if (mode === "recorded") return graph;
  let changed = false;
  const nodes = graph.nodes.map((node) => {
    // Recorder graphs use stage (or omit type); TracedFlow renders stageNode.
    // Subflow mounts share that contract. Leave other/custom renderers alone.
    if (node.type !== undefined && node.type !== "stage" && node.type !== "stageNode") return node;
    const role = roleForNode(node);
    if (!role) return node;
    const icon = mode === "builtin" ? builtinIconByRole[role] : `example-${role}`;
    if (node.data.icon === icon) return node;
    changed = true;
    return { ...node, data: { ...node.data, icon } };
  });
  return changed ? { ...graph, nodes } : graph;
}

function exampleGlyph(name: string): ReactNode {
  let drawing: ReactNode;
  switch (name) {
    case "example-input":
      drawing = <><path d="M4 15v5h16v-5M12 3v11m-4-4 4 4 4-4" /><path d="M4 15h4l2 3h4l2-3h4" /></>;
      break;
    case "example-check":
      drawing = <><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>;
      break;
    case "example-compute":
      drawing = <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h2m4 0h2m-8 4h2m4 0h2" /></>;
      break;
    case "example-result":
      drawing = <><path d="M13 3H5v18h14V9l-6-6Zm0 0v6h6" /><path d="m8 15 3 3 5-6" /></>;
      break;
    case "example-subflow":
      drawing = <><rect x="3" y="3" width="18" height="18" rx="3" /><rect x="6" y="6" width="5" height="5" rx="1" /><rect x="13" y="13" width="5" height="5" rx="1" /><path d="M8.5 11v4.5H13" /></>;
      break;
    case "example-parallel":
      drawing = <><path d="M12 3v5M5 13V8h14v5M5 17v3h14v-3M12 20v1" /><rect x="2" y="13" width="6" height="4" rx="1" /><rect x="16" y="13" width="6" height="4" rx="1" /></>;
      break;
    case "example-loop":
      drawing = <><path d="M19 7a8 8 0 1 0 1 8M19 3v5h-5" /><path d="m9 8 5 4-5 4V8Z" /></>;
      break;
    case "example-transform":
      drawing = <><path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" /><path d="M8 5V3m8 2V3" /></>;
      break;
    case "example-lookup":
      drawing = <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6M7 8h6m-6 4h4" /></>;
      break;
    case "example-note":
      drawing = <><path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5" /></>;
      break;
    default:
      return null;
  }
  return <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {drawing}
  </svg>;
}

/** Native-compatible adapter; unknown names keep the library's supplied glyph. */
export const ExampleStageIcon = forwardRef<HTMLSpanElement, FootprintIconAdapterProps>(function ExampleStageIcon(
  { name, children, style, ...spanProps }, ref,
) {
  const glyph = exampleGlyph(name);
  return <span data-icon={name} {...spanProps} ref={ref} style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: "1em", height: "1em", lineHeight: 0, verticalAlign: "middle", ...style,
  }}>
    {glyph ?? children}
  </span>;
});

/** Optional, separate adapter for a grouped subflow's stock container header. */
export function ExampleGroupContainerNode(props: ComponentProps<typeof GroupContainerNode>) {
  const data = props.data;
  const icon = typeof data.icon === "string" ? data.icon : undefined;
  const expandable = data.headerMode === "expandable";

  // An explicitly authored expandable header keeps its own React icon/content.
  if (expandable && data.iconContent !== undefined && data.iconContent !== null) {
    return <GroupContainerNode {...props} />;
  }

  if (icon?.startsWith("example-") && isExampleRole(icon.slice("example-".length))) {
    return <GroupContainerNode {...props} data={{
      ...data,
      // Legacy extra metadata was inert. Opting in for this icon alone must not
      // rotate ports, reveal dormant actions/status, or alter header emphasis.
      ...(!expandable ? {
        handleDirection: "TB", highlighted: false, compactHeader: false,
        headerAction: undefined, statusLabel: undefined,
      } : {}),
      headerMode: "expandable",
      icon: undefined,
      iconContent: <ExampleStageIcon name={icon} aria-hidden="true" />,
    }} />;
  }

  // The demo maps subflows to the built-in stage key agent. A stock group
  // header expects a pictograph, not a stage-icon key, and stays in its mode.
  if (icon === "agent") return <GroupContainerNode {...props} data={{ ...data, icon: "▣" }} />;
  return <GroupContainerNode {...props} />;
}
