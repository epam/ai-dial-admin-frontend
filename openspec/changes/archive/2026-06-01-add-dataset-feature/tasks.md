## 1. Foundation — Models, API, and Routes

- [x] 1.1 Add `Dataset`, `DatasetVisibility`, and `DatasetTestCase` TypeScript interfaces to `src/models/evaluation/dataset.ts`
- [x] 1.2 Create `src/server/eval/datasets-api.ts` with `DatasetsApi` class: `getDatasets`, `getDataset`, `createDataset`, `updateDataset`, `removeDataset`, `transitionVisibility`, `getTestCases`, `createTestCase`, `updateTestCases`, `removeTestCase`, `removeMultipleTestCases`, `exportTestCasesCsv`, `importTestCasePreview`, `importTestCase`
- [x] 1.3 Add `Datasets = '/datasets'` to `ApplicationRoute` enum in `src/types/routes.ts`
- [x] 1.4 Create `src/app/[lang]/datasets/actions.ts` with server actions: `getDatasets`, `getDataset`, `createDataset`, `updateDataset`, `removeDataset`, `transitionVisibility`, `getTestCases`, `createTestCase`, `updateTestCases`, `removeTestCase`, `removeMultipleTestCases`, `exportTestCasesCsv`, `importTestCasePreview`, `importTestCase`
- [x] 1.5 Add `DatasetsI18nKey` enum to `src/constants/i18n.ts` with all user-facing string keys for the feature
- [x] 1.6 Add all i18n strings for `DatasetsI18nKey` to `src/locales/en.ts`

## 2. Navigation and Routing

- [x] 2.1 Add "Datasets" menu item to `src/components/Menu/menu-configuration.tsx` between Test Suites and Runs (under `evaluationEnabled` feature flag, `ApplicationRoute.Datasets`)
- [x] 2.2 Create `src/app/[lang]/datasets/page.tsx` — server component fetching PUBLIC datasets list (with `export const dynamic = 'force-dynamic'`)
- [x] 2.3 Create `src/app/[lang]/datasets/[id]/page.tsx` — server component fetching dataset by ID and etag, rendering `DatasetView`

## 3. Dataset Listing

- [x] 3.1 Add dataset list column definitions to `src/constants/grid-columns/grid-columns.tsx` (Name, Description, Updated At)
- [x] 3.2 Create `src/components/Datasets/Modals/Create/CreateDataset.tsx` — modal with Name (required) and Description fields, always creates PUBLIC
- [x] 3.3 Wire the datasets listing page to use `EvaluationListView` with dataset columns, `getDatasets` (PUBLIC filter), create modal, and delete confirmation

## 4. Dataset View — Shell

- [x] 4.1 Add `getDatasetTabs()` to `src/utils/tabs/utils.ts` returning tabs: Properties, Schema, Test Cases (using `EntityViewTab` entries)
- [x] 4.2 Create `src/components/Datasets/View/View.tsx` — client component managing `selectedDataset`, `isChanged`, `hasTestCaseChanges` ref, `etag`, `activeTab`; renders header with Save/Discard and visibility action button; handles save (PUT with If-Match, handles 200/202/412) and discard logic
- [x] 4.3 Create `src/components/Datasets/View/TabsContent.tsx` — renders Properties, Schema, or Test Cases based on `activeTab`
- [x] 4.4 Add "Make Private" / "Make Public" confirmation popups in `View.tsx` with user-friendly copy; call `transitionVisibility` action; handle 409 error with toast

## 5. Properties Tab

- [x] 5.1 Create `src/components/Datasets/Properties/Properties.tsx` — form with Display name (required, bound to `dataset.name`) and Description fields; changes call `onChangeDataset` prop to update parent state and set `isChanged`

## 6. Schema Tab

- [x] 6.1 Refactor `src/components/TestSuites/TestCaseSchema/SchemaManager.tsx` to accept `schema: TestCaseSchema[]` and `onChange: (schema: TestCaseSchema[]) => void` props directly (instead of receiving full `TestSuite`), keeping backward compatibility for the existing TestSuite modal usage
- [x] 6.2 Create `src/components/Datasets/Schema/SchemaTab.tsx` — renders `SchemaManager` with the dataset's `testCaseSchema`; propagates changes up to `View.tsx` to set `isChanged`

## 7. Test Cases Tab

- [x] 7.1 Create `src/components/Datasets/TestCases/Header.tsx` — header with Add Test Case, Import, and Export buttons (no schema modal button)
- [x] 7.2 Create `src/components/Datasets/TestCases/TestCasesList.tsx` — ag-grid with dynamic columns from `dataset.testCaseSchema` (no enabled column); dirty row tracking via `dirtyRowsRef`; exposes `getDirtyTestCases` and `clearDirtyAndRefresh` via forwarded ref; uses `isSkipRefresh` pattern for inline edits
- [x] 7.3 Create `src/components/Datasets/TestCases/TestCases.tsx` — container composing Header and TestCasesList; exposes ref implementing `TestCasesActions` interface for `View.tsx` to flush on Save
- [x] 7.4 Reuse the existing import flow components from `src/components/TestSuites/TestCases/Import/` (or create parallel `src/components/Datasets/TestCases/Import/`) wired to dataset import/preview actions
- [x] 7.5 Wire Export button to call `exportTestCasesCsv` action and trigger file download

## 8. Unit Tests

- [ ] 8.1 Write unit tests for `DatasetsApi` methods in `src/server/eval/datasets-api.spec.ts`
- [ ] 8.2 Write unit tests for `CreateDataset` modal — name required validation, submit calls action with `visibility: PUBLIC`
- [ ] 8.3 Write unit tests for `Properties` tab — dirty state on edit, discard reverts fields
- [ ] 8.4 Write unit tests for `SchemaTab` — add field, remove field, edit field triggers `isChanged`
- [ ] 8.5 Write unit tests for `TestCasesList` — columns generated from schema, no enabled column present, dirty tracking

## 9a. Additions

- [x] 9a.1 Add `MenuI18nKey.Datasets` to `PREVIEW_TAG_MENU_ITEMS` set in `src/components/Menu/MenuItem/MenuItemContent.tsx`
- [x] 9a.2 Write unit tests for `DatasetsApi` in `src/server/eval/tests/datasets-api.spec.ts`
- [x] 9a.3 Write unit tests for datasets server actions in `src/app/[lang]/datasets/actions.spec.ts`
- [x] 9a.4 Write unit tests for datasets utils in `src/components/Datasets/utils/tests/data.spec.ts`

## 9. Quality

- [x] 9.1 Run `npm run lint` and fix all lint errors
- [x] 9.2 Run `npm run format:write` to apply formatting
- [x] 9.3 Run `npm run test` from `apps/ai-dial-admin/` and confirm all tests pass
