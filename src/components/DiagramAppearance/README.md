# Diagram appearance

A host provides a complete current map keyed by exact chart node or edge ID. The projection copies supported fields into `data.diagramAppearance`. A new snapshot clears omitted entries. Drawing and simulation remain host-owned.

Activity, confirmed presence, progress and health are independent. Only an explicit removed presence fades a drawing. A valid progress measurement requires a finite positive total and a completed amount between zero and that total, inclusive. An activity without a measurement still displays its label. Overlays reuse the node's measured placement and the edge's routed SVG path, and leave pointer input with the underlying drawing.
