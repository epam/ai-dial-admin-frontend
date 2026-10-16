## Why

On the Run Comparison page, "Flip runs order" only reorders what is drawn: run_a (1, baseline) vs run_b (2)
becomes run_b vs run_a with the "1" and "(baseline)" labels still on run_a, now on the right. Every delta
is still measured as compared − primary, so after a flip Summary Overview badges, the Heat Map Delta mode,
the Execution Results Delta columns and one-sided row highlights all keep their old sign and color while the
run columns beside them swap. The baseline must move with the flip so the page reads consistently.

Separately, the row-details panel's "Diff" counter counts every field of the row, not the fields left
visible by Display > Rows.

## What Changes

- Flip swaps which run is the primary (baseline) run: run_a (1, baseline) vs run_b (2) becomes run_b
  (1, baseline) vs run_a (2). The "1" index and the "(baseline)" label always sit on the left tag.
- The `?runs=` URL is rewritten with the swapped ids, the same way picking a run in the modal already does,
  so a reload or a shared link keeps the flip.
- Every delta, highlight and count is measured from the new baseline, with no per-site flip logic: Summary
  Overview delta badges, the Heat Map Delta mode (values, colors, tooltips), the Execution Results Delta
  columns, one-sided row highlighting (red for baseline-only, teal for compared-only), and the diff legend.
- Flipping behaves like any other change of the compared pair: Display settings reset, an open row-details
  panel closes, and the grid re-merges, so row order follows the new baseline.
- The in-memory-only flip (`isFlipped`, display-order reversal, `swapComparePairColumnState`) is removed.
- The row-details "Diff" counter counts only the fields currently shown in the panel and recalculates when
  Display > Rows changes, in both the bottom and the side panel.

### Non-goals

- No change to how deltas are computed (still compared − baseline, rounded to 3 decimals) or to the
  metric-polarity colors (Overall Score / Test Cases Passed: plus green; run-time and latency: plus red).
- No change to how Metric Scores bars or the merge/match rules work.
- No backend change.

## Capabilities

### New Capabilities
- `run-compare-baseline-flip`: what "Flip runs order" does — the baseline moves with the flip, tags and URL
  follow, and every comparison surface (Summary Overview, Execution Results deltas and highlights, diff
  legend) is measured from the new baseline.

### Modified Capabilities
- `run-compare-heat-map`: Delta mode is measured from the baseline run, so values, colors and tooltips
  recalculate on flip.
- `run-compare-row-details`: the panel's diff count covers only the fields it shows.

## Impact

- `components/Runs/Compare/CompareView.tsx` (flip handler, `isFlipped`, run state, URL replace),
  `Compare/utils.ts` (`getCompareRuns`), `Compare/models.ts` (`CompareRun` doc),
  `use-compare-view-tab-state.ts` and the tab components that load results by run id.
- `ExecutionResults/utils/compare-column-state.ts` (`swapComparePairColumnState`) is deleted.
- `ExecutionResults/RowCompareDetails/CompareRowDetailPanel.tsx` (diff count source).
- No shared component, context, or API route changes; the delta helpers
  (`getMetricDelta`, `getCompareFieldDelta`, `countCompareDiffs`, heat map builders) are unchanged and are
  now correct by construction because the primary slot is always the baseline.
- Open risk: swapping ids refetches run data unless the loaded results are swapped in memory; the design
  decides which.
