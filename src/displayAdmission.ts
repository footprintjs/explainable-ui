/** Internal schema-parser facade. Only checks, limits and display DTO types belong on the package root. */
export { DisplayReader, runDisplayCheck, readOwnField } from './displayAdmission/reader';
export { investigationDisplayLimits, failureExplanationDisplayLimits } from './displayAdmission/limits';
export type { DisplayCheckResult, DisplayDiagnostic, DisplayDiagnosticCode, DisplayLimitName, DisplayPath, DisplaySchemaField, DisplayUsage } from './displayAdmission/types';
