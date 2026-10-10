import { keysReadFromMap } from "foottrace";
import type { KeysReadSource, TimeTravelSource } from "foottrace";
import flow from "./flow.json";
import hci from "./hci.json";

/** Caller-selected saved records, not live producer instances. */
export interface ProducerFixture {
  readonly sourceId: string;
  readonly source: TimeTravelSource;
  readonly reads: KeysReadSource;
}

export const flowFixture: ProducerFixture = {
  sourceId: flow.root.sourceId,
  source: flow.root.source,
  reads: {
    ...keysReadFromMap(flow.root.reads.byStep),
    coverage: flow.root.reads.coverage,
  },
};

export const flowChildFixture: ProducerFixture = {
  sourceId: flow.child.sourceId,
  source: flow.child.source,
  reads: {
    ...keysReadFromMap(flow.child.reads.byStep),
    coverage: flow.child.reads.coverage,
  },
};

export const hciFixture: ProducerFixture = {
  sourceId: hci.sourceId,
  source: hci.source,
  reads: keysReadFromMap(hci.reads.byStep),
};

export const hciObservation = hci.observation;
