## 1. Column classification helpers

- [x] 1.1 Add a strict numeric-column helper next to `getNumericColumns` in
      `src/components/Analytics/QueryBuilder/Result/chart-options.ts`: a column qualifies only when
      every row's value satisfies `Number.isFinite(Number(v))`. Do not route it through
      `comparableKey` and do not modify `getNumericColumns` — scatter keeps its date-like eligibility.
- [x] 1.2 Add the translated-group-by resolver as a pure function in
      `src/components/Analytics/QueryBuilder/utils/executed-meta.ts` (not `utils/result.ts`, which
      `chart-options.ts` imports — that direction would cycle): given a translated `StructuredQuery`,
      map each `group_by` entry to its result column name — an entry matching a `select` item whose
      `expr` is a plain field of that name and which carries a non-empty `as` resolves to that `as`,
      every other entry passes through unchanged (see design.md §2 for the measured shapes).
- [x] 1.3 Add the fallback classifier as a pure function alongside it: given result columns and rows,
      return all columns as dimensions and the strictly numeric ones (1.1) as aggregates.

## 2. Executed-query meta for SQL runs

- [x] 2.1 Extend `buildExecutedMeta` in `src/components/Analytics/QueryBuilder/QueryBuilder.tsx` to
      take the translated query (`StructuredQuery | null`) for a `QueryRequestKind.Sql` request.
- [x] 2.2 Implement its translated branch: `mode` from the translated query, `dimensionColumns` from
      its `group_by` run through the resolver (1.2), `aggregateColumns` via the existing
      "result columns minus dimensions" derivation.
- [x] 2.3 Implement its fallback branch for a null translation: classification from rows (1.3), with
      `mode` left as `QueryMode.Row` — do not relabel it `Aggregate`.
- [x] 2.4 Build `columnLabels` for a translated SQL run from `state.fields` only when the translated
      query's `entity` equals the selected entity name; otherwise leave it empty.

## 3. Run paths

- [x] 3.1 In `onRun`'s SQL branch, issue `translateSqlToQuery(sqlText)` and `executeSqlQuery(sql)`
      concurrently via `Promise.all`, and pass the translated query to `buildExecutedMeta`. Gate on
      `res.success && res.response?.query` only — not on `isBuilderRepresentable`.
- [x] 3.2 Ensure a rejected translation neither fails the run, reaches `showNotification`, nor
      discards the result; only the execute call's own failure keeps its current error handling.
- [x] 3.3 In `onRunAiMessage`, pass the translation it already performed into `buildExecutedMeta`
      instead of issuing a second `translateSqlToQuery` call.
- [x] 3.4 Isolate the translation so it cannot reject into the run: a server action that throws in
      transit (rather than returning `{ success: false }`) would otherwise reject the `Promise.all`,
      leave `isRunning` stuck true, and discard a result the execute call had already returned.
      Found in review of 3.1; covered by a test that fails without the guard.

## 4. Chart availability and per-cause hints

- [x] 4.1 Split `QueryBuilderI18nKey.ChartUnavailable` into one key per cause in
      `src/constants/i18n.ts` and `src/locales/en.ts`: no dimension column to plot against, no column
      that can serve as a value, no rows, and no valid axis pick. Each message names its own reason
      and none refers to group-by generically.
- [x] 4.2 Change `chartAvailable` in `src/components/Analytics/QueryBuilder/Result/ResultArea.tsx` so
      it no longer requires `QueryRequestKind.Structured` — the dimension/aggregate lists (plus a
      non-empty result) decide it — and render the hint key matching the actual cause.
- [x] 4.3 Render the no-valid-axis-pick key in
      `src/components/Analytics/QueryBuilder/Result/ResultChart.tsx` in place of the shared key.

## 5. Tests

- [x] 5.1 Unit-test the three helpers from group 1 in the matching `utils/tests/` and
      `Result/tests/` specs: the strict numeric helper rejecting a date-like string column that
      `getNumericColumns` accepts; the resolver across all six measured shapes in design.md §2; the
      fallback classifier's dimension/aggregate split.
- [x] 5.2 Extend `Result/tests/ResultArea.spec.tsx` — update the two existing hint assertions
      (`'chart view shows a hint for a grouped result with no aggregate columns'`, `'chart view shows
      a hint for a row-mode result'`) to the new per-cause keys, and add SQL-meta fixtures alongside
      `AGG_META` / `ROW_META` covering a translated SQL run that charts and a fallback SQL run with
      no numeric column showing its own hint.
- [x] 5.3 Extend `components/Analytics/QueryBuilder/tests/QueryBuilder.spec.tsx` for the run paths:
      a SQL run calls translate and execute together and charts the result; a rejected translation
      still shows the result and raises no notification; the AI-message run issues no second
      translate call.
- [x] 5.4 Add a `ResultChart` test asserting the no-valid-axis-pick key renders when no axis columns
      can be derived.

No browser-verification task is included: the user chose unit-test coverage only for this change.

## 7. Review follow-ups

Found by a post-implementation review of groups 1-5; all fixed in this change rather than deferred.

- [x] 7.1 Dedupe the numeric-column source in `ResultChart.tsx`. The fallback classification puts a
      numeric column in BOTH `dimensionColumns` and `aggregateColumns`, and the concatenation feeding
      `getNumericColumns` assumed the lists were disjoint — so a fallback result with one numeric
      column counted it twice, offered the Scatter type, and plotted that column against itself.
      Violated the pre-existing "Scatter requires two numeric columns" scenario.
- [x] 7.2 Resolve group-by entries against the run's actual result columns: prefer identity when the
      entry already names a returned column (so `SELECT deployment, deployment AS dep … GROUP BY
      deployment` is not re-mapped to `dep`), and drop an entry that names no returned column instead
      of offering an axis the rows cannot plot.
- [x] 7.3 Tighten `getStrictNumericColumns` so a boolean (`Number(true) === 1`) or an array-valued
      column such as `request_tags` (`Number([]) === 0`) is not offered as a measure.
- [x] 7.4 Move `buildExecutedMeta` into `utils/executed-meta.ts` and export it, so the two behaviors
      that were specified but unverifiable through a render — `mode` staying `Row` for an
      untranslatable SQL run, and the `columnLabels` entity gating — get direct unit tests. Both
      confirmed to fail under mutation.
- [x] 7.5 Assert the AI-message run issues exactly one translate call, which task 5.3 called for but
      no assertion covered.
- [x] 7.6 Widen the `ChartNoValueColumn` string: it also serves a structured grouped result with no
      aggregate column, where "no numeric column" misstates the cause.
- [x] 7.7 Reconcile the artifacts with the code: design §2 (resolution rule), §4 (strictness and the
      overlapping-lists consequence), §5 (`chartAvailable` needs no `meta.kind` branch), task 1.2's
      stale path, task 4.2's stale wording, and two new spec clauses.

## 8. Quality gate

- [x] 8.1 Run `npm run lint`, `npm run format:write`, and the full `npm run test` from
      `apps/ai-dial-admin/`, and resolve everything they report.
