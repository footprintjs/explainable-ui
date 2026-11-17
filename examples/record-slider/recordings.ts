import { keysReadFromExecutionTree, keysReadFromMap } from 'foottrace';
import { createRecordLensReader } from 'footprint-explainable-ui/record';
import type { RecordLensModel } from 'footprint-explainable-ui/record';
import combined from '../headless-controller/recording.json';
import hci from '../../pilots/record-lens/fixtures/hci.json';
import pricing from './pricing.json';
import invoice from './go/invoice.json';
import viz from './viz.json';

type Stop = RecordLensModel['stops'][number];
export type RecordingId = 'pricing' | 'storefront' | 'viz' | 'go' | 'combined';

export interface SourceView {
  reader: ReturnType<typeof createRecordLensReader>;
  durationForStop?: (stop: Stop) => number | undefined;
}

const timing = new Map(Object.entries(pricing.timingsMs));
export const recordings: Record<RecordingId, SourceView> = {
  pricing: {
    reader: createRecordLensReader({
      source: pricing.source,
      sourceId: pricing.sourceId,
      reads: keysReadFromExecutionTree(pricing.source.executionTree),
    }),
    durationForStop: stop => timing.get(stop.runtimeStageId),
  },
  combined: {
    reader: createRecordLensReader({
      source: combined.snapshot,
      sourceId: combined.snapshot.runId,
      reads: keysReadFromExecutionTree(combined.snapshot.executionTree),
    }),
  },
  go: {
    reader: createRecordLensReader({ source: invoice, sourceId: 'go:invoice' }),
  },
  viz: {
    reader: createRecordLensReader({
      source: viz.source,
      sourceId: viz.sourceId,
      reads: keysReadFromExecutionTree(viz.source.executionTree),
    }),
  },
  storefront: {
    reader: createRecordLensReader({
      source: hci.source,
      sourceId: hci.sourceId,
      reads: keysReadFromMap(hci.reads.byStep),
    }),
  },
};

export const operations = pricing.operations;
export const transitions = hci.observation.transitions;
