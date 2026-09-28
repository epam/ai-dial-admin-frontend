## 1. API layer for the aggregated list endpoint

- [x] 1.1 Add `getTestSuiteMetricsAggregated(id, token): Promise<Metric[] | null>` to `TestSuitesApi`
      (`src/server/eval/test-suites-api.ts`), calling `GET ${TEST_SUITE_METRICS_URL(id)}/aggregated`,
      next to `getTestSuiteMetricDetailsWithSchema`. Add a test in
      `src/server/eval/tests/test-suites-api.spec.ts` mirroring the existing
      `getTestSuiteMetricDetailsWithSchema` test (asserts the URL called). Verify with
      `npx vitest run src/server/eval/tests/test-suites-api.spec.ts`.
- [x] 1.2 Add the `'use server'` wrapper `getTestSuiteMetricsAggregated(id)` to
      `src/app/[lang]/test-suites/actions.ts`, following the existing wrapper pattern (resolve token
      via `getUserToken`, delegate to `testSuitesApi`). Add a test in
      `src/app/[lang]/test-suites/actions.spec.ts` mirroring the existing `getTestSuiteMetrics` test.
      Verify with `npx vitest run src/app/[lang]/test-suites/actions.spec.ts`.

## 2. Rework the Metrics tab's initial load

- [x] 2.1 In `src/components/TestSuites/Metrics/Metrics.tsx`, replace `loadMetrics`'s
      `Promise.all([getTestSuiteMetrics, getDetailedMetricDeclarations])` + per-metric
      `getTestSuiteMetricDetailsWithSchema` fan-out with a single
      `getTestSuiteMetricsAggregated(testSuiteId)` call, setting `metrics` directly from its result
      (`response || []`). Remove the now-unused imports (`getTestSuiteMetrics`,
      `getDetailedMetricDeclarations`, `getTestSuiteMetricDetailsWithSchema`,
      `mergeMetricsWithDeclarations`, `mergeMetricsWithOutputSchemas`) from this file. Verify with
      `npx vitest run src/components/TestSuites/Metrics/tests/Metrics.spec.tsx` after updating its
      mocks to the new action (task 4.1).
- [x] 2.2 Move the `metricDeclarations` fetch (`getDetailedMetricDeclarations`) out of `loadMetrics`
      into its own effect gated on `isAddModalOpen`, guarded to fetch only when
      `metricDeclarations` is not already loaded (`if (isAddModalOpen && !metricDeclarations)`), so it
      fires once per tab visit at modal-open time instead of eagerly at tab-open time. Verify by
      running the same `Metrics.spec.tsx` suite and confirming it asserts the declarations action is
      not called until the modal opens.
- [x] 2.3 Delete `mergeMetricsWithDeclarations` and `mergeMetricsWithOutputSchemas` from
      `src/components/TestSuites/Metrics/utils.ts` (no remaining caller after 2.1), and remove their
      cases from `src/components/TestSuites/Metrics/tests/utils.spec.ts`, keeping the
      `formatBindingValue`/`getBindingDisplayValue` tests intact. Verify with
      `npx vitest run src/components/TestSuites/Metrics/tests/utils.spec.ts`.

## 3. Update the metric model comment/typing if needed

- [x] 3.1 Confirm `Metric` (`src/models/evaluation/metric.ts`) already covers the aggregated list
      item shape (nested `metricDeclaration`/`metricDeclarationVersion`, `configBindings`,
      `inputBindings`) with no changes needed; if a field is missing, add it with the same
      declaration-vs-aggregated grouping the file already uses. Verify with
      `npm run typecheck` (`apps/ai-dial-admin`).

## 4. Test updates for the new fetch flow

- [x] 4.1 Update `src/components/TestSuites/Metrics/tests/Metrics.spec.tsx`: mock
      `getTestSuiteMetricsAggregated` instead of `getTestSuiteMetrics` +
      `getDetailedMetricDeclarations` + `getTestSuiteMetricDetailsWithSchema` for the initial-load
      cases, and add/adjust cases covering: a single aggregated request on tab open for a suite with
      bound metrics, the no-metrics render when the aggregated response is empty, no declarations
      request fired on tab open, and a declarations request fired (once) when the add/edit modal
      opens. Verify with `npx vitest run src/components/TestSuites/Metrics/tests/Metrics.spec.tsx`.
- [x] 4.2 Update `apps/ai-dial-admin/test-setup.tsx` if it centrally mocks any of the removed/added
      test-suites actions (`getTestSuiteMetricsAggregated` needs a mock entry if the action module is
      mocked there). Verify by running the full Metrics test directory:
      `npx vitest run src/components/TestSuites/Metrics`.

## 5. Final quality checks

- [x] 5.1 Run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test` from
      `apps/ai-dial-admin` and confirm all pass with zero errors.
