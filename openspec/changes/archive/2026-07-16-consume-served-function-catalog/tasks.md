# Tasks — consume the served function catalog

## 1. Catalog model

- [x] 1.1 Add `src/models/analytics/query-function.ts`: enums `QueryFunctionGroup` (`scalar`,
      `aggregate`, `ordered_set_aggregate`), `QueryFunctionArgKind` (`expression`, `integer_literal`,
      `numeric_literal`, `string_literal`), `QueryFunctionReturnType` (`string`, `integer`, `long`,
      `numeric`, `timestamp`, `same_as_argument`); interfaces `QueryFunctionArgConstraints`
      (`allowed_values?`, `min?`, `max?`), `QueryFunctionArg` (`name`, `kind`, `optional?`,
      `constraints?`), `QueryFunction` (`name`, `group`, `signature`, `returns`,
      `distinct_supported`, `description`, `args`).

## 2. Server layer

- [x] 2.1 In `src/server/analytics/analytics-data-api.ts` add `QUERIES_FUNCTIONS_URL =
      ${QUERIES_URL}/functions` and `getFunctions(token): Promise<QueryFunction[] | null>`.
- [x] 2.2 In `src/app/[lang]/query-builder/actions.ts` add `getFunctions(): Promise<QueryFunction[] |
      null>` delegating to `analyticsDataApi.getFunctions`.
- [x] 2.3 In `src/app/[lang]/query-builder/page.tsx` fetch the catalog alongside entities/schema
      (default `[]` on failure) and pass it as `initialFunctions` to `<QueryBuilder>`.

## 3. Thread the catalog through the builder

- [x] 3.1 Add `initialFunctions` prop to `QueryBuilder.tsx`; store `functions: QueryFunction[]` on
      `QueryBuilderState` (`models/analytics/query-builder.ts`) and seed it in `createInitialState` /
      wherever state is initialized from props.
- [x] 3.2 Expose the catalog (plus lookup helpers `functionByName`, `functionsByGroup`) via
      `context.tsx` so every section reads one source.

## 4. Delete the hardcoded catalog

- [x] 4.1 Remove `QueryAggregateFn`, `QueryScalarFn`, `QueryBucketUnit` from
      `src/models/analytics/query.ts` (leave `QueryValueType`, operators, etc. untouched).
- [x] 4.2 Remove `AGGREGATE_FN_OPTIONS`, `BUCKET_UNIT_OPTIONS`, `GROUP_BY_FUNCTION_HINTS` from
      `src/constants/analytics/query-builder.ts`; keep `IMPLICIT_COUNT_ALIAS`.
- [x] 4.3 Remove `SQL_FUNCTIONS` from `src/constants/analytics/sql.ts`; source SQL-autocomplete
      function names from the catalog in `utils/sql-completions.ts`.
- [x] 4.4 Remove the `Fn*Hint` i18n keys (`constants/i18n`, `locales/.../en.ts`).

## 5. Generic arg model + editor

- [x] 5.1 Reshape `GroupByRow` / `AggregateRow` (`models/analytics/query-builder.ts`): `fn: string |
      null` (Group by) / `fn: string` (Aggregate), add `args: FnArgValue[]`, remove `amount`/`unit`
      (GroupByRow) and single `field` (AggregateRow); add `FnArgValue { field?: string; literal?:
      string }`. Retype `FunctionOption` (`name: string`, hint from catalog description).
- [x] 5.2 Update `utils/state.ts`: `createGroupByFn` / `createAggregate` build `args` sized from the
      catalog function (empty slots), drop `amount`/`unit`/date_bin defaults.
- [x] 5.3 Add a generic `Aggregate/FnArgEditor.tsx` that renders one slot from a `QueryFunctionArg`:
      expression → `CategorizedFieldDropdown`; integer/numeric_literal → numeric `CompactInput` with
      `min`/`max`; string_literal → `CompactSelect` of `allowed_values` when present else text
      `CompactInput`.

## 6. Sections

- [x] 6.1 `Aggregate/GroupBySection.tsx`: build the Functions dropdown group from catalog
      `group === scalar`; render each function row via `FnArgEditor` over its catalog args (removes
      the date_bin `amount`/`unit` block and the `QueryScalarFn.DateBin` summary special-case).
- [x] 6.2 `Aggregate/Aggregates.tsx`: build the fn options from catalog `group === aggregate ||
      ordered_set_aggregate`; render args via `FnArgEditor`; render a distinct toggle only when the
      selected function's `distinct_supported` is true.

## 7. Serialize / deserialize / typing

- [x] 7.1 `utils/serialize.ts`: replace `groupByFnExpr` + the aggregate branch with one catalog-driven
      `fnExpr(row, fn)` walking `fn.args` by `kind` (Field vs typed Value, dropping empty optional
      slots, applying `distinct`). Replace the implicit `count()` injection with "first
      aggregate-group function whose args are all optional" from the catalog (retain
      `IMPLICIT_COUNT_ALIAS`); emit nothing if none exists.
- [x] 7.2 `utils/deserialize.ts`: derive `SCALAR_FNS` from the catalog; match `expr.name` to a
      catalog function, route scalar → Group by and aggregate/ordered_set_aggregate → Aggregate, walk
      `expr.args` into slots by kind; unknown function → skip (non-representable).
- [x] 7.3 `utils/fields.ts`: replace `scalarFnResultType` with catalog `returns`; resolve
      `same_as_argument` from the first expression arg's field type via the schema.

## 8. Spec

- [x] 8.1 Apply the delta in `specs/analytics/spec.md` to the master spec: rewrite "Aggregate-mode
      group by, time buckets, and metrics" (catalog-driven functions, generic arg editors,
      constraints, new functions), reverse "Query mode and DISTINCT", update the categorized-dropdown
      hint source, and add the "Served function catalog" requirement.

## 9. Tests

- [x] 9.1 `src/server/analytics/tests/analytics-data-api.spec.ts`: `getFunctions` GETs
      `/v1/queries/functions` and returns the parsed list.
- [x] 9.2 `utils/tests/serialize.spec.ts`: catalog-driven fn serialization (date_bin, width_bucket,
      percentile_cont), typed literal args, dropped empty optional slots, catalog-derived implicit
      measure, distinct on supported aggregates.
- [x] 9.3 `utils/tests/deserialize.spec.ts`: round-trip of the new functions, scalar vs aggregate
      routing from the catalog, unknown-function skip.
- [x] 9.4 `utils/tests/fields.spec.ts`: return types from the catalog, `same_as_argument` resolved
      from the operand field.
- [x] 9.5 `Aggregate` component specs: generic arg editor rendering per kind (dropdown / numeric with
      bounds / allowed-values select), distinct toggle gated on `distinct_supported`, and
      degrade-to-empty when the catalog is `[]`.
- [x] 9.6 `utils/tests/sql-completions.spec.ts`: function suggestions come from the catalog.

## 10. Verify

- [x] 10.1 Run the app against a backend on `development`; confirm Group by lists `width_bucket`,
      Aggregate lists the percentiles with a `0..1` fraction input, `date_bin` still builds via the
      generic editor, distinct appears only on count/sum/avg, and disabling the catalog degrades
      cleanly to plain-column querying.
