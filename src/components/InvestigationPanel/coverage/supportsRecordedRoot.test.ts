import { describe, expect, it } from 'vitest';
import { supportsRecordedRoot } from '../coverage';

describe('private supported-root presentation', () => {
  it('supports an explicit complete gap-free backward root despite incomplete aggregate/impact reports', () => {
    const result = { nodeId: 'selected', rootCause: 'source', backward: { confidence: 'complete' as const, gaps: [] },
      confidence: 'incomplete', gaps: [{ code: 'edge-limit', evidence: [] }],
      impact: { confidence: 'incomplete', gaps: [{ code: 'edge-limit', evidence: [] }] } };
    expect(supportsRecordedRoot(result)).toBe(true);
    expect(supportsRecordedRoot({ rootCause: 'selected', backward: { confidence: 'complete', gaps: [] } })).toBe(true);
  });

  it('requires an explicit root and supplied complete gap-free backward evidence', () => {
    expect(supportsRecordedRoot({ backward: { confidence: 'complete', gaps: [] } })).toBe(false);
    expect(supportsRecordedRoot({ rootCause: 'source' })).toBe(false);
    expect(supportsRecordedRoot({ rootCause: 'source', backward: { confidence: 'incomplete', gaps: [] } })).toBe(false);
    expect(supportsRecordedRoot({ rootCause: 'source', backward: { confidence: 'complete', gaps: [{ code: 'not-collected', evidence: [] }] } })).toBe(false);
    const soleAlternative = { alternatives: ['source'], backward: { confidence: 'complete' as const, gaps: [] } };
    expect(supportsRecordedRoot(soleAlternative)).toBe(false);
  });
});
