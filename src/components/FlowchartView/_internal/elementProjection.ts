/**
 * Keep the last projection of each immutable source element. A new layout
 * produces new source objects, so it cannot accidentally reuse old geometry.
 * No entry retains a node that the chart has discarded.
 */
export function memoizeElement<T extends object, Args extends unknown[], Output>(
  project: (element: T, ...args: Args) => Output,
): (element: T, ...args: Args) => Output {
  const cache = new WeakMap<T, { args: Args; result: Output }>();
  return (element, ...args) => {
    const previous = cache.get(element);
    if (previous && previous.args.every((value, i) => Object.is(value, args[i]))) return previous.result;
    const result = project(element, ...args);
    cache.set(element, { args, result });
    return result;
  };
}

/** Index one recording revision. Keep just the last visible prefix per stage. */
export function indexStageVisits(order: readonly { stageId: string }[]) {
  const visits = new Map<string, { numbers: number[]; prefix?: { count: number; numbers: number[] } }>();
  for (const [i, step] of order.entries()) {
    let entry = visits.get(step.stageId);
    if (!entry) {
      entry = { numbers: [] };
      visits.set(step.stageId, entry);
    }
    entry.numbers.push(i + 1);
  }
  return (id: string, through: number): number[] | undefined => {
    const entry = visits.get(id);
    if (!entry || through < entry.numbers[0]) return undefined;
    const { numbers } = entry;
    let count = numbers.length;
    if (through < numbers[count - 1]) {
      let low = 0, high = count;
      while (low < high) {
        const mid = low + Math.floor((high - low) / 2);
        if (numbers[mid] <= through) low = mid + 1;
        else high = mid;
      }
      count = low;
    }
    // Even a complete prefix is a copy: custom node data has historically
    // exposed a mutable array and must never hand out the search index.
    if (entry.prefix?.count !== count || entry.prefix.numbers.length !== count) {
      entry.prefix = { count, numbers: numbers.slice(0, count) };
    }
    return entry.prefix.numbers;
  };
}
