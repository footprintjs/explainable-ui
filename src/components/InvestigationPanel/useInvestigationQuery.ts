import { useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "../../_internal/useIsomorphicLayoutEffect";
import type { InvestigationPort, InvestigationResult } from "./types";

type ExplanationAdmission<Result extends InvestigationResult> = (value: unknown, requested: string) => Result | undefined;
type RequestOwner<Result extends InvestigationResult> = {
  owner: object; admission: ExplanationAdmission<Result>; nodeId: string; request: AbortController;
};
export type InvestigationQueryState<Result extends InvestigationResult = InvestigationResult> = {
  [Status in "loading" | "error" | "refused"]: RequestOwner<Result> & { status: Status }
}["loading" | "error" | "refused"] | RequestOwner<Result> & { status: "ready"; result: Result };

/** One committed binding and one active request. Views share this controller, never another causal walker. */
export function useInvestigationQuery<Result extends InvestigationResult>(port: InvestigationPort, admit: ExplanationAdmission<Result>) {
  const owner = port.binding;
  const currentOwner = useRef<object | null>(null);
  const committedAdmission = useRef<ExplanationAdmission<Result> | null>(null);
  const active = useRef<AbortController | null>(null);
  const [state, setState] = useState<InvestigationQueryState<Result> | null>(null);
  const [selection, setSelection] = useState<{ owner: object; nodeId: string } | null>(null);
  // Speculative renders cannot change the committed source. Cleanup invalidates
  // old requests before their host callbacks or promise settlements can be used.
  useIsomorphicLayoutEffect(() => {
    const strategyChanged = committedAdmission.current !== null && committedAdmission.current !== admit;
    currentOwner.current = owner;
    committedAdmission.current = admit;
    // Clear committed state, rather than merely hiding it behind a strategy tag:
    // a later A→B→A cycle must not revive an old accepted projection.
    if (strategyChanged) setState(null);
    else if (!active.current) setState(previous => previous?.owner === owner && previous.status === "loading" ? null : previous);
    return () => { currentOwner.current = null; active.current?.abort(); active.current = null; };
  }, [owner, admit]);
  const close = () => {
    if (currentOwner.current !== owner || committedAdmission.current !== admit) return;
    active.current?.abort(); active.current = null; setState(null);
  };
  const select = (nodeId: string) => {
    if (currentOwner.current !== owner || committedAdmission.current !== admit) return;
    close(); setSelection({ owner, nodeId });
  };
  const query = (nodeId: string) => {
    const controller = new AbortController();
    if (currentOwner.current !== owner || committedAdmission.current !== admit) { controller.abort(); return controller; }
    active.current?.abort(); active.current = controller;
    setSelection({ owner, nodeId });
    setState({ owner, admission: admit, nodeId, request: controller, status: "loading" });
    Promise.resolve().then(() => {
      if (controller.signal.aborted || currentOwner.current !== owner || committedAdmission.current !== admit) return undefined;
      return port.explain(nodeId, { signal: controller.signal });
    }).then(value => {
      if (active.current !== controller || controller.signal.aborted || currentOwner.current !== owner || committedAdmission.current !== admit) return;
      const result = admit(value, nodeId);
      setState(result ? { owner, admission: admit, nodeId, request: controller, status: "ready", result } : { owner, admission: admit, nodeId, request: controller, status: "refused" });
    }, () => {
      if (active.current === controller && !controller.signal.aborted && currentOwner.current === owner && committedAdmission.current === admit)
        setState({ owner, admission: admit, nodeId, request: controller, status: "error" });
    });
    return controller;
  };
  return { owner, currentOwner, active, selected: state?.owner === owner && state.admission === admit ? state : null,
    selection: selection?.owner === owner ? selection.nodeId : undefined, query, close, select };
}
export type InvestigationController<Result extends InvestigationResult = InvestigationResult> = ReturnType<typeof useInvestigationQuery<Result>>;
