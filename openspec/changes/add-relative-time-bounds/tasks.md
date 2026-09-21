## 1. Model and serialization

- [x] 1.1 In `src/models/analytics/query-builder.ts`, add `FnCallValue` and the `call` member on
      `FnArgValue`, the `FilterOperandKind` enum (`Literal` / `Function`), and the
      `rightKind` / `rightFn` / `rightArgs` members on `FilterPredicateNode`; seed their defaults
      wherever a condition is created in `QueryBuilder/utils/state.ts`.
- [x] 1.2 In `QueryBuilder/utils/functions.ts`, make `isArgFilled` and `requiredArgsFilled` recurse
      into a nested `call`, teach `functionArgSummary` to render one, and add the operand set for a
      nested position — the whole `scalar` set, without the array-return exclusion the condition
      operands apply.
- [x] 1.3 In `QueryBuilder/utils/serialize.ts`, emit a nested call from `fnExpr` when an
      `expression` argument holds one, emit a function right operand from `serializeNode`, and keep
      `isDroppedFunction` / `hasDroppedCondition` reporting a condition whose right-operand or
      nested call is incomplete.
- [x] 1.4 Unit-test 1.1–1.3 in `QueryBuilder/utils/tests/serialize.spec.ts`: a function right
      operand, a one-level nested call (including a zero-argument one), an incomplete nested call
      dropping its condition and raising the warning, and `in` keeping its array shape.

## 2. Deserialization and representability

- [x] 2.1 In `QueryBuilder/utils/deserialize.ts`, read a function right operand in `parseFilterNode`
      and a nested call in `argsToSlots`.
- [x] 2.2 In the same file, widen `isArgRepresentable`, `isExprRepresentable` and
      `isPredicateRepresentable`: an `expression` argument may be a field or a served call nested at
      most one level whose own `expression` arguments are fields; a right operand may be a value, an
      array, or a served call. Two-level nesting stays unrepresentable.
- [x] 2.3 Unit-test 2.1–2.2 in `QueryBuilder/utils/tests/deserialize.spec.ts`, including the
      round trip of the target body (`ge` against `date_sub('minute', 30, now())`) and a
      two-level-nested body staying in the written views.

## 3. Condition editor

- [x] 3.1 Give `QueryBuilder/Common/FnArgEditor.tsx` an `isFunctionOffered` flag: at the top level of
      a call its `expression` argument offers columns and the nested function set through the same
      `CategorizedFieldDropdown`, rendering the picked call's own argument editors below with the
      flag off; a zero-argument call renders with none.
- [x] 3.2 In `QueryBuilder/Filter/FilterCondition.tsx`, add the right-operand kind control, hide the
      value input, value-type selector and "is null" option while the kind is a function, return the
      kind to a literal when the operator becomes `in`, and extend the collapsed summary to read a
      function right operand.
- [x] 3.3 Add the i18n keys 3.1–3.2 need to `src/constants/i18n` and the locale files, following the
      existing `QueryBuilderI18nKey` naming.
- [x] 3.4 Component-test 3.1–3.2 in `QueryBuilder/Filter/tests/`: picking a function on the right
      hides the literal inputs and shows its argument editors, a nested call's arguments offer
      columns only, and switching to `in` restores the literal kind.

## 4. Relative toolbar time bound

- [x] 4.1 Add `unit` and `amount` to `TimePeriodOption` and fill them for every entry of
      `timePeriodOptionsConfig` in `src/constants/global-time-filter.ts`, leaving `offset` and the
      anchored option type as they are.
- [x] 4.2 Add the two relative function names to `src/constants/analytics/query-builder.ts` and a
      catalog guard in `QueryBuilder/utils/functions.ts` that reports whether the served catalog can
      express a given preset's `(unit, amount)` — both functions present, the unit among the
      subtraction's `allowed_values`, the amount within its bounds.
- [x] 4.3 In `QueryBuilder/utils/time.ts`, serialize a preset period as
      `ge date_sub(unit, amount, now())` + `le now()` when 4.2's guard passes, and fall back to the
      resolved instants otherwise; keep a custom range and an anchored start absolute. Thread the
      catalog and the selected period through `QueryTimeBound` / `buildQuery`.
- [x] 4.4 In the same file, extend `matchTimePredicate` to recognise an absolute instant, `now()`,
      and a subtraction call, and have `liftTimeRange` return the matching `periodId` for a relative
      pair, a custom range for an absolute pair, and nothing for any other shape; apply the lifted
      `periodId` to the toolbar in `QueryBuilder.tsx` the way a saved query's relative intent is
      applied.
- [x] 4.5 Unit-test 4.1–4.4 in `QueryBuilder/utils/tests/time.spec.ts`: each preset's relative pair,
      the absolute fallback on a catalog missing the functions, a custom range staying absolute,
      both lifting directions, and a relative pair matching no preset staying a filter condition.

## 6. JSON buffer follow-up

- [x] 6.1 In `QueryBuilder.tsx`, re-seed the JSON buffer from the built query when the toolbar's time
      filter changes while the JSON view is open and the buffer has not diverged — the view runs its
      buffer verbatim, so a stale buffer ran a stale bound. Leave a diverged buffer untouched.
- [x] 6.2 Component-test both in `QueryBuilder/tests/QueryBuilder.spec.tsx`: a period picked in the
      open JSON view reaches the buffer, and an edited (diverged) buffer is left as written.

## 7. Review findings

- [x] 7.1 Offer nesting in every section the spec names, not only in conditions: `FnArgEditor` reads
      the served catalog from the builder context (as the context requirement demands) behind an
      `isNestingOffered` flag, so Group by, row-mode Select and Aggregate arguments can hold a call
      the representability check already accepted.
- [x] 7.2 Reject a call on the right of `in` in `isPredicateRepresentable` — the editor already
      returns that operand to a literal, so such a body must stay in the written views instead of
      hydrating and reserializing into a predicate the service refuses.
- [x] 7.3 Lift a relative pair only when the served catalog could also serialize it
      (`liftedPair` consults `relativeTimeFunctions`), so a preset is never shown for a window that
      would re-serialize as two frozen instants.
- [x] 7.4 Qualify a nested argument's accessible name with the call it belongs to, so two arguments
      of the same catalog name in one row are separately addressable.
- [x] 7.5 Cover 7.1–7.4 with tests, and memoize the right-operand kind options.
- [x] 7.6 Re-seed the JSON buffer on a source change too, resolving the bound against the schema just
      loaded — the same stale-buffer class the time filter had, found while reviewing it.

## 5. Quality gate

- [x] 5.1 Add a regression test that saving is unaffected: the payload's body still carries no time
      bound and unsaved-change detection does not fire on the serialization change alone.
- [x] 5.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and
      `npm run test`, and clear every finding.

<!-- No browser-verification task: the user was asked and chose unit and component tests only. -->
