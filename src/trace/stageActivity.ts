import type { NarrativeEntry, StageSnapshot } from "../types";
import { buildDataTrace } from "./dataTrace";
import { recordedPathLabel, recordedValuePreview } from "./recordedValuePreview";
import { isPlainRecord, optionalOwnDataField, ownDataField, readName, readOwnArray, WorkBudget } from "./safeRecordRead";
import type { TraceScope } from "./traceScope";

/** Names and an exact exclusive cutoff only: never a retained snapshot value. */
export interface StageActivityTraceTarget {
  readonly key: string;
  readonly kind: "read" | "write";
  readonly runtimeStageId: string;
  readonly beforeCommitIdx: number;
  readonly invocationPath: readonly string[];
}

export interface StageActivityValue {
  readonly state: "recorded" | "absent" | "unavailable";
  readonly preview: string | null;
}

export interface StageActivityWriter {
  readonly runtimeStageId: string;
  readonly stageName: string;
  readonly commitIdx: number;
}

export interface StageActivityVariable {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly kind: "read" | "write";
  readonly source: "stage-read" | "narrative" | "commit-write";
  readonly value: StageActivityValue;
  readonly valueLabel: string;
  readonly before?: StageActivityValue;
  readonly after?: StageActivityValue;
  readonly change: "added" | "updated" | "removed" | "unchanged" | "written" | "unknown";
  readonly writer: StageActivityWriter | null;
  readonly traceTarget: StageActivityTraceTarget | null;
}

export interface StageActivityEvent {
  readonly id: string;
  readonly kind: "step" | "decision" | "error" | "event" | "log";
  readonly source: "narrative" | "execution-tree";
  readonly text: string;
  readonly key?: string;
  readonly variableId?: string;
  /** A standard narrative's own wording, not a typed scope-event assertion. */
  readonly reportedOperation?: "read" | "write" | "update" | "delete";
}

export interface StageActivityView {
  readonly identity: {
    readonly stageName: string;
    readonly stageLabel: string;
    readonly runtimeStageId: string | null;
    readonly invocationPath: readonly string[];
    readonly commitIdx: number | null;
  };
  readonly availability: { readonly ok: true } | { readonly ok: false; readonly reason: string };
  readonly events: readonly StageActivityEvent[];
  readonly reads: readonly StageActivityVariable[];
  readonly writes: readonly StageActivityVariable[];
  readonly decisions: readonly StageActivityEvent[];
  readonly logs: readonly StageActivityEvent[];
  readonly coverage: {
    readonly narrative: "recorded" | "unavailable" | "none-recorded";
    readonly reads: "recorded" | "unknown";
    readonly writes: "recorded" | "unavailable";
    readonly logs: "stage-scoped" | "unavailable";
    readonly truncated: boolean;
  };
  readonly notes: readonly string[];
}

export interface StageActivityInput {
  readonly scope: TraceScope;
  readonly snapshots: readonly StageSnapshot[];
  readonly selectedIndex: number;
  readonly narrativeEntries?: readonly NarrativeEntry[];
  /** False when the shell has rejected a stale or unavailable companion. */
  readonly narrativeAvailable?: boolean;
}

const MAX_VARIABLES = 100;
const MAX_EVENTS = 200;
const MAX_EVENT_TEXT = 4_096;
const MAX_TOTAL_TEXT = 65_536;
const MAX_VARIABLE_KEY_TEXT = 16_384;
const unavailableValue = (): StageActivityValue => ({ state: "unavailable", preview: null });

type Commit = { stage: string; stageId: string; runtimeStageId: string; trace: { path: string }[]; bookend: boolean };
type InternalValue = { public: StageActivityValue; value?: unknown };

/** A single visit's evidence, detached from arbitrary stored values. It does
 * not infer formulas, merge parallel clocks, or claim every assignment was
 * committed. Supplied scope evidence is re-read through inert own fields. */
