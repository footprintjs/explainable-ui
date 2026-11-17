# Replay controls

`src/model/replayControls.ts` owns the neutral transport policy/tracing types, re-exported through this folder's `types.ts`. `src/model/replayControlsOptions.ts` admits known own-data JSON fields and merges explicitly defined props field by field; unknown fields remain ignored. `intervalMs` is reading pace and retains the playback hook's finite 200–10000ms clamp.

`ReplayPosition` owns native range interaction and the optional segmented decoration. `presentation: 'range'` renders no per-stage tick elements in either styled or unstyled mode. It uses the same discrete stage cursor, trace-stop snapping and keyboard behavior as the default `'segmented'` presentation. Constant rail DOM does not promise constant recording preparation or graph-layout work.

`scale` defaults to `steps`. `duration` and `log-duration` use the neutral `src/replay/replayAxis.ts` geometry, with linear or `log1p(durationMs)` weights and honest equal-spacing fallback when positive timing is absent. Zeros/defaults, unavailable timing and minimum-width adjustments remain disclosed. Weighted native inputs map normalized coordinates back to semantic stage indexes; arrow/Home/End keys retain exact stage/trace-stop navigation. This is a sequence presentation, not an elapsed wall-clock axis.

Standalone controls own one `src/replay/useTimeTravelPlayback.ts` hook. The internal `TimeTravelRail` can receive a shared `playback` controller from the Shell/headless owner; that path renders the view without creating another clock. `LensReplayControls` is the public bound transport. Theme Input adapters must continue forwarding native props, events, ref, ARIA and geometry. Cached axis preparation is O(n) per immutable snapshots array/scale, not per cursor movement; pointer lookup is O(log n).
