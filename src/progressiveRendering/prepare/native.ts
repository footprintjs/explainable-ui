/** Captured intrinsics: never consult a recorded value's methods, iterator or constructor. */
const DateType = Date, MapType = Map, SetType = Set;
const dateTime = Date.prototype.getTime;
const mapSize = Object.getOwnPropertyDescriptor(Map.prototype, 'size')!.get!;
const setSize = Object.getOwnPropertyDescriptor(Set.prototype, 'size')!.get!;
const mapEach = Map.prototype.forEach, setEach = Set.prototype.forEach;
const mapPut = Map.prototype.set, setPut = Set.prototype.add;
export type NativeKind = 'date' | 'map' | 'set';
export function unsupported(): never { throw new Error('Unsupported recorded data.'); }

export function nativeKind(value: object): NativeKind | undefined {
  const prototype = Object.getPrototypeOf(value);
  return prototype === DateType.prototype ? 'date' : prototype === MapType.prototype ? 'map' : prototype === SetType.prototype ? 'set' : undefined;
}
export function nativeEpoch(value: object): number {
  if (Reflect.ownKeys(value).length) unsupported();
  const epoch = dateTime.call(value);
  if (!Number.isFinite(epoch)) unsupported();
  return epoch;
}
export function nativeSize(value: object, kind: 'map' | 'set'): number {
  // Custom own properties are refused, including hidden/symbol overrides.
  if (Reflect.ownKeys(value).length) unsupported();
  return (kind === 'map' ? mapSize : setSize).call(value) as number;
}
/** Caller charges this known size to its shared WorkBudget BEFORE collection. */
export function nativeEntries(value: object, kind: 'map' | 'set', size: number): unknown[] {
  const entries: unknown[] = [];
  const maximum = size * (kind === 'map' ? 2 : 1);
  if (kind === 'map') mapEach.call(value, (item: unknown, key: unknown) => {
    if (entries.length + 2 > maximum) unsupported();
    entries.push(key, item);
  });
  else setEach.call(value, (item: unknown) => {
    if (entries.length >= maximum) unsupported();
    entries.push(item);
  });
  if (entries.length !== maximum) unsupported();
  return entries;
}
export function newNative(kind: NativeKind, epoch?: number): object {
  return kind === 'date' ? new DateType(epoch!) : kind === 'map' ? new MapType() : new SetType();
}
export function putNative(output: object, kind: 'map' | 'set', key: unknown, value?: unknown): void {
  if (kind === 'map') mapPut.call(output, key, value);
  else setPut.call(output, key);
}
