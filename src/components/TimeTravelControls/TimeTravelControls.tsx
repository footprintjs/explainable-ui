import { componentStyles, FootprintBadge, FootprintButton, FootprintIcon } from "../../theme";
import { useRef } from "react";
import { theme } from "../../theme";
import { useTimeTravelPlayback, type TimeTravelPlayback } from "../../replay/useTimeTravelPlayback";
import type { TimeTravelControlsProps } from "./types";
import { resolveReplayControlsOptions } from "../../model/replayControlsOptions";
import { ReplayPosition } from "../../replay/ReplayPosition";
import { recordedPathLabel } from "../../trace/recordedValuePreview";
export type { TimeTravelControlsProps, TracingRail, ReplayControlsOptions } from "./types";

export function TimeTravelControls(props: TimeTravelControlsProps) {
  const offered = useRef<unknown>(undefined);
  return <TimeTravelRail {...props} offered={offered} />;
}

/**
 * The rail. Internal, not a package export. `offered` is the last recording
 * autoPlay was offered, held by whoever outlives this rail: a shell can remount
 * its rail at any time, so the shell holds it.
 */
export type TimeTravelRailProps = TimeTravelControlsProps & {
  offered: { current: unknown };
  /** Internal shared-clock path: the headless owner already called the hook. */
  playback?: TimeTravelPlayback;
};

export function TimeTravelRail({ playback, ...props }: TimeTravelRailProps) {
  return playback ? <TimeTravelRailView {...props} playback={playback} /> : <OwnedTimeTravelRail {...props} />;
}

function OwnedTimeTravelRail(props: Omit<TimeTravelRailProps, 'playback'>) {
  const controls = resolveReplayControlsOptions(undefined, props.replayControls);
  const playback = useTimeTravelPlayback({ ...props, replayControls: controls });
  return <TimeTravelRailView {...props} replayControls={controls} playback={playback} />;
}

