import { serveRecord, stateAt } from "foottrace";
import type { FoldedState, TimeTravel, TimeTravelSource } from "foottrace";
import { freezeRecord } from "foottrace/write";
import { fitsReaderCache } from "./cacheBudget";

// Keep recent canonical folds, independent of the size or duration of the run.
const WINDOW_SIZE = 16;

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
      capacity = fitsReaderCache(folded) ? WINDOW_SIZE : 2;
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
