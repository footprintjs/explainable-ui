import { describe, expect, it } from 'vitest';
import { createRecordedInvestigationExample } from '../../examples/grouped-investigation/recorded';

describe('recorded investigation example', () => {
  it('asks canonical Foottrace about the exact failed write and excludes unrelated payment work', async () => {
    const sample = createRecordedInvestigationExample('complete');
    const result = await sample.port.explain(sample.ids.failure, { signal: new AbortController().signal });
    expect(result.nodeId).toBe(sample.ids.failure);
    expect(result.rootCause).toBe(sample.ids.shipping);
    expect(result.path).toEqual([sample.ids.failure, sample.ids.decision, sample.ids.shipping]);
    expect(result.path).not.toContain(sample.ids.capture);
    expect(sample.queries).toEqual([sample.ids.failure]);
    expect(sample.definition.nodes.some(node => node.id === result.rootCause && node.parentId === 'delivery-group')).toBe(true);
  });

  it('withholds the root when capture is incomplete instead of returning the complete-example answer', async () => {
    const sample = createRecordedInvestigationExample('missing');
    const result = await sample.port.explain(sample.ids.failure, { signal: new AbortController().signal });
    expect(result.rootCause).toBeUndefined();
    expect(result.confidence).toBe('incomplete');
    expect(result.gaps.some(gap => gap.code === 'not-collected')).toBe(true);
    expect(result.path).toEqual([]);
  });

  it('keeps independent recorded problems as alternatives rather than choosing one by diagram position', async () => {
    const sample = createRecordedInvestigationExample('ambiguous');
    const result = await sample.port.explain(sample.ids.failure, { signal: new AbortController().signal });
    expect(result.rootCause).toBeUndefined();
    expect(new Set(result.alternatives)).toEqual(new Set([sample.ids.shipping, sample.ids.serviceArea]));
    expect(result.path).toEqual([]);
  });

  it('uses a fresh binding for each recording and retains exact identities for non-failed selections', async () => {
    const first = createRecordedInvestigationExample('complete');
    const second = createRecordedInvestigationExample('complete');
    expect(first.port.binding).not.toBe(second.port.binding);
    const result = await first.port.explain(first.ids.shipping, { signal: new AbortController().signal });
    expect(result.rootCause).toBe(first.ids.shipping);
    expect(result.impact.nodes).toContain(first.ids.failure);
    expect(first.queries).toEqual([first.ids.shipping]);
    expect(second.queries).toEqual([]);
  });
});
