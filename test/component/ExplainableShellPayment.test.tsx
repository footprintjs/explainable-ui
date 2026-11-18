/** @vitest-environment jsdom */
import * as React from "react";
import { readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";

function askAboutShipped(mode: "on" | "default") {
  const snapshot = JSON.parse(readFileSync(`test/fixtures/payment-subflow/${mode}.json`, "utf8"));
  render(<ExplainableShell runtimeSnapshot={snapshot} renderFlowchart={() => null}/>);
  fireEvent.click(screen.getByRole("button", { name: "Inspector" }));
  fireEvent.click(screen.getByLabelText("Next stage"));
  fireEvent.click(screen.getByLabelText("Next stage"));
  fireEvent.click(screen.getByRole("button", { name: "Inspect write shipped" }));
  fireEvent.click(screen.getByRole("button", { name: "Backtrack write shipped" }));
}

const card = () => within(document.querySelector('[data-fp="trace-walk-card"]') as HTMLElement);

describe("Payment Backtrack on the Shell's shared replay cursor", () => {
  it("crosses the output and input mappings and returns to the exact Ship activity control", async () => {
    askAboutShipped("on");
    fireEvent.click(await card().findByTitle("Follow receipt — re-anchor the walk on its writer"));
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
    fireEvent.click(await card().findByTitle("Follow receipt — re-anchor the walk on its writer"));
    expect(await card().findByText(/not collected/i)).toBeTruthy();
    expect(card().getByText(/output handoff.*collection unknown/i)).toBeTruthy();
    expect(card().queryByRole("button", { name: /Follow child source/ })).toBeNull();
  });
});
