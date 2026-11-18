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

function sameAppearance(left: DiagramObjectAppearance | undefined, right: DiagramObjectAppearance | undefined) {
  return left === right || (!!left && !!right &&
    left.activity === right.activity && left.presence === right.presence && left.health === right.health &&
    left.progress?.completed === right.progress?.completed && left.progress?.total === right.progress?.total &&
    left.progress?.unit === right.progress?.unit);
}

/** A recorded delta names its predecessor without keeping the previous frame alive. */
interface RecordedFrame {
  readonly scope: object;
  readonly sequence: number;
  readonly changedIds?: ReadonlySet<string>;
}
const recordedFrames = new WeakMap<object, RecordedFrame>();
export function markRecordedFrame(frame: Readonly<Record<string, DiagramObjectAppearance>>, change: RecordedFrame) {
  recordedFrames.set(frame, change);
}

/** Each chart retains the last normalized appearance for each immutable base element. */
export function createDiagramAppearanceProjector<T extends ElementWithData>() {
  const cache = new WeakMap<T, { raw: unknown; appearance?: DiagramObjectAppearance; output: T; scope?: object }>();
  let previous: T[] | undefined;
  let previousBase: T[] | undefined;
  let previousFrame: RecordedFrame | undefined;
  // A duplicate ID cannot use a single-slot index. Direct consumers still get
  // the same complete projection for every matching occurrence in that case.
  let positions: Map<string, number> | null | undefined;

  function project(element: T, raw: unknown, scope?: object): T {
    const hasBaseAppearance = element.data && Object.prototype.hasOwnProperty.call(element.data, "diagramAppearance");
    if (raw === undefined && !hasBaseAppearance) return element;
    const last = cache.get(element);
    if (scope && last?.scope === scope && last.raw === raw) return last.output;
    // A live producer can reuse a mutable fact object in a freshly published map.
    const appearance = readDiagramObjectAppearance(raw);
    let output = element;
    if (last && sameAppearance(last.appearance, appearance)) {
      output = last.output;
    } else if (appearance || hasBaseAppearance) {
      const data = { ...element.data };
      if (appearance) data.diagramAppearance = appearance;
      else delete data.diagramAppearance;
      output = { ...element, data };
    }
    cache.set(element, { raw, appearance, output, scope });
    return output;
  }

  return (elements: T[], byId?: Readonly<Record<string, DiagramObjectAppearance>>): T[] => {
    const sameBase = previousBase === elements;
    if (!sameBase) positions = undefined;
    previousBase = elements;
    const priorFrame = previousFrame;
    const frame = byId && recordedFrames.get(byId);
    previousFrame = frame;
    if (byId === undefined) return (previous = elements);
    if (sameBase && previous && frame && frame === priorFrame) return previous;

    let projected: T[] | undefined;
    const baseline = previous?.length === elements.length ? previous : elements;
    function update(i: number) {
      const element = elements[i];
      const output = project(element, own(byId, element.id), frame?.scope);
      if (output !== baseline[i]) {
        projected ??= baseline.slice();
        projected[i] = output;
      }
    }
    if (sameBase && previous && frame?.changedIds && priorFrame?.scope === frame.scope &&
        frame.sequence === priorFrame.sequence + 1) {
      if (positions === undefined) {
        positions = new Map(elements.map((element, i) => [element.id, i]));
        if (positions.size !== elements.length) positions = null;
      }
      if (positions) {
        for (const id of frame.changedIds) {
          const i = positions.get(id);
          if (i !== undefined) update(i);
        }
        return (previous = projected ?? baseline);
      }
    }
    // A new geometry, a missed frame, or ordinary live input is a complete frame.
    for (let i = 0; i < elements.length; i++) update(i);
    return (previous = projected ?? baseline);
  };
}

export function applyDiagramAppearance<T extends ElementWithData>(
  elements: T[], byId?: Readonly<Record<string, DiagramObjectAppearance>>,
): T[] {
  return createDiagramAppearanceProjector<T>()(elements, byId);
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
