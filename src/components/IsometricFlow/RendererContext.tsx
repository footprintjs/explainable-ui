import { createContext, memo, useContext } from "react";
import type { NodeProps } from "@xyflow/react";
import type { FlowchartRenderer } from "../../model/flowchart";
import { StageNode, type StageNodeData } from "../StageNode";
import { IsometricStageNode } from "./IsometricStageNode";

/** Private to each chart; theme and replay state keep their existing owners. */
export const RendererContext = createContext<FlowchartRenderer>("flat");

/** ReactFlow sees one stable registry component while the scoped drawing changes. */
export const DefaultStageNode = memo(function DefaultStageNode(props: NodeProps) {
  const renderer = useContext(RendererContext);
  return renderer === "isometric" ? <IsometricStageNode {...props} />
    : <StageNode {...props} data={props.data as unknown as StageNodeData} />;
});
