# Chart layout and fitting

`chartFitGeometry.ts` owns the pure viewport policy: every visible node must
have positive finite measured dimensions and finite absolute coordinates. Empty,
all-hidden, partially measured, invalid and overflowed bounds do not produce a
viewport. Parent/group offsets come from xyflow's absolute coordinates; estimated
layout dimensions and user-node coordinates are not measurement evidence.

`ChartAutoRefit` is the single automatic-fit owner under the ReactFlow provider
in both `TraceFlow` and `TracedFlow`. It observes the actual flow pane and wrapper,
subscribes to a derived measurement key (the provider mutates its Map in place),
and coalesces requests into one cancellable animation frame. A failed readiness
check waits for another store/resize/layout signal; it does not poll.

The frame rechecks both DOM boxes, provider size, and the entire current visible
graph. It applies a checked viewport immediately with `duration: 0`. It does not
queue `fitView`: that queue can run against a different, unmeasured graph. It also
does not animate automatic fitting: d3 reads its extent when an animation starts,
so hiding a tab between request and start can otherwise produce a zero-extent
tween. Manual viewport controls are unchanged.

Fit intent and measurement readiness are separate. xyflow may discard then
remeasure node dimensions when a scrub replaces overlay node objects; recovering
the same geometry is not a new fit request. A manual camera transform transfers
ownership to the user, so subsequent badge/font measurements and derived layout
settling preserve that camera. A new authored scope/topology/layout or a real
container size change requests a fit again. Same-size synthetic resize events
do not. The fitter excludes its own synchronous viewport write from that manual
gesture detection.

The authored layout key contains geometry and topology, not overlay colors,
focus, selection or execution progress. `MeasuredNodeSizes`
continues to own measurement-to-layout feedback; it does not own the viewport.
