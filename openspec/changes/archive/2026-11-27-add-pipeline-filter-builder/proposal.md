## Why

A pipeline's membership filter can only be written as a SQL predicate in a free-text area. An operator who
does not already know the grammar, the source's column names and the literal syntax does not write one, so
the filter is left empty or copied from somewhere else. The Query Builder already lets the same people build a
condition from pickers, and the predicate grammar is the same one the service parses for a query's `WHERE`.

## What Changes

- The pipeline `filter` field gets a **Builder** view: a list of conditions, one row each of Column,
  Operator and Value controls, a single "match all / match any" choice over the list, a delete button per
  row and an "Add condition" button. It is laid out like the Group keys editor on the same form, with
  full-size labelled controls, not the Query Builder's chip rows.
- A **SQL** view keeps today's textarea. A Builder/SQL switch sits on the field.
- The stored value does not change: the form still sends `filter` as a SQL string. The builder writes that
  string from its rows; an existing string is read back into rows through the service's
  `POST /v1/queries/translate-sql`.
- A filter the builder cannot show (nested groups, function calls, `NOT`, an operand other than a column on
  the left and a literal on the right, or a string the service does not parse) opens in the SQL view, with a
  line saying why the builder is unavailable. Switching from SQL to Builder in that state is not offered.
- The builder only offers operators the column's type admits, using the rules the Query Builder already
  applies (no contains on an enum column, `IS NULL` only through equals / not equals).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/pipelines`: the membership `filter` is no longer presented only as a SQL expression input; it
  gains the Builder view and the Builder/SQL switch. The readiness `signal`, `prefer_sql` and a measure's
  `where` keep the existing SQL input.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Pipelines/Common/`: `PipelineSharedFields.tsx` renders the new
  filter field in place of `SqlPredicateField` for `filter`; new files for the field, its condition row and
  its mode switch.
- `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/`: the operator rules used by
  `Filter/FilterCondition.tsx` move into a util both builders import; `FilterCondition` keeps its behaviour.
- A new pure util that renders the builder's rows as a SQL predicate, following the service's own SQL
  renderer (`StructuredQueryToSqlRenderer`): double-quoted identifiers, single-quoted strings with `''`
  escaping, `DATE '…'` / `TIMESTAMP '…'` literals, `IS [NOT] NULL`, `ILIKE '%…%'`.
- Reuses the existing `translateSqlToQuery` server action (`app/[lang]/queries/actions.ts`) and the
  entity schema `use-pipeline-resolution.ts` already loads. No new server action, DTO or backend change.
- `src/locales/en.ts`, `src/constants/i18n.ts`.

## Non-goals

- No builder for the readiness `signal`, `prefer_sql` or a measure's `where` in this change; they can adopt
  the same field later.
- No nested groups, no function operands and no column-to-column comparison in the builder. Such filters stay
  editable in the SQL view. Function operands are left out on purpose: the service refuses non-deterministic
  functions in a pipeline predicate, and the function catalog the console reads does not say which ones those
  are.
- No client-side validation of a SQL view value; the service still reports an invalid predicate on save.
- No change to the Query Builder's own filter UI, and no edit to a shared `Common/*` component.
- No change to how the filter reads on the pipeline's read-only views.
