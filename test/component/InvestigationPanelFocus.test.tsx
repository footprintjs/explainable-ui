/** @vitest-environment jsdom */
import { StrictMode, Suspense, startTransition, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvestigationPanel } from "../../src/components/InvestigationPanel/InvestigationPanel";
import type {
  InvestigationPort,
  InvestigationResult,
} from "../../src/components/InvestigationPanel/types";

const ids = Array.from({ length: 22 }, (_, index) => `visit:${index + 1}`);
function result(nodeId: string): InvestigationResult {
  return {
    nodeId,
    attention: [],
    rootCause: `root:${nodeId}`,
    path: [nodeId, `root:${nodeId}`],
    alternatives: [],
    confidence: "complete",
    gaps: [],
    impact: { nodes: [`effect:${nodeId}`], confidence: "complete", gaps: [] },
  };
}
function makePort(
  explain: InvestigationPort["explain"] = result
): InvestigationPort {
  return {
    binding: {},
    attention: {
      nodes: ids.map((nodeId) => ({ nodeId, attention: [] })),
      confidence: "complete",
      gaps: [],
    },
    explain,
  };
}
function deferred() {
  let resolve!: (value: InvestigationResult) => void;
  const promise = new Promise<InvestigationResult>((done) => { resolve = done; });
  return { promise, resolve };
}
function open(number = 1) {
  const trigger = screen.getByRole("button", { name: `Investigate item ${number}` });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}
function explanation() {
  return screen.getByRole("region", { name: "Selected explanation" });
}
function close() {
  const trigger = screen.getByRole("button", { name: "Close investigation" });
  trigger.focus();
  fireEvent.click(trigger);
}

