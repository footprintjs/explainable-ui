/** Fixed retained-display ceilings, not graph-query or storage budgets. Text uses UTF-16 code units. */
export const investigationDisplayLimits = Object.freeze({
  maxTextCodeUnits: 65_536,
  maxStringCodeUnits: 2_048,
  maxItemsPerList: 256,
  maxMarksPerItem: 16,
  maxReferencesPerList: 32,
  maxGapsPerList: 128,
  maxEdgesPerList: 512,
});

export const failureExplanationDisplayLimits = Object.freeze({
  maxTextCodeUnits: 262_144,
  maxItemsPerList: 1_024,
  maxTotalListItems: 4_096,
  maxReferenceOrUnknownCodeUnits: 4_096,
  maxFindingCodeUnits: 80,
  findingCodePattern: '^[A-Z][A-Z0-9_]{1,79}$',
});
