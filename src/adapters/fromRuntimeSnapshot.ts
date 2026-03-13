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
 * Matches CombinedNarrativeEntry from footprintjs (defined here to avoid hard dep).
 * Pass from FlowChartExecutor.getNarrativeEntries().
 */
export interface NarrativeEntry {
  type: 'stage' | 'step' | 'condition' | 'fork' | 'subflow' | 'loop' | 'break' | 'error';
  text: string;
  depth: number;
  stageName?: string;
  stepNumber?: number;
}

/**
 * Converts a FootPrint RuntimeSnapshot into a flat array of StageSnapshots
 * suitable for visualization components.
 *
 * The `narrativeEntries` parameter (from `executor.getNarrativeEntries()`)
 * distributes the library's rich combined narrative per-stage.
 * When narrative is not enabled, stages get "Narrative not available" —
 * this adapter reflects what the library produces, nothing more.
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
export function toVisualizationSnapshots(
  runtime: RuntimeSnapshot,
  narrativeEntries?: NarrativeEntry[],
): StageSnapshot[] {
  const stageNarrativeMap = narrativeEntries?.length
    ? buildStageNarrativeMap(narrativeEntries)
    : new Map<string, string[]>();

  const snapshots: StageSnapshot[] = [];
  flattenTree(runtime.executionTree, snapshots, runtime.sharedState, 0, runtime.subflowResults, {}, stageNarrativeMap);
  return snapshots;
}

/**
 * Groups narrative entries by stage name, preserving non-stage entries
 * (conditions, forks) attached to the preceding stage.
 */
function buildStageNarrativeMap(entries: NarrativeEntry[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  let currentStageName: string | undefined;

  for (const entry of entries) {
    if (entry.stageName) {
      currentStageName = entry.stageName;
    }

    if (currentStageName) {
      if (!map.has(currentStageName)) {
        map.set(currentStageName, []);
      }
      const indent = '  '.repeat(entry.depth);
      map.get(currentStageName)!.push(`${indent}${entry.text}`);
    }
  }

  return map;
}

function flattenTree(
  node: RuntimeStageSnapshot,
  out: StageSnapshot[],
  sharedState: Record<string, unknown>,
  accumulatedMs: number = 0,
  subflowResults?: Record<string, unknown>,
  cumulativeMemory: Record<string, unknown> = {},
  stageNarrativeMap: Map<string, string[]> = new Map(),
): number {
  const durationMs =
    typeof node.metrics?.durationMs === "number"
      ? node.metrics.durationMs
      : 1;

  const startMs = accumulatedMs;
  const stageId = node.name || node.id;

  // Narrative comes from the library — no fallback fabrication
  const stageLines = stageNarrativeMap.get(stageId);
  const narrative = stageLines
    ? stageLines.join('\n')
    : 'Narrative not part of this run.';

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
      const childEnd = flattenTree(child, out, sharedState, nextMs, subflowResults, memory, stageNarrativeMap);
      maxChildEnd = Math.max(maxChildEnd, childEnd);
    }
    nextMs = maxChildEnd;
  }

  // Handle linear continuation
  if (node.next) {
    nextMs = flattenTree(node.next, out, sharedState, nextMs, subflowResults, memory, stageNarrativeMap);
  }

  return nextMs;
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
