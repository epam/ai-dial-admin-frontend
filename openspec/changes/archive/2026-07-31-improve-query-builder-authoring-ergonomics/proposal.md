## Why

Three authoring frictions in the Query Builder's Builder view force avoidable work on every query:

1. **The alias is mandatory but looks optional.** A computed aggregate column is addressable — by Sort, by Having, and by the backend at all — only through its alias. `StructuredQueryBuilder.requireAlias` rejects a blank `as` with a 400, and `sortFields` orders a computed key only via its select alias. Yet the builder ships aggregates with `alias: ''` behind a small placeholder input and a non-blocking warning, and `runDisabled` never checks that warning. The result: an aggregate the user never aliased is both unsortable (it is filtered out of the Sort/Having options by `havingFieldOptions`) and un-runnable (a red toast on Run), and the only cure is inventing an identifier by hand.
2. **Field pickers close after every pick.** Building a six-column projection means six open→search→click→close cycles, each resetting the search box and the category accordion.
3. **Enum pickers show only codes.** The filter-operator list reads `EQ / NE / CO / NC / LT / GT / LE / GE / IN` and the aggregate-function list `AVG / COUNT / … / SUM`, with no wording and no description — even though the served function catalog already carries a `description` per function that this dropdown discards.

## What Changes

- **Prefilled, editable aliases on computed columns.** Aggregate rows and Group-by function rows are created with a derived human-readable alias (`sum(total_tokens)` → `Total tokens (Sum)`, `count(*)` → `Row count`, `count(distinct project_id)` → `Project ID (Row count distinct)`), rederived while the user has not edited it and frozen as custom once they type. When a rederive changes the name, the Sort keys and Having conditions naming that column move with it, so a reference can never point at a column the query no longer emits. A blank alias falls back to the derived value, so a builder-authored aggregate query can no longer be un-runnable. Derived names are uniquified (`Total tokens (Sum) 2`) because duplicate output column names silently collapse in the result grid and make `ORDER BY` ambiguous.
- **One name resolver for computed columns.** The alias prefill, the Having/Sort option lists, and serialization all resolve output names through a single function, so a column is always offered under exactly the name the query carries. Incomplete function rows — excluded from the query — are no longer offered, and the implicit count column is offered when the query defines no aggregates of its own.
- **Both alias warnings removed.** `MissingAggregateAlias` and `MissingGroupByAlias` become unreachable once a blank alias resolves to the derived default; `MissingGroupByField` and `EmptyAggregate` stay.
- **One result-label mechanism, shared by grid and chart.** `columnLabels` already maps group-by dimension columns to schema display names but only the chart reads it. It is extended to cover row-mode `select` columns and consumed by `getResultColumns`, so both result views label schema columns identically. Schema columns keep being labeled — never aliased: the existing requirement that serialization, JSON, and SQL always use the raw field `name` is preserved. Aliases stay confined to computed columns, which have no raw name of their own.
- **Multi-select field dropdown for the list-valued sections.** Select (row-mode projection) and plain Group-by columns let the user toggle several fields without the overlay closing. Selection is shown by a check mark beside the name plus the accent background already used for the single-select picker's current value — no checkboxes. Already-picked fields stay listed (today they are filtered out of the options) so there is a row to tint and to click again to deselect. Single-valued pickers (Sort key, Filter/Having condition field, function expression args) stay single-select and keep closing on pick.
- **Full names plus hover tooltips in the enum lists.** Filter operators render as `Equals`, `Not equals`, `Contains`, `Does not contain`, `Less than`, `Greater than`, `Less than or equal`, `Greater than or equal`, `In list`, and sort directions as `Ascending` / `Descending` — in the option list, the collapsed trigger, and the row summary; short codes are gone. Truncated trigger labels keep an ellipsis tooltip. Value-type and Nulls selects are unchanged.
- **Functions are named from the served catalog.** A function's label is the leading phrase of its catalog `description` ("Average", "Row count", "Continuous percentile"), cut at the first clause break or the `<name> of/for …` / `<name> (…)` patterns, falling back to the humanized catalog name when the description opens with prose. The full description is the option's hover tooltip. This label also feeds the derived alias, and it holds for both the Aggregate selector and the Group by Functions group. No per-function table in the frontend, so a new catalog entry names itself.
- **Selection is legible without relying on colour.** A selected option carries a check mark beside its name as well as the accent tint, in the field dropdowns and the rail's enum pickers.
- **Section tiles lose their borders**, and an expanded row whose editors no longer fit wraps onto a second line instead of squeezing a control to nothing.
- **BREAKING (display only)**: the default column header for an aggregate output changes from a hand-typed alias (or a failed run) to the derived label, and the implicit count column's alias changes from `count` to `Count`.

## Capabilities

### New Capabilities

None — every change modifies behavior already specified under the `analytics` capability.

