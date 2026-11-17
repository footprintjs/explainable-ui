import type { BaseComponentProps } from '../../types';
import { useOptionalControllerOwner } from '../../workbench';
import { TimeTravelRail } from './TimeTravelControls';

/** Stock transport presentation over an existing Lens controller; never creates another clock. */
export function LensReplayControls(props: BaseComponentProps) {
  const controller = useOptionalControllerOwner();
  if (!controller) throw new Error('LensReplayControls must be used inside LensControllerProvider or ExplainableShell.');
  return <TimeTravelRail {...props} snapshots={controller.activeSnapshots} selectedIndex={controller.safeIdx}
    onIndexChange={controller.value.actions.selectIndex} tracing={controller.value.tracingRail}
    replayControls={controller.options.replayControls} playback={controller.playback} offered={controller.offered} />;
}
