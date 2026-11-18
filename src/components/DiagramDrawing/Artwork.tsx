import type { ReactNode } from "react";
import type { DiagramNodeGeometry } from "./types";

/** Host artwork is paint; native handles and the semantic stage remain chart-owned. */
export function Artwork({ geometry, children }: { geometry: DiagramNodeGeometry; children: ReactNode }) {
  return <>
    <div data-fp="diagram-artwork" aria-hidden="true" style={{
      position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
    }}>{children}</div>
    <svg data-fp="diagram-port-marks" aria-hidden="true" focusable="false" width={geometry.width} height={geometry.height}
      style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <circle cx={geometry.target.x} cy={geometry.target.y} r={2} fill="currentColor" />
      <circle cx={geometry.source.x} cy={geometry.source.y} r={2} fill="currentColor" />
    </svg>
  </>;
}
