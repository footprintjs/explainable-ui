import type { StageSnapshot } from "../types";

/**
 * Detects if data has a keyed-recorder shape: an object property whose values
 * are objects with at least one numeric field. Returns { steps, keyType }.
 * keyType: 'runtimeStageId' (keys contain '#') or 'stageName' (plain names).
 */
export function detectKeyedSteps(data: unknown): { steps: Record<string, Record<string, unknown>>; keyType: "runtimeStageId" | "stageName" } | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const entries = Object.entries(val as Record<string, unknown>);
      if (entries.length === 0) continue;
      // Check: values must be objects with at least one numeric field
      const allObjectsWithNumbers = entries.every(([, v]) => {
        if (!v || typeof v !== "object" || Array.isArray(v)) return false;
        return Object.values(v as Record<string, unknown>).some((f) => typeof f === "number");
      });
      if (allObjectsWithNumbers) {
        const keyType = entries.some(([k]) => k.includes("#")) ? "runtimeStageId" : "stageName";
        return { steps: val as Record<string, Record<string, unknown>>, keyType };
      }
    }
  }
  return null;
}

/** Extract render hints from recorder data: numericField name + grandTotal. */
export function extractRenderHints(data: unknown): { numericField: string; grandTotal: number } | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.numericField === "string" && typeof obj.grandTotal === "number") {
    return { numericField: obj.numericField, grandTotal: obj.grandTotal };
  }
  return null;
}


/** Map internal recorder names to user-facing Insight names. */
export function insightName(name: string): string {
  const map: Record<string, string> = {
    "Narrative": "Story",
    "Memory": "State",
    "Metrics": "Performance",
    "Quality": "Quality",
    "Cost": "Cost",
  };
  return map[name] ?? name;
}

/** Derive recorder display data without owning React state or layout. */
export function projectKeyedRecorder(data: unknown, detected: ReturnType<typeof detectKeyedSteps>, snapshots: StageSnapshot[], selectedIndex: number) {
  if (!detected) return null;
  const visibleKeys = new Set<string>();
  for (let index = 0; index <= selectedIndex && index < snapshots.length; index++) {
    const snapshot = snapshots[index];
    if (detected.keyType === "runtimeStageId") {
      if (snapshot.runtimeStageId) visibleKeys.add(snapshot.runtimeStageId);
    } else {
      if (snapshot.stageName) visibleKeys.add(snapshot.stageName);
      if (snapshot.stageLabel) visibleKeys.add(snapshot.stageLabel);
    }
  }
  const hints = extractRenderHints(data);
  const numFieldKey = hints?.numericField ?? "";
  const allKeys = Object.keys(detected.steps);
  const visibleEntries = allKeys.filter(key => visibleKeys.has(key));
  let runningTotal = 0;
  if (numFieldKey) {
    for (const key of visibleEntries) runningTotal += (detected.steps[key][numFieldKey] as number) ?? 0;
  }
  return {
    steps: detected.steps, numFieldKey, allKeys, visibleEntries, runningTotal,
    grandTotal: hints?.grandTotal ?? 0,
    isAtEnd: selectedIndex >= snapshots.length - 1,
  };
}
