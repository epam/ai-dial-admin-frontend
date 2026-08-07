## 1. Types, constants, and i18n

- [x] 1.1 Add `src/models/analytics/saved-query.ts`: `SavedQuery` (response, every optional member declared optional — `description?`, `tag?`, `owner_id?`, `owner_email?`, `query?`, `sql?`, `time?`, `chart?`), `SavedQueryRequest` (the nine accepted fields only, distinct from `SavedQuery`), `SavedQueryTime` (relative/absolute discriminated union), `SavedQueryChart` (`type`, `x_field: string | null`, `y_field: string | null`), and `SavedQueryListResponse` (`{ saved_queries: SavedQuery[] }`)
- [x] 1.2 Add enums to the same model file per `code-standards.md` (enums, not string-literal unions): `SavedQueryScope` (`personal` | `common`), `SavedQueryTimeMode` (`relative` | `absolute`), `SavedQueryEditor` (`Builder` | `Json` | `Sql`) for the derived row chip, and `SavedQueryErrorCode` (`bad_request`, `sensitive_literal_not_allowed`, `validation_error`, `forbidden`, `not_found`, `principal_unavailable`)
- [x] 1.3 Add `src/constants/analytics/saved-queries.ts` for const values only (dialog dimensions, list-refresh scopes, the `⋯` menu action ids) — kept separate from the model file
- [x] 1.4 Add `SavedQueries*` keys to `QueryBuilderI18nKey` in `src/constants/i18n.ts` and their strings to `src/locales/en.ts`, reusing `ButtonsI18nKey` / `BasicI18nKey` for Cancel, Save, Delete, Search, Close. Include one key per failure code, the single unavailable-field message (`"{field} isn't a field in {source}"`), the per-tab empty states, and the neutral no-author placeholder. Never add a key containing "restricted" or "no access" for a column

## 2. Server API layer and actions

- [x] 2.1 Add `src/server/analytics/saved-queries-api.ts` — a `SavedQueriesApi extends BaseApi` with `SAVED_QUERIES_URL = 'v1/saved-queries'` and a per-id URL helper using `encodeURIComponent`, exposing list (scope query param), create, read one, replace, and delete. Follow `analytics-data-api.ts` for shape and comment density
- [x] 2.2 Register the client in `src/app/api/api.ts` on the analytics host alongside `analyticsDataApi`
- [x] 2.3 Add five server actions to `src/app/[lang]/query-builder/actions.ts` (`listSavedQueries`, `createSavedQuery`, `getSavedQuery`, `updateSavedQuery`, `deleteSavedQuery`), each injecting the token via the existing `token()` helper and returning the `ServerActionResponse` envelope
- [x] 2.4 Add `src/components/Analytics/QueryBuilder/utils/saved-query-error.ts` — a pure resolver mapping `(status, errorHeader)` to a `SavedQueryErrorCode` and thence to an i18n key, falling through to a generic message for an unrecognised code. No `BaseApi` or `ServerActionResponse` change is needed: `ErrorView.error` already reaches the client as `errorHeader`, but `getError()` substitutes the literal `'Request error'` when absent, so match known codes rather than trusting the value to be one

## 3. Payload mapping (the highest-risk logic — pure functions)

- [x] 3.1 Add `src/components/Analytics/QueryBuilder/utils/saved-query.ts` with `toSavedQueryRequest(input)` taking every input by value (`state`, `sqlText`, name/description/tag/scope, `timePeriod`, `isCustom`, `timeRange`, `captureTime`, `resultView`, `chartConfig`) — no hooks, no clock reads, no `getCurrentTimeRange()` call inside
- [x] 3.2 Build `query` via `buildQuery(state, null)` so the toolbar time bound never enters the saved body; send `sql` instead when the SQL view holds the query, and never both
- [x] 3.3 Map time intent: `captureTime` off → omit `time`; `!isCustom` → `{ mode: relative, period: timePeriod }`; `isCustom` → `{ mode: absolute, from, to }` from `timeRange` with `from ≤ to`. Never resolve a relative period into instants
- [x] 3.4 Map the chart: send `chart` only when `result_view` is `chart`, preserving `x_field`/`y_field` as explicit `null` when unpicked (this is the deliberate exception to omitting absent members)
- [x] 3.5 Omit every other absent optional member rather than sending `null`, and assert by construction that no server-assigned field or `params` can appear in the output
- [x] 3.6 Add `toBuilderRestore(saved, functions, fields)` — the reverse map producing builder state (via `parseQuery`), the toolbar instruction (apply relative period / apply absolute range / leave alone, with an unknown period token falling back to leave-alone), the result view, and the chart config
- [x] 3.7 Add `deriveSavedQueryEditor(saved)` — `sql` set → `Sql`; else `isBuilderRepresentable(query)` → `Builder`; else `Json`. One function feeding both the library row chip and the view chosen on load, so the two cannot disagree

