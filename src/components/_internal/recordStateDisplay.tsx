import type { FoldedState } from "foottrace";
import type { StageSnapshot } from "../../types";

/** One presentation policy for all memory surfaces; no record interpretation. */
export function recordStateDisplay(
  snapshot?: StageSnapshot,
  previous?: StageSnapshot
) {
  const evidence = snapshot?.recordState;
  if (!evidence) {
    return {
      memory: snapshot?.memory ?? {},
      previous: previous?.memory ?? null,
      canCompare: true,
      notices: [] as string[],
    };
  }
  if (evidence.status === "unavailable") {
    return {
      memory: null,
      previous: null,
      canCompare: false,
      notices: [`Recorded state unavailable: ${evidence.message}`],
    };
  }
  const notices: string[] = [];
  for (const [label, state] of [
    ["Selected state", evidence.current],
    ["Previous recorded state", evidence.previous],
  ] as const) {
    if (state.basis === "log-only")
      notices.push(
        `${label}: recorded writes only; the initial state was not recorded.`
      );
    if (state.redacted || state.redactedPaths.length)
      notices.push(
        `${label}: redacted values are withheld${
          state.redactedPaths.length
            ? ` (${state.redactedPaths.join(", ")})`
            : ""
        }.`
      );
    for (const gap of state.skipped ?? [])
      notices.push(`${label}: skipped record row ${gap.index}: ${gap.reason}`);
  }
  const complete = (state: FoldedState) =>
    state.basis === "initial+log" &&
    !state.redacted &&
    !state.redactedPaths.length &&
    !state.skipped?.length;
  const canCompare = complete(evidence.current) && complete(evidence.previous);
  if (!canCompare)
    notices.push(
      "Changes are not classified because one or both recorded states are incomplete."
    );
  return {
    memory: evidence.current.state,
    previous: evidence.previous.state,
    canCompare,
    notices,
  };
}

export function RecordStateNotice({
  view,
}: {
  view: ReturnType<typeof recordStateDisplay>;
}) {
  if (!view.notices.length) return null;
  return (
    <div data-fp="record-state-evidence" role="note">
      {view.notices.map((notice) => (
        <p key={notice}>{notice}</p>
      ))}
    </div>
  );
}
