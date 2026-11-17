export { LensControllerProvider, useLensController, useOptionalControllerOwner } from './workbench/context';
export type { LensControllerProviderProps } from './workbench/context';
export type { LensRecordingInput, LensControllerOptions, LensController, LensControllerActions, LensPresentationRequest, LensRecordingStatus } from './workbench/types';
// Private presentation contracts; deliberately absent from the package root exports.
export type { PendingSubflow } from './workbench/internal/useLazySubflowRequest';
export type { VisitChoice } from './workbench/internal/useSubflowNavigation';
export type TraceSessionView = ReturnType<typeof import('./workbench/internal/useTraceSession').useTraceSessionController>;
