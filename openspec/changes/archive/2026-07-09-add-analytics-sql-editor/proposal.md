## Why

The Analytics 2.0 Query Builder lets an operator assemble a `StructuredQuery` through form controls, preview it as JSON, and run it. The analytics data-access service now also exposes an ad-hoc SQL surface — `POST /v1/queries/execute-sql` — that translates a single read-only `SELECT` into the same structured DSL and runs it through the same governed pipeline, returning the same result envelope. This story surfaces that surface in the UI: a third **SQL** view on the Query Builder page where an operator writes SQL in a Monaco editor (syntax highlighting + schema-aware autocomplete) against the selected source, and runs it.

The editor gives no bespoke client-side SQL validation: the backend is the single source of truth for what SQL is accepted (it rejects the non-DSL-expressible subset with a `400`), and those failures surface through the same notification path the structured Run already uses. SQL is a one-way power-user escape hatch — you can seed it from the current structured query, but it never rewrites the form, because the DSL cannot round-trip arbitrary SQL.

This is a follow-up story against the consolidated master spec at `openspec/specs/analytics/spec.md`, parallel to `add-analytics-v2-query-builder`.

## What Changes

- **Third view.** The whole-page view toggle grows from `Form | Json` to `Form | Json | Sql`. The current boolean `DialSwitch` ("JSON Editor", by the Run button) is replaced by a 3-way `DialSegmentedControl` typed on the view enum.
- **SQL view layout.** In SQL mode the page renders **only** the Source selector (to choose the entity → `FROM` target) plus a full-height Monaco SQL editor, in place of all builder sections. Copy and Run stay available.
- **Shared Monaco base.** `Common/JsonEditorBase` is generalized into a language-parameterized Monaco editor base (default `json`, reused by the existing JSON view; `sql` for the new one), reusing the `constants/editor.ts` themes/options. SQL highlighting is free from `monaco-editor`'s bundled `sql` language.
- **Schema-aware autocomplete (in scope).** A Monaco `CompletionItemProvider` for `sql` is registered from the loaded schema: column names (with their type as detail), the selected entity name (the `FROM` target), and the supported SQL keyword/function set. No client-side SQL parser or validation dependency is added.
- **SQL transport + Run.** Add `executeSql` / `executeSqlAction` to `AnalyticsDataApi` (`POST /v1/queries/execute-sql`, body `{ sql }`) and an `executeSqlQuery(sql)` server action. In SQL mode Run posts the editor text; the result renders in the same `QueryResultSidebar`; a `400` surfaces via the existing error notification.
- **State model — independent buffer.** A `sqlText` state field is added alongside `jsonText`. `Form ⇄ Json` keep round-tripping via `buildQuery`/`parseQuery` as today. Entering SQL optionally seeds `sqlText` from the current query once (when the buffer is empty); thereafter the SQL buffer is preserved across view switches and never back-propagates to Form or JSON.

## Capabilities

### Modified Capabilities
- `analytics`: the Query Builder gains a SQL editor view (Monaco, highlighting + schema autocomplete) alongside the existing Form and JSON views, a 3-way view switcher, an `/v1/queries/execute-sql` transport method and server action, and an independent SQL text buffer that persists across view switches.

## Impact

- **New code:**
  - `components/Common/` — a language-parameterized Monaco editor base (generalized from `JsonEditorBase`).
  - `components/Analytics/QueryBuilder/Sql/` — the SQL editor view component and its schema-fed completion provider.
  - `constants/analytics/` — SQL keyword/function catalog for autocomplete.
- **Modified code:**
  - `components/Analytics/QueryBuilder/QueryBuilder.tsx` — 3-way view state, segmented control, SQL-mode layout branch (Source-only), Run branch for SQL, `sqlText` buffer.
  - `components/Analytics/QueryBuilder/Result/QueryResultSidebar.tsx` — accept a SQL run (post `{ sql }` instead of a `StructuredQuery`), or a thin SQL-result sibling if cleaner.
  - `models/analytics/query-builder.ts` — extend `QueryBuilderView` with `Sql`.
  - `server/analytics/analytics-data-api.ts` — `executeSql` + `executeSqlAction` and an `/execute-sql` URL constant; a `SqlQueryRequest` model.
  - `app/[lang]/query-builder/actions.ts` — `executeSqlQuery(sql)`.
  - `constants/i18n.ts` + `locales/en.ts` — SQL view labels (view switcher segments, editor placeholder).

## Non-goals

- No client-side SQL parsing, linting, or diagnostics — validation is backend-only (Monaco provides highlighting + autocomplete only).
- No SQL → Form/JSON translation; the SQL buffer never rewrites the builder state (one-way escape hatch).
- No support for constructs the backend rejects (joins, CTEs, subqueries, arithmetic, `CAST`); the UI does not pre-empt these, it lets the backend reject them.
- No saving/sharing/history of SQL; the buffer is per page load (in-memory only, like the rest of the builder).
- No changes to the Tables feature.