## 4. Lift result view and chart config into the orchestrator

- [x] 4.1 Make `Result/ResultArea.tsx` controlled: accept `view` / `onChangeView` / `chartConfig` / `onChangeChartConfig` as props and remove its local `useState` and its reset `useEffect`. Behaviour-preserving on its own — land this before any saved-query UI so a regression here is attributable
- [x] 4.2 Move the state and the reset-on-new-result rule into `QueryBuilder.tsx`, adding the one-shot carve-out: a config supplied by a saved-query load survives the first subsequent result, and every result after that resets to `DEFAULT_CHART_CONFIG`
- [x] 4.3 Update `tests/QueryBuilder.spec.tsx` and any `ResultArea` assertions affected by the prop change

## 5. Unavailable-field state (new — no existing treatment to reuse)

- [x] 5.1 Add a pure util collecting every field name a `QueryBuilderState` references (select, filter tree, having tree, sort keys, group-by columns and function argument slots) and returning those absent from a given field list
- [x] 5.2 Mark unresolvable names in place in `Select/SelectProjection.tsx`, `Filter/FilterGroup.tsx`, `Sort/SortKeys.tsx`, and the aggregate/group-by rows, reusing `Common/FieldChip.tsx` with a warning variant rather than a new chip component
- [x] 5.3 Show one banner with the single wording `"{field} isn't a field in {source}"`, one icon, one repair — identical whether the column was dropped or is not visible to this caller — and disable Run until every marked name is gone. Verify no copy anywhere in the feature says "restricted", "no access", or an equivalent

## 6. Library dialog

- [x] 6.1 Add `SavedQueries/SavedQueriesDialog.tsx` — a `DialPopup`-based modal (~800×540) laid out list-left / preview-right with flex or CSS grid (not an HTML `<table>`, and not ag-grid: this is a selectable list, not tabular data)
- [x] 6.2 Add `SavedQueries/SavedQueryList.tsx` — `DialTabs` for My queries / Common, `DialSearch` for search, and rows grouped by `tag`. Grouping reorders rows into groups but never within a group; no client-side sorting, paging, or filtering beyond tag grouping and search
- [x] 6.3 Add `SavedQueries/SavedQueryRow.tsx` — name, source, period, and the derived editor chip from `deriveSavedQueryEditor`. Clicking previews; double-clicking opens
- [x] 6.4 Add `SavedQueries/SavedQueryPreview.tsx` rendering from the list entry already held — no request on selection, no per-id cache, no loading state. Show name, description, `source`, `tag`, period from `time`, "Shows as" from `result_view` + `chart.type`, the stored body, and "Saved by" from `owner_email` with the fallback: nothing under `personal`, a neutral placeholder under `common`. Never compare `owner_email`
- [x] 6.5 Add the dialog footer: normally Cancel / Open query; with unsaved changes it becomes Keep editing / Discard and open in the same footer. Do not mount `DiscardQueryPopup` — it portals to `document.body` and would stack a second focus trap — and leave its existing written-mode guard untouched
- [x] 6.6 Add a per-tab empty state
- [x] 6.7 Add `SavedQueries/use-saved-queries.tsx` (a feature-local hook) owning list state: `personal` fetched on builder mount for the count badge and the first open, `common` fetched on first open of its tab, both refreshed after any successful write and after a `404`

## 7. Save dialog

- [x] 7.1 Add `SavedQueries/SaveQueryDialog.tsx` with name (required, non-blank after trimming), description, single-select tag suggested from the tags already present at that scope plus free entry, and the captured-state summary
- [x] 7.2 Add the **Save to** destination control, offering Common only when `isFullAdmin`; gate the "only you see it" privacy copy on `isEnableAuth` so it is not shown when `isFullAdmin` is merely a consequence of authentication being off
- [x] 7.3 Add the save-the-time-period checkbox, labelled with the period it would store and stating that a relative period stays relative
- [x] 7.4 Add the chart block, rendered only when the Chart result view is open, reflecting the current type and axes and naming an underived axis as a default
- [x] 7.5 Disable the save action while the name is blank or the builder's `runDisabled` is true, so an untranslatable body is rarely submitted
- [x] 7.6 Render each failure per `saved-query-error.ts`: `400` keeps the dialog filled and surfaces the server's own message; `422 sensitive_literal_not_allowed` blocks and names the column with running-without-saving as the only next step and no parameter or save-anyway option; `422 validation_error` reports against the field where attributable; `403` offers Save as new into personal; `404` closes and refreshes the list without retrying; `500 principal_unavailable` states it is a configuration problem and to contact an administrator, with no retry