function TimeTravelRailView({
  snapshots, selectedIndex, autoPlayable = true, tracing = null, replayControls,
  size = "default", unstyled = false, className, style, playback,
}: Omit<TimeTravelRailProps, 'playback'> & { playback: TimeTravelPlayback }) {
  const {
    playing, isTracing, stopSet, forkPrompt, canPrev, canNext,
    goPrev, goNext, selectIndex, togglePlay, handleKeyDown,
  } = playback;
  const controls = resolveReplayControlsOptions(undefined, replayControls);
  const tracedLabel = tracing ? recordedPathLabel(tracing.tracedKey) : "";
  const viaLabel = tracing?.viaKey ? recordedPathLabel(tracing.viaKey) : "";
  const ui = componentStyles(size);
  // F3: tracing chrome uses its OWN token — teal by default, distinct from
  // the violet accent, green done-ticks, and the orange NOW ring — so a
  // glance tells tracing from normal time-travel. Never read in normal mode.
  const tracingColor = theme.tracing;
  const showPreviousNext = controls.previousNext !== false;
  const showPlay = autoPlayable && controls.playPause !== false;
  const showSlider = controls.slider !== false;
  const positionControl = <ReplayPosition snapshots={snapshots} selectedIndex={selectedIndex} selectIndex={selectIndex}
    stopSet={stopSet} tracing={tracing} presentation={controls.presentation ?? 'segmented'} scale={controls.scale ?? 'steps'} size={size} unstyled={unstyled} />;

  if (!isTracing && !showPreviousNext && !showPlay && !showSlider) return null;

  if (unstyled) {
    return (
      <div
        className={className}
        style={style}
        data-fp="time-travel-controls"
        data-tracing={isTracing || undefined}
        role="toolbar"
        aria-label={isTracing ? `Tracing ${tracedLabel}` : "Time travel controls"}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {isTracing && (
          <span data-fp="tt-tracing-header">
            <FootprintBadge unstyled={unstyled} densitySize={size} part="time-travel-tracing-badge" defaultStyle={undefined}>Tracing</FootprintBadge>{" "}{tracedLabel}
            {tracing!.viaKey && (
              <>
                {" "}▸ via {viaLabel}{" "}
                <FootprintButton unstyled={unstyled} densitySize={size} part="time-travel-show-all" type="button" data-fp="tt-show-all" onClick={tracing!.onShowAll} defaultStyle={undefined}>show all</FootprintButton>
              </>
            )}
            {" · "}stop {tracing!.stopOrdinal} of {tracing!.totalStops}
            <FootprintButton unstyled={unstyled} densitySize={size} part="time-travel-exit" type="button" data-fp="tt-exit-tracing" onClick={tracing!.onExit} aria-label={tracing!.exitAriaLabel ?? "Exit tracing"} defaultStyle={undefined}>{tracing!.exitLabel ?? "Done"}</FootprintButton>
          </span>
        )}
        {showPreviousNext && <FootprintButton
          unstyled={unstyled} densitySize={size} part="time-travel-previous"
          type="button"
          data-fp="tt-prev"
          disabled={!canPrev || playing}
          onClick={goPrev}
          aria-label={isTracing ? (forkPrompt ? "Choose cause" : "Earlier recorded step") : "Previous stage"} defaultStyle={undefined}
        >
          {isTracing ? (forkPrompt ? "Choose cause…" : "Earlier recorded step") : "Prev"}
        </FootprintButton>}
        {showPlay && !isTracing && (
          <FootprintButton unstyled={unstyled} densitySize={size} part="time-travel-play" type="button" data-fp="tt-play" onClick={togglePlay} disabled={snapshots.length < 2} aria-label={playing ? "Pause" : "Play"} defaultStyle={undefined}>
            {playing ? "Pause" : "Play"}
          </FootprintButton>
        )}
        {showPreviousNext && <FootprintButton
          unstyled={unstyled} densitySize={size} part="time-travel-next"
          type="button"
          data-fp="tt-next"
          disabled={!canNext || playing}
          onClick={goNext}
          aria-label={isTracing ? "Later recorded step" : "Next stage"} defaultStyle={undefined}
        >
          {isTracing ? "Later recorded step" : "Next"}
        </FootprintButton>}
        {showSlider && positionControl}
      </div>
    );
  }

  // In tracing mode the walk buttons (and Done) carry the tracing color on
  // border + label — part of F3's "unmistakably different" rail chrome.
  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    background: theme.bgTertiary,
    border: `${ui.borderWidth} solid ${isTracing ? tracingColor : theme.border}`,
    color: disabled ? theme.textMuted : isTracing ? tracingColor : theme.textPrimary,
    borderRadius: ui.radiusControl,
    padding: ui.controlPadding,
    minHeight: ui.controlHeight,
    fontFamily: theme.fontSans,
    fontSize: ui.body,
    lineHeight: ui.lineHeight,
    fontWeight: ui.weightMedium,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  });
  // Required rail geometry reaches native-compatible host adapters through
  // `style`; their own skin replaces only the fallback paint in defaultStyle.
  const fixedControlLayout: React.CSSProperties = { flexShrink: 0 };

  return (
    <div
      className={className}
      style={{
        padding: `${ui.controlGap} ${ui.spaceMd}`,
        background: theme.bgSecondary,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        fontSize: ui.body,
        lineHeight: ui.lineHeight,
        fontWeight: ui.weightNormal,
        borderBottom: `${isTracing ? ui.focusWidth : ui.borderWidth} solid ${isTracing ? tracingColor : theme.border}`,
        display: "flex",
        flexWrap: isTracing && tracing!.exitLabel !== undefined ? "wrap" : undefined,
        alignItems: "center",
        gap: ui.controlGap,
        flexShrink: 0,
        ...style,
      }}
      data-fp="time-travel-controls"
      data-tracing={isTracing || undefined}
      role="toolbar"
      aria-label={isTracing ? `Tracing ${tracedLabel}` : "Time travel controls"}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Tracing-mode header — loud chrome so the changed rail is never a surprise */}
      {isTracing && (
        <span
          data-fp="tt-tracing-header"
          style={{
            display: "flex",
            flexWrap: tracing!.exitLabel !== undefined ? "wrap" : undefined,
            alignItems: "center",
            gap: ui.controlGap,
            flexShrink: 0,
            maxWidth: tracing!.exitLabel !== undefined ? "100%" : undefined,
            overflowWrap: tracing!.exitLabel !== undefined ? "anywhere" : undefined,
            fontSize: ui.body,
          }}
        >
          <FootprintBadge
            unstyled={unstyled} densitySize={size} part="time-travel-tracing-badge"
            defaultStyle={{
              fontSize: ui.small,
              fontWeight: ui.weightStrong,
              lineHeight: ui.lineHeight,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: theme.onTracing,
              background: tracingColor,
              borderRadius: ui.radiusBadge,
              padding: `${ui.spaceXs} ${ui.spaceSm}`,
            }}
          >
            Tracing
          </FootprintBadge>
          <span style={{ fontFamily: theme.fontMono, fontWeight: ui.weightMedium, color: tracingColor }}>
            {tracedLabel}
          </span>
          {tracing!.viaKey && (
            <span style={{ color: theme.textMuted }}>
              ▸ via{" "}
              <span style={{ fontFamily: theme.fontMono, color: theme.textSecondary }}>
                {viaLabel}
              </span>{" "}
              <FootprintButton
                unstyled={unstyled} densitySize={size} part="time-travel-show-all"
                type="button"
                data-fp="tt-show-all"
                onClick={tracing!.onShowAll}
                defaultStyle={{
                  border: "none",
                  background: "transparent",
                  color: tracingColor,
                  cursor: "pointer",
                  fontSize: ui.body,
                  lineHeight: ui.lineHeight,
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                show all
              </FootprintButton>
            </span>
          )}
          <span style={{ color: theme.textMuted }}>
            · stop {tracing!.stopOrdinal} of {tracing!.totalStops}
          </span>
        </span>
      )}

      {showPreviousNext && <FootprintButton
        unstyled={unstyled} densitySize={size} part="time-travel-previous"
        type="button"
        style={fixedControlLayout}
        defaultStyle={btnStyle(!canPrev || playing)}
        disabled={!canPrev || playing}
        onClick={goPrev}
        aria-label={isTracing ? (forkPrompt ? "Choose cause" : "Earlier recorded step") : "Previous stage"}
        title={
          isTracing
            ? forkPrompt
              ? "This stop is a fork — choose which cause to follow"
              : "Earlier recorded step"
            : "Previous stage"
        }
        data-fp="tt-prev"
      >
        <FootprintIcon unstyled={unstyled} densitySize={size} part="time-travel-previous-icon" name={forkPrompt ? "choose-cause" : "previous"} aria-hidden="true">{isTracing && forkPrompt ? "⑂" : "◀"}</FootprintIcon>{isTracing ? (forkPrompt ? " choose cause…" : " earlier recorded step") : ""}
      </FootprintButton>}

      {showPlay && !isTracing && (
        <FootprintButton
          unstyled={unstyled} densitySize={size} part="time-travel-play"
          type="button"
          onClick={togglePlay}
          disabled={snapshots.length < 2}
          style={{ ...fixedControlLayout, width: ui.controlHeight, height: ui.controlHeight,
            display: "flex", alignItems: "center", justifyContent: "center" }}
          defaultStyle={{
            background: playing ? theme.primary : theme.bgTertiary,
            border: `${ui.borderWidth} solid ${theme.border}`,
            color: playing ? theme.onPrimary : theme.textPrimary,
            borderRadius: ui.radiusControl,
            cursor: "pointer",
            fontSize: ui.iconSize,
            lineHeight: ui.lineHeight,
          }}
          title={playing ? "Pause" : "Play"}
          aria-label={playing ? "Pause" : "Play"}
        >
          <FootprintIcon unstyled={unstyled} densitySize={size} part="time-travel-play-icon" name={playing ? "pause" : "play"} aria-hidden="true">{playing ? "⏸" : "▶"}</FootprintIcon>
        </FootprintButton>
      )}

      {showPreviousNext && <FootprintButton
        unstyled={unstyled} densitySize={size} part="time-travel-next"
        type="button"
        style={fixedControlLayout}
        defaultStyle={btnStyle(!canNext || playing)}
        disabled={!canNext || playing}
        onClick={goNext}
        aria-label={isTracing ? "Later recorded step" : "Next stage"}
        title={isTracing ? "Later recorded step" : "Next stage"}
        data-fp="tt-next"
      >
        {isTracing ? "later recorded step " : ""}<FootprintIcon unstyled={unstyled} densitySize={size} part="time-travel-next-icon" name="next" aria-hidden="true">▶</FootprintIcon>
      </FootprintButton>}

      {showSlider && positionControl}

      {isTracing && (
        <FootprintButton
          unstyled={unstyled} densitySize={size} part="time-travel-exit"
          type="button"
          data-fp="tt-exit-tracing"
          onClick={tracing!.onExit}
          aria-label={tracing!.exitAriaLabel ?? "Exit tracing"}
          style={{ ...fixedControlLayout, ...(tracing!.exitLabel !== undefined ? {
            flexShrink: 1, maxWidth: "100%", overflowWrap: "anywhere",
          } : {}) }}
          defaultStyle={{ ...btnStyle(false), background: "transparent", ...(tracing!.exitLabel !== undefined ? {
            textAlign: "left",
          } : {}) }}
        >
          {tracing!.exitLabel ?? "Done ✕"}
        </FootprintButton>
      )}
    </div>
  );
}
