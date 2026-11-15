import type { StageSnapshot } from "../types";
import { isPlainRecord, ownDataField, WorkBudget } from "../trace/safeRecordRead";

type KeyedSteps = { steps: Record<string, Record<string, unknown>>; keyType: "runtimeStageId" | "stageName" };

/** Prefer the documented step table; retain shape detection for custom recorders. */
export function detectKeyedSteps(data: unknown): KeyedSteps | null {
  try {
    if (!isPlainRecord(data)) return null;
    const budget = new WorkBudget();
    const fields = Object.keys(data); budget.spend(fields.length);
    const candidates = [...new Set(["steps", "stages", ...fields])];
    for (const field of candidates) {
      const value = ownDataField(data, field);
      if (!isPlainRecord(value)) continue;
      const keys = Object.keys(value); budget.spend(keys.length);
      if (!keys.length) continue;
      const rows = keys.map(key => ownDataField(value, key));
      if (!rows.every(isPlainRecord)) continue;
      const numericRows = rows.every(row => {
        const rowFields = Object.keys(row); budget.spend(rowFields.length);
        return rowFields.some(key => typeof ownDataField(row, key) === "number");
      });
      // An explicit table with unavailable values is still a table. Its cells
      // must say unavailable rather than disappear into an unrelated JSON view.
      if (field !== "steps" && field !== "stages" && !numericRows) continue;
      return { steps: value as KeyedSteps["steps"], keyType: keys.some(key => key.includes("#")) ? "runtimeStageId" : "stageName" };
    }
  } catch { /* Unreadable recorder data has no admitted table. */ }
  return null;
}

/** The selected field and an optional source-wide total are separate hints. */
export function extractRenderHints(data: unknown): { numericField: string; grandTotal: number | null } | null {
  const numericField = ownDataField(data, "numericField");
  if (typeof numericField !== "string" || !numericField.length || numericField.length > 1_024) return null;
  const total = ownDataField(data, "grandTotal");
  return { numericField, grandTotal: typeof total === "number" && Number.isFinite(total) ? total : null };
}

/** Map internal recorder names to user-facing Insight names. */
export function insightName(name: string): string {
  const map: Record<string, string> = {
    Narrative: "Run log", Memory: "State", Metrics: "Metrics", Quality: "Quality", Cost: "Cost",
  };
  return Object.prototype.hasOwnProperty.call(map, name) ? map[name] : name;
}

export interface RecorderMetricColumn {
  key: string;
  label: string;
  kind: "duration" | "count" | "number";
  /** Only known counts and durations have a meaningful Metrics-mode sum. */
  additive: boolean;
}

export function recorderMetricColumn(key: string): RecorderMetricColumn {
  const labels: Record<string, string> = {
    duration: "Duration (ms)", durationMs: "Duration (ms)", readCount: "Reads", writeCount: "Writes",
    commitCount: "Commits", pauseCount: "Pauses",
  };
  const duration = key === "duration" || key === "durationMs";
  const count = /Count$/.test(key);
  const label = Object.prototype.hasOwnProperty.call(labels, key) ? labels[key]
    : key.replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, letter => letter.toUpperCase());
  return { key, label, kind: duration ? "duration" : count ? "count" : "number", additive: duration || count };
}

/** Strings, missing cells and non-finite values are unknown, never zero. */
export function readRecorderNumber(row: unknown, key: string): number | null {
  const value = ownDataField(row, key);
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return recorderMetricColumn(key).additive && value < 0 ? null : value;
}

function sumRecordedField(steps: KeyedSteps["steps"], entries: readonly string[], field: string): number | null {
  if (!entries.length || !field) return null;
  let total = 0;
  for (const key of entries) {
    const value = readRecorderNumber(ownDataField(steps, key), field);
    if (value === null || !Number.isFinite(total + value)) return null;
    total += value;
  }
  return total;
}

