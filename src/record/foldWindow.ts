import { serveRecord, stateAt } from "foottrace";
import type { FoldedState, TimeTravel, TimeTravelSource } from "foottrace";
import { freezeRecord } from "foottrace/write";

// Keep recent canonical folds, independent of the size or duration of the run.
const WINDOW_SIZE = 16;

// Prefetch only compact plain data. Stop inspecting as soon as the budget is
// spent, including on cycles. Large or native payloads keep only the pair
// needed to compare the current and previous stops.
function compactFold(fold: FoldedState): boolean {
  let budget = 4096;
  const pending: unknown[] = [fold];
  while (pending.length) {
    const item = pending.pop();
    if (typeof item === "string") budget -= item.length;
    if (budget < 0 || typeof item === "bigint") return false;
    if (!item || typeof item !== "object") continue;
    if (Array.isArray(item)) {
      if (item.length > 256) return false;
    } else if (Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) {
      return false;
    }
    for (const key in item) {
      if (!Object.prototype.hasOwnProperty.call(item, key)) continue;
      budget -= 16 + key.length;
      if (budget < 0) return false;
      pending.push((item as Record<string, unknown>)[key]);
    }
  }
  return true;
}

export function createFoldWindow<TMeta>(source: TimeTravelSource, cursor: TimeTravel<TMeta>) {
  const folds = new Map<number, FoldedState>();
  let lastStep: number | undefined;
  let capacity = WINDOW_SIZE;

  function read(step: number) {
    let folded = folds.get(step);
    if (folded) {
      folds.delete(step);
      folds.set(step, folded);
    } else {
      // The base has no rows to validate. The cursor already admitted this revision.
      folded = step < 0
        ? stateAt({ initialState: source.initialState }, -1)
        : cursor.stateAt(cursor.stops[step]);
      // Foottrace owns these detached fold results. Its serve-time copy handles
      // mutable native values (e.g. Dates and typed arrays) even inside frozen state.
      capacity = compactFold(folded) ? WINDOW_SIZE : 2;
      folds.set(step, freezeRecord(folded));
      while (folds.size > capacity) folds.delete(folds.keys().next().value!);
    }
    return folded;
  }

  return (step: number) => {
    if (capacity === WINDOW_SIZE && lastStep === step + 1 && step > 1 && !folds.has(step - 1)) {
      // A backward miss makes Foottrace refold from the base. Collect the next
      // few earlier stops in ascending order so its forward fold memo does the
      // scan once for the window. A speculative stop cannot refuse the request.
      for (let i = Math.max(0, step - WINDOW_SIZE + 1); i < step - 1; i++) {
        try { read(i); } catch { break; }
        if (capacity !== WINDOW_SIZE) break;
      }
    }
    lastStep = step;
    // Reuse a previously visited stop even when reading its predecessor
    // evicts an entry from the two-stop window used for larger states.
    const known = folds.has(step) ? read(step) : undefined;
    const previous = serveRecord(read(step - 1));
    const folded = cursor.stops[step] ? serveRecord(known ?? read(step)) : previous;
    return { previous, folded };
  };
}
