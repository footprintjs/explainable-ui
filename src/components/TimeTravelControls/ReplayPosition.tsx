import { useId, useRef, useState } from 'react';
import type { StageSnapshot, Size } from '../../types';
import { FootprintButton, FootprintInput, componentStyles, theme } from '../../theme';
import type { TracingRail } from './types';
import type { ReplayControlsOptions } from '../../model/replayControls';
import { projectReplayAxis } from '../../replay/replayAxis';

interface ReplayPositionProps {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  selectIndex: (index: number) => void;
  stopSet: ReadonlySet<number> | null;
  tracing: TracingRail | null;
  presentation: 'range' | 'segmented';
  scale: NonNullable<ReplayControlsOptions['scale']>;
  size: Size;
  unstyled: boolean;
}

/** One interaction implementation for the visible native range and segmented rail. */
export function ReplayPosition({ snapshots, selectedIndex, selectIndex, stopSet, tracing, presentation, scale, size, unstyled }: ReplayPositionProps) {
  const [focused, setFocused] = useState(false), rangeKey = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const noteId = useId(), axis = projectReplayAxis(snapshots, scale), weighted = scale !== 'steps';
  const ui = componentStyles(size), isTracing = tracing !== null;
  const position = Number.isSafeInteger(selectedIndex)
    ? Math.max(0, Math.min(selectedIndex, Math.max(0, snapshots.length - 1))) : 0;
  const allowedStops = tracing ? [...new Set(tracing.stopIndices.filter(index =>
    Number.isSafeInteger(index) && index >= 0 && index < snapshots.length))].sort((left, right) => left - right) : [];
  const durationLabel = (index: number) => (axis.durations[index] ?? 0) > 0
    ? `${axis.durations[index]} ms` : 'zero or unavailable timing';
  const timingNote = !weighted ? '' : axis.availability === 'fallback'
    ? 'No positive timing recorded — equal step spacing.'
    : `${scale === 'log-duration' ? 'Logarithmic recorded duration' : 'Recorded duration'} — sequence, not wall-clock time.${axis.availability === 'partial' || axis.zeroDurationCount ? ' Zero or unavailable timings use minimum widths.' : axis.clampedWeightCount ? ' Minimum widths keep very short stages selectable.' : ''}`;
  const note = weighted && <small id={noteId} data-fp="tt-scale-note" style={unstyled ? undefined : { color: theme.textSecondary, fontSize: ui.small }}>{timingNote}</small>;
  const pointerPosition = (bar: HTMLDivElement, clientX: number) => {
    const bounds = bar.getBoundingClientRect(), span = axis.lastCenter - axis.firstCenter;
    if (bounds.width > 0) selectIndex(axis.indexAt(span > 0
      ? ((clientX - bounds.left) / bounds.width - axis.firstCenter) / span : 0));
  };
  const range = (overlay: boolean) => <FootprintInput
    ref={inputRef}
    unstyled={unstyled} densitySize={size} part="time-travel-slider" data-fp="tt-slider"
    type="range" min={0} max={weighted ? 1 : Math.max(0, snapshots.length - 1)} step={weighted ? 'any' : 1} value={weighted ? axis.positionAt(position) ?? 0 : position}
    disabled={snapshots.length < 2 || (isTracing && allowedStops.length === 0)}
    aria-label={isTracing ? 'Trace position' : 'Replay position'}
    aria-describedby={weighted ? noteId : undefined}
    aria-valuetext={snapshots.length ? `Step ${position + 1} of ${snapshots.length}: ${snapshots[position]?.stageLabel || snapshots[position]?.stageName || 'Recorded stage'}${weighted ? `, ${durationLabel(position)}` : ''}` : 'No recorded stages'}
    onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); rangeKey.current = null; }}
    onKeyDown={event => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', ' '].includes(event.key)) {
        event.stopPropagation(); rangeKey.current = event.key;
        if (weighted && event.key !== ' ') {
          event.preventDefault();
          if (event.key === 'Home') selectIndex(allowedStops[0] ?? 0);
          else if (event.key === 'End') selectIndex(allowedStops.at(-1) ?? snapshots.length - 1);
          else if (['ArrowLeft', 'ArrowDown'].includes(event.key)) selectIndex(isTracing
            ? [...allowedStops].reverse().find(index => index < position) ?? position : Math.max(0, position - 1));
          else if (['ArrowRight', 'ArrowUp'].includes(event.key)) selectIndex(isTracing
            ? allowedStops.find(index => index > position) ?? position : Math.min(snapshots.length - 1, position + 1));
          else selectIndex(Math.max(0, Math.min(snapshots.length - 1, position + (event.key === 'PageUp' ? 10 : -10))));
        }
      }
    }}
    onKeyUp={() => { rangeKey.current = null; }}
    onChange={event => {
      const requested = event.currentTarget.valueAsNumber;
      if (weighted) selectIndex(axis.indexAt(requested));
      else if (isTracing && ['ArrowRight', 'ArrowUp'].includes(rangeKey.current ?? '')) {
        selectIndex(allowedStops.find(index => index > position) ?? position);
      } else if (isTracing && ['ArrowLeft', 'ArrowDown'].includes(rangeKey.current ?? '')) {
        selectIndex([...allowedStops].reverse().find(index => index < position) ?? position);
      } else selectIndex(requested);
    }}
    style={unstyled ? undefined : overlay ? { position: 'absolute', top: 0,
      left: weighted ? `${axis.firstCenter * 100}%` : 0,
      width: weighted ? `${(axis.lastCenter - axis.firstCenter) * 100}%` : '100%', height: '100%', opacity: 0,
      margin: 0, padding: 0, boxSizing: 'border-box', touchAction: weighted ? 'none' : undefined }
      : { display: 'block', width: '100%', height: '100%', minWidth: 0, margin: 0, boxSizing: 'border-box' }}
    defaultStyle={unstyled ? undefined : { cursor: 'pointer', ...(presentation === 'range' && {
      accentColor: isTracing ? theme.tracing : theme.primary, background: 'transparent', border: 'none', padding: 0,
    }) }}
  />;

  if (unstyled) return <>{range(false)}{note}{presentation === 'segmented' && <div data-fp="tt-ticks" hidden aria-hidden="true">
    {snapshots.map((snap, index) => {
      const isStop = !stopSet || stopSet.has(index);
      return <FootprintButton key={index} unstyled densitySize={size} part="time-travel-tick" type="button"
        data-fp="tt-tick" data-active={index === selectedIndex} data-done={index < selectedIndex}
        data-stop={isTracing ? isStop : undefined} tabIndex={-1} aria-hidden="true" disabled={isTracing && !isStop}
        onClick={() => selectIndex(index)} title={snap.stageLabel} defaultStyle={undefined} />;
    })}
  </div>}</>;

  const view = <div data-fp="tt-position-axis" data-presentation={presentation} data-scale={scale}
    onPointerDown={event => {
      if (!weighted || presentation !== 'segmented' || event.button !== 0) return;
      event.preventDefault(); inputRef.current?.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      pointerPosition(event.currentTarget, event.clientX);
    }}
    onPointerMove={event => {
      if (weighted && presentation === 'segmented' && event.currentTarget.hasPointerCapture(event.pointerId)) pointerPosition(event.currentTarget, event.clientX);
    }}
    onPointerUp={event => {
      if (weighted && presentation === 'segmented' && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }}
    style={{
    position: 'relative', flex: 1, minWidth: 0, height: ui.controlHeight, display: 'flex', alignItems: 'center',
    gap: weighted ? 0 : `calc(${ui.spaceXs} / 2)`, padding: weighted ? 0 : `0 ${ui.spaceXs}`,
    touchAction: weighted && presentation === 'segmented' ? 'none' : undefined,
    outline: focused ? `${ui.focusWidth} solid ${isTracing ? theme.tracing : theme.accent}` : undefined,
    outlineOffset: ui.spaceXs,
  }}>
    {presentation === 'segmented' && snapshots.map((snap, index) => {
      const isActive = index === selectedIndex, isDone = index < selectedIndex;
      const isStop = !stopSet || stopSet.has(index), unlandable = isTracing && !isStop;
      return <FootprintButton key={index} unstyled={unstyled} densitySize={size} part="time-travel-tick" type="button"
        onClick={() => selectIndex(index)} disabled={unlandable}
        title={`${snap.stageLabel}${weighted ? ` · ${durationLabel(index)}` : ''}${unlandable ? ' (not part of this trace)' : ''}`}
        data-fp="tt-tick" data-stop={isTracing ? isStop : undefined} data-active={isActive || undefined}
        tabIndex={-1} aria-hidden="true" style={{ flex: weighted ? `${axis.weights[index]} 1 0%` : 1, minWidth: weighted ? 0 : undefined,
          padding: weighted ? 0 : undefined, boxSizing: weighted ? 'border-box' : undefined,
          pointerEvents: weighted ? 'none' : undefined,
          height: isActive ? ui.iconSize : unlandable ? ui.spaceXs : ui.spaceSm }}
        defaultStyle={{ borderRadius: `calc(${ui.radiusControl} / 2)`, border: 'none', cursor: unlandable ? 'default' : 'pointer',
          background: isTracing ? isActive ? theme.tracing : isStop ? `color-mix(in srgb, ${theme.tracing} 55%, transparent)` : theme.bgTertiary
            : isActive ? theme.primary : isDone ? theme.success : theme.bgTertiary,
          opacity: unlandable ? 0.3 : isTracing || isDone || isActive ? 1 : 0.4,
          transition: `all ${ui.fastDuration} ${ui.easing}` }} />;
    })}
    {range(presentation === 'segmented')}
  </div>;
  return weighted ? <div data-fp="tt-weighted-position" style={{ flex: 1, minWidth: 0 }}>{view}{note}</div> : view;
}
