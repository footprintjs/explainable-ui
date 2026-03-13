import type { StageSnapshot } from "../types";

/**
 * Shape of FootPrint's RuntimeSnapshot (from FlowChartExecutor.getSnapshot()).
 * We define it here instead of importing to avoid a hard dependency on footprintjs.
 */
interface RuntimeStageSnapshot {
  id: string;
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

interface RuntimeSnapshot {
  sharedState: Record<string, unknown>;
  executionTree: RuntimeStageSnapshot;
  commitLog: unknown[];
  /** Per-subflow execution results (keyed by subflowId). */
  subflowResults?: Record<string, unknown>;
}

/**
 * Converts a FootPrint RuntimeSnapshot into a flat array of StageSnapshots
 * suitable for visualization components.
 *
 * Usage:
 * ```ts
 * const executor = new FlowChartExecutor(chart);
 * await executor.run();
 * const snapshots = toVisualizationSnapshots(executor.getSnapshot());
 * ```
 */
export function toVisualizationSnapshots(
  runtime: RuntimeSnapshot
): StageSnapshot[] {
  const snapshots: StageSnapshot[] = [];
  flattenTree(runtime.executionTree, snapshots, runtime.sharedState, 0, runtime.subflowResults, {});
  return snapshots;
}

function flattenTree(
  node: RuntimeStageSnapshot,
  out: StageSnapshot[],
  sharedState: Record<string, unknown>,
  accumulatedMs: number = 0,
  subflowResults?: Record<string, unknown>,
  cumulativeMemory: Record<string, unknown> = {},
): number {
  // Estimate duration from metrics if available
  const durationMs =
    typeof node.metrics?.durationMs === "number"
      ? node.metrics.durationMs
      : 1;

  const startMs = accumulatedMs;

  // Build narrative from stage writes (actual memory mutations)
  const narrative = buildNarrative(node);

  // Build cumulative memory from stageWrites (actual setValue/updateValue calls)
  const memory = { ...cumulativeMemory };
  if (node.stageWrites) {
    for (const [key, value] of Object.entries(node.stageWrites)) {
      if (value === undefined) {
        delete memory[key];
      } else {
        memory[key] = value;
      }
    }
  }

  // Attach subflow result from the proper channel (not from logs)
  const stageId = node.name || node.id;
  const sfResult = subflowResults?.[node.subflowId ?? stageId];

  out.push({
    stageName: stageId,
    stageLabel: stageId,
    memory,
    narrative,
    startMs,
    durationMs,
    status: "done",
    ...(node.description ? { description: node.description } : undefined),
    ...(node.subflowId ? { subflowId: node.subflowId } : undefined),
    ...(sfResult ? { subflowResult: sfResult } : undefined),
  });

  let nextMs = startMs + durationMs;

  // Handle parallel children (fork)
  if (node.children && node.children.length > 0) {
    let maxChildEnd = nextMs;
    for (const child of node.children) {
      const childEnd = flattenTree(child, out, sharedState, nextMs, subflowResults, memory);
      maxChildEnd = Math.max(maxChildEnd, childEnd);
    }
    nextMs = maxChildEnd;
  }

  // Handle linear continuation
  if (node.next) {
    nextMs = flattenTree(node.next, out, sharedState, nextMs, subflowResults, memory);
  }

  return nextMs;
}

function buildNarrative(node: RuntimeStageSnapshot): string {
  const parts: string[] = [];

  if (node.name) {
    parts.push(`Stage "${node.name}" executed.`);
  }

  // Report actual memory writes (stageWrites) instead of diagnostic logs
  if (node.stageWrites && Object.keys(node.stageWrites).length > 0) {
    const keys = Object.keys(node.stageWrites);
    parts.push(`Wrote ${keys.length} key(s): ${keys.join(", ")}.`);
  }

  if (node.errors && Object.keys(node.errors).length > 0) {
    parts.push(`Errors: ${JSON.stringify(node.errors)}`);
  }

  if (node.isFork) {
    parts.push(
      `Forked into ${node.children?.length ?? 0} parallel branch(es).`
    );
  }

  return parts.join(" ") || `Stage ${node.id} completed.`;
}

/**
 * Creates StageSnapshots from simple arrays (when you don't have a RuntimeSnapshot).
 * Useful for testing or custom data sources.
 */
export function createSnapshots(
  stages: Array<{
    name: string;
    label?: string;
    memory?: Record<string, unknown>;
    narrative?: string;
    durationMs?: number;
    description?: string;
    subflowId?: string;
  }>
): StageSnapshot[] {
  let accMs = 0;
  return stages.map((s) => {
    const duration = s.durationMs ?? 1;
    const snap: StageSnapshot = {
      stageName: s.name,
      stageLabel: s.label ?? s.name,
      memory: s.memory ?? {},
      narrative: s.narrative ?? `${s.label ?? s.name} completed.`,
      startMs: accMs,
      durationMs: duration,
      status: "done",
      ...(s.description ? { description: s.description } : undefined),
      ...(s.subflowId ? { subflowId: s.subflowId } : undefined),
    };
    accMs += duration;
    return snap;
  });
}
