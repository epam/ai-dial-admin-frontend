## 1. Shared variation predicate

- [x] 1.1 Add `apps/ai-dial-admin/src/utils/evaluation/column-variation.ts` exporting an
      `ExecutionIndexField` enum for the five index field names (`runIndex`, `requestIndex`,
      `totalRequests`, `turnIndex`, `totalTurns`), a `getUniformExecutionFields(results)` that returns
      the fields whose value is identical across all results (normalising absent to `null`, and
      returning an empty set when `results` is empty), and a `hideUniformColumns(columns, uniformFields)`
      that sets `hide: true` on a matching `colId`/`field` and never writes `hide: false`. Verify with
      `npx vitest run src/utils/evaluation/tests/column-variation.spec.ts` from `apps/ai-dial-admin/`.
- [x] 1.2 Add `apps/ai-dial-admin/src/utils/evaluation/tests/column-variation.spec.ts` covering: a
      varying field is not reported uniform; an identical-value field is; a field absent from every
      result is; a single result makes every field uniform; an empty result array reports none; and
      `hideUniformColumns` leaves a non-matching column's object untouched and never un-hides an
      already-hidden one. Verify the file passes and every exported function is exercised.

## 2. Extraction Result grid defaults

- [x] 2.1 In `apps/ai-dial-admin/src/components/Runs/View/utils.ts`, split `staticColumns` so the
      unnamed Details group stays a const and the `Execution` group becomes
      `getExecutionGroup(results)`, applying `hideUniformColumns(executionColumns, getUniformExecutionFields(results))`
      to its children; compose both in `getAnalyticsColumns`. `HTTP` and `Duration` must not be
      eligible. Verify with `npm run typecheck` and the spec in 2.2.
- [x] 2.2 Extend `apps/ai-dial-admin/src/components/Runs/View/tests/utils.spec.ts` for
      `getAnalyticsColumns`: a single-request single-turn fixture leaves `requestIndex`,
      `totalRequests`, `turnIndex` and `totalTurns` hidden; a multi-turn fixture keeps `turnIndex` and
      `totalTurns` visible; a multi-run fixture keeps `runIndex` visible; `http` and `duration` stay
      visible when uniform; `getAnalyticsColumns([])` hides no Execution column; and the other groups'
      defaults are unchanged (`INPUT BINDINGS` still hidden, `EXTRACTED` still visible). Assert with the
      `.filter((col) => !col.hide).map((col) => col.colId)` idiom used in
      `src/constants/grid-columns/tests/sessions-trace-columns.spec.ts`. Verify with
      `npx vitest run src/components/Runs/View/tests/utils.spec.ts`.

## 3. Compare grid wiring

- [x] 3.1 In `apps/ai-dial-admin/src/components/Runs/Compare/ExecutionResults/utils/columns.ts`, pass
      the merged `allResults` through `getUniformExecutionFields` and apply `hideUniformColumns` to
      `getComparedExecutionColumns`' children. Note in the diff that this is currently a no-op — those
      columns already ship `hide: true` and the mapper only hides — and that the point is a single
      shared rule. Verify with `npm run typecheck` and the spec in 3.2.
- [x] 3.2 Extend `apps/ai-dial-admin/src/components/Runs/Compare/ExecutionResults/utils/tests/columns.spec.ts`
      with a case proving the Execution index pairs (`runIndex`/`cmp_runIndex`,
      `requestIndex`/`cmp_requestIndex`, `turnIndex`/`cmp_turnIndex`) stay hidden for rows whose turn
      and request positions vary across both compared runs. Verify with
      `npx vitest run src/components/Runs/Compare/ExecutionResults/utils/tests/columns.spec.ts`.

## 4. Quality checks

- [x] 4.1 From `apps/ai-dial-admin/`, run `npm run lint`, `npm run format`, `npm run typecheck`,
      `npm run typecheck:specs` and `npm run test`, and verify all five pass with no new findings and
      both typecheck gates at zero errors.
