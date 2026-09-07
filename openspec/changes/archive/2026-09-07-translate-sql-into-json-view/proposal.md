## Why

Switching from the SQL view to the JSON view shows a different query than the one the user wrote. The
JSON buffer is filled from builder state — `JSON.stringify(buildQuery(state, timeBound))` — while an
edited SQL buffer is left untouched and never translated, so the two views disagree with no warning.
The mismatch is worst for a composite SQL body (a join, a CTE, a subquery): the JSON view shows a
single-entity query the user never authored.

The spec already promises otherwise — a composite query switching "to the Builder **or JSON** view"
is meant to go through the translation and its guard — so this is a gap between the specified
behavior and the implementation, not a new capability.

## What Changes

- Switching from the SQL view to the JSON view with an **edited** SQL buffer translates that SQL
  through `POST /v1/queries/translate-sql`, the same endpoint the Builder switch already uses.
- On success the JSON view shows the translated body and the SQL buffer is cleared, so the visible
  body is the one that will be saved. When the body is builder-representable the builder is hydrated
  from it; when it is not, the JSON buffer is marked diverged and the Builder switch keeps its
  existing guard.
- On a rejected translation (a composite statement, or SQL the DSL cannot express) the same danger
  confirmation popup appears as for the Builder switch. Confirming drops the SQL and opens the JSON
  view on the default body for the selected source; cancelling leaves the user in the SQL view with
  the text intact.
- The popup names the view being switched to. Today it always says the query "cannot be shown in the
  visual builder", which is wrong on the JSON switch — the JSON view can show a body, it is the
  translation that failed.
- An unedited or generated SQL buffer keeps today's behavior: the JSON view is filled from builder
  state with no request.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the written-mode switch requirement gains the SQL → JSON path — translation, the
  cleared buffer, and the shared confirmation popup — alongside the existing SQL → Builder rules.

## Non-goals

- Changing what the backend can translate. A composite statement stays untranslatable; this change
  only makes the frontend say so instead of showing an unrelated body.
- Explaining *why* a translation was refused — naming joins, CTEs, or subqueries. The popup says the
  SQL could not be translated, not which construct the DSL lacks.
- Touching the JSON → SQL direction, the Builder → SQL seeding, or the Run paths.
- Adding a loading indicator for the translation round trip; the Builder switch has none either, and
  keeping the two paths identical is the point.

## Impact

- `src/components/Analytics/QueryBuilder/QueryBuilder.tsx` — `onChangeView` and `onConfirmDiscard`.
- Specs: `openspec/specs/analytics/spec.md`.
- Tests: `src/components/Analytics/QueryBuilder/tests/QueryBuilder.spec.tsx`.
