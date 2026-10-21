## Why

Switching from the SQL view to the Builder could silently lose part of a complex query. The switch is
guarded — an untranslatable or unrepresentable query opens the discard confirmation — but
`isBuilderRepresentable` accepted several shapes that `parseQuery` only half reads. Those passed the
check, hydrated with a piece missing, and the SQL buffer holding the original text was then cleared, so
nothing was left to recover. Reported as "switching SQL → visual builder loses a complex query".

The shapes, each verified against `parseQuery` and `buildQuery`:

- a plain column renamed with `AS` — column rows have no alias editor and serialize without one;
- `distinct` on anything but an aggregate metric — only aggregate rows carry the flag;
- a predicate with one or three operands — the editor reads exactly two;
- an array operand under an operator other than `in`, or with items the `in` editor's comma-separated
  text rewrites (a comma inside a value, padding, empty items, mixed value types), and `in` against a
  single value;
- a blank literal argument, which reads as unfilled and drops the call;
- a `having` tree in `row` mode, which has no Having section;
- in aggregate mode, a plain column or scalar call that is not a `group_by` key — the builder files it
  under Group by, so `round(avg(x))` came back as a grouping key;
- a sort key or `having` condition naming an unaliased call by the service's name (`count`): the builder
  gives the call its own alias, and the reference was left dangling.

The same check gates the JSON view and opening a stored query, so both had the same gap.

## What Changes

- `isBuilderRepresentable` rejects each shape above but the last, so the query stays in the written view
  and switching goes through the existing confirmation. Nothing about the confirmation itself changes.
- `parseQuery` rewrites references to an unaliased call to the alias it prefills. The group-by check
  resolves output names the way the service does, which also lets an unaliased scalar group-by key into
  the builder — previously pushed out because its key matched no alias.
- The spec's representability requirement lists the new conditions.

## Non-goals

- Teaching the builder to hold these shapes (a column alias editor, a Distinct toggle on scalar calls).
  Each is a feature; this change only stops the silent loss.
- Leaving the AI view for the Builder after a message ran as raw SQL still skips the confirmation. That
  is a separate gap in the view switch, not in representability.
- The time-range lift (`liftTimeRange`) is unchanged; it moves predicates into the toolbar by design.

## Impact

- Affected specs: `analytics/query-builder`
- Affected code: `components/Analytics/QueryBuilder/utils/deserialize.ts`
- Behavior: more queries open in the JSON/SQL views instead of the Builder. The saved-queries grid's
  editor label follows, since it uses the same check without a catalog.
