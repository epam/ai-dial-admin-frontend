## Context

The backend `feat/dataset` branch moves test case ownership from TestSuite to Dataset. Key structural changes:

- `TestSuite.testCaseSchema` **removed** — schema now belongs to Dataset.
- `TestCase.enabled` **removed** — replaced by `TestSuite.disabledTestCaseIds: string[]`.
- All test case CRUD/import/export endpoints moved from `/api/v1/test-suites/{id}/test-cases/*` to `/api/v1/datasets/{datasetId}/test-cases/*`.
- `bulkPatchTestCases` endpoint removed entirely.
- `TestSuite` gains `datasetId?: string` (nullable = "unbound") and `disabledTestCaseIds: string[]`.
- A PRIVATE dataset is permanently bound to exactly one suite (409 on rebind).
- Suite delete cascades to its bound PRIVATE dataset.

Current FE state: TestSuite view has Properties, Method, Schema, Test Cases, Runs, Metrics tabs. Test cases are loaded via `testSuitesApi.getTestCases(suiteId, ...)`. Enable/disable uses `bulkPatchTestCases`. The schema manager is on the TestSuite and editable.

## Goals / Non-Goals

**Goals:**
- Model the dataset binding lifecycle (unbound → private or public → bound).
- Redirect all test-case API calls to use `datasetsApi` with `datasetId`.
- Remove `enabled` from TestCase; compute `disabledTestCaseIds` from grid enable/disable actions.
- Show dataset header in Test Cases tab (ID, visibility, open link, visibility action, description).
- Make Test Cases tab read-only when the bound dataset is PUBLIC.
- Make Schema tab read-only (show linked dataset's schema with edit link).
- Remove `bulkPatchTestCases` from the save flow.

**Non-Goals:**
- Changing the Runs, Metrics, or Method tabs.
- Letting users rebind a PRIVATE dataset.
- Creating/editing datasets beyond the two binding actions (create-private, pick-public).

## Decisions

### D1: Where test-case actions live after the change

**Decision**: The TestSuites components will import test-case server actions directly from `@/src/app/[lang]/datasets/actions.ts` rather than going through `test-suites/actions.ts`.

**Rationale**: The actions already exist in `datasets/actions.ts` and are identical. Duplicating or re-exporting them via `test-suites/actions.ts` adds maintenance burden. Removing `getTestCases`, `createTestCase`, `updateTestCases`, `removeTestCase`, `removeMultipleTestCases`, `importTestCase`, `importTestCasePreview` from `test-suites/actions.ts` is cleaner — they no longer belong there.

**Alternative**: Keep proxies in `test-suites/actions.ts` that delegate to `datasetsApi`. Rejected: pure duplication, confusing for future devs.

---

### D2: How `disabledTestCaseIds` flows through the UI

**Decision**: Enable/disable changes in the test case grid call `onChange(testSuite)` with an updated `disabledTestCaseIds` list. This piggybacks on the existing suite change flow — the suite PUT body already includes the full suite object. No separate save step needed.

**Concrete flow**:
1. User toggles a checkbox in the grid.
2. `TestCasesList` computes the new `disabledTestCaseIds` by adding/removing the row's ID from the current list on `selectedTestSuite`.
3. Calls `onChange({ ...selectedTestSuite, disabledTestCaseIds: [...] })` — same as other suite field changes.
4. `isChanged` is set to true. On Save, `updateTestSuite` is called with the full updated suite object (which includes `disabledTestCaseIds`). No `bulkPatchTestCases` call.

**Alternative**: Track a separate dirty-enabled ref and apply at save time. Rejected: more complex, the current `dirtyEnabledRef` approach was only needed because `bulkPatchTestCases` was a separate API call. That API is gone.

---

### D3: Unbound state — hide tabs vs show empty state

**Decision**: When `testSuite.datasetId` is null, the Schema and Test Cases tabs are **hidden entirely**. The Test Cases tab area is replaced with the dataset binding UI (two buttons). This means the tab list returned by `getTestSuiteTabs()` changes dynamically based on `datasetId`.

**Rationale**: An unbound suite has no test cases and no schema. Showing empty tabs is confusing. The binding UI is contextually placed where the Test Cases tab would be — guiding the user to the action that unlocks it.

**Alternative**: Always show the tabs but render an empty state inside. Rejected: more surface area, tabs imply something is there.

**Implementation**: `TabsContent.tsx` already conditionally renders tabs. The simplest approach is to render the `DatasetBindingUI` component in place of Test Cases tab content when `datasetId` is null, and hide the Schema tab entry from the tab list.

---

### D4: Dataset Header placement

**Decision**: `DatasetHeader` is a top-section component inside the Test Cases tab (rendered before the test cases grid), not in the overall View header.

**Rationale**: The header is dataset-specific context for the test cases. Putting it in the main entity header would crowd the header and mix concerns. Mirrors how similar contextual info is placed in other tabs.

**Component structure**:
```
TestCases.tsx
  └── DatasetHeader.tsx          ← new: visibility badge, open link, action button, description
  └── Header.tsx                 ← existing: add/import/export buttons (read-only guarded)
  └── TestCasesList.tsx          ← existing: grid (read-only guarded)
```

---

### D5: Public dataset → read-only test cases

**Decision**: Pass an `isReadOnly` boolean prop down from `TestCases.tsx` → `Header.tsx` and `TestCasesList.tsx`. When `isReadOnly=true`: Header disables Add/Import buttons (or hides them), grid cells are not editable, and delete actions are hidden. Export remains available.

**Rationale**: Clean separation — the grid and header don't need to know about dataset visibility, just whether they're read-only.

---

### D6: Schema tab becomes read-only

**Decision**: The Schema tab in TestSuite view replaces the editable `SchemaManager` with a read-only display of the linked dataset's schema, plus a link to the dataset page to edit it. The `SchemaManager` with editing remains only on the Dataset page.

**Rationale**: Schema is now owned by the dataset. Editing it from the suite context would create confusing implicit changes to the dataset that could affect other suites sharing the same PUBLIC dataset.

---

### D7: Create-private dataset flow

**Decision**: "Create private dataset" button calls `createDataset({ id: \`DATASET_${suiteId}\`, visibility: 'PRIVATE' })` then immediately calls `updateTestSuite({ ...suite, datasetId: newDatasetId })`. On success, the page refreshes (router.refresh()) to reload the suite with its new `datasetId`. No modal shown.

**Risk**: If `createDataset` succeeds but `updateTestSuite` fails, the dataset exists orphaned. Mitigation: treat the combo as a single action; show an error toast on failure and let the user retry. The orphaned PRIVATE dataset will be cleaned up by the suite delete cascade.

---

### D8: Pick-public dataset flow

**Decision**: A selection modal lists all PUBLIC datasets (paginated, searchable, single-select). On confirm, `updateTestSuite({ ...suite, datasetId: selectedDatasetId })` is called and the page refreshes.

**Implementation**: Reuse the `EvaluationListView` pattern for the popup content, or a simpler single-column grid. The modal itself uses the existing `DialPopup` pattern.

---

### D9: Unbind from public dataset

**Decision**: "Unbind" button shows a confirmation popup. On confirm, `updateTestSuite({ ...suite, datasetId: null })` is called, returning the suite to unbound state.

**Note**: After unbind, the suite returns to "unbound" state — Schema and Test Cases tabs disappear again. This is intentional and clearly communicated in the confirmation copy.

---

## Risks / Trade-offs

- **Create-private atomicity**: [Risk: Dataset created but suite not updated] → Show error toast, let user retry; BE cascade deletes on suite delete handles any orphan.
- **Schema tab becomes passive**: [Risk: users confused about where to edit schema] → Read-only schema view shows explicit "Edit on Dataset page" link button.
- **Public dataset test cases read-only**: [Risk: users expect to add cases from suite] → Clear UI affordance (disabled buttons with tooltip "Test cases for public datasets can only be edited on the Dataset page").
- **`disabledTestCaseIds` on PUT**: [Risk: list gets out of sync if test cases are deleted] → BE owns authoritative state; on next refresh the list is re-fetched from BE.
- **Import after schema change**: [Risk: import no longer triggers schema comparison on suite] → `onApplyImport` simplification: remove the schema-diff check (it now references `testCaseSchema` on the suite, which is removed). After import, just call `refreshGrid()`.
