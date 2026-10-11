import { warnDeprecated, MemoryInspector, NarrativeLog, GanttTimeline, createTraceStructureRecorder, asStageId, asRuntimeStageId } from './chunk-TT4DVP3R.js';
export { SubflowBreadcrumb, SubflowTree, asRuntimeStageId, asStageId, createTraceStructureRecorder, graphFromStructure, overlayFromSnapshot } from './chunk-TT4DVP3R.js';
import './chunk-QDHBS46D.js';
import { dagreTraceLayout, StageNode, SmartStepEdge, LoopBackEdge, chartLayoutKey, ChartAutoRefit, DEFAULT_NODE_W, DEFAULT_NODE_H, createTraceRuntimeOverlay, TracedFlow, sizeOf } from './chunk-2SJLI2BH.js';
export { GROUP_CONTAINER_NODE_TYPE, GroupContainerNode, LoopBackEdge, MAIN_CHART_BOX_ID, SmartStepEdge, StageNode, TracedFlow, applyGroupLayout, collapseTraceGraph, createDagreTraceLayout, createGroupedLayout, createMainChartBoxLayout, createSnappedDagreLayout, createTraceRuntimeOverlay, dagreTraceLayout, sliceOverlay, snapLinearSuccessors, wrapInMainChartBox } from './chunk-2SJLI2BH.js';
import { rawDefaults, createNotifier, devWarn } from './chunk-S3YWIRGX.js';
export { buildSubflowBreadcrumb, filterGraphForDrill } from './chunk-S3YWIRGX.js';
import { theme, fontSize, padding } from './chunk-66AKOWND.js';
import { useMemo, useSyncExternalStore, useCallback, useRef, useState } from 'react';
import { ReactFlow, Background, BackgroundVariant, Handle, Position, MarkerType } from '@xyflow/react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

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
function styleEdge(edge, colors) {
  const kind = edge.data?.kind ?? "next";
  const color = kind === "loop" ? colors.loop : kind === "fork-branch" ? colors.forkBranch : kind === "decision-branch" ? colors.decisionBranch : colors.next;
  const styled = {
    ...edge,
    // Loop back-edges use the custom `loopBack` edge — a curve routed along the
    // right margin (clear of the spine) instead of a straight/step center line.
    // Every other edge uses `smartStep`: a smoothstep superset that routes a
    // RANK-SKIPPING edge around the node it skips (else identical to smoothstep).
    type: kind === "loop" ? "loopBack" : "smartStep",
    animated: false,
    style: { stroke: color, strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 }
  };
  if (kind === "loop") {
    styled.style = { ...styled.style, strokeDasharray: "4 3" };
  }
  return styled;
}
var DEFAULT_NODE_TYPES = { stageNode: StageNode };
var DEFAULT_EDGE_TYPES = { loopBack: LoopBackEdge, smartStep: SmartStepEdge };
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
  const layout = props.layout ?? dagreTraceLayout;
  const edgeColors = useMemo(
    () => ({ ...DEFAULT_EDGE_COLORS, ...props.edgeColors ?? {} }),
    [props.edgeColors]
  );
  const subscribe = useMemo(
    () => subscribeToRecorder(props.recorder),
    [props.recorder]
  );
  const getVersion = useMemo(
    () => getRecorderVersion(props.recorder),
    [props.recorder]
  );
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);
  const { recorder, graph: graphProp } = props;
  const graph = useMemo(() => {
    if (recorder) return recorder.getGraph();
    if (graphProp) return graphProp;
    return EMPTY_GRAPH;
  }, [recorder, graphProp, version]);
  const positioned = useMemo(() => {
    if (layout === "passthrough") return graph;
    return layout(graph);
  }, [graph, layout]);
  const reactFlowNodes = useMemo(
    () => positioned.nodes.map(toStageNode),
    [positioned.nodes]
  );
  const reactFlowEdges = useMemo(
    () => positioned.edges.map((e) => styleEdge(e, edgeColors)),
    [positioned.edges, edgeColors]
  );
  const onNodeClickRef = props.onNodeClick;
  const handleNodeClick = useCallback(
    (_, node) => {
      onNodeClickRef?.(node.id);
    },
    [onNodeClickRef]
  );
  const { nodeTypes: userNodeTypes, edgeTypes: userEdgeTypes } = props;
  const mergedNodeTypes = useMemo(
    () => userNodeTypes ? { ...DEFAULT_NODE_TYPES, ...userNodeTypes } : DEFAULT_NODE_TYPES,
    [userNodeTypes]
  );
  const mergedEdgeTypes = useMemo(
    () => userEdgeTypes ? { ...DEFAULT_EDGE_TYPES, ...userEdgeTypes } : DEFAULT_EDGE_TYPES,
    [userEdgeTypes]
  );
  const wrapperRef = useRef(null);
  const refitKey = chartLayoutKey(positioned.nodes);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: wrapperRef,
      className: props.className,
      style: {
        width: "100%",
        height: "100%",
        minHeight: 300,
        ...props.style
      },
      children: /* @__PURE__ */ jsxs(
        ReactFlow,
        {
          nodes: reactFlowNodes,
          edges: reactFlowEdges,
          nodeTypes: mergedNodeTypes,
          edgeTypes: mergedEdgeTypes,
          onNodeClick: handleNodeClick,
          proOptions: { hideAttribution: true },
          children: [
            /* @__PURE__ */ jsx(ChartAutoRefit, { wrapperRef, refitKey }),
            /* @__PURE__ */ jsx(Background, { variant: BackgroundVariant.Dots, gap: 20, size: 1 }),
            props.children
          ]
        }
      )
    }
  );
}
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const fs = fontSize[size];
  const pad = padding[size];
  if (snapshots.length === 0) {
    return /* @__PURE__ */ jsx(
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
  const chart = runtimeOverlay ? /* @__PURE__ */ jsx(
    TracedFlow,
    {
      graph,
      overlay: runtimeOverlay,
      scrubIndex: selectedIndex,
      onNodeClick: handleNodeClick
    }
  ) : /* @__PURE__ */ jsx(TraceFlow, { graph, onNodeClick: handleNodeClick });
  if (unstyled) {
    return /* @__PURE__ */ jsxs("div", { className, style, "data-fp": "time-travel-debugger", children: [
      /* @__PURE__ */ jsx("h3", { children: title }),
      /* @__PURE__ */ jsx(
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
      /* @__PURE__ */ jsx(
        MemoryInspector,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      /* @__PURE__ */ jsx(
        NarrativeLog,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      showGantt && /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              padding: `${pad}px ${pad + 4}px`,
              borderBottom: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8
                  },
                  children: [
                    /* @__PURE__ */ jsx(
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
                    /* @__PURE__ */ jsx(
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
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsx(
                  ScrubButton,
                  {
                    label: "\u25C0",
                    disabled: selectedIndex === 0,
                    onClick: () => setSelectedIndex((i) => Math.max(0, i - 1))
                  }
                ),
                /* @__PURE__ */ jsx(
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
                /* @__PURE__ */ jsx(
                  ScrubButton,
                  {
                    label: "\u25B6",
                    disabled: selectedIndex === snapshots.length - 1,
                    onClick: () => setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1))
                  }
                ),
                /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: isHorizontal ? "row" : "column",
              overflow: "hidden"
            },
            children: [
              /* @__PURE__ */ jsx(
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
              /* @__PURE__ */ jsxs("div", { style: { flex: 1, overflow: "auto" }, children: [
                /* @__PURE__ */ jsx(
                  MemoryInspector,
                  {
                    snapshots,
                    selectedIndex,
                    size
                  }
                ),
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      height: 1,
                      background: theme.border,
                      margin: `0 ${pad}px`
                    }
                  }
                ),
                /* @__PURE__ */ jsx(
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
        showGantt && /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              borderTop: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(
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
var EMPTY_GRAPH2 = { nodes: [], edges: [] };
function useSubflowNavigation(rootGraph) {
  warnDeprecated(
    "useSubflowNavigation",
    "It keys the drill by the child chart's LOCAL subflowId, which is not unique across two mounts of the same chart. Use <TracedFlow>'s built-in drill (currentSubflowId + onSubflowChange), or filterGraphForDrill + buildSubflowBreadcrumb with the MOUNT NODE'S id."
  );
  const [stack, setStack] = useState([]);
  const safeRootGraph = rootGraph ?? EMPTY_GRAPH2;
  const subflowMounts = useMemo(() => {
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
  const breadcrumbs = useMemo(() => {
    const rootLabel = "Flowchart";
    const root = { label: rootLabel };
    return [root, ...stack];
  }, [stack]);
  const handleNodeClick = useCallback(
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
  const navigateTo = useCallback((level) => {
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
function SlotPillNode({ data }) {
  const d = data;
  const lit = !!(d.active || d.selected);
  const accent = lit ? theme.primary : d.done ? theme.nodeVisited : theme.textMuted;
  const opacity = d.dimmed && !lit ? 0.45 : 1;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 12px",
        borderRadius: 999,
        // full pill
        border: `1.5px solid ${lit ? theme.primary : theme.border}`,
        // Fills derive from the theme so the pill follows dark/light — the lit
        // state is a faint primary tint over the resting node bg, unlit is the
        // resting bg itself (visible against the canvas via the border).
        background: lit ? `color-mix(in srgb, ${theme.primary} 14%, ${theme.bgSecondary})` : theme.bgSecondary,
        boxShadow: lit ? `0 0 0 2px color-mix(in srgb, ${theme.primary} 25%, transparent)` : "none",
        opacity,
        fontSize: 12,
        fontWeight: 600,
        color: lit ? theme.textPrimary : theme.textSecondary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        transition: "opacity 120ms, box-shadow 120ms, border-color 120ms"
      },
      title: d.label,
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": true,
            style: {
              flexShrink: 0,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accent
            }
          }
        ),
        d.icon ? /* @__PURE__ */ jsx("span", { "aria-hidden": true, style: { flexShrink: 0 }, children: d.icon }) : null,
        /* @__PURE__ */ jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis" }, children: d.label }),
        /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Top, style: { opacity: 0 } }),
        /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Bottom, style: { opacity: 0 } })
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
    const memo = rank.get(id);
    if (memo !== void 0) return memo;
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
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H;
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
  structure.subscribe(() => notifier.notify());
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
    const record = {
      runtimeStageId,
      ...event.traversalContext.iteration !== void 0 && {
        iteration: event.traversalContext.iteration
      },
      ...event.startTime !== void 0 && { startMs: event.startTime },
      ...event.endTime !== void 0 && { endMs: event.endTime }
    };
    execList.push(record);
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
      const own = notifier.version();
      const struct = structure.version();
      if (cachedIndex !== null && cachedOwnVersion === own && cachedStructureVersion === struct) {
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
      cachedOwnVersion = own;
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
  structure.subscribe(() => notifier.notify());
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
        const list = writersOf.get(k) ?? [];
        list.push({ commitIdx: rc.commitIdx, runtimeStageId: rc.runtimeStageId });
        writersOf.set(k, list);
      }
    }
    const commitsOfStage = /* @__PURE__ */ new Map();
    for (const rc of rawCommits) {
      const list = commitsOfStage.get(rc.stageId) ?? [];
      list.push(rc.commitIdx);
      commitsOfStage.set(rc.stageId, list);
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
        const list = commitsOfStage.get(pStageId);
        if (!list) continue;
        let chosenIdx = null;
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i] < rc.commitIdx) {
            chosenIdx = list[i];
            break;
          }
        }
        if (chosenIdx !== null) {
          runtimePrevIds.push(rawCommits[chosenIdx].runtimeStageId);
        }
      }
      const runtimeNextIds = [];
      for (const nStageId of structuralNextIds) {
        const list = commitsOfStage.get(nStageId);
        if (!list) continue;
        let chosenIdx = null;
        for (let i = 0; i < list.length; i++) {
          if (list[i] > rc.commitIdx) {
            chosenIdx = list[i];
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
      const own = notifier.version();
      const struct = structure.version();
      if (cachedIndex !== null && cachedOwnVersion === own && cachedStructureVersion === struct) {
        return cachedIndex;
      }
      cachedIndex = buildIndex();
      cachedOwnVersion = own;
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
function useTranslator(handle, getSnapshot) {
  const subscribe = useMemo(() => handle.subscribe.bind(handle), [handle]);
  const getVersion = useMemo(() => handle.version.bind(handle), [handle]);
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);
  return useMemo(() => getSnapshot(), [version, getSnapshot]);
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
function NodeInspector({
  index,
  selectedId,
  onNavigate,
  onlyVisited = false,
  className,
  style
}) {
  const view = selectedId ? index.byStageId.get(selectedId) ?? null : null;
  const prevChain = useMemo(
    () => view ? backtraceStructural(index, view.stageId, { onlyVisited }) : [],
    [index, view, onlyVisited]
  );
  const nextChain = useMemo(
    () => view ? forwardtraceStructural(index, view.stageId, { onlyVisited }) : [],
    [index, view, onlyVisited]
  );
  if (!view) {
    return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsxs("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 700, color: theme.textPrimary }, children: view.label }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, fontFamily: "monospace", color: theme.textMuted, marginTop: 2 }, children: [
            view.stageId,
            " \xB7 ",
            view.type,
            view.isDecider && " \xB7 decider",
            view.isFork && " \xB7 fork",
            view.isSubflow && " \xB7 subflow",
            view.isStreaming && " \xB7 streaming",
            view.isPausable && " \xB7 pausable"
          ] }),
          view.description && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: theme.textSecondary, marginTop: 6 }, children: view.description })
        ] }),
        /* @__PURE__ */ jsxs(Section, { title: "Runtime", children: [
          /* @__PURE__ */ jsx(Row, { label: "Visited", value: view.visitedInRun ? "yes" : "no" }),
          view.visitedInRun && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Row, { label: "Executions", value: String(view.executionCount) }),
            view.firstExecutedAt !== null && /* @__PURE__ */ jsx(Row, { label: "First at", value: `${view.firstExecutedAt.toFixed(1)}ms` }),
            view.lastExecutedAt !== null && /* @__PURE__ */ jsx(Row, { label: "Last at", value: `${view.lastExecutedAt.toFixed(1)}ms` }),
            view.totalDurationMs > 0 && /* @__PURE__ */ jsx(Row, { label: "Total", value: `${view.totalDurationMs.toFixed(1)}ms` }),
            view.errorCount > 0 && /* @__PURE__ */ jsx(Row, { label: "Errors", value: String(view.errorCount), valueColor: theme.error })
          ] })
        ] }),
        prevChain.length > 1 && /* @__PURE__ */ jsx(Section, { title: `Prev chain (${prevChain.length - 1} hops)`, children: /* @__PURE__ */ jsx(Crumbs, { nodes: prevChain.slice(0, -1), onClick: onNavigate }) }),
        view.prevIds.length > 1 && /* @__PURE__ */ jsx(Section, { title: "Multiple prev (convergence)", children: /* @__PURE__ */ jsx(
          Crumbs,
          {
            nodes: view.prevIds.map((id) => index.byStageId.get(id)).filter((n) => n !== void 0),
            onClick: onNavigate
          }
        ) }),
        nextChain.length > 1 && /* @__PURE__ */ jsx(Section, { title: `Next chain (${nextChain.length - 1} hops)`, children: /* @__PURE__ */ jsx(Crumbs, { nodes: nextChain.slice(1), onClick: onNavigate }) }),
        view.nextIds.length > 1 && /* @__PURE__ */ jsx(Section, { title: "Multiple next (fork/decider)", children: /* @__PURE__ */ jsx(
          Crumbs,
          {
            nodes: view.nextIds.map((id) => index.byStageId.get(id)).filter((n) => n !== void 0),
            onClick: onNavigate
          }
        ) }),
        view.commitRuntimeStageIds.length > 0 && /* @__PURE__ */ jsx(Section, { title: `Commits (${view.commitRuntimeStageIds.length})`, children: /* @__PURE__ */ jsx("div", { style: { fontFamily: "monospace", fontSize: 11, color: theme.textSecondary }, children: view.commitRuntimeStageIds.map((rsid) => /* @__PURE__ */ jsx("div", { children: rsid }, rsid)) }) })
      ]
    }
  );
}
function Section({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: 14 }, children: [
    /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }, children: [
    /* @__PURE__ */ jsx("span", { style: { color: theme.textMuted }, children: label }),
    /* @__PURE__ */ jsx("span", { style: { color: valueColor ?? theme.textSecondary, fontFamily: "monospace" }, children: value })
  ] });
}
function Crumbs({ nodes, onClick }) {
  if (nodes.length === 0) return null;
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: nodes.map((n, i) => /* @__PURE__ */ jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 }, children: [
    /* @__PURE__ */ jsx(
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
    i < nodes.length - 1 && /* @__PURE__ */ jsx("span", { style: { color: theme.textMuted, fontSize: 10 }, children: "\u203A" })
  ] }, n.stageId)) });
}
function CommitInspector({
  index,
  selectedRuntimeStageId,
  onNavigate,
  className,
  style
}) {
  const view = selectedRuntimeStageId ? index.byRuntimeStageId.get(selectedRuntimeStageId) ?? null : null;
  const lineage = useMemo(
    () => view ? backtraceDataFlow(index, view.runtimeStageId) : [],
    [index, view]
  );
  if (!view) {
    return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsxs("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 700, color: theme.textPrimary }, children: view.stageId }),
          /* @__PURE__ */ jsxs(
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
        view.structuralPrevIds.length > 0 && /* @__PURE__ */ jsx(Section2, { title: "Structural prev (chart shape)", children: /* @__PURE__ */ jsx(PlainTags, { labels: view.structuralPrevIds }) }),
        view.structuralNextIds.length > 0 && /* @__PURE__ */ jsx(Section2, { title: "Structural next (chart shape)", children: /* @__PURE__ */ jsx(PlainTags, { labels: view.structuralNextIds }) }),
        view.runtimePrevIds.length > 0 && /* @__PURE__ */ jsx(Section2, { title: "Runtime prev (this execution)", children: /* @__PURE__ */ jsx(RuntimeRefs, { refs: view.runtimePrevIds, onClick: onNavigate }) }),
        view.runtimeNextIds.length > 0 && /* @__PURE__ */ jsx(Section2, { title: "Runtime next (this execution)", children: /* @__PURE__ */ jsx(RuntimeRefs, { refs: view.runtimeNextIds, onClick: onNavigate }) }),
        Object.keys(view.updates).length > 0 && /* @__PURE__ */ jsx(Section2, { title: `Updates (${Object.keys(view.updates).length})`, children: /* @__PURE__ */ jsx(KeyValueGrid, { entries: Object.entries(view.updates) }) }),
        view.reads.length > 0 && /* @__PURE__ */ jsx(Section2, { title: `Reads (${view.reads.length})`, children: /* @__PURE__ */ jsx(PlainTags, { labels: view.reads }) }),
        view.dataDependencies.length > 0 && /* @__PURE__ */ jsx(Section2, { title: `Data dependencies (${view.dataDependencies.length})`, children: /* @__PURE__ */ jsx("table", { style: { fontSize: 11, fontFamily: "monospace", width: "100%", borderCollapse: "collapse" }, children: /* @__PURE__ */ jsx("tbody", { children: view.dataDependencies.map((dep) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { style: { color: theme.textSecondary, padding: "2px 8px 2px 0" }, children: dep.key }),
          /* @__PURE__ */ jsx("td", { style: { color: dep.sourceRuntimeStageId ? theme.textPrimary : theme.textMuted }, children: dep.sourceRuntimeStageId ? /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: onNavigate ? () => onNavigate(dep.sourceRuntimeStageId) : void 0,
              style: crumbButtonStyle(onNavigate !== void 0),
              children: [
                "\u2190 ",
                dep.sourceRuntimeStageId
              ]
            }
          ) : /* @__PURE__ */ jsx("em", { children: "(no prior writer \u2014 default or external)" }) })
        ] }, dep.key)) }) }) }),
        lineage.length > 1 && /* @__PURE__ */ jsx(Section2, { title: `Lineage chain (${lineage.length - 1} ancestor commits)`, children: /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: lineage.slice(0, -1).map((c, i) => /* @__PURE__ */ jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 }, children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onNavigate ? () => onNavigate(c.runtimeStageId) : void 0,
              style: crumbButtonStyle(onNavigate !== void 0),
              children: c.runtimeStageId
            }
          ),
          i < lineage.length - 2 && /* @__PURE__ */ jsx("span", { style: { color: theme.textMuted, fontSize: 10 }, children: "\u2192" })
        ] }, c.runtimeStageId)) }) })
      ]
    }
  );
}
function Section2({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: 14 }, children: [
    /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: labels.map((l) => /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: refs.map((r) => /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx("table", { style: { fontSize: 11, fontFamily: "monospace", width: "100%", borderCollapse: "collapse" }, children: /* @__PURE__ */ jsx("tbody", { children: entries.map(([k, v]) => /* @__PURE__ */ jsxs("tr", { children: [
    /* @__PURE__ */ jsx("td", { style: { color: theme.textSecondary, padding: "2px 8px 2px 0", verticalAlign: "top" }, children: k }),
    /* @__PURE__ */ jsx("td", { style: { color: theme.textPrimary, wordBreak: "break-word" }, children: typeof v === "object" ? JSON.stringify(v) : String(v) })
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
        for (const v of branchVisited) visited.add(v);
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
    const list = commitsByStageId.get(c.stageId) ?? [];
    list.push(c);
    commitsByStageId.set(c.stageId, list);
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
    return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(
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
      children: /* @__PURE__ */ jsx(
        ChainShell,
        {
          node: chain,
          renderLeaf: (leaf) => /* @__PURE__ */ jsx(
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
    return /* @__PURE__ */ jsx(Fragment, { children: renderLeaf(node) });
  }
  if (node.kind === "serial") {
    return /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0
        },
        children: node.items.map((child, i) => /* @__PURE__ */ jsxs(
          "div",
          {
            style: { display: "flex", flexDirection: "column", alignItems: "center" },
            children: [
              /* @__PURE__ */ jsx(ChainShell, { node: child, renderLeaf }),
              i < node.items.length - 1 && /* @__PURE__ */ jsx(Connector, { orientation: "vertical" })
            ]
          },
          chainKey(child, i)
        ))
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0
      },
      children: [
        /* @__PURE__ */ jsx(ForkMarker, {}),
        /* @__PURE__ */ jsx(
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
            children: node.branches.map((branch, i) => /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 120
                },
                children: /* @__PURE__ */ jsx(ChainShell, { node: branch, renderLeaf })
              },
              chainKey(branch, i)
            ))
          }
        ),
        /* @__PURE__ */ jsx(ForkMarker, {})
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
    return /* @__PURE__ */ jsxs(
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
          /* @__PURE__ */ jsx("div", { style: { fontWeight: 600 }, children: label }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontStyle: "italic" }, children: "not executed" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: commits.map((c, i) => {
    const isSelected = c.runtimeStageId === selectedRuntimeStageId;
    const clickable = onSelectCommit !== void 0;
    const isRevealed = revealedThroughCommitIdx === null || c.commitIdx <= revealedThroughCommitIdx;
    return /* @__PURE__ */ jsxs(
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
          /* @__PURE__ */ jsxs("div", { style: { fontWeight: 600 }, children: [
            label,
            commits.length > 1 && /* @__PURE__ */ jsxs("span", { style: { color: theme.textMuted, fontWeight: 400, marginLeft: 6 }, children: [
              "iter ",
              i + 1,
              "/",
              commits.length
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
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
  return orientation === "vertical" ? /* @__PURE__ */ jsx(
    "div",
    {
      "aria-hidden": true,
      style: {
        width: 1,
        height: 12,
        background: theme.border
      }
    }
  ) : /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(
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
function RunSlider({
  index,
  cursorRuntimeStageId,
  onCursorChange,
  renderLabel,
  className,
  style
}) {
  const total = index.commits.length;
  const cursorCommitIdx = useMemo(() => {
    if (!cursorRuntimeStageId) return 0;
    const view = index.byRuntimeStageId.get(cursorRuntimeStageId);
    return view ? view.commitIdx : 0;
  }, [index, cursorRuntimeStageId]);
  const handleSliderChange = useCallback(
    (e) => {
      const value = Number(e.target.value);
      const view = index.commits[value];
      onCursorChange(view ? view.runtimeStageId : null);
    },
    [index, onCursorChange]
  );
  const label = useMemo(() => {
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
    if (total === 0) return /* @__PURE__ */ jsx("span", { style: { color: theme.textMuted }, children: "No commits yet" });
    return /* @__PURE__ */ jsxs("span", { style: { fontFamily: "monospace", fontSize: 11, color: theme.textSecondary }, children: [
      "#",
      cursorCommitIdx + 1,
      " / ",
      total,
      " \xB7 ",
      commit?.runtimeStageId ?? "\u2014"
    ] });
  }, [renderLabel, cursorCommitIdx, total, index, cursorRuntimeStageId]);
  const disabled = total < 2;
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsx("div", { style: { minWidth: 200, textAlign: "right" }, children: label })
      ]
    }
  );
}
function TraceExplorerShell({
  bundle,
  selectedRuntimeStageId: controlledSel,
  onSelectionChange,
  slots,
  className,
  style
}) {
  const [internalSel, setInternalSel] = useState(null);
  const isControlled = controlledSel !== void 0;
  const selectedRuntimeStageId = isControlled ? controlledSel : internalSel;
  const handleSelect = useCallback(
    (rsid) => {
      if (!isControlled) setInternalSel(rsid);
      onSelectionChange?.(rsid);
    },
    [isControlled, onSelectionChange]
  );
  const handleSelectCommit = useCallback(
    (rsid) => handleSelect(rsid),
    [handleSelect]
  );
  const selectedStageId = useMemo(() => {
    if (!selectedRuntimeStageId) return null;
    const hashIdx = selectedRuntimeStageId.lastIndexOf("#");
    if (hashIdx <= 0) return null;
    return asStageId(selectedRuntimeStageId.slice(0, hashIdx));
  }, [selectedRuntimeStageId]);
  const ChainPane = useMemo(
    () => slots?.chain ?? DefaultChainPane,
    [slots?.chain]
  );
  const CommitPane = useMemo(
    () => slots?.commitInspector ?? DefaultCommitPane,
    [slots?.commitInspector]
  );
  const NodePane = useMemo(
    () => slots?.nodeInspector ?? DefaultNodePane,
    [slots?.nodeInspector]
  );
  const SliderPane = useMemo(() => {
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
  const handleStageNavigate = useCallback(
    (stageId) => {
      const candidates = commitIndex.commits.filter((c) => c.stageId === stageId);
      const first = candidates[0];
      handleSelect(first ? first.runtimeStageId : null);
    },
    [commitIndex, handleSelect]
  );
  const revealedThroughCommitIdx = useMemo(() => {
    if (!selectedRuntimeStageId) return null;
    const view = commitIndex.byRuntimeStageId.get(selectedRuntimeStageId);
    return view ? view.commitIdx : -1;
  }, [selectedRuntimeStageId, commitIndex]);
  const layoutStyle = useMemo(
    () => SliderPane ? SHELL_STYLE_WITH_SLIDER : SHELL_STYLE_NO_SLIDER,
    [SliderPane]
  );
  return /* @__PURE__ */ jsxs("div", { className, style: { ...layoutStyle, ...style }, children: [
    SliderPane && /* @__PURE__ */ jsx(Pane, { area: "slider", children: /* @__PURE__ */ jsx(
      SliderPane,
      {
        index: commitIndex,
        cursorRuntimeStageId: selectedRuntimeStageId,
        onCursorChange: handleSelect
      }
    ) }),
    /* @__PURE__ */ jsx(Pane, { area: "chain", children: /* @__PURE__ */ jsx(
      ChainPane,
      {
        chain,
        selectedRuntimeStageId,
        onSelectCommit: handleSelectCommit,
        revealedThroughCommitIdx
      }
    ) }),
    /* @__PURE__ */ jsx(Pane, { area: "commit", children: /* @__PURE__ */ jsx(
      CommitPane,
      {
        index: commitIndex,
        selectedRuntimeStageId,
        onNavigate: handleSelectCommit
      }
    ) }),
    /* @__PURE__ */ jsx(Pane, { area: "node", children: /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(
    CommitInspector,
    {
      index,
      selectedRuntimeStageId,
      onNavigate
    }
  );
}
function DefaultNodePane({ index, selectedStageId, onNavigate }) {
  return /* @__PURE__ */ jsx(NodeInspector, { index, selectedId: selectedStageId, onNavigate });
}
function DefaultSliderPane({
  index,
  cursorRuntimeStageId,
  onCursorChange
}) {
  return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx("div", { role: "region", "aria-label": area, style: { ...PANE_BASE_STYLE, gridArea: area }, children });
}

export { CommitChainView, CommitInspector, NodeInspector, RunSlider, SlotPillNode, TimeTravelDebugger, TraceExplorerShell, TraceFlow, backtraceDataFlow, backtraceStructural, buildCommitChainTree, createCommitFlowRecorder, createNodeViewRecorder, createTraceBundle, createTraceGroupLayout, defaultTraceFlowLayout, forwardtraceStructural, structureAsChainTree, traceGroupLayout, useSubflowNavigation, useTranslator, walkBackward, walkForward };
//# sourceMappingURL=flowchart.js.map
//# sourceMappingURL=flowchart.js.map