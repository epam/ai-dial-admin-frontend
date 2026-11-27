## Why

The Test Suite Trends tab grew into a flat ~65-file directory with overlapping evaluation
queries, duplicated chart/KPI markup, and unused model state. The feature is hard to navigate
and easy to break when extending a single card.

## What Changes

- Split Trends into feature-owned folders: `Kpi/`, `OverallScoreTrend/`, `MetricTrends/`,
  `TestCases/`, and `Stability/`, keeping page orchestration and shared models at the root.
- Replace the two parallel `test_case_eval_scores` aggregate queries (avg score + status counts)
  with one combined aggregate fetch that derives both Avg Overall Score buckets and Test Cases
  segments.
- Remove redundant KPI field `latestOverallScore`, parse-time series colors, unused palette
  helpers, and gauge color aliases.
- Extract shared chart score-axis, run-name label, and KPI card-frame primitives; split the
  combined chart-options module into Overall Score and Metric Trends builders.
- Surface Avg Overall Score loading and Stability query failure as distinct UI states instead of
  silent empty/no-data placeholders.
- Keep Stability as a separate row-level query (200-row contract unchanged).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `test-suite-trends`: document the combined test-case aggregate fetch and explicit
  loading/error presentation for Avg Overall Score and Stability.

## Impact

- `apps/ai-dial-admin/src/components/TestSuites/Trends/**` (folder layout + helpers/hooks/UI)
- `apps/ai-dial-admin/src/components/TestSuites/View/View.tsx` (TrendsPreviewRunsBadge import path if moved)
- `apps/ai-dial-admin/src/constants/i18n.ts` and `apps/ai-dial-admin/src/locales/en.ts` (Stability
  load-failed string)
- Unit/component tests co-located under the new feature folders
- No backend API contract change; Stability row query unchanged

## Non-goals

- Do not change Trends-window size, threshold classification rules, or chart visual design beyond
  shared extraction.
- Do not merge Stability into the combined aggregate query.
- Do not add browser verification; coverage is unit/component tests plus quality gates.
