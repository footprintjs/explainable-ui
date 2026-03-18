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
export declare function toVisualizationSnapshots(runtime: RuntimeSnapshot): StageSnapshot[];
/**
 * Creates StageSnapshots from simple arrays (when you don't have a RuntimeSnapshot).
 * Useful for testing or custom data sources.
 */
export declare function createSnapshots(stages: Array<{
    name: string;
    label?: string;
    memory?: Record<string, unknown>;
    narrative?: string;
    durationMs?: number;
    description?: string;
    subflowId?: string;
}>): StageSnapshot[];
export {};
//# sourceMappingURL=fromRuntimeSnapshot.d.ts.map