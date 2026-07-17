# Adopt the backend query-translation endpoints and case-insensitive contains

## Why

The analytics data-access service now exposes query translation as two validation-only endpoints,
and redefines the `contains` operators. The Query Builder should stop hand-rolling SQL and adopt the
backend as the single source of truth for both translation directions:

- **`POST /v1/queries/translate`** (DSL → SQL): renders a structured query as the exact external-dialect
  SQL subset that `execute-sql` accepts. Today the SQL view is seeded by ~115 lines of client-side
  generation (`utils/sql-generate.ts`) that can silently drift from what the backend actually parses.
- **`POST /v1/queries/translate-sql`** (SQL → DSL): the reverse direction the frontend explicitly gave
  up on (`sql-generate.ts:84-86` — "the reverse direction … intentionally does not exist"). With it,
  a user can edit raw SQL and hop **back** into the visual builder — true bidirectional editing,
  removing the current SQL-view dead-end.
- **Operator redefinition (breaking)**: `co`/`nc` are now case-sensitive (`LIKE`); new `ico`/`inc` are
  case-insensitive (`ILIKE`). The frontend's "Contains" today maps to `LIKE`, which the old backend ran
  case-insensitively — so existing "Contains" searches silently become case-sensitive after this change.

Neither endpoint contacts ClickHouse; both are pure validation/translation and reuse the exact
execute-path rules, so what the builder shows is what a run would do.

## What Changes

- **Contains is case-insensitive only in the builder.** The Filter condition operator dropdown authors
  the new case-insensitive operators `ico`/`inc` (serializing to `ILIKE`) but shows them with the
  familiar `CO`/`NC` labels users know. The case-sensitive `co`/`nc` remain understood by the
  model/serializer so JSON-authored and backend-translated queries still round-trip, but they are not
  offered for new conditions.
- **SQL view seeds from the backend.** Entering the SQL view seeds the editor by calling
  `POST /v1/queries/translate` on the current builder query, showing the authoritative SQL. The
  client-side generator (`utils/sql-generate.ts`, `sqlFromQuery`) is retired. Seeding is asynchronous
  (a brief loading state); a query the SQL subset cannot express (translate `400`) surfaces the backend
  error instead of a silently-wrong statement.
- **SQL → Builder round-trip.** Switching from the SQL view to the Builder first calls
  `POST /v1/queries/translate-sql`. On success the returned DSL hydrates the visual builder and the
  view switches with no data loss. The existing discard-confirmation guard becomes the **fallback**:
  it fires only when translation fails (`400` — unsupported construct) or the resulting query cannot be
  represented in the two-level visual builder.
- **New server layer.** `analyticsDataApi` gains `translateAction` and `translateSqlAction`; two server
  actions (`translateQuery`, `translateSqlToQuery`) wrap them with the user token; request/response DTOs
  live in `models/analytics/query.ts`.
- **SQL autocomplete** gains `ILIKE` in the keyword catalog so round-tripped/hand-written case-insensitive
  contains completes like `LIKE`.

## Non-goals

- No change to the `execute` / `execute-sql` run paths, the result grid, charts, or the Tables pages.
- No special legacy UI for `co`/`nc` (case-sensitive contains) — they stay tolerated by the model but are
  not surfaced as authoring options and get no dedicated affordance.
- No change to the two-level filter-nesting representability rule; translate-sql output that nests deeper
  than the builder allows still falls back to the guard, unchanged.
- No offline/client-side SQL generation fallback — the SQL view depends on the backend once this lands.

## Capabilities

### Modified Capability

- `analytics` (master spec `openspec/specs/analytics/spec.md`): the server API-layer, Filter builder,
  SQL-autocomplete, SQL-buffer-seeding, and written-mode→Builder-guard requirements are modified; a new
  requirement is added for backend-authoritative bidirectional query translation.

## Impact

- **Server**: `src/server/analytics/analytics-data-api.ts` (two endpoint constants + two methods);
  `app/[lang]/query-builder/actions.ts` (two server actions); `app/api/api.ts` unchanged (same client).
- **Models**: `src/models/analytics/query.ts` — add `Ico`/`Inc` to `QueryOperator`; add
  `TranslateSqlRequest`, `TranslateResponse` (`{ sql }`), `TranslateSqlResponse` (`{ query }`) DTOs.
- **Components/state**: `QueryBuilder/QueryBuilder.tsx` (async SQL seeding + SQL→Builder round-trip in
  view switching), `QueryBuilder/context.tsx` (SQL loading/error state), `Filter/FilterCondition.tsx`
  (operator options), `Mode`/view-switch wiring; `constants/analytics/query-builder.ts`
  (`OPERATOR_OPTIONS`), `constants/analytics/sql.ts` (`ILIKE`), i18n keys (CONTAINS/NOT CONTAINS labels,
  translate loading/error copy).
- **Deletions**: `QueryBuilder/utils/sql-generate.ts` and its tests (superseded by `translate`).
- **Behavioral break**: existing saved queries or copied JSON using `co`/`nc` keep running but are shown
  as case-sensitive; users who relied on "Contains" being case-insensitive keep that behavior only
  because the dropdown default now maps to `ico`. The SQL view requires backend connectivity to seed.
