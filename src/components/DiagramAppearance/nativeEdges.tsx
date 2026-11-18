import type { ComponentType } from "react";
import {
  BezierEdge, SimpleBezierEdge, SmoothStepEdge, StepEdge, StraightEdge,
  getBezierPath, getSimpleBezierPath, getSmoothStepPath, getStraightPath,
  type EdgeProps, type EdgeTypes,
} from "@xyflow/react";
import { StockEdgeAppearance } from "./StockAppearance";
import { appearanceFromData } from "./model";

type NativeEdgeProps = Omit<EdgeProps, "id"> & { id?: string };

function withAppearance(Native: ComponentType<NativeEdgeProps>, pathFor: (props: EdgeProps) => string) {
  return function NativeDiagramEdge(props: EdgeProps) {
    const appearance = appearanceFromData(props.data);
    // XYFlow's registered built-ins leave the visible path's id unset. Its
    // outer group owns the edge id, selection, keyboard events and interaction.
    return <StockEdgeAppearance appearance={appearance} path={appearance ? pathFor(props) : ""}
      unstyled={props.data?.unstyled === true}>
      <Native {...props} id={undefined} />
    </StockEdgeAppearance>;
  };
}

/** Keep the native drawing, label geometry, markers and hit path. Compute a
 * second path only for annotated edges, using the same supported options. */
export const diagramNativeEdgeTypes = {
  default: withAppearance(BezierEdge, p => getBezierPath({ ...p, curvature: p.pathOptions?.curvature })[0]),
  straight: withAppearance(StraightEdge, p => getStraightPath(p)[0]),
  simplebezier: withAppearance(SimpleBezierEdge, p => getSimpleBezierPath(p)[0]),
  step: withAppearance(StepEdge, p => getSmoothStepPath({ ...p, offset: p.pathOptions?.offset, borderRadius: 0 })[0]),
  smoothstep: withAppearance(SmoothStepEdge, p => getSmoothStepPath({ ...p, borderRadius: p.pathOptions?.borderRadius,
    offset: p.pathOptions?.offset, stepPosition: p.pathOptions?.stepPosition })[0]),
} satisfies EdgeTypes;
