import { rawDefaults, createNotifier, devWarn, filterGraphForDrill, buildSubflowBreadcrumb, themeModeVars, findMountNode, resolveDrillScope } from './chunk-S3YWIRGX.js';
import { theme } from './chunk-66AKOWND.js';
import { memo, useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Handle, Position, useStore, BaseEdge, getSmoothStepPath, ReactFlow, Background, BackgroundVariant, useStoreApi, useReactFlow, MarkerType, useNodesInitialized, getViewportForBounds } from '@xyflow/react';
import dagre from 'dagre';
import { jsxs, Fragment, jsx } from 'react/jsx-runtime';

var DEFAULT_NODE_W = 200;
var DEFAULT_NODE_H = 80;
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
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H;
  const g = new dagre.graphlib.Graph({ compound: true });
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
  dagre.layout(g);
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

// src/components/FlowchartView/_internal/snapLinearSuccessors.ts
function snapLinearSuccessors(graph, options = {}) {
  if (graph.nodes.length === 0) return graph;
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H;
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
    const list = preds.get(e.target);
    if (list) list.push(e.source);
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
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H;
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
var KEYFRAMES_ID = "fp-stage-node-keyframes";
var KEYFRAMES_CSS = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes fp-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.15; transform: scale(1.06); }
  }
  @keyframes fp-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes fp-pulse { 0%, 100% { opacity: 0.3; } }
  @keyframes fp-blink { 0%, 100% { opacity: 1; } }
}
`;
var ICON_SIZE = 16;
function StageIcon({ type, color }) {
  const s = ICON_SIZE;
  const props = { width: s, height: s, viewBox: `0 0 ${s} ${s}`, fill: "none", style: { flexShrink: 0 } };
  switch (type) {
    // LLM / AI call — brain/sparkle
    case "llm":
    case "ai":
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("circle", { cx: "8", cy: "8", r: "6", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ jsx("path", { d: "M5.5 8C5.5 6.5 6.5 5 8 5S10.5 6.5 10.5 8", stroke: color, strokeWidth: "1.2", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("circle", { cx: "8", cy: "9.5", r: "1", fill: color }),
        /* @__PURE__ */ jsx("line", { x1: "8", y1: "2", x2: "8", y2: "3.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("line", { x1: "12.5", y1: "4", x2: "11.2", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("line", { x1: "3.5", y1: "4", x2: "4.8", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Tool / function call — gear
    case "tool":
    case "function":
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("circle", { cx: "8", cy: "8", r: "3", stroke: color, strokeWidth: "1.5" }),
        [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = angle * Math.PI / 180;
          const x1 = 8 + Math.cos(rad) * 4.5;
          const y1 = 8 + Math.sin(rad) * 4.5;
          const x2 = 8 + Math.cos(rad) * 6;
          const y2 = 8 + Math.sin(rad) * 6;
          return /* @__PURE__ */ jsx("line", { x1, y1, x2, y2, stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }, angle);
        })
      ] });
    // RAG / retrieval — magnifying glass + doc
    case "rag":
    case "search":
    case "retrieval":
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("circle", { cx: "7", cy: "7", r: "4", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ jsx("line", { x1: "10", y1: "10", x2: "13.5", y2: "13.5", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("line", { x1: "5.5", y1: "6", x2: "8.5", y2: "6", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("line", { x1: "5.5", y1: "8", x2: "7.5", y2: "8", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Parse / process — diamond with arrows
    case "parse":
    case "process":
    case "transform":
      return /* @__PURE__ */ jsx("svg", { ...props, children: /* @__PURE__ */ jsx("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", stroke: color, strokeWidth: "1.5", transform: "rotate(45 8 8)" }) });
    // Start / seed — play triangle
    case "start":
    case "seed":
    case "init":
      return /* @__PURE__ */ jsx("svg", { ...props, children: /* @__PURE__ */ jsx("path", { d: "M5 3.5L12.5 8L5 12.5V3.5Z", fill: color, opacity: "0.8" }) });
    // End / finalize — stop square
    case "end":
    case "finalize":
    case "output":
      return /* @__PURE__ */ jsx("svg", { ...props, children: /* @__PURE__ */ jsx("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", fill: color, opacity: "0.8" }) });
    // Agent — person silhouette
    case "agent":
    case "orchestrator":
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("circle", { cx: "8", cy: "5", r: "2.5", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ jsx("path", { d: "M3.5 14C3.5 11 5.5 9 8 9S12.5 11 12.5 14", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" })
      ] });
    // Swarm — multi-agent
    case "swarm":
    case "multi-agent":
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("circle", { cx: "5", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ jsx("circle", { cx: "11", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ jsx("circle", { cx: "8", cy: "11", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ jsx("line", { x1: "5", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" }),
        /* @__PURE__ */ jsx("line", { x1: "11", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" })
      ] });
    // Guard / guardrail — shield
    case "guard":
    case "guardrail":
    case "validate":
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("path", { d: "M8 2L3 5V9C3 11.5 5 13.5 8 14.5C11 13.5 13 11.5 13 9V5L8 2Z", stroke: color, strokeWidth: "1.5", strokeLinejoin: "round" }),
        /* @__PURE__ */ jsx("path", { d: "M6 8L7.5 9.5L10 6.5", stroke: color, strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" })
      ] });
    // Stream — wave
    case "stream":
    case "streaming":
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("path", { d: "M2 8C4 5 6 11 8 8S12 5 14 8", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
        /* @__PURE__ */ jsx("path", { d: "M2 11C4 8 6 14 8 11S12 8 14 11", stroke: color, strokeWidth: "1", strokeLinecap: "round", fill: "none", opacity: "0.5" })
      ] });
    // Memory / state — database cylinder
    case "memory":
    case "state":
    case "db":
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("ellipse", { cx: "8", cy: "4.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ jsx("line", { x1: "3", y1: "4.5", x2: "3", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ jsx("line", { x1: "13", y1: "4.5", x2: "13", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ jsx("ellipse", { cx: "8", cy: "11.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" })
      ] });
    // System prompt — document with lines
    case "system-prompt":
    case "prompt":
    case "instructions":
    case "document":
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("rect", { x: "3.5", y: "2", width: "9", height: "12", rx: "1.5", stroke: color, strokeWidth: "1.3", fill: "none" }),
        /* @__PURE__ */ jsx("line", { x1: "5.5", y1: "5", x2: "10.5", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("line", { x1: "5.5", y1: "7.5", x2: "10.5", y2: "7.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("line", { x1: "5.5", y1: "10", x2: "8.5", y2: "10", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Messages / conversation — chat bubble
    case "messages":
    case "chat":
    case "conversation":
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("rect", { x: "2.5", y: "3", width: "11", height: "8", rx: "2", stroke: color, strokeWidth: "1.3", fill: "none" }),
        /* @__PURE__ */ jsx("path", { d: "M5.5 11L5.5 13.5L8.5 11", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }),
        /* @__PURE__ */ jsx("line", { x1: "5", y1: "6", x2: "11", y2: "6", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("line", { x1: "5", y1: "8.5", x2: "9", y2: "8.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Loop — circular arrow
    case "loop":
    case "retry":
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("path", { d: "M12 8A4 4 0 1 1 8 4", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
        /* @__PURE__ */ jsx("path", { d: "M8 1.5L10.5 4L8 6.5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })
      ] });
    // Lazy / service — cloud (deferred resolution, loaded on demand)
    case "lazy":
    case "service":
    case "cloud":
      return /* @__PURE__ */ jsx("svg", { ...props, children: /* @__PURE__ */ jsx(
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
      return /* @__PURE__ */ jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsx("path", { d: "M8 2L14 8L8 14L2 8Z", stroke: color, strokeWidth: "1.5", fill: "none" }),
        /* @__PURE__ */ jsx("circle", { cx: "8", cy: "8", r: "1.5", fill: color })
      ] });
    default:
      return null;
  }
}
var StageNode = memo(function StageNode2({
  data
}) {
  const { label, active, done, error, linked, icon, stepNumbers, dimmed, isSubflow, isLazy, isDecider, isFork, description, stageId, showStageId, retryAttempts } = data;
  const effectiveIcon = icon || (isLazy ? "lazy" : void 0);
  const isLazyUnresolved = isLazy && !done && !active;
  const injectedRef = useRef(false);
  useEffect(() => {
    if (injectedRef.current) return;
    if (typeof document !== "undefined" && !document.getElementById(KEYFRAMES_ID)) {
      const styleEl = document.createElement("style");
      styleEl.id = KEYFRAMES_ID;
      styleEl.textContent = KEYFRAMES_CSS;
      document.head.appendChild(styleEl);
    }
    injectedRef.current = true;
  }, []);
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
  const borderColor = active ? theme.nodeCursor : isHero && done ? theme.nodeMain : done ? theme.nodeVisited : error ? theme.error : restingBorder;
  const shadow = active ? `0 0 22px color-mix(in srgb, ${theme.nodeCursor} 55%, transparent)` : isHero && done ? `0 0 12px color-mix(in srgb, ${theme.nodeMain} 30%, transparent)` : done ? `0 0 8px color-mix(in srgb, ${theme.nodeVisited} 20%, transparent)` : error ? `0 0 12px color-mix(in srgb, ${theme.error} 30%, transparent)` : restingShadow;
  const textColor = active ? "#1a1a1a" : done || error ? "#fff" : theme.textPrimary;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Top, style: { opacity: 0 } }),
    /* @__PURE__ */ jsx("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 6,
          // Plumbing recedes. Layers with the run-overlay `dimmed` (not-yet-run)
          // — a muted AND not-run node is faintest, which is correct.
          opacity: isMuted ? 0.5 : void 0
        },
        children: [
          stepNumbers && stepNumbers.length > 0 && isOnPath && /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                position: "absolute",
                top: -10,
                left: -10,
                display: "flex",
                gap: 3,
                zIndex: 10
              },
              children: stepNumbers.map((num, i) => {
                const isLatest = i === stepNumbers.length - 1;
                const badgeBg = isLatest && active ? theme.nodeCursor : theme.nodeVisited;
                const glow = isLatest && active ? `color-mix(in srgb, ${theme.nodeCursor} 50%, transparent)` : `color-mix(in srgb, ${theme.nodeVisited} 40%, transparent)`;
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: badgeBg,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 0 8px ${glow}`
                    },
                    children: num
                  },
                  num
                );
              })
            }
          ),
          linked && /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                position: "absolute",
                inset: -6,
                borderRadius: isDecider ? 0 : `calc(${theme.radius} + 4px)`,
                clipPath: isDecider ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : void 0,
                border: `2px solid ${theme.primary}`,
                opacity: 0.4,
                animation: "fp-pulse 2s ease-in-out infinite"
              }
            }
          ),
          active && /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                position: "absolute",
                inset: -6,
                borderRadius: isDecider ? 0 : `calc(${theme.radius} + 4px)`,
                clipPath: isDecider ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : void 0,
                border: `2px solid ${theme.nodeCursor}`,
                opacity: 0.3,
                animation: "fp-pulse 1.5s ease-out infinite"
              }
            }
          ),
          active && /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                position: "absolute",
                top: -9,
                right: -8,
                zIndex: 11,
                background: theme.warning,
                color: "#1a1a1a",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 0.6,
                padding: "2px 6px",
                borderRadius: 10,
                boxShadow: `0 0 10px color-mix(in srgb, ${theme.warning} 60%, transparent)`
              },
              children: "NOW"
            }
          ),
          showRetryBadge && /* @__PURE__ */ jsxs(
            "div",
            {
              role: "img",
              "aria-label": retryLabel,
              title: retryLabel,
              style: {
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
              },
              children: [
                /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u21BA" }),
                /* @__PURE__ */ jsxs("span", { "aria-hidden": "true", children: [
                  "\xD7",
                  retryAttempts
                ] })
              ]
            }
          ),
          isDecider ? /* @__PURE__ */ jsxs("div", { style: { position: "relative", width: 120, height: 72 }, children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  position: "absolute",
                  inset: 0,
                  background: bg,
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  border: "none",
                  boxShadow: shadow,
                  transition: "all 0.3s ease"
                }
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  position: "absolute",
                  inset: -2,
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  background: borderColor,
                  zIndex: -1,
                  ...isLazyUnresolved ? {
                    background: "transparent"
                    // Dashed border via SVG for clip-path (CSS border doesn't work with clip-path)
                  } : {}
                }
              }
            ),
            /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  fontFamily: theme.fontSans,
                  zIndex: 1
                },
                children: [
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                    effectiveIcon && /* @__PURE__ */ jsx(StageIcon, { type: effectiveIcon, color: textColor }),
                    !effectiveIcon && /* @__PURE__ */ jsx("span", { style: { fontSize: 9, color: textColor }, children: "\u25C7" }),
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        style: {
                          fontSize: 11,
                          fontWeight: 600,
                          color: textColor,
                          whiteSpace: "nowrap"
                        },
                        children: label
                      }
                    )
                  ] }),
                  description && /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        fontSize: 8,
                        fontWeight: 400,
                        color: textColor,
                        opacity: 0.7,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 100
                      },
                      children: description
                    }
                  ),
                  showStageId && stageId && /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        fontSize: 8,
                        fontFamily: "ui-monospace, monospace",
                        color: textColor,
                        opacity: 0.55,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 100
                      },
                      title: `stageId: ${stageId}`,
                      children: stageId
                    }
                  )
                ]
              }
            )
          ] }) : (
            /* Standard rectangular node */
            /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  background: bg,
                  border: `${isHero ? "2.5px" : isMuted ? "1px" : "2px"} ${isLazyUnresolved ? "dashed" : "solid"} ${borderColor}`,
                  borderRadius: theme.radius,
                  padding: description ? `${Math.round(6 * sizeScale)}px ${Math.round(12 * sizeScale)}px` : `${Math.round(7 * sizeScale)}px ${Math.round(14 * sizeScale)}px`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: description ? 2 : 0,
                  boxShadow: shadow,
                  transition: "all 0.3s ease",
                  fontFamily: theme.fontSans,
                  minWidth: 100,
                  justifyContent: "center"
                },
                children: [
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    effectiveIcon && /* @__PURE__ */ jsx(StageIcon, { type: effectiveIcon, color: textColor }),
                    done && !effectiveIcon && /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: textColor }, children: "\u2713" }),
                    active && !effectiveIcon && /* @__PURE__ */ jsx(
                      "span",
                      {
                        style: {
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#fff",
                          animation: "fp-blink 1s ease-in-out infinite",
                          flexShrink: 0
                        }
                      }
                    ),
                    error && !effectiveIcon && /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: textColor }, children: "\u2717" }),
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        style: {
                          fontSize: Math.round(13 * sizeScale),
                          fontWeight: isHero ? 700 : 500,
                          color: textColor,
                          whiteSpace: "nowrap"
                        },
                        children: label
                      }
                    ),
                    isSubflow && /* @__PURE__ */ jsx(
                      "span",
                      {
                        style: {
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
                        },
                        children: /* @__PURE__ */ jsx(
                          "span",
                          {
                            style: {
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              border: `1px solid ${textColor}`
                            }
                          }
                        )
                      }
                    )
                  ] }),
                  description && /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        fontSize: 10,
                        fontWeight: 400,
                        color: textColor,
                        opacity: 0.7,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 160
                      },
                      children: description
                    }
                  ),
                  showStageId && stageId && /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        fontSize: 9,
                        fontFamily: "ui-monospace, monospace",
                        color: textColor,
                        opacity: 0.55,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 160
                      },
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
    ) }),
    /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Bottom, style: { opacity: 0 } })
  ] });
});

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
  return via.some((v) => typeof v === "string" && standIns.has(v));
}
function useSubflowDrill(graph, onSubflowChange, controlledSubflowId) {
  const isControlled = controlledSubflowId !== void 0;
  const [ownSubflowId, setOwnSubflowId] = useState(null);
  const currentSubflowId = isControlled ? controlledSubflowId : ownSubflowId;
  const lastGraphRef = useRef(null);
  if (!isControlled && lastGraphRef.current !== graph) {
    lastGraphRef.current = graph;
    if (ownSubflowId !== null && findMountNode(graph, ownSubflowId) === void 0) {
      queueMicrotask(() => setOwnSubflowId(null));
    }
  }
  const lastNotifiedRef = useRef(void 0);
  useEffect(() => {
    if (isControlled) return;
    if (lastNotifiedRef.current === currentSubflowId) return;
    lastNotifiedRef.current = currentSubflowId;
    onSubflowChange?.(currentSubflowId);
  }, [isControlled, currentSubflowId, onSubflowChange]);
  const setCurrentSubflowId = useCallback(
    (id) => {
      if (isControlled) onSubflowChange?.(id);
      else setOwnSubflowId(id);
    },
    [isControlled, onSubflowChange]
  );
  const drillInto = useCallback(
    (mountNodeId) => setCurrentSubflowId(mountNodeId),
    [setCurrentSubflowId]
  );
  const drillUp = useCallback(() => setCurrentSubflowId(null), [setCurrentSubflowId]);
  return { currentSubflowId, drillInto, drillUp, setCurrentSubflowId };
}
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
function chartFitViewport(state, padding) {
  if (!positiveFinite(state.width) || !positiveFinite(state.height) || !positiveFinite(state.minZoom) || !positiveFinite(state.maxZoom) || state.maxZoom < state.minZoom || !Number.isFinite(padding) || padding < 0) return null;
  const bounds = measuredChartBounds(state.nodeLookup);
  if (!bounds) return null;
  const viewport = getViewportForBounds(bounds, state.width, state.height, state.minZoom, state.maxZoom, padding);
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
function useChartAutoRefit({ wrapperRef, padding = 0.1, refitKey, layoutKey }) {
  const store = useStoreApi();
  const { setViewport } = useReactFlow();
  const requestLayoutFit = useRef(null);
  useEffect(() => {
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
        const viewport = chartFitViewport(state, padding);
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
        const viewport = chartFitViewport(state, padding);
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
  }, [store, setViewport, wrapperRef, padding, refitKey]);
  useEffect(() => {
    requestLayoutFit.current?.();
  }, [layoutKey]);
}
function ChartAutoRefit(props) {
  useChartAutoRefit(props);
  return null;
}
function SubflowBreadcrumbBar({ entries, onNavigate }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        fontSize: 11,
        background: theme.bgSecondary,
        borderBottom: `1px solid ${theme.border}`,
        flexShrink: 0
      },
      "aria-label": "Subflow breadcrumb",
      children: entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        return /* @__PURE__ */ jsxs(
          "span",
          {
            style: { display: "inline-flex", alignItems: "center", gap: 6 },
            children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => onNavigate(entry.subflowId),
                  disabled: isLast,
                  style: {
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    fontSize: 11,
                    fontWeight: isLast ? 600 : 500,
                    color: isLast ? theme.textPrimary : theme.primary,
                    cursor: isLast ? "default" : "pointer",
                    textDecoration: isLast ? "none" : "underline",
                    fontFamily: "inherit"
                  },
                  children: entry.label
                }
              ),
              !isLast && /* @__PURE__ */ jsx("span", { style: { color: theme.textMuted }, children: "\u203A" })
            ]
          },
          entry.subflowId ?? "__top__"
        );
      })
    }
  );
}
function GroupContainerNode({ data }) {
  const d = data;
  const borderColor = d.error ? theme.error : d.active ? theme.primary : d.done ? theme.nodeVisited : theme.border;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        border: `1.5px ${d.active || d.done || d.error ? "solid" : "dashed"} ${borderColor}`,
        borderRadius: 12,
        // Translucent (theme-derived) so the dotted background + nested children
        // read clearly, while still following dark/light.
        background: `color-mix(in srgb, ${theme.textMuted} 7%, transparent)`,
        opacity: d.dimmed ? 0.4 : 1,
        position: "relative"
      },
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: theme.textMuted,
              letterSpacing: 0.2
            },
            children: [
              d.icon ? /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: d.icon }) : null,
              /* @__PURE__ */ jsx("span", { children: d.label })
            ]
          }
        ),
        /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Top, style: { opacity: 0 } }),
        /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Bottom, style: { opacity: 0 } })
      ]
    }
  );
}

