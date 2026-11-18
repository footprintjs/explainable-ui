import type { ScopedRecordGraph, ScopedWriter } from "../scopedBacktrack/graph";
import { indexReadWindows, readCommitTiming } from "./readTiming";
import { ownDataField, readOwnArray, WorkBudget } from "./safeRecordRead";
import type { SubflowHandoffSource } from "./subflowHandoff";
import type { TraceIngredient, TraceStop, TraceWalk } from "./traceWalk";

const samePath = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((part, at) => part === right[at]);

/** The child rail omits its input-mapper seed. Graph coordinates always include it. */
function scopeLog(snapshot: unknown, path: readonly string[]) {
  const mount = path.at(-1);
  const child = mount && ownDataField(ownDataField(snapshot, "subflowResults"), mount);
  const raw = mount
    ? ownDataField(ownDataField(child, "treeContext"), "history") : ownDataField(snapshot, "commitLog");
  const log: readonly unknown[] = Array.isArray(raw) ? raw : [];
  const first = ownDataField(ownDataField(log, 0), "runtimeStageId");
  return { log, offset: mount && (first === "" || first === mount) ? 1 : 0 };
}

function missingScopedWalk(local: TraceWalk, messages: readonly string[]): TraceWalk {
  return { ...local, stops: [], inputTermini: [], truncated: false,
    missing: { reason: "evidence-unavailable", gapMessages: messages } };
}

export function scopedWalkStatus(local: TraceWalk, message: string, beforeCommitIdx?: number): TraceWalk {
  const first = local.stops[0];
  return first && first.commitIdx + 1 === beforeCommitIdx ? { ...local, inputTermini: [], truncated: false, stops: [{
    ...first, contributedKeys: [local.key], ingredients: [], ingredientsByKey: {},
    handoffSources: [], gapMessages: [message],
  }] } : missingScopedWalk(local, [message]);
}

const MAX_STOPS = 50;
const MAX_QUERIES = 128;

