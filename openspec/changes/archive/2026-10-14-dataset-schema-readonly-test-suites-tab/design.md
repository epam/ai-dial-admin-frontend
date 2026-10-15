## Context

See proposal.md — Why. Today the dataset page (`components/Datasets/View/View.tsx`) renders Properties, Schema and Test Cases; the Schema tab wraps `SchemaManager`, which is also used by the test-suite schema modal. All the schema grid's cell renderers (`EditableCellRenderer`, `SelectCellRenderer`, `BooleanButtonCellRenderer`) already take `isReadonly`, and the Test Cases tab already threads an `isReadOnly` option through its column factory, so read-only rendering is an established shape.

The test suites list is already served by the unified query API: `buildTestSuitesQuery` / `mapTestSuitesQueryResult` (`ListView/Evaluation/utils/test-suites-query.ts`), executed by `structuredQueryApi` in `getTestSuites`. The Runs tab of a test suite is the sibling for an entity list inside a tab: infinite row model over `GridView`, a fixed scope filter prepended to the grid's own filters (`RUN_FILTER`), row click opening a new tab, and an `ACTION_COLUMN` with `getOpenInNewTabOperation`. A REST `GET /datasets/{id}/test-suites` also exists (`getDatasetTestSuites`), used by the delete modal and run compare; it is unpaged and unfiltered.

## Goals / Non-Goals

**Goals:**
- Lock the schema when it cannot be changed, before the user can edit it, using one cheap request.
- Reuse the test-suites query builder and column definitions rather than a parallel pair.
- Opening the Test Suites tab costs exactly one list request.

**Non-Goals:**
- Replacing `getDatasetTestSuites` for its other callers.
- Live updates of the lock when another session binds a suite.

## Decisions

### D1. The read-only flag is computed on the server, per page load, with a size-1 probe

`datasets/[id]/page.tsx` already awaits the dataset. For a PUBLIC dataset it additionally runs the `test_suites` query filtered by `dataset_id = <id>` with `page = offset 0, size 1` and treats a non-empty result as "bound". The result is passed to `DatasetView` as a boolean (`isSchemaReadOnly`, true only when PUBLIC and bound). A PRIVATE dataset skips the probe — its lock is always false, so it costs nothing there.

Alternatives considered:
- *Prefetch the first page and seed the tab (the Runs-tab approach).* Rejected by the decision to keep "opening the tab sends a single request" literally true; it would make tab-open free but the lock would depend on a full page fetch.
- *Probe from the Schema tab on mount.* Rejected: the Schema tab would render editable first, then lock, and the JSON Editor toggle (in the header, not the tab) would need the answer too.
- *Reuse `getDatasetTestSuites` (REST).* Rejected: it returns every suite unpaged and is not the unified query the issue asks for.

**Failure mode:** if the probe throws or returns null, the schema stays editable (fail open) and the error is logged with `errorObjLog`, like the page's other fetches. The backend 409 remains the authority, and its existing toast path still applies. Failing closed would lock every dataset whenever the query service hiccups.

### D2. Scope the test suites query with a `datasetId` filter column

The Runs tab prepends `RUN_FILTER(suiteId)`, a `FilterDto` whose column maps to a DSL field. The same here: add `datasetId: 'dataset_id'` to `TEST_SUITE_COLUMN_TO_DSL_FIELD` and export a `TEST_SUITE_DATASET_FILTER(datasetId)` helper that builds the `FilterDto`, next to `RUN_FILTER`. `valueTypeForField` already defaults to `string`, which is correct: private dataset ids are `DATASET_{suiteId}`, not UUIDs, so `dataset_id` must not be typed `uuid`. No grid column has colId `datasetId`, so the main list is unaffected.

A server action `getDatasetTestSuitesPage(datasetId, page, size, sorts, filters)` in `datasets/actions.ts` prepends the scope filter and delegates to the existing builder/mapper/`structuredQueryApi`. The probe is the same action with `size = 1`. The scope filter is added server-side so a client cannot widen it by passing filters.

