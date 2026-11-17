# Grouped flow diagram

The view renders admitted structure, states and recorded relationships. It does
not execute a flow, choose a cause or turn a camera target into evidence. Layout,
relationship admission, routing and visible collapsed proxies keep their existing
owners; `ChartAutoRefit` is the single measured viewport owner.

`cameraInitialization.ts` owns only initial framing. A first positive container
measurement consumes initialization at either width. A standalone initially
narrow view may frame a visible selected item; an admitted host request or
recorded-focus context has priority. A later breakpoint never generates a new
selection-only request. Explicit Fit, Reveal and host requests still take camera
ownership. Observer callbacks are retired on cleanup and use the current model,
selection and admitted request binding.

The existing fitter preserves a manually moved viewport across container-only
resizes and measurement updates. An auto-owned viewport still follows its current
target and route/label bounds when the container changes. No second fitter,
responsive polling or app resize workaround exists here. The investigation composition supplies returned reference targets on every
width; explicit one-card commands remain separate camera intents. Routed
self-links contribute their own paint extents without adding other endpoints.

Regression behavior is exercised by
`GroupedFlowDiagramResponsiveCamera.test.tsx` beside this owner, the real
`TracedFlowTraceCamera`/`useChartAutoRefit` ownership tests and existing grouped
investigation camera tests. Browser pixel-containment proof is a separate gate;
DOM target presence alone does not prove the target is visible.
