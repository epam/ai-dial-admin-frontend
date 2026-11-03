## 1. Data layer

- [x] 1.1 Confirm the eval structured-query endpoint accepts `sum` on `eval_summaries.exec_duration_ms` and
      `metric_eval_duration_ms` (contract in `ai-dial-admin-backend`, or one live call on the local stack).
      If rejected, record the `avg × count` fallback in `design.md` Risks and use it in 1.2. Verify by the note
      added to `design.md` (or an explicit "confirmed" line).
      **Confirmed:** the Run Summary Total Runtime card rendered `sum`-based figures against the live
      backend, so no `avg × count` fallback was needed.
- [x] 1.2 In `Runs/Summary/utils.ts` replace `buildAvgRunTimeQuery` / `buildAvgMetricEvalDurationQuery` with
      `buildTotalRunTimeQuery` / `buildTotalMetricEvalDurationQuery`, both taking `excludeEvalSummaryIds`;
      rename `formatAvgRunTimeSeconds` → `formatRunTimeSeconds`; add `sumRunTimeParts` (null only when both
      parts are null). Keep `AVG_*` constants (Trends still imports them). Verify with updated
      `Summary/tests/utils.spec.ts` (sum shape, exclusion filter, rounding, both-null).
- [x] 1.3 Add `unscored` to `TestCaseStatusCounts` (`Common/PassFailStatus/models` →
      `Runs/Summary/models`) and fill it in `parseTestCaseStatusCounts`; add `toCompletionBreakdown(counts,
      hasThreshold)` and `getRatePercent` in `Runs/Summary/utils.ts` per design decision 2. Verify with unit
      tests for threshold on/off, unscored SUCCESS, zero total, error-only runs.
- [x] 1.4 Update `RunAnalyticsSlice` (`totalRunTimeMs`, `totalMetricEvalDurationMs`),
      `use-run-analytics-slice.ts`, and `toMatchedAnalyticsSlice` / matched queries in
      `Compare/Summary/use-summary-overview-data.ts` so matched-only runtime uses the exclusion ids. Verify
      with `use-summary-overview-data.spec.ts` (matched-only passes the unmatched ids to both sum queries).
- [x] 1.5 Switch `use-run-costs.ts` to `getRunsTotalCosts([runId])`, normalising to `{ sourceCost,
      metricsCost }`; `hasRunCostFigure` = either part finite; keep polling, stale-read and `canHaveCosts`
      behaviour unchanged. Remove `getRunCosts` (action, API method, `RunCosts` type, tests) if grep shows no
      other caller. Verify with `use-run-costs.spec.ts` covering null, `[]`, entry-with-nulls, figures, throw,
      and the 12 h single-read case.
- [x] 1.6 Extract `useRunCostState(run, metricSnapshotCount)` from `Runs/Summary/Analytics.tsx` (eligibility +
      pending/error/dash derivation incl. the zero-metrics Metrics-value rule). Verify with a hook spec
      covering in-progress, MCP/Route, unpriced model, stale run, zero metrics, unknown metric count.
- [x] 1.7 Widen `resolveSuiteSourceKind` / `useSourceKindLabel` parameter type to the
      `deploymentRef | mcpDeploymentRef | routesRef` pick so a `SuiteSnapshot` passes. Verify `npm run
      typecheck` plus the existing source-kind spec still passing.

## 2. Shared UI pieces

- [x] 2.1 Extract `Common/PassRateBar` (percent, colour rule ≥70 / 40–69 / <40, `role="progressbar"`, named by
      a label prop) and move `passRateBarColor` / `formatPassRatePercent` beside it; resolve colours via
      tokens or one named-constant block (design decision 6). Switch Trends `PassRateCard` to it with no
      visual change. Verify with `PassRateBar.spec.tsx` (boundaries 39.9 / 40 / 69.9 / 70, aria) and the
      unchanged Trends `PassRateCard.spec.tsx`.
