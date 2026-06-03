## 1. Data Model — Breaking Changes

- [x] 1.1 In `src/models/evaluation/test-suite.ts`: remove `enabled: boolean` from `TestCase`; add `datasetId?: string` and `disabledTestCaseIds?: string[]` to `TestSuite`; remove `testCaseSchema?: TestCaseSchema[]` from `TestSuite`; remove `TestCaseBulkSelectorDto`, `TestCaseBulkOperationDto`, `TestCaseBulkPatchRequest` interfaces
- [x] 1.2 In `src/app/[lang]/test-suites/actions.ts`: remove `bulkPatchTestCases` action; remove `getTestCases`, `createTestCase`, `updateTestCases`, `removeTestCase`, `removeMultipleTestCases`, `importTestCase`, `importTestCasePreview` actions (TestSuites components will import these directly from `datasets/actions.ts`)
- [x] 1.3 Add `TestSuitesI18nKey` entries for dataset binding section strings to `src/constants/i18n.ts` and `src/locales/en.ts`: `DatasetNotBound`, `PickPublicDataset`, `CreatePrivateDataset`, `DatasetPrivateDescription`, `DatasetPublicDescription`, `UnbindDataset`, `UnbindDatasetConfirm`, `MakePublicDatasetConfirm`

## 2. TestSuite View — Save Flow & Tab Visibility

- [x] 2.1 In `src/components/TestSuites/View/View.tsx`: remove `bulkPatchTestCases` call and `getEnabledOnlyChanges` logic from the `onSave` handler; `disabledTestCaseIds` is now part of the suite state and saved via `updateTestSuite` automatically
- [x] 2.2 In `src/utils/tabs/utils.ts`: update `getTestSuiteTabs()` to accept `datasetId?: string` parameter; exclude the Schema tab when `datasetId` is null
- [x] 2.3 In `src/components/TestSuites/View/TabsContent.tsx`: pass `datasetId` (from `selectedTestSuite.datasetId`) into the tabs; render dataset binding UI (instead of TestCases component) when `datasetId` is null on the Test Cases tab; remove the Schema tab rendering when no dataset

## 3. Dataset Binding UI — Unbound State

- [x] 3.1 Create `src/components/TestSuites/TestCases/DatasetBinding/DatasetBinding.tsx` — renders "Pick public dataset" and "Create private dataset" buttons; handles create-private flow (calls `createDataset` then `updateTestSuite`, triggers `router.refresh()`, shows error toast on failure)
- [x] 3.2 Create `src/components/TestSuites/TestCases/DatasetBinding/PickPublicDataset.tsx` — modal with a paginated/searchable list of PUBLIC datasets (reuse grid pattern from Datasets listing); single-select; on confirm calls `updateTestSuite({ ...suite, datasetId })` then `router.refresh()`
- [x] 3.3 Wire `DatasetBinding` into `TabsContent.tsx` — shown instead of `TestCases` when `selectedTestSuite.datasetId` is null

## 4. Dataset Header Component

- [x] 4.1 Create `src/components/TestSuites/TestCases/DatasetHeader/DatasetHeader.tsx` — displays dataset ID (DialEllipsisTooltip for truncation), visibility badge (PUBLIC/PRIVATE), "Open in new tab" icon button (links to `/datasets/{datasetId}`), visibility action button, and description text (per visibility type)
- [x] 4.2 Wire visibility action button in `DatasetHeader`: for PRIVATE dataset show "Make Public" — confirmation popup then `transitionVisibility(datasetId, { visibility: 'PUBLIC' })` with 409 error toast handling; for PUBLIC dataset show "Unbind" — confirmation popup then `updateTestSuite({ ...suite, datasetId: null })` then `router.refresh()`
- [x] 4.3 Wire `DatasetHeader` into `src/components/TestSuites/TestCases/TestCases.tsx` — rendered above the Header + TestCasesList when `selectedTestSuite.datasetId` is not null; pass `dataset` (from `selectedTestSuite` fields or a fetched Dataset object), `onUpdateTestSuite`, `testSuiteId`

## 5. Test Cases Tab — Model and Grid Updates

- [x] 5.1 In `src/components/TestSuites/TestCases/TestCasesList.tsx`: remove `dirtyEnabledRef`, `onCellValueChanged` for enabled column, and `getEnabledOnlyChanges` from `TestCasesActions` interface; add `isReadOnly?: boolean` prop; guard all edit/add/delete actions behind `!isReadOnly`; change `refreshGrid` to call `getTestCases(selectedTestSuite.datasetId, ...)` (imported from `datasets/actions.ts`); change `onAddTestCase`, `onRemoveTestCase`, `onApplyImport`, `onExport` to use `datasetId` and `datasetsApi` actions; remove the schema-diff check from `onApplyImport`
- [x] 5.2 In `src/components/TestSuites/TestCases/TestCases.tsx`: remove schema modal state and `onOpenSchemaModal`; pass `isReadOnly={selectedTestSuite.datasetId ? dataset?.visibility === 'PUBLIC' : false}` down to Header and TestCasesList; pass `datasetId` to TestCasesList
- [x] 5.3 In `src/components/TestSuites/TestCases/Header.tsx`: remove `onOpenSchemaModal` prop and schema modal button; add `isReadOnly?: boolean` prop to disable/hide Add and Import buttons when read-only
- [x] 5.4 In `src/constants/grid-columns/grid-columns.tsx`: update `getTestCaseColumns()` — remove the `enabled` column definition; add enable/disable checkbox column that reads from `disabledTestCaseIds` on the suite and calls `onChange({ ...suite, disabledTestCaseIds: [...] })`

## 6. Schema Tab — Read-Only

- [x] 6.1 Create `src/components/TestSuites/Schema/SchemaTab.tsx` — read-only display of the bound dataset's `testCaseSchema` (list of fields, no edit controls); shows "Edit on Dataset page" link button opening `/datasets/{datasetId}` in new tab; shows empty state when schema is empty
- [x] 6.2 Wire `SchemaTab` into `TabsContent.tsx` for the Schema tab (replaces the existing editable `SchemaManager` usage for TestSuites)

## 7. Unit Tests

- [x] 7.1 Write unit tests for `DatasetBinding` — create-private success flow, create-private failure shows toast, pick-public cancel keeps unbound state
- [x] 7.2 Write unit tests for `DatasetHeader` — renders dataset ID, visibility badge, correct action button label for PRIVATE vs PUBLIC, open-in-new-tab link href
- [x] 7.3 Write unit tests for `TestCasesList` disable/enable logic — toggling checkbox adds/removes from `disabledTestCaseIds` via onChange, disabled state initialized from suite

## 8. Quality

- [x] 8.1 Run `npm run lint` and fix all lint errors
- [x] 8.2 Run `npm run format:write` to apply formatting
- [x] 8.3 Run `npm run test` from `apps/ai-dial-admin/` and confirm all tests pass
