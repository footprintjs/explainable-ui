import type { commitValueAtWithBasis, findLastWriterWithBasis, findReadSources, LogAddress, TimeTravelSource } from "foottrace";
import type { createRecordGraph, Gap, GraphContext, GraphEdge } from "foottrace/cause";
import { rootMountLabels } from "../trace/traceScope";
import { classifyAdmissionFailure, optionalOwnDataField as field, readOwnArray, WorkBudget } from "../trace/safeRecordRead";
import { nativeGraphScopes, samePath, type NativeScope } from "./nativeGraphScopes";

export interface ScopedWriter {
  readonly address: LogAddress;
  readonly invocationPath: readonly string[];
  /** Array position in this log, including its seed. */
  readonly commitIdx: number;
  readonly runtimeStageId: string;
  readonly stageName: string;
  /** Foottrace-encoded state key. */
  readonly key: string;
}

export interface ScopedGap {
  readonly invocationPath: readonly string[];
  readonly code: string;
  readonly message: string;
}

export interface ScopedBacktrack {
  readonly writer?: ScopedWriter;
  readonly writers: readonly ScopedWriter[];
  /** Addressed stage reads whose occurrences are not bound to this write. */
  readonly candidates?: readonly ScopedWriter[];
  /** Observed input or output mapper reads at their recorded source cutoffs. */
  readonly handoffs?: readonly ScopedWriter[];
  readonly gaps: readonly ScopedGap[];
}

export interface ScopedRecordGraph {
  readonly hasSubflows: boolean;
  source(invocationPath: readonly string[]): TimeTravelSource | undefined;
  read(query: {
    invocationPath: readonly string[];
    beforeCommitIdx: number;
    key: string;
    runtimeStageId?: string;
    signal?: AbortSignal;
  }): Promise<ScopedBacktrack>;
}

const messages: Record<string, string> = {
  "collection-unknown": "Read collection unknown.",
  "reads-off": "Stage reads were not collected.",
  "writes-off": "State writes were not collected.",
  "sources-off": "Read sources were not collected.",
  "prefix-off": "Per-write reads were not collected.",
  "output-unknown": "Output handoff collection unknown.",
  "input-unknown": "Input handoff collection unknown.",
  "missing-child": "Missing child record at the subflow boundary.",
  "budget": "Capture budget limit reached.",
  "redacted": "Privacy settings withheld recorded evidence.",
  "failed": "Evidence capture failed.",
  "unavailable": "Some recorded sources are unavailable.",
  "invalid-data": "The recorded evidence could not be read.",
  "partial": "Read source capture was partial.",
  "sources-failed": "Read source capture failed.",
  "reads-partial": "Stage read capture was partial.",
  "writes-failed": "Write capture failed.",
  "writes-partial": "Write capture was partial.",
  "fanout": "Fan-out slot has no recorded key mapping.",
  "no-match": "No matching recorded read in this interval.",
  "untracked-input": "The record does not identify an earlier writer.",
  "nested-rows": "This step wrote only part of the selected value.",
  "writer-address-unverified": "The exact recorded writer address could not be verified.",
  "ambiguous": "The recorded read has more than one possible writer.",
  "conservative": "The record does not tie a particular read to this write.",
  "scope-boundary": "The record does not establish this subflow handoff.",
  "unsupported": "The recording uses an unsupported evidence format.",
  "cancelled": "The Backtrack query was cancelled.",
};

function lossCode(code: string) {
  if (code === "privacy-active" || code === "redaction-active" || code === "redacted-export") return "redacted";
  if (["budget-exhausted", "branches-truncated", "truncated", "edge-limit", "node-limit", "depth-limit", "call-limit"].includes(code)) return "budget";
  if (code === "missing-child-record") return "missing-child";
  if (code === "failed-slot" || code === "capture-failed") return "failed";
  return code;
}

function selectedLimitations(raw: unknown) {
  const limits = field(raw, "limitations");
  return Array.isArray(limits) ? readOwnArray(limits, new WorkBudget(64)).filter((value): value is string => typeof value === "string") : [];
}

function gap(code: string, invocationPath: readonly string[]): ScopedGap {
  return { invocationPath, code, message: messages[code] ?? "Recorded evidence is incomplete." };
}

/** Match opaque graph IDs by the public nodeId constructor, never by parsing
 * Foottrace's private serialization, merging log ordinals or searching stage names. */
type GraphAPI = {
  createRecordGraph: typeof createRecordGraph;
  commitValueAtWithBasis: typeof commitValueAtWithBasis;
  findLastWriterWithBasis: typeof findLastWriterWithBasis;
  findReadSources: typeof findReadSources;
};

