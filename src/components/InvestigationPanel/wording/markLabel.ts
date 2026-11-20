import { attentionNames } from "./banks";
import { readExplanationLabel } from "../../../displayAdmission/explanationText";

/** Presentation only, for one admitted kind. Never enumerate or retain the host map. */
export function resolveInvestigationMarkLabel(labels: unknown, kind: string) {
  const fallback = Object.prototype.hasOwnProperty.call(attentionNames, kind)
    ? attentionNames[kind as keyof typeof attentionNames]
    : kind;
  return readExplanationLabel(labels, kind, fallback);
}
