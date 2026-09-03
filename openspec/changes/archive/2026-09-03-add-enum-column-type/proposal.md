## Why

The analytics data-access service gained an **`enum` column type** (ADAS `dde7afe`, `docs/enum-columns.md`):
a column may be declared `type: "enum"` with an ordered, closed `enum_values` list, materialized as a
ClickHouse `Enum8`/`Enum16`. The domain is published on every read and discovery surface, and the service
itself refuses an out-of-domain value at insert.

The admin console cannot declare one. `COLUMN_TYPE_OPTIONS` (`constants/analytics/tables.ts`) deliberately
filters `Enum` out, on a comment that is now stale — it says the catalog rejects `enum` in a column
declaration, which was true when it was written and is not any more. So an operator who wants a `status` or
`severity` column has to declare it `string`, giving up the byte-per-row storage, the integer comparison and,
most importantly, the declared domain that lets the console build a value picker without a `SELECT DISTINCT`.

Two smaller gaps follow from the same service change. The Conversations grid already routes an enum-typed
column to a value-selection filter, but that control was written as a bare checkbox list and reads as
unfinished next to the themed text and number filters in the same header. And the query builder still offers
CONTAINS / NOT CONTAINS for every field — the service now refuses the LIKE-based operators on an enum field
and rejects the **whole** query for one bad predicate, so a single such filter takes the result down.

## What Changes

- **Declare enum columns.** `Enum` joins the column-type select in the create-table draft-schema editor and
  the "Add columns" patch flow (`ColumnRowsEditor`), for both source and enrichment tables. Choosing it
  reveals a required ordered value-list editor.
- **Value-list editor.** Reuses the established `Common/Multiselect` list-popup pattern — the same control
  `BaseControls/Topics.tsx` uses — in its `draggable` mode, so declared order (which sets the column's sort
  order) is visible and reorderable by drag.
- **Validation** mirrors the service's rules: 1–512 values, each non-blank and at most 64 characters,
  distinct after trimming; values are submitted trimmed. `enum_values` is required if and only if the type is
  `enum`, and `Enum` stays out of the array `element_type` options and out of the version-column and
  partition-column candidates.
- **Immutable domain.** An existing column's `enum_values` cannot be patched (the service answers 422), so
  `EditColumnPopup` shows the domain read-only and the edit patch never carries it.
- **Read surfaces.** `TypeBadge` gains an `enum` colour; a column's declared domain is reachable from the
  table detail grid; and the Connect panel's write snippet seeds an enum column with its first declared value
  instead of the literal `'example'`, which the service would reject.
- **Restyled enum filter.** `ConversationValueFilter` is brought into the app's filter design language — the
  `bg-layer-4` overlay, a search field once the list is long, a Select-all/Clear header, counts right-aligned
  in `text-secondary` rather than concatenated into each option's accessible name, and a themed Reset footer
  matching `GridFilterDropdown`. Behaviour is unchanged: still observed values with counts, most frequent
  first.
- **Query-builder guard.** A field the schema types `enum` no longer offers `ico` / `inc` (CONTAINS / NOT
  CONTAINS) in the operator select, so a query the service would reject cannot be authored.
- **Shared-list fix.** `Common/Lists/DraggableList` currently commits its *filtered* view upward, so applying
  while a search term is active drops every non-matching item. That is reachable today with more than ten
  topics; an enum domain of up to 512 values makes it routine. The search becomes presentational only.

## Non-goals

- **Widening a domain in place.** The service requires drop-and-re-add (an `ALTER … MODIFY COLUMN` rewrites
  the column and fails on any stored row outside the new set). The console will not offer a migration path.
- **Merging the declared domain into the Conversations filter.** The value list stays the observed grouped
  count, per the existing requirement; a declared value with no rows in the period is still not listed.
- **`map` as a column type.** The service accepts it; it is a separate gap, unrelated to this one.
- **Offering `enum` as an evaluator output-variable type.** The service does not accept it — a rule output
  declared `string` binds to an `enum` target column — and `EvaluatorVarType` already omits it.
- **Enum-aware function gating beyond the filter operators.** The service also refuses `starts_with`,
  `lower`, `length` and friends on an enum field. Those reach the builder through the served function
  catalog, not a frontend list, and are left as they are.

## Capabilities

### New Capabilities

None — every requirement lands in the existing Analytics master spec.

### Modified Capabilities

- `analytics`: the column-type vocabulary offered by the schema editors gains `enum` with a required ordered
  value list and its validation rules; the declared domain is stated immutable and surfaced read-only on the
  column edit and table detail surfaces; the enum value filter's presentation is specified (its value
  semantics are unchanged); and the query builder is required to withhold the LIKE-based operators on an
  enum-typed field.

## Impact

- **Models** — `AnalyticsTableColumn` and `AnalyticsEntityField` (`models/analytics/table.ts`,
  `models/analytics/entity.ts`) gain `enum_values`; `ColumnRow` / `ColumnRowError`
  (`models/analytics/tables-ui.ts`) gain the draft field and its error slot.
- **Analytics Tables** — `constants/analytics/tables.ts`, `ColumnRowsEditor`, `EditColumnPopup`,
  `TableDetailView`, `Analytics/Common/TypeBadge`, `Tables/utils.ts`, `ConnectPanel/constants.ts` and
  `connect-snippets.ts`.
- **Conversations** — `Analytics/ConversationsTrace/List/ConversationValueFilter.tsx` (presentation only).
- **Query builder** — the operator options are currently a flat constant
  (`constants/analytics/query-builder.ts` `OPERATOR_OPTION_DESCRIPTORS`) consumed without regard to field
  type; the consumer must start filtering by the selected field's type.
- **Shared components (cross-cutting)** — `Common/Multiselect` and `Common/Lists/DraggableList` are used by
  Topics and by several entity property panels. `NewItemInput` hardcodes `getTopicError` and a `topic_`
  validation-context prefix, so both must become injectable with the current behaviour as the default;
  existing callers must be left byte-identical in behaviour. The `DraggableList` search fix changes
  behaviour for those callers too — in the direction of not losing data.
- **i18n** — new `AnalyticsTablesI18nKey` and `ConversationsTraceI18nKey` members with English strings.
- **Backend** — no API change; consumes ADAS `dde7afe` as already deployed. An older service that does not
  know `enum` would reject the declaration, which is the same failure any other unsupported type gives.
