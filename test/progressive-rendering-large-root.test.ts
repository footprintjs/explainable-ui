import { describe, expect, it } from 'vitest';
import { createRecordingSource } from '../src/progressiveRendering/source/controller';

describe('recorded root admission', () => {
  const open = (sampleCount: number) => createRecordingSource({
    snapshot: {
      runId: 'large-native-root',
      sharedState: { samples: Array.from({ length: sampleCount }, (_, index) => index) },
      commitLog: [],
      executionTree: null,
    },
    graph: { nodes: [], edges: [] },
  });

  it('admits a root larger than a standalone trace work budget without truncating its values', () => {
    const source = open(40_000);
    try {
      const samples = source.getSnapshot().snapshot.sharedState.samples;
      expect(samples).toEqual(Array.from({ length: 40_000 }, (_, index) => index));
    } finally { source.dispose(); }
  });

  it('still refuses a root above the bounded root admission budget', () => {
    expect(() => open(70_000)).toThrow(/could not be prepared/);
  });
});
