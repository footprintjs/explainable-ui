/**
 * Unit tests for StoryNarrative heading numbering logic.
 *
 * Tests the algorithm that assigns type-specific headings:
 *   Stage N, Selector N, Decider N, Subflow N.M
 *
 * Also tests entry filtering (hide subflow internals, hide Exiting markers).
 */
import { describe, expect, it } from 'vitest';
import type { NarrativeEntry } from '../../src/types';

// Extract the numbering logic (same as StoryNarrative's numberedEntries useMemo)
interface NumberedEntry extends NarrativeEntry {
  heading: string | null;
  isHeading: boolean;
  isSubflow?: boolean;
}

function computeNumberedEntries(revealed: NarrativeEntry[]): NumberedEntry[] {
  let rootCounter = 0;
  let subflowChildCounter = 0;
  let prevType = "";

  return revealed.map((entry) => {
    const isStageHeading = entry.type === "stage";
    const isConditionHeading = entry.type === "condition";
    const isForkHeading = entry.type === "fork" && prevType !== "fork";
    const isSubflowMarker = entry.type === "subflow";

    prevType = entry.type;

    let cleanText = entry.text;
    cleanText = cleanText.replace(/^Stage \d+:\s*/, "");
    // Detect fork type BEFORE stripping prefix
    const isSelector = entry.type === "fork" && entry.text.includes("[Selected]");
    cleanText = cleanText.replace(/^\[(Selected|Parallel)\]:\s*/, "");

    // Condition entries are sub-headings of their parent stage — don't increment counter
    if (isConditionHeading) {
      return { ...entry, heading: `Decider ${rootCounter}`, text: cleanText, isHeading: true };
    }

    if (isStageHeading || isForkHeading) {
      rootCounter++;
      subflowChildCounter = 0;

      const typeLabel = isForkHeading ? (isSelector ? "Selector" : "Fork") : "Stage";
      return { ...entry, heading: `${typeLabel} ${rootCounter}`, text: cleanText, isHeading: true };
    }

    if (entry.type === "fork") {
      return { ...entry, heading: null, isHeading: false, text: cleanText };
    }

    if (isSubflowMarker && entry.text.startsWith("Entering")) {
      if (subflowChildCounter === 0) rootCounter++;
      subflowChildCounter++;
      const sfMatch = entry.text.match(/Entering the (.+?) subflow/);
      const sfName = sfMatch?.[1] ?? "Subflow";
      const sfDesc = entry.text.replace(/^Entering the .+? subflow[.:]\s*/, "").replace(/\.$/, "");
      return {
        ...entry,
        heading: `Subflow ${rootCounter}.${subflowChildCounter}`,
        text: sfDesc ? `${sfName} — ${sfDesc}` : sfName,
        isHeading: true,
        isSubflow: true,
      };
    }

    return { ...entry, heading: null, isHeading: false };
  });
}

// Extract the filtering logic (same as StoryNarrative's revealed useMemo)
function filterEntries(entries: NarrativeEntry[]): NarrativeEntry[] {
  return entries.filter((e) => {
    const sfId = (e as { subflowId?: string }).subflowId;
    if (!sfId) return true;
    if (e.type === "subflow") return true;
    return false;
  });
}

// Helper
function e(type: NarrativeEntry['type'], text: string, subflowId?: string): NarrativeEntry {
  return { type, text, depth: 0, subflowId } as NarrativeEntry & { subflowId?: string };
}

