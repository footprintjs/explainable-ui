/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useInvestigationQuery } from "../../src/components/InvestigationPanel/useInvestigationQuery";
import { admitExplanation } from "../../src/components/InvestigationPanel/admission";
import type { InvestigationPort } from "../../src/components/InvestigationPanel/types";

it.each(["close", "select", "query"] as const)("a retained %s callback cannot disturb a newer committed binding", async action => {
  const pending = new Promise<never>(() => {});
  const a: InvestigationPort = { binding: {}, attention: { nodes: [], confidence: "complete", gaps: [] }, explain: vi.fn(() => pending) };
  const b: InvestigationPort = { ...a, binding: {}, explain: vi.fn(() => pending) };
  const hook = renderHook(({ port }) => useInvestigationQuery(port, admitExplanation), { initialProps: { port: a } });
  const old = hook.result.current;
  hook.rerender({ port: b });
  act(() => { hook.result.current.query("new-selection"); });
  await waitFor(() => expect(b.explain).toHaveBeenCalledTimes(1));
  const signal = vi.mocked(b.explain).mock.calls[0]![1].signal;
  act(() => { if (action === "close") old.close(); else old[action]("old-selection"); });
  expect(signal.aborted).toBe(false);
  expect(hook.result.current.selection).toBe("new-selection");
  expect(hook.result.current.selected?.status).toBe("loading");
  expect(a.explain).not.toHaveBeenCalled();
});
