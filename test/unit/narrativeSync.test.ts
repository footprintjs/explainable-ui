/**
 * Unit tests for narrative sync logic via runtimeStageId.
 *
 * Tests the algorithm that maps snapshot index → entry reveal count.
 * This is the core sync between the execution tree timeline and the
 * narrative entries — uses exact runtimeStageId matching.
 */
import { describe, expect, it } from 'vitest';
import type { StageSnapshot, NarrativeEntry } from '../../src/types';
import { buildEntryRangeIndex, computeRevealedEntryCount } from '../../src/utils/narrativeSync';

/** Helper: compute with both paths (scan + indexed) and assert they match. */
function computeBoth(
  entries: NarrativeEntry[],
  snapshots: Pick<StageSnapshot, 'runtimeStageId'>[],
  selectedIndex: number,
): number {
  const withoutIndex = computeRevealedEntryCount(entries, snapshots, selectedIndex);
  const index = buildEntryRangeIndex(entries);
  const withIndex = computeRevealedEntryCount(entries, snapshots, selectedIndex, index);
  expect(withIndex).toBe(withoutIndex); // both paths must agree
  return withIndex;
}

// Helpers
function snap(runtimeStageId: string): Pick<StageSnapshot, 'runtimeStageId'> {
  return { runtimeStageId };
}

function entry(type: NarrativeEntry['type'], runtimeStageId?: string): NarrativeEntry {
  return { type, text: `${type} ${runtimeStageId ?? ''}`, depth: 0, runtimeStageId };
}

describe('Narrative runtimeStageId sync', () => {
  describe('linear flow', () => {
    const snapshots = [snap('a#0'), snap('b#1'), snap('c#2')];
    const entries = [
      entry('stage', 'a#0'), entry('step', 'a#0'),
      entry('stage', 'b#1'), entry('step', 'b#1'),
      entry('stage', 'c#2'), entry('step', 'c#2'),
    ];

    it('selectedIndex=0 shows first stage + steps', () => {
      expect(computeBoth(entries, snapshots, 0)).toBe(2);
    });

    it('selectedIndex=1 shows first two stages', () => {
      expect(computeBoth(entries, snapshots, 1)).toBe(4);
    });

    it('selectedIndex=2 shows all entries', () => {
      expect(computeBoth(entries, snapshots, 2)).toBe(6);
    });
  });

  describe('loop flow (unique runtimeStageId per iteration)', () => {
    // Each iteration of CallLLM/Check gets a unique runtimeStageId
    const snapshots = [
      snap('init#0'),
      snap('call-llm#1'), snap('check#2'),
      snap('call-llm#3'), snap('check#4'),
      snap('call-llm#5'), snap('check#6'),
    ];
    const entries = [
      entry('stage', 'init#0'), entry('step', 'init#0'),
      entry('stage', 'call-llm#1'), entry('step', 'call-llm#1'),
      entry('stage', 'check#2'), entry('condition', 'check#2'), entry('loop', 'check#2'),
      entry('stage', 'call-llm#3'), entry('step', 'call-llm#3'),
      entry('stage', 'check#4'), entry('condition', 'check#4'), entry('loop', 'check#4'),
      entry('stage', 'call-llm#5'), entry('step', 'call-llm#5'),
      entry('stage', 'check#6'), entry('condition', 'check#6'), entry('break', 'check#6'),
    ];

    it('selectedIndex=0 shows only init', () => {
      expect(computeBoth(entries, snapshots, 0)).toBe(2);
    });

    it('selectedIndex=1 shows init + first call', () => {
      expect(computeBoth(entries, snapshots, 1)).toBe(4);
    });

    it('selectedIndex=2 shows through first check (with loop marker)', () => {
      expect(computeBoth(entries, snapshots, 2)).toBe(7);
    });

    it('selectedIndex=3 shows through second call', () => {
      expect(computeBoth(entries, snapshots, 3)).toBe(9);
    });

    it('selectedIndex=6 shows all entries', () => {
      expect(computeBoth(entries, snapshots, 6)).toBe(17);
    });
  });

  describe('subflow entries with runtimeStageId', () => {
    const snapshots = [
      snap('parse#0'),
      snap('sf-mount#1'),
      snap('sf-pay/charge#2'),
      snap('sf-pay/confirm#3'),
      snap('sf-unmount#4'),
      snap('build#5'),
    ];
    const entries = [
      entry('stage', 'parse#0'), entry('step', 'parse#0'),
      entry('subflow', 'sf-mount#1'),
      entry('stage', 'sf-pay/charge#2'), entry('step', 'sf-pay/charge#2'),
      entry('stage', 'sf-pay/confirm#3'), entry('step', 'sf-pay/confirm#3'),
      entry('subflow', 'sf-unmount#4'),
      entry('stage', 'build#5'), entry('step', 'build#5'), entry('step', 'build#5'),
    ];

    it('selectedIndex=0 shows only parse', () => {
      expect(computeBoth(entries, snapshots, 0)).toBe(2);
    });

    it('selectedIndex=1 shows through subflow entry', () => {
      expect(computeBoth(entries, snapshots, 1)).toBe(3);
    });

    it('selectedIndex=3 shows through confirm', () => {
      expect(computeBoth(entries, snapshots, 3)).toBe(7);
    });

    it('selectedIndex=5 shows all entries', () => {
      expect(computeBoth(entries, snapshots, 5)).toBe(11);
    });
  });

  describe('entries without runtimeStageId (keyless markers)', () => {
    const snapshots = [snap('a#0'), snap('b#1')];
    const entries = [
      entry('stage', 'a#0'),
      entry('loop', undefined), // keyless marker between a and b
      entry('stage', 'b#1'),
    ];

    it('keyless entries consumed when trailing a visible step', () => {
      // At a#0: consume stage + keyless marker (no eId, so doesn't break)
      expect(computeBoth(entries, snapshots, 0)).toBe(2);
    });

    it('all entries consumed at end', () => {
      expect(computeBoth(entries, snapshots, 1)).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('empty entries returns 0', () => {
      expect(computeRevealedEntryCount([], [snap('a#0')], 0)).toBe(0);
    });

    it('empty snapshots returns 0', () => {
      expect(computeRevealedEntryCount([entry('stage', 'a#0')], [], 0)).toBe(0);
    });

    it('selectedIndex beyond snapshot count clamps to last', () => {
      const entries = [entry('stage', 'a#0'), entry('step', 'a#0')];
      expect(computeRevealedEntryCount(entries, [snap('a#0')], 999)).toBe(2);
    });

    it('snapshot without runtimeStageId is skipped', () => {
      const entries = [entry('stage', 'a#0'), entry('stage', 'b#1')];
      // First snapshot has no runtimeStageId — skipped
      expect(computeRevealedEntryCount(entries, [{ runtimeStageId: undefined }, snap('b#1')], 1)).toBe(2);
    });
  });
});
