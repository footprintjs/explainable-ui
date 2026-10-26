import { createRecordGraph, explain } from "foottrace/cause";
import type { CommitBundle } from "foottrace";
// Synthetic recorded evidence only. Identity encoding and explanation come from published Foottrace.
const address = { logRunId: "fixture-run-a", drillPath: ["child#2"] };
const identity = createRecordGraph([]);
export const selected = identity.nodeId(address, {
  runtimeStageId: "check#3",
  commitIdx: 1,
  key: "checked",
});
export const earlier = identity.nodeId(address, {
  runtimeStageId: "load#1",
  commitIdx: 0,
  key: "loaded",
});
export const later = identity.nodeId(address, {
  runtimeStageId: "save#4",
  commitIdx: 2,
  key: "saved",
});
export const attention = {
  nodes: [
    {
      nodeId: selected,
      attention: [
        {
          kind: "error",
          reason: "ERROR_RECORDED",
          evidence: ["record:check#3:error"],
        },
      ],
    },
  ],
  confidence: "complete",
  gaps: [],
} as const;
export const explanation = {
  nodeId: selected,
  attention: attention.nodes[0].attention,
  rootCause: earlier,
  path: [selected, earlier],
  alternatives: [],
  impact: {
    nodes: [later],
    edges: [
      {
        from: selected,
        to: later,
        kind: "data",
        attribution: "per-write",
        evidence: ["record:save#4:read"],
      },
    ],
    confidence: "complete",
    gaps: [],
  },
  confidence: "complete",
  gaps: [],
} as const;

export function canonicalFixturePort() {
  function commit(
    runtimeStageId: string,
    idx: number,
    key: string,
    reads: string[]
  ): CommitBundle {
    return {
      idx,
      stage: runtimeStageId,
      stageId: runtimeStageId.split("#")[0]!,
      runtimeStageId,
      trace: [{ path: key, verb: "set", readKeys: reads }],
      redactedPaths: [],
      overwrite: { [key]: idx },
      updates: {},
    };
  }
  const graph = createRecordGraph([
    {
      address,
      commitLog: [
        commit("load#1", 0, "loaded", []),
        commit("check#3", 1, "checked", ["loaded"]),
        commit("save#4", 2, "saved", ["checked"]),
      ],
      reads: { "load#1": [], "check#3": ["loaded"], "save#4": ["checked"] },
      controlDeps: {},
      attention: {
        "load#1": [
          {
            kind: "error",
            reason: "ERROR_RECORDED",
            evidence: ["fixture:load:error"],
          },
        ],
        "check#3": attention.nodes[0].attention,
      },
      complete: true,
    },
  ]);
  return {
    binding: {},
    attention,
    labels: {
      [selected]: "Check · visit 2",
      [earlier]: "Load · visit 2",
      [later]: "Save · visit 2",
    },
    explain: (nodeId: string, context: { signal: AbortSignal }) =>
      explain(graph, nodeId, {
        signal: context.signal,
        maxNodes: 64,
        maxEdges: 128,
        maxCalls: 256,
        timeoutMs: 2_000,
      }),
  };
}
