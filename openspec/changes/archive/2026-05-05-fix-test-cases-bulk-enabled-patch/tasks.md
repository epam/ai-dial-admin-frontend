## 1. Types & API layer

- [x] 1.1 Add `TestCaseBulkPatchRequest`, `TestCaseBulkOperationDto`, `TestCaseBulkSelectorDto` TypeScript types to `apps/ai-dial-admin/src/models/evaluation/test-suite.ts`
- [x] 1.2 Add `TEST_CASES_BULK_URL` constant to `apps/ai-dial-admin/src/server/eval/test-suites-api.ts` (value: `${TEST_CASES_URL(id)}:bulk`)
- [x] 1.3 Add `bulkPatchTestCases(id: string, request: TestCaseBulkPatchRequest, token: Token)` method to `TestSuitesApi` using `patchAction` (or `postAction` with PATCH — check `BaseApi`; add `patchAction` if missing)
- [x] 1.4 Add `bulkPatchTestCases` server action to `apps/ai-dial-admin/src/app/[lang]/test-suites/actions.ts`

## 2. Dirty-state tracking in TestCasesList

- [x] 2.1 Add `dirtyEnabledRef: RefObject<Map<string, boolean>>` to `TestCasesList.tsx`
- [x] 2.2 Modify `onCellValueChanged`: when `col === 'enabled'` and the row is an **existing** test case (not in `newTestCases`), update `dirtyEnabledRef` with the new value; if the row is already in `dirtyRowsRef`, also update `enabled` there — do NOT call `updateData` for this path
- [x] 2.3 Modify `onCellChange` (field changes): when adding a row to `dirtyRowsRef`, copy `enabled` from `dirtyEnabledRef` if it exists for that row, so the PUT payload reflects the correct final `enabled` state
- [x] 2.4 Add `getEnabledOnlyChanges(): Map<string, boolean>` to `TestCasesActions` interface and implement it — returns entries from `dirtyEnabledRef` whose IDs are **not** in `dirtyRowsRef`
- [x] 2.5 Update `clearDirtyAndRefresh` to also clear `dirtyEnabledRef`

## 3. Save flow in View.tsx

- [x] 3.1 After a successful `updateTestSuite`, call `updateTestCases` only if `getDirtyTestCases()` returns non-empty results (unchanged logic, already conditional)
- [x] 3.2 After `updateTestCases` resolves (success or failure), if `getEnabledOnlyChanges()` returns non-empty results, build and call `bulkPatchTestCases` with `bulkOperations` grouped by `enabled` value using the `ids` selector
- [x] 3.3 Call `router.refresh()` on **any** error in the save chain (suite update failure, test cases update failure, bulk PATCH failure) — move or add `router.refresh()` to all error branches in `onSave`
- [x] 3.4 Call `clearDirtyAndRefresh()` and `showSuccessAndRefresh()` only when **all** issued requests complete successfully

## 4. Tests

- [x] 4.1 Add unit tests for the `getEnabledOnlyChanges` logic: verify rows in both `dirtyRowsRef` and `dirtyEnabledRef` are excluded from the result
- [x] 4.2 Add unit tests for the `onCellValueChanged` enabled-change path: verify `dirtyEnabledRef` is updated and `dirtyRowsRef` is not polluted for enabled-only changes
- [x] 4.3 Add unit tests for the `onCellChange` field-change path: verify `enabled` from `dirtyEnabledRef` is merged into the `dirtyRowsRef` entry when a field edit follows an enabled change
- [x] 4.4 Add unit tests for `clearDirtyAndRefresh`: verify both `dirtyRowsRef` and `dirtyEnabledRef` are cleared

## 5. Quality checks

- [x] 5.1 Run `npm run lint` and fix any issues
- [x] 5.2 Run `npm run test` from `apps/ai-dial-admin/` and confirm all tests pass
- [x] 5.3 Fix double test-case list load after save: in `TestCasesList.tsx`, derive a stable `testCaseSchemaKey = JSON.stringify(selectedTestSuite.testCaseSchema)` and use it as the dep for the schema-change effect instead of the raw array reference, so `router.refresh()` (which creates a new reference via `structuredClone`) does not spuriously trigger a second `getTestCases` call