export function projectStageActivity(input: StageActivityInput): StageActivityView {
  const view: {
    identity: StageActivityView["identity"];
    availability: StageActivityView["availability"];
    events: StageActivityEvent[]; reads: StageActivityVariable[]; writes: StageActivityVariable[];
    decisions: StageActivityEvent[]; logs: StageActivityEvent[];
    coverage: { narrative: "recorded" | "unavailable" | "none-recorded"; reads: "recorded" | "unknown"; writes: "recorded" | "unavailable"; logs: "stage-scoped" | "unavailable"; truncated: boolean };
    notes: string[];
  } = {
    identity: { stageName: "Stage", stageLabel: "Stage", runtimeStageId: null, invocationPath: [], commitIdx: null },
    availability: { ok: false, reason: "No exact stage visit is selected." },
    events: [], reads: [], writes: [], decisions: [], logs: [],
    coverage: { narrative: "unavailable", reads: "unknown", writes: "unavailable", logs: "unavailable", truncated: false },
    notes: [],
  };
  const note = (text: string) => { if (!view.notes.includes(text) && view.notes.length < 12) view.notes.push(text); };
  const fail = (reason: string): StageActivityView => ({ ...view, availability: { ok: false, reason }, events: [], reads: [], writes: [], decisions: [], logs: [],
    coverage: { ...view.coverage, reads: "unknown", writes: "unavailable", narrative: "unavailable", logs: "unavailable" } });
  const boundedVariables = <T extends readonly [string, unknown]>(entries: readonly T[]): T[] => {
    const visible: T[] = [];
    let chars = 0;
    for (const entry of entries) {
      if (visible.length >= MAX_VARIABLES || chars + entry[0].length > MAX_VARIABLE_KEY_TEXT) { view.coverage.truncated = true; break; }
      visible.push(entry); chars += entry[0].length;
    }
    return visible;
  };
  const keyLabel = (key: string) => {
    const label = recordedPathLabel(key);
    return label.length <= 1_024 ? label : `${label.slice(0, 1_023)}…`;
  };
  try {
    const budget = new WorkBudget();
    const scope = ownDataField(input, "scope");
    const path = readOwnArray(ownDataField(scope, "invocationPath"), budget).map(readName);
    if (path.length > 128 || path.join("").length > 8_192) return fail("The selected invocation address is unavailable.");
    const snapshots = readOwnArray(ownDataField(input, "snapshots"), budget);
    const selectedIndex = ownDataField(input, "selectedIndex");
    if (typeof selectedIndex !== "number" || !Number.isSafeInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= snapshots.length) return fail("No exact stage visit is selected.");
    const selected = snapshots[selectedIndex];
    const runtimeStageId = ownDataField(selected, "runtimeStageId");
    const stageName = ownDataField(selected, "stageName");
    const stageLabel = ownDataField(selected, "stageLabel");
    view.identity = {
      stageName: typeof stageName === "string" && stageName.length > 0 ? stageName.slice(0, 1_024) : "Stage",
      stageLabel: typeof stageLabel === "string" && stageLabel.length > 0 ? stageLabel.slice(0, 1_024) : "Stage",
      runtimeStageId: typeof runtimeStageId === "string" && runtimeStageId.length <= 4_096 ? runtimeStageId : null,
      invocationPath: path, commitIdx: null,
    };
    if (typeof runtimeStageId !== "string" || !runtimeStageId.length || runtimeStageId.length > 4_096) return fail("This snapshot has no exact runtime visit address.");
    if (ownDataField(ownDataField(scope, "availability"), "ok") !== true) return fail("Recorded history is unavailable for this invocation.");

    const log: Commit[] = readOwnArray(ownDataField(scope, "commitLog"), budget).map(entry => {
      const trace = readOwnArray(ownDataField(entry, "trace"), budget).map(write => ({ path: readName(ownDataField(write, "path")) }));
      const phase = optionalOwnDataField(entry, "phase");
      const emptyObject = (field: string) => {
        const value = optionalOwnDataField(entry, field);
        if (value === undefined) return true;
        if (!isPlainRecord(value)) return false;
        const keys = Object.keys(value); budget.spend(keys.length);
        return keys.length === 0;
      };
      const emptyRedactions = () => {
        const value = optionalOwnDataField(entry, "redactedPaths");
        return value === undefined || readOwnArray(value, budget).length === 0;
      };
      return {
        stage: readName(ownDataField(entry, "stage")), stageId: readName(ownDataField(entry, "stageId")),
        runtimeStageId: readName(ownDataField(entry, "runtimeStageId")), trace,
        // Engine exits/repeats can append a value-free bookend under the same
        // visit address. It does not create a second write or a new visit.
        bookend: (phase === "exit" || phase === "repeat") && trace.length === 0 &&
          emptyObject("overwrite") && emptyObject("updates") && emptyRedactions(),
      };
    });
    const commitById = new Map<string, { commit: Commit; index: number }>();
    for (let index = 0; index < log.length; index++) {
      if (log[index].bookend) continue;
      if (commitById.has(log[index].runtimeStageId)) return fail("Recorded commit addresses are ambiguous in this invocation.");
      commitById.set(log[index].runtimeStageId, { commit: log[index], index });
    }
    const current = commitById.get(runtimeStageId);
    if (!current) return fail("This snapshot's visit is absent from the recorded commit history.");

    const snapshotsById = new Map<string, unknown>();
    const ambiguousSnapshots = new Set<string>();
    for (const snapshot of snapshots) {
      const id = ownDataField(snapshot, "runtimeStageId");
      if (typeof id !== "string") continue;
      if (snapshotsById.has(id)) ambiguousSnapshots.add(id);
      snapshotsById.set(id, snapshot);
    }
    if (ambiguousSnapshots.has(runtimeStageId)) return fail("More than one snapshot names this runtime visit.");
    view.identity = { ...view.identity, commitIdx: current.index,
      stageName: current.commit.stage.slice(0, 1_024),
      stageLabel: view.identity.stageLabel === current.commit.stageId || typeof stageLabel !== "string" || !stageLabel.length
        ? current.commit.stage.slice(0, 1_024) : view.identity.stageLabel };
    view.availability = { ok: true };
    view.coverage.writes = "recorded";

    const readSources = new Map<string, "stage-read" | "narrative">();
    let treeDecisions: StageActivityEvent[] = [];
    let treeFound = false;
    // The trace scope may retain the full root tree or a names-only child
    // tree. Never suffix-match or borrow the parent's fields for a child.
    try {
      const treeBudget = new WorkBudget();
      const seen = new Set<unknown>();
      const queue = [ownDataField(scope, "executionTree")];
      let match: unknown;
      let matches = 0;
      for (let index = 0; index < queue.length; index++) {
        treeBudget.spend(1);
        const node = queue[index];
        if (!isPlainRecord(node) || seen.has(node)) throw new Error();
        seen.add(node);
        const id = optionalOwnDataField(node, "runtimeStageId");
        if (id === runtimeStageId) { match = node; matches++; }
        const next = optionalOwnDataField(node, "next");
        if (next !== undefined && next !== null) queue.push(next);
        const children = optionalOwnDataField(node, "children");
        if (children !== undefined) queue.push(...readOwnArray(children, treeBudget));
      }
      if (matches > 1) return fail("More than one execution-tree record names this runtime visit.");
      if (matches === 1) {
        treeFound = true;
        const reads = optionalOwnDataField(match, "stageReads");
        if (reads !== undefined && !isPlainRecord(reads)) throw new Error();
        if (isPlainRecord(reads)) {
          const keys = Object.keys(reads); treeBudget.spend(keys.length);
          for (const key of keys) {
            // Accessor keys are not captured read evidence.
            optionalOwnDataField(reads, key);
            readSources.set(readName(key), "stage-read");
          }
        }
        const rawMessages = optionalOwnDataField(match, "flowMessages");
        if (rawMessages !== undefined) {
          for (const [index, message] of readOwnArray(rawMessages, treeBudget).entries()) {
            if (ownDataField(message, "type") !== "branch") continue;
            const target = ownDataField(message, "targetStage"), rationale = ownDataField(message, "rationale");
            if (typeof target !== "string" || !target.length) continue;
            treeDecisions.push({ id: `tree-decision:${index}`, kind: "decision", source: "execution-tree",
              text: `Recorded branch: ${target.slice(0, 1_024)}${typeof rationale === "string" && rationale.length ? `. ${rationale.slice(0, 2_048)}` : ""}` });
            if (treeDecisions.length >= MAX_EVENTS) { view.coverage.truncated = true; break; }
          }
        }
      }
    } catch {
      treeFound = false; readSources.clear(); treeDecisions = [];
      note("Execution-tree reads and decisions could not be inspected; their coverage is unknown.");
    }
    view.coverage.reads = treeFound && ownDataField(scope, "readsAvailable") === true ? "recorded" : "unknown";

    const writeKeys = [...new Set(current.commit.trace.map(write => write.path))];
    if (writeKeys.length > MAX_VARIABLES) view.coverage.truncated = true;
    const visibleWriteKeys = boundedVariables(writeKeys.map(key => [key, true] as const)).map(([key]) => key);
    const writeKeySet = new Set(writeKeys);
    const narrativeReadKeys: string[] = [];
    if (ownDataField(input, "narrativeAvailable") !== false && ownDataField(input, "narrativeEntries") !== undefined) {
      try {
        const narrativeBudget = new WorkBudget();
        const entries = readOwnArray(ownDataField(input, "narrativeEntries"), narrativeBudget);
        const events: StageActivityEvent[] = [];
        let chars = 0;
        for (let index = 0; index < entries.length; index++) {
          const entry = entries[index];
          if (ownDataField(entry, "runtimeStageId") !== runtimeStageId) continue;
          const rawText = optionalOwnDataField(entry, "text"), type = optionalOwnDataField(entry, "type");
          if (typeof rawText !== "string" || typeof type !== "string") continue;
          if (events.length >= MAX_EVENTS || chars >= MAX_TOTAL_TEXT) { view.coverage.truncated = true; break; }
          const remaining = Math.min(MAX_EVENT_TEXT, MAX_TOTAL_TEXT - chars);
          const text = rawText.length <= remaining ? rawText : `${rawText.slice(0, Math.max(0, remaining - 1))}…`;
          if (text.length < rawText.length) view.coverage.truncated = true;
          chars += text.length;
          const kind: StageActivityEvent["kind"] = type === "condition" || type === "fork" || type === "selector" || type === "branch"
            ? "decision" : type === "error" ? "error" : type === "log" || type === "console" ? "log" : type === "step" ? "step" : "event";
          const key = optionalOwnDataField(entry, "key");
          const step = optionalOwnDataField(entry, "stepNumber");
          // A legacy narrative reports this operation in its own text. It is
          // NOT typed scope-event capture, and a custom renderer stays generic.
          const match = type === "step" && typeof step === "number" && Number.isSafeInteger(step) && step >= 0
            ? new RegExp(`^Step ${step}: (Read|Write|Update|Delete) `).exec(rawText) : null;
          const keyText = typeof key === "string" && key.length > 0 && key.length <= 4_096 ? key : undefined;
          const namedPrefix = match && keyText ? `${match[0]}${keyText}` : undefined;
          const matchesKey = namedPrefix && rawText.startsWith(namedPrefix) &&
            (rawText.length === namedPrefix.length || rawText[namedPrefix.length] === " ");
          const op = matchesKey ? match?.[1]?.toLowerCase() as StageActivityEvent["reportedOperation"] : undefined;
          const event: StageActivityEvent = { id: `narrative:${index}`, kind, source: "narrative", text,
            ...(keyText ? { key: keyText } : {}), ...(op ? { reportedOperation: op } : {}) };
          if (event.key && op === "read") narrativeReadKeys.push(event.key);
          events.push(event);
        }
        view.events = events;
        view.coverage.narrative = events.length ? "recorded" : "none-recorded";
      } catch {
        view.events = []; narrativeReadKeys.length = 0;
        note("Recorded narrative is unavailable for this visit.");
      }
    }
    for (const key of narrativeReadKeys) if (!readSources.has(key)) readSources.set(key, "narrative");
    if (narrativeReadKeys.length) {
      view.coverage.reads = "recorded";
    }
    if (view.events.some(event => event.reportedOperation)) note("Operation labels on narrative steps report the narrative's wording; typed read/write event capture is not supplied.");
    const writtenEarlier = new Set<string>();
    const inStageReadKeys = new Set<string>();
    const postWriteReadEvents = new Set<string>();
    for (const event of view.events) {
      if (!event.key) continue;
      if (["write", "update", "delete"].includes(event.reportedOperation ?? "")) writtenEarlier.add(event.key);
      else if (event.reportedOperation === "read" && writtenEarlier.has(event.key)) {
        inStageReadKeys.add(event.key); postWriteReadEvents.add(event.id);
      }
    }
    if (inStageReadKeys.size) note("A narrative reports reads after an in-stage write. Their read-time values and origins are unresolved; pre-stage history is not substituted.");
    if (readSources.size > MAX_VARIABLES) view.coverage.truncated = true;
    const visibleReads = boundedVariables([...readSources]);

    // Reuse the existing prior-writer lookup once, for one hop over admitted
    // read names. This projection never installs or changes a source tree.
    const sources = buildDataTrace(log.slice(0, current.index + 1), { runtimeStageId, stageReads: Object.fromEntries(visibleReads.map(([key]) => [key, true])) }, runtimeStageId, 1, MAX_VARIABLES + 1);
    const sourceWriters = new Map<string, StageActivityWriter>();
    for (const frame of sources.frames) {
      if (frame.depth !== 1) continue;
      const writer = commitById.get(frame.runtimeStageId);
      if (!writer || writer.index >= current.index) continue;
      for (const key of frame.keysWritten) {
        const previous = sourceWriters.get(key);
        if (!previous || writer.index > previous.commitIdx) sourceWriters.set(key, { runtimeStageId: frame.runtimeStageId, stageName: frame.stageName, commitIdx: writer.index });
      }
    }
    const pathValue = (snapshot: unknown, key: string): InternalValue => {
      if (!snapshot) return { public: unavailableValue() };
      let memory = ownDataField(snapshot, "memory");
      if (!isPlainRecord(memory) && !Array.isArray(memory)) return { public: unavailableValue() };
      const parts = key.split("\u001f");
      if (parts.length > 128) return { public: unavailableValue() };
      try {
        for (const part of parts) {
          if (memory === null || typeof memory !== "object") return { public: { state: "absent", preview: null } };
          if (!isPlainRecord(memory) && !Array.isArray(memory)) return { public: unavailableValue() };
          const descriptor = Object.getOwnPropertyDescriptor(memory, part);
          if (!descriptor) return { public: { state: "absent", preview: null } };
          if (!("value" in descriptor)) return { public: unavailableValue() };
          memory = descriptor.value;
        }
        const preview = memory === undefined ? "undefined" : recordedValuePreview(memory);
        return { public: preview === null ? unavailableValue() : { state: "recorded", preview }, value: memory };
      } catch { return { public: unavailableValue() }; }
    };
    const target = (kind: "read" | "write", key: string): StageActivityTraceTarget => ({ key, kind, runtimeStageId,
      beforeCommitIdx: current.index + (kind === "write" ? 1 : 0), invocationPath: [...path] });
    view.reads = visibleReads.map(([key, source]) => {
      if (inStageReadKeys.has(key)) return { id: `read:${key}`, key, label: keyLabel(key), kind: "read", source,
        value: unavailableValue(), valueLabel: "Read after in-stage write; read-time origin unavailable", change: "unknown", writer: null, traceTarget: null };
      const writer = sourceWriters.get(key) ?? null;
      const snapshot = writer && !ambiguousSnapshots.has(writer.runtimeStageId) ? snapshotsById.get(writer.runtimeStageId) : undefined;
      return { id: `read:${key}`, key, label: keyLabel(key), kind: "read", source,
        value: pathValue(snapshot, key).public, valueLabel: "After prior writer; read-call value not established here", change: "unknown", writer, traceTarget: target("read", key) };
    });
    let previousIndex = current.index - 1;
    while (previousIndex >= 0 && log[previousIndex].bookend) previousIndex--;
    const previousCommit = log[previousIndex];
    const previousSnapshot = previousCommit && !ambiguousSnapshots.has(previousCommit.runtimeStageId) ? snapshotsById.get(previousCommit.runtimeStageId) : undefined;
    view.writes = visibleWriteKeys.map(key => {
      const before = pathValue(previousSnapshot, key), after = pathValue(selected, key);
      let change: StageActivityVariable["change"] = "unknown";
      if (before.public.state === "absent" && after.public.state === "recorded") change = "added";
      else if (before.public.state === "recorded" && after.public.state === "absent") change = "removed";
      else if (before.public.state === "recorded" && after.public.state === "recorded") {
        const primitive = (v: unknown) => v === null || ["undefined", "boolean", "number", "string"].includes(typeof v);
        change = primitive(before.value) && primitive(after.value) ? (Object.is(before.value, after.value) ? "unchanged" : "updated") : "written";
      }
      return { id: `write:${key}`, key, label: keyLabel(key), kind: "write", source: "commit-write", value: after.public,
        valueLabel: "After selected stage", before: before.public, after: after.public, change,
        writer: { runtimeStageId, stageName: current.commit.stage, commitIdx: current.index }, traceTarget: target("write", key) };
    });
    const readIds = new Set(view.reads.map(value => value.id));
    view.events = view.events.map(event => {
      if (postWriteReadEvents.has(event.id)) return event;
      const id = event.key && event.reportedOperation === "read" ? `read:${event.key}`
        : event.key && ["write", "update", "delete"].includes(event.reportedOperation ?? "") && writeKeySet.has(event.key) ? `write:${event.key}` : undefined;
      return id && (readIds.has(id) || view.writes.some(value => value.id === id)) ? { ...event, variableId: id } : event;
    });
    view.decisions = [...view.events.filter(event => event.kind === "decision"), ...treeDecisions];
    view.logs = view.events.filter(event => event.kind === "log");
    if (view.logs.length) view.coverage.logs = "stage-scoped";
    if (view.events.length) note("Narrative sequence is local to this visit, not a global ordering across parallel stages.");
    if (treeDecisions.length) note("Execution-tree branch messages are listed separately; their order relative to narrative steps is not established.");
    note("Writer snapshots and committed changes do not record every intermediate assignment or the exact value of each read call.");
    if (view.coverage.logs === "unavailable") note("No stage-scoped console-log evidence is supplied; run-level logs are not attributed to this visit.");
    if (view.coverage.truncated) note("This view is limited; additional recorded activity may be outside the display limits.");
    return view;
  } catch {
    return fail("The selected stage evidence could not be inspected within its limits.");
  }
}

