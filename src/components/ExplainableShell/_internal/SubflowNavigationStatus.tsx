import type { VisitChoice } from "./useSubflowNavigation";
interface Props {
  staleInputs: boolean;
  notice: string;
  choice: VisitChoice | null;
  onChoose: (mountKey: string, choices: ReadonlyMap<string, string>) => void;
  onDismiss: () => void;
}
/** User-facing feedback stays separate from the navigation state machine. */
export function SubflowNavigationStatus({
  staleInputs,
  notice,
  choice,
  onChoose,
  onDismiss,
}: Props) {
  return (
    <>
      {staleInputs && (
        <div
          data-fp="companion-source-note"
          role="status"
          style={{ padding: 10 }}
        >
          Some details from the previous run were withheld. Their evidence for
          this run is unknown.
        </div>
      )}
      {notice && (
        <div data-fp="source-change-note" role="status" style={{ padding: 10 }}>
          {notice}{" "}
          <button type="button" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      )}
      {choice && (
        <div
          data-fp="subflow-visit-choice"
          role="group"
          aria-label="Choose subflow visit"
          style={{ padding: 10 }}
        >
          <div>This step ran {choice.visits.length} times. Choose a visit:</div>
          {choice.visits.map((visit) => (
            <button
              type="button"
              key={visit.runtimeStageId}
              onClick={() =>
                onChoose(
                  choice.mountKey,
                  new Map([
                    ...choice.selectedInvocations,
                    [choice.choiceKey, visit.runtimeStageId],
                  ])
                )
              }
            >
              step {visit.step} · visit {visit.visit} of {visit.total}
            </button>
          ))}
          <button type="button" onClick={onDismiss}>
            Cancel
          </button>
        </div>
      )}
    </>
  );
}
