import { investigationDisplayLimits as limits } from "../../displayAdmission";
import type { DisplayReader, DisplayUsage, DisplayPath } from "../../displayAdmission";
import type { InvestigationRelationshipDisplay, InvestigationTextDisplay } from "./checkTypes";

// Larger than the entire legal retained shape, but bounded independently of the
// display budget. Reserve declared slots before reading their descriptors.
const maxFitItemsPerList = 1_024;
const maxFitInputItems = 65_536;
const maxGapGroups = limits.maxGapsPerList;
const maxReferences = limits.maxReferencesPerList;

type CountKey = "occurrences" | "omittedReferences";
type ReferenceRow = { readonly evidence: readonly string[]; readonly omittedReferences?: number; readonly occurrences?: number };
type Gap = InvestigationTextDisplay["gaps"][number];

export function displayCount(reader: DisplayReader, row: unknown, key: CountKey, path: DisplayPath, minimum: number) {
  const fieldPath: DisplayPath = [...path, key];
  const value = reader.field(row, key, fieldPath);
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum)
    reader.fail("invalid-value", fieldPath);
  return value;
}

export function addCount(reader: DisplayReader, current: number, added: number, path: DisplayPath): number {
  const total = current + added;
  if (!Number.isSafeInteger(total)) reader.fail("invalid-value", path);
  return total;
}

export function references(evidence: readonly string[], omitted = 0): ReferenceRow {
  return { evidence, ...(omitted > 0 && { omittedReferences: omitted }) };
}

export class FitPolicy {
  private rawItems = 0;
  private retainedGapRows = 0;

  constructor(private readonly reader: DisplayReader) {}

  private rawLength(value: unknown, path: DisplayPath): number {
    if (!Array.isArray(value)) this.reader.fail("invalid-value", path);
    const length = this.reader.field(value, "length", [...path, "length"]);
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0)
      this.reader.fail("invalid-value", path);
    if (length > maxFitItemsPerList)
      this.reader.fail("limit-exceeded", path, { limit: "maxFitItemsPerList", maximum: maxFitItemsPerList, observed: length });
    this.rawItems += length;
    if (this.rawItems > maxFitInputItems)
      this.reader.fail("limit-exceeded", path, { limit: "maxFitInputItems", maximum: maxFitInputItems, observed: this.rawItems });
    return length;
  }

  evidence(value: unknown, path: DisplayPath, previous = 0): ReferenceRow {
    const length = this.rawLength(value, path);
    const evidence: string[] = [];
    let retain = true;
    for (let index = 0; index < length; index++) {
      const itemPath: DisplayPath = [...path, index];
      const text = this.reader.field(value, String(index), itemPath);
      if (typeof text !== "string" || text.length === 0) this.reader.fail("invalid-value", itemPath);
      if (index >= maxReferences || text.length > limits.maxStringCodeUnits) retain = false;
      if (retain) evidence.push(text);
    }
    return references(evidence, addCount(this.reader, previous, length - evidence.length,
      [...path.slice(0, -1), "omittedReferences"]));
  }

  gaps(value: unknown, path: DisplayPath, parse: (row: unknown, at: DisplayPath, chargeNode: boolean) => Gap): Gap[] {
    const length = this.rawLength(value, path);
    const merge = length > maxGapGroups;
    const groups = new Map<string, number>();
    const result: Gap[] = [];
    for (let index = 0; index < length; index++) {
      const rowPath: DisplayPath = [...path, index];
      const gap = parse(this.reader.field(value, String(index), rowPath), rowPath, !merge);
      if (!merge) {
        result.push(gap);
        continue;
      }
      const identity = JSON.stringify([gap.code, gap.nodeId]);
      const existing = groups.get(identity);
      if (existing !== undefined) {
        result[existing] = this.mergeGap(result[existing]!, gap, rowPath);
        continue;
      }
      if (groups.size === maxGapGroups)
        this.reader.fail("limit-exceeded", path, { limit: "maxGapsPerList", maximum: maxGapGroups, observed: groups.size + 1 });
      if (gap.nodeId !== undefined)
        this.reader.countText(gap.nodeId.length, [...rowPath, "nodeId"], limits.maxStringCodeUnits, "maxStringCodeUnits");
      groups.set(identity, result.length);
      result.push(gap);
    }
    this.retainedGapRows += result.length;
    return result;
  }

  private mergeGap(first: Gap, next: Gap, path: DisplayPath): Gap {
    const room = maxReferences - first.evidence.length;
    const added = next.evidence.slice(0, room);
    const countPath: DisplayPath = [...path, "omittedReferences"];
    const earlierOmissions = addCount(this.reader, first.omittedReferences ?? 0, next.omittedReferences ?? 0, countPath);
    const omitted = addCount(this.reader, earlierOmissions, next.evidence.length - added.length, countPath);
    const occurrences = addCount(this.reader, first.occurrences ?? 1, next.occurrences ?? 1, [...path, "occurrences"]);
    return { code: first.code, ...(first.nodeId !== undefined && { nodeId: first.nodeId }),
      ...references([...first.evidence, ...added], omitted), occurrences };
  }

  finish(input: InvestigationRelationshipDisplay, usage: DisplayUsage) {
    const budget = new ReferenceBudget(this.reader, usage.textCodeUnits);
    const attention = input.attention.map(budget.retain);
    const gaps = input.gaps.map(budget.retain);
    const backwardGaps = input.backward?.gaps.map(budget.retain);
    const impactGaps = input.impact.gaps.map(budget.retain);
    const backwardEdges = input.backward?.edges.map(budget.retain);
    const impactEdges = input.impact.edges?.map(budget.retain);
    const value: InvestigationRelationshipDisplay = {
      ...input, attention, gaps,
      ...(input.backward && { backward: { ...input.backward, gaps: backwardGaps!, edges: backwardEdges! } }),
      impact: { ...input.impact, gaps: impactGaps, ...(impactEdges && { edges: impactEdges }) },
    };
    return {
      value,
      usage: Object.freeze({
        textCodeUnits: budget.textCodeUnits,
        listItems: usage.listItems + this.retainedGapRows + budget.listItems,
      }),
      omittedReferences: budget.omittedReferences,
    };
  }
}

class ReferenceBudget {
  listItems = 0;
  omittedReferences = 0;
  private exhausted = false;

  constructor(private readonly reader: DisplayReader, public textCodeUnits: number) {}

  retain = <T extends ReferenceRow>(row: T): T => {
    let kept = 0;
    for (const reference of row.evidence) {
      if (this.exhausted || reference.length > limits.maxTextCodeUnits - this.textCodeUnits) {
        this.exhausted = true;
        break;
      }
      kept++;
      this.textCodeUnits += reference.length;
    }
    this.listItems += kept;
    const path: DisplayPath = ["omittedReferences"];
    const omitted = addCount(this.reader, row.omittedReferences ?? 0, row.evidence.length - kept, path);
    this.omittedReferences = addCount(this.reader, this.omittedReferences, omitted, path);
    if (kept === row.evidence.length) return row;
    const { occurrences, ...fields } = row;
    // Keep the same field order as admission, including a first cut on a merged gap.
    return { ...fields, ...references(row.evidence.slice(0, kept), omitted),
      ...(occurrences !== undefined && { occurrences }) } as T;
  };
}
