/** @vitest-environment jsdom */
import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { TimeTravelSource } from "foottrace";
import payment from "../../test/fixtures/payment-subflow/on.json";
import { paymentWithTwoStageReads } from "../../test/fixtures/payment-subflow/twoStageReads";
import { createRecordLensReader, RecordLens, RecordTimeSlider } from "../../src/record";
import type { RecordBacktrackPosition, RecordLensReader } from "../../src/record";

afterEach(cleanup);

function Payment({ reader }: { reader: RecordLensReader }) {
  const step = reader.stops.find(stop => stop.stageId === "ship")!.step;
  const [cursor, select] = useState<RecordBacktrackPosition>({ invocationPath: [], step, key: ["shipped"] });
  const active = cursor.invocationPath.length ? reader.forScope!(cursor.invocationPath)! : reader;
  const selectStep = (step: number) => select(current => ({ ...current, step }));
  return <>
    <output aria-label="Shared cursor">{JSON.stringify(cursor)}</output>
    <RecordTimeSlider presentation="range" stops={active.stops} step={cursor.step} onStepChange={selectStep} />
    <RecordLens reader={reader} invocationPath={cursor.invocationPath} step={cursor.step} selectedKey={cursor.key}
      onStepChange={selectStep} onPositionChange={select} />
  </>;
}

it("follows a renamed payment value into the child's rail and returns to the original question and focus", async () => {
  const reader = createRecordLensReader({ sourceId: "Payment", source: payment as unknown as TimeTravelSource });
  render(<Payment reader={reader} />);
  const position = (): RecordBacktrackPosition => JSON.parse(screen.getByLabelText("Shared cursor").textContent!);
  const origin = position();
  const first = /^Inspect stage read Payment · receipt/;
  fireEvent.click(await screen.findByRole("button", { name: first }));
  const mapped = await screen.findByRole("button", { name: /^Follow handoff payment\/Charge · txnId/ });
  expect(screen.getByRole("list", { name: "Recorded handoff reads" }).contains(mapped)).toBe(true);
  expect(screen.queryByRole("list", { name: "Recorded ingredient writers" })).toBeNull();
  fireEvent.click(mapped);
  expect(position().invocationPath).toEqual(["payment#1"]);
  expect(position().key).toEqual(["txnId"]);
  expect((screen.getByLabelText("Step", { selector: "select" }) as HTMLSelectElement).value)
    .toBe(String(position().step));
  expect(reader.forScope!(position().invocationPath)!.stops[position().step].runtimeStageId).toBe("payment/charge#2");
  fireEvent.click(screen.getByRole("button", { name: "Return to recorded question" }));
  expect(position()).toEqual(origin);
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: first })));
});

it("labels both observed receipt commits as stage reads even when the slider groups them", async () => {
  const source = paymentWithTwoStageReads() as unknown as TimeTravelSource;
  render(<Payment reader={createRecordLensReader({ sourceId: "Two reads", source })} />);
  const list = await screen.findByRole("list", { name: "Recorded stage reads" });
  const rows = [...list.querySelectorAll("li")];
  expect(rows.map(row => row.textContent)).toEqual([
    expect.stringMatching(/receipt.*commit 1$/), expect.stringMatching(/receipt.*commit 2$/),
  ]);
  expect(rows[0].querySelector("button")).toBeNull();
  expect(screen.getByText("The record does not tie a particular read to this write.")).toBeTruthy();
  expect(screen.queryByRole("list", { name: "Recorded ingredient writers" })).toBeNull();
});
