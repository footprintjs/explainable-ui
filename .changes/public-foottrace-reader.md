### Added

- Expose the Foottrace 2 recording reader and controlled time slider through `footprint-explainable-ui/record`. Graph consumers keep their existing root and `/flowchart` APIs.

### Breaking

- Migration: install `react`, `react-dom`, `@xyflow/react@^12` and `dagre@^0.8.5` with the root or `/flowchart` entry. The graph peers are now optional at package-install time so record-only applications can omit them. For `/record`, install React and `foottrace@^2.0.0`; Foottrace 2 requires Node 22 or later when running in Node. This installation-contract change requires a major release.