/** Materialize local stops on their existing rail. A foreign writer stays a navigation target. */
export async function buildScopedWalk(graph: ScopedRecordGraph, snapshot: unknown, local: TraceWalk,
  beforeCommitIdx: number | undefined, readerCommitIdx: number | undefined, writerRuntimeStageId: string | undefined, signal: AbortSignal): Promise<TraceWalk> {
  const path = local.scope?.invocationPath ?? [];
  const { log, offset } = scopeLog(snapshot, path);
  const cutoff = readerCommitIdx === undefined
    ? (beforeCommitIdx === undefined ? log.length : beforeCommitIdx + offset)
    : indexReadWindows(readOwnArray(log, new WorkBudget()).map(readCommitTiming))[readerCommitIdx + offset]?.end;
  if (cutoff === undefined) return missingScopedWalk(local, ["Recorded read interval unavailable."]);
  const anchor = await graph.read({ invocationPath: path, key: local.key, beforeCommitIdx: cutoff, runtimeStageId: writerRuntimeStageId, signal });
  if (!anchor.writer) {
    if (local.missing?.reason === "not-yet-written" && anchor.gaps.every(gap => gap.code === "untracked-input")) return local;
    return missingScopedWalk(local, anchor.gaps.map(gap => gap.message));
  }
  if (readerCommitIdx !== undefined && local.missing?.unresolvedReason) return local;
  if (anchor.writer.commitIdx < offset) return missingScopedWalk(local, [
    `${local.key} recorded at invocation start. Its seed is outside this timeline.`, ...anchor.gaps.map(gap => gap.message),
  ]);
  const stops = new Map<number, TraceStop>();
  const visited = new Set<string>();
  const unresolvedKeys = new Set<string>();
  const queue = [{ runtimeStageId: anchor.writer.runtimeStageId, raw: anchor.writer.commitIdx, key: local.key, depth: 0 }];
  let truncated = false;
  for (let at = 0; at < queue.length; at++) {
    if (signal.aborted) throw new Error("Query canceled");
    const { runtimeStageId, raw, key, depth } = queue[at];
    const id = JSON.stringify([raw, key]);
    if (visited.has(id)) continue;
    if (visited.size >= MAX_QUERIES || (!stops.has(raw) && stops.size >= MAX_STOPS)) { truncated = true; break; }
    visited.add(id);
    const answer = at === 0 ? anchor : await graph.read({ invocationPath: path, beforeCommitIdx: raw + 1, key, runtimeStageId, signal });
    const writer = answer.writer;
    if (!writer || writer.commitIdx !== raw || writer.key !== key || !samePath(path, writer.invocationPath) ||
      writer.runtimeStageId !== runtimeStageId) {
      if (at === 0) return missingScopedWalk(local, ["Recorded writer address unavailable."]);
      continue;
    }
    const row = ownDataField(log, raw);
    let stop = stops.get(raw);
    if (!stop) {
      const stageId = ownDataField(row, "stageId");
      const writes = ownDataField(row, "trace");
      stop = { commitIdx: raw - offset, runtimeStageId, stageId: typeof stageId === "string" ? stageId : runtimeStageId,
        stageName: writer.stageName, keysWritten: Array.isArray(writes) ? readOwnArray(writes, new WorkBudget()).flatMap(write => {
          const key = ownDataField(write, "path");
          return typeof key === "string" ? [key] : [];
        }) : [key], ingredients: [], contributedKeys: [], depth, loopPass: 0, gapMessages: [] };
      stops.set(raw, stop);
    }
    stop.contributedKeys.push(key);
    const messages = new Set(stop.gapMessages);
    for (const gap of answer.gaps) messages.add(gap.message);
    if (answer.candidates?.length) {
      const stageReads = [...(stop.stageReads ?? [])];
      for (const candidate of answer.candidates) {
        if (!samePath(candidate.invocationPath, path) ||
          stageReads.some(read => read.key === candidate.key && read.commitIdx === candidate.commitIdx)) continue;
        stageReads.push({ key: candidate.key, runtimeStageId: candidate.runtimeStageId, stageName: candidate.stageName,
          commitIdx: candidate.commitIdx, beforeCommitIdx: candidate.commitIdx - offset + 1 });
      }
      stop.stageReads = stageReads;
    }
    const sources: SubflowHandoffSource[] = [...(stop.handoffSources ?? [])];
    function addHandoff(source: ScopedWriter) {
      const target = scopeLog(snapshot, source.invocationPath);
      if (ownDataField(ownDataField(target.log, source.commitIdx), "runtimeStageId") !== source.runtimeStageId || source.commitIdx < target.offset) {
        messages.add("Recorded handoff writer is unavailable on this timeline.");
        return;
      }
      const child = source.invocationPath.length === path.length + 1 && samePath(source.invocationPath.slice(0, -1), path);
      const parent = path.length === source.invocationPath.length + 1 && samePath(path.slice(0, -1), source.invocationPath);
      if (!child && !parent) {
        messages.add("Recorded handoff has no direct parent or child address on this timeline.");
        return;
      }
      const direction = child ? "child" : "parent";
      const mountRuntimeStageId = (direction === "child" ? source.invocationPath : path).at(-1);
      if (!mountRuntimeStageId) return;
      if (!sources.some(s => s.key === source.key && s.beforeCommitIdx === source.commitIdx + 1 - target.offset &&
        samePath(s.invocationPath, source.invocationPath))) sources.push({
          key: source.key, invocationPath: source.invocationPath, mountRuntimeStageId,
          beforeCommitIdx: source.commitIdx + 1 - target.offset, direction, writerRuntimeStageId: source.runtimeStageId,
        });
    }
    for (const handoff of answer.handoffs ?? []) addHandoff(handoff);
    const inputs: TraceIngredient[] = [];
    for (const source of answer.writers) {
      if (!samePath(source.invocationPath, path)) continue;
      if (source.commitIdx < offset) {
        // The seed has no slider tick. Only its recorded input mapping can cross to the parent.
        const seed = await graph.read({ invocationPath: path, key: source.key, beforeCommitIdx: source.commitIdx + 1,
          runtimeStageId: source.runtimeStageId, signal });
        if (seed.writer?.commitIdx === source.commitIdx && seed.writer.key === source.key) {
          for (const gap of seed.gaps) messages.add(gap.message);
          for (const from of seed.handoffs ?? []) addHandoff(from);
        }
        if (!seed.writers.length && !seed.handoffs?.length) messages.add(`${source.key} recorded at invocation start; earlier origin unknown.`);
        continue;
      }
      inputs.push({ key: source.key, writerCommitIdx: source.commitIdx - offset, writerRuntimeStageId: source.runtimeStageId,
        writerStageName: source.stageName });
      if (depth < 10 && queue.length < MAX_QUERIES * 2) queue.push({
        raw: source.commitIdx, key: source.key, runtimeStageId: source.runtimeStageId, depth: depth + 1,
      }); else truncated = true;
    }
    // Preserve positively named reads whose producer the graph cannot identify.
    // Never use a fallback writer, or turn a mount's local input into output evidence.
    if (!ownDataField(local.scope?.mountLabels, runtimeStageId) &&
      !answer.gaps.some(gap => ["redacted", "failed", "budget", "unsupported", "conservative"].includes(gap.code))) {
      const recorded = local.stops.find(candidate => candidate.commitIdx === stop!.commitIdx)?.ingredientsByKey?.[key];
      for (const read of recorded ?? []) {
        if (read.writerCommitIdx === null && !answer.writers.some(writer => writer.key === read.key)) {
          inputs.push(read);
          unresolvedKeys.add(read.key);
        }
      }
    }
    stop.ingredientsByKey = { ...stop.ingredientsByKey, [key]: inputs };
    for (const input of inputs) if (!stop.ingredients.some(i => i.key === input.key && i.writerCommitIdx === input.writerCommitIdx)) stop.ingredients.push(input);
    stop.handoffSources = sources;
    stop.gapMessages = [...messages];
  }
  const ordered = [...stops.values()].sort((a, b) => b.commitIdx - a.commitIdx);
  const groups = new Map<string, TraceStop[]>();
  for (const stop of ordered) {
    const group = groups.get(stop.stageId) ?? [];
    group.push(stop);
    groups.set(stop.stageId, group);
  }
  for (const group of groups.values()) if (group.length > 1) group.forEach((stop, at) => { stop.loopPass = group.length - at; });
  return { ...local, missing: null, stops: ordered, inputTermini: [...unresolvedKeys], truncated };
}
