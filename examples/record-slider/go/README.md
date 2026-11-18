# Go invoice recording

Run `go run main.go` in this directory to write the invoice recording to stdout.
The example uses Go's standard library. Each calculation records the keys it
reads and the value it writes. The output carries the original initial state
and two commits. Foottrace adds its run-start and run-end stops when reading
the JSON. The example collects no timing measurements.

`invoice.json` is the expected wire output used by the hosted slider. During
CI, `verify.mjs` runs the Go program and compares its stdout byte for byte.
It then loads the built JavaScript recording reader, folds the invoice to 35,
and follows its recorded dependency to the subtotal writer at 30.
