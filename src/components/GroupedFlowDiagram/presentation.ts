import { createContext } from "react";
import type { GroupedFlowDiagramModel } from "./types";

/** Internal composition seam. It affects paint only, never graph membership or evidence. */
export const RecordedFocusContext = createContext<{ readonly focused: boolean; readonly fitNodeIds?: readonly string[] }>({ focused: false });

/** Camera containment only. A visible group proxy never becomes the cause or evidence owner. */
export function visibleRecordedFitTargets(ids: readonly string[], model: GroupedFlowDiagramModel): readonly string[] | undefined {
  if (ids.length > 512) return undefined;
  const declared = new Map(model.definition.nodes.map(node => [node.id, node])), visible = new Set(model.nodes.map(item => item.node.id)), result = new Set<string>();
  for (const id of ids) {
    if (!declared.has(id)) return undefined;
    let target = id, depth = 0;
    while (!visible.has(target)) {
      if (depth++ >= 16) return undefined;
      const parent = declared.get(target)?.parentId;
      if (parent === undefined || !declared.has(parent)) return undefined;
      target = parent;
    }
    result.add(target);
  }
  return [...result];
}
