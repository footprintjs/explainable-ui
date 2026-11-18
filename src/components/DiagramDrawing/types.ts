import type { ComponentType } from "react";
import type { FlowchartRenderer } from "../../model/flowchart";
import type { StageNodeData } from "../StageNode";

export interface DiagramPoint {
  readonly x: number;
  readonly y: number;
}

/** The measured box and native port centers, in node-local CSS pixels. */
export interface DiagramNodeGeometry {
  readonly width: number;
  readonly height: number;
  readonly source: DiagramPoint;
  readonly target: DiagramPoint;
  /** A name in the chart's trusted drawing registry. */
  readonly drawing?: string;
}

export interface DiagramGeometry {
  /** Exact graph node IDs, including a subflow's scope when applicable. */
  readonly nodes: Readonly<Record<string, DiagramNodeGeometry>>;
}

export interface DiagramDrawingProps {
  readonly id: string;
  readonly data: Readonly<StageNodeData>;
  readonly renderer: FlowchartRenderer;
  readonly geometry: DiagramNodeGeometry;
}

export type DiagramDrawings = Readonly<Record<string, ComponentType<DiagramDrawingProps>>>;
