import { resolveProgressiveRenderingOptions } from "../progressiveRendering";
import type { ProgressiveRenderingOptions } from "../progressiveRendering";
/** JSON layout for the existing Lens surfaces; validation also works during SSR. */
import { resolveFlowchartOptions, type FlowchartOptions } from "./flowchart";
export type LensLayoutSurface =
  | "timeTravel"
  | "flowchart"
  | "developer"
  | "commentary"
  | "timeline"
  | "details";

export interface LensLayoutDefinition {
  readonly columns: string;
  readonly rows?: string;
  readonly areas: readonly (readonly (LensLayoutSurface | ".")[])[];
  readonly minHeight?: number | string;
  readonly gap?: number | string;
  /** Optional built-in geometry; an explicit Shell flowchart prop takes precedence. */
  readonly flowchart?: FlowchartOptions;
  readonly rendering?: ProgressiveRenderingOptions;
}

const SURFACES: ReadonlySet<string> = new Set([
  "timeTravel", "flowchart", "developer", "commentary", "timeline", "details",
]);
const MAX_AXIS = 16;
const MAX_CSS_LENGTH = 1_024;

function invalid(reason: string): never {
  throw new Error(`Invalid Lens layout: ${reason}`);
}

function own(value: object, key: PropertyKey): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (descriptor && !("value" in descriptor)) invalid(`${String(key)} must be plain data.`);
  return descriptor?.value;
}

function array(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) invalid(`${label} must be an array.`);
  const length = own(value, "length") as number;
  if (length === 0 || length > MAX_AXIS) invalid(`${label} must contain 1–${MAX_AXIS} entries.`);
  const result: unknown[] = [];
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    if (!descriptor) invalid(`${label} must not contain holes.`);
    if (!("value" in descriptor)) invalid(`${label} cells must be plain data.`);
    result.push(descriptor.value);
  }
  return result;
}

/** Bound configuration text; the browser owns CSS syntax, including future syntax. */
function css(value: unknown, label: string): void {
  if (typeof value !== "string" || !value.trim() || value.length > MAX_CSS_LENGTH)
    invalid(`${label} must be a nonempty CSS string of at most ${MAX_CSS_LENGTH} characters.`);
}

function size(value: unknown, label: string): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) invalid(`${label} must be finite and nonnegative.`);
  } else css(value, label);
}

/** Read configuration once into an owned copy; renderers never need the raw input. @internal */
export function resolveLensLayout(layout: unknown): {
  definition: LensLayoutDefinition;
  order: LensLayoutSurface[];
} {
  if (!layout || typeof layout !== "object" || Array.isArray(layout) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(layout))) invalid("expected a plain object.");
  const columns = own(layout, "columns");
  css(columns, "columns");
  const rows = own(layout, "rows");
  if (rows !== undefined) css(rows, "rows");
  const minHeight = own(layout, "minHeight"), gap = own(layout, "gap");
  const rawRendering = own(layout, "rendering");
  const rendering = rawRendering === undefined ? undefined : resolveProgressiveRenderingOptions(rawRendering);
  const rawFlowchart = own(layout, "flowchart");
  const flowchart = rawFlowchart === undefined ? undefined : resolveFlowchartOptions(rawFlowchart);
  if (minHeight !== undefined) size(minHeight, "minHeight");
  if (gap !== undefined) size(gap, "gap");
  const matrix = array(own(layout, "areas"), "areas").map((row, index) => array(row, `areas[${index}]`));
  const width = matrix[0].length;
  const bounds = new Map<LensLayoutSurface, { top: number; bottom: number; left: number; right: number; count: number }>();
  for (const [rowIndex, row] of matrix.entries()) {
    if (row.length !== width) invalid("area rows must have equal lengths.");
    for (const [columnIndex, cell] of row.entries()) {
      if (cell === ".") continue;
      if (typeof cell !== "string" || !SURFACES.has(cell)) invalid("areas contain an unknown surface.");
      const name = cell as LensLayoutSurface;
      const previous = bounds.get(name);
      bounds.set(name, previous ? {
        top: previous.top, bottom: rowIndex, left: Math.min(previous.left, columnIndex),
        right: Math.max(previous.right, columnIndex), count: previous.count + 1,
      } : { top: rowIndex, bottom: rowIndex, left: columnIndex, right: columnIndex, count: 1 });
    }
  }
  if (!bounds.has("timeTravel") || !bounds.has("flowchart")) invalid("timeTravel and flowchart areas are required.");
  if (bounds.has("details") && (bounds.has("developer") || bounds.has("commentary")))
    invalid("details cannot coexist with developer or commentary areas.");
  for (const [name, bound] of bounds) {
    if (bound.count !== (bound.bottom - bound.top + 1) * (bound.right - bound.left + 1))
      invalid(`${name} must fill one rectangle.`);
  }
  return {
    definition: {
      columns: columns as string,
      rows: rows as string | undefined,
      areas: matrix as (LensLayoutSurface | ".")[][],
      minHeight: minHeight as number | string | undefined,
      gap: gap as number | string | undefined,
      ...(flowchart !== undefined && { flowchart }),
      ...(rendering !== undefined && { rendering }),
    },
    order: [...bounds.keys()],
  };
}

/** Validate the small layout language, without executing stored getters or CSS. */
export function validateLensLayout(layout: unknown): asserts layout is LensLayoutDefinition {
  resolveLensLayout(layout);
}

/** Stable DOM order: first appearance in the validated, row-major area matrix. */
export function lensLayoutSurfaceOrder(layout: LensLayoutDefinition): LensLayoutSurface[] {
  return resolveLensLayout(layout).order;
}
