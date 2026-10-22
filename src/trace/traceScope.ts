/** Scope admission only. Existing dataTrace / traceWalk own traversal. */
import {
  ownDataField,
  optionalOwnDataField,
  isPlainRecord,
  readName,
  readOwnArray,
  WorkBudget,
  TraceAdmissionError,
  classifyAdmissionFailure,
} from "./safeRecordRead";
export type TraceAvailability =
  | { ok: true }
  | {
      ok: false;
      reason: "no-history" | "malformed" | "too-large";
      items?: number;
    };
export interface TraceScope {
  invocationPath: readonly string[];
  commitLog: unknown[];
  executionTree: unknown;
  availability: TraceAvailability;
  readsAvailable: boolean;
  mountLabels: ReadonlyMap<string, string>;
}
/** The run-wide dial is inherited by children. Empty/missing per-step reads are normal. */
export function runHasRecordedReads(
  snapshot: unknown,
  additionalResults: unknown[] = []
): boolean {
  try {
    const budget = new WorkBudget();
    const seen = new Set<unknown>();
    const queue = [ownDataField(snapshot, "executionTree")];
    for (const result of additionalResults)
      queue.push(
        ownDataField(ownDataField(result, "treeContext"), "stageContexts")
      );
    const results = ownDataField(snapshot, "subflowResults");
    if (isPlainRecord(results))
      for (const key of Object.keys(results)) {
        budget.spend(1);
        queue.push(
          ownDataField(
            ownDataField(ownDataField(results, key), "treeContext"),
            "stageContexts"
          )
        );
      }
    for (let index = 0; index < queue.length; index++) {
      budget.spend(1);
      const node = queue[index];
      if (!isPlainRecord(node) || seen.has(node)) continue;
      seen.add(node);
      const reads = ownDataField(node, "stageReads");
      if (isPlainRecord(reads) && Object.keys(reads).length > 0) return true;
      const next = ownDataField(node, "next");
      if (next) queue.push(next);
      const children = ownDataField(node, "children");
      if (children !== undefined) queue.push(...readOwnArray(children, budget));
    }
  } catch {
    /* Unknown coverage stays conservative. */
  }
  return false;
}
/** Stable public run identity where supplied; old recordings stay object-scoped. */
export function sourceRunKey(snapshot: unknown): unknown {
  try {
    const id = ownDataField(snapshot, "runId");
    return typeof id === "string" && id.length > 0 ? id : snapshot;
  } catch {
    return snapshot;
  }
}
export function childTraceScope(
  result: unknown,
  invocationPath: readonly string[],
  readsAvailable?: boolean
): TraceScope {
  const unavailable = (
    reason: "no-history" | "malformed" | "too-large",
    items?: number
  ): TraceScope => ({
    invocationPath,
    commitLog: [],
    executionTree: undefined,
    availability: {
      ok: false,
      reason,
      ...(items === undefined ? {} : { items }),
    },
    readsAvailable: readsAvailable ?? false,
    mountLabels: new Map(),
  });
  try {
    const budget = new WorkBudget();
    if (
      invocationPath.length === 0 ||
      invocationPath.length > 128 ||
      invocationPath.some(
        (part) =>
          typeof part !== "string" || part.length === 0 || part.length > 4_096
      ) ||
      invocationPath.join("").length > 8_192
    )
      return unavailable("malformed");
    const context = ownDataField(result, "treeContext");
    const rawHistory = ownDataField(context, "history");
    if (rawHistory === undefined) return unavailable("no-history");
    const history = readOwnArray(rawHistory, budget);
    if (history.length === 0) return unavailable("no-history");
    const mountInvocation = invocationPath[invocationPath.length - 1];
    const recordedCommits = history.map((entry, index) => {
      const runtimeStageId = ownDataField(entry, "runtimeStageId");
      // Through 9.33 the first input mapper bundle used an empty stamp.
      if (
        index === 0 &&
        (runtimeStageId === "" || runtimeStageId === mountInvocation)
      )
        return null;
      return {
        stage: readName(ownDataField(entry, "stage")),
        stageId: readName(ownDataField(entry, "stageId")),
        runtimeStageId: readName(runtimeStageId),
        trace: readOwnArray(ownDataField(entry, "trace"), budget).map(
          (write) => ({ path: readName(ownDataField(write, "path")) })
        ),
      };
    });
    type TraceNode = {
      runtimeStageId: string;
      stageReads?: Record<string, boolean>;
      next?: TraceNode;
      children?: TraceNode[];
    };
    const executionTree = {} as TraceNode;
    const queue: Array<[unknown, TraceNode]> = [
      [ownDataField(context, "stageContexts"), executionTree],
    ];
    const seen = new Set<unknown>();
    const runtimeIds = new Set<string>();
    const mountLabels = new Map<string, string>();
    let ownReads = false;
    for (let index = 0; index < queue.length; index++) {
      budget.spend(1);
      const [node, target] = queue[index];
      if (!isPlainRecord(node) || seen.has(node))
        return unavailable("malformed");
      seen.add(node);
      target.runtimeStageId = readName(ownDataField(node, "runtimeStageId"));
      if (runtimeIds.has(target.runtimeStageId))
        return unavailable("malformed");
      runtimeIds.add(target.runtimeStageId);
      const readDescriptor = Object.getOwnPropertyDescriptor(
        node,
        "stageReads"
      );
      if (readDescriptor && !("value" in readDescriptor))
        return unavailable("malformed");
      const reads = ownDataField(node, "stageReads");
      if (reads !== undefined && !isPlainRecord(reads))
        return unavailable("malformed");
      if (isPlainRecord(reads)) {
        const keys = Object.keys(reads);
        budget.spend(keys.length);
        if (keys.some((key) => key.length > 4_096))
          return unavailable("malformed");
        target.stageReads = Object.fromEntries(keys.map((key) => [key, true]));
        ownReads ||= keys.length > 0;
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
      if (next !== undefined && next !== null) {
        target.next = {} as TraceNode;
        queue.push([next, target.next]);
      }
      const children = ownDataField(node, "children");
      if (children !== undefined)
        target.children = readOwnArray(children, budget).map((child) => {
          const projected = {} as TraceNode;
          queue.push([child, projected]);
          return projected;
        });
    }
    const commitLog = recordedCommits.filter(
      (entry): entry is NonNullable<typeof entry> => entry !== null
    );
    if (commitLog.some((entry) => !runtimeIds.has(entry.runtimeStageId)))
      return unavailable("malformed");
    return {
      invocationPath,
      commitLog,
      executionTree,
      availability: { ok: true },
      readsAvailable: readsAvailable ?? ownReads,
      mountLabels,
    };
  } catch (error) {
    const failure = classifyAdmissionFailure(error);
    return unavailable(failure.reason, failure.items);
  }
}
export function rootMountLabels(
  tree: unknown,
  commitLog?: unknown[]
): {
  labels: ReadonlyMap<string, string>;
  availability: TraceAvailability;
  hasTree: boolean;
} {
  const labels = new Map<string, string>();
  const budget = new WorkBudget();
  const seen = new Set<unknown>();
  const queue: unknown[] = tree === undefined || tree === null ? [] : [tree];
  const runtimeIds = new Set<string>();
  try {
    for (let i = 0; i < queue.length; i++) {
      budget.spend(1);
      const node = queue[i];
      if (!isPlainRecord(node)) throw new TraceAdmissionError("malformed");
      if (seen.has(node)) throw new TraceAdmissionError("malformed");
      seen.add(node);
      const id = optionalOwnDataField(node, "runtimeStageId");
      if (typeof id === "string" && id.length > 0) {
        if (runtimeIds.has(id)) throw new TraceAdmissionError("malformed");
        runtimeIds.add(id);
      }
      const mount = optionalOwnDataField(node, "subflowId");
      const name = optionalOwnDataField(node, "name");
      if (
        typeof id === "string" &&
        typeof mount === "string" &&
        mount.length > 0
      )
        labels.set(
          readName(id),
          readName(typeof name === "string" && name.length > 0 ? name : mount)
        );
      const next = optionalOwnDataField(node, "next");
      if (next !== undefined && next !== null) queue.push(next);
      const children = optionalOwnDataField(node, "children");
      if (children !== undefined)
        for (const child of readOwnArray(children, budget)) queue.push(child);
    }
    if (commitLog !== undefined) {
      for (const [index, entry] of readOwnArray(commitLog, budget).entries()) {
        const id = optionalOwnDataField(entry, "runtimeStageId");
        // A legacy first mapper stamp is an input boundary, not a step.
        if (index === 0 && id === "") continue;
        if (typeof id !== "string" || !runtimeIds.has(id))
          throw new TraceAdmissionError("malformed");
      }
    }
    return { labels, availability: { ok: true }, hasTree: runtimeIds.size > 0 };
  } catch (error) {
    // No partial map can turn a mount omitted by admission into an origin.
    return {
      labels: new Map(),
      hasTree: false,
      availability: { ok: false, ...classifyAdmissionFailure(error) },
    };
  }
}