### Modified Capabilities

- `analytics`: `Aggregate-mode group by, time buckets, and metrics` — computed rows carry a prefilled derived alias, rederived until user-edited, with a blank alias falling back to the derived value at serialization and duplicates uniquified.
- `analytics`: `Aggregate validation warnings` — the two alias warnings are dropped; the remaining two are unchanged.
- `analytics`: `Aggregate-mode HAVING builder` — options are the query's output columns, resolved through the shared name resolver.
- `analytics`: `Builder sections use section blocks with categorized field dropdowns and collapsible items` — list-valued sections get a multi-select dropdown whose selection is shown by an accent-tinted option row and which keeps already-picked fields listed.
- `analytics`: `Filter (WHERE) builder with nested groups` — operators render as full names everywhere (list, trigger, row summary) with a hover description; short codes are gone.
- `analytics`: `Sort keys` — directions render as full names; the option set is every output column the query carries, computed rows named by their effective alias, plus the implicit count column.
- `analytics`: `Served function catalog` — function pickers name a function from the leading phrase of its served `description` and surface the full description as a hover tooltip (no hardcoded label or hint map).
- `analytics`: `Run query and result` — the result grid labels schema columns by display name through the same map the chart uses.

## Impact

Frontend only; no backend, API, or dependency change. The backend contract is unchanged — this change makes the builder stop producing requests the backend already rejects.

Affected code, all under `apps/ai-dial-admin/src`:

- `components/Analytics/QueryBuilder/utils/state.ts` — derived alias on row creation.
- `components/Analytics/QueryBuilder/utils/fields.ts` — alias derivation, the shared `computedColumnNames` resolver, and the option lists built on it.
- `components/Analytics/QueryBuilder/utils/functions.ts` — `functionLabel` / `humanizeFunctionName`.
- `components/Analytics/QueryBuilder/utils/options.ts` (new) — resolves i18n-keyed option descriptors; `Common/FieldDropdownOption.tsx` (new) — the extracted option row.
- `components/Analytics/QueryBuilder/utils/state.ts` — `renamedSortKeys` / `renamedFilterFields`, used when a derived name changes.
- `components/Analytics/QueryBuilder/Common/ChipRow.tsx`, `Common/SectionBlock.tsx` — row wrapping and borderless tiles.
- `components/Analytics/QueryBuilder/utils/serialize.ts` — blank-alias fallback; warning list.
- `components/Analytics/QueryBuilder/utils/result.ts` — `getResultColumns` consumes a label map.
- `components/Analytics/QueryBuilder/QueryBuilder.tsx` — `buildExecutedMeta` extends `columnLabels` to row-mode select columns.
- `components/Analytics/QueryBuilder/Aggregate/Aggregates.tsx`, `Aggregate/GroupBySection.tsx` — alias edit tracking; function tooltips.
- `components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown.tsx` — multi-select mode.
- `components/Analytics/QueryBuilder/Select/SelectProjection.tsx`, `Aggregate/GroupBySection.tsx` — stop filtering picked options; toggle instead of append.
- `components/Analytics/QueryBuilder/Common/CompactSelect.tsx` — per-option tooltip, trigger code, wider overlay.
- `components/Analytics/QueryBuilder/Filter/FilterCondition.tsx` — operator code in the collapsed summary.
- `constants/analytics/query-builder.ts` — operator/direction option labels, codes, descriptions; warning constants.
- `models/analytics/query-builder.ts` — `aliasEdited` on the computed row models, `CompactSelectOption`, field-dropdown mode enum.
- `constants/i18n.ts` + `locales/en.ts` — operator/direction names and descriptions.

Shared-component blast radius is contained: `CompactSelect` and `CategorizedFieldDropdown` are used only inside `components/Analytics/QueryBuilder/`, and `OPERATOR_OPTIONS` / `VALUE_TYPE_OPTIONS` / `SORT_DIRECTION_OPTIONS` have one consumer each (`FilterCondition`, `SortKeys`).

## Non-goals

- No `display_name` field added to the served function catalog DTO (that is a backend change); function labels are derived from the served `description` and `name` only.
- No change to the value-type or Nulls selects, and no full-name treatment for the page-type or chart-type selects.
- No hardcoded function label or hint map in the frontend — the no-hardcoding rule of `Served function catalog` stands.
- No change to how Sort keys and Having conditions store a column reference (still by name, kept in sync on rename, rather than by row id).
- No gating of Run on validation warnings, and no blocking validation of alias text (uniqueness beyond derivation, character set, length).
- No multi-select for single-valued pickers (Sort key field, Filter/Having condition field, function expression args).
- No relaxation of the one-category-at-a-time accordion, and no "select all in category" action.
- No aliasing of schema columns (row-mode select entries, plain group-by columns) in the serialized query.
