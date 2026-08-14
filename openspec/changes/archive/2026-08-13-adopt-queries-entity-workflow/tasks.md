Groups 1–2 are PR 1, group 3 is PR 2, groups 4–6 are PR 3, groups 7–9 are PR 4. Each PR leaves the app
working; only PR 4 is user-visible as a removal.

No `spec-browser-verify` task is included — the user declined one for this change. Coverage therefore
rests entirely on the unit and component tests in groups 2, 6, and 9, which is why group 2's absence
assertions are called out individually rather than left to the implementer's judgement.

## 1. Saved query persistence layer

- [x] 1.1 Add `src/models/analytics/saved-query.ts`: `SavedQuery` (response) and `SavedQueryRequest` (the nine accepted write members) as **independent** interfaces — not `Pick`/`Omit` of each other, per design D3 — plus `SavedQueryTime` (relative/absolute union), `SavedQueryChart`, `SavedQueryListResponse`, and enums `SavedQueryScope`, `SavedQueryTimeMode`, `SavedQueryEditor`, `SavedQueryErrorCode`. Declare every optional response member optional, never nullable.
- [x] 1.2 Add `src/constants/analytics/queries.ts` for const values only (default result view, default scope, the list's storage key). Keep types out of it, per `code-standards.md`.
- [x] 1.3 Extend `src/server/analytics/analytics-data-api.ts` with the `/v1/saved-queries` URL constants and five methods (design D1): `listSavedQueries(scope, token)` and `getSavedQuery(id, token)` via `get`, unwrapping `{ saved_queries }` on the list; `createSavedQuery` / `updateSavedQuery` / `deleteSavedQuery` via `postAction` / `putAction` / `deleteAction`. No `If-Match` header. URL-encode the `{id}` segment.
- [x] 1.4 Create `src/app/[lang]/queries/actions.ts` (`'use server'`) with `listSavedQueries`, `getSavedQuery`, `createSavedQuery`, `updateSavedQuery`, `deleteSavedQuery` — thin pass-throughs acquiring the token with the repo's standard one-liner, no try/catch and no error mapping.
- [x] 1.5 Add `src/server/analytics/tests/analytics-data-api.spec.ts` cases for the five new methods: correct path per method, `scope` passed as a query parameter, `{ saved_queries }` unwrapped to a bare array, and no `If-Match` sent on the replace.
- [x] 1.6 Add `src/app/[lang]/queries/tests/actions.spec.ts` asserting each action calls its API method with `(args, TOKEN_MOCK)`, mirroring `datasets/actions.spec.ts`.

## 2. Capture and restore mapping (pure, no UI)

- [x] 2.1 Add `src/components/Analytics/QueryBuilder/utils/saved-query.ts` with `toSavedQueryRequest(input)` building the payload in one fixed key order (design D4 depends on stable stringification), trimming name/description/tag and omitting them when blank, and emitting `chart` only for the chart result view.
- [x] 2.2 In the same file, implement the exactly-one-body rule: non-blank SQL text ⇒ send `sql` and omit `query`; otherwise send `query` and omit `sql`. A blank SQL buffer alongside a structured body is one body, not two.
- [x] 2.3 In the same file, implement time intent: no captured range ⇒ omit `time`; a preset ⇒ `{ mode: relative, period: <token> }` with the token unresolved; a custom range ⇒ `{ mode: absolute, from, to }`, ordered when inverted.
- [x] 2.4 In the same file, implement `toBuilderRestore(input)`: `parseQuery` when the body is structured, else an initial state seeded with the stored source; pretty-printed JSON text; the target view derived per design D8; `result_view` defaulting to table when absent; chart config only when the stored query has one.
- [x] 2.5 In the same file, implement the time-restore branch: a recognised relative token selects that period, an absolute pair selects that custom range, an unrecognised token or an unparseable instant leaves the toolbar alone without failing the load.
- [x] 2.6 Add `src/components/Analytics/QueryBuilder/utils/saved-query-error.ts` resolving the machine code off `errorHeader` (guarding against `BaseApi.getError()`'s generic substitution), falling back to the status only for the forbidden and not-found cases, and mapping each code to a guidance i18n key plus whether the service's own message is shown (design D12).
- [x] 2.7 Add `utils/tests/saved-query.spec.ts` covering: **no server-assigned member ever appears in the payload**; exactly one body in all three authoring views; a blank `sql` alongside a structured body yields one body; a relative token survives capture unresolved; an absolute pair is emitted; an inverted absolute pair is ordered; `time` omitted when nothing was captured.
- [x] 2.8 Add to the same spec the **absence assertion for design D5**: given a state with a time range selected and a schema carrying a temporal field, the captured `query.filter` contains no `ge`/`le` predicate on the timestamp field. This is the one failure mode that reproduces only on a later day and cannot be caught anywhere else.
- [x] 2.9 Add restore cases to the same spec: a representable structured body ⇒ Builder view with state reflecting it; an unrepresentable one ⇒ JSON view with the body intact; a SQL body ⇒ SQL view with the stored text; absent `result_view` ⇒ table; an unrecognised relative token ⇒ toolbar untouched and the load still succeeds.
- [x] 2.10 Add `utils/tests/saved-query-error.spec.ts` covering each recognised code's guidance key, which codes surface the service's message and which do not, the status-only fallbacks, and the generic-substitution guard.

## 3. Lift result view and chart config into the orchestrator

- [x] 3.1 Make `Result/ResultArea.tsx` controlled: accept `view` / `onChangeView` / `chartConfig` / `onChangeChartConfig` and remove the corresponding local state.
- [x] 3.2 Move that state into `QueryBuilder.tsx`, keeping the reset-on-new-result effect but guarding it with a one-shot ref so a restored chart configuration survives the page's first run and the ordinary reset resumes afterwards (design D6).
- [x] 3.3 Update `Result/tests/ResultArea.spec.tsx` for the controlled props, and add a `QueryBuilder.spec.tsx` case asserting the reset still fires on a second run.

## 4. Queries list page

- [x] 4.1 Add `AnalyticsQueries = '/queries'` to `ApplicationRoute` in `src/types/routes.ts`.
- [x] 4.2 Add `QUERIES_COLUMN` to `src/constants/grid-columns/grid-columns.tsx`: name, description, source, tag, scope, editor (derived per design D8), saved-by (tolerating an absent value), created-at and updated-at. Reuse `base-columns.ts`, `filters.ts`, and `configs.ts`; give every column a real `headerName`.
- [x] 4.3 Add `src/components/Analytics/Queries/List/QueriesList.tsx` composing `ListView` with `data`, `QUERIES_COLUMN`, `storageKey`, `getHref`, and `onCellClicked` for row navigation (design D7).
- [x] 4.4 Append `ACTION_COLUMN` to the column defs with `getOpenInNewTabOperation`, `getEditOperation`, and `getDeleteOperation`, hiding Delete and Edit when the caller may not write the row's scope (design D15). Put the `aria-label` on the cell's control, not only the header.
- [x] 4.5 Add `src/app/[lang]/queries/page.tsx`: `force-dynamic`, the `isAnalyticsForbidden()` → `Page403` gate, both scopes fetched with `Promise.all` and merged, `errorObjLog` on failure, rendering `QueriesList` inside `SaveValidationContextProvider`.
- [x] 4.6 Register the route in `components/ListView/constants.ts` (`listViewTitleMap`, `emptyDataTitleMap`), `components/Breadcrumbs/constants.ts` (**required** — a missing entry yields no breadcrumbs at all), and `utils/open-in-new-tab.ts`'s `getEntityPath` with an id-returning arm.
- [x] 4.7 Register the create/update/delete copy in `utils/entities/create-entity.ts`, `utils/entities/update-entity.ts`, and `components/EntityView/Modals/Delete/utils.ts` (`deleteEntityMap` — a missing entry leaves the delete modal's title blank).
- [x] 4.8 Add the i18n keys: a `QueriesI18nKey` namespace in `src/constants/i18n.ts` plus `MenuI18nKey.Queries`, `EntitiesI18nKey.NoQueries`, and the create/update/delete members, with English strings in `src/locales/en.ts`.

## 5. Create, edit, and delete

- [x] 5.1 Add `src/components/Analytics/Queries/Properties/QueryProperties.tsx` — name (`DisplayNameControl`, required, registering with `SaveValidationContext`), description, tag, and scope shown only when `useAppContext().isFullAdmin`. One component for both modals, per design D11.
- [x] 5.2 Add `src/components/Analytics/Queries/Modals/CreateQuery.tsx` on `DialFormPopup`, modelled on `components/Datasets/Modals/Create/CreateDataset.tsx`, submit disabled while the name is blank.
- [x] 5.3 Wire the create submit to build a minimal executable body — `buildQuery` over an initial state for the default source in row mode, with no time bound — plus `result_view: table` and no `scope` (design D9).
- [x] 5.4 On create success show a success notification and `router.push` to `/queries/<id>`; on failure show an error notification carrying the service's message and request id, leaving the modal open with its values.
- [x] 5.5 Add `src/components/Analytics/Queries/Modals/EditQuery.tsx` reusing `QueryProperties`, seeded from the row, replacing the query with its body unchanged. Reachable from the grid's Edit action.
- [x] 5.6 Wire Delete to the shared `DeleteConfirmationModal` and refresh the grid on success.
- [x] 5.7 Add the Create button to the list header via `ListView`'s `children` slot.

## 6. Tests for the list, create, edit, and delete

- [x] 6.1 Add `QueriesList.spec.tsx`: both scopes rendered in one grid, the derived editor column's three outcomes, row activation navigating to the query, the three row actions offered, Edit and Delete hidden for a common row when the caller is not a full admin, and the empty state.
- [x] 6.2 Add `CreateQuery.spec.tsx`: submit disabled on a blank name; a name-only submit sends that name plus a row-mode structured body naming the default source; no source or scope field is rendered; success navigates and notifies; failure keeps the modal open.
- [x] 6.3 Add `EditQuery.spec.tsx`: a name-only change sends the unchanged body with the new name; no scope field for a non-admin.
- [x] 6.4 Query by role and accessible name only; the mocked `t()` returns the key, so assert keys. Add any new mocks to `apps/ai-dial-admin/test-setup.tsx`, not inline in a spec.

## 7. The query page

- [x] 7.1 Add `src/app/[lang]/queries/[id]/page.tsx`: `force-dynamic`, the `isAnalyticsForbidden()` → `Page403` gate, `await params`, then the saved query plus entities, function catalog, and the schema of **the query's own source** (not the first entity's); `notFound()` when the query cannot be read; `errorObjLog` on failure; rendering inside `SaveValidationContextProvider`.
- [x] 7.2 Give `QueryBuilder.tsx` a required `name` prop for the `<h1>` in place of `t(MenuI18nKey.QueryBuilder)`, plus the stored query and a saved callback.
- [x] 7.3 Seed the builder from `toBuilderRestore` on mount: builder state, the initial rail view, the SQL and JSON buffers, the toolbar time filter, the result view, and the chart config. Mark restored SQL as user-authored so entering the SQL view does not re-seed over it.
- [x] 7.4 Compute the dirty baseline with `useMemo` keyed on the stored query — derived from the stored query, never from live state after a restore (design D4) — and derive `isChanged` by comparing the live captured payload's JSON against it.
- [x] 7.5 Render Edit, Discard, and Save in `QueryBuilderToolbar`'s existing `children` slot beside `CopyButton`, using `ChangedEntityButtons` for the Discard/Save pair so the standard `DiscardModal` confirmation comes with it. Show Discard and Save only while dirty; disable Save when nothing changed.
- [x] 7.6 Implement Save: capture with `buildQuery(state, null)` (design D5), `PUT`, then `router.refresh()` on success with a success notification; on failure show the error and keep the edits.
- [x] 7.7 Implement Discard as a revert to the stored query — builder state, buffers, time filter, result view, chart config — using a remount key for the subtrees that need it. Keep it separate from `Modals/DiscardQueryPopup.tsx`, which stays the written-mode guard with its own copy and keys.
- [x] 7.8 Wire the Edit control on the page to `EditQuery`, and gate Save, Edit, and Delete availability on the caller's write permission for the query's scope (design D15).
- [x] 7.9 Route a `not_found` from any save or read through the gone path: notify and return the user to `/queries` (design D12).

## 8. Retire the standalone builder route

- [x] 8.1 Move the seven existing actions from `src/app/[lang]/query-builder/actions.ts` into `src/app/[lang]/queries/actions.ts` and delete the old file.
- [x] 8.2 Repoint every importer: `QueryBuilder.tsx`, `Ai/AiPanel.tsx`, and the `vi.mock('@/src/app/[lang]/query-builder/actions')` calls in `QueryBuilder.spec.tsx` and `Ai/tests/AiPanel.spec.tsx`.
- [x] 8.3 Replace `src/app/[lang]/query-builder/page.tsx` with a redirect to `/queries`, and remove `AnalyticsQueryBuilder` from `ApplicationRoute`.
- [x] 8.4 Replace the Query Builder menu item with Queries in `components/Menu/menu-configuration.tsx`, keeping the group's order and its `analyticsEnabled` gating, and update `components/Menu/tests/menu-configuration.spec.ts`, which asserts the ordered key list.
- [x] 8.5 Remove the now-unused `MenuI18nKey.QueryBuilder` menu label and its English string if nothing else references them.

## 9. Tests for the query page

- [x] 9.1 Add page-level cases: a representable structured body opens the Builder view; an unrepresentable one opens JSON; a SQL body opens the SQL view and entering that view does not overwrite the stored text; the fields available are the query's own source's.
- [x] 9.2 Add a case asserting a freshly loaded query reports **no** unsaved changes — the regression guard for a stale baseline (design D4 risk).
- [x] 9.3 Add cases asserting each payload member dirties the page: a filter edit, a time-period change, a result-view switch, and a chart-config change.
- [x] 9.4 Add cases for Save disabled when nothing changed, Save sending a body with no timestamp range predicate, and a failed save preserving the edits.
- [x] 9.5 Add cases for Discard: confirming reverts every restored value and clears the dirty indication; cancelling keeps the edits; the written-mode guard still behaves as before and is a distinct confirmation.
- [x] 9.6 Add cases for the chart round-trip: a stored chart view and axes survive the first run; an unset axis is re-derived from the result.
- [x] 9.7 Add permission cases: a common query with a non-admin caller offers neither Save nor Edit; a full admin gets both.

## 10. Documentation and quality gate

- [x] 10.1 Update `docs/MENU-DOCUMENTATION.md` for the replaced Analytics sub-item. — not applicable: that doc does not enumerate the Analytics group's sub-items, and no doc references `/query-builder`.
- [x] 10.2 Run `npm run lint` and `npm run format` and fix everything reported.
- [x] 10.3 Run the full `npm run test` from `apps/ai-dial-admin/` and fix every failure, including the specs touched by the actions relocation.
- [x] 10.4 Run `npm run build` and confirm it passes.

## 11. The selected source reaches the SQL editor and the assistant

- [x] 11.1 Add `src/components/Analytics/QueryBuilder/utils/ai-context.ts` with `buildSchemaSystemMessage(entityName, fields)`: a system message naming the selected entity and listing each field's name, type, display name, and description, marking sensitive fields, and saying so when the field list is empty. Schema only — no row data (design D17).
- [x] 11.2 Have `Ai/AiPanel.tsx` read the selected source from `useQueryBuilder()` and prepend that message to the `generateQuery` call, building it per request and keeping it out of the transcript state.
- [x] 11.3 Have `Sql/SqlEditor.tsx` read `entityName`, `fields`, and `functions` from `useQueryBuilder()` instead of props, keeping the ref its Monaco completion provider reads through (design D18).
- [x] 11.4 Add `utils/tests/ai-context.spec.ts`: system role, the source named as a preference rather than a constraint, each field with its type, schema labels included, a display name equal to the field name omitted, sensitive marked, **no row data**, the empty-field-list wording, determinism, and field order preserved.
- [x] 11.5 Update `Ai/tests/AiPanel.spec.tsx` to render within the builder context, and add cases asserting the request leads with the schema message, the transcript never shows it, and the source described is the one selected at send time.

## 12. Review fixes

- [x] 12.1 `use-saved-query-page.tsx`: read live values through a ref instead of a render-0 closure, so `applyRestore` re-seeds from the current schema and rebuilds the baseline from the current toolbar. Fixes a permanently-dirty discard on every query stored without a time intent (which is every query the create modal makes), and a save re-seeding a retargeted query with the previous entity's schema.
- [x] 12.2 Key the seed effect on `savedQuery?.id` alone and move the baseline in `onSave` / `onEdited` instead of re-seeding, so a save or a rename no longer clears the result on screen.
- [x] 12.3 Capture the SQL buffer whenever it holds one rather than when the SQL view is active — keying on the view let a stored SQL body be replaced by never-hydrated builder state after a tab switch.
- [x] 12.4 Build the baseline's chart config as `restore.chartConfig ?? DEFAULT_CHART_CONFIG`, so a `result_view: chart` row with no stored chart is not dirty on open.
- [x] 12.5 Persist a diverged JSON buffer as the body (precedence: SQL, then diverged JSON, then builder state), so edits to a body the visual builder cannot display are tracked and savable.
- [x] 12.6 Extract `assembleRequest` and route `EditQuery` through `toMetadataUpdateRequest`, so one function owns the payload's key order that dirty detection depends on.
- [x] 12.7 Wire `Queries.NoQueriesDescription` into the list empty state; drop four unreachable keys and amend design D10, which had promised the new discard its own confirmation copy where the implementation reuses the shared one.
- [x] 12.8 Add regression tests for each finding, in `SavedQueryPage.spec.tsx` and `utils/tests/saved-query.spec.ts`.
