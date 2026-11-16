import type { CSSProperties } from "react";
import { v } from "../../theme/styles";

/** Structural styles also apply unstyled: native ports and measured boxes must agree. */
export const isoStyles: Record<string, CSSProperties> = {
  root: { position: "relative", width: 168, height: 116, overflow: "visible", boxSizing: "border-box" },
  slab: { position: "absolute", left: 0, top: 0, width: 168, height: 100, overflow: "visible", pointerEvents: "none" },
  icon: { position: "absolute", left: 77, top: 41, display: "flex", width: 22, height: 22,
    alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  steps: { position: "absolute", left: 4, top: 1, display: "flex", gap: 2, maxWidth: 112,
    flexWrap: "wrap", pointerEvents: "none" },
  step: { display: "inline-flex", minWidth: 14, height: 15, padding: "0 2px", alignItems: "center", justifyContent: "center" },
  status: { position: "absolute", right: 0, top: 2, padding: "2px 4px", pointerEvents: "none" },
  retry: { position: "absolute", right: 0, top: 82, padding: "2px 4px" },
  label: { position: "absolute", left: 0, top: 99, width: 168, overflow: "hidden", textAlign: "center",
    textOverflow: "ellipsis", whiteSpace: "nowrap", pointerEvents: "none" },
  trace: { position: "absolute", left: "50%", top: 118, transform: "translateX(-50%)", display: "block",
    width: "max-content", maxWidth: 220, overflow: "hidden", padding: "2px 5px", whiteSpace: "nowrap", textOverflow: "ellipsis", zIndex: 2 },
};

const radius = v("--fp-node-radius", "4px");
export const isoPaint: Record<string, CSSProperties> = {
  step: { borderRadius: radius, fontSize: 9, lineHeight: 1 },
  status: { borderRadius: radius, fontSize: 8, fontWeight: 700, lineHeight: 1.2, letterSpacing: ".03em" },
  label: { fontSize: 11, fontWeight: 600, lineHeight: "17px" },
  trace: { borderRadius: radius, fontSize: 9, lineHeight: "13px" },
};
