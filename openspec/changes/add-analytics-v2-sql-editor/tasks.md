## 1. Transport + server action

- [ ] 1.1 Add a `QUERIES_EXECUTE_SQL_URL` constant (`v1/queries/execute-sql`) and `executeSql(sql, token)` + `executeSqlAction(sql, token)` methods to `AnalyticsDataApi` (`server/analytics/analytics-data-api.ts`), posting `{ sql }` and returning `StructuredQueryResult` / `ServerActionResponse<StructuredQueryResult>` respectively
- [ ] 1.2 Add a `SqlQueryRequest { sql: string }` model in `models/analytics/query.ts` (reuse the existing `StructuredQueryResult` for the response — `total`/`totalCount` are always absent on this path)
- [ ] 1.3 Add `executeSqlQuery(sql: string)` to `app/[lang]/query-builder/actions.ts` (`'use server'`), authenticating via `getUserToken()` and delegating to `analyticsDataApi.executeSqlAction`
- [ ] 1.4 Extend the analytics API spec (`server/analytics/tests/analytics-data-api.spec.ts`) to cover `executeSql`/`executeSqlAction` (URL, body shape, action envelope)

## 2. Shared Monaco base + SQL language

- [ ] 2.1 Generalize `components/Common/JsonEditorBase/JsonEditorBase.tsx` with a `language` prop (default `'json'`, preserving all existing call sites); apply the JSON-schema diagnostics `beforeMount` hook only when `language === 'json'`; keep theme/options wiring from `constants/editor.ts` unchanged
- [ ] 2.2 Verify SQL highlighting works via `monaco-editor`'s bundled `sql` language (no extra language registration needed); confirm the ui-kit / `test-setup.tsx` Monaco mock still satisfies both languages

## 3. Autocomplete catalog + provider

- [ ] 3.1 Add a SQL keyword/function catalog constant in `constants/analytics/` (new const file, keywords + closed function catalog: `count`, `sum`, `avg`, `min`, `max`, `date_bin`), kept separate from any type file per code-standards
- [ ] 3.2 Add a pure builder util that maps the loaded schema (`AnalyticsEntityField[]`), the selected entity name, and the keyword catalog to Monaco `CompletionItem[]` (column items carry the field `type` as `detail`; entity item is the `FROM` target; keyword/function items from the catalog)
- [ ] 3.3 Register the `sql` `CompletionItemProvider` from the SQL editor component, closing over the latest schema/entity (ref or re-register), scoped to this editor's model where practical, and dispose it on unmount to avoid duplicate/leaked suggestions

## 4. View model + SQL editor view

- [ ] 4.1 Extend `QueryBuilderView` (`models/analytics/query-builder.ts`) with a `Sql` member
- [ ] 4.2 Build the SQL editor view component (`components/Analytics/QueryBuilder/Sql/`): the shared Monaco base at `language="sql"` filling available height, wired to the completion provider (§3) and the `sqlText` buffer
- [ ] 4.3 Replace the boolean `DialSwitch` view toggle in `QueryBuilder.tsx` with `DialSegmentedControl<QueryBuilderView>` (Form / JSON / SQL), keeping the `fieldsLoaded` render gate
- [ ] 4.4 Add the SQL-mode render branch: Source section only (no Mode/Filter/Select/Aggregate/Sort/Page) plus the SQL editor; keep Copy (of `sqlText`) and Run in the header

## 5. State + Run wiring

- [ ] 5.1 Add `sqlText` state alongside `jsonText`; on entering SQL restore a non-empty buffer verbatim, else optionally seed a best-effort one-line `SELECT` from the current entity + selected fields (may be left blank with a placeholder for v1); never parse `sqlText` back into `state`
- [ ] 5.2 Branch `onRun` on `isSqlView` to open the result sidebar with a SQL request built from `sqlText`; disable Run until a schema is loaded and while `sqlText` is blank
- [ ] 5.3 Wire the result path for SQL: widen `QueryResultSidebar` to accept a discriminated request (`structured | sql`) and branch `executeQuery` vs `executeSqlQuery`, sharing the loader/grid/empty/error rendering (key the re-run memo off the SQL text in SQL mode); surface a `400` via the existing notification convention
- [ ] 5.4 Add SQL view i18n keys to `QueryBuilderI18nKey` (`constants/i18n.ts`) and English strings to `locales/en.ts` (segmented-control labels, SQL editor placeholder, any SQL-run error header), reusing shared labels where they exist

## 6. Tests

- [ ] 6.1 Unit-test the completion-item builder (§3.2): column items with `type` detail, the entity `FROM` item, and keyword/function items from the catalog
- [ ] 6.2 Component tests per `.claude/rules/testing.md`: switcher shows three segments once schema loaded; SQL buffer persists across Form→SQL→Form round-trips while Form state stays intact; SQL Run posts `{ sql }` and renders the result grid; blank SQL disables Run; failed SQL run surfaces an error notification and does not blank a prior result

## 7. Verification

- [ ] 7.1 Run the spec-browser-verify skill against the running local app (stack up, auth disabled, `analytics-data-access-service` reachable at `DIAL_ANALYTICS_API_URL`): build a VerificationRequest from this change's scenarios, spawn the spec-verification-gate sub-agent via the Playwright MCP, and resolve any `fail` verdicts before completing the change — **may be BLOCKED locally: requires the live stack + analytics-data-access-service; run when the environment is available**

## 8. Quality checks

- [ ] 8.1 ESLint + Prettier clean on all new/changed files; the analytics test suite green; new source typechecks clean under `tsconfig.app.json`; run the full-repo test suite (pre-push gate) before merge