### D3. A `DatasetTestSuites` tab component modelled on the Runs tab, minus its extras

New `components/Datasets/TestSuites/TestSuites.tsx`: `GridView` with `infiniteGridOptions`, columns `DATASET_TEST_SUITES_COLUMN` derived from `TEST_SUITES_COLUMN` by dropping the hidden `method`/`url` columns, so the visible set and filters are the list page's by construction. Default sort `createdAt desc` comes along on the column definition.

Request budget: the datasource `getRows` is memoised on `gridApi` and the dataset id only, set once when the grid is ready, and calls the server action directly. The Runs tab's first-page cache and its separate `useEffect` fetch are deliberately not copied — that pair is what would produce a second request here. Sort, filter and scroll still call `getRows`, as they should.

Row click and the action menu both call `onOpenInNewTab(ApplicationRoute.TestSuites, data)` (`window.open(url, '_blank')`), skipping the actions column the way the Runs tab's `onCellClicked` does. `ACTION_COLUMN([getOpenInNewTabOperation(...)], true)` is the only menu entry. Run/duplicate/delete live on the full list and are out of scope. A `storageKey` of `${ApplicationRoute.Datasets}/test-suites` keeps column state separate from the main list.

### D4. Read-only mode in `SchemaManager` is an opt-in prop

`SchemaManager` and `getSchemaFieldGridColumns` gain `isReadOnly` (default false). When set: the Name/Type/Required/Scope renderers receive `isReadonly`, the Add field button is `disabled`, and the remove action column is left out of `columnDefs`. The Description column becomes read-only the same way. The test-suite modal does not pass it, so it is unchanged.

`DatasetSchemaTab` takes `isReadOnly` and renders a warning above the grid — `DialNotification` with the warning variant, a title ("Schema is read-only") and the message ("This schema cannot be modified because test suites use this dataset. Changing fields could break test cases in those suites."). Wording avoids "more than one" and has no link, per the proposal. New keys live under `DatasetsI18nKey` and `locales/en.ts`. The notification is static text, not a status change, so it needs no live region (`a11y.md`); the disabled controls carry their state through the native `disabled` attribute.

The validation dispatch in `DatasetSchemaTab` stays; a read-only schema is unchanged and so cannot become invalid or dirty.

### D5. The JSON Editor toggle is disabled for the whole page

`JsonConfiguration` gains an optional `isEditorDisabled`; `SimpleButtonsWrapper` forwards it to the toggle. `DatasetView` sets it from `isSchemaReadOnly`. This is deliberately page-wide, not Schema-tab-only: the toggle is in the header on every tab, and switching to JSON from Properties would let the user edit `testCaseSchema` and bypass the lock.

**Trade-off:** name and description of such a dataset can no longer be edited through JSON, only on Properties. Accepted; the alternative of a per-field locked JSON editor is much heavier for no real user gain.

### D6. Tab wiring

`EntityViewTab.TestSuites` and `TabsI18nKey.TestSuites` are added, `getDatasetTabs` returns `[properties, schema, testCases, testSuites]`, and `DatasetTabsContent` renders the new component for that tab. The tab holds no editable state and does not touch the dirty flags; `DatasetTabsContent` is keyed by `discardKey` so Discard remounts it, which only re-requests the list.

## Risks / Trade-offs

- [The lock is a snapshot of page-load time; a suite bound in another session leaves the schema editable] → the backend's 409 and its toast remain the fallback; `router.refresh()` after a save re-runs the probe.
- [Probe fails open, so an outage briefly allows a doomed edit] → same fallback; preferred over locking everything on a transient error.
- [An extra request per PUBLIC dataset page load] → size 1 and no total count, so it is a single indexed lookup; skipped for PRIVATE datasets.
- [`DialNotification` may not take a title] → if it does not, fall back to a bolded first line inside the message; settled during implementation and covered by the component test.
- [Adding `datasetId` to the shared column→field map] → no list grid declares that colId, so no existing request changes; a unit test pins the mapping and that the main list's output is unchanged.

## Open Questions

None that change specs or tasks.
