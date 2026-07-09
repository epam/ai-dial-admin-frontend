# Design — Analytics 2.0 SQL Editor

## Backend contract (confirmed against `analytics-data-access-service`)

The SQL surface is a sibling of the structured execute endpoint, delegating to the same executor:

```
POST /v1/queries/execute-sql
  body:  { "sql": "SELECT deployment, count(*) AS n FROM dial_usage_log GROUP BY deployment ORDER BY n DESC LIMIT 10" }
  200 →  StructuredQueryResultDto   (SAME shape as /v1/queries/execute)
  400 →  SQL parse/validation failure OR unsupported construct (message in the error body)
```

- The request body is an object (`SqlQueryRequestDto { sql }`), not a bare string, and `sql` is `@NotBlank`.
- The response is the same `StructuredQueryResultDto` (rows + columns) — but `totalCount` is **never** populated on this path (the key is omitted). So the result meta line will show the row count only, never a total.
- The server translates SQL → the structured DSL, so it accepts only the **DSL-expressible subset**. Confirmed constraints:
  - Rejected (400): joins, CTEs, subqueries, arithmetic (`a + b`), `CAST`.
  - Single read-only `SELECT`; closed function catalog; entity + field validation.
  - `LIMIT` default 100, **max 1000** — a higher `LIMIT` is *rejected*, not clamped.
  - `LIKE` supported only for `'%text%'` patterns and matches **case-insensitively**.

These constraints are **not** enforced client-side. The editor does not parse SQL; it highlights and autocompletes, and the backend rejects anything invalid on Run. This mirrors how the JSON view already treats invalid JSON — soft-flagged, not blocking — and avoids a client SQL-parser dependency and the dialect-matching burden that comes with it.

## View model — two boolean toggles become a 3-way segmented control

Today `QueryBuilder.tsx` holds `view: QueryBuilderView` (`Form | Json`), toggled by a boolean `DialSwitch` ("JSON Editor") near the Run button (`QueryBuilder.tsx:206`). This story:

- Extends `QueryBuilderView` (`models/analytics/query-builder.ts`) with a third member `Sql`.
- Replaces the `DialSwitch` with `DialSegmentedControl<QueryBuilderView>` from `@epam/ai-dial-ui-kit` — a typed single-select view switcher (`options`, `value`, `onChange`), which is the ui-kit's documented "ViewSwitcher" pattern. Three segments: Form / JSON / SQL. Icons optional.
- The switcher currently only renders once `fieldsLoaded`. Keep that gate — SQL, like JSON, is only meaningful once a schema is loaded (so the `FROM` entity and autocomplete columns exist).

```
              view: Form | Json | Sql        (DialSegmentedControl)
                        │
   ┌────────────────────┼─────────────────────┐
 FORM                 JSON                    SQL
 Source + sections    Source hidden           Source ONLY + Monaco(sql)
   ↕ buildQuery/parseQuery ↕                  independent buffer (sqlText)
   (existing)                                 Run → POST /execute-sql {sql}
```

## SQL-view layout

The render in `QueryBuilder.tsx` today is `isLoading? : error? : isJsonView? : <form>`. Extend the branch so that in SQL mode it renders the Source section (so the operator can pick the entity that becomes the `FROM` target and the autocomplete schema) followed by the SQL editor filling the remaining height — and **none** of the Mode/Filter/Select/Aggregate/Sort/Page sections. Source stays visible in SQL mode (unlike JSON mode, which hides it), because the entity selection still drives both the schema-fed autocomplete and the operator's mental `FROM` target. Copy (of the SQL text) and Run remain in the header.

## Shared Monaco base

`Common/JsonEditorBase` hardcodes `defaultLanguage="json"` plus a JSON-schema diagnostics hook. Generalize it so the JSON view and the SQL view share one Monaco wrapper:

- Add a `language` prop (default `'json'` to preserve every existing call site). The JSON-diagnostics `beforeMount` hook applies only when `language === 'json'`.
- The SQL editor passes `language="sql"` — `monaco-editor` bundles the `sql` Monarch tokenizer + language config, so highlighting, bracket matching, auto-close, and comment toggling are free with no extra code.
- Keep the theme wiring (`EDITOR_THEMES_CONFIG` via `beforeMount`, `useTheme`) and `editorOptions` from `constants/editor.ts` unchanged.
- Prefer extending `JsonEditorBase` in place (add the prop) over a fork, so `CodeViewer` and the JSON view keep working untouched. If the JSON-specific hook makes the signature awkward, split a thin `MonacoEditorBase` and have `JsonEditorBase` wrap it with the JSON hook — either way one Monaco integration, not two.

## Schema-aware autocomplete (in scope)

Monaco ships **no** SQL completion provider — only generic word-based suggestions. Register a `CompletionItemProvider` for the `sql` language, disposed on unmount, fed from the builder's loaded schema:

