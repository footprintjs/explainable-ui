import type { commitValueAtWithBasis, findLastWriterWithBasis, findReadSources, LogAddress, TimeTravelSource } from "foottrace";
import type { createRecordGraph, Gap, GraphEdge } from "foottrace/cause";
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
  "ambiguous": "The recorded read has more than one possible writer.",
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

function prepareGraph(snapshot: unknown, api: GraphAPI): ScopedRecordGraph {
  try {
    const scopes = nativeGraphScopes(snapshot);
    if (!scopes) return refused("invalid-data");
    const graph = api.createRecordGraph([...scopes.values()].map(scope => scope.record), { maxCommits: 4096, maxScopes: 256, maxFields: 250000 });
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

    // A legacy stage-wide edge can name several possible source commits. The
    // canonical read window must identify one writer before it is navigable.
    function canFollow(edge: GraphEdge, target: ScopedWriter, source: ScopedWriter, scope: NativeScope) {
      if (edge.attribution === "recorded-read" || scope.record.readSources && edge.attribution === "stage") return true;
      const writes = scope.log[source.commitIdx].trace;
      // A marked set can have several possible view writers. An ordinary
      // merge or append folded onto its preceding write in commit order.
      if (edge.attribution === "recorded-write")
        return writes.every(row => !row.builtOnView) && target.commitIdx < source.commitIdx;
      const canonical = scope.nestedReadTracking && writes.some(row => row.path === source.key && row.readKeys !== undefined);
      if (!canonical && (target.key.includes(".") || writes.some(row => row.path.includes("\u001f")))) return false;
      const first = scope.log.findIndex(row => row.runtimeStageId === source.runtimeStageId);
      const window = api.findReadSources(scope.log, first, target.key);
      return !window.during.length && window.before === target.commitIdx;
    }

    function hiddenAt(scope: NativeScope, before: number, key: string) {
      return before > 0 && scopesWithRedactions.has(scope) && api.commitValueAtWithBasis(
        scope.log, before - 1, key, { initialState: scope.source.initialState },
      ).basis.includes("redacted");
    }

    return {
      hasSubflows: [...scopes.values()].some(scope => scope.mounts.size || scope.record.subflows?.collections.length),
      source: path => scopes.get(JSON.stringify(path))?.source,
      async read({ invocationPath, beforeCommitIdx, key, runtimeStageId, signal }) {
        const fail = (code: string): ScopedBacktrack => ({ writers: [], gaps: [gap(code, invocationPath)] });
        const context = { signal: signal ?? new AbortController().signal };
        const scope = scopes.get(JSON.stringify(invocationPath));
        if (!scope) return fail("missing-child");
        try {
          if (!Number.isSafeInteger(beforeCommitIdx) || beforeCommitIdx < 0 || beforeCommitIdx > scope.log.length) return fail("invalid-data");
          // Validate the entire log before the canonical writer lookup sees its rows.
          await graph.openScope(scope.record.address, context);
          if (context.signal.aborted) return fail("cancelled");
          if (hiddenAt(scope, beforeCommitIdx, key)) return fail("redacted");
          const anchor = api.findLastWriterWithBasis(scope.log, key, beforeCommitIdx);
          if (!anchor.writer) return fail(anchor.basis.includes("redacted") ? "redacted" : "untracked-input");
          if (anchor.basis.length) return fail("ambiguous");
          const row = anchor.writer;
          const commitIdx = scope.log.indexOf(row);
          if (runtimeStageId !== undefined && (row.runtimeStageId !== runtimeStageId || commitIdx !== beforeCommitIdx - 1)) return fail("invalid-data");
          const id = graph.nodeId(scope.record.address, { runtimeStageId: row.runtimeStageId, commitIdx, key });
          const writer = writers.get(id);
          if (!writer || writer.commitIdx !== commitIdx || writer.key !== key || writer.runtimeStageId !== row.runtimeStageId ||
              !samePath(writer.invocationPath, invocationPath)) return fail("ambiguous");
          const parents = await graph.parents(id, context);
          const reasons = await graph.gaps(id, context);
          if (context.signal.aborted) return fail("cancelled");
          const codes = new Set<string>(), direct: ScopedWriter[] = [];
          const mount = scope.mounts.has(row.runtimeStageId), descriptor = scope.mounts.get(row.runtimeStageId);
          for (const edge of parents.edges) {
            if (edge.kind !== "data") continue;
            const target = writers.get(edge.nodeId);
            if (!target) { codes.add("ambiguous"); continue; }
            if (!samePath(target.invocationPath, invocationPath)) {
              const targetScope = scopes.get(JSON.stringify(target.invocationPath))!;
              // Foottrace can return an older writer together with a redaction
              // gap. Check the source key at the mapper's actual read cutoff.
              if (scopesWithRedactions.has(targetScope)) {
                const output = target.invocationPath.length > invocationPath.length;
                const handoff = output ? field(descriptor, "outputHandoff") :
                  field(targetScope.mounts.get(row.runtimeStageId), "inputHandoff");
                const cutoff = field(field(handoff, output ? "child" : "parent"), "beforeCommitIdx");
                if (typeof cutoff !== "number" || !Number.isSafeInteger(cutoff) ||
                    cutoff <= target.commitIdx || cutoff > targetScope.log.length) { codes.add("scope-boundary"); continue; }
                if (hiddenAt(targetScope, cutoff, target.key)) { codes.add("redacted"); continue; }
              }
              direct.push(target);
              continue;
            }
            if (!canFollow(edge, target, writer, scope)) { codes.add("ambiguous"); continue; }
            // A mount's ordinary stage reads include input mapping. They are
            // not output-mapper observations in the child's separate namespace.
            if (mount && edge.attribution === "stage" &&
                !scope.record.readSources) continue;
            direct.push(target);
          }
          function mapReason(reason: Gap) {
            if (reason.code === "not-collected" || reason.code === "conservative") return;
            if (reason.code === "scope-boundary" && mount) return;
            codes.add(lossCode(reason.code));
          }
          for (const reason of reasons) mapReason(reason);
          if (scope.missingChildren.has(row.runtimeStageId)) codes.add("missing-child");
          else if (mount) {
            const output = field(descriptor, "outputHandoff");
            if (output === undefined) codes.add("output-unknown");
            else if (field(field(output, "parent"), "commitIdx") === commitIdx) {
              for (const limitation of selectedLimitations(output)) codes.add(lossCode(limitation));
              if (!direct.some(target => !samePath(target.invocationPath, invocationPath))) codes.add("scope-boundary");
            }
          }
          if (commitIdx === 0 && invocationPath.at(-1) === row.runtimeStageId) {
            const parent = scopes.get(JSON.stringify(invocationPath.slice(0, -1)));
            const input = field(parent?.mounts.get(row.runtimeStageId), "inputHandoff");
            if (!input) codes.add("input-unknown");
            else if (field(input, "status") === "partial" && !selectedLimitations(input).length) codes.add("scope-boundary");
            else for (const limitation of selectedLimitations(input)) codes.add(lossCode(limitation));
          }
          for (const item of scope.record.subflows?.collections ?? []) {
            const parent = field(item, "parent");
            if (field(parent, "commitIdx") !== commitIdx || field(parent, "runtimeStageId") !== row.runtimeStageId || field(parent, "path") !== key) continue;
            if (reasons.some(reason => reason.code === "scope-boundary") && !reasons.some(reason => reason.code === "invalid-data")) {
              codes.add("fanout");
              for (const limitation of selectedLimitations(item)) codes.add(lossCode(limitation));
            }
          }
          if (scope.prefixesOff && !row.trace.some(write => write.path === key && write.readKeys !== undefined)) codes.add("prefix-off");
          for (const code of scope.gaps) codes.add(code);
          if (!direct.length && !codes.size) {
            const prefix = row.trace.filter(write => write.path === key);
            const covered = scope.coveredReads && prefix.length === 1 && prefix[0].readKeys?.length === 0 &&
              !scope.record.reads?.[row.runtimeStageId]?.length;
            codes.add(covered ? "no-match" : "collection-unknown");
          }
          return { writer, writers: direct, gaps: [...codes].map(code => gap(code, invocationPath)) };
        } catch (error) { return fail(context.signal.aborted ? "cancelled" : refusalCode(error)); }
      },
    };
  } catch (error) { return refused(refusalCode(error)); }
}
