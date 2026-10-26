/** @vitest-environment jsdom */
import {
  StrictMode,
  Suspense,
  startTransition,
  useLayoutEffect,
  useState,
} from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvestigationPanel } from "../../src/components/InvestigationPanel/InvestigationPanel";
import type {
  InvestigationPort,
  InvestigationResult,
} from "../../src/components/InvestigationPanel/types";

const result: InvestigationResult = {
  nodeId: "visit:A",
  attention: [],
  rootCause: "root:A",
  path: ["visit:A", "root:A"],
  alternatives: [],
  confidence: "complete",
  gaps: [],
  impact: { nodes: [], confidence: "complete", gaps: [] },
};
const attention: InvestigationPort["attention"] = {
  nodes: [{ nodeId: "visit:A", attention: [] }],
  confidence: "complete",
  gaps: [],
};
function deferred() {
  let resolve!: (value: InvestigationResult) => void;
  const promise = new Promise<InvestigationResult>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function open() {
  fireEvent.click(screen.getByRole("button", { name: "Investigate item 1" }));
}
function port(explain: InvestigationPort["explain"]): InvestigationPort {
  return { binding: {}, attention, explain };
}

describe("committed investigation ownership", () => {
  it("retains A while a speculative B transition suspends and is abandoned", async () => {
    const pending = deferred();
    const explain = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const a = port(explain),
      b = port(() => result);
    const never = new Promise<never>(() => {});
    let update!: Dispatch<
      SetStateAction<{ port: InvestigationPort; block: boolean }>
    >;
    function Block(): never {
      throw never;
    }
    function Host() {
      const [next, setNext] = useState({ port: a, block: false });
      update = setNext;
      return (
        <Suspense fallback={<p>New view pending</p>}>
          <InvestigationPanel port={next.port} />
          {next.block && <Block />}
        </Suspense>
      );
    }
    render(<Host />);
    open();
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
    const signal = explain.mock.calls[0]![1].signal;
    await act(async () => {
      startTransition(() => update({ port: b, block: true }));
    });
    expect(screen.queryByText("New view pending")).toBeNull();
    expect(signal.aborted).toBe(false);
    await act(async () => pending.resolve(result));
    await act(async () => update({ port: a, block: false }));
    expect(signal.aborted).toBe(false);
    expect(screen.getByText("Supported root cause")).toBeTruthy();
    expect(screen.queryByText("Loading explanation…")).toBeNull();
  });

  it("returns from a committed Suspense fallback without an orphaned loading state", async () => {
    const pending = deferred();
    const explain = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const a = port(explain);
    const never = new Promise<never>(() => {});
    let update!: Dispatch<SetStateAction<boolean>>;
    function Block(): never {
      throw never;
    }
    function Host() {
      const [blocked, setBlocked] = useState(false);
      update = setBlocked;
      return (
        <Suspense fallback={<p>View temporarily hidden</p>}>
          <InvestigationPanel port={a} />
          {blocked && <Block />}
        </Suspense>
      );
    }
    render(<Host />);
    open();
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
    const signal = explain.mock.calls[0]![1].signal;
    await act(async () => update(true));
    expect(screen.getByText("View temporarily hidden")).toBeTruthy();
    expect(signal.aborted).toBe(true);
    await act(async () => pending.resolve(result));
    await act(async () => update(false));
    expect(screen.queryByText("Loading explanation…")).toBeNull();
    expect(screen.queryByText("Supported root cause")).toBeNull();
    expect(explain).toHaveBeenCalledTimes(1);
    open();
    await screen.findByText("Supported root cause");
    expect(explain).toHaveBeenCalledTimes(2);
  });

  it("invalidates A during B commit before a sibling layout effect or passive effects", async () => {
    const pending = deferred();
    const explain = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const a = port(explain),
      b = port(() => result);
    let signal: AbortSignal | undefined;
    const observed: boolean[] = [];
    function Witness({ value }: { value: InvestigationPort }) {
      useLayoutEffect(() => {
        if (value === b) {
          observed.push(signal?.aborted === true);
          pending.resolve(result);
        }
      }, [value]);
      return null;
    }
    const { rerender } = render(
      <>
        <InvestigationPanel port={a} />
        <Witness value={a} />
      </>
    );
    open();
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
    signal = explain.mock.calls[0]![1].signal;
    rerender(
      <>
        <InvestigationPanel port={b} />
        <Witness value={b} />
      </>
    );
    expect(observed).toEqual([true]);
    await act(async () => {});
    expect(screen.queryByText("Supported root cause")).toBeNull();
    expect(screen.queryByText("Loading explanation…")).toBeNull();
    open();
    await screen.findByText("Supported root cause");
  });

  it("aborts pending work during removal before a remaining sibling layout effect", async () => {
    const pending = deferred();
    const explain = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const a = port(explain);
    let signal: AbortSignal | undefined;
    const observed: boolean[] = [];
    function Witness({ removed }: { removed: boolean }) {
      useLayoutEffect(() => {
        if (removed) {
          observed.push(signal?.aborted === true);
          pending.resolve(result);
        }
      }, [removed]);
      return null;
    }
    const { rerender } = render(
      <>
        <InvestigationPanel port={a} />
        <Witness removed={false} />
      </>
    );
    open();
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
    signal = explain.mock.calls[0]![1].signal;
    rerender(
      <>
        <Witness removed={true} />
      </>
    );
    expect(observed).toEqual([true]);
    await act(async () => {});
    expect(screen.queryByRole("region", { name: "Investigation" })).toBeNull();
  });

  it("keeps user queries through StrictMode effect replay and same-binding callback changes", async () => {
    const pending = deferred();
    const explain = vi.fn<InvestigationPort["explain"]>(() => pending.promise);
    const a = port(explain);
    const { rerender, unmount } = render(
      <StrictMode>
        <InvestigationPanel port={a} />
      </StrictMode>
    );
    expect(explain).not.toHaveBeenCalled();
    open();
    await waitFor(() => expect(explain).toHaveBeenCalledTimes(1));
    const signal = explain.mock.calls[0]![1].signal;
    rerender(
      <StrictMode>
        <InvestigationPanel
          port={{ ...a, explain: (id, context) => explain(id, context) }}
        />
      </StrictMode>
    );
    expect(signal.aborted).toBe(false);
    await act(async () => pending.resolve(result));
    await screen.findByText("Supported root cause");
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
