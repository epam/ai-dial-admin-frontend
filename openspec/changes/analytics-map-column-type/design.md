## Context

See proposal.md — Why. The contract was read from `analytics-data-access-service` at `origin/development`
(the local checkout is behind it):

- `QueryFieldType.MAP` — wire `"map"`, always `Map(String, String)`, no type parameters.
- `TableColumnRules`: a map column is never nullable, never a sorting/partition key (so never a grain key),
  and never an array `element_type`; `ScanMetadataRules` refuses it as a scan cursor.
- `WriteValuePreparer.checkMap`: a row value is a JSON object; a `null` entry value is refused.
- Query surface: a raw map is projection-only — `FilterTranslator` refuses every operator over it, the SQL
  renderer refuses it in `group_by` / `sort` / `distinct`. Keys are read through catalog functions
  (`map_value`, `map_contains`, `map_keys`), each taking the map as an `expression` argument and the key as a
  `string_literal`. Results return the map as a JSON object.

The console already has the two halves this needs. The type-driven rules in the Tables editors are
centralised in `components/Analytics/Tables/utils.ts` (`isNullableLockedType`, `isKeyableRow`,
`getGrainKeyColumnNames`, `templateValueFor`), and the Query Builder already offers every catalog scalar
function in Filter operands, Group by and Select, with argument editors built from the catalog. So `map_value`
over a map column is authorable today; what is missing is the type itself and the exclusions.

## Goals / Non-Goals

**Goals:**

- Every type-driven rule decides on `AnalyticsFieldType.Map`, never on a field name.
- The one exhaustive `Record<AnalyticsFieldType, …>` (`ANALYTICS_FIELD_TYPE_SAMPLE`) makes adding the enum
  member a typecheck failure until the Connect sample exists — keep it exhaustive.

**Non-Goals:**

- No change to `Common/*` components: the field exclusion is applied to the option lists the builder passes in.
- No change to query-viewer rendering: `renderCell` and the value dialog already handle an object value.

## Decisions

### Exclude map fields where options are built, not in the dropdown

The Filter left operand, the plain Group by columns and the Sort key fields each get their options from
`components/Analytics/QueryBuilder/utils/fields.ts` (`fieldsToOptions`, `sortFieldOptions`, and the Group by
column list). A single helper — `comparableFieldOptions(options, kept)`, which drops `map`-typed options — is
applied there, at those three call sites only. The row-mode Select and the function-argument dropdown keep the
unfiltered list. `kept` carries the field the row being edited already names (the condition's field, the
picked Group by columns, the sort row's own field), so a query authored in JSON, SQL or by the assistant still
shows what it names instead of an empty picker — the spec carries such a query as authored.

- *Alternative: a prop on `CategorizedFieldDropdown` to drop a type.* Rejected — it adds a caller-specific prop
  to a shared component, and the dropdown would then decide query semantics.
- *Alternative: keep map fields listed but disabled, with a tooltip pointing at the map functions.* Rejected —
  it names catalog functions from the frontend, and a disabled option in a searchable listbox costs a keyboard
  user a stop for nothing. The Functions group already holds the route.
- *Alternative: picking a map column auto-wraps it in `map_value(field, key)`.* Rejected — the builder would
  hardcode a function name, which "Served function catalog" forbids.

`Object` keeps its current treatment: the service accepts some document comparisons over an object, so it is
not part of this predicate.

### Map sits last in the column-type picker

`COLUMN_TYPE_OPTIONS` maps `Object.values(AnalyticsFieldType)`, so declaration order is picker order, and the
ui-kit select shows ten rows before scrolling with no scrollbar at rest. `Map` is declared after `Array`. The
comment on the enum is rewritten to say that two types now sit past the fold and why these two. Raising the
list height is a ui-kit change and out of scope here.

### Nullable lock, key eligibility, element type

- `isNullableLockedType` gains `Map` — the editor then forces Nullable off on retype with no further change,
  because `ColumnRowsEditor` already reads it.
- `isKeyableRow` and `getGrainKeyColumnNames` exclude `Map` beside `Object`. The Identity column options
  (the non-nullable, non-sensitive filter) also exclude `Array`, `Object` and `Map`: `ScanMetadataRules`
  refuses all three as a scan cursor. Array and Object were offered before this change; they are fixed here
  because this change rewrites the same predicate and its hint.
  The existing "clear a key selection that stops qualifying" logic reads the same predicates, so retyping a
  chosen key column to Map clears it.
- `ELEMENT_TYPE_OPTIONS` subtracts `Map` explicitly, as it already does `Enum`, so the list cannot silently
  grow a non-scalar element.

### Example values

- Add rows template: `templateValueFor` returns `{}` for Map — the only shape that is valid for an empty bag.
- Connect panel: the sample is `{ key: 'value' }`. `SnippetValue` widens from `Record<string, never>` to
  `Record<string, string>`, and `toPythonValue` / `toJsonValue` serialise an object's entries instead of
  always printing `{}` — an `object` column's sample stays `{}`, so its output is unchanged. A new
  `ConnectFormatRule.Map` carries the guidance text ("an object whose keys and values are all strings"),
  ordered after Array in `CONNECT_FORMAT_RULE_ORDER`, with an i18n key next to `ConnectFormatArray`.

### Type badge and non-scalar sets

`TypeBadge` maps Map to `text-accent-primary` — free in the badge palette and AA on every layer per
`a11y.md`. `NON_SCALAR_FIELD_TYPES` gains Map, which both the sessions derived-column catalog and the trace
insight-column selection read.

## Risks / Trade-offs

- [A user does not find a map column under Filter and does not know about the map functions] → the
  function's catalog description is its tooltip in the Functions group; key discovery is a stated non-goal.
- [The service changes `map` to carry typed values] → the Connect sample and format text would go stale; both
  live in one constant and one i18n key.
- [ClickHouse coercion of non-string map values is unverified] → the console never writes one: the template
  and the sample both use string values.
- [Aggregate or non-map scalar functions accept a map column as an argument in the builder but the service
  refuses it] → the catalog does not type `expression` arguments, so this is the same exposure every other
  type mismatch has today; the service's error is shown.

## Migration Plan

Frontend-only and additive; the type already arrives from the service. Rollback is a revert.
