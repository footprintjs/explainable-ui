/** Shared presentation only. These sentences never discover causes or origins. */
import type { TraceStop, TraceWalk } from "./traceWalk";

export const unknownIngredientText = "no earlier recorded writer; origin unknown";
export const noIngredientsText = "No earlier dependencies are established by the captured reads.";

export function missingTraceText(walk: TraceWalk, stepOf: (id: string) => number | null): string {
  const missing = walk.missing;
  if (missing?.reason !== "not-yet-written") return `No recorded writer for \`${walk.key}\` in this source range; its origin is unknown.`;
  const step = missing.firstWriterRuntimeStageId ? stepOf(missing.firstWriterRuntimeStageId) : null;
  return `No recorded writer for \`${walk.key}\` before this moment — its first recorded write is later` +
    (missing.firstWriterStageName ? `, at ${missing.firstWriterStageName}${step ? ` (step ${step})` : ""}.` : ".") +
    " This is a separately checked whole-record hint.";
}

export function contributionPositionText(stop: TraceStop): string | undefined {
  const writes = stop.contributedWrites;
  if (!writes?.length || writes.every(write => write.commitIdx === stop.commitIdx && write.commitIdx === stop.readCommitIdx)) return undefined;
  return `Execution visit at record row ${stop.readCommitIdx ?? stop.commitIdx}; actual contributions: ${writes.map(write => `${write.key} at row ${write.commitIdx}`).join(", ")}. Record rows are zero-based; the grouped rail visit may show a different moment.`;
}

export function contributionBasisText(stop: TraceStop): string | undefined {
  const notes: string[] = [];
  const qualified = stop.contributedWrites?.filter(write => write.valueBasis?.length);
  if (qualified?.length) notes.push(`Value preview qualified: ${qualified.map(write => `${write.key} (${write.valueBasis!.join(", ")})`).join("; ")}. No exact value is asserted for these contributions.`);
  if (qualified?.some(write => write.valueBasis?.includes("deleted"))) notes.push("The deleted code denotes a deleted/undefined value (record convention), not a claim about physical property presence.");
  const repeated = stop.contributedKeys.filter(key => (stop.contributedWrites?.filter(write => write.key === key).length ?? 0) > 1);
  if (repeated.length) notes.push(`Multiple recorded writer rows contribute ${repeated.join(", ")}; a single value preview would be ambiguous.`);
  return notes.length ? notes.join(" ") : undefined;
}
