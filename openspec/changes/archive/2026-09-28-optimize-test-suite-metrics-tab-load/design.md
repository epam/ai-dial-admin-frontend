## Context

See `proposal.md` - Why/What Changes for the motivation. Relevant current state:

- `Metrics.tsx`'s `loadMetrics` calls `getTestSuiteMetrics` + `getDetailedMetricDeclarations` in
  parallel, merges declarations in for `description` (`mergeMetricsWithDeclarations`), then fires one
  `getTestSuiteMetricDetailsWithSchema(testSuiteId, metricId)` per bound metric and merges the
  resulting `outputSchema`s in (`mergeMetricsWithOutputSchemas`). Both merge helpers
  (`components/TestSuites/Metrics/utils.ts`) are used only from this one call site.
- `metricDeclarations` (the full declarations listing) is stored in `Metrics.tsx` state and passed as
  a prop to `AddMetricModal.tsx`, which treats `!metricDeclarations` as its own loading state
  (`isMetricDeclarationsLoading`) for the metric-selection step. `AddMetricModal` already owns other
  fetches directly (`getMetricLatestVersion`, `getTestSuiteMetricDetailsWithSchema`) for the
  selection/edit flows, so the existing split — parent fetches the declarations listing, modal fetches
  per-metric detail — is left as-is; only the *timing* of the declarations fetch changes.
- The existing `Metric` interface (`models/evaluation/metric.ts`) already models
  `metricDeclaration?: Metric` and `metricDeclarationVersion?: Metric` as nested `Metric`s (it's used
  today for the single-metric `.../aggregated` response). The new list endpoint's items have the same
  shape, so no new type is needed — the response is `Metric[]`.
- The new endpoint (`GET {suite}/metric-definitions/aggregated`, no `metricId`) is the list sibling of
  the existing per-metric `getTestSuiteMetricDetailsWithSchema` (`GET {suite}/metric-definitions/{metricId}/aggregated`),
  same URL family (`TEST_SUITE_METRICS_URL`).

## Goals / Non-Goals

**Goals:**
- Cut the Metrics tab's initial load to exactly one request regardless of how many metrics a suite has.
- Stop fetching the metric declarations listing until the add/edit modal is opened.
- Keep every current rendering and mutation behavior (cards, `ScoreSettings`, create/update/delete)
  unchanged from the user's perspective.

**Non-Goals:**
- Not changing the modal's own per-metric fetches (`getMetricLatestVersion`,
  `getTestSuiteMetricDetailsWithSchema` for edit) — those are already scoped to modal-open/selection
  time.
- Not touching `AddMetricModal.tsx`/`MetricSelection.tsx` beyond what's needed for the fetch-timing
  change — the two open unmerged branches touching those files (`feat/4441-metrics-table-improvement`,
  `feat/4370-metric-modal-redesign`) are out of scope; this change does not attempt to reconcile with
  them.
- Not removing `getTestSuiteMetrics` or the per-metric `getTestSuiteMetricDetailsWithSchema` from the
  API layer — both are kept as general-purpose methods (the latter is still used by the modal's edit
  flow).

## Decisions

**New API method mirrors the existing per-metric one.** Add
`getTestSuiteMetricsAggregated(id, token): Promise<Metric[] | null>` to `TestSuitesApi`, calling
`GET ${TEST_SUITE_METRICS_URL(id)}/aggregated`, placed next to `getTestSuiteMetricDetailsWithSchema`
since it's the list form of the same URL. A matching `'use server'` wrapper
`getTestSuiteMetricsAggregated(id)` goes in `test-suites/actions.ts`, following the file's existing
one-wrapper-per-method pattern. No new response type: the endpoint returns a plain array, and the
existing `Metric` interface already models the nested `metricDeclaration`/`metricDeclarationVersion`
shape, so the method returns `Metric[] | null` directly (not `MetricResponse`, which wraps paged
listings that this endpoint doesn't paginate).

**`loadMetrics` becomes a single call.** Replace the `Promise.all([getTestSuiteMetrics, getDetailedMetricDeclarations])`
+ per-metric fan-out with one `getTestSuiteMetricsAggregated(testSuiteId)` call, and
`setMetrics(response || [])` directly. `mergeMetricsWithDeclarations` and `mergeMetricsWithOutputSchemas`
have no remaining caller once this lands, so they're deleted along with their tests
(`tests/utils.spec.ts`) rather than left as dead code.

**Declarations fetch moves to an effect keyed on modal-open, guarded to fetch once.** Keep
`metricDeclarations` as `Metrics.tsx` state (unchanged ownership — `AddMetricModal` keeps receiving it
as a prop, matching the existing parent-fetches/modal-consumes split for this particular field). Add
an effect: `if (isAddModalOpen && !metricDeclarations) { getDetailedMetricDeclarations().then(setMetricDeclarations) }`.
The `!metricDeclarations` guard means it fires once per tab visit (first modal open), not on every
subsequent open/close — matching the original's "fetch once, reuse" behavior, just deferred past tab
load. This fires identically whether the modal opens for add or edit, even though today's edit flow
(`isEditMode`) never actually reads `metricDeclarations` (edit starts and stays on the `Configuration`
step; the `AddMetric`/selection step, which is the only consumer, isn't reachable in edit mode). Not
special-casing add-vs-edit keeps the trigger simple (one condition: modal open) and behaviorally
inert for edit today, while staying correct if edit ever grows a "change metric" path back to
selection.

**Description no longer needs the declarations listing.** Metric cards read `metric.description`
directly from the aggregated response's nested `metricDeclaration.description` — no merge step. The
only remaining consumer of the full declarations listing is the modal's metric-selection step.

## Risks / Trade-offs

- **Declarations still refetch each tab visit.** The `!metricDeclarations` guard is per-mount, not
  cross-session-cached, so revisiting the tab (unmount/remount) and opening the modal again repeats
  the fetch. Same characteristic the original code already had (it fetched once per mount too, just
  eagerly instead of lazily) — this change doesn't regress it, and caching across visits is out of
  scope.
- **New endpoint shape assumed to match the example in the proposal.** If the deployed backend's
  `/aggregated` list response diverges from the documented example (e.g. omits a field the cards
  render), that surfaces as a rendering gap rather than a type error, since `Metric`'s fields are
  mostly optional. Mitigated by verifying against a real backend response during implementation
  rather than trusting the example alone.

## Migration Plan

Single-PR change, no data migration or feature flag: the old per-metric/declarations calls stay
available in the API layer for any other caller, so this is a pure call-site swap in the Metrics tab
with no rollout sequencing needed. Rollback is reverting the PR.