describe('Narrative heading numbering', () => {
  it('linear flow: Stage 1, Stage 2, Stage 3', () => {
    const entries = [
      e('stage', 'Stage 1: First stage.'),
      e('step', 'Step 1: Write x = 1'),
      e('stage', 'Stage 2: Second stage.'),
      e('stage', 'Stage 3: Third stage.'),
    ];
    const numbered = computeNumberedEntries(entries);
    expect(numbered[0].heading).toBe('Stage 1');
    expect(numbered[2].heading).toBe('Stage 2');
    expect(numbered[3].heading).toBe('Stage 3');
  });

  it('strips "Stage N:" prefix from text', () => {
    const entries = [e('stage', 'Stage 1: The process began: Parse request.')];
    const numbered = computeNumberedEntries(entries);
    expect(numbered[0].text).toBe('The process began: Parse request.');
  });

  it('condition entry gets Decider heading (same number as parent stage)', () => {
    const entries = [
      e('stage', 'Stage 1: First.'),
      e('condition', '[Condition]: Decided to go left.'),
    ];
    const numbered = computeNumberedEntries(entries);
    // Condition shares the parent stage counter — no increment
    expect(numbered[1].heading).toBe('Decider 1');
  });

  it('decider does not double-count: next stage increments correctly', () => {
    const entries = [
      e('stage', 'Stage 1: Evaluate risk.'),
      e('condition', '[Condition]: Risk is high, chose reject.'),
      e('stage', 'Stage 2: Reject request.'),
    ];
    const numbered = computeNumberedEntries(entries);
    expect(numbered[0].heading).toBe('Stage 1');
    expect(numbered[1].heading).toBe('Decider 1');
    expect(numbered[2].heading).toBe('Stage 2');
  });

  it('[Selected] fork gets Selector heading', () => {
    const entries = [
      e('stage', 'Stage 1: First.'),
      e('fork', '[Selected]: 2 of 3 selected: A, B.'),
      e('fork', '[Parallel]: Forking into 2 paths: A, B.'),
    ];
    const numbered = computeNumberedEntries(entries);
    expect(numbered[1].heading).toBe('Selector 2');
    expect(numbered[1].text).toBe('2 of 3 selected: A, B.');
    // Second fork entry has no heading
    expect(numbered[2].heading).toBeNull();
  });

  it('[Parallel] fork gets Fork heading (not Selector)', () => {
    const entries = [
      e('stage', 'Stage 1: First.'),
      e('fork', '[Parallel]: Forking into 3 paths: A, B, C.'),
    ];
    const numbered = computeNumberedEntries(entries);
    expect(numbered[1].heading).toBe('Fork 2');
    expect(numbered[1].text).toBe('Forking into 3 paths: A, B, C.');
  });

  it('subflow entries get Subflow N.M heading', () => {
    const entries = [
      e('stage', 'Stage 1: Parse.'),
      e('fork', '[Selected]: 2 selected.'),
      e('subflow', 'Entering the Auth Service subflow: Validate JWT.'),
      e('subflow', 'Entering the Payment Service subflow: Create charge.'),
    ];
    const numbered = computeNumberedEntries(entries);
    expect(numbered[2].heading).toBe('Subflow 3.1');
    expect(numbered[2].text).toBe('Auth Service — Validate JWT');
    expect(numbered[3].heading).toBe('Subflow 3.2');
    expect(numbered[3].text).toBe('Payment Service — Create charge');
  });

  it('stage after subflows continues numbering correctly', () => {
    const entries = [
      e('stage', 'Stage 1: Parse.'),
      e('fork', '[Selected]: 2 selected.'),
      e('subflow', 'Entering the Auth subflow.'),
      e('subflow', 'Entering the Payment subflow.'),
      e('stage', 'Stage 4: Build Response.'),
    ];
    const numbered = computeNumberedEntries(entries);
    expect(numbered[0].heading).toBe('Stage 1');
    expect(numbered[1].heading).toBe('Selector 2');
    expect(numbered[2].heading).toBe('Subflow 3.1');
    expect(numbered[3].heading).toBe('Subflow 3.2');
    expect(numbered[4].heading).toBe('Stage 4');
  });

  it('step entries have no heading', () => {
    const entries = [
      e('stage', 'Stage 1: First.'),
      e('step', 'Step 1: Write x = 1'),
      e('step', 'Step 2: Read y'),
    ];
    const numbered = computeNumberedEntries(entries);
    expect(numbered[1].heading).toBeNull();
    expect(numbered[2].heading).toBeNull();
  });

  it('loop entries have no heading', () => {
    const entries = [
      e('stage', 'Stage 1: First.'),
      e('loop', 'On pass 1 through Process.'),
    ];
    const numbered = computeNumberedEntries(entries);
    expect(numbered[1].heading).toBeNull();
  });
});

describe('Narrative entry filtering', () => {
  it('shows root-level entries', () => {
    const entries = [
      e('stage', 'Root stage'),
      e('step', 'Root step'),
    ];
    expect(filterEntries(entries)).toHaveLength(2);
  });

  it('hides subflow internal entries', () => {
    const entries = [
      e('stage', 'Root stage'),
      e('stage', 'Subflow stage', 'sf-auth'),
      e('step', 'Subflow step', 'sf-auth'),
    ];
    const filtered = filterEntries(entries);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].text).toBe('Root stage');
  });

  it('keeps subflow Entering/Exiting markers', () => {
    const entries = [
      e('stage', 'Root stage'),
      e('subflow', 'Entering the Auth subflow.', 'sf-auth'),
      e('stage', 'Auth internal', 'sf-auth'),
      e('subflow', 'Exiting the Auth subflow.', 'sf-auth'),
    ];
    const filtered = filterEntries(entries);
    expect(filtered).toHaveLength(3); // root + entering + exiting
    expect(filtered[1].text).toContain('Entering');
    expect(filtered[2].text).toContain('Exiting');
  });

  it('empty input returns empty', () => {
    expect(filterEntries([])).toHaveLength(0);
  });
});
