import { FootprintButton, componentStyles, theme } from "../../../theme";
import type { Size } from "../../../types";
import type { VisitChoice } from "./useSubflowNavigation";
interface Props {
  staleInputs: boolean;
  notice: string;
  choice: VisitChoice | null;
  onChoose: (mountKey: string, choices: ReadonlyMap<string, string>) => void;
  onDismiss: () => void;
  unstyled?: boolean;
  size?: Size;
}
/** User-facing feedback stays separate from the navigation state machine. */
export function SubflowNavigationStatus({
  staleInputs,
  notice,
  choice,
  onChoose,
  onDismiss,
  unstyled = false,
  size = "default",
}: Props) {
  const ui = componentStyles(size);
  const noticeStyle = unstyled ? undefined : { padding: ui.padding, fontSize: ui.body, lineHeight: ui.lineHeight, color: theme.textPrimary };
  const buttonStyle = unstyled ? undefined : { fontFamily: theme.fontSans, fontSize: ui.body,
    padding: ui.controlPadding, border: `${ui.borderWidth} solid ${theme.border}`,
    borderRadius: ui.radiusControl, color: theme.textPrimary, background: theme.bgPrimary };
  return (
    <>
      {staleInputs && (
        <div
          data-fp="companion-source-note"
          role="status"
          style={noticeStyle}
        >
          Some details from the previous run were withheld. Their evidence for
          this run is unknown.
        </div>
      )}
      {notice && (
        <div data-fp="source-change-note" role="status" style={noticeStyle}>
          {notice}{" "}
          <FootprintButton type="button" part="navigation-dismiss" onClick={onDismiss} defaultStyle={buttonStyle}>
            Dismiss
          </FootprintButton>
        </div>
      )}
      {choice && (
        <div
          data-fp="subflow-visit-choice"
          role="group"
          aria-label="Choose subflow visit"
          style={noticeStyle}
        >
          <div>This step ran {choice.visits.length} times. Choose a visit:</div>
          {choice.visits.map((visit) => (
            <FootprintButton
              type="button"
              key={visit.runtimeStageId}
              part="navigation-choose-visit"
              onClick={() =>
                onChoose(
                  choice.mountKey,
                  new Map([
                    ...choice.selectedInvocations,
                    [choice.choiceKey, visit.runtimeStageId],
                  ])
                )
              } defaultStyle={buttonStyle}
            >
              step {visit.step} · visit {visit.visit} of {visit.total}
            </FootprintButton>
          ))}
          <FootprintButton type="button" part="navigation-cancel" onClick={onDismiss} defaultStyle={buttonStyle}>
            Cancel
          </FootprintButton>
        </div>
      )}
    </>
  );
}
