## 1. Shared operator rules

- [x] 1.1 Move the operator rules `QueryBuilder/Filter/FilterCondition.tsx` keeps inline (operators an operand type offers via `ENUM_UNSUPPORTED_OPERATORS`; empty / not-empty only for `eq`/`ne`) into a util under `components/Analytics/QueryBuilder/utils/`, and make `FilterCondition` import it with no change in behaviour (design D7)
- [x] 1.2 Unit tests for the moved rules; existing `FilterCondition` specs stay green unchanged

## 2. Filter model and SQL rendering

- [x] 2.1 Add `components/Analytics/Pipelines/Filter/models.ts` with `PipelineFilterRow`, the match mode enum and the builder/SQL view enum (design D4)
- [x] 2.2 Add `Pipelines/Filter/filter-sql.ts`: `renderFilterSql(rows, match, fields)` following the rendering table in design D1, leaving out incomplete rows and contains values holding `%` or `_`, and reporting how many rows it left out (design D6)
- [x] 2.3 Check the quoting of one enrichment column (`<enrichment>.<column>`) by sending a rendered predicate to `translate-sql` on the dev stand, and fix `renderFilterSql` if the service reads it differently (design Risks). Done against the service source instead of a live call — no stand access from this session: `SqlQueryExecutionIntegrationTest` reads an enrichment column as one quoted identifier (`"widget_labels.label"`), which is what the renderer writes
- [x] 2.4 Add `Pipelines/Filter/filter-rows.ts`: `isFlatFilter` and the adapter from a parsed `QueryFilterNode` to rows plus match mode, accepting epoch-millis and text timestamps (design D2, D8)
- [x] 2.5 Unit tests for 2.2 and 2.4: every row of the D1 table, quote and identifier escaping, each refused shape (nesting, function, `not`, column-to-column, `LIKE`), and the render → parse round trip for every operator

## 3. Filter field

- [x] 3.1 Add `Pipelines/Filter/use-pipeline-filter.ts`: parse on open through `translateSqlToQuery('SELECT 1 FROM "<source>" WHERE …')`, derive the initial view, reparse on SQL → Builder, and write `draft.filter` only on edits (design D2, D3, D5)
- [x] 3.2 Add `Pipelines/Filter/FilterConditionRow.tsx`: labelled Column / Operator / Value controls in the `GroupKeysEditor` layout, value control by column type (design D8), row error for a refused contains value, delete button with an accessible name
- [x] 3.3 Add `Pipelines/Filter/PipelineFilterField.tsx`: Builder/SQL `RadioGroup` in the `AggregateModeSwitch` style, Match control, rows, Add condition, the not-applied count in an `aria-live="polite"` region, the unavailable-builder reason, and the SQL view through `SqlPredicateField`
- [x] 3.4 Render `PipelineFilterField` in place of `SqlPredicateField` for `filter` in `Pipelines/Common/PipelineSharedFields.tsx`; `signal`, `prefer_sql` and measure `where` keep `SqlPredicateField`
- [x] 3.5 Add the i18n keys (`AnalyticsPipelinesI18nKey`, `src/locales/en.ts`) for the view switch, Match, Add condition, is empty / is not empty, the not-applied count, the wildcard error and the unavailable reasons; reuse the Query Builder's operator labels

## 4. Tests

- [x] 4.1 Component tests for `PipelineFilterField` and `FilterConditionRow` covering each scenario of the delta's *The membership filter is built from conditions, with SQL as a fallback*, with `translateSqlToQuery` mocked by `vi.mock('@/src/app/[lang]/queries/actions')` in the spec, as the sibling pipeline specs mock their actions module (no server action is mocked in `test-setup.tsx`); `FilterConditionRow` is covered through the field
- [x] 4.2 Update `Pipelines/Common/tests/PipelineSharedFields.spec.tsx` for the new field

## 5. Browser verification

- [x] 5.1 Run the `spec-browser-verify` skill for this change against the local app (local stack running, auth disabled), covering the scenarios of *The membership filter is built from conditions, with SQL as a fallback*, and resolve every `fail` verdict before moving on

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`, and fix every failure
