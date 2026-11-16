import { useEffect, useRef } from "react";
import { useUpdateNodeInternals } from "@xyflow/react";
import type { FlowchartRenderer } from "../../model/flowchart";

/** Switching renderers moves native handles even when a host fixes the same outer box. */
export function RendererGeometry({ renderer, nodeIds }: { renderer: FlowchartRenderer; nodeIds: readonly string[] }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const ids = JSON.stringify(nodeIds);
  const previous = useRef(renderer);
  useEffect(() => {
    const switched = previous.current !== renderer;
    previous.current = renderer;
    if (typeof window !== "undefined" && typeof window.DOMMatrixReadOnly === "function" && (switched || renderer === "isometric"))
      updateNodeInternals(JSON.parse(ids) as string[]);
  }, [renderer, ids, updateNodeInternals]);
  return null;
}
