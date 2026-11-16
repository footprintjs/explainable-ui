/** Names-only read evidence. Canonical paths stay opaque: no dot/prefix aliases. */
import { isPlainRecord, optionalOwnDataField, readName, readOwnArray, WorkBudget } from "./safeRecordRead";

export interface RecordedTraceWrite {
  path: string;
  /** Absent is legacy stage attribution; [] is a captured empty read prefix. */
  readKeys?: string[];
}

export function readTraceWrites(value: unknown, budget: WorkBudget, allowMissing = false): RecordedTraceWrite[] {
  if (value === undefined && allowMissing) return [];
  return readOwnArray(value, budget).map(write => {
    const path = readName(optionalOwnDataField(write, "path"));
    const reads = optionalOwnDataField(write, "readKeys");
    return { path, ...(reads === undefined ? {} : {
      readKeys: [...new Set(readOwnArray(reads, budget).map(readName))],
    }) };
  });
}

/** Only keys are inspected; recorded values/accessors are never evaluated. */
export function stageReadKeys(tree: unknown, budget: WorkBudget): Map<string, string[]> {
  const byStep = new Map<string, string[]>();
  const visited = new Set<unknown>();
  const stack: unknown[] = tree === undefined || tree === null ? [] : [tree];
  while (stack.length) {
    budget.spend(1);
    const node = stack.pop();
    if (!node || typeof node !== "object" || visited.has(node)) continue;
    visited.add(node);
    const id = optionalOwnDataField(node, "runtimeStageId");
    const reads = optionalOwnDataField(node, "stageReads");
    if (reads !== undefined && !isPlainRecord(reads)) throw new Error("Unavailable read evidence");
    if (typeof id === "string" && id.length && reads !== undefined) {
      const keys = Object.keys(reads as object); budget.spend(keys.length);
      if (keys.length) byStep.set(readName(id), keys.map(readName));
    }
    const next = optionalOwnDataField(node, "next");
    if (next !== undefined && next !== null) stack.push(next);
    const children = optionalOwnDataField(node, "children");
    if (children !== undefined) stack.push(...readOwnArray(children, budget));
  }
  return byStep;
}

/** Reads observed before the selected write, not the stage's later read union. */
export function readsForWrittenKey(
  writes: ReadonlyMap<string, RecordedTraceWrite>, stageReads: readonly string[], selectedPath?: string,
): readonly string[] {
  if (selectedPath !== undefined) {
    // The visible committed value is the final write of that exact path.
    return writes.get(selectedPath)?.readKeys ?? stageReads;
  }
  // A stage-anchored inspection asks about all its writes. A stage with no
  // traceable writes keeps its historical stage-read inspection behavior.
  if (!writes.size) return stageReads;
  const keys = new Set<string>();
  let stageFallback = false;
  for (const write of writes.values()) {
    if (write.readKeys === undefined) stageFallback = true;
    else for (const key of write.readKeys) keys.add(key);
  }
  if (stageFallback) for (const key of stageReads) keys.add(key);
  return [...keys];
}

export function indexTraceWrites(writes: readonly RecordedTraceWrite[]): ReadonlyMap<string, RecordedTraceWrite> {
  return new Map(writes.map(write => [write.path, write]));
}

export type ReadPathUncertainty = "ambiguous-read-path" | "legacy-address-unknown";

interface ReadAddressEvidence {
  nestedReadTracking: boolean;
  nestedWrites: boolean;
  canonicalReads: ReadonlySet<string>;
  legacyStageReads: ReadonlySet<string>;
}

/** Index stage inspection evidence once; each read query then stays constant time. */
export function indexReadAddresses(
  writes: ReadonlyMap<string, RecordedTraceWrite>, stageReads: ReadonlySet<string>, nestedReadTracking: boolean,
): ReadAddressEvidence {
  const canonicalReads = new Set<string>();
  let nestedWrites = false, stageFallback = !writes.size;
  for (const write of writes.values()) {
    if (write.path.includes("\u001f")) nestedWrites = true;
    if (write.readKeys === undefined) stageFallback = true;
    else if (nestedReadTracking) for (const key of write.readKeys) canonicalReads.add(key);
  }
  return { nestedReadTracking, nestedWrites, canonicalReads,
    legacyStageReads: nestedReadTracking && stageFallback ? stageReads : new Set() };
}

/** Old read names omitted namespace addresses and dot-joined nested segments. */
export function readPathUncertainty(
  key: string, writes: ReadonlyMap<string, RecordedTraceWrite>, selectedPath: string | undefined,
  evidence: ReadAddressEvidence,
): ReadPathUncertainty | undefined {
  // The discriminator attests per-write readKeys, never legacy stage labels.
  const canonicalRead = evidence.nestedReadTracking && (selectedPath === undefined
    ? evidence.canonicalReads.has(key) && !evidence.legacyStageReads.has(key)
    : writes.get(selectedPath)?.readKeys !== undefined);
  // Legacy scope-local `x` can collide with a different root writer `x`.
  // A nested write is evidence of a namespace boundary, never an address map.
  const nestedWriter = selectedPath === undefined ? evidence.nestedWrites : selectedPath.includes("\u001f");
  if (!canonicalRead && nestedWriter) return "legacy-address-unknown";
  if (key.includes(".") && !canonicalRead) return "ambiguous-read-path";
  return undefined;
}

/** Exact path lookup only; a prior parent or sibling write is not a leaf writer. */
export function indexWriterCommits(log: readonly { trace?: readonly RecordedTraceWrite[] }[]): Map<string, number[]> {
  const result = new Map<string, number[]>();
  log.forEach((commit, index) => {
    for (const write of commit.trace ?? []) {
      const positions = result.get(write.path) ?? [];
      if (positions[positions.length - 1] !== index) positions.push(index);
      result.set(write.path, positions);
    }
  });
  return result;
}

export function writerBefore(writers: ReadonlyMap<string, readonly number[]>, key: string, before: number): number {
  const positions = writers.get(key) ?? [];
  let low = 0, high = positions.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (positions[middle] < before) low = middle + 1;
    else high = middle;
  }
  return low ? positions[low - 1] : -1;
}
