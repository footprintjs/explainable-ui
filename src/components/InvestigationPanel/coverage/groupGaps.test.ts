import { describe, expect, it } from "vitest";
import type { InvestigationTextDisplay } from "../checkTypes";
import { groupGaps } from "./groupGaps";

type Gap = InvestigationTextDisplay["gaps"][number];

describe("lossless context-local gap grouping", () => {
  it("keeps first-code order and each code's original entry order and identities", () => {
    const first: Gap = { code: "timeout", nodeId: "first", evidence: ["ref:first"] };
    const middle: Gap = { code: "not-collected", nodeId: "middle", evidence: ["ref:middle"] };
    const last: Gap = { code: "timeout", nodeId: "last", evidence: ["ref:last"] };
    const groups = groupGaps([first, middle, last]);

    expect(groups.map(group => group.code)).toEqual(["timeout", "not-collected"]);
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[0].entries[0]).toBe(first);
    expect(groups[0].entries[1]).toBe(last);
    expect(groups[1].entries).toHaveLength(1);
    expect(groups[1].entries[0]).toBe(middle);
  });

  it("retains repeated occurrences and duplicate references without mutating frozen input", () => {
    const references = Object.freeze(["same-reference", "same-reference"]);
    const repeated: Gap = Object.freeze({ code: "scope-boundary", nodeId: "child", evidence: references });
    const other: Gap = Object.freeze({ code: "redacted", evidence: Object.freeze(["other-reference"]) });
    const input = Object.freeze([repeated, other, repeated]);
    const groups = groupGaps(input);

    expect(input).toEqual([repeated, other, repeated]);
    expect(input[0]).toBe(repeated);
    expect(input[1]).toBe(other);
    expect(input[2]).toBe(repeated);
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[0].entries[0]).toBe(repeated);
    expect(groups[0].entries[1]).toBe(repeated);
    expect(groups[0].entries[0].evidence).toBe(references);
    expect(groups[0].entries[0].evidence).toEqual(["same-reference", "same-reference"]);
    expect(groups[0].entries[1].evidence).toEqual(["same-reference", "same-reference"]);
    expect(groups.reduce((count, group) => count + group.entries.length, 0)).toBe(input.length);
  });

  it("returns no groups for no supplied gaps without inventing a coverage state", () => {
    const input = Object.freeze([] as Gap[]);
    expect(groupGaps(input)).toEqual([]);
    expect(input).toEqual([]);
  });
});
