## 1. Shared expression row shape

- [x] 1.1 In `src/models/analytics/query-builder.ts`, lift the column-or-function row shape `GroupByRow` already has into a shared `ExpressionRow` interface; express `GroupByRow` and a new `SelectRow` in terms of it, and change `QueryBuilderState.select` from `string[]` to `SelectRow[]`
- [x] 1.2 In `src/components/Analytics/QueryBuilder/utils/state.ts`, rename `createGroupByColumn` / `createGroupByFn` to the shape-neutral `createColumnRow` / `createFnRow` now that one row type serves both sections, and update `createInitialState`'s `select` default
- [x] 1.3 Extract the expanded function-row rendering from `Aggregate/GroupBySection.tsx` — collapsed summary chip, one `FnArgEditor` per catalog argument, alias input — into a presentational component under `QueryBuilder/Common/`, parameterized by section color and id prefix, with argument and alias changes raised to the owning section; rewire `GroupBySection` to it with no behavior change

## 2. Row-mode Select projection

- [x] 2.1 In `Select/SelectProjection.tsx`, pass the catalog's `scalarFunctions` to the dropdown's Functions group, render plain columns as chips and function entries through the component from 1.3, and derive/rederive a function entry's alias via `prefilledAlias`, rewriting sort keys with `renamedSortKeys` when it changes
- [x] 2.2 In `utils/serialize.ts`, make the `row`-mode branch emit a field expression per column entry and `fnExpr(...)` under the effective alias per function entry, skipping entries whose required arguments are unfilled and omitting `select` when no entry is active
- [x] 2.3 In `utils/deserialize.ts`, make the `row`-mode branch parse an `fn` select entry into a function row via `argsToSlots` — keeping an authored `as` as a user-owned alias — instead of dropping it
- [x] 2.4 In `utils/fields.ts`, include row-mode select function entries in `computedRows` / `takenColumnNames`, and extend `row`-mode `sortFieldOptions` with their effective aliases

## 3. Filter condition function operand

- [x] 3.1 In `src/models/analytics/query-builder.ts`, give `FilterPredicateNode` the `fn: string | null` + `args: FnArgValue[]` operand fields, and initialize them in `createPredicate`
- [x] 3.2 In `Filter/FilterCondition.tsx`, offer the catalog's scalar functions in the operand dropdown's Functions group, render an argument editor per catalog argument when a function is selected, read the collapsed summary as the call with its arguments, and route both the default value type and the contains-operator withholding through one operand-type resolver (schema type for a column, `functionResultType` for a function)
- [x] 3.3 In `utils/serialize.ts`, make `serializeNode` build the predicate's left operand with `fnExpr` when the node carries a function, and omit a function predicate whose required arguments are unfilled
- [x] 3.4 In `utils/deserialize.ts`, make `parseFilterNode` read an `fn` left operand into the predicate's function name and argument slots instead of leaving an empty field

## 4. Representability guard

- [x] 4.1 Change `isBuilderRepresentable` in `utils/deserialize.ts` to take the served catalog and additionally reject a query whose `select` entries or `filter`/`having` left operands name a function the catalog does not list; update the call sites in `QueryBuilder.tsx` and `utils/saved-query.ts`

## 5. Tests

- [x] 5.1 Unit tests in `utils/tests/` for the serialize/deserialize round-trips: a row-mode function column with and without an authored alias, a filter predicate with a function left operand, entries and predicates omitted for unfilled required arguments, row-mode sort by a select alias, and `isBuilderRepresentable` rejecting an unserved function while accepting a served one
- [x] 5.2 Component tests for `SelectProjection` and `FilterCondition` covering the Functions group, the argument editors, the alias input, and the call the collapsed row reads as; keep the existing Group by tests passing unchanged through the 1.3 extraction

## 6. Verification

- [x] 6.1 Run the `spec-browser-verify` skill for this change against the local stack and resolve every `fail` verdict it reports

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format`, and `npm run test`, and fix everything they report

## 8. Review follow-ups

- [x] 8.1 Add the `boolean` and `array` catalog return types to `QueryFunctionReturnType`, map boolean in `RETURN_TYPE_MAP`, and give the Filter operand its own `operandFunctionOptions` so array-returning scalars — which the service rejects as an operand — are offered for projection only
- [x] 8.2 Warn on the Select and Filter section headers when an entry is dropped for an unfilled function argument (`hasDroppedProjectionColumn` / `hasDroppedCondition`, two `QueryBuilderWarning` members and their i18n keys)
- [x] 8.3 Stop `toBuilderRestore` seeding builder state from a stored body the builder cannot represent
- [x] 8.4 Make `isBuilderRepresentable`'s catalog parameter required-but-nullable, and pass `null` explicitly from the saved-queries grid's Editor column
- [x] 8.5 Unit and component tests for 8.1–8.4, and catalog fixture entries for an array-returning and a boolean-returning scalar
