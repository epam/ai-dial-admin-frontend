## Why

The run results grid shows each metric's value per test case but not the test case's overall score. To see
how a test case did against the suite threshold, a user has to combine the metric values by hand. The
Summary tab already reports an overall score and a threshold outcome for the run as a whole; the per-test-case
view has nothing equivalent.

## What Changes

- Add an **Overall score** column to the single-run results grid (Extraction result tab), in the
  `EXECUTION` group, visible by default, placed after the position columns and before `HTTP`.
- Each cell shows the test case's overall score. When the run's suite snapshot has a threshold, an
  above/below icon sits next to the value and its tooltip reads, for example, "The test case's overall score
  is above the threshold (0.6)." Without a threshold the value has no icon; without a score the cell shows a
  dash.
- Add the same column to the Run Comparison Execution results grid, one per compared run like `HTTP` and
  `Duration`, **hidden by default** and offered in the columns panel. Cells use the single-run rendering and
  take the existing diff border when the two runs' values differ. A visible Overall score column also counts
  toward "view differences only" and the diff legend.
- Show the same value, with the same above/below icon and tooltip, as an **Overall score** row in the Execution
  section of the row detail panels — the bottom drawer and the right side panel — for a single run and for Run
  Comparison. It is listed in each
  panel's Display configuration and visible by default, so a score visible in the grid is visible in the panels
  too and can be hidden there.
- Fetch the scores with one extra structured query on `test_case_eval_scores` per grid (both run ids in one
  query for Compare), in parallel with the existing results request, and join them to the rows on the client.
  The eval-summaries rows carry no score, so no backend change is needed.

## Capabilities

### New Capabilities

- `run-results-overall-score`: the Overall score column of the run results and Run Comparison grids — its
  value, threshold icon and tooltip, missing-score display, default visibility, alignment and compare diff
  behavior.

### Modified Capabilities

<!-- None. The existing run-results-turn-columns requirements (variation rule, "hidden by default stays in the
     panel", Compare Execution columns hidden) already describe the behavior the new column follows; the new
     column is stated in its own capability instead of editing them. -->

## Impact

- **Data:** one additional `executeStructuredQuery` call per Extraction result tab and per Compare Execution
  results tab. No new server action or API class; the existing `test_case_eval_scores` entity and query
  builders in `utils/structured-query/build` are reused.
- **Code:** `Runs/View/ExtractionResult.tsx`, `Runs/View/utils.ts`, `Runs/View/models.ts`,
  `Runs/View/use-run-view-tab-state.ts`, `Runs/Compare/ExecutionResults/ExecutionResultsTab.tsx`,
  `Runs/Compare/ExecutionResults/utils/columns.ts`, `panel-columns.ts` and `metric-utils.ts`,
  `Runs/Compare/models.ts`, `Runs/grid-column-layout.ts`, `Runs/View/RowDetails/map-grid-col-to-pivot-field.ts`,
  a new cell renderer under `components/Grid/CellRenderers/`, and the i18n files (`constants/i18n.ts`,
  `locales/en.ts`).
- **Shared pieces reused, not changed:** `ChevronBadge`, `formatOverallScore` / `formatThreshold`.
- **Row detail panels:** `Runs/Details/RowDetails` (sections, width tier, grid-column mapping) and both panels
  (`View/RowDetails/ExecutionRowDetailPanel`, `Compare/.../RowCompareDetails/CompareRowDetailPanel`) gain the
  score row; the grid hands each panel the row's score because the detail endpoint does not return it.
- **Other features:** the Heat Map tab, the Summary tab and CSV export are untouched.
  `column-variation.ts` only gets a comment update; its behavior does not change.

## Non-goals

- No backend change and no new eval-summaries field. If the backend later returns a per-row score, the join
  can be dropped without a UI change.
- No grouping of rows by test case, no group summary rows (that is the separate unmerged work in PR #5213).
- No overall score in the CSV export or the Heat Map.
- No filter on the column. Sorting is supported; filtering is not part of the design.
- No per-execution scoring: the score is per test case per run, so a test case with several run numbers
  shows the same value on each of its rows.
