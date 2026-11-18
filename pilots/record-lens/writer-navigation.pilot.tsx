/** @vitest-environment jsdom */
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { tagStops } from "foottrace";
import type { StateKey } from "foottrace";
import parallel from "../../examples/headless-controller/recording.json";
import { RecordLens } from "../../src/record/RecordLens";
import { createRecordLensReader } from "../../src/record/model";
import type { RecordLensReader } from "../../src/record/types";

afterEach(cleanup);
const sourceId = "order";
const source = parallel.snapshot;

function Controlled({ reader }: { reader: RecordLensReader }) {
  const [step, setStep] = useState(5);
  const [key, setKey] = useState<StateKey>("total");
  return <>
    <output aria-label="selection">{step}/{JSON.stringify(key)}</output>
    <RecordLens reader={reader} step={step} selectedKey={key} onStepChange={setStep} onKeyChange={setKey} />
  </>;
}

describe("source-local Backtrack navigation", () => {
  it("visits both ingredient writers, restores the recorded question and focuses its link", () => {
    render(<Controlled reader={createRecordLensReader({ sourceId, source })} />);
    for (const [stage, branch, value, step] of [["Items", "items", 30, 3], ["Delivery", "delivery", 5, 4]] as const) {
      const name = `Follow ${stage} · runs › ${branch} › amount = ${value}`;
      const link = screen.getByRole("button", { name });
      fireEvent.click(link);
      expect(screen.getByLabelText("selection").textContent).toBe(`${step}/["runs","${branch}","amount"]`);
      const goBack = screen.getByRole("button", { name: "Return to recorded question" });
      expect(document.activeElement).toBe(goBack);
      fireEvent.click(goBack);
      expect(screen.getByLabelText("selection").textContent).toBe('5/"total"');
      expect(document.activeElement).toBe(screen.getByRole("button", { name }));
    }
  });

  it("drops a return address when the reader revision changes at the same displayed step", () => {
    const old = createRecordLensReader({ sourceId, source });
    const next = createRecordLensReader({ sourceId, source });
    const { rerender } = render(<Controlled reader={old} />);
    fireEvent.click(screen.getByRole("button", { name: /Follow Items/ }));
    rerender(<Controlled reader={next} />);
    expect(screen.queryByText("Return to recorded question")).toBeNull();
    rerender(<Controlled reader={old} />);
    expect(screen.queryByText("Return to recorded question")).toBeNull();
  });

  it("keeps a refused JavaScript key out of writer navigation", () => {
    const reader = createRecordLensReader({ sourceId, source });
    const badKey = Object.create(null) as StateKey;
    render(<RecordLens reader={reader} step={5} selectedKey={badKey}
      onStepChange={() => {}} onKeyChange={() => {}} />);
    expect(screen.getByText(/Foottrace could not read a causal explanation/)).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Recorded ingredient writers" })).toBeNull();
    expect(screen.getByText("State at this step")).toBeTruthy();
  });

  it("waits for a controlled host to publish its new step and key separately", () => {
    const reader = createRecordLensReader({ sourceId, source });
    const renderAt = (step: number, key: StateKey) =>
      <RecordLens reader={reader} step={step} selectedKey={key}
        onStepChange={() => {}} onKeyChange={() => {}} />;
    const amount = ["runs", "items", "amount"];
    const name = "Follow Items · runs › items › amount = 30";
    const { rerender } = render(renderAt(5, "total"));
    fireEvent.click(screen.getByRole("button", { name }));
    rerender(renderAt(3, "total"));
    rerender(renderAt(3, amount));
    fireEvent.click(screen.getByRole("button", { name: "Return to recorded question" }));
    rerender(renderAt(3, "total"));
    rerender(renderAt(5, "total"));
    expect(document.activeElement).toBe(screen.getByRole("button", { name }));
  });

  it("keeps the causal slice while refusing unlandable and ambiguous addresses", () => {
    const tagged = { ...source, commitLog: source.commitLog.map((row, index) =>
      index === 2 || index === 6 ? { ...row, tags: ["selected"] } : row) };
    const hidden = createRecordLensReader({ sourceId, source: tagged, strategy: tagStops(["selected"]) }).at(2, "total");
    if (hidden.status !== "ready") throw Error("missing grouped stop");
    expect(hidden.provenance?.status).toBe("ready");
    expect(hidden.writerStops).toEqual([]); // Items absorbs Delivery, Delivery has no stop.
    const duplicate = structuredClone(source);
    duplicate.commitLog.splice(2, 0, structuredClone(duplicate.commitLog[2]));
    const reader = createRecordLensReader({ sourceId, source: duplicate });
    const ambiguous = reader.at(reader.stops.length - 1, "total");
    if (ambiguous.status !== "ready") throw Error("missing total");
    expect(ambiguous.writerStops?.map(w => w.stageName)).toEqual(["Delivery"]);
  });

  it("follows the pinned read rather than a later writer, and leaves a contested window unlinked", () => {
    const write = (idx: number, key: string, value: number, readKeys: string[]) => ({
      idx, stage: `Stage ${idx}`, stageId: `s${idx}`, runtimeStageId: `s${idx}#${idx}`,
      trace: [{ path: key, verb: "set", readKeys }], overwrite: { [key]: value },
      updates: {}, redactedPaths: [],
    });
    const rows = [write(0, "x", 3, []), write(1, "x", 5, [])];
    const total = { ...write(2, "total", 3, ["x"]), beganAt: 1 };
    const inspect = (writer: typeof total) => createRecordLensReader({
      sourceId, source: { commitLog: [...rows, writer] },
    }).at(3, "total");
    const pinned = inspect(total);
    if (pinned.status !== "ready") throw Error("missing pinned evidence");
    expect(pinned.writerStops).toEqual([{ step: 1, key: ["x"], stageName: "Stage 0", value: 3 }]);
    const window = { ...total, sawUntil: 2 };
    const contested = inspect(window);
    if (contested.status !== "ready" || contested.provenance?.status !== "ready") throw Error("missing window");
    expect(contested.writerStops).toEqual([]);
    expect(contested.provenance.slice.notes?.some(note => note.code === "concurrent-write")).toBe(true);
  });

  it("keeps separate stage-level reads as narrative rather than certain per-write links", () => {
    const indirect = structuredClone(source);
    delete (indirect.commitLog[6].trace[0] as { readKeys?: string[] }).readKeys;
    const model = createRecordLensReader({ sourceId, source: indirect,
      reads: { kind: "stage-level", lookup: () => ["runs\u001fitems\u001famount"] },
    }).at(5, "total");
    if (model.status !== "ready") throw Error("missing recorded stop");
    expect(model.provenance?.status).toBe("ready");
    expect(model.writerStops).toEqual([]);
  });
});
