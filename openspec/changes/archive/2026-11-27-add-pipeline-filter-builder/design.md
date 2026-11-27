## Context

See proposal.md for the motivation. The facts that shape the approach:

- The service parses a pipeline `filter` in `FilterSqlValidator` by wrapping it as
  `SELECT 1 FROM <source> WHERE <filter>` and running it through `SqlQueryFrontEnd`, the same front end behind
  `POST /v1/queries/translate-sql`. The result is the same `FilterNode` a structured query carries in
  `filter`. The pipeline adds refusals on top (non-deterministic and window functions, reads outside the
  source) but no grammar of its own.
- The DTO keeps `filter` as a string (`CreatePipelineDto.filter`). Nothing about the contract changes.
- The Query Builder already turns SQL into a filter tree: `translateSqlToQuery` →
  `parseFilterRoot` / `isFilterRepresentable` (`QueryBuilder/utils/deserialize.ts`). Its filter UI
  (`Filter/FilterGroup.tsx`, `Filter/FilterCondition.tsx`) is tied to `filter-tree-context`, mutates nodes in
  place and uses the Query Builder's compact chip layout, so it is not reused as UI.
- The pipeline form already has the visual sibling: `Aggregate/GroupKeysEditor.tsx` (rows of labelled
  `Select`/`Input` with `PIPELINE_SELECT_DEFAULTS`, a delete `GhostIconButton`, an "Add" `GhostButton`) and the
  mode-switch sibling `Aggregate/AggregateModeSwitch.tsx` (`RadioGroup` + `ConfirmationPopup`).
- `use-pipeline-resolution.ts` already loads the source's entity schema (`AnalyticsEntityField[]`, with
  `type` and `enum_values`).

## Goals / Non-Goals

**Goals:**

- One field component for `filter` that the other three predicates can adopt later without a redesign.
- The SQL string the builder writes is the one the service's own renderer would write for the same tree.
- Opening a pipeline never rewrites its filter. Only an edit in the builder writes `draft.filter`.

**Non-Goals:**

- A general SQL formatter or parser on the client. The client renders a small fixed subset and never parses.

## Decisions

### D1. The client renders the rows as SQL

The builder turns its rows into the predicate string with a pure util, `renderFilterSql`, synchronously on
every edit.

Alternatives considered:

- `POST /v1/queries/translate` with a wrapping query, then cutting the `WHERE` clause out of the returned
  statement. Rejected: a round trip per edit, and cutting a clause out of a SQL string is the kind of string
  surgery that breaks on a literal containing `WHERE`.
- A new predicate endpoint on the service. The cleanest option, but it blocks this change on the backend.
  It can replace `renderFilterSql` later without touching the UI.

The rendered subset mirrors `StructuredQueryToSqlRenderer` in the service, rule for rule:

| Piece | Rendered as |
| --- | --- |
| Column | `"name"`, with `"` doubled |
| String, UUID | `'text'`, with `'` doubled |
| Integer, long, decimal | the number as typed, after a numeric check |
| Boolean | `TRUE` / `FALSE` |
| Date | `DATE 'yyyy-MM-dd'` |
| Timestamp | `TIMESTAMP 'yyyy-MM-dd HH:mm:ss[.SSS]'`, UTC |
| `eq` `ne` `lt` `gt` `le` `ge` | `=` `<>` `<` `>` `<=` `>=` |
| `ico` / `inc` | `ILIKE '%text%'` / `NOT ILIKE '%text%'` |
| `in` | `IN (v1, v2, …)` |
| Is empty / is not empty | `IS NULL` / `IS NOT NULL` |
| Match all / any | conditions joined by ` AND ` / ` OR `, no outer parentheses |

A string or UUID value is written exactly as typed, since an edge space is part of the literal; every other
value is trimmed first, since `7 ` means 7.

Each condition is one comparison, so no parentheses are needed inside a flat list. The no-outer-parentheses
rule is a choice: the service wraps every group in parentheses, which reads worse in the SQL view and means the
same thing.

### D2. Reading an existing filter goes through `translate-sql`

When the form opens with a non-empty `filter`, and when the user switches from SQL to Builder, the field calls
`translateSqlToQuery('SELECT 1 FROM <source> WHERE <filter>')`, with the source name unquoted exactly as the
service's own `FilterSqlValidator` builds its probe. A string it parses here is therefore one it accepts on save.
The response's `query.filter` goes straight to `toFilterRows` (`filter-rows.ts`), which turns it into rows or
refuses it; `isFlatFilter` is that refusal as a boolean. It accepts only what the builder shows:

- a single predicate, or one `and`/`or` group whose children are all predicates, after flattening a group nested
  in a group of the same operator (the service nests one when it folds two bounds on a column into a range);
- every predicate a column on the left and a literal, a literal list (`in`) or a null on the right;
- an operator from the builder's list, or `not` over `eq`/`ne`/`ico`/`inc`, read as its opposite (the service
  turns a `<>` it folds into a value set into `not` over an equality);
- in an `in` list, no item holding a comma or edge spaces: the row keeps a list as comma-separated text trimmed
  per item, so such an item would come back as a different list on the next write.

`parseFilterRoot` and `isFilterRepresentable` are not reused: they build the Query Builder's own node model and
admit two levels and function operands.

