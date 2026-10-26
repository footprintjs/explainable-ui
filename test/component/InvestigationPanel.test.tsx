/** @vitest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvestigationPanel } from "../../src/components/InvestigationPanel/InvestigationPanel";
import type { InvestigationPort } from "../../src/components/InvestigationPanel/types";
import {
  attention,
  canonicalFixturePort,
  earlier,
  explanation,
  later,
  selected,
} from "../fixtures/investigation/recorded";

const makePort = (
  query = vi.fn<InvestigationPort["explain"]>(async () => explanation)
) => ({ binding: {}, attention, explain: query });
const open = () =>
  fireEvent.click(screen.getByRole("button", { name: "Investigate item 1" }));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("host-bound on-demand investigation", () => {
  it("presents an unavailable investigation when the host supplies no port", () => {
    render(<InvestigationPanel port={null} />);
    expect(
      screen.getByText("Investigation is unavailable for this recording.")
    ).toBeTruthy();
  });

  it("renders a real canonical explain result without another traversal or adapter", async () => {
    render(<InvestigationPanel port={canonicalFixturePort()} />);
    open();
    await screen.findByText("Supported root cause");
    expect(screen.getByText("Load · visit 2")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Show affected items" })
    );
    expect(screen.getByText("Save · visit 2")).toBeTruthy();
  });

  it("accepts a future canonical edge attribution without translating or traversing it", async () => {
    const future = {
      ...explanation,
      impact: {
        ...explanation.impact,
        edges: [
          {
            ...explanation.impact.edges[0],
            attribution: "recorded-read" as const,
          },
        ],
      },
    };
    const port: InvestigationPort = { ...makePort(), explain: () => future };
    render(<InvestigationPanel port={port} />);
    open();
    await screen.findByText("Supported root cause");
    fireEvent.click(
      screen.getByRole("button", { name: "Show affected items" })
    );
    expect(screen.getByText(later)).toBeTruthy();
  });

  it("does no eager query, starts collapsed, and only asks for the selected stable ID", async () => {
    const port = makePort();
    render(<InvestigationPanel port={port} />);
    expect(port.explain).not.toHaveBeenCalled();
    expect(screen.queryByText(earlier)).toBeNull();
    open();
    await screen.findByText("Supported root cause");
    expect(port.explain).toHaveBeenCalledTimes(1);
    expect(port.explain.mock.calls[0]?.[0]).toBe(selected);
    expect(screen.getByText(earlier)).toBeTruthy();
    expect(screen.queryByText(later)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Show affected items" })
    );
    expect(screen.getByText(later)).toBeTruthy();
    expect(port.explain).toHaveBeenCalledTimes(1);
  });

  it("cancels on scope, visit, attempt or run replacement and isolates stale settlements", async () => {
    const old = deferred<typeof explanation>();
    const query = vi.fn<InvestigationPort["explain"]>(() => old.promise);
    const port = makePort(query);
    const { rerender } = render(<InvestigationPanel port={port} />);
    open();
    await waitFor(() => expect(query).toHaveBeenCalledTimes(1));
    const signal = (query.mock.calls[0]?.[1] as { signal: AbortSignal }).signal;
    const next = makePort();
    rerender(<InvestigationPanel port={next} />);
    expect(signal.aborted).toBe(true);
    expect(screen.queryByText("Loading explanation…")).toBeNull();
    await act(async () => old.resolve(explanation));
    expect(screen.queryByText("Supported root cause")).toBeNull();
    expect(next.explain).not.toHaveBeenCalled();
    open();
    await screen.findByText("Supported root cause");
  });

  it("preserves a supported root when only forward impact evidence is limited", async () => {
    const gap = { code: "node-limit", evidence: [] } as const;
    const result = {
      ...explanation,
      confidence: "incomplete",
      gaps: [gap],
      impact: { ...explanation.impact, confidence: "incomplete", gaps: [gap] },
    } as const;
    render(
      <InvestigationPanel
        port={makePort(vi.fn<InvestigationPort["explain"]>(async () => result))}
      />
    );
    open();
    await screen.findByText("Supported root cause");
    fireEvent.click(
      screen.getByRole("button", { name: "Show affected items" })
    );
    expect(
      screen.getByText(
        "Affected-item coverage is incomplete. Unlisted items remain unknown."
      )
    ).toBeTruthy();
  });

  it("keeps an open query through ordinary host rerenders with the same binding", async () => {
    const pending = deferred<typeof explanation>();
    const query = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const port = makePort(query);
    const { rerender } = render(<InvestigationPanel port={port} />);
    open();
    await waitFor(() => expect(query).toHaveBeenCalledTimes(1));
    const signal = query.mock.calls[0]![1].signal;
    rerender(
      <InvestigationPanel
        port={{ ...port, explain: (id, context) => query(id, context) }}
      />
    );
    expect(signal.aborted).toBe(false);
    await act(async () => pending.resolve(explanation));
    await screen.findByText("Supported root cause");
  });

  it("cancels on collapse and unmount even when the host ignores cancellation", async () => {
    const pending = deferred<typeof explanation>();
    const query = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const { unmount } = render(<InvestigationPanel port={makePort(query)} />);
    open();
    await waitFor(() => expect(query).toHaveBeenCalledTimes(1));
    const signal = (query.mock.calls[0]?.[1] as { signal: AbortSignal }).signal;
    fireEvent.click(
      screen.getByRole("button", { name: "Close investigation" })
    );
    expect(signal.aborted).toBe(true);
    await act(async () => pending.resolve(explanation));
    expect(screen.queryByText("Supported root cause")).toBeNull();
    unmount();
  });

  it.each([
    { ...explanation, nodeId: "another-visit" },
    { ...explanation, confidence: "unknown" },
    { ...explanation, rootCause: "not-in-path" },
    { ...explanation, alternatives: [earlier] },
    {
      ...explanation,
      gaps: [{ code: "brand-new-unknown-code", evidence: [] }],
    },
    {
      ...explanation,
      impact: { ...explanation.impact, nodes: Array(257).fill(later) },
    },
    { ...explanation, path: Array(257).fill(selected) },
  ])("refuses malformed, mismatched or oversized results", async (result) => {
    render(
      <InvestigationPanel
        port={makePort(
          vi.fn<InvestigationPort["explain"]>(
            async () => result as typeof explanation
          )
        )}
      />
    );
    open();
    await screen.findByText("This explanation could not be verified.");
    expect(screen.queryByText("Supported root cause")).toBeNull();
  });

  it("keeps partial evidence, alternatives and gaps unknown without a root claim", async () => {
    const result = {
      ...explanation,
      rootCause: undefined,
      alternatives: [earlier],
      confidence: "incomplete",
      gaps: [{ code: "not-collected", evidence: ["record:missing"] }],
    } as const;
    render(
      <InvestigationPanel
        port={makePort(
          vi.fn<InvestigationPort["explain"]>(
            async () => result as unknown as typeof explanation
          )
        )}
      />
    );
    open();
    await screen.findByText("Root cause unknown");
    expect(screen.getByText("Alternative candidates")).toBeTruthy();
    expect(screen.getByText("Some evidence was not collected.")).toBeTruthy();
    expect(screen.queryByText("Supported root cause")).toBeNull();
  });

  it("renders hostile labels as text and hides thrown host details", async () => {
    const evil = "<img src=x onerror=alert(1)>";
    const port = {
      ...makePort(
        vi.fn<InvestigationPort["explain"]>(async () => {
          throw new Error("secret provider detail");
        })
      ),
      labels: { [selected]: evil },
    };
    const { container } = render(<InvestigationPanel port={port} />);
    expect(screen.getByText(evil)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    open();
    await screen.findByText("Explanation unavailable. Try again.");
    expect(screen.queryByText(/secret provider detail/)).toBeNull();
  });

  it("refuses invalid attention and never treats an incomplete empty list as healthy", () => {
    const { rerender } = render(
      <InvestigationPanel
        port={{
          ...makePort(),
          attention: { nodes: [], confidence: "incomplete", gaps: [] },
        }}
      />
    );
    expect(
      screen.getByText("No attention items are available. Coverage is unknown.")
    ).toBeTruthy();
    rerender(
      <InvestigationPanel
        port={{
          ...makePort(),
          attention: {
            ...attention,
            nodes: Array(257).fill(attention.nodes[0]),
          },
        }}
      />
    );
    expect(
      screen.getByText("The attention list could not be verified.")
    ).toBeTruthy();
  });
});
