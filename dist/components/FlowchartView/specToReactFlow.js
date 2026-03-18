import { defaultTokens } from "../../theme/tokens";
/** Default colors derived from theme tokens. Consumer can override per-call. */
const DEFAULT_COLORS = {
    edgeDefault: defaultTokens.colors.textMuted,
    edgeExecuted: defaultTokens.colors.success,
    edgeActive: defaultTokens.colors.primary,
    edgeLoop: defaultTokens.colors.warning,
    labelDefault: defaultTokens.colors.textSecondary,
    labelExecuted: defaultTokens.colors.success,
    labelLoop: defaultTokens.colors.warning,
    pathGlow: `${defaultTokens.colors.success}4D`, // ~30% opacity hex
};
const Y_STEP = 100;
const X_SPREAD = 200;
function nid(n) {
    return n.name || n.id || `spec-${Math.random()}`;
}
function addEdge(state, source, target, label, isLoop) {
    state.edgeCounter++;
    const o = state.overlay;
    const c = state.colors;
    const executed = o && o.executedStages.has(source) && o.executedStages.has(target);
    const isLeadingEdge = o && source === o.activeStage && !o.doneStages.has(target);
    // Loop edges — route via right-side handles so they don't overlap center edges
    // Only mark as executed when the loop has actually fired:
    // the target must appear AFTER the source in executionOrder
    if (isLoop) {
        let loopExecuted = false;
        if (o?.executionOrder) {
            const lastSourceIdx = o.executionOrder.lastIndexOf(source);
            if (lastSourceIdx >= 0) {
                loopExecuted = o.executionOrder.slice(lastSourceIdx + 1).includes(target);
            }
        }
        state.edges.push({
            id: `se${state.edgeCounter}`,
            source,
            target,
            sourceHandle: "loop-source",
            targetHandle: "loop-target",
            label: label ?? "loop",
            type: "smoothstep",
            pathOptions: { offset: 40, borderRadius: 16 },
            style: {
                stroke: c.edgeLoop,
                strokeWidth: loopExecuted ? 3 : 2,
                strokeDasharray: "6 3",
                opacity: o && !loopExecuted ? 0.35 : 1,
            },
            labelStyle: { fontSize: 10, fontWeight: 700, fill: c.labelLoop },
            animated: loopExecuted,
            zIndex: 2,
        });
        return;
    }
    if (executed) {
        // "Google Maps route" — thick glowing path for executed edges
        // Background glow layer (subtle, behind the route line)
        state.edges.push({
            id: `se${state.edgeCounter}-glow`,
            source,
            target,
            style: {
                stroke: c.pathGlow,
                strokeWidth: 8,
                opacity: 0.4,
            },
            zIndex: 0,
            selectable: false,
            focusable: false,
        });
        // Foreground path (solid route line)
        state.edges.push({
            id: `se${state.edgeCounter}`,
            source,
            target,
            label,
            style: {
                stroke: isLeadingEdge ? c.edgeActive : c.edgeExecuted,
                strokeWidth: 3.5,
            },
            labelStyle: { fontSize: 10, fontWeight: 600, fill: c.labelExecuted },
            animated: !!isLeadingEdge,
            zIndex: 1,
        });
    }
    else {
        // Non-executed — thin, faded base map edge
        state.edges.push({
            id: `se${state.edgeCounter}`,
            source,
            target,
            label,
            style: {
                stroke: c.edgeDefault,
                strokeWidth: 1.5,
                opacity: o ? 0.3 : 1,
            },
            labelStyle: { fontSize: 10, fill: c.labelDefault },
        });
    }
}
function walk(node, state, x, y) {
    const id = nid(node);
    if (state.seen.has(id)) {
        return { lastIds: [id], bottomY: y };
    }
    state.seen.add(id);
    const isDecider = node.type === "decider" || node.hasDecider;
    const isFork = node.type === "fork";
    const o = state.overlay;
    const isDone = o ? o.doneStages.has(id) : false;
    const isActive = o ? o.activeStage === id : false;
    const wasExecuted = o ? o.executedStages.has(id) : false;
    // When overlay is present, dim unvisited nodes
    const dimmed = o && !wasExecuted;
    // Step numbers for executed nodes (1-based) — multiple when revisited via loops
    let stepNumbers;
    if (o?.executionOrder) {
        const nums = [];
        for (let i = 0; i < o.executionOrder.length; i++) {
            if (o.executionOrder[i] === id)
                nums.push(i + 1);
        }
        if (nums.length > 0)
            stepNumbers = nums;
    }
    state.nodes.push({
        id,
        position: { x, y },
        data: {
            label: node.name,
            active: isActive,
            done: isDone,
            error: false,
            isDecider,
            isFork,
            description: node.description,
            subflowId: node.subflowId,
            dimmed,
            stepNumbers,
            isSubflow: !!node.isSubflowRoot,
        },
        type: "stage",
        style: dimmed ? { opacity: 0.35 } : undefined,
    });
    let lastIds = [id];
    let bottomY = y;
    // Handle children (fork/decider branches)
    if (node.children && node.children.length > 0) {
        const totalWidth = (node.children.length - 1) * X_SPREAD;
        const startX = x - totalWidth / 2;
        const childY = y + Y_STEP;
        const childResults = [];
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            const childX = startX + i * X_SPREAD;
            const edgeLabel = node.branchIds?.[i];
            addEdge(state, id, nid(child), edgeLabel);
            const result = walk(child, state, childX, childY);
            childResults.push(result);
        }
        lastIds = childResults.flatMap((r) => r.lastIds);
        bottomY = Math.max(...childResults.map((r) => r.bottomY));
    }
    // Handle loop-back edge — visually distinct dashed orange arrow
    // Must be added before processing `next`, since `next` returns early
    if (node.loopTarget) {
        addEdge(state, id, node.loopTarget, "loop", true);
    }
    // Handle linear continuation
    if (node.next) {
        const nextY = bottomY + Y_STEP;
        const nextId = nid(node.next);
        for (const lid of lastIds) {
            // Skip forward edge when a loop edge already connects to the same target
            if (node.loopTarget && lid === id && node.loopTarget === nextId)
                continue;
            addEdge(state, lid, nextId);
        }
        const result = walk(node.next, state, x, nextY);
        return result;
    }
    return { lastIds, bottomY };
}
/**
 * Convert a pipeline spec to ReactFlow graph.
 * Pass `overlay` to color nodes/edges by execution state.
 */
export function specToReactFlow(spec, overlay, colors) {
    const state = {
        nodes: [],
        edges: [],
        edgeCounter: 0,
        seen: new Set(),
        overlay: overlay ?? null,
        colors: { ...DEFAULT_COLORS, ...colors },
    };
    walk(spec, state, 300, 0);
    return { nodes: state.nodes, edges: state.edges };
}
//# sourceMappingURL=specToReactFlow.js.map