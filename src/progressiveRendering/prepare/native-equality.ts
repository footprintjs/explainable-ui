import { isPlainRecord, optionalOwnDataField, WorkBudget } from '../../trace/safeRecordRead';
import { nativeEntries, nativeEpoch, nativeKind, nativeSize } from './native';

/** Compare detached admitted data: ordered collections and shared-reference topology are facts. */
export function sameOwnedData(a: unknown, b: unknown): boolean {
  const queue: Array<[unknown, unknown]> = [[a, b]], budget = new WorkBudget();
  const forward = new WeakMap<object, object>(), reverse = new WeakMap<object, object>();
  try {
    for (let index = 0; index < queue.length; index++) {
      budget.spend(1); const [left, right] = queue[index];
      if (!left || !right || typeof left !== 'object' || typeof right !== 'object') {
        if (!Object.is(left, right)) return false;
        continue;
      }
      if (forward.has(left) || reverse.has(right)) {
        if (forward.get(left) !== right || reverse.get(right) !== left) return false;
        continue;
      }
      forward.set(left, right); reverse.set(right, left);
      const native = nativeKind(left);
      if (native !== nativeKind(right)) return false;
      if (native === 'date') { if (nativeEpoch(left) !== nativeEpoch(right)) return false; continue; }
      if (native) {
        const size = nativeSize(left, native);
        if (size !== nativeSize(right, native)) return false;
        // One logical pair's collection slots are charged before either scratch allocation.
        budget.spend(size * (native === 'map' ? 2 : 1));
        const l = nativeEntries(left, native, size), r = nativeEntries(right, native, size);
        for (let entry = 0; entry < l.length; entry++) queue.push([l[entry], r[entry]]);
        continue;
      }
      const array = Array.isArray(left);
      if (array !== Array.isArray(right) || (!array && (!isPlainRecord(left) || !isPlainRecord(right)))) return false;
      if (array && optionalOwnDataField(left, 'length') !== optionalOwnDataField(right, 'length')) return false;
      const keys = Object.keys(left), otherKeys = Object.keys(right);
      if (keys.length !== otherKeys.length) return false;
      budget.spend(keys.length);
      for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
        queue.push([optionalOwnDataField(left, key), optionalOwnDataField(right, key)]);
      }
    }
    return true;
  } catch { return false; }
}