/** Project one invocation's recorder rows without borrowing a source-wide total. */
export function projectKeyedRecorder(data: unknown, detected: KeyedSteps | null, snapshots: StageSnapshot[], selectedIndex: number) {
  if (!detected) return null;
  const byKey = new Map<string, number[]>();
  for (let index = 0; index < snapshots.length; index++) {
    const snapshot = snapshots[index];
    const candidates = detected.keyType === "runtimeStageId"
      ? [snapshot.runtimeStageId] : [...new Set([snapshot.stageName, snapshot.stageLabel])];
    for (const key of candidates) {
      if (typeof key !== "string" || !key) continue;
      const indices = byKey.get(key) ?? []; indices.push(index); byKey.set(key, indices);
    }
  }
  const hints = extractRenderHints(data);
  const numFieldKey = hints?.numericField ?? "";
  const allKeys = Object.keys(detected.steps);
  const aliasesByIndex = new Map<number, number>();
  for (const key of allKeys) {
    const indices = byKey.get(key);
    if (indices?.length === 1) aliasesByIndex.set(indices[0], (aliasesByIndex.get(indices[0]) ?? 0) + 1);
  }
  const unambiguous = (key: string) => {
    const indices = byKey.get(key);
    return indices?.length === 1 && aliasesByIndex.get(indices[0]) === 1;
  };
  // A plain name may aggregate invocations outside the active rail. It has
  // no witness tying its value to this invocation, even if locally unique.
  const scopeEntries = allKeys.filter(key => detected.keyType === "runtimeStageId" && unambiguous(key))
    .sort((left, right) => byKey.get(left)![0] - byKey.get(right)![0]);
  const visibleEntries = scopeEntries.filter(key => byKey.get(key)![0] <= selectedIndex);
  const selectedEntryKey = scopeEntries.find(key => byKey.get(key)![0] === selectedIndex) ?? null;
  const fields = new Set<string>();
  const unscopedEntries = detected.keyType === "stageName" ? allKeys : [];
  for (const key of detected.keyType === "stageName" ? unscopedEntries : scopeEntries) {
    const row = ownDataField(detected.steps, key);
    if (!isPlainRecord(row)) continue;
    for (const field of Object.keys(row)) {
      const value = ownDataField(row, field);
      if (typeof value === "number" || recorderMetricColumn(field).additive) fields.add(field);
    }
  }
  if (numFieldKey) fields.add(numFieldKey);
  const preferred = ["duration", "durationMs", "readCount", "writeCount", "commitCount", "pauseCount"];
  const columns = [...fields].sort((left, right) => {
    const l = preferred.indexOf(left), r = preferred.indexOf(right);
    return (l < 0 ? preferred.length : l) - (r < 0 ? preferred.length : r);
  }).map(recorderMetricColumn);
  const totals = (entries: readonly string[]) => Object.fromEntries(columns.map(column =>
    [column.key, column.additive ? sumRecordedField(detected.steps, entries, column.key) : null]));
  const runningTotal = sumRecordedField(detected.steps, visibleEntries, numFieldKey);
  const currentScopeTotal = sumRecordedField(detected.steps, scopeEntries, numFieldKey);
  return {
    steps: detected.steps, keyType: detected.keyType, numFieldKey, allKeys, scopeEntries, visibleEntries, unscopedEntries,
    selectedEntryKey, runningTotal, currentScopeTotal,
    // Retain the old internal field name with corrected, scope-local meaning.
    grandTotal: currentScopeTotal,
    recordedGrandTotal: hints?.grandTotal ?? null,
    columns, visibleTotals: totals(visibleEntries), currentScopeTotals: totals(scopeEntries),
    unmatchedCount: allKeys.length - scopeEntries.length,
    ambiguousCount: allKeys.filter(key => byKey.has(key) && !unambiguous(key)).length,
    isAtEnd: snapshots.length > 0 && selectedIndex >= snapshots.length - 1,
  };
}
