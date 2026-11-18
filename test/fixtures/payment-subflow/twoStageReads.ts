import payment from "./on.json";

/** Two observed reads of receipt, each linked to a different write in Payment. */
export function paymentWithTwoStageReads() {
  const snapshot = structuredClone(payment);
  const later = snapshot.commitLog[2];
  later.trace = [{ path: "receipt", verb: "set", readKeys: [] }];
  later.overwrite = { receipt: "TXN-REVISED" };
  const sources = snapshot.readSources;
  const earlier = sources.record.occurrences[0];
  sources.record.occurrences.push({ ...earlier, ordinal: 2, source: { kind: "committed", commitIdx: 2 } });
  sources.status = "captured";
  sources.limitations = [];
  snapshot.capture.channels.readSources = "captured";
  return snapshot;
}

/** Payment's second receipt write retains only the delta for the selected verb. */
export function paymentWithStageReadDelta(verb: "append" | "merge") {
  const snapshot = paymentWithTwoStageReads();
  snapshot.commitValues = "delta";
  snapshot.capture.modes.commitValues = "delta";
  const commitLog = snapshot.commitLog.map((row, index) => {
    if (index === 1 && verb === "append") return { ...row, overwrite: { receipt: ["original"] } };
    if (index === 3 && verb === "append") return { ...row, trace: [{ path: "shipped", verb: "set" }] };
    if (index !== 2) return row;
    return { ...row, trace: [{ path: "receipt", verb, readKeys: [] }],
      overwrite: verb === "append" ? { receipt: ["appended"] } : {},
      updates: verb === "merge" ? { receipt: "TXN-REVISED" } : {} };
  });
  if (verb === "append") {
    // Foottrace records scalar read occurrences. Ship observed the array at stage level.
    const { readSources: _scalarSources, ...stageRecording } = snapshot;
    stageRecording.capture.channels.readSources = "disabled";
    Object.assign(stageRecording.executionTree.next.next.stageReads, { receipt: ["original", "appended"] });
    return { ...stageRecording, commitLog };
  }
  return { ...snapshot, commitLog };
}
