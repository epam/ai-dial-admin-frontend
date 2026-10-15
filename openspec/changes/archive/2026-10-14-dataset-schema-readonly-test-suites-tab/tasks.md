## 1. Query scope and server actions

- [x] 1.1 In `components/ListView/Evaluation/utils/constants.ts`, add `datasetId: 'dataset_id'` to `TEST_SUITE_COLUMN_TO_DSL_FIELD`; add `TEST_SUITE_DATASET_FILTER(datasetId)` (a `FilterDto`, EQUALS) beside it. Verify `buildTestSuitesQuery` with that filter emits a `string`-typed `eq` on `dataset_id` and that the no-filter output is unchanged.
- [x] 1.2 In `app/[lang]/datasets/actions.ts`, add `getDatasetTestSuitesPage(datasetId, page, size, sorts, filters)`: authenticates with `getUserToken`, prepends `TEST_SUITE_DATASET_FILTER`, runs `buildTestSuitesQuery` through `structuredQueryApi.execute`, returns `mapTestSuitesQueryResult`. Verify `npm run typecheck` is clean.
- [x] 1.3 In `app/[lang]/datasets/[id]/page.tsx`, for a PUBLIC dataset call `getDatasetTestSuitesPage(id, 0, 1, [], [])`, derive `isSchemaReadOnly = rows > 0`, catch and `errorObjLog` a failure (fail open), skip the call for PRIVATE, and pass `isSchemaReadOnly` to `DatasetView`. Verify the page passes `false` on a null result.

## 2. Read-only schema

- [x] 2.1 Add an `isReadOnly` option (default false) to `getSchemaFieldGridColumns` (`components/TestSuites/utils/columns.tsx`) passing `isReadonly` to the Name, Type, Required, Scope and Description renderers, and to `SchemaManager` (`components/TestSuites/TestCaseSchema/SchemaManager.tsx`): disable Add field and omit the remove action column. Verify the test-suite schema modal still renders every control enabled.
- [x] 2.2 Add `isReadOnly` to `components/Datasets/Schema/SchemaTab.tsx`; when set, render the warning (`DialNotification`, warning variant, title and message) above the grid and pass it to `SchemaManager`. Add the `DatasetsI18nKey` entries and `locales/en.ts` strings — no "more than one", no link. Verify the warning text matches the "at least one" condition.
- [x] 2.3 Add `isEditorDisabled` to `JsonConfiguration` (`components/EntityHeaderControls/models.ts`) and forward it to the JSON Editor toggle in `SimpleButtonsWrapper`; in `components/Datasets/View/View.tsx` accept `isSchemaReadOnly`, set `isEditorDisabled` from it, and pass `isReadOnly` down through `TabsContent.tsx`. Verify the toggle is disabled on every tab when read-only and enabled otherwise.

## 3. Test Suites tab

- [x] 3.1 Add `EntityViewTab.TestSuites` and `TabsI18nKey.TestSuites` (+ `en.ts`), add the tab to `getDatasetTabs` in `utils/tabs/utils.ts` as the fourth tab. Verify the dataset page shows four tabs in order.
- [x] 3.2 Export `DATASET_TEST_SUITES_COLUMN` from `constants/grid-columns/grid-columns.tsx`, derived from `TEST_SUITES_COLUMN` minus the hidden `method`/`url` columns. Verify it has the eight visible columns and keeps `createdAt` sorted descending.
- [x] 3.3 Create `components/Datasets/TestSuites/TestSuites.tsx` modelled on `TestSuites/Runs/Runs.tsx`: infinite-row `GridView` over `getDatasetTestSuitesPage`, a datasource memoised on `gridApi` and dataset id and set once, no first-page cache and no separate fetch effect, row click and the only action-menu entry (`getOpenInNewTabOperation`) calling `onOpenInNewTab(ApplicationRoute.TestSuites, row)`, the actions column excluded from row click, `storageKey` `${ApplicationRoute.Datasets}/test-suites`, the description line and empty-state title (+ `en.ts`). Verify a mounted tab issues one `getDatasetTestSuitesPage` call.
- [x] 3.4 Render it from `DatasetTabsContent` for `EntityViewTab.TestSuites`, passing the dataset id. Verify visiting the tab does not change the dirty flags.

## 4. Tests

- [x] 4.1 Unit tests (`ListView/Evaluation/utils/tests/`): `datasetId` filter → `dataset_id` string-typed `eq`, combines with grid filters via `and`, main-list output unchanged.
- [x] 4.2 Component tests: `SchemaManager` (`TestCaseSchema/tests/`) read-only disables Add field, drops the remove column, passes `isReadonly` to the renderers, and stays editable by default; `SchemaTab.spec` shows the warning only when `isReadOnly`.
- [x] 4.3 Component tests: `DatasetView` (`Datasets/View/tests/`) disables the JSON Editor toggle when `isSchemaReadOnly`, enables it otherwise, for PRIVATE and unbound PUBLIC datasets, and renders four tabs.
- [x] 4.4 Component tests: `Datasets/TestSuites/tests/TestSuites.spec.tsx` covers one list request on mount, scope passed to the action, row click and menu "Open in new tab" calling `window.open('/test-suites/{id}', '_blank')`, the action cell not opening a tab, the menu holding only that option, and the empty state.
- [x] 4.5 Page-level test for `datasets/[id]/page.tsx` (or the extracted helper): probe runs for PUBLIC only, rows → read-only, none → editable, and a thrown error → editable.
- [x] 4.6 `npm run typecheck:specs` stays at zero after the new and updated specs.

## 5. Spec housekeeping and final quality checks

- [x] 5.1 `openspec/specs/dataset-management/spec.md` has no `## Purpose` / `## Requirements` headers, so `openspec validate` reports its requirements as invisible and archive refuses the delta. Add both headers (Purpose: the dataset list and detail view lifecycle) without changing any requirement text. Verify `openspec validate dataset-schema-readonly-test-suites-tab --strict` prints no archive-refusal INFO.
- [x] 5.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test`, and fix every failure.

<!-- No browser-verification task: the user was asked and chose to skip it; the browser-observable scenarios are covered by the component tests in section 4. -->