## 8. Toolbar, identity, and dirty state

- [x] 8.1 Extend `Toolbar/QueryBuilderToolbar.tsx` with the Saved queries action (count badge), the Save action, and a `⋯` overflow menu holding Save as new / Rename / Delete, placed with Copy and Run. Enable the overflow only while a saved query is loaded
- [x] 8.2 Add `SavedQueries/LoadedQueryChip.tsx` beside the `Query Builder` heading showing the loaded query's name and tag
- [x] 8.3 Add `SavedQueries/UnsavedChangesBar.tsx` offering Revert / Save as new / Save, rendered only when a saved query is loaded and its payload has diverged
- [x] 8.4 Track dirty state in `QueryBuilder.tsx` by comparing the serialized `SavedQueryRequest` the builder would send now against the baseline captured at the last successful load or save — not a boolean flipped by individual handlers, which would silently miss one
- [x] 8.5 Wire load: replace builder state, clear the shown result, fetch the schema for the stored entity, hydrate against it, apply the toolbar instruction and the result view/chart, derive the view (SQL seeded and marked user-edited so it is never re-seeded), and set the identity chip and baseline
- [x] 8.6 Wire Save (create when nothing is loaded, replace in place otherwise), Save as new, Rename, and Delete-with-confirmation; replace Save with Save as new when a `common` query is loaded without `isFullAdmin`
- [x] 8.7 Add the `Ctrl`/`⌘`+`S` handler on the Query Builder page, preventing the browser's own save dialog
- [x] 8.8 Wire Revert to restore the loaded saved query and clear the bar

## 9. Unit and component tests

- [x] 9.1 `utils/tests/saved-query.spec.ts` — payload mapping in both directions per `.claude/rules/testing.md`: the built `query` carries no `ge`/`le` pair on the timestamp column while a Run's query does; relative vs absolute vs omitted `time`; `chart` omitted for the table view and axes preserved as `null` when unpicked; optional members omitted rather than `null`; no server-assigned field or `params` in the output; full round-trip (state → request → restore → state) for row mode, aggregate mode, and a SQL body
- [x] 9.2 Pin every id in `timePeriodOptionsConfig` against `^[a-z0-9_]{1,32}$`, so a future option with an uppercase letter or a hyphen fails here rather than as a `422` in front of a user
- [x] 9.3 Test `deriveSavedQueryEditor` across all three outcomes, and `saved-query-error.ts` across all six codes plus the unrecognised-code fallback and the `'Request error'` substitution
- [x] 9.4 Test the unavailable-field collector: names found in select, filter, having, sort, group-by, and function argument slots; none reported when all resolve
- [x] 9.5 Component tests for the library dialog (tab switch, search, tag grouping preserving server order within a group, preview-without-request, footer becoming the confirmation when dirty, per-tab empty state) and the save dialog (Common hidden without `isFullAdmin`, privacy copy suppressed when `isEnableAuth` is false, save disabled while unrunnable, one failure message per code)
- [x] 9.6 Component tests in `tests/QueryBuilder.spec.tsx` for identity chip, dirty bar appearing on a sort-only change, no bar for a scratch query, and the chart carve-out (load a chart → run → chart survives; run again → resets)

## 10. Verify against the running app

- [ ] 10.1 Run the `spec-browser-verify` skill for this change: it builds a VerificationRequest from the delta's scenarios and spawns the `spec-verification-gate` sub-agent to check them against the running local app through the Playwright MCP. Requires the local stack and a local ADAS with authentication disabled. Every `fail` verdict must be resolved before the change is complete. Note that with authentication off `isFullAdmin` is true, so the non-admin scope-gating scenarios (Common hidden, Save replaced by Save as new, `403`) are not reachable this way and stay covered by the component tests in 9.5

## 11. Quality checks

- [x] 11.1 Run `npm run lint` and `npm run format` from the repo root and fix every finding
- [x] 11.2 Run `npx vitest run` from `apps/ai-dial-admin/` and confirm the full suite passes, including the pre-existing Query Builder tests touched by the controlled-props refactor
- [x] 11.3 Confirm the TypeScript build passes (`npm run build`) with no new strict-mode errors
