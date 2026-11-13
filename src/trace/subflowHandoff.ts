/** Admit the engine's names-only output handoff without joining isolated logs. */
import { projectTraceInvocation } from "./projectTraceInvocation";
import {
  isPlainRecord, optionalOwnDataField, readName, readOwnArray, WorkBudget,
} from "./safeRecordRead";

interface Address {
  readonly logRunId: string;
  readonly drillPath: readonly string[];
}

/** A navigation target, never a foreign key inserted into the parent's read set. */
export interface SubflowHandoffSource {
  readonly key: string;
  readonly mountRuntimeStageId: string;
  readonly invocationPath: readonly string[];
  /** Exclusive position on the child's displayed history, without its seed bookend. */
  readonly beforeCommitIdx: number;
}

interface HandoffOptions {
  snapshot: unknown;
  invocationPath: readonly string[];
  mountRuntimeStageId: string;
  writtenKeys: readonly string[];
  /** Exclusive position on the parent's displayed history. */
  beforeCommitIdx: number;
}

const LIMIT = 4_096;
function record(value: unknown): Record<string, unknown> {
  if (!isPlainRecord(value)) throw new Error();
  return value;
}
const field = (value: unknown, key: string) => optionalOwnDataField(record(value), key);
function index(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error();
  return value;
}
function names(value: unknown, budget: WorkBudget, limit = LIMIT): string[] {
  const result = readOwnArray(value, budget).map(readName);
  if (result.length > limit || new Set(result).size !== result.length) throw new Error();
  return result;
}
function address(value: unknown, budget: WorkBudget): Address {
  const logRunId = readName(field(value, "logRunId"));
  const drillPath = names(field(value, "drillPath"), budget, 128);
  if (drillPath.join("").length > 8_192) throw new Error();
  return { logRunId, drillPath };
}
const samePath = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((part, at) => part === right[at]);
const sameAddress = (left: Address, right: Address) =>
  left.logRunId === right.logRunId && samePath(left.drillPath, right.drillPath);
function seedOffset(log: readonly unknown[], mount: string | undefined): number {
  if (!mount || !log.length) return 0;
  const id = field(log[0], "runtimeStageId");
  return id === "" || id === mount ? 1 : 0;
}
function paths(bundle: unknown, budget: WorkBudget): string[] {
  return readOwnArray(field(bundle, "trace"), budget).map(row => readName(field(row, "path")));
}

/**
 * Missing, partial or refused handoffs leave the existing unknown boundary intact.
 * Addresses, actual write rows and exact invocation ancestry must agree before a
 * mapper's conservative observed-read prefix becomes a followable child target.
 */
export function subflowHandoffSources(options: HandoffOptions): readonly SubflowHandoffSource[] {
  try {
    const budget = new WorkBudget();
    const { snapshot, invocationPath, mountRuntimeStageId, writtenKeys } = options;
    const mount = readName(mountRuntimeStageId);
    const results = field(snapshot, "subflowResults");
    const result = field(results, mount);
    const handoff = field(result, "outputHandoff");
    if (
      field(handoff, "version") !== 1 ||
      field(handoff, "attribution") !== "observed-read-prefix" ||
      field(handoff, "status") !== "captured" ||
      readOwnArray(field(handoff, "limitations"), budget).length !== 0
    ) return [];

    const context = invocationPath.length
      ? field(field(results, invocationPath[invocationPath.length - 1]), "treeContext")
      : snapshot;
    const parentAddress = address(field(context, "logAddress"), budget);
    if (!samePath(parentAddress.drillPath, invocationPath)) return [];
    const parentLog = readOwnArray(field(context, invocationPath.length ? "history" : "commitLog"), budget);
    const parent = field(handoff, "parent");
    const parentIdx = index(field(parent, "commitIdx"));
    const parentCutoff = index(options.beforeCommitIdx) + seedOffset(parentLog, invocationPath.at(-1));
    if (
      !sameAddress(address(field(parent, "address"), budget), parentAddress) ||
      field(parent, "runtimeStageId") !== mount ||
      parentIdx >= parentCutoff || parentIdx >= parentLog.length ||
      parentCutoff > parentLog.length || field(parentLog[parentIdx], "runtimeStageId") !== mount
    ) return [];
    const actualWrites = new Set(paths(parentLog[parentIdx], budget));
    const child = field(handoff, "child");
    const childAddress = address(field(child, "address"), budget);
    const childPath = [...invocationPath, mount];
    if (childAddress.logRunId !== parentAddress.logRunId || !samePath(childAddress.drillPath, childPath)) return [];
    const childContext = field(result, "treeContext");
    if (!sameAddress(address(field(childContext, "logAddress"), budget), childAddress)) return [];
    const childHistory = readOwnArray(field(childContext, "history"), budget);
    const rawCutoff = index(field(child, "beforeCommitIdx"));
    if (rawCutoff > childHistory.length) return [];
    const projected = projectTraceInvocation(snapshot, mount, { invocationPath: childPath });
    if (!projected.availability.ok) return [];
    const beforeCommitIdx = Math.max(0, rawCutoff - seedOffset(childHistory, mount));
    if (beforeCommitIdx > projected.commitLog.length) return [];

    const writes = readOwnArray(field(handoff, "writes"), budget);
    if (writes.length > LIMIT) return [];
    const selected = new Set(writtenKeys), seenWrites = new Set<string>(), reads = new Set<string>();
    for (const write of writes) {
      const path = readName(field(write, "path"));
      if (seenWrites.has(path) || !actualWrites.has(path)) return [];
      seenWrites.add(path);
      const keys = names(field(write, "reads"), budget);
      if (!selected.has(path)) continue;
      // A later write in this question's prefix supersedes this recorded handoff.
      for (let at = parentIdx + 1; at < parentCutoff; at++)
        if (paths(parentLog[at], budget).includes(path)) return [];
      for (const key of keys) reads.add(key);
      if (reads.size > LIMIT) return [];
    }
    const detachedPath = Object.freeze(childPath);
    return Object.freeze([...reads].map(key => Object.freeze({
      key, mountRuntimeStageId: mount, invocationPath: detachedPath, beforeCommitIdx,
    })));
  } catch {
    return [];
  }
}

export function handoffSentence(sources: readonly SubflowHandoffSource[]): string {
  return `Output mapping observed child reads: ${sources.map(source => `\`${source.key}\` in ${source.mountRuntimeStageId}`).join(", ")}. This conservative prefix may include reads used by other outputs.`;
}
