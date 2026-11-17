/** Native read stamps stay in the recorded log's index space, never cursor positions. */
import { optionalOwnDataField, TraceAdmissionError } from "./safeRecordRead";

export interface RecordedReadTiming { idx?: number; beganAt?: number; sawUntil?: number }
export interface ReadWindow { start: number; end: number }
const count = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 2 ** 52;
const unavailable = (): never => { throw new TraceAdmissionError("malformed"); };

/** Read only own data; an invalid stamp must never silently become legacy dating. */
export function readCommitTiming(entry: unknown): RecordedReadTiming {
  const idx = optionalOwnDataField(entry, "idx"), beganAt = optionalOwnDataField(entry, "beganAt"),
    sawUntil = optionalOwnDataField(entry, "sawUntil");
  if (idx !== undefined && !count(idx)) unavailable();
  if (beganAt !== undefined && (!count(beganAt) || idx === undefined || beganAt >= (idx as number))) unavailable();
  if (sawUntil !== undefined && (!count(sawUntil) || beganAt === undefined ||
    sawUntil <= (beganAt as number) || sawUntil > (idx as number))) unavailable();
  return { ...(idx === undefined ? {} : { idx: idx as number }),
    ...(beganAt === undefined ? {} : { beganAt: beganAt as number }),
    ...(sawUntil === undefined ? {} : { sawUntil: sawUntil as number }) };
}

/**
 * Map an explicitly placed, contiguous history once. A removed prefix is fine;
 * missing/interior indices beside stamps cannot prove which writer a read saw.
 * Logs without stamps keep the existing positional legacy convention.
 */
export function indexReadWindows(log: readonly RecordedReadTiming[]): ReadWindow[] {
  const stamped = log.some(entry => entry.beganAt !== undefined || entry.sawUntil !== undefined);
  let prior: number | undefined;
  for (const entry of log) {
    if (entry.idx === undefined) { if (stamped) unavailable(); continue; }
    if (prior !== undefined && (entry.idx <= prior || (stamped && entry.idx !== prior + 1))) unavailable();
    prior = entry.idx;
  }
  const positionOf = (native: number): number => {
    let low = 0, high = log.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (log[middle].idx! < native) low = middle + 1; else high = middle;
    }
    return low;
  };
  return log.map((entry, position) => entry.beganAt === undefined
    ? { start: position, end: position }
    : { start: positionOf(entry.beganAt), end: positionOf(entry.sawUntil ?? entry.beganAt) });
}
