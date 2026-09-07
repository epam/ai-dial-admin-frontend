## Why

The Query Builder offers the served function catalog in exactly one place — the Group by section of
`aggregate` mode. Two positions the backend accepts have no way to reach it:

- **Row-mode Select** projects whole columns only. A JSON or map column can be projected but not
  read into: there is no way to ask for one member of an object (`json_extract_string(request_tags,
  'baggage')`) instead of the whole document, so the user gets an unreadable blob column and has to
  drop to the SQL view.
- **Filter conditions** compare a bare column against a value. A predicate over a computed value —
  the common "filter by a key inside a JSON column" case — is unbuildable in the Builder view.

Both positions are already valid in the structured DSL and already execute: `StructuredQueryBuilder`
translates every row-mode projection entry through the shared expression translator and aliases it,
and `ExprTranslator` resolves a function call in any filter operand. So the gap is in the builder UI
and its (de)serializers, not in the query language or the service.

That gap also loses data today. A query authored in the JSON view with a function in either position
passes the builder's representability check (which inspects only filter-group nesting depth) and is
then hydrated into builder state that cannot hold it: a non-field select entry is dropped, and a
function left operand becomes an empty field, after which the whole predicate is discarded at
serialization. The user sees their pasted projection column or WHERE clause silently disappear.

## What Changes

- The **row-mode Select** section offers the catalog's scalar functions alongside schema columns, in
  the same dropdown group Group by already uses. A picked function becomes an expandable row with an
  argument editor per catalog argument and an alias input, serializing as an aliased `fn` expression
  in `select`.
- Row-mode **Sort** offers those select aliases as sort keys, matching what the service accepts (a
  row-mode select alias is a sortable output name).
- A **Filter condition's left operand** can be a scalar-function call instead of a column. The
  condition's value type and its operator availability follow the function's catalog return type,
  the same way they follow a column's schema type today. Functions returning an `array` are offered
  for projection but not here: the service rejects an array as an operand, and it rejects the whole
  query for one bad predicate.
- An entry the serializer drops for an unfilled argument **says so**, in both new positions. Group by
  has warned about this state since before this change; a dropped condition needs it more, because
  the query then runs unfiltered and returns more rows than were asked for.
- **Deserialization stops dropping what it cannot show.** A row-mode select entry carrying a
  catalog function, and a filter predicate whose left operand is a catalog function, both round-trip
  through the Builder view instead of vanishing. Anything the builder still has no editor for — an
  unserved function, a variadic call, a constant in an `expression` argument, a non-literal right
  operand — becomes unrepresentable, so it stays in the written views intact rather than being
  hydrated with pieces missing.
- **BREAKING (internal only):** `QueryBuilderState.select` changes from `string[]` to a row list, and
  `FilterPredicateNode` gains function fields. No stored query, saved-query payload, or API contract
  changes — every persisted form is the structured query, which is unchanged.

## Non-goals

Deliberately out of scope; each is a separate follow-up:

- **Variadic arguments.** The catalog marks some arguments `variadic` (a JSON path of several keys);
  the frontend has no notion of the flag at all and builds exactly one slot per declared argument.
  Single-key extraction works; multi-key paths stay unavailable, as they are in Group by today.
- **Functions in Having conditions.** Having filters aggregate output aliases; the same operand
  change would apply there, but the case is marginal and it doubles the surface under test.
- **Literals and nested calls in `expression`-kind arguments.** Some catalog functions declare
  numeric bounds as `expression` arguments, and the argument editor offers only a column picker for
  those, so they cannot be given a constant; a function call inside another function's argument is
  likewise not expressible. Authoring them stays impossible, as it is in Group by today. What does
  change is what happens to an existing query that uses one: instead of opening in the Builder with
  that argument silently blanked, it now opens in the JSON view intact. That is user-visible, and it
  is the honest half of the same limitation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the Query Builder requirements gain scalar functions in the row-mode Select
  projection and in the left operand of a Filter condition, and state that both round-trip through
  deserialization rather than being discarded.

## Impact

- `src/models/analytics/query-builder.ts` — `select` row type, `FilterPredicateNode` operand fields
- `src/components/Analytics/QueryBuilder/Select/SelectProjection.tsx` — function rows, argument
  editors, alias input (mirrors `Aggregate/GroupBySection.tsx`)
- `src/components/Analytics/QueryBuilder/Filter/FilterCondition.tsx` — function left operand,
  type-driven operator availability
- `src/components/Analytics/QueryBuilder/utils/` — `serialize.ts`, `deserialize.ts`, `state.ts`,
  `fields.ts` (row-mode sort options and computed-name uniqueness)
- `src/constants/i18n.ts` + `src/locales/en.ts` — labels for the new controls and the two
  dropped-entry warnings
- `src/models/analytics/query-function.ts` — the `boolean` and `array` catalog return types the model
  never named, so a boolean-returning function gets a boolean value control and an array-returning
  one can be recognized as uncomparable
- No server action, API route, or backend change. No change to the structured-query wire format.
