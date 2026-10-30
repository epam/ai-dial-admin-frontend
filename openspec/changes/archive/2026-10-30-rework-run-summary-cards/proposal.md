## Why

The Run Summary and Run Comparison Summary tabs still show the old KPI strip: two time cards (Avg Test Case
Run Time, Avg Metric-Eval Latency), two cost cards (Test Case LLM Cost, Metric-Eval Cost) and one combined
"Test Cases Passed Threshold" card. A new design (single run + compare) replaces them with five cards that
match the Test Suite Trends KPI strip: Total Runtime, Total Run Cost, a richer Overall Score, Test Cases
Completed and a Threshold Pass Rate / Completion Rate card. Compare also gains a cost card it never had.

## What Changes

- **Single run strip** becomes: Test Cases Completed · Threshold Pass Rate (or Completion Rate when the suite
  has no threshold) · Overall Score · Total Runtime · Total Run Cost.
- **Total Runtime** replaces the two time cards: a total in seconds with `<Source type>` and `Metrics`
  breakdown values underneath. Runtime values become true totals (sum of per-test-case durations) instead of
  per-test-case averages.
- **Total Run Cost** replaces the two cost cards: a total with `<Source type>` and `Metrics` cost underneath.
  Calculating / Error / dash states carry over; when only the metrics cost is absent, only the metrics value
  shows a dash. Costs switch from the averages endpoint to the run totals endpoint.
- **Overall Score** card: three-decimal score, an above/below-threshold glyph (only when the suite has a
  threshold) with a hover tooltip on the score, a static "Based on completed test cases" footer and an info
  control whose tooltip describes the suite's calculation method (Mean / Weighted mean / Specific function).
- **Test Cases Completed** (new): `completed / total`, an Error count line, and a hover tooltip with the
  Total / Completed / Above threshold / Below threshold / Error-or-N/A breakdown. Replaces the pass/fail/error
  breakdown of the old card, which was only shown for suites with a threshold; the new card is always shown.
- **Threshold Pass Rate / Completion Rate** (new): percentage, a progress bar coloured green ≥ 70 %,
  yellow 40–69 %, red < 40 %, and a `Threshold: <value>` footer only when a threshold is set.
- **Compare summary** gets the same five cards in the dual-run layout with a diff badge on every card
  (second run minus baseline). The Overall Score info control moves beside each score value; the
  "Based on completed test cases" label stays below.
- Reuse the Trends KPI building blocks (`ChevronBadge`, overall-score method tooltip, pass-rate colouring,
  source-kind label) rather than re-creating them; extract the pass-rate bar into `Common/` so Trends and
  Runs share it.
- Remove the superseded cards' i18n keys, the avg-based runtime queries and any pass/fail breakdown components
  left without callers.

## Capabilities

### New Capabilities

- `run-summary-kpi-cards`: the five KPI cards of the Run Summary strip and of the Run Comparison Summary
  strip — content, formatting, states, tooltips, diff badges and polarity.

### Modified Capabilities

- `run-summary-cost-cards`: the two cost cards become one Total Run Cost card (total + source/metrics
  breakdown, totals endpoint); the metrics-only dash replaces the "Metric-Eval Cost settles independently"
  requirement.
- `run-compare-baseline-flip`: the "every delta is measured from the baseline" requirement names the new
  cards and their polarity (Total Runtime / Total Run Cost lower-is-better).

## Impact

- `apps/ai-dial-admin/src/components/Runs/Summary/**` (Analytics, utils, constants, models, slice and cost
  hooks, new card components)
- `apps/ai-dial-admin/src/components/Runs/Compare/Summary/**` (Analytics, `use-summary-overview-data`,
  SummaryOverviewTab props: test suites, metric counts)
- `apps/ai-dial-admin/src/components/Common/**` (new shared pass-rate bar; `PassFailFraction` /
  `PassFailStatusBreakdown` removed if orphaned)
- `apps/ai-dial-admin/src/components/TestSuites/Trends/Kpi/PassRateCard.tsx` and its pass-rate util
  (adopt the shared bar; no visual change)
- `apps/ai-dial-admin/src/server/eval/runs-api.ts`, `src/app/[lang]/runs/actions.ts`, `src/models/evaluation/run.ts`
  (`getRunCosts` / `RunCosts` removed if no caller remains; `getRunsTotalCosts` becomes the Summary source)
- `apps/ai-dial-admin/src/constants/i18n.ts` and `src/locales/en.ts`
- Co-located unit/component tests; existing Summary/Compare specs rewritten for the new cards
- Backend: no new endpoint, but the eval structured-query endpoint must accept `sum` on
  `eval_summaries.exec_duration_ms` / `metric_eval_duration_ms` (see design, Risks)

## Non-goals

- Test Suite Trends cards keep their current data (they still derive "Total Runtime" from averages); aligning
  them with the true-total runtime used here is a follow-up.
- No change to Metric Scores, Distribution, the Runs list, or Execution Results.
- The cost-polling rules (which runs are never polled, the 12 h stale rule, `COST_FETCH_MAX_WAIT_MS`) are
  unchanged; only what the cards render changes.
- No new backend endpoints and no suite-snapshot schema change (see design on the calculation-method source).
- No dark/light theme or token changes.