// src/components/FlowchartView/_internal/loopRouting.ts
var LOOP_LANE_GAP = 56;
function loopLaneX(contentRights, gap = LOOP_LANE_GAP) {
  let max = -Infinity;
  for (const r of contentRights) if (r > max) max = r;
  if (!Number.isFinite(max)) max = 0;
  return max + gap;
}
function loopBackPath(source, target, laneX, radius = 22) {
  const { right: sx, centerY: sy } = source;
  const { right: tx, centerY: ty } = target;
  const r = Math.max(
    0,
    Math.min(radius, Math.abs(sy - ty) / 2, laneX - sx, laneX - tx)
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
var DEFAULT_NODE_W2 = 200;
var DEFAULT_NODE_H2 = 80;
function footprintOf(node, fallbackW, fallbackH) {
  const style = node.style ?? {};
  const w = typeof style.width === "number" ? style.width : fallbackW;
  const h = typeof style.height === "number" ? style.height : fallbackH;
  return { width: w, height: h };
}
function applyGroupLayout(graph, opts) {
  const padding = opts.padding ?? DEFAULT_PADDING;
  const headerHeight = opts.headerHeight ?? DEFAULT_HEADER;
  const nodeW = opts.nodeWidth ?? DEFAULT_NODE_W2;
  const nodeH = opts.nodeHeight ?? DEFAULT_NODE_H2;
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
      const { width, height } = footprintOf(m, nodeW, nodeH);
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
    const boxWidth = maxX - minX + padding * 2;
    const boxHeight = maxY - minY + headerHeight + padding * 2;
    groupBox.set(sfId, { width: boxWidth, height: boxHeight, minX, minY, members: innerPositioned.nodes });
  }
  const outerNodes = graph.nodes.filter((n) => !memberIds.has(n.id)).map((n) => {
    const box = n.data?.subflowId ? groupBox.get(n.data.subflowId) : void 0;
    return box ? {
      ...n,
      style: { ...n.style ?? {}, width: box.width, height: box.height },
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
    const box = groupBox.get(sfId);
    const { width: boxWidth, height: boxHeight, minX, minY } = box;
    const mountPos = outerPosById.get(mount.id) ?? mount.position ?? { x: 0, y: 0 };
    containerNodes.push({
      ...mount,
      type: GROUP_CONTAINER_NODE_TYPE,
      position: mountPos,
      style: { ...mount.style ?? {}, width: boxWidth, height: boxHeight },
      data: { ...mount.data, isGroupContainer: true }
    });
    for (const m of box.members) {
      const relX = m.position.x - minX + padding;
      const relY = m.position.y - minY + headerHeight + padding;
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
  const padding = opts.padding ?? DEFAULT_PADDING;
  const headerHeight = opts.headerHeight ?? DEFAULT_HEADER;
  const nodeW = opts.nodeWidth ?? DEFAULT_NODE_W2;
  const nodeH = opts.nodeHeight ?? DEFAULT_NODE_H2;
  const mainId = opts.id ?? MAIN_CHART_BOX_ID;
  const positioned = opts.baseLayout(graph);
  const topLevel = positioned.nodes.filter((n) => n.parentId === void 0);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of topLevel) {
    const p = n.position;
    const { width, height } = footprintOf(n, nodeW, nodeH);
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
  const boxWidth = maxX - minX + padding * 2 + loopReserve;
  const boxHeight = maxY - minY + headerHeight + padding * 2;
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
        x: n.position.x - minX + padding,
        y: n.position.y - minY + headerHeight + padding
      }
    };
  });
  return { nodes: [container, ...reparented], edges: graph.edges };
}
function createMainChartBoxLayout(opts) {
  return (graph) => wrapInMainChartBox(graph, opts);
}
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
function LoopBackEdge({ id, source, target, markerEnd, style }) {
  const path = useStore((s) => {
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
  return /* @__PURE__ */ jsx(
    BaseEdge,
    {
      id,
      path,
      markerEnd,
      style: softenLoopStyle(style),
      "aria-label": "Loop back"
    }
  );
}

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
  const bendY = useStore((s) => {
    const src = s.nodeLookup.get(source);
    const tgt = s.nodeLookup.get(target);
    if (!src || !tgt) return null;
    const sourceBottom = src.internals.positionAbsolute.y + (src.measured.height ?? 0);
    const targetTop = tgt.internals.positionAbsolute.y;
    const childTops = [];
    for (const e of s.edges) {
      if (e.source !== source) continue;
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
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition ?? Position.Bottom,
    targetX,
    targetY,
    targetPosition: targetPosition ?? Position.Top,
    // Override the bend only for a staggered edge; otherwise let getSmoothStepPath
    // use its default centerY (== the built-in `smoothstep` path, byte-for-byte).
    ...bendY !== null ? { centerY: bendY } : {}
  });
  return /* @__PURE__ */ jsx(BaseEdge, { id, path, markerEnd, style });
}

// src/components/FlowchartView/_internal/measuredFootprints.ts
function extractMeasuredFootprints(entries) {
  const sizes = /* @__PURE__ */ new Map();
  for (const [id, node] of entries) {
    const width = node.measured?.width;
    const height = node.measured?.height;
    if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) {
      sizes.set(id, { width: Math.round(width), height: Math.round(height) });
    }
  }
  return sizes;
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
  const initialized = useNodesInitialized({ includeHiddenNodes });
  const sizes = useStore(
    (s) => extractMeasuredFootprints(s.nodeLookup),
    sameFootprints
  );
  useEffect(() => {
    if (!initialized || sizes.size === 0) return;
    onSizes(sizes);
  }, [initialized, sizes, onSizes]);
  return null;
}
var DEFAULT_COLORS = {
  default: rawDefaults.colors.textMuted,
  done: rawDefaults.colors.success,
  active: rawDefaults.colors.primary,
  error: rawDefaults.colors.error,
  loop: rawDefaults.colors.warning
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
function toStageNodeWithOverlay(node, doneStageIds, activeStageId, errorMessage, executedOrderIds, coActiveStageIds, retryAttempts) {
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
      ...finalDimmed && { style: { ...node.style ?? {}, opacity: 0.35 } }
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
    ...dimmed && { style: { opacity: 0.35 } }
  };
}
function styleEdgeWithOverlay(edge, doneStageIds, activeStageId, colors, cursorStandIns) {
  const kind = edge.data?.kind ?? "next";
  const sourceExecuted = doneStageIds.has(edge.source) || activeStageId === edge.source;
  const targetExecuted = doneStageIds.has(edge.target) || activeStageId === edge.target;
  const traversed = sourceExecuted && targetExecuted;
  const carriesCursor = edgeCarriesCursor(edge.data?.via, cursorStandIns);
  const isLeadingEdge = carriesCursor || activeStageId === edge.source && !doneStageIds.has(edge.target);
  let color = colors.default;
  if (carriesCursor) color = colors.active;
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
    type: kind === "loop" ? "loopBack" : "smartStep",
    animated: isLeadingEdge,
    style: { stroke: color, strokeWidth: traversed || carriesCursor ? 2 : 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 }
  };
  if (kind === "loop") {
    styled.style = { ...styled.style, strokeDasharray: "4 3" };
  }
  return styled;
}
var DEFAULT_NODE_TYPES = {
  stageNode: StageNode,
  groupContainer: GroupContainerNode
};
var DEFAULT_EDGE_TYPES = { loopBack: LoopBackEdge, smartStep: SmartStepEdge };
function TracedFlow({
  graph,
  overlay,
  scrubIndex,
  layout: layoutProp,
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
  theme: themeMode,
  children,
  className,
  style
}) {
  const layout = layoutProp ?? dagreTraceLayout;
  useEffect(() => {
    if (layoutProp === dagreTraceLayout) {
      devWarn(
        () => "[footprint-explainable-ui] <TracedFlow layout={dagreTraceLayout}> bypasses the built-in measure-then-layout pipeline (content-exact sizing, fork/merge centering, straight spines). OMIT the `layout` prop to use it \u2014 passing the raw dagreTraceLayout silently forfeits every layout improvement eui ships."
      );
    }
  }, [layoutProp]);
  const colors = useMemo(
    () => ({ ...DEFAULT_COLORS, ...colorOverrides ?? {} }),
    [colorOverrides]
  );
  const mergedNodeTypes = useMemo(
    () => userNodeTypes ? { ...DEFAULT_NODE_TYPES, ...userNodeTypes } : DEFAULT_NODE_TYPES,
    [userNodeTypes]
  );
  const mergedEdgeTypes = useMemo(
    () => userEdgeTypes ? { ...DEFAULT_EDGE_TYPES, ...userEdgeTypes } : DEFAULT_EDGE_TYPES,
    [userEdgeTypes]
  );
  const effectiveGraph = useMemo(
    () => collapseNode ? collapseTraceGraph(graph, collapseNode).graph : graph,
    [graph, collapseNode]
  );
  const drill = useSubflowDrill(effectiveGraph, onSubflowChange, controlledSubflowId);
  const groupedSet = useMemo(() => new Set(groupedSubflows ?? []), [groupedSubflows]);
  const filteredGraph = useMemo(() => {
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
  const breadcrumb = useMemo(
    () => buildSubflowBreadcrumb(effectiveGraph, drill.currentSubflowId),
    [effectiveGraph, drill.currentSubflowId]
  );
  const [measuredSizes, setMeasuredSizes] = useState(null);
  const positioned = useMemo(() => {
    const nodeSize = measuredSizes ? (n) => measuredSizes.get(n.id) : void 0;
    const sizeOpts = nodeSize ? { nodeSize } : {};
    const dagreBase = withForkCentering(
      createSnappedDagreLayout(
        createDagreTraceLayout({ ...sizeOpts, rankSep: 52, nodeSep: 36 }),
        sizeOpts
      ),
      { ...sizeOpts, nodeSep: 36 }
      // same nodeSep → clamp preserves dagre's reserved gap
    );
    const realBase = layout === "passthrough" ? (g) => g : layoutProp === void 0 ? dagreBase : layout;
    if (groupedSet.size > 0) {
      const grouped = applyGroupLayout(filteredGraph, {
        groupedSubflowIds: [...groupedSet],
        baseLayout: realBase
      });
      return mainChartBox ? wrapInMainChartBox(grouped, { baseLayout: (g) => g, ...mainChartBox }) : grouped;
    }
    if (mainChartBox) {
      return wrapInMainChartBox(filteredGraph, { baseLayout: realBase, ...mainChartBox });
    }
    return realBase(filteredGraph);
  }, [filteredGraph, layout, layoutProp, groupedSet, mainChartBox, measuredSizes]);
  const slice = useMemo(() => {
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
  const reactFlowNodes = useMemo(
    () => positioned.nodes.map(
      (n) => toStageNodeWithOverlay(
        n,
        slice.doneStageIds,
        slice.activeStageId,
        slice.errors.get(n.id),
        slice.executedOrderIds,
        coActiveStageIds ?? EMPTY_SET,
        slice.retryAttempts?.get(n.id)
      )
    ),
    [positioned.nodes, slice, coActiveStageIds]
  );
  const cursorStandIns = useMemo(() => cursorStandInIds(slice.activeStageId), [slice.activeStageId]);
  const reactFlowEdges = useMemo(
    () => positioned.edges.map(
      (e) => styleEdgeWithOverlay(e, slice.doneStageIds, slice.activeStageId, colors, cursorStandIns)
    ),
    [positioned.edges, slice, colors, cursorStandIns]
  );
  const [coneRevealed, setConeRevealed] = useState(false);
  useEffect(() => {
    if (!sliceCone) return;
    setConeRevealed(false);
    const raf = requestAnimationFrame(() => setConeRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, [sliceCone]);
  const conedNodes = useMemo(() => {
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
  }, [reactFlowNodes, sliceCone, coneRevealed]);
  const conedEdges = useMemo(() => {
    if (!sliceCone || sliceCone.size === 0) return reactFlowEdges;
    return reactFlowEdges.map((e) => {
      const inCone = sliceCone.has(e.source) && sliceCone.has(e.target);
      return inCone ? e : { ...e, style: { ...e.style, opacity: 0.12, transition: "opacity 260ms ease" } };
    });
  }, [reactFlowEdges, sliceCone]);
  const handleNodeClick = useCallback(
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
  const wrapperRef = useRef(null);
  const layoutKey = chartLayoutKey(positioned.nodes);
  const refitKey = JSON.stringify([
    chartLayoutKey(filteredGraph.nodes),
    chartTopologyKey(positioned.nodes),
    // A custom layout is an authored layout. Default measured-layout settling
    // must not take camera ownership back after a manual pan/zoom.
    layoutProp !== void 0 ? layoutKey : null
  ]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: wrapperRef,
      className,
      style: {
        // The one-word switch, applied to this chart's own root so a chart
        // mounted alone in a light app is light (see theme/mode.ts).
        ...themeModeVars(themeMode),
        width: "100%",
        height: "100%",
        minHeight: 300,
        display: "flex",
        flexDirection: "column",
        ...style
      },
      children: [
        breadcrumb.length > 1 && /* @__PURE__ */ jsx(
          SubflowBreadcrumbBar,
          {
            entries: breadcrumb,
            onNavigate: drill.setCurrentSubflowId
          }
        ),
        /* @__PURE__ */ jsx("div", { style: { flex: 1, minHeight: 0 }, children: /* @__PURE__ */ jsxs(
          ReactFlow,
          {
            nodes: conedNodes,
            edges: conedEdges,
            nodeTypes: mergedNodeTypes,
            edgeTypes: mergedEdgeTypes,
            onNodeClick: handleNodeClick,
            minZoom: 0.1,
            proOptions: { hideAttribution: true },
            children: [
              /* @__PURE__ */ jsx(ChartAutoRefit, { wrapperRef, refitKey, layoutKey, padding: 0.18 }),
              /* @__PURE__ */ jsx(MeasuredNodeSizes, { onSizes: setMeasuredSizes }),
              /* @__PURE__ */ jsx(Background, { variant: BackgroundVariant.Dots, gap: 20, size: 1 }),
              children
            ]
          }
        ) })
      ]
    }
  );
}

export { ChartAutoRefit, DEFAULT_NODE_H, DEFAULT_NODE_W, GROUP_CONTAINER_NODE_TYPE, GroupContainerNode, LoopBackEdge, MAIN_CHART_BOX_ID, SmartStepEdge, StageNode, TracedFlow, applyGroupLayout, chartLayoutKey, collapseTraceGraph, createDagreTraceLayout, createGroupedLayout, createMainChartBoxLayout, createSnappedDagreLayout, createTraceRuntimeOverlay, dagreTraceLayout, sizeOf, sliceOverlay, snapLinearSuccessors, wrapInMainChartBox };
//# sourceMappingURL=chunk-2SJLI2BH.js.map
//# sourceMappingURL=chunk-2SJLI2BH.js.map