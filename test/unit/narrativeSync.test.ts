/**
 * Unit tests for narrative position-based sync logic.
 *
 * Tests the algorithm that maps snapshot index → entry reveal count.
 * This is the core sync between the execution tree timeline and the
 * narrative entries — handles loops, selectors, subflows correctly.
 */
import { describe, expect, it } from 'vitest';
import type { StageSnapshot, NarrativeEntry } from '../../src/types';

// Extract the sync algorithm (same logic as NarrativePanel's revealedEntryCount useMemo)
function computeRevealedEntryCount(
  narrativeEntries: NarrativeEntry[],
  snapshots: Pick<StageSnapshot, 'stageLabel' | 'stageName' | 'subflowId'>[],
  selectedIndex: number,
): number {
  if (!narrativeEntries.length || snapshots.length === 0) return 0;

  let entryIdx = 0;
  for (let si = 0; si <= selectedIndex && si < snapshots.length; si++) {
    const snap = snapshots[si];
    const keys = new Set<string>();
    if (snap.stageLabel) keys.add(snap.stageLabel);
    if (snap.stageName) keys.add(snap.stageName);
    if (snap.subflowId) keys.add(snap.subflowId);

    let found = false;
    for (let j = entryIdx; j < narrativeEntries.length; j++) {
      const e = narrativeEntries[j] as { stageId?: string; subflowId?: string; stageName?: string };
      const eKey = e.stageId ?? e.subflowId ?? e.stageName;
      if (eKey && keys.has(eKey)) {
        found = true;
        entryIdx = j;
        break;
      }
    }

    if (!found) continue;

    while (entryIdx < narrativeEntries.length) {
      const e = narrativeEntries[entryIdx] as { stageId?: string; subflowId?: string; stageName?: string };
      const eKey = e.stageId ?? e.subflowId ?? e.stageName;
      if (eKey && !keys.has(eKey)) break;
      entryIdx++;
    }
  }
  return entryIdx;
}

// Helpers
function snap(stageLabel: string, stageName?: string, subflowId?: string): Pick<StageSnapshot, 'stageLabel' | 'stageName' | 'subflowId'> {
  return { stageLabel, stageName: stageName ?? stageLabel, subflowId };
}

function entry(type: NarrativeEntry['type'], stageId?: string, subflowId?: string): NarrativeEntry {
  return { type, text: `${type} ${stageId ?? ''}`, depth: 0, stageId, subflowId } as NarrativeEntry & { stageId?: string; subflowId?: string };
}

describe('Narrative position-based sync', () => {
  describe('linear flow', () => {
    const snapshots = [snap('a'), snap('b'), snap('c')];
    const entries = [
      entry('stage', 'a'), entry('step', 'a'),
      entry('stage', 'b'), entry('step', 'b'),
      entry('stage', 'c'), entry('step', 'c'),
    ];

    it('selectedIndex=0 shows first stage + steps', () => {
      expect(computeRevealedEntryCount(entries, snapshots, 0)).toBe(2);
    });

    it('selectedIndex=1 shows first two stages', () => {
      expect(computeRevealedEntryCount(entries, snapshots, 1)).toBe(4);
    });

    it('selectedIndex=2 shows all entries', () => {
      expect(computeRevealedEntryCount(entries, snapshots, 2)).toBe(6);
    });
  });

  describe('loop flow (same stageId multiple times)', () => {
    const snapshots = [snap('init'), snap('call'), snap('eval'), snap('call'), snap('eval'), snap('call'), snap('eval')];
    const entries = [
      entry('stage', 'init'), entry('step', 'init'),
      entry('stage', 'call'), entry('step', 'call'),
      entry('stage', 'eval'), entry('step', 'eval'), entry('loop', 'eval'),
      entry('stage', 'call'), entry('step', 'call'),
      entry('stage', 'eval'), entry('step', 'eval'), entry('loop', 'eval'),
      entry('stage', 'call'), entry('step', 'call'),
      entry('stage', 'eval'), entry('step', 'eval'), entry('break', 'eval'),
    ];

    it('selectedIndex=0 shows only init', () => {
      expect(computeRevealedEntryCount(entries, snapshots, 0)).toBe(2);
    });

    it('selectedIndex=1 shows init + first call', () => {
      expect(computeRevealedEntryCount(entries, snapshots, 1)).toBe(4);
    });

    it('selectedIndex=2 shows init + first call + first eval', () => {
      expect(computeRevealedEntryCount(entries, snapshots, 2)).toBe(7);
    });

    it('selectedIndex=3 shows through second call', () => {
      expect(computeRevealedEntryCount(entries, snapshots, 3)).toBe(9);
    });

    it('selectedIndex=6 shows all entries', () => {
      expect(computeRevealedEntryCount(entries, snapshots, 6)).toBe(17);
    });
  });

  describe('selector + subflow flow', () => {
    const snapshots = [
      snap('parse', 'Parse Request'),
      snap('route', 'Route Services'),
      snap('auth', 'Auth Service'),
      snap('payment', 'Payment Service'),
      snap('build', 'Build Response'),
    ];
    const entries = [
      entry('stage', 'parse'), entry('step', 'parse'),
      entry('fork', 'route'), entry('fork', 'route'),
      entry('subflow', undefined, 'auth'), entry('subflow', undefined, 'payment'),
      entry('stage', 'validate-token', 'auth'), entry('step', 'validate-token', 'auth'),
      entry('stage', 'create-charge', 'payment'), entry('step', 'create-charge', 'payment'),
      entry('stage', 'check-perms', 'auth'), entry('step', 'check-perms', 'auth'),
      entry('stage', 'confirm', 'payment'), entry('step', 'confirm', 'payment'),
      entry('subflow', undefined, 'auth'), entry('subflow', undefined, 'payment'),
      entry('stage', 'build'), entry('step', 'build'), entry('step', 'build'),
    ];

    it('selectedIndex=0 shows only parse stage', () => {
      expect(computeRevealedEntryCount(entries, snapshots, 0)).toBe(2);
    });

    it('selectedIndex=1 shows parse + route fork entries', () => {
      expect(computeRevealedEntryCount(entries, snapshots, 1)).toBe(4);
    });

    it('selectedIndex=2 shows through auth subflow entries', () => {
      const count = computeRevealedEntryCount(entries, snapshots, 2);
      // Should include fork entries + auth subflow entering + auth stage entries
      expect(count).toBeGreaterThan(4);
    });

    it('selectedIndex=4 shows all entries', () => {
      expect(computeRevealedEntryCount(entries, snapshots, 4)).toBe(19);
    });
  });

  describe('edge cases', () => {
    it('empty entries returns 0', () => {
      expect(computeRevealedEntryCount([], [snap('a')], 0)).toBe(0);
    });

    it('empty snapshots returns 0', () => {
      expect(computeRevealedEntryCount([entry('stage', 'a')], [], 0)).toBe(0);
    });

    it('selectedIndex beyond snapshot count clamps to last', () => {
      const entries = [entry('stage', 'a'), entry('step', 'a')];
      expect(computeRevealedEntryCount(entries, [snap('a')], 999)).toBe(2);
    });
  });
});
