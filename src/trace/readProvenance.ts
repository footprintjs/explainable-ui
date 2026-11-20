/** Names-only read evidence. Canonical paths stay opaque: no dot/prefix aliases. */
import { isPlainRecord, optionalOwnDataField, ownDataField, readName, readOwnArray, TraceAdmissionError, WorkBudget } from "./safeRecordRead";
import type { ReadWindow } from "./readTiming";

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

/** JSON omits undefined values in stageReads. Read the optional list that retains their names. */
export function unsetReadKeys(node: unknown, budget: WorkBudget): string[] {
  const value = ownDataField(node, "undefinedReadKeys");
  if (Array.isArray(value)) {
    try {
      return readOwnArray(value, budget).map(readName);
    } catch (error) {
      if (ownDataField(error, "reason") !== "malformed") throw error;
    }
  }
  return [];
}

export function stageReadNames(node: unknown, budget: WorkBudget): string[] {
  const reads = optionalOwnDataField(node, "stageReads");
  if (reads !== undefined && !isPlainRecord(reads)) throw new TraceAdmissionError("malformed");
  const keys = Object.keys(reads ?? {});
  const before = budget.items;
  const unset = unsetReadKeys(node, budget);
  // Match the engine's sorted union when the list is present. Older
  // recordings retain their original stage-read order.
  const names = unset.length ? [...new Set(keys.concat(unset))].sort() : keys;
  // The scan has already paid for each list entry, including repeats.
  // Top up to the kept names so a live copy of a name costs nothing extra.
  const extra = before + names.length - budget.items;
  if (extra > 0) budget.spend(extra);
  return names.map(readName);
}

/** Only keys are inspected; recorded values/accessors are never evaluated. */
export function stageReadKeys(tree: unknown, budget: WorkBudget): Map<string, string[]> {
  const byStep = new Map<string, string[]>();
  const visited = new Set<unknown>();
  const stack: unknown[] = tree == null ? [] : [tree];
  while (stack.length) {
    budget.spend(1);
    const node = stack.pop();
    if (!node || typeof node !== "object" || visited.has(node)) continue;
    visited.add(node);
    const id = optionalOwnDataField(node, "runtimeStageId");
    const keys = stageReadNames(node, budget);
    if (typeof id === "string" && id && keys.length) byStep.set(readName(id), keys);
    const next = optionalOwnDataField(node, "next");
    if (next != null) stack.push(next);
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

export type ReadPathUncertainty = "ambiguous-read-path" | "legacy-address-unknown" | "read-window-ambiguous" | "related-write";

export interface ReadAddressEvidence {
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
  const nestedWriter = evidence.nestedWrites;
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


interface RelatedNode { children: Map<string, RelatedNode>; exact: number[]; descendants: number[] }
export interface RelatedWriteIndex { latestBefore(key: string, before: number): number }
const lastBefore = (positions: readonly number[], before: number): number => {
  let low = 0, high = positions.length;
  while (low < high) { const middle = (low + high) >>> 1;
    if (positions[middle] < before) low = middle + 1; else high = middle;
  }
  return low ? positions[low - 1] : -1;
};

/** Segment-prefix index; siblings and literal dots never become aliases. */
export function indexRelatedWrites(log: readonly { trace?: readonly RecordedTraceWrite[] }[]): RelatedWriteIndex {
  const node = (): RelatedNode => ({ children: new Map(), exact: [], descendants: [] });
  const root = node(), budget = new WorkBudget();
  const append = (positions: number[], index: number) => { if (positions[positions.length - 1] !== index) positions.push(index); };
  log.forEach((commit, index) => {
    for (const write of commit.trace ?? []) {
      const parts = write.path.split("\u001f"); budget.spend(parts.length);
      let at = root;
      for (let depth = 0; depth < parts.length; depth++) {
        if (depth) append(at.descendants, index);
        let next = at.children.get(parts[depth]);
        if (!next) { next = node(); at.children.set(parts[depth], next); }
        at = next;
      }
      append(at.exact, index);
    }
  });
  return { latestBefore(key, before) {
    let at: RelatedNode | undefined = root, latest = -1;
    const parts = key.split("\u001f");
    for (let depth = 0; depth < parts.length; depth++) {
      at = at.children.get(parts[depth]); if (!at) break;
      latest = Math.max(latest, lastBefore(depth + 1 === parts.length ? at.descendants : at.exact, before));
    }
    return latest;
  } };
}

/** Certain exact writer only; read overlap or related writes never invent a replacement source. */
export function resolveReadWriter(
  writers: ReadonlyMap<string, readonly number[]>, related: RelatedWriteIndex, key: string, window: ReadWindow,
): { writer: number; unresolvedReason?: ReadPathUncertainty } {
  const exact = writerBefore(writers, key, window.end), touched = related.latestBefore(key, window.end);
  if (exact >= window.start || touched >= window.start)
    return { writer: -1, unresolvedReason: "read-window-ambiguous" };
  // Same-commit parent/child rows can also invalidate an older per-path recipe.
  if (touched >= 0 && touched >= exact)
    return { writer: -1, unresolvedReason: "related-write" };
  return { writer: exact };
}
