# Foottrace record slider

This Pages example uses the proposed `footprint-explainable-ui/record` entry. A pricing workflow supplies measured timings and an operation diagram. An HCI storefront supplies its action history and read evidence. A VizFootprint analysis supplies its kernel recording and a plot of cluster assignments. A small Go producer supplies JSON commit bundles for an invoice. The parallel order example adds two branch writers to explore with Backtrack. Every recording uses the same slider, state inspector and selected Foottrace stop.

From the repository, run `npm exec -- vite --config examples/record-slider/vite.config.ts` and open `http://127.0.0.1:5320/`. The Pages workflow builds the example at `/explainable-ui/record-slider/` after merge. The separate strict package checks exercise the built exports.

## Try the recordings

- In **Pricing workflow**, choose **PickBase** and switch between equal, linear and logarithmic spacing. The selected visit stays the same. The 32 ms rate load and 16 ms risk assessment get different widths on the duration scales.
- Choose **Quote** and click **Why?** beside `quote`. Foottrace explains the 11.88 write using the preceding `baseRate` and `riskFactor` writes. Scrubbing to an earlier stop changes the available state and explanation.
- Use **Slider style** to switch between a segmented rail and a normal range thumb. The default opens the timed pricing recording with logarithmic segments.
- In **Parallel order total**, select **Combine** and choose **Why?** beside `total`. Follow the recorded inputs to Items (30) and Delivery (5), and return to the 35 question.
- In **Go invoice**, select the invoice calculation and inspect `invoiceTotal` to follow its recorded subtotal. This standard-library producer writes the public saved format.
- In **Viz amount clusters**, select **assign quantile bins** and inspect `cluster_id`. The plot shows the recorded assignments at this stop and updates when you return to the load operation.
- In **HCI storefront**, select **checkout#3** and inspect `orderId`. The read evidence comes from the recorded guard keys. The final pending action stays visible in the journey and has no position on the committed-state slider. This capture supplies no timings, so the duration scales fall back to equal spacing.

## Connect another producer

Create one reader for the selected saved source. Pass its exact stops to `RecordTimeSlider` and its reader to `RecordLens`. The host owns one numeric step and resets it when switching sources. A diagram selects the step of the specific visit, including repeated visits to the same action. Commit indices can differ from stop numbers because a stop may cover multiple rows.

A Go host can use the same pattern when it supplies a Foottrace-compatible saved source, such as JSON with an initial state and a commit log. Pass measured milliseconds through `durationForStop`, using the host's visit identity to join the timing. Omit the callback for untimed sources. Render any host diagram using the shared step. The Viz example reads the captured analysis kernel. An exploration tree with multiple branches requires its host to choose the appropriate source and preserve branch identity.

```tsx
const reader = useMemo(
  () => createRecordLensReader({ sourceId, source, reads }),
  [sourceId, source, reads],
);

<RecordTimeSlider stops={reader.stops} step={step} onStepChange={setStep}
  scale="log-duration" durationForStop={stop => timingsMs.get(stop.runtimeStageId)} />
<RecordLens reader={reader} step={step} onStepChange={setStep}
  selectedKey={key} onKeyChange={setKey} />
```

## Capture provenance

- `pricing.json` selects the recorded run ID, initial state, execution tree and commit log from `pricing` in [the seven-workflow capture](../local-playground/recordings.json). Operation IDs and labels come from the captured graph. Timings are the Metrics recorder's per-visit `duration` values in milliseconds. The original data was captured with footprintjs 13.0.0 and Foottrace 2.0.0, SHA-256 `d4fbd0f87e5f0be8441760b6902d84664af9e1cc2a9201a41d7e4f12e645f3c8`. This small selection keeps the other six workflows out of the example bundle.
- The [HCI storefront fixture](../../pilots/record-lens/fixtures/hci.json) is imported directly. It is the original HCI 3.0.0 capture using footprintjs 9.48.3 and Foottrace 1.0.0. The example reads the historical saved format through the Foottrace 2 public reader. [Fixture provenance](../../pilots/record-lens/fixtures/README.md)
- `viz.json` was captured through the built `vizfootprint/analysis` public entry from VizFootprint 0.1.0 with footprintjs 9.16.1, checkout `94bbf8e6e9f8f94c425d3c7372c32645987f12d7`. This clustering run loads four amounts and assigns two bins. The kernel saved its execution tree and commit log without an initial state or per-stop durations. The reader displays its log-only reconstruction. Reproduce with `node examples/record-slider/capture-viz.mjs /path/to/built/vizfootprint`. The capture retains the producer's run ID and timestamps, so a new run will have different bytes. [VizFootprint analysis](https://github.com/footprintjs/vizfootprint/tree/94bbf8e6e9f8f94c425d3c7372c32645987f12d7/src/analysis)
- [Go invoice producer](go/main.go) writes the [saved JSON](go/invoice.json) using the Go standard library. The host label `go:invoice` identifies this example source. No Go SDK is required by the browser.
- The [parallel order](../headless-controller/recording.json) reuses the native footprintjs 13.0.0 and Foottrace 2.0.0 fixture introduced with the shared controller. Its Items and Delivery inputs retain their recorded nested paths and exact writer stops.