- **Columns** — one `Field`-kind item per `state.fields[].name`, with the field `type` as the completion `detail` and (where present) the `tag`/`source` as documentation.
- **Entity/`FROM` target** — the selected entity name as a `Struct`/`Class`-kind item.
- **Keywords + functions** — a fixed catalog (`constants/analytics/` — new const file, keyword list separate from types per code-standards): the supported clause keywords (`SELECT`, `FROM`, `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT`, `AS`, `DISTINCT`, `AND`, `OR`, `NOT`, `IN`, `LIKE`, `IS NULL`, `ASC`, `DESC`) and the closed function catalog (`count`, `sum`, `avg`, `min`, `max`, `date_bin`). Keep this list aligned with what the backend accepts; it is a hint set, not a validator.

Provider registration is global to the Monaco instance, so it must key off the current schema (re-register / close over the latest `fields` and entity, or read them from a ref) and be disposed to avoid duplicate suggestions across mounts. Because the schema is already in hand in `QueryBuilder`, no extra fetch is needed. Restrict the provider to this editor’s model where practical so it does not leak suggestions into other Monaco instances (JSON view, `CodeViewer`).

## Transport + server action

Mirror the existing structured path in `server/analytics/analytics-data-api.ts`:

```
export const QUERIES_EXECUTE_SQL_URL = `${QUERIES_URL}/execute-sql`;   // 'v1/queries/execute-sql'

executeSql(sql, token)       → post<SqlQueryRequest, StructuredQueryResult>(QUERIES_EXECUTE_SQL_URL, { sql }, token)
executeSqlAction(sql, token) → postAction<SqlQueryRequest>(QUERIES_EXECUTE_SQL_URL, { sql }, token)   // ServerActionResponse for UI error surfacing
```

- New request model `SqlQueryRequest { sql: string }` in `models/analytics/query.ts` (alongside `StructuredQuery`), since the body shape is DSL-adjacent.
- The response type is the existing `StructuredQueryResult` (no new result model) — `total`/`totalCount` are simply always absent on this path.
- Server action `executeSqlQuery(sql: string)` in `app/[lang]/query-builder/actions.ts` (`'use server'`), authenticating via `getUserToken()` and delegating to `analyticsDataApi.executeSqlAction`, returning the standard `ServerActionResponse<StructuredQueryResult>`.

## Run + result reuse

`QueryResultSidebar` currently takes a `StructuredQuery` and calls `executeQuery`. For SQL, the run posts `{ sql }` to a different action. Two options — prefer the one that keeps the sidebar a single component:

- **Preferred:** widen the sidebar's input to a discriminated request (`{ kind: 'structured', query }` | `{ kind: 'sql', sql }`) and branch the one `executeQuery`/`executeSqlQuery` call; everything downstream (loader, grid, empty/error states, `getResultColumns`) is identical. The `queryKey` memo keys off the SQL text in SQL mode.
- Alternatively a thin `SqlResultSidebar` sibling if the discriminated input muddies the component — but the grid/empty/error rendering must be shared, not duplicated.

`onRun` in `QueryBuilder.tsx` branches on `isSqlView`: open the sidebar with the SQL request built from `sqlText`. Run stays disabled until a schema is loaded; in SQL mode it is additionally disabled when `sqlText` is blank (the backend requires `@NotBlank`, so pre-empt the trivial empty case only).

## State model — SQL as an independent buffer

Add `sqlText: string` state alongside the existing `jsonText`. Rules:

- `Form ⇄ Json` is unchanged: `onToggleJsonView`-style seeding of `jsonText` from `buildQuery(state)`, and `onChangeJson` parsing back into `state`.
- **Entering SQL** (`view → Sql`): if `sqlText` is empty, optionally seed it once from the current query — a best-effort one-line `SELECT` derived from the entity + selected fields (a nicety, not a full serializer; may be omitted for v1 and left blank with a placeholder). If `sqlText` is non-empty (returning to SQL), restore it verbatim.
- **Leaving SQL**: keep `sqlText` as-is. It is *never* parsed back into `state` — the DSL cannot represent arbitrary SQL, and the backend already owns SQL→DSL translation. So switching SQL → Form shows the form exactly as it was before entering SQL.
- Each view thus preserves its own buffer across switches within a page load; there is no cross-translation except the existing Form↔JSON pair.

This is the "independent escape hatch" model. It is the correct one here precisely because the backend restricts SQL to the DSL-expressible subset — a client-side SQL→DSL parser would duplicate server logic for no user-visible gain, and full SQL is a superset the form cannot hold.

## i18n

Add keys to `QueryBuilderI18nKey` (`constants/i18n.ts`) with English strings in `locales/en.ts`: the three segmented-control labels (reuse `EntitiesI18nKey.JSONEditor`-style existing labels where they exist; add `FormView`/`SqlView` as needed), a SQL editor placeholder, and any SQL-run error header distinct from the structured `RunFailed` if wanted. Check shared sections first per the components rule.

## Testing notes

- Unit: the completion-provider builder (schema fields + entity + keyword catalog → `CompletionItem[]`) is a pure function — test it directly (correct labels, kinds, `detail` = type) per `.claude/rules/utils.md`. Monaco itself is mocked in `test-setup.tsx`; do not test Monaco internals.
- Component: view switching preserves each buffer (edit SQL → switch to Form → back to SQL shows the same text; Form state intact after a SQL round-trip); SQL Run posts `{ sql }` and renders the grid; blank SQL disables Run; a failed SQL run surfaces the error notification and does not blank a prior result. Follow the existing `QueryBuilder.spec.tsx` patterns.
