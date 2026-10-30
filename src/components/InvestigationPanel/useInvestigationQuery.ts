import { useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "../../_internal/useIsomorphicLayoutEffect";
import type { InvestigationPort, InvestigationResult } from "./types";

type RequestOwner = { owner: object; nodeId: string; request: AbortController };
export type InvestigationQueryState<Result extends InvestigationResult = InvestigationResult> = {
  [Status in "loading" | "error" | "refused"]: RequestOwner & { status: Status }
}["loading" | "error" | "refused"] | RequestOwner & { status: "ready"; result: Result };
type ExplanationAdmission<Result extends InvestigationResult> = (value: unknown, requested: string) => Result | undefined;

/** One committed binding and one active request. Views share this controller, never another causal walker. */
export function useInvestigationQuery<Result extends InvestigationResult>(port: InvestigationPort, admit: ExplanationAdmission<Result>) {
  const owner = port.binding;
  const currentOwner = useRef<object | null>(null);
  const active = useRef<AbortController | null>(null);
  const [state, setState] = useState<InvestigationQueryState<Result> | null>(null);
  const [selection, setSelection] = useState<{ owner: object; nodeId: string } | null>(null);
  // Speculative renders cannot change the committed source. Cleanup invalidates
  // old requests before their host callbacks or promise settlements can be used.
  useIsomorphicLayoutEffect(() => {
    currentOwner.current = owner;
    if (!active.current) setState(previous => previous?.owner === owner && previous.status === "loading" ? null : previous);
    return () => { currentOwner.current = null; active.current?.abort(); active.current = null; };
  }, [owner]);
  const close = () => {
    if (currentOwner.current !== owner) return;
    active.current?.abort(); active.current = null; setState(null);
  };
  const select = (nodeId: string) => {
    if (currentOwner.current !== owner) return;
    close(); setSelection({ owner, nodeId });
  };
  const query = (nodeId: string) => {
    const controller = new AbortController();
    if (currentOwner.current !== owner) { controller.abort(); return controller; }
    active.current?.abort(); active.current = controller;
    setSelection({ owner, nodeId });
    setState({ owner, nodeId, request: controller, status: "loading" });
    Promise.resolve().then(() => {
      if (controller.signal.aborted || currentOwner.current !== owner) return undefined;
      return port.explain(nodeId, { signal: controller.signal });
    }).then(value => {
      if (active.current !== controller || controller.signal.aborted || currentOwner.current !== owner) return;
      const result = admit(value, nodeId);
      setState(result ? { owner, nodeId, request: controller, status: "ready", result } : { owner, nodeId, request: controller, status: "refused" });
    }, () => {
      if (active.current === controller && !controller.signal.aborted && currentOwner.current === owner)
        setState({ owner, nodeId, request: controller, status: "error" });
    });
    return controller;
  };
  return { owner, currentOwner, active, selected: state?.owner === owner ? state : null,
    selection: selection?.owner === owner ? selection.nodeId : undefined, query, close, select };
}
export type InvestigationController = ReturnType<typeof useInvestigationQuery<InvestigationResult>>;
