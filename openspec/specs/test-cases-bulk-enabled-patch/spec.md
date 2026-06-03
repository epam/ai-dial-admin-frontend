## DEPRECATED

This capability has been removed. The `PATCH /api/v1/test-suites/{id}/test-cases:bulk` endpoint no longer exists.

**Migration**: Enable/disable state is now stored as `TestSuite.disabledTestCaseIds` and persisted via the suite PUT (`updateTestSuite`). See `test-suite-dataset-binding` spec — "Enable/disable test cases via disabledTestCaseIds" requirement.
