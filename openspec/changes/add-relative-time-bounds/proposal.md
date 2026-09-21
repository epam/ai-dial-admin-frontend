## Why

A structured query's time bound is always two absolute instants, so the body freezes the moment it
was authored. Inside the Admin UI that is hidden: a saved query stores its preset as a relative token
in the separate `time` intent member and the toolbar re-resolves it on open. Everywhere the body
travels on its own — the JSON view, Copy, a direct `POST /v1/queries/execute`, any consumer holding a
stored `query` — it carries the instants and returns the window the author happened to be looking at.

The backend already answers this. The served function catalog exposes `date_sub(unit, amount,
timestamp)` and `now()`, and its own description names `date_sub('hour', 2, now())` as how a stored
query expresses a moving window. The frontend cannot build or read that expression: a predicate's
right operand may only be a literal, and a function's `expression` argument may only be a field
reference, so `now()` has nowhere to go.

## What Changes

- A Filter (and HAVING) condition's **right operand** may be a `scalar` catalog function call, not
  only a literal or an array. The condition editor gains a right-operand kind alongside the existing
  value input, and the operand's argument editors are built from the catalog exactly as the left
  operand's already are.
- A function's `expression` argument may hold a **nested call** to a `scalar` catalog function, one
  level deep. This is what makes `date_sub('minute', 30, now())` expressible; it is a general
  mechanism, so `date_add` and any other catalog function with an `expression` argument are covered
  without naming them.
- Builder-representability widens to match both: a query whose predicate compares against a function
  call, or whose call nests another one level deep, hydrates into the Builder instead of being
  pushed into the JSON view. Anything deeper still stays in the written views.
- The toolbar time filter serializes a **preset** period as a relative bound —
  `ge field date_sub(unit, amount, now())` and `le field now()` — so the body alone expresses the
  moving window. A **custom** range keeps serializing as two absolute instants, and an anchored
  option keeps its absolute start.
- `liftTimeRange` reads **both** forms: the relative pair lifts back to the matching preset, the
  absolute pair keeps lifting to a custom range exactly as today. No previously authored body
  changes meaning, and none stops opening in the Builder.
- When the catalog serves neither relative function, the toolbar falls back to absolute
  serialization rather than emitting a call the service would reject.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/query-builder`:
  - **Filter (WHERE) builder with nested groups** — the right operand gains a function-call form
    beside the literal and array forms it has today.
  - **Served function catalog** — the catalog's `scalar` set is offered in two more positions: a
    condition's right operand, and an `expression` argument of a function already being built.
  - **Time range is part of the structured query** — a preset period serializes relative to `now()`;
    a custom range stays absolute; lifting accepts both forms.
  - **A query the visual builder cannot hold stays in the written views** — the representability
    rules widen for a function right operand and a one-level nested call, and state where the new
    boundary sits.

## Impact

Affected code, all under `apps/ai-dial-admin/src`:

- `models/analytics/query-builder.ts` — `FilterPredicateNode`'s right operand and `FnArgValue` gain a
  function-call form.
- `components/Analytics/QueryBuilder/utils/serialize.ts` — `fnExpr` emits a nested call for an
  `expression` argument that holds one; `serializeNode` emits a function right operand.
- `components/Analytics/QueryBuilder/utils/deserialize.ts` — `argsToSlots`, `isArgRepresentable`,
  `isExprRepresentable`, `isPredicateRepresentable` read the two new shapes.
- `components/Analytics/QueryBuilder/utils/time.ts` — relative serialization and two-form lifting.
- `components/Analytics/QueryBuilder/Filter/FilterCondition.tsx` and
  `Common/FnArgEditor.tsx` — the right-operand kind switch and the nested-call editor.
- `constants/global-time-filter.ts` — each preset needs its `(unit, amount)` pair beside its
  millisecond offset.

No backend change, no new dependency, no API contract change: the saved-query `time` intent member
keeps its current meaning and payload shape.

## Non-goals

- **The saved-query time intent is not replaced.** A preset still persists as a relative token in
  `time`, and the persisted body still carries no time bound. This change makes the *serialized* body
  self-sufficient; it does not move time into the body at rest.
- **No dedicated "relative time" UI concept.** There is no special editor that knows about time: the
  user reaches a relative bound through the general function mechanism, and the toolbar reaches it by
  serializing a preset it already has.
- **No nesting beyond one level** in a function argument, matching how the filter tree already caps
  at two levels and pushes anything deeper to the SQL view.
- **The SQL view is untouched.** The time filter never modifies SQL text, and relative time in SQL
  stays hand-written.
- **The Query Assistant is untouched.** It produces SQL, which this change does not read or generate.
- **Pages that build their own queries are untouched** (Usage, sessions listing, trace listing and
  detail). They execute immediately, so an absolute bound is correct there.
