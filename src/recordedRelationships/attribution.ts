/** One display contract shared by the two independent relationship admission boundaries. */
const attributions = Object.freeze({
  "per-write": Object.freeze({ label: "Per-write link", caption: undefined }),
  stage: Object.freeze({ label: "Step-level link", caption: "Step" }),
  "recorded-control": Object.freeze({ label: "Recorded control", caption: undefined }),
  "recorded-read": Object.freeze({ label: "Recorded read", caption: "Read" }),
  "recorded-write": Object.freeze({ label: "Recorded write (retained value)", caption: "Kept" }),
});

export type RecordedAttribution = keyof typeof attributions;

export function isRecordedAttribution(value: unknown): value is RecordedAttribution {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(attributions, value);
}

/** A retained-write proof is a data relationship; legacy attribution/kind admission is unchanged. */
export function admitsRecordedAttribution(value: unknown, kind: unknown): value is RecordedAttribution {
  return isRecordedAttribution(value) && (value !== "recorded-write" || kind === "data");
}

export function recordedAttributionLabel(value: RecordedAttribution): string {
  return attributions[value].label;
}

/** Raw renderer callers keep their existing generic kind caption for an unknown attribution. */
export function recordedAttributionCaption(value: unknown, kind: unknown): string {
  if (isRecordedAttribution(value)) {
    const caption = attributions[value].caption;
    if (caption !== undefined) return caption;
  }
  return kind === "control" ? "Rule" : kind === "data" ? "Data" : "Link";
}
