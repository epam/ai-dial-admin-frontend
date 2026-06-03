## REMOVED Requirements

### Requirement: Bulk patch test cases enabled state
**Reason**: The `bulkPatchTestCases` backend endpoint has been removed. Enable/disable state is now stored as `TestSuite.disabledTestCaseIds` and persisted via the suite PUT.
**Migration**: Enable/disable changes update `TestSuite.disabledTestCaseIds` in the parent state and are saved as part of `updateTestSuite`. See `test-suite-dataset-binding` spec — "Enable/disable test cases via disabledTestCaseIds" requirement.
