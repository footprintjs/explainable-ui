# Replay behavior and geometry

This layer owns the React playback hook and the pure replay axis. It imports data contracts, not rendered controls or the workbench. Both the renderless controller and standalone transport consume it.

`useTimeTravelPlayback` owns one cancellable clock over the host's controlled recorded-step cursor. Reading pace and autoplay remain separate from axis geometry.

`projectReplayAxis` caches an immutable projection by snapshots-array identity and scale. `steps` retains equal spacing; `duration` uses recorded milliseconds; `log-duration` uses `log1p(milliseconds)` before normalization. Projection costs O(n) when recording data or scale changes. Cursor movement reuses it; pointer lookup binary-searches painted segment boundaries. Inputs must be immutable. An appended/replaced recording supplies a new array.

The same weights paint segments; their centers locate the thumb. Hit testing converts the input's normalized first-center-to-last-center coordinates back to painted segment boundaries. Minimum positive widths retain short/untimed stages as destinations, without claiming those widths are measured durations. Zero durations are ambiguous because existing adapters also use zero for missing timing. The returned coverage counts and admitted `durations` drive honest labels; no accessor is called. An all-zero or unavailable cohort falls back to equal spacing.

The axis represents recorded stage sequence weighted by duration, not elapsed wall-clock runtime. Parallel stages can overlap. The library never infers execution time from bytes, arrival time or playback dwell. Live publication/coalescing remains with RecordingSource; this layer neither fetches nor executes workflows.

The workflow transport and the Foottrace recording slider both render `ReplayPosition`. Its input is a list of labels and optional measured durations. Neither the control nor the axis owns the selected stop.

Segmented rails paint up to 128 marks. For longer recordings, each mark covers consecutive stops and sums their original weights. The range input and keyboard navigation still address each original stop; Backtrack still navigates only to its recorded stops. In the recording inspector, more than 128 stops switch the step dropdown to a one-based number field. Enter or **Go to step** selects the exact stop.
