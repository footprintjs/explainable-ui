import { describe, expect, it } from "vitest";
import { assertNoPilotSource } from "./shipping-boundary.mjs";

describe("normal package pilot-source boundary", () => {
  it.each([
    "// src/record/model.ts",
    JSON.stringify({ sources: ["../src/record/index.ts"] }),
    "// src/record.ts",
    "// pilots/record-lens/model.pilot.ts",
  ])("rejects an actual pilot path: %s", source => {
    expect(() => assertNoPilotSource(source)).toThrow("contains pilot source");
  });

  it.each([
    "// src/recordedRelationships/attribution.ts",
    JSON.stringify({ sources: ["../src/recordedRelationships/attribution.ts"] }),
    "// src/recording.ts",
  ])("accepts a separate production path sharing a prefix: %s", source => {
    expect(() => assertNoPilotSource(source)).not.toThrow();
  });
});
