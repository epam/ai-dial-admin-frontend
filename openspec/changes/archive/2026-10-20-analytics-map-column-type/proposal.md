## Why

The analytics service declares a twelfth column type, `map` — a string-keyed string bag (ClickHouse
`Map(String, String)`) — and its built-in OpenTelemetry sink tables already carry their attribute bags in it
(`resource_attributes`, `scope_attributes`, `log_attributes`, `span_attributes`, `point_attributes`). The admin
console does not model the type: a table cannot be declared with a map column, and a map column the service
already serves is untyped everywhere it shows up. Worse, the Query Builder offers such a column as a filter
operand, a group-by column and a sort key — every one of which the service refuses, rejecting the whole query
for it — while the supported route to a map's contents (`map_value`, `map_contains`, `map_keys`) is reachable
only by someone who already knows it exists.

## What Changes

- Model `map` as a column type, so it is offered wherever a column is declared (schema definition of a
  `PENDING`/`FAILED` table, the Add columns popup of an `ACTIVE` one, the JSON draft editor) and labelled
  wherever a column's type is shown (columns grid, field dropdowns, type badge).
- Apply the service's rules for a map column in the schema editors: Nullable forced off (the store has no
  nullable map; an absent bag is `{}`), never offered as an ordering key, partition column, grain key, identity
  or version column, and never an array's element type.
- Give a map column a valid example value: `{}` in the Add rows template, and a one-entry string-to-string
  object in the Connect panel's write snippets, with a format rule naming the shape.
- Query Builder: stop offering a map column as a Filter operand, a plain Group by column, or a Sort
  key, keyed on the schema type alone. A map column stays projectable in row-mode Select and stays offered as a
  function's `expression` argument, which is how `map_value(map, key)` / `map_contains(map, key)` — served by
  the function catalog, not named by the frontend — read one key for filtering, grouping and sorting.
- Sessions and session trace grids: treat `map` as non-scalar, alongside `object` and `array`, so a map field
  never becomes a string-filtered grid column.

## Non-goals

- Key discovery — suggesting a map's keys from data (`map_keys` over a sample). The key stays a typed literal.
- A key-path editor that rewrites a picked map column into a `map_value` call: the builder names no function
  itself, and the catalog route already reaches every key.
- Typed map values or key/value type parameters — the service has neither.
- Changing how a result grid renders a map value: it arrives as a JSON object and already renders like one.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/tables`: the column-type vocabulary gains `map`; its nullable, key-eligibility and element-type
  rules; the Add rows template and Connect panel literal for it.
- `analytics/query-builder`: a map field is withheld from every position the service refuses it in.
- `analytics/sessions-listing`: `map` is a non-scalar type for derived grid columns.
- `analytics/session-trace-listing`: `map` is a non-scalar type for insight columns.

## Impact

- Model: `AnalyticsFieldType` (`src/models/analytics/entity.ts`) gains `Map`; the picker-order comment there
  and in `constants/analytics/tables.ts` changes.
- Tables: `components/Analytics/Tables/utils.ts` (nullable lock, key eligibility, template value),
  `ELEMENT_TYPE_OPTIONS`, ConnectPanel constants/models/snippet serializers, i18n + `locales/en.ts` for the
  format rule, `TypeBadge`.
- Query Builder: field-option filtering for Filter, Group by and Sort.
  The row-limit editor reuses the Filter condition editor and inherits the exclusion.
- Sessions: `NON_SCALAR_FIELD_TYPES` (`constants/analytics/sessions-trace.ts`).
- No API or server-action change: the type travels as the string `map` in payloads the console already sends.
