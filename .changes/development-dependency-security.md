### Fixed

- Raise compatible development-tool minimums for security fixes while retaining the Node 20/22 test lanes. The build uses a narrowly scoped, verified esbuild override rather than silently moving to a Node-22-only toolchain.
- Retain each CI lane's actual dependency graph, full and production audit reports, and original audit exit codes. Unresolved upstream development-tool findings remain explicitly reported; collecting evidence does not mark an audit clean.
