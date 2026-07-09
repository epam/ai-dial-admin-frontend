## 1. Transport + server action

- [x] 1.1 Add a `QUERIES_EXECUTE_SQL_URL` constant (`v1/queries/execute-sql`) and `executeSqlAction(sql, token)` method to `AnalyticsDataApi` (`server/analytics/analytics-data-api.ts`), posting `{ sql }` and returning `ServerActionResponse<StructuredQueryResult>`. (Only the action variant is added — the committed API dropped the non-action `execute()`, so a non-action `executeSql` is unneeded)
- [x] 1.2 Add a `SqlQueryRequest { sql: string }` model in `models/analytics/query.ts` (reuse the existing `StructuredQueryResult` for the response — `totalCount` is always absent on this path)
- [x] 1.3 Add `executeSqlQuery(sql: string)` to `app/[lang]/query-builder/actions.ts` (`'use server'`), authenticating via `getUserToken()` and delegating to `analyticsDataApi.executeSqlAction`
- [x] 1.4 Extend the analytics API spec (`server/analytics/tests/analytics-data-api.spec.ts`) to cover `executeSqlAction` (URL, body shape, action envelope) — passing

## 2. Shared Monaco base + SQL language

- [x] 2.1 Generalize `components/Common/JsonEditorBase/JsonEditorBase.tsx` with a `language` prop (default `'json'`, preserving all existing call sites); apply the JSON-schema diagnostics `beforeMount` hook only when `language === 'json'`; keep theme/options wiring from `constants/editor.ts` unchanged. Also added an `onEditorMount` passthrough for provider registration
- [x] 2.2 SQL highlighting works via `monaco-editor`'s bundled `sql` language (no extra registration). SQL view tests mock `SqlEditor` per testing rule §4.5, so no Monaco-mock change was needed

## 3. Autocomplete catalog + provider

- [x] 3.1 Add a SQL keyword/function catalog constant in `constants/analytics/sql.ts` (keywords + closed function catalog: `count`, `sum`, `avg`, `min`, `max`, `date_bin`), kept separate from type files per code-standards
- [x] 3.2 Add a pure builder util `utils/sql-completions.ts` mapping the loaded schema, the entity name, and the catalog to Monaco-free `SqlCompletion[]` descriptors (field items carry `type` as `detail`; entity item is the `FROM` target). Descriptor type in `models/analytics/sql.ts`
- [x] 3.3 Register the `sql` `CompletionItemProvider` from `Sql/SqlEditor.tsx`, reading the latest schema/entity via a ref, scoped to this editor's model, disposed on `onDidDispose` and on unmount

## 4. View model + SQL editor view

- [x] 4.1 Extend `QueryBuilderView` (`models/analytics/query-builder.ts`) with a `Sql` member
- [x] 4.2 Build the SQL editor view component (`components/Analytics/QueryBuilder/Sql/SqlEditor.tsx`): the shared Monaco base at `language="sql"` filling available height, wired to the completion provider (§3) and the `sqlText` buffer
- [x] 4.3 Replace the boolean `DialSwitch` view toggle with `DialSegmentedControl<QueryBuilderView>` (Form / JSON / SQL), keeping the `fieldsLoaded` render gate
- [x] 4.4 SQL-mode render branch shows the SQL editor only (no builder sections). Per follow-up UX request, the Source section is now persistent above the switcher (shared by all views), and the switcher sits directly below Source rather than in the header; Copy/Run stay in the header

## 5. State + Run wiring

- [x] 5.1 Add `sqlText` state alongside `jsonText`; entering SQL restores the buffer verbatim and never parses back into `state`. Auto-seed from the current query was deferred (blank buffer for v1) to avoid emitting constructs the backend might reject; the `SqlQuery` copy label is used
- [x] 5.2 Branch `onRun` on `isSqlView` to open the result sidebar with a SQL request from `sqlText`; Run disabled until a schema is loaded and while `sqlText` is blank
- [x] 5.3 Widen `QueryResultSidebar` to a discriminated `QueryRunRequest` (`structured | sql`) branching `executeQuery` vs `executeSqlQuery`, sharing loader/grid/empty/error rendering; re-run memo keys off the request; `400` surfaces via the existing notification
- [x] 5.4 Add SQL view i18n keys to `QueryBuilderI18nKey` (`ViewForm`, `ViewSql`, `ViewSwitcher`, `SqlQuery`) and English strings to `locales/en.ts`, reusing `ViewJson`

## 6. Tests

- [x] 6.1 Unit-test the completion builder (`sql-completions.spec.ts`): field items with `type` detail, the entity `FROM` item (and its omission when no entity), and keyword/function items matching the catalog — 4 tests passing
- [x] 6.2 Component tests (`QueryBuilder.spec.tsx`, `QueryResultSidebar.spec.tsx`): switcher offers three views once schema loaded; SQL buffer persists across Form→SQL→Form while Form state stays intact; SQL view hides the builder sections; blank SQL disables Run; SQL Run calls `executeSqlQuery` and renders the grid; failed SQL run shows the empty state (error surfaced via notification). All passing

## 7. Verification

- [x] 7.1 Ran spec-browser-verify against the live app at http://localhost:4200 (authenticated session, `analytics-data-access-service` reachable). All 7 browser-observable scenarios PASS: switcher below Source with Form/JSON/SQL; SQL view hides builder sections; SQL buffer persists across view switches; Run disabled for empty SQL; valid SELECT renders a 10-row `event_id` grid; a join is rejected with a backend `bad_request` toast and a graceful empty state; Ctrl+Space autocomplete lists `event_id`(uuid)/`event_kind`(string) and the entity `dial_usage_log`(table). (Two scenarios initially blocked by a stale Next dev-build chunk 404; resolved by clearing `.next` and restarting the dev server, then re-verified.)

## 8. Quality checks

- [x] 8.1 ESLint + Prettier clean on all new/changed non-test files (specs are lint-ignored by repo config); the analytics test suite green (78 tests across `src/components/Analytics` + `src/server/analytics`); new source typechecks clean under `tsconfig.app.json` (only pre-existing unrelated errors remain). Full-repo `npm run test` is the pre-push gate to run before merge
