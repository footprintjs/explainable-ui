import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { keysReadFromExecutionTree } from "foottrace";
import { createRecordLensReader } from "../../src/record/model";
import { createScopedRecordGraph } from "../../src/record/scopedRecordGraph";
import { paymentWithStageReadDelta, paymentWithTwoStageReads } from "../fixtures/payment-subflow/twoStageReads";

function payment(mode = "on") {
  return JSON.parse(readFileSync(`test/fixtures/payment-subflow/${mode}.json`, "utf8"));
}
function read(snapshot: unknown, key: string, beforeCommitIdx: number, invocationPath: string[] = []) {
  return createScopedRecordGraph(snapshot)!.read({ key, beforeCommitIdx, invocationPath });
}
const child = ["payment#1"];

describe("scoped record graph", () => {
  it("folds only the requested native commit, including a child log's seed", async () => {
    const snapshot = paymentWithStageReadDelta("append");
    const receipt = { invocationPath: [], runtimeStageId: "payment#1", key: "receipt" };
    const graph = createScopedRecordGraph(snapshot)!;
    expect(graph.valueAt({ ...receipt, commitIdx: 2 })).toHaveProperty("gap.code", "writer-address-unverified");
    await graph.read({ ...receipt, beforeCommitIdx: 3 });
    expect(graph.valueAt({ ...receipt, commitIdx: 2 })).toEqual({ value: ["original", "appended"] });
    expect(graph.valueAt({ ...receipt, commitIdx: 1 })).toEqual({ value: ["original"] });
    for (const [commitIdx, runtimeStageId, key, value] of [
      [0, child[0], "chargedAmount", 99], [1, "payment/charge#2", "txnId", "TXN-99"],
    ] as const) {
      const query = { invocationPath: child, commitIdx, runtimeStageId, key };
      await graph.read({ ...query, beforeCommitIdx: commitIdx + 1 });
      expect(graph.valueAt(query)).toEqual({ value });
    }
    expect(graph.valueAt({ ...receipt, commitIdx: 3 })).toHaveProperty("gap.code", "writer-address-unverified");
    expect(graph.valueAt({ ...receipt, commitIdx: -1 })).toHaveProperty("gap.code", "writer-address-unverified");
    expect(graph.valueAt({ ...receipt, commitIdx: 1, address: { logRunId: "another-run", drillPath: [] } }))
      .toHaveProperty("gap.code", "writer-address-unverified");
  });

  it("inspects an admitted merged receipt at its own commit and retains the earlier value", async () => {
    const graph = createScopedRecordGraph(paymentWithStageReadDelta("merge"))!;
    const { candidates } = await graph.read({ invocationPath: [], key: "shipped", beforeCommitIdx: 4 });
    expect(candidates?.map(writer => graph.valueAt(writer))).toEqual([{ value: "TXN-99" }, { value: "TXN-REVISED" }]);
  });

  it("reports the fold's basis instead of a deleted or redacted value", async () => {
    for (const code of ["deleted", "redacted"]) {
      const snapshot = payment();
      Object.assign(snapshot.commitLog[2], { trace: [{ path: "receipt", verb: code === "deleted" ? "delete" : "set" }],
        overwrite: code === "deleted" ? {} : { receipt: "[REDACTED]" }, redactedPaths: code === "redacted" ? ["receipt"] : [] });
      const graph = createScopedRecordGraph(snapshot)!;
      const query = { invocationPath: [], commitIdx: 2, runtimeStageId: "payment#1", key: "receipt" };
      await graph.read({ ...query, beforeCommitIdx: 3 });
      const result = graph.valueAt(query);
      expect(result).toHaveProperty("gap.code", code);
      expect(result).not.toHaveProperty("value");
    }
  });

  it("keeps two admitted reads of receipt as candidates for the exact shipped write", async () => {
    const snapshot = paymentWithTwoStageReads();

    const result = await read(snapshot, "shipped", 4);
    expect(result.writer).toMatchObject({ invocationPath: [], commitIdx: 3, runtimeStageId: "ship#3", key: "shipped" });
    expect(result.writers).toEqual([]);
    expect(result.candidates?.map(w => [w.invocationPath, w.commitIdx, w.key])).toEqual([[[], 1, "receipt"], [[], 2, "receipt"]]);
    expect(result.gaps.map(gap => gap.message)).toContain("The record does not tie a particular read to this write.");
  });

  it("distinguishes a partial write from an unverified exact writer address", async () => {
    const snapshot = payment();
    const row = snapshot.commitLog[0];
    const nestedKey = "config\u001fregion";
    row.overwrite = { config: { region: "west" } };
    row.trace = [{ path: nestedKey, verb: "set", readKeys: [] }];
    const partial = await read(snapshot, "config", 1);
    expect(partial.writer).toBeUndefined();
    expect(partial.gaps).toEqual([{ invocationPath: [], code: "nested-rows", message: "This step wrote only part of the selected value." }]);

    row.trace[0].path = "config";
    const container = await read(snapshot, nestedKey, 1);
    expect(container.writer).toBeUndefined();
    expect(container.gaps).toEqual([{ invocationPath: [], code: "writer-address-unverified", message: "The exact recorded writer address could not be verified." }]);
  });

  it("withholds an unaddressable parent without calling it multiple possible writers", async () => {
    const snapshot = payment();
    delete snapshot.readSources;
    snapshot.commitLog[0].trace = [{ path: "config\u001fregion", verb: "set", readKeys: [] }];
    snapshot.commitLog[0].overwrite = { config: { region: "west" } };
    snapshot.commitLog[3].trace[0].readKeys = ["config"];
    snapshot.executionTree.next.next.stageReads = { config: { region: "west" } };
    const result = await read(snapshot, "shipped", 4);
    expect(result.writers).toEqual([]);
    expect(result.gaps.map(g => g.code)).toContain("writer-address-unverified");
    expect(result.gaps.map(g => g.code)).not.toContain("ambiguous");
  });

  it("names multiple possible writers when both wrote within reach of the read window", async () => {
    const snapshot = payment();
    delete snapshot.readSources;
    snapshot.commitLog[1].trace = [{ path: "amount", verb: "set", readKeys: [] }];
    snapshot.commitLog[1].overwrite = { amount: 17 };
    Object.assign(snapshot.commitLog[3], { beganAt: 1, sawUntil: 2 });
    snapshot.commitLog[3].trace[0].readKeys = ["amount"];
    snapshot.executionTree.next.next.stageReads = { amount: 99 };
    const result = await read(snapshot, "shipped", 4);
    expect(result.writers).toEqual([]);
    expect(result.gaps.map(g => g.code)).toContain("ambiguous");
  });

  it("keeps a native capture gap visible on a flat record with no mounts", async () => {
    const snapshot = payment();
    delete snapshot.executionTree.next;
    delete snapshot.subflowResults;
    delete snapshot.readSources;
    snapshot.commitLog = snapshot.commitLog.slice(0, 1);
    snapshot.capture.commits.to = 1;
    snapshot.capture.channels.writes = "failed";
    const reader = createRecordLensReader({ sourceId: "seed", source: snapshot });
    const step = reader.stops.find(stop => stop.runtimeStageId === "seed#0")!.step;
    const result = await reader.backtrack!(step, "amount");
    expect(result.gaps.map(gap => gap.message)).toContain("Write capture failed.");
  });

  it("keeps both cutoff and writer per log through the output, child seed, and input", async () => {
    const graph = createScopedRecordGraph(payment())!;
    const ship = await graph.read({ invocationPath: [], key: "shipped", beforeCommitIdx: 4 });
    expect(ship.writers).toEqual([]);
    expect(ship.candidates?.map(w => [w.invocationPath, w.commitIdx, w.key])).toEqual([[[], 1, "receipt"]]);
    for (const [path, before, key, expected] of [
      [[], 3, "receipt", [child, 1, "txnId"]],
      [child, 2, "txnId", [child, 0, "chargedAmount"]],
      [child, 1, "chargedAmount", [[], 0, "amount"]],
    ] as const) {
      const reply = await graph.read({ invocationPath: path, beforeCommitIdx: before, key });
      if (key === "txnId") {
        expect(reply.writers.map(w => [w.invocationPath, w.commitIdx, w.key])).toEqual([expected]);
        expect(reply.handoffs).toBeUndefined();
      } else {
        expect(reply.writers).toEqual([]);
        expect(reply.handoffs?.map(w => [w.invocationPath, w.commitIdx, w.key])).toEqual([expected]);
        expect(reply.gaps.some(g => g.code === "scope-boundary")).toBe(false);
      }
      expect(reply.candidates).toBeUndefined();
      // Mapper prefixes keep Foottrace's conservative reason. The local per-write edge has no such qualification.
      expect(reply.gaps.some(g => g.code === "conservative")).toBe(key !== "txnId");
    }
    const atMount = await graph.read({ invocationPath: [], key: "receipt", beforeCommitIdx: 3 });
    expect(atMount.gaps.map(g => g.code)).not.toContain("failed");
    const early = await graph.read({ invocationPath: [], beforeCommitIdx: 1, key: "receipt" });
    expect(early.writer).toBeUndefined();
  });

  it("keeps the optional reader on its own rail and lands on the selected writer's actual value", async () => {
    const source = payment();
    const root = createRecordLensReader({ sourceId: "payment", source, reads: keysReadFromExecutionTree(source.executionTree) });
    const mount = root.stops.find(stop => stop.runtimeStageId === child[0])!;
    expect(root.at(mount.step, "receipt")).not.toHaveProperty("writerStops");
    const answer = await root.backtrack!(mount.step, "receipt");
    const writer = answer.handoffs!.find(w => w.key === "txnId")!;
    const position = root.positionOf!(writer)!;
    expect(position).toMatchObject({ invocationPath: child, key: ["txnId"], value: "TXN-99" });
    expect(root.forScope!(child)!.stops[position.step].runtimeStageId).toBe("payment/charge#2");
    expect(root.positionOf!({ ...writer, address: { ...writer.address, logRunId: "another-run" } })).toBeUndefined();
  });

  it("names only the disabled channel and does not borrow another scope's names", async () => {
    const snapshot = payment("default");
    const ship = await read(snapshot, "shipped", 4);
    expect(ship.writers).toEqual([]);
    expect(ship.candidates?.map(w => [w.invocationPath, w.commitIdx, w.key])).toEqual([[[], 1, "receipt"]]);
    const answer = await read(snapshot, "receipt", 2);
    expect(answer.writers).toEqual([]);
    expect(answer.candidates).toBeUndefined();
    expect(answer.handoffs).toBeUndefined();
    expect(answer.gaps.map(g => g.code)).toEqual(expect.arrayContaining(["prefix-off", "output-unknown"]));
    delete snapshot.writeProvenance;
    expect((await read(snapshot, "receipt", 2)).gaps.map(g => g.code)).toContain("output-unknown");
    expect((await read(snapshot, "receipt", 2)).gaps.map(g => g.code)).not.toContain("prefix-off");
  });

  it("rejects an alias in place of a missing child, mismatched endpoint, and stale cutoff", async () => {
    const snapshot = payment();
    delete snapshot.subflowResults["payment#1"];
    expect((await read(snapshot, "receipt", 3)).gaps.map(g => g.code)).toContain("missing-child");
    for (const change of ["address", "cutoff"]) {
      const row = payment();
      const endpoint = row.subflowResults["payment#1"].outputHandoff.child;
      if (change === "address") endpoint.address.drillPath = ["other#1"];
      else endpoint.beforeCommitIdx = 1;
      expect((await read(row, "receipt", 3)).handoffs).toBeUndefined();
    }
  });
  it("preserves privacy and capture limits at the selected handoff", async () => {
    for (const [why, code] of [["privacy-active", "redacted"], ["budget-exhausted", "budget"]]) {
      const snapshot = payment();
      const output = snapshot.subflowResults["payment#1"].outputHandoff;
      output.status = "partial";
      output.limitations = [why];
      if (why === "privacy-active") output.writes = [];
      const reply = await read(snapshot, "receipt", 3);
      expect(reply.gaps.map(g => g.code)).toContain(code);
      if (why === "privacy-active") expect(reply.handoffs).toBeUndefined();
    }
  });
  it("withholds an older child writer masked before output mapping, keeping independent sources", async () => {
    const snapshot = payment();
    const { treeContext, outputHandoff } = snapshot.subflowResults[child[0]];
    treeContext.history.push({ stage: "Mask", stageId: "mask", runtimeStageId: "payment/mask#4",
      idx: 2, trace: [], redactedPaths: ["txnId"], overwrite: { txnId: "[REDACTED]" }, updates: {} });
    treeContext.stageContexts.next = { id: "mask", name: "Mask", runtimeStageId: "payment/mask#4" };
    outputHandoff.child.beforeCommitIdx = 3;
    outputHandoff.writes[0].reads.push("chargedAmount");
    const answer = await read(snapshot, "receipt", 2);
    expect(answer.handoffs?.map(w => w.key)).toEqual(["chargedAmount"]);
    expect(answer.gaps.map(g => g.code)).toContain("redacted");
  });
  it("does not anchor a question to a visible write preceding a masked write", async () => {
    const snapshot = payment();
    snapshot.commitLog[2].redactedPaths.push("receipt");
    snapshot.commitLog[2].overwrite.receipt = "[REDACTED]";
    const before = await read(snapshot, "receipt", 2);
    expect(before.writer?.commitIdx).toBe(1);
    const after = await read(snapshot, "receipt", 3);
    expect(after.writer).toBeUndefined();
    expect(after.gaps.map(g => g.code)).toContain("redacted");
    const downstream = await read(snapshot, "shipped", 4);
    expect(downstream.writers.filter(w => w.key === "receipt")).toEqual([]);
    expect(downstream.candidates?.some(w => w.key === "receipt")).not.toBe(true);
    expect(downstream.gaps.map(g => g.code)).toContain("redacted");
  });
  it("checks the parent input mapper's saved cutoff for each source", async () => {
    const snapshot = payment();
    const handoff = snapshot.subflowResults[child[0]].inputHandoff;
    handoff.writes[0].reads.push("txnId");
    snapshot.commitLog[0].redactedPaths.push("amount");
    snapshot.commitLog[0].overwrite.amount = "[REDACTED]";
    // This later mark is outside the recorded input mapping.
    snapshot.commitLog[1].redactedPaths.push("txnId");
    const answer = await read(snapshot, "chargedAmount", 1, child);
    expect(answer.handoffs?.map(w => w.key)).toEqual(["txnId"]);
    expect(answer.gaps.map(g => g.code)).toContain("redacted");
  });
  it("only reports an observed-empty read prefix on the matching completed log", async () => {
    const snapshot = payment();
    delete snapshot.readSources;
    snapshot.capture.version = 1;
    snapshot.capture.channels.readSources = "not-collected";
    snapshot.capture.limitations.push("read-sources-not-collected");
    const inspect = async () => (await read(snapshot, "amount", 1)).gaps.map(g => g.code);
    expect(await inspect()).toContain("no-match");
    snapshot.capture.boundary.status = "running";
    expect(await inspect()).toContain("collection-unknown");
    snapshot.capture.boundary.status = "completed";
    snapshot.capture.commits.from = 1;
    expect(await inspect()).not.toContain("no-match");
    snapshot.capture.commits.from = 0;
    snapshot.capture.version = 3;
    expect(await inspect()).toContain("collection-unknown");
    snapshot.capture.version = 1;
    snapshot.capture.logAddress.logRunId = "foreign-run";
    expect(await inspect()).not.toContain("no-match");
  });

  it("keeps channel-specific losses from the coverage note when source rows were omitted", async () => {
    for (const [channel, status, label] of [
      ["readSources", "disabled", "Read sources were not collected."],
      ["writes", "disabled", "State writes were not collected."],
      ["readSources", "failed", "Read source capture failed."],
      ["readSources", "partial", "Read source capture was partial."],
      ["writes", "failed", "Write capture failed."],
      ["writes", "partial", "Write capture was partial."],
    ]) {
      const snapshot = payment();
      delete snapshot.readSources;
      snapshot.capture.channels.readSources = "captured";
      snapshot.capture.channels[channel] = status;
      const empty = await read(snapshot, "amount", 1);
      expect(empty.gaps.map(g => g.message)).toContain(label);
      expect(empty.gaps.map(g => g.code)).not.toContain("no-match");
      const mapped = await read(snapshot, "receipt", 2);
      expect(mapped.handoffs?.some(w => w.key === "txnId" && w.invocationPath[0] === child[0])).toBe(true);
    }
  });

  it("retains named loss from the selected evidence and never promotes a fan-out slot to a key", async () => {
    const snapshot = payment();
    const address = snapshot.logAddress;
    const endpoint = snapshot.subflowResults["payment#1"].outputHandoff.child;
    snapshot.fanoutCollections = { version: 1, status: "captured", collections: [{
      version: 1, attribution: "observed-scope-collection",
      parent: { address, runtimeStageId: "ship#3", commitIdx: 3, path: "shipped" },
      totalItems: 1, branchCount: 1, slots: [{ index: 0, child: endpoint, observation: "scope-snapshot" }],
      status: "captured", limitations: [],
    }] };
    snapshot.capture.channels.reads = "failed";
    const answer = await read(snapshot, "shipped", 4);
    expect(answer.gaps.map(g => g.code)).toEqual(expect.arrayContaining(["failed", "fanout"]));
    expect(answer.handoffs).toBeUndefined();
  });

  it("returns the budget gap for an oversized native record", async () => {
    const snapshot = payment();
    snapshot.commitLog = Array(4097).fill(snapshot.commitLog[0]);
    expect((await read(snapshot, "receipt", 2)).gaps[0].code).toBe("budget");
  });
  it("withholds an internally inconsistent native partial handoff", async () => {
    const snapshot = payment();
    snapshot.subflowResults["payment#1"].outputHandoff.status = "partial";
    const answer = await read(snapshot, "receipt", 2);
    expect(answer.handoffs).toBeUndefined();
    expect(answer.gaps.map(g => g.code)).toContain("scope-boundary");
  });
  it("names privacy when it hid a writer and refuses an unbound source observation", async () => {
    const snapshot = payment();
    snapshot.commitLog[0].redactedPaths.push("private");
    const hidden = await read(snapshot, "private", 1);
    expect(hidden.gaps.map(g => g.code)).toContain("redacted");
    const foreign = snapshot.subflowResults["payment#1"].treeContext.readSources = structuredClone(snapshot.readSources);
    foreign.status = "failed";
    foreign.limitations = ["privacy-active"];
    const local = await read(snapshot, "txnId", 2, child);
    expect(local.gaps.map(g => g.code)).not.toContain("failed");
    expect(local.gaps.map(g => g.code)).not.toContain("redacted");
  });
});
