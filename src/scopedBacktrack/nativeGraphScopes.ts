import type { CommitBundle, LogAddress, TimeTravelSource } from "foottrace";
import type { RecordScope, RecordSubflowMount, RecordFanoutCollection } from "foottrace/cause";
import { stageReadKeys } from "../trace/readProvenance";
import { rootMountLabels } from "../trace/traceScope";
import { isPlainRecord, optionalOwnDataField as field, readName, readOwnArray, TraceAdmissionError, WorkBudget } from "../trace/safeRecordRead";

export const samePath = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((part, index) => part === b[index]);

function addressOf(raw: unknown): LogAddress | undefined {
  try {
    if (!isPlainRecord(raw)) return undefined;
    const path = readOwnArray(field(raw, "drillPath"), new WorkBudget(128)).map(readName);
    return Object.freeze({ logRunId: readName(field(raw, "logRunId")), drillPath: Object.freeze(path) });
  } catch { return undefined; }
}

function sameAddress(raw: unknown, address: LogAddress) {
  const candidate = addressOf(raw);
  return candidate?.logRunId === address.logRunId && samePath(candidate.drillPath, address.drillPath);
}

const baseLimits = ["tracked-state-only", "final-attempt-views", "child-scopes-not-attested", "storage-not-attested"];

/** Restrict observations to their own segment. Future versions and a root note
 * copied onto a child carry no coverage assertion here. */
function rootNote(raw: unknown, address: LogAddress, length: number, runId: unknown) {
  if (!isPlainRecord(raw) || address.drillPath.length) return undefined;
  const version = field(raw, "version"), interval = field(raw, "commits");
  const from = field(interval, "from"), to = field(interval, "to");
  if ((version !== 1 && version !== 2) || field(raw, "scope") !== "root-log" ||
      field(raw, "runId") !== runId || runId !== address.logRunId ||
      !sameAddress(field(raw, "logAddress"), address) || field(raw, "persistence") !== "memory-only" ||
      from !== 0 || to !== length) return undefined;
  return raw;
}

function completedReads(note: unknown) {
  if (!note) return false;
  const version = field(note, "version"), modes = field(note, "modes"), channels = field(note, "channels");
  const limits = field(note, "limitations"), expected = version === 1 ? [...baseLimits, "read-sources-not-collected"] : baseLimits;
  const statuses = ["captured", "disabled", "partial", "failed", "unknown"];
  return field(field(note, "boundary"), "status") === "completed" &&
    field(modes, "readTracking") === "full" && field(modes, "writeProvenance") === "reads-prefix" &&
    ["full", "summary"].includes(field(modes, "writeTracking") as string) &&
    ["full", "delta"].includes(field(modes, "commitValues") as string) &&
    field(channels, "reads") === "captured" && field(channels, "writes") === "captured" &&
    statuses.includes(field(channels, "attention") as string) && statuses.includes(field(channels, "control") as string) &&
    (version === 1 ? field(channels, "readSources") === "not-collected" : statuses.includes(field(channels, "readSources") as string)) &&
    Array.isArray(limits) && sameMembers(readOwnArray(limits, new WorkBudget(32)), expected);
}

function sameMembers(actual: readonly unknown[], expected: readonly string[]) {
  return actual.length === expected.length && expected.every(item => actual.includes(item));
}

/** The cause reader owns occurrence/attempt admission. Bind its input to the
 * producer's own root-scoped ownership witness and matching full segment. */
function rootSources(raw: unknown, address: LogAddress, length: number): RecordScope["readSources"] {
  if (!raw || address.drillPath.length) return undefined;
  const owner = field(raw, "ownership"), record = field(raw, "record");
  if (field(raw, "version") !== 2 || field(owner, "version") !== 1 ||
      field(owner, "segment") !== 1 || field(record, "segment") !== 1 ||
      field(owner, "status") !== "captured" || !sameAddress(field(owner, "logAddress"), address) ||
      ![owner, raw].every(value => field(value, "runId") === address.logRunId &&
        field(field(value, "commits"), "from") === 0 && field(field(value, "commits"), "to") === length)) return undefined;
  const executions = field(owner, "executions");
  if (!Array.isArray(executions) || !isPlainRecord(record) ||
      !sameAddress(field(record, "address"), address) || field(raw, "persistence") !== "memory-only" ||
      (field(raw, "status") !== "captured" && field(raw, "status") !== "partial")) return undefined;
  return { record, executions } as unknown as NonNullable<RecordScope["readSources"]>;
}

/** A partial native mapper always retains at least one reason. Foottrace also
 * accepts other hosts' partial descriptors; only pass this producer's form. */
function nativeHandoff(raw: unknown) {
  return field(raw, "status") === "partial" && field(field(raw, "limitations"), "length") === 0
    ? undefined : raw;
}

export interface NativeScope {
  readonly record: RecordScope;
  readonly source: TimeTravelSource;
  readonly log: CommitBundle[];
  readonly mounts: ReadonlyMap<string, unknown>;
  readonly missingChildren: ReadonlySet<string>;
  readonly coveredReads: boolean;
  readonly prefixesOff: boolean;
  readonly gaps: readonly string[];
  readonly nestedReadTracking: boolean;
}

/** Only exact, recorded invocation stamps from this scope's own execution tree
 * can open a child. The engine also saves aliases under static names. */
