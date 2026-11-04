## 1. Model and resolver

- [x] 1.1 Add `overallScore?: OverallScoreConfig` and `metricScoreAggregation?: string` to `SuiteSnapshot` in
      `models/evaluation/test-suite.ts`, and widen `buildOverallScoreMethodTooltip` and
      `getOverallScoreFormulaLabelKey` to `Pick<TestSuite, 'overallScore'>`. Verify with `npm run typecheck` and the
      existing Trends tooltip specs still passing.
- [x] 1.2 Add `resolveRunScoreMethod(run)` to `Runs/Summary/utils.ts` (no snapshot → `null`; snapshot with
      `overallScore` → it; snapshot without → `{ type: Mean }`). Verify with new cases in
      `Summary/tests/utils.spec.ts` (mean, weighted, function, absent, no snapshot, undefined run).

## 2. Wiring

- [x] 2.1 Change `Cards/OverallScoreInfo.tsx` and `Cards/OverallScoreValue.tsx` to take
      `scoreMethod: OverallScoreConfig | null` instead of `testSuite`, rendering the control only when non-null.
      Verify with `Summary/Cards/tests/OverallScoreInfo.spec.tsx` and `OverallScoreValue.spec.tsx` (each method
      type; null omits the control).
- [x] 2.2 Return `scoreMethod` from `use-run-kpi-cards.ts` and `scoreMethods` (keyed by slot) from
      `use-compare-kpi-cards.ts`, both via the resolver. Verify with `use-run-kpi-cards.spec.ts` and
      `use-compare-kpi-cards.spec.ts`.
- [x] 2.3 Drop the `testSuite` / `primaryTestSuite` / `comparedTestSuite` props from the two `Analytics`
      components and stop passing them from `SummaryTab` and `SummaryOverviewTab` (the header keeps its suite).
      Verify with `npm run typecheck` and the two `Analytics` specs.

## 3. Tests

- [x] 3.1 Add single-run `Analytics` specs: the tooltip shows the stored method even when a different live
      suite is available; a snapshot without `overallScore` shows Mean; a run with no snapshot has no info
      control; the control shows without any suite. Verify with
      `npx vitest run src/components/Runs/Summary/tests/Analytics.spec.tsx`.
- [x] 3.2 Add the compare equivalent: two runs with different stored methods each show their own in the tooltip;
      a run without a snapshot shows no control. Verify with
      `npx vitest run src/components/Runs/Compare/Summary/tests/Analytics.spec.tsx`.

## 4. Verification

- [x] 4.1 Run the `spec-browser-verify` skill for this change's browser-observable scenarios against the local
      app (stack running, auth disabled): a mean run, a weighted-mean run, a run whose snapshot has no
      `overallScore` but which has a run-level overall score, and a run with no snapshot at all, all picked from the
      runs list; resolve any
      `fail` verdict. Verify by a report with no `fail` verdicts.

## 5. Quality gates

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`;
      fix regressions. Verify all exit 0.
