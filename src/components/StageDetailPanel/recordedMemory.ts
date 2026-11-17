import { compareRecordedValues } from '../../recordedValues';

interface Change { key: string; type: 'added' | 'updated' | 'removed'; oldValue?: unknown; newValue?: unknown }
type MemoryRow = { kind: 'change'; change: Change } | { kind: 'unchanged'; key: string; value: unknown } | { kind: 'unavailable'; key: string };

/** Preserve own descriptors while filtering; no legacy accessor is evaluated. */
export function withoutExcluded(memory: Record<string, unknown>, exclude: Set<string>): Record<string, unknown> {
  if (!exclude.size) return memory;
  const output = Object.create(null);
  for (const key of Object.keys(memory)) if (!exclude.has(key)) {
    const descriptor = Object.getOwnPropertyDescriptor(memory, key); if (descriptor) Object.defineProperty(output, key, descriptor);
  }
  return output;
}
export function compareMemory(previous: Record<string, unknown> | null, current: Record<string, unknown>) {
  const changes: Change[] = [], unavailable = new Set<string>();
  try {
    for (const key of new Set([...Object.keys(previous ?? {}), ...Object.keys(current)])) {
      const before = previous ? Object.getOwnPropertyDescriptor(previous, key) : undefined;
      const after = Object.getOwnPropertyDescriptor(current, key);
      if ((before && !('value' in before)) || (after && !('value' in after))) { unavailable.add(key); continue; }
      const comparison = compareRecordedValues(before?.value, after?.value);
      if (comparison === 'unavailable') { unavailable.add(key); continue; }
      if (!before && after) changes.push({ key, type: 'added', newValue: after.value });
      else if (before && !after) changes.push({ key, type: 'removed', oldValue: before.value });
      else if (comparison === 'different') changes.push({ key, type: 'updated', oldValue: before?.value, newValue: after?.value });
    }
  } catch { return { changes: [], unavailable: new Set(['Memory comparison']) }; }
  const order = { added: 0, updated: 1, removed: 2 }; changes.sort((a, b) => order[a.type] - order[b.type]);
  return { changes, unavailable };
}
export function buildMemoryRows(current: Record<string, unknown>, changes: readonly Change[], unavailable: ReadonlySet<string>): MemoryRow[] {
  try {
    const changed = new Set(changes.map(change => change.key));
    return [
      ...changes.map(change => ({ kind: 'change' as const, change })),
      ...[...unavailable].sort().map(key => ({ kind: 'unavailable' as const, key })),
      ...Object.keys(current).filter(key => !changed.has(key) && !unavailable.has(key)).sort().map(key => {
        const descriptor = Object.getOwnPropertyDescriptor(current, key);
        return descriptor && 'value' in descriptor ? { kind: 'unchanged' as const, key, value: descriptor.value } : { kind: 'unavailable' as const, key };
      }),
    ];
  } catch { return [{ kind: 'unavailable', key: 'Memory state' }]; }
}
