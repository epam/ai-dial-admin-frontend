## Why

Opening a test suite's **Metrics** tab today fires `2 + N` requests for a suite with `N` bound
metrics: one to list the bound metrics, one to list all metric declarations (used only to backfill
each card's description), and one more per bound metric to fetch its `outputSchema`. A new backend
endpoint returns everything the initial render needs — bound metrics plus their nested metric
declaration (with description) and metric declaration version (with `outputSchema`) — in a single
call, so this fan-out is no longer necessary.

## What Changes

- Add a new API client method + server action for
  `GET /api/v1/test-suites/{testSuiteId}/metric-definitions/aggregated` (list variant, no
  `metricId` — the existing `getTestSuiteMetricDetailsWithSchema` is the per-metric counterpart of
  the same URL family), returning a plain array of metrics each carrying a nested
  `metricDeclaration` and `metricDeclarationVersion` (including `outputSchema`).
- Rework the Metrics tab's initial load to call only this new endpoint instead of
  `getTestSuiteMetrics` + one `getTestSuiteMetricDetailsWithSchema` call per bound metric.
- Remove the eager `getDetailedMetricDeclarations()` call from tab mount. The aggregated response's
  nested `metricDeclaration.description` already covers the initial render's description need, so
  that full-declarations listing is no longer needed just to open the tab.
- Fetch the metric declarations listing lazily instead, only when the create/edit metric modal is
  actually opened (both the add flow and the edit flow use the same modal).
- **BREAKING** (internal only): the Metrics tab's initial-load code path no longer depends on
  `getTestSuiteMetrics` or per-metric `getTestSuiteMetricDetailsWithSchema` calls; both API methods
  remain available for other callers (e.g. the modal's per-metric flows) unless found to be
  otherwise unused.

## Capabilities

### New Capabilities
- `test-suite-metrics-tab`: data-fetching and loading behavior for the test suite Metrics tab —
  what is fetched on tab open, what is deferred to modal open, and how loading/error states behave
  around those requests.

### Modified Capabilities
(none — no existing spec currently documents the Metrics tab's fetching behavior)

## Impact

- `apps/ai-dial-admin/src/server/eval/test-suites-api.ts` — new aggregated-list client method.
- `apps/ai-dial-admin/src/app/[lang]/test-suites/actions.ts` — new server action wrapping it.
- `apps/ai-dial-admin/src/models/evaluation/metric.ts` — response type for the new endpoint (likely
  reuses the existing `Metric` shape, since `metricDeclaration`/`metricDeclarationVersion` are
  already modeled as nested `Metric`s).
- `apps/ai-dial-admin/src/components/TestSuites/Metrics/Metrics.tsx` — `loadMetrics` rework; move
  of the declarations-listing fetch to modal-open time.
- `apps/ai-dial-admin/src/components/TestSuites/Metrics/utils.ts` — `mergeMetricsWithDeclarations`
  / `mergeMetricsWithOutputSchemas` become unused for the initial load; kept only if another caller
  (e.g. an optimistic update after create/edit) still needs them, otherwise removed.
- `apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/AddMetricModal.tsx` — now
  triggers its own declarations fetch on open rather than receiving an already-loaded prop.
- No change to `getTestSuiteMetrics` or `getTestSuiteMetricDetailsWithSchema` themselves — both stay
  available for any other caller.
