## Why

The backend `feat/dataset` branch promotes the Dataset entity to be the sole owner of test cases and their schema. TestSuite no longer owns test cases directly — it instead references a Dataset by ID. This requires the TestSuite UI to model a new "dataset binding" lifecycle and adapt all test-case-related flows to go through the dataset.

## What Changes

- **Dataset binding UX on TestSuite**: An unbound suite (no `datasetId`) shows two action buttons — "Pick public dataset" and "Create private dataset" — instead of the full Test Cases and Schema tabs. Dynamic Configuration and Test Cases tabs are hidden until a dataset is bound.
- **Create private dataset flow**: clicking "Create private dataset" auto-creates a PRIVATE dataset with `id = DATASET_{suiteId}` and immediately binds the suite to it. No modal required.
- **Pick public dataset flow**: opens a selection popup listing all PUBLIC datasets; user picks one. After binding, the suite shows an "Unbind" button (instead of "Make Public") to detach the public dataset from the suite.
- **Dataset header section** on the Test Cases tab: shows the bound dataset's ID, visibility badge (PUBLIC/PRIVATE), "Open in new tab" link, a visibility action button, and a contextual description:
  - PRIVATE: "Private dataset is permanently bound to this test suite"
  - PUBLIC: "Public dataset — test cases are read-only from this suite"
  - Unbound: never shown (tabs hidden instead)
- **Test Cases tab is read-only for PUBLIC datasets**: add/edit/delete/import actions are disabled; export remains available.
- **Test Cases tab is editable for PRIVATE datasets**: same as today's full edit mode.
- **`disabledTestCaseIds` replaces `TestCase.enabled`**: enable/disable state is now a list of IDs on the TestSuite. The grid checkbox column remains, but changes update `TestSuite.disabledTestCaseIds` and are saved via the suite PUT (not a separate bulk-patch call). **BREAKING**
- **`TestSuite.testCaseSchema` removed**: the Schema tab shows the bound Dataset's `testCaseSchema` as read-only with a link to edit it on the Dataset page. **BREAKING**
- **Test case API endpoints moved to dataset-routed paths**: all CRUD, import/preview, and export calls switch from `testSuitesApi` to `datasetsApi` using `datasetId` as the parent key. **BREAKING**
- **`bulkPatchTestCases` removed**: the API endpoint no longer exists; its UI action is removed entirely.
- **`TestCase.enabled` field removed** from the FE TypeScript model along with `TestCaseBulkSelectorDto`, `TestCaseBulkOperationDto`, `TestCaseBulkPatchRequest`. **BREAKING**

### Non-goals
- Changing the Runs tab or Metrics tab.
- Creating/editing datasets from the TestSuite page beyond the two binding actions.
- Supporting multiple datasets per suite.
- Surfacing a "rebind" action for PRIVATE datasets (409 `PRIVATE_DATASET_REBIND_FORBIDDEN` is handled as an error toast only).

## Capabilities

### New Capabilities
- `test-suite-dataset-binding`: The full dataset binding lifecycle — unbound state, create-private flow, pick-public flow, unbind action, dataset header section, visibility toggle, read-only vs editable test cases.

### Modified Capabilities
- `test-cases-bulk-enabled-patch`: **Replaced** — `bulkPatchTestCases` is removed; enable/disable is now stored as `TestSuite.disabledTestCaseIds` saved in the suite PUT.
- `testcase-schema-manager`: The Schema tab in TestSuite becomes read-only (linked dataset's schema); the editable schema manager remains only on the Dataset page.

## Impact

- `src/models/evaluation/test-suite.ts`: remove `TestCase.enabled`, remove `TestSuite.testCaseSchema`, add `TestSuite.datasetId`, add `TestSuite.disabledTestCaseIds`, remove bulk-patch DTOs.
- `src/app/[lang]/test-suites/actions.ts`: remove `bulkPatchTestCases`; redirect all test-case actions to `datasetsApi` (or import from `datasets/actions.ts`).
- `src/components/TestSuites/View/View.tsx`: remove `bulkPatchTestCases` from save flow; remove `getEnabledOnlyChanges`; wire `disabledTestCaseIds` through suite PUT.
- `src/components/TestSuites/View/TabsContent.tsx`: hide Schema and TestCases tabs for unbound suites; pass dataset binding context.
- `src/components/TestSuites/TestCases/`: new `DatasetHeader.tsx` component; `TestCasesList.tsx` loses `enabled` column, `dirtyEnabledRef`, and `onCellValueChanged`; read-only mode for PUBLIC.
- `src/components/TestSuites/TestCases/Header.tsx`: remove schema modal button; add read-only guard for PUBLIC dataset.
- `src/constants/grid-columns/grid-columns.tsx`: remove `enabled` column from TestSuite test case columns.
- `src/constants/i18n.ts` + `src/locales/en.ts`: new i18n keys for dataset binding section.
- Existing `datasets/actions.ts` and `DatasetsApi`: no changes needed; TestSuite components will import from these directly.
