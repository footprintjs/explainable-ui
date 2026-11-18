/** Public recording reader. Import from footprint-explainable-ui/record. */
export type { KeysReadSource, StateKey, Stop, TimeTravelSource, TimeTravelStrategy } from "foottrace";
export { RecordTimeSlider } from "./RecordTimeSlider";
export type { RecordTimeSliderProps } from "./RecordTimeSlider";
export { RecordLens } from "./RecordLens";
export type { RecordLensProps } from "./RecordLens";
export { buildRecordLensModel, createRecordLensReader } from "./model";
export type {
  RecordBacktrackPosition,
  RecordLensInput,
  RecordLensReader,
  RecordReaderInput,
  RecordLensModel,
  RecordChange,
  RecordWriterStop,
  RecordProvenance,
  RecordRefusal,
} from "./types";
export { createScopedRecordGraph } from "./scopedRecordGraph";
export type { ScopedBacktrack, ScopedGap, ScopedRecordGraph, ScopedWriter } from "./scopedRecordGraph";
