## 1. Request-layer plumbing for multi-value filtering

- [x] 1.1 Add `INCLUDES` to `GridFilterType` (`apps/ai-dial-admin/src/types/grid-filter.ts`) and map it
      to `FilterOperatorDto.INCLUDES` in `getFilter()`
      (`apps/ai-dial-admin/src/utils/request/get-request-filters.ts`); verify with a new case in
      `utils/request/tests/get-request-filters.spec.ts` asserting a `GridFilter` of
      `type: GridFilterType.INCLUDES` produces a `FilterDto` with `operator: FilterOperatorDto.INCLUDES`.
- [x] 1.2 (discovered while running `npm run typecheck`) Extend Analytics' own exhaustive
      `GRID_FILTER_TYPE_OPERATOR: Record<GridFilterType, SessionScalarOperator>`
      (`constants/analytics/sessions-trace.ts`) to `Record<GridFilterType, SessionScalarOperator |
      undefined>` with `[GridFilterType.INCLUDES]: undefined` — `INCLUDES` is a multi-value operator
      with no scalar translation, and adding the enum member broke this unrelated map's
      exhaustiveness; verified by `npx tsc -p tsconfig.app.json --noEmit` going clean.
- [x] 1.3 (discovered after manual testing: selecting a checkbox returned an empty list) Fix
      `buildFieldFilter` in `components/ListView/Evaluation/utils/runs-query.ts`: it passed `INCLUDES`
      through the generic single-value `compare(...)` builder, producing a node that compared `status`
      against the whole comma-joined string as one literal (`status = "FAILED,CANCELLED"`), which never
      matches a real row. Special-cased `FilterOperatorDto.INCLUDES` to call the DSL's existing
      `inValues(dslField, valueType, filter.value.split(','))` array-shaped builder instead; verified
      with a new case in `runs-query.spec.ts` asserting the produced node has `op: ComparisonOp.In` with
      an `ExprType.Array` second argument, and the targeted test file + both typecheck gates passing.

## 2. The multiselect filter component

- [x] 2.1 Add a `RunStatus` options list (value + i18n-backed label via `getStatusLabel`) in
      `apps/ai-dial-admin/src/constants/runs.ts` or a sibling `constants.ts` next to the new component,
      per the repo's `constants.ts`/`models.ts` split; verify the five `RunStatus` values are present
      with no duplicates.
- [x] 2.2 Create `RunStatusValueFilter` (e.g.
      `apps/ai-dial-admin/src/components/Runs/List/RunStatusValueFilter.tsx`), modeled on
      `SessionValueFilter.tsx`: `useGridFilter` with a real `doesFilterPass` (row passes when its
      `status` is in the model's selected values, or when there is no model), checkbox rows for the
      fixed options, a "select all" checkbox (`BasicI18nKey.SelectAll`), and a Reset button; on
      selection, emit `{ filter: selected.join(','), filterType: 'in', type: GridFilterType.INCLUDES }`
      or `null` when nothing is selected. Verify with a component test exercising: selecting values
      calls `onModelChange` with the right model, clearing every checkbox calls it with `null`,
      "select all" and Reset behave as expected, and `doesFilterPass` returns the right boolean for a
      selected/unselected status and for no model.
- [x] 2.3 Export a single components map constant pairing the `filter` string key to
      `RunStatusValueFilter` (reusing the existing `EmptyFloatingFilter` for the floating-filter slot,
      per design.md) so every grid instance registers the identical key; verify the constant's key
      matches the string used in the colDef from task 3.1.

## 3. Wire the column definition

- [x] 3.1 In `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx`, replace the `status`
      column's `...evalStringFilter([GridFilterType.EQUALS, GridFilterType.NOT_EQUAL])` with
      `filter: <the new string key>` (keep `floatingFilterComponent: EmptyFloatingFilter` unchanged);
      verify `RUNS_COLUMN`'s (and by extension `SUITE_RUNS_COLUMN`'s and
      `COMPARE_RUN_PICKER_COLUMN`'s) `status` colDef reflects the change.
- [x] 3.2 Update the two assertions in `constants/grid-columns/tests/grid-columns.spec.ts` that pin
      `status?.filter` to `undefined` to expect the new filter key instead; verify the updated spec
      passes (`npx vitest run src/constants/grid-columns/tests/grid-columns.spec.ts`).

## 4. Register the filter component at every grid instance

- [x] 4.1 Add an optional `components?: Record<string, ComponentType>` prop to
      `apps/ai-dial-admin/src/components/Grid/GridView/RadioSelectGrid.tsx`, merged into its internal
      `additionalGridOptions`; verify a component test passing `components` renders a grid that
      resolves a string `filter` key from it (or extend an existing `RadioSelectGrid` test if one
      exists).
- [x] 4.2 Pass the new components map into `additionalGridOptions.components` in
      `apps/ai-dial-admin/src/components/ListView/Evaluation/List.tsx` and
      `apps/ai-dial-admin/src/components/TestSuites/Runs/Runs.tsx`, and into the new `components` prop
      in `apps/ai-dial-admin/src/components/Runs/Compare/SelectCompareRunModal.tsx`; verify each
      file's existing component tests still pass and the Status column's filter button opens without
      an AG Grid "no component registered for filter" console error in a rendered test.

## 5. Regression pass

- [x] 5.1 Run `npx vitest run src/constants/grid-columns src/components/Runs src/components/ListView/Evaluation src/components/TestSuites/Runs src/components/Grid src/utils/request -t ""` (or the equivalent targeted files) to confirm no existing Runs-grid or request-filter test regressed, then run the full `npm run test`, `npm run typecheck`, and `npm run typecheck:specs` gates.

## 6. Add the PENDING run status

- [x] 6.1 Add `PENDING` to the `RunStatus` enum (`models/evaluation/run.ts`), its label
      (`RunsI18nKey.Pending` / `Runs.Status.Pending` in `constants/i18n.ts` and `locales/en.ts`), the
      `getStatusLabel` switch, and an explicit `bg-secondary` entry in
      `SETTLED_STATUS_DOT_CLASS` (settled-style presentation — no in-progress spinner, since a queued
      run isn't transitional); verify with new cases in `RunStatus/test/utils.spec.ts` and
      `RunStatus/test/RunStatus.spec.tsx`.
- [x] 6.2 Add `PENDING` to `INCOMPLETE_RUN_STATUSES` (not `TRANSITIONAL_RUN_STATUSES`) and to
      `ALL_RUN_STATUSES` in `constants/runs.ts`, so the Status filter offers it and analytics surfaces
      treat a pending run's missing values as expected rather than a data failure; verify
      `constants/tests/runs.spec.ts` (already asserts `ALL_RUN_STATUSES` against every `RunStatus`
      value) and the updated checkbox-count assertion in `RunStatusValueFilter.spec.tsx` pass.
- [x] 6.3 Run the full app typecheck gate to confirm no other exhaustive `Record<RunStatus, ...>` or
      `Record<GridFilterType, ...>` map needs a matching update (as `GRID_FILTER_TYPE_OPERATOR` did for
      `INCLUDES`), then re-run the targeted regression suite from task 5.1.
