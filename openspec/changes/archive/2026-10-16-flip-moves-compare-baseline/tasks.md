Browser verification task intentionally omitted (declined); the scenarios are covered by the unit and
component tests in group 4.

## 1. Flip moves the baseline

- [x] 1.1 In `components/Runs/Compare/CompareView.tsx`, extract the "set primary/compared state + `router.replace(getCompareRunsUrn(...))`" tail of `onApplySelectRun` into one helper used by both the modal apply and flip. Verify the existing modal-apply tests in `tests/CompareView.spec.tsx` still pass.
- [x] 1.2 Make `onFlipRuns` call that helper with the ids swapped, and remove `isFlipped`, its `setIsFlipped` call and the `swapComparePairColumnState` call from `CompareView.tsx`. Verify flipping `a`,`b` calls `router.replace` with the `b,a` compare URL and renders `b` as the "1 … (baseline)" tag.
- [x] 1.3 Drop the `isFlipped` parameter from `getCompareRuns` in `components/Runs/Compare/utils.ts`, and rewrite the "reordering the list is all a flip does" doc comments in it and in `Compare/models.ts`. Verify `npm run typecheck` is at zero.
- [x] 1.4 Delete `ExecutionResults/utils/compare-column-state.ts` and `ExecutionResults/utils/tests/compare-column-state.spec.ts`. Verify nothing references `swapComparePairColumnState` (grep) and `npm run typecheck` is at zero.

## 2. Row-details Diff counter

- [x] 2.1 In `ExecutionResults/RowCompareDetails/CompareRowDetailPanel.tsx`, compute `counts` from `displaySections` instead of `sections` (and reorder the hooks so `displaySections` is defined first). Verify the Diff counter in both the bottom and the side panel counts only the fields left enabled in Display > Rows.

## 3. Specs

- [x] 3.1 Sync the delta specs into `openspec/specs/` (`run-compare-baseline-flip` new, `run-compare-heat-map` and `run-compare-row-details` modified) via the archive step, and confirm `openspec validate flip-moves-compare-baseline` passes.

## 4. Tests

- [x] 4.1 Update `Compare/tests/utils.spec.ts` for the one-argument-shorter `getCompareRuns`: always `[primary index 1 baseline, compared index 2]`. Verify the spec passes.
- [x] 4.2 In `Compare/tests/CompareView.spec.tsx`, replace the display-order flip tests with: flip rewrites the URL with swapped ids, the "1 (baseline)" tag moves to the other run, flipping twice restores the original, and an open row panel closes on flip. Verify `npx vitest run src/components/Runs/Compare/tests/CompareView.spec.tsx` passes.
- [x] 4.3 In `ExecutionResults/RowCompareDetails/tests/CompareRowDetailPanel.spec.tsx`, add: with one metric group enabled the Diff counter counts only that group; re-enabling a group raises it; bottom and side panels agree. Verify the spec passes.
- [x] 4.4 Confirm the delta consumers need no change by adding one swapped-input case each to `Summary/tests/Analytics.spec.tsx` (Overall Score sign and color after swapping primary and compared), `HeatMap/utils/tests/build-heat-map-rows.spec.ts` (delta sign) and `ExecutionResults/utils/tests/metric-utils.spec.ts` (the shared `getMetricDelta` / `getCompareFieldDelta` behind the Delta columns and highlights). Verify each spec passes.

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; verify all pass with the typecheck gates at zero.
