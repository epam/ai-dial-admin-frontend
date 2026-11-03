## Why

The Overall Score card's "Calculation method" tooltip is built from the **live** test suite, so editing the
suite's method after a run was evaluated rewrites what the tooltip says about that run. The earlier design
assumed the run's suite snapshot does not carry the method; that was based on this repo's `SuiteSnapshot` type,
which simply never declared it. The backend does store it: every run created from 2026‑07‑29 onward has
`suiteSnapshot.overallScore` (`mean`, `weighted_mean` with weights, or `custom_function` with its expression), in
the same shape the tooltip already reads.

## What Changes

- Declare `overallScore` (and `metricScoreAggregation`) on the `SuiteSnapshot` type.
- The info tooltip describes the method **stored on the run**, on both the single-run strip and the Run
  Comparison strip (each compared run shows its own).
- The info control no longer waits for, or depends on, the live suite request.
- Older runs: a run whose snapshot has no `overallScore` shows the default **Mean**. That covers runs created
  before the method was configurable and runs of a suite that never had one set; the app already reads an unset
  suite method as Mean everywhere. A run with **no snapshot at all** omits the info control instead of guessing.
- Correct the requirement wording that said the method comes from the current suite.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `run-summary-kpi-cards`: the Overall Score card (and the compare strip's per-run info control) describe the
  run's stored calculation method, with the older-run fallbacks above.

## Impact

- `apps/ai-dial-admin/src/models/evaluation/test-suite.ts` (`SuiteSnapshot`)
- `apps/ai-dial-admin/src/components/TestSuites/Trends/Kpi/utils/overall-score-method-tooltip.tsx` and
  `TestSuites/Metrics/ScoreSettings/utils.ts` (accept just the method, not a whole suite)
- `apps/ai-dial-admin/src/components/Runs/Summary/` — `Cards/OverallScoreInfo.tsx`, `Cards/OverallScoreValue.tsx`,
  `Analytics.tsx`, `SummaryTab.tsx`, `use-run-kpi-cards.ts`, a small method-resolution util
- `apps/ai-dial-admin/src/components/Runs/Compare/Summary/` — `Analytics.tsx`, `SummaryOverviewTab.tsx`,
  `use-compare-kpi-cards.ts`
- Co-located specs; no backend change; the Trends tooltip is untouched

## Non-goals

- The Trends "Overall Score of Latest Run" tooltip keeps describing the suite as it is now.
- No change to how the score itself, the threshold, or the metric count are obtained (threshold and metric
  snapshots are already per run).
- The live suite is still fetched for the run header (suite name); only the info control stops using it.
- Not gating on `snapshotVersion`: old and new runs both report version 2.
