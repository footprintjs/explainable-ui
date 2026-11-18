/** The host supplies one current set of facts keyed by the chart's actual IDs. */
export interface DiagramAppearance {
  readonly nodes?: Readonly<Record<string, DiagramObjectAppearance>>;
  readonly edges?: Readonly<Record<string, DiagramObjectAppearance>>;
}

export interface DiagramProgress {
  readonly completed: number;
  readonly total: number;
  readonly unit?: string;
}

export interface DiagramObjectAppearance {
  readonly activity?: "creating" | "updating" | "removing";
  readonly presence?: "present" | "removed";
  readonly progress?: DiagramProgress;
  readonly health?: string;
}

function own(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function measuredProgress(value: unknown): DiagramProgress | undefined {
  const completed = own(value, "completed"), total = own(value, "total");
  if (typeof completed !== "number" || !Number.isFinite(completed) || completed < 0 ||
      typeof total !== "number" || !Number.isFinite(total) || total <= 0 || completed > total) return undefined;
  const unit = text(own(value, "unit"));
  return { completed, total, ...(unit && { unit }) };
}

/** Copy recognized own data fields. A missing measurement leaves the other facts intact. */
export function readDiagramObjectAppearance(value: unknown): DiagramObjectAppearance | undefined {
  if (!value || typeof value !== "object") return undefined;
  const activity = own(value, "activity"), presence = own(value, "presence");
  const progress = measuredProgress(own(value, "progress")), health = text(own(value, "health"));
  const result: DiagramObjectAppearance = {
    ...(activity === "creating" || activity === "updating" || activity === "removing" ? { activity } : {}),
    ...(presence === "present" || presence === "removed" ? { presence } : {}),
    ...(progress && { progress }),
    ...(health && { health }),
  };
  return Object.keys(result).length ? result : undefined;
}

/** An SVG route or renderer can receive ordinary xyflow data directly. */
export function appearanceFromData(data: unknown): DiagramObjectAppearance | undefined {
  return readDiagramObjectAppearance(own(data, "diagramAppearance"));
}

type ElementWithData = { readonly id: string; readonly data?: Record<string, unknown> };

/** Attach the complete current presentation, leaving unannotated graph entries referentially stable. */
export function applyDiagramAppearance<T extends ElementWithData>(
  elements: T[], byId?: Readonly<Record<string, DiagramObjectAppearance>>,
): T[] {
  if (byId === undefined) return elements;
  let projected: T[] | undefined;
  elements.forEach((element, index) => {
    const next = readDiagramObjectAppearance(own(byId, element.id));
    if (!next && (!element.data || !Object.prototype.hasOwnProperty.call(element.data, "diagramAppearance"))) return;
    const data = { ...element.data };
    if (next) data.diagramAppearance = next;
    else delete data.diagramAppearance;
    projected ??= elements.slice();
    projected[index] = { ...element, data };
  });
  return projected ?? elements;
}

const activityLabels = { creating: "Creating", updating: "Updating", removing: "Removing" } as const;
export function appearanceLabel(appearance: DiagramObjectAppearance): string {
  const { activity, presence, progress, health } = appearance;
  return [
    activity && activityLabels[activity],
    presence === "removed" && "Removed",
    progress && `${progress.completed} of ${progress.total}${progress.unit ? ` ${progress.unit}` : ""}`,
    health && `Health · ${health}`,
  ].filter(Boolean).join(" · ");
}
