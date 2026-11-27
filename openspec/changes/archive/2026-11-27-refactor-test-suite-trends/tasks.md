## 1. OpenSpec contract

- [x] 1.1 Keep proposal/design/delta/tasks aligned with the folder split, combined aggregate, and
      loading/error presentation (this change).

## 2. Feature folders

- [x] 2.1 Move Trends files into `Kpi/`, `OverallScoreTrend/`, `MetricTrends/`, `TestCases/`, and
      `Stability/` with co-located tests; keep root orchestration, shared models/constants, metric
      scores query/parser, and shared format helpers. Update `@/` imports (no barrels).

## 3. Data consolidation

- [x] 3.1 Replace avg-score + status aggregate builders/hooks with one combined query + parser +
      hook returning buckets and segments; preserve null-ERROR weighting and empty-segment fallback.
- [x] 3.2 Remove `latestOverallScore`, parse-time `TREND_SERIES_COLORS` assignment, unused
      `getTrendTagEntry`, and gauge color aliases that duplicate segment hex.
- [x] 3.3 Wire Avg Overall Score loading and Stability `hasError` into UI with a new i18n key for
      Stability load failure.

## 4. UI / helper deduplication

- [x] 4.1 Split chart-options into Overall Score and Metric Trends modules; extract shared
      score-axis constants/component and shared run-name label helper.
- [x] 4.2 Extract KPI card frame; centralize Test Cases legend/label helpers; split `RunBar` into
      its own file; move interfaces out of constants/utils into models.

## 5. Tests

- [x] 5.1 Relocate existing specs; add combined-query/parser coverage; update parse-trends tests;
      cover Avg loading and Stability failure UI.

## 6. Quality gates

- [x] 6.1 Run focused Trends Vitest, `npm run typecheck`, `npm run typecheck:specs`, lint, format,
      and tests; fix regressions.

> Browser verification task omitted by explicit user choice. Unit/component tests cover the
> deterministic contracts; a browser task would require a local stack running with auth disabled.
