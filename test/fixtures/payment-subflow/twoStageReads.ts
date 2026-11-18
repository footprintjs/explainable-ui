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