function refusalCode(error: unknown) {
  if (classifyAdmissionFailure(error).reason === "too-large") return "budget";
  const code = field(error, "code");
  return typeof code === "string" ? lossCode(code) : "invalid-data";
}

function refused(code: string): ScopedRecordGraph {
  return { hasSubflows: true, source: () => undefined, read: async ({ invocationPath }) => ({
    writers: [], gaps: [gap(code, invocationPath)],
  }) };
}

export function createNativeGraph(snapshot: unknown, api: GraphAPI): ScopedRecordGraph | undefined {
  try {
    if (field(snapshot, "logAddress") === undefined) return undefined;
    // Reading a flat recording or moving its slider must not enumerate writer
    // addresses or load a graph. Even the scope index is deferred until used.
    let prepared: ScopedRecordGraph | undefined;
    const get = () => prepared ??= prepareGraph(snapshot, api);
    const results = field(snapshot, "subflowResults");
    const hasInventory = results && typeof results === "object" && Object.keys(results).length > 0;
    const mounts = !hasInventory && rootMountLabels(field(snapshot, "executionTree"));
    return {
      hasSubflows: Boolean(hasInventory || field(snapshot, "fanoutCollections") ||
        mounts && (!mounts.availability.ok || mounts.labels.size)),
      source: path => get().source(path),
      read: query => get().read(query),
    };
  } catch (error) { return refused(refusalCode(error)); }
}

type ScopeMap = ReadonlyMap<string, NativeScope>;
type ReadQuery = Parameters<ScopedRecordGraph["read"]>[0];

function indexWriters(scopes: ScopeMap, graph: ReturnType<typeof createRecordGraph>) {
  const writers = new Map<string, ScopedWriter>();
  const scopesWithRedactions = new Set<NativeScope>();
  const budget = new WorkBudget();
  for (const scope of scopes.values()) {
    const address = scope.record.address;
    for (const [commitIdx, row] of scope.log.entries()) {
      const redactions = field(row, "redactedPaths");
      if (Array.isArray(redactions) && redactions.length) scopesWithRedactions.add(scope);
      const runtimeStageId = field(row, "runtimeStageId"), stageName = field(row, "stage");
      if (typeof runtimeStageId !== "string" || typeof stageName !== "string") continue;
      for (const write of readOwnArray(field(row, "trace"), budget)) {
        const key = field(write, "path");
        if (typeof key !== "string") continue;
        const id = graph.nodeId(address, { runtimeStageId, commitIdx, key });
        writers.set(id, Object.freeze({ address, invocationPath: address.drillPath, commitIdx, runtimeStageId, stageName, key }));
      }
    }
  }
  return { writers, scopesWithRedactions };
}

// Interim until Foottrace reports whether a direct parent is navigable and why its exact address is uncertain.
function canFollow(edge: GraphEdge, target: ScopedWriter, writer: ScopedWriter, scope: NativeScope, api: GraphAPI) {
  if (edge.attribution === "recorded-read" || scope.record.readSources && edge.attribution === "stage") return true;
  const writes = scope.log[writer.commitIdx].trace;
  // A marked set uses the writer's view. An ordinary merge or append folds onto the preceding write.
  if (edge.attribution === "recorded-write") {
    if (writes.every(row => !row.builtOnView) && target.commitIdx < writer.commitIdx) return true;
    return "writer-address-unverified";
  }
  const canonical = scope.nestedReadTracking && writes.some(row => row.path === writer.key && row.readKeys !== undefined);
  if (!canonical && (target.key.includes(".") || writes.some(row => row.path.includes("\u001f")))) return "writer-address-unverified";
  const first = scope.log.findIndex(row => row.runtimeStageId === writer.runtimeStageId);
  const window = api.findReadSources(scope.log, first, target.key);
  if (!window.during.length && window.before === target.commitIdx) return true;
  const candidates = window.during.length + (window.before >= 0 ? 1 : 0);
  return candidates > 1 ? "ambiguous" : "writer-address-unverified";
}

function addOutputGaps(scope: NativeScope, writer: ScopedWriter, hasHandoff: boolean, codes: Set<string>) {
  const id = writer.runtimeStageId;
  if (scope.missingChildren.has(id)) { codes.add("missing-child"); return; }
  if (!scope.mounts.has(id)) return;
  const output = field(scope.mounts.get(id), "outputHandoff");
  if (output === undefined) { codes.add("output-unknown"); return; }
  if (field(field(output, "parent"), "commitIdx") !== writer.commitIdx) return;
  for (const limitation of selectedLimitations(output)) codes.add(lossCode(limitation));
  if (!hasHandoff) codes.add("scope-boundary");
}

