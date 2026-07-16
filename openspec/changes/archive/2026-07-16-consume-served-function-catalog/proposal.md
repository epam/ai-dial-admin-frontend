# Consume the served query-function catalog; drop the FE's hardcoded function lists

## Why

The analytics backend shipped `worktree-expose-supported-functions` (merged to `development`): a
read-only discovery endpoint `GET /v1/queries/functions` that advertises the **closed function
catalog** accepted in structured-query `fn` expressions. Each entry carries `name`, `group`
(`scalar` / `aggregate` / `ordered_set_aggregate`), a human `signature`, `returns`,
`distinct_supported`, a `description`, and an ordered `args` list — each arg with a `kind`
(`expression` / `integer_literal` / `numeric_literal` / `string_literal`), an `optional` flag, and
optional `constraints` (`allowed_values`, `min`, `max`). The catalog is guaranteed to match what the
query translator actually accepts (backend parity test).

Today the frontend **duplicates a stale subset of this catalog** as local source-of-truth:

- `models/analytics/query.ts` hardcodes `QueryAggregateFn` (count, sum, avg, min, max),
  `QueryScalarFn` (date_bin, lower, upper, length, trim, abs), and `QueryBucketUnit`.
- `constants/analytics/sql.ts` hardcodes `SQL_FUNCTIONS` (6 names) for SQL-editor autocomplete.
- `serialize.ts` / `deserialize.ts` / `fields.ts` `switch` on those enums; `date_bin` gets a
  bespoke `amount + unit` editor and reverse-mapping.

The FE list is **already behind** the backend: it is missing `width_bucket`, `percentile_cont`, and
`percentile_disc`, enforces none of the advertised constraints (`date_bin` amount `min 1`, unit
`allowed_values`, percentile fraction `0..1`), and hand-maintains hints/return types that the
catalog now serves. Every future backend function change silently re-opens this drift.

**Goal (per product decision): the frontend holds zero function knowledge.** Which functions exist,
their groups, args, kinds, constraints, distinct support, return types, and descriptions come
exclusively from `GET /v1/queries/functions`. The local function enums and lists are deleted.

## What Changes

- **Server layer.** Add `QUERIES_FUNCTIONS_URL` + `getFunctions(token)` to `AnalyticsDataApi`; a
  `getFunctions()` server action; `query-builder/page.tsx` fetches the catalog server-side alongside
  entities/schema (same `force-dynamic` pattern) and seeds the builder via an `initialFunctions`
  prop.
- **Catalog model.** New `src/models/analytics/query-function.ts` mirroring the DTO: enums
  `QueryFunctionGroup`, `QueryFunctionArgKind`, `QueryFunctionReturnType` and interfaces
  `QueryFunctionArgConstraints`, `QueryFunctionArg`, `QueryFunction`. The catalog is threaded through
  the builder context so all sections read one source.
- **Delete the hardcoded catalog.** Remove `QueryAggregateFn`, `QueryScalarFn`, `QueryBucketUnit`
  from `models/analytics/query.ts`, `AGGREGATE_FN_OPTIONS` / `BUCKET_UNIT_OPTIONS` /
  `GROUP_BY_FUNCTION_HINTS` from `constants/analytics/query-builder.ts`, and `SQL_FUNCTIONS` from
  `constants/analytics/sql.ts` (SQL autocomplete function names now derive from the catalog).
- **Generic arg model.** Replace the bespoke row shapes with catalog-driven ones. `GroupByRow` and
  `AggregateRow` carry `fn: string | null` (catalog name; null = plain column) + `args: FnArgValue[]`
  (one slot per catalog arg) instead of `amount`/`unit`/single-`field`. A generic arg editor renders
  each slot from its catalog arg: `expression` → field dropdown; `integer_literal` /
  `numeric_literal` → numeric input honoring `min`/`max`; `string_literal` → a select of
  `allowed_values` when present, else text. `date_bin` stops being special — the generic renderer
  covers `amount(min 1) + unit(select) + timestamp(field)`.
- **Generic serialize / deserialize.** `serialize.ts` walks a row's `args` against the catalog by
  `kind`, emitting `QueryFieldExpr` (expression) or a typed `QueryValueExpr` (literal). `deserialize.ts`
  matches `expr.name` against the catalog, routes `scalar` → Group by and `aggregate` /
  `ordered_set_aggregate` → Aggregate, and walks `expr.args` back into slots by kind. The `date_bin`
  and single-arg special cases are removed; the `SCALAR_FNS` set is derived from the catalog.
