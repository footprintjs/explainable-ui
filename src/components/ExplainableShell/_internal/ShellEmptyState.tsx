import type { CSSProperties, ReactElement } from 'react';
import type { LensRecordingStatus } from '../../../workbench';
import type { BaseComponentProps } from '../../../types';
import type { ProgressiveRenderingOptions } from '../../../progressiveRendering';
import { FootprintLoadStatus, theme } from '../../../theme';
import { EmptyShell } from './ShellChrome';

export interface ShellEmptyStateProps extends BaseComponentProps {
  recordingStatus: LensRecordingStatus;
  error?: string | null;
  indicator?: ProgressiveRenderingOptions['loadingIndicator'];
  themeVars?: CSSProperties;
}

/** Presentation only: supplied controller facts choose the existing empty/waiting messages. */
export function ShellEmptyState({ recordingStatus, error, indicator,
  themeVars = {}, size = 'default', unstyled = false, className, style,
}: ShellEmptyStateProps): ReactElement {
  if (recordingStatus.reason === "identity-unavailable" || (recordingStatus.status === "waiting" && recordingStatus.reason === "no-stages")) return <FootprintLoadStatus state={recordingStatus.status === "error" ? "error" : "loading"}
    label={recordingStatus.status === "error" ? "Recorded stage identity is unavailable." : "Waiting for recorded execution…"}
    indicator={indicator} densitySize={size} unstyled={unstyled} className={className}
    style={{ ...themeVars, ...style }} part="recording-waiting" />;
  const shellStyle = { ...themeVars, ...style } as CSSProperties;
  if (recordingStatus.reason === "unreadable") {
    return (
      <EmptyShell
        unstyled={unstyled}
        className={className}
        style={shellStyle}
        reason="That snapshot could not be read."
        detail={
          <>
            <div>
              Expected a footprintjs <code>executor.getSnapshot()</code> —{" "}
              <code>{"{ sharedState, executionTree, commitLog }"}</code>.
            </div>
            <div style={unstyled ? undefined : { fontFamily: theme.fontMono, fontSize: 11, marginTop: 6 }}>
              {error}
            </div>
          </>
        }
      />
    );
  }
  const gotRunData = recordingStatus.reason !== 'no-recording';
  return (
    <EmptyShell
      unstyled={unstyled}
      className={className}
      style={shellStyle}
      reason={gotRunData ? "That run has no stages to show." : "No run to show yet."}
      detail={
        gotRunData ? (
          <div>
            The snapshot was read fine but its <code>executionTree</code> is empty — a run that
            was never executed, or a snapshot taken before <code>run()</code> finished.
          </div>
        ) : (
          <>
            <div>
              Pass a recorded run: <code>runtimeSnapshot={"{executor.getSnapshot()}"}</code> (the
              shell converts it), or pre-converted{" "}
              <code>snapshots={"{toVisualizationSnapshots(...)}"}</code>.
            </div>
            <div>
              Add <code>traceGraph</code> for the chart — it comes from the chart&apos;s
              structure, not the snapshot.
            </div>
          </>
        )
      }
    />
  );
}