export function nativeGraphScopes(snapshot: unknown) {
  const root = addressOf(field(snapshot, "logAddress"));
  if (!root || root.drillPath.length) return undefined;
  const results = field(snapshot, "subflowResults"), scopes = new Map<string, NativeScope>();
  const budget = new WorkBudget();
  function visit(raw: unknown, address: LogAddress, closedChild = false) {
    budget.spend(1);
    if (scopes.size >= 256 || address.drillPath.length > 64) throw new TraceAdmissionError("too-large", scopes.size + 1);
    const child = address.drillPath.length > 0;
    const log = readOwnArray(field(raw, child ? "history" : "commitLog"), budget);
    const tree = field(raw, child ? "stageContexts" : "executionTree");
    const mountLabels = rootMountLabels(tree);
    if (log.length > 4096) throw new TraceAdmissionError("too-large", log.length);
    if (!mountLabels.availability.ok) throw new Error("unavailable scope");
    const mountRecords: RecordSubflowMount[] = [], mounts = new Map<string, unknown>(), missing = new Set<string>();
    const children: { raw: unknown; address: LogAddress; complete: boolean }[] = [];
    for (const id of mountLabels.labels.keys()) {
      const result = field(results, id), context = field(result, "treeContext");
      const childAddress = addressOf(field(context, "logAddress"));
      mounts.set(id, result);
      if (!childAddress || !Array.isArray(field(context, "history")) ||
          childAddress.logRunId !== root!.logRunId || !samePath(childAddress.drillPath, [...address.drillPath, id])) {
        missing.add(id);
        continue;
      }
      const input = nativeHandoff(field(result, "inputHandoff")), output = nativeHandoff(field(result, "outputHandoff"));
      // Foottrace validates the complete native descriptors and both endpoint logs.
      mountRecords.push({ runtimeStageId: id, child: childAddress,
        ...(input !== undefined && { inputHandoff: input as RecordSubflowMount["inputHandoff"] }),
        ...(output !== undefined && { outputHandoff: output as RecordSubflowMount["outputHandoff"] }),
      });
      // A completed output mapping pins the child prefix. A currently running
      // child has no completed handoff, and cannot cross on the strength of length.
      const cut = field(output, "child");
      children.push({ raw: context, address: childAddress, complete:
        sameAddress(field(cut, "address"), childAddress) &&
        field(cut, "beforeCommitIdx") === field(field(context, "history"), "length") });
    }
    const inventory = field(raw, "fanoutCollections");
    const validInventory = field(inventory, "version") === 1 &&
      (field(inventory, "status") === "captured" || field(inventory, "status") === "partial");
    const collections = validInventory ? readOwnArray(field(inventory, "collections"), budget) : [];
    const source = { commitLog: log, executionTree: tree, initialState: field(raw, "initialState") as TimeTravelSource["initialState"] };
    const note = rootNote(field(raw, "capture"), address, log.length, field(raw, "runId"));
    const coveredReads = completedReads(note) && rootMountLabels(tree, log).availability.ok;
    const observations = field(raw, "readSources"), sources = rootSources(observations, address, log.length);
    const gaps = new Set<string>();
    if (inventory !== undefined && !validInventory) gaps.add("collection-unknown");
    const owner = field(observations, "ownership");
    const boundObservation = field(observations, "version") === 2 && field(owner, "version") === 1 &&
      sameAddress(field(owner, "logAddress"), address) &&
      [owner, observations].every(part => field(part, "runId") === address.logRunId &&
        field(field(part, "commits"), "from") === 0 && field(field(part, "commits"), "to") === log.length)
        ? observations : undefined;
    const status = field(boundObservation, "status"), channels = field(note, "channels");
    const readChannel = field(channels, "reads"), writeChannel = field(channels, "writes");
    const sourceChannel = field(channels, "readSources");
    if (readChannel === "disabled") gaps.add("reads-off");
    if (writeChannel === "disabled") gaps.add("writes-off");
    if (sourceChannel === "disabled" || status === "disabled") gaps.add("sources-off");
    if (readChannel === "failed") gaps.add("failed");
    if (readChannel === "partial") gaps.add("reads-partial");
    if (writeChannel === "failed") gaps.add("writes-failed");
    if (writeChannel === "partial") gaps.add("writes-partial");
    if (sourceChannel === "failed" || status === "failed") gaps.add("sources-failed");
    else if (sourceChannel === "partial" || status === "partial") gaps.add("partial");
    if (observations && !sources && !child && status !== "disabled") gaps.add("collection-unknown");
    for (const observation of [note, boundObservation]) {
      const limits = field(observation, "limitations");
      if (!Array.isArray(limits)) continue;
      for (const reason of readOwnArray(limits, budget)) {
        if (["privacy-active", "redaction-active", "redacted-export", "redacted-source-export"].includes(reason as string)) gaps.add("redacted");
        if (["source-capture-failed", "read-retention-failed", "commit-retention-failed"].includes(reason as string)) gaps.add("failed");
        if (reason === "budget-exhausted") gaps.add("budget");
      }
    }
    scopes.set(JSON.stringify(address.drillPath), {
      source, log: log as CommitBundle[], mounts, missingChildren: missing, coveredReads,
      prefixesOff: (field(raw, "writeProvenance") ?? field(field(note, "modes"), "writeProvenance")) === "off", gaps: [...gaps],
      nestedReadTracking: field(raw, "nestedReadTracking") === true,
      record: { address, commitLog: log, initialState: source.initialState,
        reads: Object.fromEntries(stageReadKeys(tree, budget)), complete: coveredReads || closedChild,
        subflows: { version: 1, status: "partial", mounts: mountRecords, collections: collections as RecordFanoutCollection[] },
        ...(sources && { readSources: sources }),
      },
    });
    for (const next of children) visit(next.raw, next.address, next.complete);
  }
  visit(snapshot, root);
  return scopes;
}
