/** @vitest-environment jsdom */
import { Suspense, startTransition, useLayoutEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { admitExplanation, admitVisualExplanation } from "./admission";
import type { InvestigationPort, InvestigationResult } from "./types";
import { useInvestigationQuery } from "./useInvestigationQuery";

type Admission = Parameters<typeof useInvestigationQuery>[1];
const result: InvestigationResult = {
  nodeId: "selected", attention: [], path: ["selected"], alternatives: [],
  confidence: "complete", gaps: [], impact: { nodes: [], confidence: "complete", gaps: [] },
};
function deferred() {
  let resolve!: (value: InvestigationResult) => void;
  const promise = new Promise<InvestigationResult>(done => { resolve = done; });
  return { promise, resolve };
}
function port(explain: InvestigationPort["explain"]): InvestigationPort {
  return { binding: {}, attention: { nodes: [], confidence: "complete", gaps: [] }, explain };
}
function hookFor(source: InvestigationPort) {
  return renderHook(({ admit }: { admit: Admission }) => useInvestigationQuery(source, admit), {
    initialProps: { admit: admitExplanation as Admission },
  });
}

describe("committed admission strategy ownership", () => {
  it("keeps an ordinary same-strategy rerender's pending and ready request", async () => {
    const pending = deferred();
    const explain = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const source = port(explain), hook = hookFor(source);
    let request!: AbortController;
    act(() => { request = hook.result.current.query("selected"); });
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
    hook.rerender({ admit: admitExplanation });
    expect(request.signal.aborted).toBe(false);
    expect(hook.result.current.selected?.status).toBe("loading");
    await act(async () => pending.resolve(result));
    await waitFor(() => expect(hook.result.current.selected?.status).toBe("ready"));
    hook.rerender({ admit: admitExplanation });
    expect(request.signal.aborted).toBe(false);
    expect(hook.result.current.selected?.request).toBe(request);
    expect(hook.result.current.owner).toBe(source.binding);
    expect(explain).toHaveBeenCalledTimes(1);
  });

  it("aborts pending work on committed strategy change and requires another explicit query", async () => {
    const pending = deferred();
    const explain = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const source = port(explain), hook = hookFor(source);
    let old!: AbortController;
    act(() => { old = hook.result.current.query("selected"); });
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
    hook.rerender({ admit: admitVisualExplanation });
    expect(old.signal.aborted).toBe(true);
    expect(hook.result.current.selected).toBeNull();
    expect(hook.result.current.owner).toBe(source.binding);
    await act(async () => pending.resolve(result));
    expect(hook.result.current.selected).toBeNull();
    expect(explain).toHaveBeenCalledTimes(1);
    act(() => { hook.result.current.query("selected"); });
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(hook.result.current.selected?.status).toBe("ready"));
  });

  it("cannot revive a ready A result after a committed A→B→A cycle", async () => {
    const explain = vi.fn<InvestigationPort["explain"]>(() => result);
    const hook = hookFor(port(explain));
    act(() => { hook.result.current.query("selected"); });
    await waitFor(() => expect(hook.result.current.selected?.status).toBe("ready"));
    hook.rerender({ admit: admitVisualExplanation });
    hook.rerender({ admit: admitExplanation });
    expect(hook.result.current.selected).toBeNull();
    expect(explain).toHaveBeenCalledTimes(1);
  });

  it("suppresses a late A settlement even after committed B→A returns", async () => {
    const pending = deferred();
    const explain = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const hook = hookFor(port(explain));
    act(() => { hook.result.current.query("selected"); });
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
    hook.rerender({ admit: admitVisualExplanation });
    hook.rerender({ admit: admitExplanation });
    await act(async () => pending.resolve(result));
    expect(hook.result.current.selected).toBeNull();
    expect(explain).toHaveBeenCalledTimes(1);
  });

  it.each(["close", "select", "query"] as const)("makes a retained old-strategy %s callback inert", async action => {
    const pending = new Promise<InvestigationResult>(() => {});
    const explain = vi.fn<InvestigationPort["explain"]>(() => pending);
    const hook = hookFor(port(explain)), old = hook.result.current;
    hook.rerender({ admit: admitVisualExplanation });
    let current!: AbortController;
    act(() => { current = hook.result.current.query("selected"); });
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
    act(() => { if (action === "close") old.close(); else old[action]("old-selection"); });
    expect(current.signal.aborted).toBe(false);
    expect(hook.result.current.selection).toBe("selected");
    expect(hook.result.current.selected?.status).toBe("loading");
    await act(async () => {});
    expect(explain).toHaveBeenCalledTimes(1);
  });

  it("leaves the committed request usable when a speculative strategy render is abandoned", async () => {
    const pending = deferred();
    const explain = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const source = port(explain), never = new Promise<never>(() => {});
    let update!: Dispatch<SetStateAction<{ admit: Admission; blocked: boolean }>>;
    let committed!: ReturnType<typeof useInvestigationQuery<InvestigationResult>>;
    function Probe({ admit }: { admit: Admission }) {
      const controller = useInvestigationQuery(source, admit);
      useLayoutEffect(() => { committed = controller; });
      return <p>{controller.selected?.status ?? "idle"}</p>;
    }
    function Block(): never { throw never; }
    function Host() {
      const [next, setNext] = useState({ admit: admitExplanation as Admission, blocked: false });
      update = setNext;
      return <Suspense fallback={<p>Pending strategy</p>}><Probe admit={next.admit} />{next.blocked && <Block />}</Suspense>;
    }
    render(<Host />);
    let request!: AbortController;
    act(() => { request = committed.query("selected"); });
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
    await act(async () => startTransition(() => update({ admit: admitVisualExplanation, blocked: true })));
    expect(screen.queryByText("Pending strategy")).toBeNull();
    expect(request.signal.aborted).toBe(false);
    await act(async () => pending.resolve(result));
    await act(async () => update({ admit: admitExplanation, blocked: false }));
    expect(request.signal.aborted).toBe(false);
    expect(screen.getByText("ready")).toBeTruthy();
    expect(committed.owner).toBe(source.binding);
    expect(explain).toHaveBeenCalledTimes(1);
  });
});
