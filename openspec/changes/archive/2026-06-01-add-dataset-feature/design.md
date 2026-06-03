## Context

The backend has introduced a Dataset entity (`feat/dataset` branch) at `/api/v1/datasets`. Datasets own test case schemas and test cases (previously owned by TestSuites). Datasets have a `visibility` field (PUBLIC | PRIVATE): PUBLIC datasets are shared and appear in listing; PRIVATE datasets are bound to exactly one test suite and are not shown in the listing but remain accessible by URL.

The FE evaluation section currently has Test Suites and Runs. Dataset is a new peer entity following the same component patterns.

Key backend behaviors that influence the design:
- `PUT /api/v1/datasets/{id}` returns **202** (async) when schema changes, **200** when only name/description change
- `PATCH /api/v1/datasets/{id}/visibility` for PUBLIC→PRIVATE requires exactly 1 bound test suite; returns 409 otherwise
- Test cases have no `enabled` field — enable/disable concept lives on TestSuite's `disabledTestCaseIds`, not on the dataset
- `PUT /api/v1/datasets/{id}` requires `If-Match` header (optimistic locking via `version` field)

## Goals / Non-Goals

**Goals:**
- Expose the full Dataset lifecycle (list, create, view, edit, delete, visibility transitions)
- Schema management as a first-class tab (not a modal)
- Dataset-scoped test case management with import/export
- Unified save/discard UX consistent with TestSuite view
- Graceful handling of the 202 async revalidation response

**Non-Goals:**
- Changes to existing TestSuite or Runs functionality (iteration 2)
- Binding/unbinding datasets to test suites from the FE (managed by BE automatically)
- File upload for test cases (FILE-type schema fields out of scope)
- Revalidation task polling UI (202 will show a notification; no dedicated task progress view)

## Decisions

### 1. Reuse `EvaluationListView` for the dataset listing

**Decision:** Use the existing `EvaluationListView` (from `src/components/ListView/Evaluation/`) as the container for the dataset listing page, passing dataset-specific columns, getData, and CRUD handlers.

**Rationale:** This component already handles infinite scroll, create/delete modals, sorting and filtering, and the evaluation-specific grid layout. Creating a parallel component would be duplication.

**Alternative considered:** Custom list component — rejected as it provides no additional value.

### 2. Promote `SchemaManager` from modal to tab

**Decision:** The `SchemaManager` component (currently used inside `TestCasesSchemaModal`) will be rendered directly in the Schema tab with no modal wrapper. Schema changes mark the dataset as dirty and are persisted on Save (same as Properties changes).

**Rationale:** The schema is a first-class dataset attribute, not an auxiliary modal operation. Keeping it as a full tab allows users to view and edit the schema while the test cases grid is visible in the tab bar context.

**Alternative considered:** Keep modal pattern, trigger from Schema tab header — rejected because it adds unnecessary indirection for a primary dataset concern.

### 3. Single unified save/discard across all tabs

**Decision:** `View.tsx` holds a `selectedDataset` state (local copy), `isChanged` flag (Properties + Schema changes), and a `testCasesActionsRef` (ref to batch-flush dirty test case rows). The header Save button:
1. If `isChanged`: calls `PUT /api/v1/datasets/{id}` with `If-Match: <version>`
   - On 200: updates etag, clears dirty state
   - On 202: shows "Schema revalidating..." toast, refreshes test cases grid when user next visits
2. If `hasTestCaseChanges`: flushes dirty rows via `PUT /api/v1/datasets/{id}/test-cases` (batch)

**Rationale:** Consistent with TestSuite View pattern. The ref-based test case flushing avoids prop-drilling the save trigger deep into the grid.

### 4. Visibility transition UX

**Decision:**
- PUBLIC dataset: "Make Private" button in the header (alongside Save/Discard)
- PRIVATE dataset: "Make Public" button in the header
- Both show a confirmation popup before calling `PATCH /api/v1/datasets/{id}/visibility`
- On 409 `PRIVATE_TRANSITION_INVALID_BINDING_COUNT`: show an error toast with the reason
- PRIVATE datasets are not shown in the `/datasets` listing but are fully accessible at `/datasets/{id}`

**Rationale:** The transition is a significant, largely irreversible action (PUBLIC→PRIVATE restricts access). A confirmation popup is appropriate. The 409 case must be user-facing since the FE cannot pre-check binding count without an additional API call.

### 5. Dataset listing shows only PUBLIC datasets

**Decision:** The listing page passes a `visibility=PUBLIC` filter to `GET /api/v1/datasets`. No visibility toggle or filter on the listing page.

**Rationale:** PRIVATE datasets belong to a specific test suite and are managed in that context. Showing them in the global list creates confusion about ownership.

### 6. Create dataset always creates PUBLIC

**Decision:** The Create Dataset modal collects only `name` and `description`. The POST body always sends `visibility: PUBLIC`.

**Rationale:** PRIVATE datasets are created by the backend when a test suite binds to one. The FE create flow is for shared/reusable datasets only. Exposing the visibility choice in create would require also exposing `bindToSuiteId`, which is out of scope.

### 7. Test cases grid: no enabled column, no schema modal

**Decision:** The dataset test cases grid omits the `enabled` checkbox column (field does not exist in the backend model). The schema edit button in the TestCases header is removed; schema is managed in the Schema tab.

**Rationale:** Clean separation — Schema tab owns schema, TestCases tab owns data rows.

## Risks / Trade-offs

- **202 async revalidation** → The FE shows a toast but does not poll for completion. Test cases may show stale validation state until the user refreshes. Mitigation: toast message explicitly tells the user to refresh after a moment.
- **Optimistic locking (If-Match)** → If the dataset is updated in another tab, the PUT will return 412. The FE must handle this with a "Dataset was modified elsewhere — please reload" error. Same pattern as TestSuite.
- **PRIVATE datasets in URL** → Users can bookmark or share PRIVATE dataset URLs. This is intentional — the route is accessible, just not discoverable from the menu listing.
- **SchemaManager reuse** → `SchemaManager` currently receives the full `TestSuite` as a prop and reads `suite.testCaseSchema`. It will need to accept a `schema: TestCaseSchema[]` prop directly (or a Dataset) to work in the Dataset context without coupling to TestSuite. This is a minor refactor, low risk.
