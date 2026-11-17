/** Internal common recorded-data door; deliberately absent from package exports. */
export { copyOwnedData } from './recordedValues/native-copy';
export { sameOwnedData } from './recordedValues/native-equality';
export { nativeKind, nativeEpoch, nativeSize } from './recordedValues/native';
export { formatRecordedValue } from './recordedValues/format';
export type { RecordedValueFormatOptions } from './recordedValues/format';
export { compareRecordedValues } from './recordedValues/compare';
export type { RecordedValueComparison } from './recordedValues/compare';
