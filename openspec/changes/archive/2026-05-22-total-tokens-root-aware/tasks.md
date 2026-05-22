## 1. SingleValueChart prop

- [x] 1.1 Add `getValue?: (data: TelemetryData) => number` to `Props` in `apps/ai-dial-admin/src/components/Telemetry/Dashboards/Values/SingleValueChart.tsx`.
- [x] 1.2 Default the `getValue` prop to `getSingleValueChartData` via destructure (`getValue = getSingleValueChartData`) and call it directly: `setData(getValue(response.response as TelemetryData))`.
- [x] 1.3 Confirm the three existing call sites (Unique Users, Request Count, Money) compile without changes.

## 2. getTotalTokensFromTree helper

- [x] 2.1 In `apps/ai-dial-admin/src/utils/telemetry.ts`, import `buildEntitiesConsumptionTree` from `./entities-consumption-tree` and `EntityRow` from `@/src/models/telemetry`.
- [x] 2.2 Add and export:
  ```ts
  export const getTotalTokensFromTree = (data: TelemetryData): number => {
    const rows = getGridData(data) as EntityRow[];
    const roots = buildEntitiesConsumptionTree(rows);
    return roots
      .reduce(
        (acc, r) => acc.plus(r.prompts || 0).plus(r.completions || 0),
        new Big(0),
      )
      .toNumber();
  };
  ```
- [x] 2.3 Verify imports and types compile.

## 3. ChartsDashboard wiring

- [x] 3.1 In `apps/ai-dial-admin/src/components/Telemetry/Dashboards/View/ChartsDashboard.tsx`, replace `TOTAL_TOKENS_QUERY` with `ENTITY_CONSUMPTION_TREE_QUERY` and add `getValue: getTotalTokensFromTree` on the Total Tokens config entry.
- [x] 3.2 Pass `getValue` through to `SingleValueChart` when present (extend the destructure + render in the `.map(...)`).
- [x] 3.3 Confirm the other three entries render unchanged.

## 4. Dead-code cleanup

- [x] 4.1 Remove `TOTAL_TOKENS_QUERY` from `apps/ai-dial-admin/src/constants/telemetry.tsx`.
- [x] 4.2 Repo-wide search for any remaining `TOTAL_TOKENS_QUERY` references — should be zero.

## 5. Tests

- [x] 5.1 In `apps/ai-dial-admin/src/utils/tests/telemetry.spec.tsx`, add a `describe('Utils :: telemetry :: getTotalTokensFromTree')` block with scenarios mirroring the spec:
  - empty data → `0`
  - single real root row → `prompts + completions`
  - orchestrator + child (real chain) → root tokens only, child not double-counted
  - synthetic root (child whose declared parent row is missing) → child tokens counted via synthetic
  - mixed: two real roots + one synthetic root summed together; non-root children excluded
  - large numbers (near or above `Number.MAX_SAFE_INTEGER`) preserved by `Big`
  - `parent_deployment === 'undefined'` sentinel still treated as root
- [x] 5.2 Reuse the row-fixture shapes from `entities-consumption-tree.spec.ts` to keep test data consistent.
- [x] 5.3 Add a `SingleValueChart` test that confirms `getValue` (when supplied) is invoked in place of `getSingleValueChartData`.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`; resolve any issues. (ESLint clean on touched files; pre-existing `any` warning in `constants/telemetry.tsx:23` unchanged.)
- [x] 6.2 Run `npm run test`; expect no regressions in `telemetry.spec.tsx`, `EntitiesConsumptionTree.spec.tsx`, or `Dashboard.spec.tsx`. (vitest: 64 + 31 passed, 0 failed.)
- [x] 6.3 ~Manual: open Dashboard → confirm Total tokens equals the sum of root rows visible in the Entities Consumption tree below.~ Skipped per user direction — unit tests cover the math.
- [x] 6.4 ~Manual: open Dashboard with no analytics data → Total tokens shows `0` (matches no-data behavior of the other cards).~ Skipped per user direction — covered by `returns 0 for empty data` unit test.