describe("investigation focus handoff", () => {
  it("focuses the committed explanation and restores a recreated attention item beyond page one", async () => {
    render(<InvestigationPanel port={makePort()} />);
    fireEvent.click(screen.getByRole("button", { name: "Show more attention items" }));
    const removed = open(21);
    expect(removed.isConnected).toBe(false);
    expect(document.activeElement).toBe(explanation());
    await screen.findByText("Supported root cause");
    close();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Investigate item 21" }));
  });

  it.each(["path", "impact", "alternatives"] as const)(
    "focuses a related %s query and returns to the original attention item",
    async (kind) => {
      const port = makePort((nodeId) => kind === "alternatives"
        ? { ...result(nodeId), rootCause: undefined, path: [], alternatives: [`alternative:${nodeId}`] }
        : result(nodeId));
      render(<InvestigationPanel port={port} />);
      open(2);
      await screen.findByText(kind === "alternatives" ? "Root cause unknown" : "Supported root cause");
      fireEvent.click(screen.getByRole("button", { name: {
        path: "Show recorded path", impact: "Show affected items", alternatives: "Show alternative candidates",
      }[kind] }));
      const related = screen.getByRole("button", { name: "Investigate related item 1" });
      related.focus();
      fireEvent.click(related);
      expect(related.isConnected).toBe(false);
      expect(document.activeElement).toBe(explanation());
      await waitFor(() => expect(explanation().getAttribute("aria-busy")).toBe("false"));
      close();
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Investigate item 2" }));
    }
  );

  it.each(["error", "unsupported"] as const)(
    "keeps focus through a host %s and restores attention on close",
    async (kind) => {
      const explain = vi.fn<InvestigationPort["explain"]>(() => {
        if (kind === "error") throw new Error("private host failure");
        return { ...result(ids[0]!), nodeId: "wrong-visit" };
      });
      render(<InvestigationPanel port={makePort(explain)} />);
      open();
      expect(document.activeElement).toBe(explanation());
      await screen.findByText(kind === "error" ? "Explanation unavailable. Try again." : "This explanation could not be verified.");
      expect(document.activeElement).toBe(explanation());
      if (kind === "error") {
        const retry = screen.getByRole("button", { name: "Try again" });
        retry.focus(); fireEvent.click(retry);
        expect(document.activeElement).toBe(explanation());
        await waitFor(() => expect(explain).toHaveBeenCalledTimes(2));
      }
      close();
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Investigate item 1" }));
    }
  );

  it("does not steal focus on async settlement or same-binding rerenders in Strict Mode", async () => {
    const pending = deferred(), explain = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const port = makePort(explain);
    const view = (value: InvestigationPort) => <StrictMode><button>Outside</button><InvestigationPanel port={value} /></StrictMode>;
    const { rerender } = render(view(port));
    const outside = screen.getByRole("button", { name: "Outside" });
    outside.focus();
    expect(explain).not.toHaveBeenCalled();
    open();
    expect(document.activeElement).toBe(explanation());
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
    outside.focus();
    rerender(view({ ...port, explain: (id, context) => explain(id, context) }));
    expect(document.activeElement).toBe(outside);
    await act(async () => pending.resolve(result(ids[0]!)));
    expect(document.activeElement).toBe(outside);
  });

  it.each(["binding", "null", "unmount"] as const)(
    "does not focus stale controls after %s replacement and late settlement",
    async (change) => {
      const pending = deferred(), explain = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
      const port = makePort(explain);
      const { rerender } = render(<><button>Outside</button><InvestigationPanel port={port} /></>);
      open();
      await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
      const outside = screen.getByRole("button", { name: "Outside" }); outside.focus();
      rerender(<><button>Outside</button>{change !== "unmount" && <InvestigationPanel port={change === "null" ? null : makePort()} />}</>);
      expect(explain.mock.calls[0]![1].signal.aborted).toBe(true);
      await act(async () => pending.resolve(result(ids[0]!)));
      expect(document.activeElement).toBe(outside);
      expect(screen.queryByRole("region", { name: "Selected explanation" })).toBeNull();
    }
  );

  it("discards queued focus when the same event commits a replacement binding", async () => {
    const explain = vi.fn<InvestigationPort["explain"]>(result);
    const a = makePort(explain), b = makePort();
    function Host() {
      const [port, setPort] = useState(a);
      const outside = useRef<HTMLButtonElement | null>(null);
      return <>
        <button ref={outside}>Outside</button>
        <div onClick={() => { outside.current?.focus(); setPort(b); }}>
          <InvestigationPanel port={port} />
        </div>
      </>;
    }
    render(<Host />);
    open();
    await act(async () => {});
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("region", { name: "Selected explanation" })).toBeNull();
    expect(explain).not.toHaveBeenCalled();
  });

  it("does not replay query focus after a ready explanation is hidden and revealed by Suspense", async () => {
    const port = makePort(), never = new Promise<never>(() => {});
    let update!: Dispatch<SetStateAction<boolean>>;
    function Block(): never { throw never; }
    function Host() {
      const [hidden, setHidden] = useState(false); update = setHidden;
      return <><button>Outside</button><Suspense fallback={<p>Hidden</p>}><InvestigationPanel port={port} />{hidden && <Block />}</Suspense></>;
    }
    render(<Host />); open(); await screen.findByText("Supported root cause");
    const outside = screen.getByRole("button", { name: "Outside" }); outside.focus();
    await act(async () => update(true));
    await act(async () => update(false));
    expect(document.activeElement).toBe(outside);
    close();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Investigate item 1" }));
  });

  it("uses only the committed panel for an explicit query while another binding suspends speculatively", async () => {
    const a = makePort(), b = makePort(), never = new Promise<never>(() => {});
    let update!: Dispatch<SetStateAction<{ port: InvestigationPort; blocked: boolean }>>;
    function Block(): never { throw never; }
    function Host() {
      const [next, setNext] = useState({ port: a, blocked: false }); update = setNext;
      return <Suspense fallback={<p>Pending binding</p>}><InvestigationPanel port={next.port} />{next.blocked && <Block />}</Suspense>;
    }
    render(<Host />); open(); await screen.findByText("Supported root cause");
    await act(async () => startTransition(() => update({ port: b, blocked: true })));
    expect(screen.queryByText("Pending binding")).toBeNull();
    open(2);
    expect(document.activeElement).toBe(explanation());
    await screen.findByText("root:visit:2");
    close();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Investigate item 2" }));
  });
});