- **New functions surface for free.** `width_bucket` (Group by, 4 expression args),
  `percentile_cont` / `percentile_disc` (Aggregate, numeric-literal fraction + expression) render
  through the generic editor with no per-function code.
- **Result typing from the catalog.** `fields.ts` types function outputs from the catalog `returns`;
  `same_as_argument` (min, max, percentile_disc) resolves the operand field's type from the schema.
- **Implicit measure without a hardcoded name.** The count() injected in aggregate mode with no
  explicit aggregate becomes "the first aggregate-group function whose args are all optional" — which
  is `count` by its metadata, chosen from the catalog rather than named in code.
- **Distinct surfaced where supported.** Per the product decision this change **reverses** the
  builder's current "no DISTINCT controls" rule: an aggregate row whose catalog entry has
  `distinct_supported: true` renders a distinct toggle (diffed into the existing serializer
  `distinct` field). The prior rule hid distinct as a blanket UX simplification; the catalog now
  tells us precisely which functions accept it, so a targeted, correct toggle is safe.
- **Hints from the catalog.** Dropdown hint text is the catalog `description` (English, always in
  sync); the `Fn*Hint` i18n keys are removed.
- **Degrade when the catalog is absent.** With no local fallback, a failed/empty catalog fetch means
  no functions are offered: Group by shows only plain columns, Aggregate offers no metrics (the
  implicit measure still counts group rows). Plain-column querying stays fully functional.
- **Spec.** Amend the consolidated `analytics/spec.md`: rewrite the aggregate group-by/metrics
  requirement from a hardcoded allowlist to catalog-driven; reverse the DISTINCT rule; add scenarios
  for the new functions and constraint enforcement; add a "Served function catalog" requirement.

## Non-goals

- No changes to the entity/schema discovery endpoints, row writes, filter/having/sort structure, or
  the value-type / operator enums (those are query-DSL structure, not the function catalog).
- No nested-function argument building (an `expression` arg accepts a field; composing `fn(fn(...))`
  in the visual builder stays out of scope — JSON view remains for that).
- No localization of catalog hint text (server descriptions are English only).

## Capabilities

### Modified Capability

- `analytics` (master spec `openspec/specs/analytics/spec.md`): the "Aggregate-mode group by, time
  buckets, and metrics" and "Query mode and DISTINCT" requirements change — function availability,
  arg editors, and constraints become catalog-driven, and per-aggregate DISTINCT is surfaced where
  the catalog allows it. A new "Served function catalog" requirement is added.

## Dependencies / sequencing

- Backend `worktree-expose-supported-functions` is **already merged** to the analytics service
  `development`; no merge-before-release caveat — the FE can ship immediately.

## Impact

- **Server**: `src/server/analytics/analytics-data-api.ts` (URL + `getFunctions`),
  `src/app/[lang]/query-builder/actions.ts` (`getFunctions` action),
  `src/app/[lang]/query-builder/page.tsx` (fetch + `initialFunctions` prop).
- **Models**: new `src/models/analytics/query-function.ts`; `src/models/analytics/query.ts` (remove
  the three fn enums); `src/models/analytics/query-builder.ts` (`GroupByRow`/`AggregateRow`/
  `FunctionOption` reshape, catalog on `QueryBuilderState`).
- **Constants**: `src/constants/analytics/query-builder.ts` (remove fn options + hints),
  `src/constants/analytics/sql.ts` (derive from catalog).
- **Components / utils**: `QueryBuilder.tsx` + `context.tsx` (thread catalog),
  `Aggregate/GroupBySection.tsx`, `Aggregate/Aggregates.tsx`, a new generic arg-editor component,
  `utils/serialize.ts`, `utils/deserialize.ts`, `utils/state.ts`, `utils/fields.ts`,
  `utils/sql-completions.ts`.
- **i18n**: remove `Fn*Hint` keys; add keys for the distinct toggle and any generic arg labels.
- **Tests**: `analytics-data-api.spec.ts` (getFunctions), `utils/tests/{serialize,deserialize,fields}.spec.ts`
  (catalog-driven, new functions, constraints, same_as_argument), `Aggregate` component specs
  (generic editor, distinct toggle, degrade-when-empty), `utils/tests/sql-completions.spec.ts`.