/** Copy/export uses the same bounded projection shown by the panel. */
export function formatStageActivitySummary(view: StageActivityView): string {
  const label = view.identity.stageLabel;
  const scope = view.identity.invocationPath.length ? view.identity.invocationPath.join(" → ") : "root";
  const lines = [`${label} · ${scope}`, `Visit: ${view.identity.runtimeStageId ?? "unavailable"}`];
  if (!view.availability.ok) return [...lines, view.availability.reason].join("\n");
  lines.push("", "Recorded narrative sequence (within this visit):");
  if (!view.events.length) lines.push("No ordered narrative recorded for this visit.");
  for (const event of view.events) lines.push(`- [${event.source}${event.reportedOperation ? ` reports ${event.reportedOperation}` : ` ${event.kind}`}] ${event.text}`);
  const preview = (value?: StageActivityValue) => value?.state === "recorded" ? value.preview ?? "preview unavailable" : value?.state === "absent" ? "not present" : "unavailable";
  lines.push("", "Recorded state reads:");
  if (!view.reads.length) lines.push(view.coverage.reads === "recorded" ? "No read keys listed; capture completeness is not established." : "Read coverage unknown.");
  for (const read of view.reads) lines.push(`- ${read.label}: ${preview(read.value)} (${read.valueLabel}${read.writer ? `; ${read.writer.stageName} at ${read.writer.runtimeStageId}` : "; prior writer unknown"}; ${read.source})`);
  lines.push("", "Committed state changes:");
  if (!view.writes.length) lines.push("No committed write paths recorded for this visit.");
  for (const write of view.writes) lines.push(`- ${write.label}: ${preview(write.before)} → ${preview(write.after)} (${write.change}; snapshots around this stage)`);
  const treeDecisions = view.decisions.filter(event => event.source === "execution-tree");
  if (treeDecisions.length) lines.push("", "Separate recorded branch messages:", ...treeDecisions.map(event => `- ${event.text}`));
  lines.push("", ...view.notes.map(text => `Note: ${text}`));
  return lines.join("\n");
}
