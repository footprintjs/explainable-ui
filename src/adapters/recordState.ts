import { stateAt, timeTravel } from "foottrace";
import type { Stop, TimeTravel } from "foottrace";
import type { StageSnapshot } from "../types";
import { adaptFlowRecord } from "./recordInput";
import type { FlowRecordSelection } from "./recordInput";

type RecordState = NonNullable<StageSnapshot["recordState"]>;

/** Project canonical stops; never derive addresses or replay values here. */
export function createRecordStateReader(
  selection: FlowRecordSelection
): (runtimeStageId?: string) => RecordState {
  const input = adaptFlowRecord(selection);
  if (input.status === "refused") {
    return () => ({
      status: "unavailable",
      sourceId: selection.sourceId,
      reason: "unsupported-source",
      message: input.message,
    });
  }
  let cursor: TimeTravel;
  try {
    cursor = timeTravel(input.source);
  } catch {
    return () => ({
      status: "unavailable",
      sourceId: selection.sourceId,
      reason: "reader-refused",
      message: "Foottrace could not read this source's recorded positions.",
    });
  }
  const positions = new Map<string, { stop: Stop; previous?: Stop }>();
  for (const stop of cursor.stops) {
    if (stop.kind === "start" || stop.kind === "end") continue;
    positions.set(stop.runtimeStageId, {
      stop,
      previous: cursor.stops[stop.step - 1],
    });
  }
  return (runtimeStageId) => {
    const position = runtimeStageId ? positions.get(runtimeStageId) : undefined;
    if (!position) {
      return {
        status: "unavailable",
        sourceId: selection.sourceId,
        reason: "stage-not-recorded",
        message:
          "No exact recorded position is available for this stage execution.",
      };
    }
    try {
      return {
        status: "available",
        sourceId: selection.sourceId,
        stop: position.stop,
        previous: position.previous
          ? cursor.stateAt(position.previous)
          : stateAt(input.source, -1),
        current: cursor.stateAt(position.stop),
      };
    } catch {
      return {
        status: "unavailable",
        sourceId: selection.sourceId,
        reason: "reader-refused",
        message:
          "Foottrace could not reconstruct state at this recorded position.",
      };
    }
  };
}
