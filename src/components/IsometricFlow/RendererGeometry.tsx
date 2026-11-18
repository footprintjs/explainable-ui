import { useEffect, useRef } from "react";
import { useUpdateNodeInternals } from "@xyflow/react";
import type { FlowchartRenderer } from "../../model/flowchart";
import { getDiagramNodeGeometry, useDiagramDrawingOptions } from "../DiagramDrawing";

/** XYFlow's resize observer cannot see ports moving inside an unchanged outer box. */
export function RendererGeometry({ renderer, nodeIds }: { renderer: FlowchartRenderer; nodeIds: readonly string[] }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const { geometry } = useDiagramDrawingOptions();
  const ids = JSON.stringify(nodeIds);
  const previous = useRef({ renderer, ports: new Map<string, string>() });
  useEffect(() => {
    const prior = previous.current;
    if (renderer === "flat" && prior.renderer === renderer && !geometry && prior.ports.size === 0) return;
    const ports = new Map<string, string>();
    const changed: string[] = [];
    for (const id of JSON.parse(ids) as string[]) {
      const shape = getDiagramNodeGeometry(geometry, id);
      const signature = shape ? [shape.width, shape.height, shape.source.x, shape.source.y,
        shape.target.x, shape.target.y].join(",") : renderer === "isometric" ? "stock" : undefined;
      if (signature !== undefined) ports.set(id, signature);
      if (renderer !== prior.renderer || prior.ports.get(id) !== signature) changed.push(id);
    }
    previous.current = { renderer, ports };
    if (changed.length && typeof window !== "undefined" && typeof window.DOMMatrixReadOnly === "function") updateNodeInternals(changed);
  }, [renderer, ids, geometry, updateNodeInternals]);
  return null;
}