A rejected parse (400), an unresolved source, or a tree `isFlatFilter` refuses leaves the field in the SQL
view with the reason under the switch. The Builder option of the switch is then disabled, not hidden, so the
operator can see that a builder exists.

### D3. The mode is derived, not stored

On open the field shows Builder when `filter` is empty or the parse succeeds and passes `isFlatFilter`;
otherwise SQL. The mode is local state of the field and is not saved with the pipeline.

- Builder → SQL: always allowed and loses nothing; the SQL view shows the string the builder wrote.
- SQL → Builder with the text unchanged since the builder last wrote it: returns to the same rows without a
  read, so rows not yet applied (D6) survive the look.
- SQL → Builder after the text changed: re-parses the current text. If it is not flat, the switch stays on SQL and shows the reason.
  If the user edited the SQL since leaving the builder and it is flat, the builder takes the parsed rows. No
  confirmation is needed because nothing is lost: the SQL is the source of truth until the next builder edit.

### D4. The builder's state is its own flat model

The field holds `PipelineFilterRow[]` (`id`, `field`, `operator`, `value`) plus a match mode. Emptiness is an
operator of its own (`IsEmpty` / `IsNotEmpty`) rather than a null flag, because that is how an author reads it;
the comparison and contains operators carry the DSL codes, so `operatorOptionsForType` applies to them
unchanged. It does not
use `FilterGroupNode`/`FilterPredicateNode`: those carry function slots and right-hand kinds the builder never
shows, and the Query Builder mutates them in place. A small adapter turns a parsed flat tree into rows.
State updates are immutable, like `GroupKeysEditor`.

### D5. Pristine until edited

The parse on open only fills the builder's rows. `draft.filter` is written only from a builder edit (and from
the textarea, as today). Opening and saving a pipeline therefore never changes its filter's text, even when
`renderFilterSql` would format it differently.

### D5a. Reads and edits do not overwrite each other

- Only the latest request may settle the field: each read bumps a request counter, and so does every builder
  edit, so a read still in flight when the author edits is dropped rather than replacing the newer rows.
- Every early return of a read (empty text, no source, no schema) clears the reading flag itself, because a
  superseded request's `finally` no longer owns it.
- While the first read is in flight the textarea stays editable but sends no further request; when the read
  settles the field rereads once if the text moved on. Emptied text needs no request and settles at once.
- The builder waits for the source's entity as well as the source: `renderFilterSql` types each literal from the
  entity's fields, so an edit made before they arrive would quote numbers as strings. If the entity cannot be
  read, the builder is unavailable (`NoSchema`).

### D6. Rows the service could not run are not written, and the field says so

A row with no column, or with no value where its operator needs one, is left out of the rendered string, as the
Query Builder leaves out an incomplete condition. So is a contains value holding `%` or `_`: the service's SQL
subset has no escape for them, so `ILIKE '%a_b%'` would match more than the operator typed. Such a row shows an
inline error.

Leaving a row out makes the filter wider than it looks. While any row is left out, a line under the list says
how many conditions are not applied, in an `aria-live="polite"` region. This follows the Query Builder's
`hasDroppedCondition` warning.

### D7. Operator rules are shared, not copied

The operator rules `FilterCondition` keeps inline move into a Query Builder util that both builders import:
which operators a field type offers (no contains over an enum, `ENUM_UNSUPPORTED_OPERATORS`), and that the
empty / not-empty choice exists only for equals / not equals. `FilterCondition` keeps its behaviour and its
tests.

The builder offers: equals, not equals, less, greater, less or equal, greater or equal, contains, not contains,
in, is empty, is not empty. Labels reuse `OPERATOR_OPTION_DESCRIPTORS`; "is empty" / "is not empty" are new
keys. Case-sensitive `co`/`nc` are not offered, as in the Query Builder; a parsed `LIKE` makes the filter
non-flat and keeps it in the SQL view.

### D8. Value controls by column type

| Column type | Value control |
| --- | --- |
| Enum with `enum_values` | `Select` of those values; `in` uses the multi-select variant |
| Boolean | `Select` of true / false |
| Number types | `Input`, numeric check before rendering |
| Date, timestamp | `Input` with the format as placeholder; a parsed epoch-millis timestamp is shown in the same UTC format |
| Everything else | `Input`; `in` takes a comma-separated list |

## Risks / Trade-offs

- [The client renderer drifts from the service's grammar] → It covers the subset in D1 only, every rule is a
  unit test, and the service still validates on save and shows its message, as it does for the textarea
  today.
- [An enrichment column (`<enrichment>.<column>`) needs a different quoting than one quoted identifier] →
  Not verified. The service renderer quotes the whole name as one identifier, and the builder does the same.
  The implementation task checks one enriched column against `translate-sql` on the dev stand before the
  renderer is final.
- [The timestamp value `translate-sql` returns is not epoch millis] → Assumption from the Analytics DTOs. The
  adapter accepts both an epoch-millis string and the `yyyy-MM-dd HH:mm:ss[.SSS]` text.
- [Holding `TABLE_GET` on the source is required for `translate-sql`] → An editor of the pipeline reads the
  source schema already. If the call fails, the field falls back to the SQL view, which works as it does now.
- [A parse on open adds a request before the builder shows] → One call per form open. The field shows the SQL
  view's value while it waits, so nothing is blocked.
