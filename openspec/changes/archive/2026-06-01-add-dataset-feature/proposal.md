## Why

The evaluation framework needs a first-class Dataset entity that can be shared across multiple test suites and managed independently. The backend has introduced a new `/api/v1/datasets` API (feat/dataset branch) that moves test case ownership from test suites to datasets, enabling reuse and public/private visibility control. The frontend must expose this new entity to make the feature usable.

## What Changes

- **New route `/datasets`** — listing page showing only PUBLIC datasets, with Create/Delete actions
- **New route `/datasets/[id]`** — dataset detail view with three tabs: Properties, Schema, Test Cases
- **New menu item** — "Datasets" inserted between "Test Suites" and "Runs" in the Evaluation section
- **New API layer** — `DatasetsApi` class and server actions for all dataset and dataset-scoped test case operations
- **New TypeScript models** — `Dataset`, `DatasetVisibility`, `DatasetTestCase`
- **Visibility management** — PUBLIC datasets show a "Make Private" button; PRIVATE datasets show a "Make Public" button (PRIVATE datasets are not shown in the list but remain accessible via direct URL)
- **Schema tab** — full schema editor (add/remove/edit fields) as a dedicated tab, not a modal
- **Test Cases tab** — dataset-scoped test case management with CSV import/export; no enable/disable toggle (removed from the backend model)
- **Save/discard** — all changes across Properties, Schema, and Test Cases participate in the unified save/discard header pattern

## Capabilities

### New Capabilities

- `dataset-management`: CRUD operations for datasets — listing (PUBLIC only), creation (always PUBLIC), view/edit (name, description), deletion, and visibility transitions (PUBLIC ↔ PRIVATE)
- `dataset-schema`: Managing the test case schema owned by a dataset — add/remove/edit schema fields as a full tab; save triggers PUT with async revalidation (202) handling
- `dataset-test-cases`: Managing test cases scoped to a dataset — grid CRUD, CSV import/export (preview + commit), batch update; no enable/disable toggle

### Modified Capabilities

<!-- No existing spec-level requirements are changing in this iteration -->

## Impact

- `src/components/Menu/menu-configuration.tsx` — new menu item
- `src/types/routes.ts` — new `Datasets` route constant
- `src/utils/tabs/utils.ts` — new `getDatasetTabs()`
- `src/constants/i18n.ts` — new `DatasetsI18nKey` enum
- `src/constants/grid-columns/grid-columns.tsx` — dataset list columns
- New files: `src/models/evaluation/dataset.ts`, `src/server/eval/datasets-api.ts`, `src/app/[lang]/datasets/`, `src/components/Datasets/`
- Reuses existing: `EvaluationListView`, `SchemaManager` (from TestCaseSchema), import/export modal pattern from TestSuites
- No changes to existing Test Suites or Runs functionality in this iteration
