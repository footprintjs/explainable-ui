import { describe, expect, it, vi } from "vitest";
import {
  admitAttention,
  admitExplanation,
  displayLabel,
  gapMessages,
} from "../../src/components/InvestigationPanel/admission";
import {
  attention,
  explanation,
  selected,
} from "../fixtures/investigation/recorded";

describe("bounded investigation display admission", () => {
  it("does not execute accessor-backed evidence or stringify hostile values", () => {
    const getter = vi.fn(() => selected);
    const result = { ...explanation };
    Object.defineProperty(result, "nodeId", { get: getter });
    expect(admitExplanation(result, selected)).toBeUndefined();
    expect(getter).not.toHaveBeenCalled();
    const stringify = vi.fn(() => selected);
    expect(
      admitExplanation(
        { ...explanation, path: [{ toString: stringify }] },
        selected
      )
    ).toBeUndefined();
    expect(stringify).not.toHaveBeenCalled();
    const labelGetter = vi.fn(() => "<script>unsafe</script>");
    const labels = Object.defineProperty({}, selected, { get: labelGetter });
    expect(displayLabel(labels, selected)).toBe(selected);
    expect(labelGetter).not.toHaveBeenCalled();
  });
  it("contains throwing and revoked proxies at the display boundary", () => {
    const proxy = new Proxy(
      {},
      {
        getOwnPropertyDescriptor() {
          throw new Error("private");
        },
      }
    );
    expect(admitExplanation(proxy, selected)).toBeUndefined();
    expect(admitAttention(proxy)).toBeUndefined();
    expect(displayLabel(proxy, selected)).toBe(selected);
    const { proxy: revoked, revoke } = Proxy.revocable([], {});
    revoke();
    expect(
      admitExplanation({ ...explanation, path: revoked }, selected)
    ).toBeUndefined();
  });
  it("refuses sparse arrays, duplicate identities, unknown reasons and unknown gap codes", () => {
    expect(
      admitExplanation({ ...explanation, path: new Array(2) }, selected)
    ).toBeUndefined();
    expect(
      admitAttention({
        ...attention,
        nodes: [attention.nodes[0], attention.nodes[0]],
      })
    ).toBeUndefined();
    expect(
      admitAttention({
        ...attention,
        nodes: [
          {
            nodeId: selected,
            attention: [{ kind: "error", reason: "UNSUPPORTED", evidence: [] }],
          },
        ],
      })
    ).toBeUndefined();
    expect(
      admitExplanation(
        {
          ...explanation,
          gaps: [{ code: "future-source-proof", evidence: [] }],
        },
        selected
      )
    ).toBeUndefined();
  });
  it("bounds aggregate projected text and does not inspect unused graph metadata", () => {
    const evidence = Array(32).fill("x".repeat(2048));
    expect(
      admitExplanation(
        {
          ...explanation,
          attention: [{ kind: "error", reason: "ERROR_RECORDED", evidence }],
        },
        selected
      )
    ).toBeUndefined();
    const getter = vi.fn(() => {
      throw new Error("must not inspect");
    });
    const impact = { ...explanation.impact };
    Object.defineProperty(impact, "edges", { get: getter });
    expect(
      admitExplanation({ ...explanation, impact }, selected)
    ).toBeDefined();
    expect(getter).not.toHaveBeenCalled();
  });
  it("retains a fixed coverage message for every current canonical gap code", () => {
    expect(Object.keys(gapMessages)).toHaveLength(23);
    for (const code of Object.keys(gapMessages)) {
      const result = admitExplanation(
        {
          ...explanation,
          rootCause: undefined,
          gaps: [{ code, evidence: [] }],
          confidence: "incomplete",
        },
        selected
      );
      expect(result?.gaps[0]?.code).toBe(code);
      expect(gapMessages[code as keyof typeof gapMessages]).not.toMatch(
        /healthy|successful/
      );
    }
  });
});