function addInputGaps(scopes: ScopeMap, writer: ScopedWriter, codes: Set<string>) {
  if (writer.commitIdx !== 0 || writer.invocationPath.at(-1) !== writer.runtimeStageId) return;
  const parent = scopes.get(JSON.stringify(writer.invocationPath.slice(0, -1)));
  const input = field(parent?.mounts.get(writer.runtimeStageId), "inputHandoff");
  if (!input) { codes.add("input-unknown"); return; }
  const limitations = selectedLimitations(input);
  if (field(input, "status") === "partial" && !limitations.length) codes.add("scope-boundary");
  for (const limitation of limitations) codes.add(lossCode(limitation));
}

function addBoundaryGaps(scopes: ScopeMap, scope: NativeScope, writer: ScopedWriter, hasHandoff: boolean,
  reasons: readonly Gap[], codes: Set<string>) {
  for (const reason of reasons) {
    if (reason.code === "not-collected") continue;
    if (reason.code === "scope-boundary" && scope.mounts.has(writer.runtimeStageId) &&
        (scope.missingChildren.has(writer.runtimeStageId) || field(scope.mounts.get(writer.runtimeStageId), "outputHandoff") === undefined)) continue;
    codes.add(lossCode(reason.code));
  }
  addOutputGaps(scope, writer, hasHandoff, codes);
  addInputGaps(scopes, writer, codes);
  if (!reasons.some(reason => reason.code === "scope-boundary") || reasons.some(reason => reason.code === "invalid-data")) return;
  for (const item of scope.record.subflows?.collections ?? []) {
    const parent = field(item, "parent");
    if (field(parent, "commitIdx") !== writer.commitIdx || field(parent, "runtimeStageId") !== writer.runtimeStageId ||
        field(parent, "path") !== writer.key) continue;
    codes.add("fanout");
    for (const limitation of selectedLimitations(item)) codes.add(lossCode(limitation));
  }
}

function addCoverageGaps(scope: NativeScope, writer: ScopedWriter, hasSources: boolean, codes: Set<string>) {
  const prefix = scope.log[writer.commitIdx].trace.filter(row => row.path === writer.key);
  if (scope.prefixesOff && !prefix.some(row => row.readKeys !== undefined)) codes.add("prefix-off");
  for (const code of scope.gaps) codes.add(code);
  // Attribution and channel coverage can both be unknown on a legacy recording.
  const attributionOnly = codes.size === 1 && codes.has("conservative");
  if (hasSources || (codes.size && !attributionOnly)) return;
  // Interim until Foottrace answers whether this write's finished scope interval covered reads and had no match.
  const covered = scope.coveredReads && prefix.length === 1 && prefix[0].readKeys?.length === 0 &&
    !scope.record.reads?.[writer.runtimeStageId]?.length;
  if (!covered) codes.add("collection-unknown");
  else if (codes.size === 0) codes.add("no-match");
}

function prepareGraph(snapshot: unknown, api: GraphAPI): ScopedRecordGraph {
  try {
    const scopes = nativeGraphScopes(snapshot);
    return scopes ? scopedReader(scopes, api) : refused("invalid-data");
  } catch (error) { return refused(refusalCode(error)); }
}

