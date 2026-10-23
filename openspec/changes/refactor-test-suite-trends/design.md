## Context

Trends currently loads evaluation queries after `runOrder` is known: a combined test-case status
aggregate and Stability rows. UI primitives (score Y-axis, vertical run labels, KPI card chrome) are
copied across cards. See `proposal.md` for motivation and `specs/test-suite-trends/spec.md` for the
behavior contract.

## Goals / Non-Goals

**Goals:**
- Make each Trends section discoverable by folder ownership (component + hook + utils + tests).
- Cut one network round-trip by combining previously separate status aggregates into one fetch for
  pass / completion rate and Test Cases segments.
- Remove dead/redundant model and palette state.
- Deduplicate shared presentation without changing Figma-facing visuals.
- Show loading for PassRateCard and a distinct error for Stability failures.

**Non-Goals:**
- Do not redesign Trends layout or chart aesthetics.
- Do not change Stability’s 200-row row-query contract.
- Do not introduce barrel/`index.ts` re-export files.
- Do not add browser verification.

## Decisions

### Feature folders mirror the Trends page sections
`Kpi/`, `OverallScoreTrend/`, `MetricTrends/`, `TestCases/`, `Stability/` own their UI, hooks, and
pure helpers. Root keeps `Trends.tsx`, `TrendsPreviewRunsBadge`, `use-trends-data`, shared
`constants`/`models`, `parse-trends`, metric-scores query, and shared format/score-axis helpers.
`LatestRunCard` lives under `TestCases/` because it consumes the same segments.

**Alternative considered:** One folder per card. Rejected: too granular versus project patterns in
`Runs/Compare` and `Analytics/Usage`.

### One combined aggregate for pass rate + Test Cases segments
Group by `run_id`, `execution_status`, `passed`; select `count`. Derive `RunTestCaseSegments` by
counting rows into above/below/errorOrNa. Preserve empty-segment fallback to overall score on a
successful empty response (not on query failure).

**Alternative considered:** Keep two queries. Rejected: duplicate latency for the same run window.

### Explicit loading/error states
Pass combined-eval `isLoading` into `PassRateCard` (loader while the aggregate is pending). Surface
Stability `hasError` with a localized failure message (`role="alert"`) instead of `DialNoDataContent`.

### Chart-options split + shared score axis
Move Overall Score builders next to `OverallScoreTrend/`, Metric builders next to `MetricTrends/`,
and keep shared ticks/label-width/`formatMetricTrendYTick` at Trends root for both cards’
external Y-axis markup (`TrendScoreAxis`).

## Risks / Trade-offs

- [Large move churn in git] → Prefer `git mv`-style moves, update `@/` imports in the same change.
- [Stability error copy is new UX] → Reuse Trends i18n section; keep message short and alert-role.

## Migration Plan

No persisted-data or API migration. Deploy with the frontend; rollback reverts the folder layout and
query consolidation.