- [x] 2.2 Add i18n keys (`RunsI18nKey`: `TestCasesCompleted`, `ThresholdPassRate`, `CompletionRate`,
      `TotalRuntime`, `TotalRunCost`, `BasedOnCompletedTestCases`, plus missing tooltip labels) in
      `constants/i18n.ts` and `locales/en.ts`, reusing existing Trends/TestSuites keys where the copy is
      identical. Verify by `npm run typecheck` and a grep that every new key is referenced.

## 3. Per-run card content components (`Runs/Summary/Cards/`)

- [x] 3.1 `TestCasesCompletedValue`: `completed /total`, Error line, focusable value with the breakdown
      tooltip (rows hidden for Above/Below without a threshold), optional run-name header. Verify with a
      component spec (counts, threshold on/off, focus opens tooltip, zero total).
- [x] 3.2 `PassRateValue`: percentage + `PassRateBar` + `Threshold: <value>` line only with a threshold; em
      dash and no bar for zero total. Verify with a component spec.
- [x] 3.3 `OverallScoreValue`: three-decimal score, `ChevronBadge` only with a threshold (inclusive),
      focusable value with above/below tooltip and an accessible state label, info `<button>` with
      `buildOverallScoreMethodTooltip` (omitted when no suite), `isInfoInline` for compare. Verify with a
      component spec (above, exactly at threshold, below, no threshold, no suite, each method type).
- [x] 3.4 `RuntimeBreakdownValue` and `CostBreakdownValue`: total + `<Source type>:` / `Metrics:` lines,
      per-part em dash, Calculating label with expectation copy, Error/dash handled by the card. Verify with
      component specs (both parts, one part null, zero cost `$0`, pending, source-type fallback).

## 4. Single-run strip

- [x] 4.1 Rewrite `Runs/Summary/Analytics.tsx` to the five-card strip using the Cards components,
      `useRunCostState` and the slice; keep the strip spinner, Overall Score omission, error/dash rules for
      incomplete statuses; pass `testSuite` from `SummaryTab`. Remove the old time/cost/passed cards. Verify
      by rewriting `Summary/tests/Analytics.spec.tsx` for order, titles with/without threshold, absent
      Overall Score, states, and the no-longer-present cards.

## 5. Compare strip

- [x] 5.1 Expose per-run metric counts (and both test suites / runs) from `use-summary-overview-data.ts` and
      thread them through `SummaryOverviewTab` into `Compare/Summary/Analytics.tsx`. Verify with
      `use-summary-overview-data.spec.ts` and `SummaryOverviewTab.spec.tsx`.
- [x] 5.2 Rewrite `Compare/Summary/Analytics.tsx` to five dual-run cards with the Cards components, per-run
      `useRunCostState`, diff badges (completed count, rate points, score, runtime seconds, cost dollars)
      with the polarity from the spec, mixed-threshold handling, and cost ignoring the matching-only toggle.
      Apply the delta-badge fallback from design decision 1 if the kit cannot format `$` prefix / three
      decimals. Verify by rewriting `Compare/Summary/tests/Analytics.spec.tsx` (layout, deltas, flip
      polarity, mixed thresholds, one run calculating, one run without metrics cost, matched-only scope).

## 6. Cleanup

- [x] 6.1 Delete `PassFailFraction` / `PassFailStatusBreakdown` (+ constants, models, specs) and unused Runs
      i18n keys after grep shows no remaining callers. (The `run-summary-cost-cards` Purpose line still names
      the two old cards; it is not part of a delta, so edit it when the change is archived.) Verify with `npm run typecheck`, `npm run typecheck:specs` and a grep for the removed names.

## 7. Quality gates

- [x] 7.1 Run the focused Vitest files from `apps/ai-dial-admin/`, then `npm run lint`, `npm run format`,
      `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; fix regressions. Verify all exit 0.

> No browser verification task, by explicit user choice. The unit and component tests above cover the
> deterministic contracts; the scenarios are not exercised against the running app.
