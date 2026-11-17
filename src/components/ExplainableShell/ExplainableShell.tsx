import { useState, useCallback, useMemo } from 'react';
import type { ExplainableShellProps } from './ShellProps';
import type { LensView } from './LensWorkbench';
import { LensControllerProvider, useOptionalControllerOwner } from '../../workbench';
import { resolveProgressiveRenderingOptions } from '../../progressiveRendering';
import { resolveReplayControlsOptions } from '../TimeTravelControls';
import { ownDataField } from '../../trace/safeRecordRead';
import { ShellPresentation } from './ShellPresentation';
export type { ExplainableShellProps, SpecNode, RecorderView, TraceTheme, ShellTab, PanelLabels, DefaultExpanded } from './ShellProps';
export type { RuntimeSnapshotInput } from '../../model/recording';
/** Default presentation facade over one shared renderless React controller. */
export function ExplainableShell(props: ExplainableShellProps) {
  const shared = useOptionalControllerOwner();
  const [audience, setAudience] = useState<LensView>(props.defaultView ?? "developer");
  const view = props.view ?? audience;
  const onViewChange = useCallback((next: LensView) => {
    if (props.view === undefined) setAudience(next);
    props.onViewChange?.(next);
  }, [props.view, props.onViewChange]);
  const changeView = props.view === undefined || props.onViewChange ? onViewChange : undefined;
  const configuredLayout = props.renderLayout ? undefined : props.layout;
  const replay = useMemo(() => resolveReplayControlsOptions(ownDataField(configuredLayout, "replayControls"), props.replayControls), [configuredLayout, props.replayControls]);
  const rendering = useMemo(() => ({ ...resolveProgressiveRenderingOptions(ownDataField(configuredLayout, "rendering")),
    ...resolveProgressiveRenderingOptions(props.rendering) }), [configuredLayout, props.rendering]);
  const controls = useMemo(() => view === "story" ? { ...replay, intervalMs: replay.intervalMs ?? 2000 } : replay, [view, replay]);
  const presentation = <ShellPresentation {...props} view={view} onViewChange={changeView} />;
  if (shared) {
    const owned = ["source", "runtimeSnapshot", "snapshots", "narrativeEntries", "traceGraph", "runtimeOverlay", "resultData", "autoPlay", "replayControls", "rendering"] as const;
    if (owned.some(key => props[key] !== undefined) || ownDataField(configuredLayout, "replayControls") !== undefined || ownDataField(configuredLayout, "rendering") !== undefined)
      throw new Error("A shared LensControllerProvider owns recording and replay options. Pass those options to the provider; Shell accepts presentation props.");
    return presentation;
  }
  return <LensControllerProvider source={props.source} runtimeSnapshot={props.runtimeSnapshot} snapshots={props.snapshots}
    narrativeEntries={props.narrativeEntries} traceGraph={props.traceGraph} runtimeOverlay={props.runtimeOverlay}
    resultData={props.resultData} autoPlay={props.autoPlay} replayControls={controls} rendering={rendering}>
    {presentation}
  </LensControllerProvider>;
}
