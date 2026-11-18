import { createContext, memo, useContext, useMemo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { FlowchartRenderer } from "../../model/flowchart";
import { DiagramNodeAppearance } from "../DiagramAppearance";
import { getDiagramNodeGeometry, useDiagramDrawingOptions, type DiagramDrawings } from "../DiagramDrawing";
import { StageNode, type StageNodeData } from "../StageNode";
import { IsometricStageNode } from "./IsometricStageNode";

/** Private to each chart; theme and replay state keep their existing owners. */
export const RendererContext = createContext<FlowchartRenderer>("flat");

function findDrawing(drawings: DiagramDrawings | undefined, name?: string) {
  if (!drawings || !name) return undefined;
  const drawing = Object.getOwnPropertyDescriptor(drawings, name)?.value;
  if (typeof drawing === "function") return drawing as DiagramDrawings[string];
  if (drawing && typeof drawing === "object" && [Symbol.for("react.memo"), Symbol.for("react.forward_ref"),
      Symbol.for("react.lazy")].includes(drawing.$$typeof)) return drawing as DiagramDrawings[string];
  return undefined;
}

/** ReactFlow sees one stable registry component while the scoped drawing changes. */
export const DefaultStageNode = memo(function DefaultStageNode(props: NodeProps) {
  const renderer = useContext(RendererContext);
  const { geometry, drawings } = useDiagramDrawingOptions();
  const shape = useMemo(() => getDiagramNodeGeometry(geometry, props.id), [geometry, props.id]);
  const Drawing = findDrawing(drawings, shape?.drawing);
  const data = props.data as unknown as StageNodeData;
  const artwork = Drawing && shape ? <Drawing id={props.id} data={data} renderer={renderer} geometry={shape} /> : undefined;
  const stage = renderer === "isometric" ? <IsometricStageNode {...props} diagramGeometry={shape} diagramArtwork={artwork} />
    : <StageNode {...props} data={data} diagramGeometry={shape} diagramArtwork={artwork} />;
  return <DiagramNodeAppearance appearance={data.diagramAppearance} unstyled={data.unstyled === true}>
    {stage}
  </DiagramNodeAppearance>;
});
