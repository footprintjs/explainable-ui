# Diagram appearance

A host provides a complete current map keyed by exact chart node or edge ID. The projection copies supported fields into `data.diagramAppearance`. A new snapshot clears omitted entries. Drawing and simulation remain host-owned.

Activity, confirmed presence, progress and health are independent. Only an explicit removed presence fades a drawing. A valid progress measurement requires a finite positive total and a completed amount between zero and that total, inclusive. An activity without a measurement still displays its label. Overlays reuse the node's measured placement and the edge's routed SVG path, and leave pointer input with the underlying drawing.

The built-in renderers and the public appearance helpers keep one paint container around the drawing. The HTML container uses `display: contents` during ordinary rendering. The SVG container is a `g`. A confirmed removal applies the themed opacity to the whole container, composing with child shadows, masks and opacity. The activity annotation remains at full contrast, and rewinding keeps the same drawing, ports and DOM state. For custom CSS, select the drawing's class or its `data-fp` attribute across this neutral ancestor.
