import { describe, expect, it } from "vitest";
import {
  admitAttention,
  admitExplanation,
} from "../../src/components/InvestigationPanel/admission";
import {
  attention,
  earlier,
  explanation,
  later,
  selected,
} from "../fixtures/investigation/recorded";

// The target's writable, non-configurable length descriptor may legally be
// reported differently by a Proxy. Never infer a complete empty list from it.
function malformedLength(items: unknown[], length: number) {
  return new Proxy(items, {
    getOwnPropertyDescriptor(target, key) {
      const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
      return key === "length" ? { ...descriptor, value: length } : descriptor;
    },
  });
}
const mark = {
  kind: "error",
  reason: "ERROR_RECORDED",
  evidence: ["review:reference"],
};
const gap = { code: "not-collected", evidence: ["review:gap"] };
const targets = [
  [
    "attention nodes",
    (length: number) =>
      admitAttention({
        ...attention,
        nodes: malformedLength([...attention.nodes], length),
      }),
  ],
  [
    "attention marks",
    (length: number) =>
      admitAttention({
        ...attention,
        nodes: [
          { nodeId: selected, attention: malformedLength([mark], length) },
        ],
      }),
  ],
  [
    "attention references",
    (length: number) =>
      admitAttention({
        ...attention,
        nodes: [
          {
            nodeId: selected,
            attention: [
              { ...mark, evidence: malformedLength(["reference"], length) },
            ],
          },
        ],
      }),
  ],
  [
    "attention gaps",
    (length: number) =>
      admitAttention({ ...attention, gaps: malformedLength([gap], length) }),
  ],
  [
    "explanation path",
    (length: number) =>
      admitExplanation(
        {
          ...explanation,
          rootCause: undefined,
          path: malformedLength([selected], length),
        },
        selected
      ),
  ],
  [
    "alternatives",
    (length: number) =>
      admitExplanation(
        {
          ...explanation,
          rootCause: undefined,
          alternatives: malformedLength([earlier], length),
        },
        selected
      ),
  ],
  [
    "explanation marks",
    (length: number) =>
      admitExplanation(
        { ...explanation, attention: malformedLength([mark], length) },
        selected
      ),
  ],
  [
    "explanation gaps",
    (length: number) =>
      admitExplanation(
        {
          ...explanation,
          rootCause: undefined,
          gaps: malformedLength([gap], length),
        },
        selected
      ),
  ],
  [
    "gap references",
    (length: number) =>
      admitExplanation(
        {
          ...explanation,
          rootCause: undefined,
          gaps: [{ ...gap, evidence: malformedLength(["reference"], length) }],
        },
        selected
      ),
  ],
  [
    "impact nodes",
    (length: number) =>
      admitExplanation(
        {
          ...explanation,
          impact: {
            ...explanation.impact,
            nodes: malformedLength([later], length),
          },
        },
        selected
      ),
  ],
  [
    "impact gaps",
    (length: number) =>
      admitExplanation(
        {
          ...explanation,
          impact: {
            ...explanation.impact,
            gaps: malformedLength([gap], length),
          },
        },
        selected
      ),
  ],
] as const;
describe.each(targets)("malformed list length: %s", (_name, admit) => {
  it.each([-1, NaN, Infinity, 0.5])(
    "refuses %s before projecting any list",
    (length) => {
      expect(admit(length)).toBeUndefined();
    }
  );
});
