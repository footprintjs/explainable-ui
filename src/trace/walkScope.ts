import type { TraceWalkScope } from "./traceWalk";
import {
  isPlainRecord,
  optionalOwnDataField,
  readName,
  readOwnArray,
  WorkBudget,
} from "./safeRecordRead";
/** Only inert names/flags cross the scope boundary; never retain caller-owned objects. */
export function snapshotWalkScope(value: TraceWalkScope): TraceWalkScope {
  try {
    const budget = new WorkBudget();
    if (!isPlainRecord(value)) throw new Error();
    const invocationPath = readOwnArray(
      optionalOwnDataField(value, "invocationPath"),
      budget
    ).map(readName);
    if (invocationPath.length > 128 || invocationPath.join("").length > 8_192)
      throw new Error();
    const sourceLabels = optionalOwnDataField(value, "mountLabels");
    let mountLabels: Readonly<Record<string, string>> | undefined;
    if (sourceLabels !== undefined) {
      if (!isPlainRecord(sourceLabels)) throw new Error();
      const names = Object.keys(sourceLabels);
      budget.spend(names.length);
      mountLabels = Object.freeze(
        Object.fromEntries(
          names.map((name) => [
            readName(name),
            readName(optionalOwnDataField(sourceLabels, name)),
          ])
        )
      );
    }
    const sourceKeys = optionalOwnDataField(value, "startKeys");
    const startKeys = sourceKeys === undefined ? undefined : Object.freeze(readOwnArray(sourceKeys, budget).map(readName));
    const readsAvailable = optionalOwnDataField(value, "readsAvailable");
    if (readsAvailable !== undefined && typeof readsAvailable !== "boolean")
      throw new Error();
    return Object.freeze({
      invocationPath: Object.freeze(invocationPath),
      ...(mountLabels === undefined ? {} : { mountLabels }),
      ...(startKeys === undefined ? {} : { startKeys }),
      ...(readsAvailable === undefined ? {} : { readsAvailable }),
    });
  } catch {
    throw new TypeError(
      "Trace scope must contain only bounded recorded names and flags."
    );
  }
}
