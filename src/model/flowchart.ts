/** Geometry is independent of theme, replay position and panel arrangement. */
export type FlowchartRenderer = "flat" | "isometric";

export interface FlowchartOptions {
  readonly renderer?: FlowchartRenderer;
}

export function resolveFlowchartRenderer(value: unknown): FlowchartRenderer {
  if (value === undefined) return "flat";
  if (value !== "flat" && value !== "isometric")
    throw new Error('Invalid flowchart options: renderer must be "flat" or "isometric".');
  return value;
}

/** Copy plain configuration without invoking stored accessors. @internal */
export function resolveFlowchartOptions(value: unknown): FlowchartOptions {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    throw new Error("Invalid flowchart options: expected a plain object.");
  const descriptor = Object.getOwnPropertyDescriptor(value, "renderer");
  if (descriptor && !("value" in descriptor))
    throw new Error("Invalid flowchart options: renderer must be plain data.");
  return descriptor?.value === undefined ? {} : { renderer: resolveFlowchartRenderer(descriptor.value) };
}
