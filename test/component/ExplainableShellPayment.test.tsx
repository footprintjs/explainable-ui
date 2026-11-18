/** @vitest-environment jsdom */
import { paymentWithTwoStageReads } from "../fixtures/payment-subflow/twoStageReads";
import * as React from "react";
import { readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";

function openAtShip(snapshot: unknown) {
  render(<ExplainableShell runtimeSnapshot={snapshot as React.ComponentProps<typeof ExplainableShell>["runtimeSnapshot"]} renderFlowchart={() => null}/>);
  fireEvent.click(screen.getByRole("button", { name: "Inspector" }));
  fireEvent.click(screen.getByLabelText("Next stage"));
  fireEvent.click(screen.getByLabelText("Next stage"));
}

function askAboutShipped(mode: "on" | "default") {
  openAtShip(JSON.parse(readFileSync(`test/fixtures/payment-subflow/${mode}.json`, "utf8")));
  fireEvent.click(screen.getByRole("button", { name: "Inspect write shipped" }));
  fireEvent.click(screen.getByRole("button", { name: "Backtrack write shipped" }));
}

const card = () => within(document.querySelector('[data-fp="trace-walk-card"]') as HTMLElement);

describe("Payment Backtrack on the Shell's shared replay cursor", () => {
  it("crosses the output and input mappings and returns to the exact Ship activity control", async () => {
    askAboutShipped("on");
    fireEvent.click(await card().findByRole("button", { name: /Inspect stage read receipt.*commit 1/ }));
    fireEvent.click(await card().findByRole("button", { name: "Follow child source txnId in payment#1" }));
    expect(document.querySelector('[data-fp="twc-stop-headline"]')?.textContent).toContain("payment/Charge");
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("Tracing txnId");
    const parent = await card().findByRole("button", { name: "Follow parent source amount in payment#1" });
    expect(parent).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open parent source amount" }));
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("Tracing amount");
    expect(document.querySelector('[data-fp="twc-stop-headline"]')?.textContent).toContain("Seed");
    fireEvent.click(card().getByRole("button", { name: "Return to Ship activity" }));
    const origin = await screen.findByRole("button", { name: "Inspect write shipped" });
    expect(origin).toBe(document.activeElement);
  });

  it("keeps two observed reads of receipt separate from the shipped itinerary and each other", async () => {
    openAtShip(paymentWithTwoStageReads());
    fireEvent.click(screen.getByText("Data Trace"));
    fireEvent.click(within(document.querySelector('[data-fp="trace-any"]') as HTMLElement).getByRole("button", { name: "shipped" }));
    const group = await card().findByRole("group", { name: "Recorded stage reads" });
    expect(within(group).getByRole("heading", { name: "Recorded stage reads" })).toBeTruthy();
    expect(within(group).getAllByRole("button")).toHaveLength(2);
    expect(card().getByText("The record does not tie a particular read to this write.")).toBeTruthy();
    expect(document.querySelectorAll('[data-fp="twc-itinerary-row"]')).toHaveLength(1);
    expect(card().queryByTitle(/Follow receipt/)).toBeNull();
    expect(document.querySelector('[data-fp="trace-read-edge"]')).toBeNull();
    for (const commit of [1, 2]) {
      fireEvent.click(await card().findByRole("button", { name: new RegExp(`Inspect stage read receipt.*commit ${commit}`) }));
      await waitFor(() => expect(card().getByText(`Stage read · commit ${commit}`)).toBeTruthy());
      expect(document.querySelector('[data-fp="twc-stop-headline"]')?.textContent).toContain("Payment");
      expect(card().getByText(commit === 1 ? '= "TXN-99"' : '= "TXN-REVISED"')).toBeTruthy();
      fireEvent.click(card().getByRole("button", { name: "Return to shipped in root" }));
      await card().findByRole("group", { name: "Recorded stage reads" });
      expect(document.querySelector('[data-fp="twc-stop-headline"]')?.textContent).toContain("Ship");
    }
  });

  it.each([false, true])("keeps a redacted receipt at Ship's read cutoff when an older visible writer exists: %s", async older => {
    const snapshot = JSON.parse(readFileSync("test/fixtures/payment-subflow/on.json", "utf8"));
    if (older) {
      snapshot.commitLog[0].overwrite.receipt = "previous receipt";
      snapshot.commitLog[0].trace.push({ path: "receipt", verb: "set", readKeys: [] });
    }
    const payment = snapshot.commitLog[1];
    payment.redactedPaths.push("receipt");
    payment.overwrite.receipt = "[REDACTED]";
    payment.trace = [];
    render(<ExplainableShell runtimeSnapshot={snapshot} renderFlowchart={() => null}/>);
    fireEvent.click(screen.getByRole("button", { name: "Inspector" }));
    fireEvent.click(screen.getByLabelText("Next stage"));
    fireEvent.click(screen.getByLabelText("Next stage"));
    fireEvent.click(screen.getByRole("button", { name: "Inspect read receipt" }));
    fireEvent.click(screen.getByRole("button", { name: "Backtrack read receipt" }));
    expect(document.querySelector('[data-fp="twc-itinerary-row"]')).toBeNull();
    await waitFor(() => expect(card().getByText(/privacy/i)).toBeTruthy());
    expect(document.querySelector('[data-fp="twc-itinerary-row"]')).toBeNull();
    expect(document.querySelector('[data-fp="trace-walk-card"]')?.textContent).not.toMatch(/previous receipt|no recorded write/i);
    expect(document.querySelector('[data-fp="tt-tick"][data-active="true"]')?.getAttribute("title")).toMatch(/Ship/i);
  });

  it("names the disabled per-write channel separately from the unknown output mapping", async () => {
    askAboutShipped("default");
    fireEvent.click(await card().findByRole("button", { name: /Inspect stage read receipt.*commit 1/ }));
    expect(await card().findByText(/not collected/i)).toBeTruthy();
    expect(card().getByText(/output handoff.*collection unknown/i)).toBeTruthy();
    expect(card().queryByRole("button", { name: /Follow child source/ })).toBeNull();
  });
});
