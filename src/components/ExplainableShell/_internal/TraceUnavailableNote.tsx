import type { TraceAvailability } from "./traceScope";
export function TraceUnavailableNote({
  availability,
  scopeLabel = "Child",
}: {
  availability: TraceAvailability;
  scopeLabel?: "Root" | "Child";
}) {
  if (availability.ok) return null;
  const reason =
    availability.reason === "too-large"
      ? `${scopeLabel} trace is too large to trace here (${availability.items ?? "more than 100,000"} items).`
      : availability.reason === "no-history"
        ? `${scopeLabel} trace history was not recorded.`
        : `${scopeLabel} trace evidence is unavailable or malformed.`;
  return (
    <div data-fp="trace-unavailable" role="status" style={{ padding: 14 }}>
      {reason} Dependencies are unknown.
      {scopeLabel === "Child" && " No parent record was substituted."}
    </div>
  );
}

export function StoryUnavailableNote() {
  return (
    <div data-fp="story-narrative">
      <div data-fp="story-unavailable" role="status">
        Story for this source run is unknown until paired narrative is supplied.
      </div>
    </div>
  );
}