function scopedReader(scopes: ScopeMap, api: GraphAPI): ScopedRecordGraph {
  const graph = api.createRecordGraph([...scopes.values()].map(scope => scope.record), { maxCommits: 4096, maxScopes: 256, maxFields: 250000 });
  const { writers, scopesWithRedactions } = indexWriters(scopes, graph);

  // Interim until Foottrace gives a per-key privacy verdict at the query or mapper's exclusive source cutoff.
  function hiddenAt(scope: NativeScope, before: number, key: string) {
    return before > 0 && scopesWithRedactions.has(scope) && api.commitValueAtWithBasis(
      scope.log, before - 1, key, { initialState: scope.source.initialState },
    ).basis.includes("redacted");
  }

  async function findWriter(scope: NativeScope, { invocationPath, beforeCommitIdx, key, runtimeStageId }: ReadQuery, context: GraphContext) {
    if (!Number.isSafeInteger(beforeCommitIdx) || beforeCommitIdx < 0 || beforeCommitIdx > scope.log.length) return "invalid-data";
    // Foottrace admits the log before its writer lookup sees any rows.
    await graph.openScope(scope.record.address, context);
    if (context.signal.aborted) return "cancelled";
    if (hiddenAt(scope, beforeCommitIdx, key)) return "redacted";
    const { writer: row, basis } = api.findLastWriterWithBasis(scope.log, key, beforeCommitIdx);
    if (basis.includes("redacted")) return "redacted";
    if (!row) return "untracked-input";
    if (basis.includes("nested-rows")) return "nested-rows";
    const commitIdx = scope.log.indexOf(row);
    if (runtimeStageId !== undefined && (row.runtimeStageId !== runtimeStageId || commitIdx !== beforeCommitIdx - 1)) return "invalid-data";
    const id = graph.nodeId(scope.record.address, { runtimeStageId: row.runtimeStageId, commitIdx, key });
    const writer = writers.get(id);
    if (basis.length || !writer || writer.commitIdx !== commitIdx || writer.key !== key ||
        writer.runtimeStageId !== row.runtimeStageId || !samePath(writer.invocationPath, invocationPath)) return "writer-address-unverified";
    return { id, writer };
  }

  function handoffGap(scope: NativeScope, writer: ScopedWriter, target: ScopedWriter) {
    const targetScope = scopes.get(JSON.stringify(target.invocationPath))!;
    if (!scopesWithRedactions.has(targetScope)) return;
    // Foottrace can return an older writer together with a redaction gap.
    const output = target.invocationPath.length > writer.invocationPath.length;
    const mount = (output ? scope : targetScope).mounts.get(writer.runtimeStageId);
    const handoff = field(mount, output ? "outputHandoff" : "inputHandoff");
    const cutoff = field(field(handoff, output ? "child" : "parent"), "beforeCommitIdx");
    if (typeof cutoff !== "number" || !Number.isSafeInteger(cutoff) ||
        cutoff <= target.commitIdx || cutoff > targetScope.log.length) return "scope-boundary";
    if (hiddenAt(targetScope, cutoff, target.key)) return "redacted";
  }

  function directParents(scope: NativeScope, writer: ScopedWriter, edges: readonly GraphEdge[], codes: Set<string>) {
    const direct: ScopedWriter[] = [];
    const candidates: ScopedWriter[] = [];
    const handoffs: ScopedWriter[] = [];
    for (const edge of edges) {
      if (edge.kind !== "data") continue;
      const target = writers.get(edge.nodeId);
      if (!target) { codes.add("writer-address-unverified"); continue; }
      if (!samePath(target.invocationPath, writer.invocationPath)) {
        const loss = handoffGap(scope, writer, target);
        if (loss) codes.add(loss);
        else handoffs.push(target);
        continue;
      }
      const evidence = canFollow(edge, target, writer, scope, api);
      if (evidence !== true) { codes.add(evidence); continue; }
      // A mount's local stage reads describe input mapping, not the child's output mapper.
      if (scope.mounts.has(writer.runtimeStageId) && edge.attribution === "stage" && !scope.record.readSources) continue;
      // Interim until Foottrace exposes per-edge evidence tying a read occurrence to this write.
      if (edge.attribution === "stage") {
        if (!candidates.includes(target)) candidates.push(target);
        codes.add("conservative");
        continue;
      }
      direct.push(target);
    }
    return { direct, candidates, handoffs };
  }

  return {
    hasSubflows: [...scopes.values()].some(scope => scope.mounts.size || scope.record.subflows?.collections.length),
    source: path => scopes.get(JSON.stringify(path))?.source,
    async read(query) {
      const { invocationPath } = query;
      const fail = (code: string): ScopedBacktrack => ({ writers: [], gaps: [gap(code, invocationPath)] });
      const context = { signal: query.signal ?? new AbortController().signal };
      const scope = scopes.get(JSON.stringify(invocationPath));
      if (!scope) return fail("missing-child");
      try {
        const anchor = await findWriter(scope, query, context);
        if (typeof anchor === "string") return fail(anchor);
        const parents = await graph.parents(anchor.id, context);
        const reasons = await graph.gaps(anchor.id, context);
        if (context.signal.aborted) return fail("cancelled");
        const codes = new Set<string>();
        const { direct, candidates, handoffs } = directParents(scope, anchor.writer, parents.edges, codes);
        addBoundaryGaps(scopes, scope, anchor.writer, handoffs.length > 0, reasons, codes);
        addCoverageGaps(scope, anchor.writer, direct.length + candidates.length + handoffs.length > 0, codes);
        return { writer: anchor.writer, writers: direct, ...(candidates.length && { candidates }), ...(handoffs.length && { handoffs }),
          gaps: [...codes].map(code => gap(code, invocationPath)) };
      } catch (error) { return fail(context.signal.aborted ? "cancelled" : refusalCode(error)); }
    },
  };
}
