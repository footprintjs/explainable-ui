import { FootprintButton, FootprintLoadStatus } from '../../../theme';
import type { Size } from '../../../types';
import type { ProgressiveRenderingOptions, RecordingSource } from '../../../progressiveRendering';
import type { PendingSubflow } from './useLazySubflowRequest';
export function LazySubflowStatus({ pending, options, size, unstyled }: { pending: PendingSubflow | null; options: ProgressiveRenderingOptions; size?: Size; unstyled?: boolean }) {
  if (!pending) return null;
  const label = pending.status === 'error' ? 'Could not load this recorded subflow. Its evidence remains unavailable.' :
    pending.status === 'preparing' ? 'Preparing this recorded subflow…' : 'Loading this recorded subflow…';
  return <FootprintLoadStatus part="subflow-load" state={pending.status} indicator={options.loadingIndicator} label={label} densitySize={size} unstyled={unstyled}>
    {' '}{pending.status === 'error' && <FootprintButton unstyled={unstyled} densitySize={size} part="subflow-retry" onClick={pending.retry}>Retry</FootprintButton>}
    {' '}<FootprintButton unstyled={unstyled} densitySize={size} part="subflow-load-cancel" onClick={pending.cancel}>{pending.status === 'error' ? 'Dismiss' : 'Cancel'}</FootprintButton>
  </FootprintLoadStatus>;
}
/** Loading an exact known mount requests evidence; only the existing trace reader may create a source link. */
export function LazyTraceEvidence({ source, path, mounts, pending, load, size, unstyled }: {
  source?: RecordingSource; path: readonly string[]; mounts: readonly string[]; pending: PendingSubflow | null;
  load: (request: { invocationPath: string[]; mountRuntimeStageId: string; subflowId: string }) => void;
  size?: Size; unstyled?: boolean;
}) {
  if (!source || pending) return null;
  return <>{mounts.filter(id => source.getSnapshot().scopes.get(source.getKey([...path, id]))?.status !== 'ready').map(id =>
    <FootprintButton key={id} unstyled={unstyled} densitySize={size} part="trace-load-evidence"
      onClick={() => load({ invocationPath: [...path, id], mountRuntimeStageId: id, subflowId: id.split('#')[0] })}>
      Load recorded subflow evidence: {id}
    </FootprintButton>)}</>;
}
