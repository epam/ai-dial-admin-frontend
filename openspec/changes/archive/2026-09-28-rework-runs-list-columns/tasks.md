## 1. Grid sizing primitives

- [x] 1.1 ~~Add an `autoSizeStrategy` prop to `AgGridWrapper` / `GridView` so both runs surfaces can pass `{ type: 'fitCellContents', colIds: [...] }`~~ — reverted at the user's request: widths are configured per column instead, and `AgGridWrapper` keeps its original `!storageKey ? { type: 'fitGridWidth' } : void 0`
- [x] 1.2 Stop persisting grid-computed widths: in `AgGridWrapper.tsx`, make `handleStateUpdated` ignore `columnResized` events whose `source` is `autosizeColumns` while leaving `uiColumnResized` / `uiColumnDragged` persisting (spec: `grid-column-selection`)

## 2. Shared cell renderers

- [x] 2.1 Add `TitleSubtitleCellRenderer` in `apps/ai-dial-admin/src/components/Grid/CellRenderers/` — `flex flex-col min-w-0`, no horizontal padding, `dial-small-text text-primary` title over `dial-tiny-text text-secondary` subtitle, each line independently truncated via ui-kit `EllipsisTooltip` (2.0, not `DialEllipsisTooltip`); no `rowHeight` change
- [x] 2.2 Add a label-less variant to `apps/ai-dial-admin/src/components/Common/RunStatus/RunStatus.tsx` (indicator only, label in a tooltip on **both** the transitional and settled branches, label kept as the cell's accessible name via `sr-only` text); leave the visible-label output used by `Runs/Summary/Header.tsx` unchanged
- [x] 2.3 Leave the Status column on the grid's default header so its name and sort control render, keep it pinned to the indicator width (`width` / `minWidth` / `maxWidth`, with `headerTooltip` for the truncated label), and give it an empty floating-filter body so the filter row keeps only its filter button, centred in the cell
- [x] 2.4 Extend `apps/ai-dial-admin/src/components/Grid/CellRenderers/TagsCellRenderer.tsx` so the `+N` badge exposes the hidden names on hover **and** by keyboard; fix the rules-of-hooks early return and the duplicated `setItemRef` / `hiddenCountRef` assignments only if the change touches those lines
- [x] 2.5 Add the Duration and Cost / Overall score cell presentation — derive duration from `startedAt` / `completedAt` (null unless both present and the delta is finite and non-negative, mirroring `TestSuites/Trends/utils/parse-trends.ts`), reuse `formatRunCost` from `components/Runs/Summary/utils.ts`, and render a missing-value indication rather than `0` / `$0` (reference: `MetricScoreCellRenderer`)

## 3. Mock data module

- [x] 3.1 Add `apps/ai-dial-admin/src/components/Runs/mocks/run-list-mock-data.ts` — deterministic values seeded off `run.id` (never `Math.random()`), one exported function per mock-backed column (target entity + kind, metric names, cost, overall score), with a file-level comment naming it as the temporary stand-in and the real source for each column
- [x] 3.2 Add fixtures covering 0 / 1 / ~12 metric names, absent cost, absent score, and a `RUNNING` run with neither

## 4. Reworked column set

- [x] 4.1 Rework `RUNS_COLUMN` in `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` to the 12 columns in spec order — Status first (fixed width, `minWidth` below the global 150), combined `Test case run name`, renamed `Runs` / `Test cases`, `Created date` removed, `Test Suite ID` visible, and the new Target / Metrics / Duration / Cost / Overall score columns reading their mocks through `valueGetter` with `sortable: false, filter: false` and a `field` each (the two count columns keep the same pair they already carried)
- [x] 4.2 Set sizing per column over the grid's global `flex: 1` / `minWidth: 150`: a `maxWidth` ceiling on the two counts, Duration, Cost and Overall score so flex cannot pad them out; a `minWidth` floor on Target and the two dates; `width` / `minWidth` / `maxWidth` all equal on Status; `Test case run name`, `Test Suite ID` and `Metrics` left to divide the remainder
- [x] 4.3 Add the suite variant (`RUNS_COLUMN` minus `testSuiteId`, derived by `colId` in the spirit of the existing `suppressCellTooltips` / `restrictSort` helpers) and the compare-picker subset (Status, Test case run name, Runs, Test cases, Start Date, End Date)

## 5. Surface wiring

- [x] 5.1 `apps/ai-dial-admin/src/components/ListView/Evaluation/List.tsx`: bump the runs `storageKey` to a versioned value so state stored against the old column set is not applied
- [x] 5.2 `apps/ai-dial-admin/src/components/TestSuites/Runs/Runs.tsx`: use the suite column variant and replace the unconditional `onOpenInNewTab` in `onCellClicked` with the shared `navigateEntityUrl` / `onCellClicked` from `components/EntityListView/utils/on-cell-clicked.ts` (same-tab push, new tab on ctrl / cmd / middle click, actions column still excluded)
- [x] 5.3 `apps/ai-dial-admin/src/components/Runs/Compare/SelectCompareRunModal.tsx`: switch `RadioSelectGrid` to the compare-picker subset

## 5b. Filter transmission defects surfaced by the reworked columns

- [x] 5b.1 `apps/ai-dial-admin/src/components/Grid/FloatingFilter/FloatingFilter.tsx`: send the operator the column declares instead of a hard-coded `contains`, so a column offering only `equals` (`testSuiteId`) stops transmitting `filter=testSuiteId:co:<uuid>` and returning an empty list
- [x] 5b.2 `apps/ai-dial-admin/src/components/Grid/utils.ts`: default the stored `filters` to `{}` rather than `[]` — `applyGridState` hands it straight to `setFilterModel`, which reads a colId -> model map

## 6. Unit and component tests

- [x] 6.1 `AgGridWrapper.spec.tsx`: an `autosizeColumns`-sourced `columnResized` does not write column state; a `uiColumnResized` one still does; the grid keeps `fitGridWidth` without a `storageKey` and no strategy with one
- [x] 6.2 `TitleSubtitleCellRenderer.spec.tsx`: both lines render, each truncates independently, both expose the full value, and the renderer emits no horizontal padding class
- [x] 6.3 `RunStatus.spec.tsx`: the label-less variant renders no visible label, exposes the label as the accessible name in both the transitional and settled branches, and the existing labelled output is unchanged
- [x] 6.4 `TagsCellRenderer.spec.tsx`: 0 / 1 / overflowing tag sets; the `+N` count matches the hidden tags; hidden names are reachable by keyboard; a width change recomputes the visible count
- [x] 6.5 `grid-columns.spec.ts`: `RUNS_COLUMN` order and `colId`s match the spec; no `createdAt` column; the mock-backed and count columns are `sortable: false, filter: false` and each mock-backed one has a `field`; the narrow columns are capped below the grid's global `minWidth`; the suite variant omits `testSuiteId` and preserves relative order; the compare subset excludes the five mock-backed columns
- [x] 6.6 Duration / Cost / Overall score: both timestamps present → elapsed time; missing completion → missing-value indication; score `0` and cost `0` render as values, absent renders as the missing-value indication
- [x] 6.7 `run-list-mock-data.spec.ts`: the same `run.id` yields the same values across calls (no flicker under re-render), and every fixture edge case from 3.2 is covered
- [x] 6.8 `TestSuites/Runs/Runs.spec.tsx`: a plain row click pushes the run details route; a ctrl / cmd click opens a new tab; a click in the actions column navigates nowhere
- [x] 6.9 `FloatingFilter.spec.tsx`: an `equals`-only column transmits `equals`, a column declaring `contains` among others still transmits `contains`; `Grid/tests/grid-state-storage.spec.ts`: an empty stored entry yields a filter model that is an object, not an array

## 7. Verification

- [x] 7.1 No `spec-browser-verify` task is included: the user was asked and declined it for this change. The acceptance criteria that are browser-observable — measured `+N` overflow reflow, column widths, truncation at the rendered width — are covered by the unit and component tests in section 6 instead

## 8. Quality

- [x] 8.1 Run lint, format, and the full vitest suite from `apps/ai-dial-admin/` and fix any failures

## 9. Real-data swap (mocks removed)

- [x] 9.1 Delete `apps/ai-dial-admin/src/components/Runs/mocks/` and its `RunTarget`/`RunTargetKind` types move to `models/evaluation/run.ts`; add `resolveRunTarget` to `Runs/utils/run-list-values.ts` (reads `run.suiteSnapshot`, mirroring `resolveRunDeployment`'s deployment-vs-MCP branching but leaving `kind` unset for an unrecognized `deploymentRef.type` rather than guessing)
- [x] 9.2 Add `Run.overallScoreValue` / `Run.totalCost`, mapped in `runs-query.ts`'s `mapRunRow` from `overall_score_value` / `total_cost` — fields the backend appends to a `test_suite_runs` row after the query runs, so they are deliberately absent from `RUN_SELECT_FIELDS`
- [x] 9.3 `RUNS_COLUMN`'s Target/Metrics/Cost/Overall score `valueGetter`s read the real fields instead of the deleted mocks; fix `getRunsQuery` (`app/[lang]/runs/actions.ts`) to return `mapRunsQueryResult(...)` instead of the raw `StructuredQueryResult` it was returning while the mapping was being built
- [x] 9.4 Wire real sort/filter for Target (OR across `deployment_ref::name` / `mcp_deployment_ref::name`, filterable only, mirroring `test-suites-query.ts`'s `application` column) and Metrics (`metric_names`, both sortable and filterable); Duration/Cost/Overall score keep `sortable: false, filter: false` permanently, not provisionally — Target's "filterable only" is superseded by 10.2 below
- [x] 9.5 Update `eval-runs-list` spec: split the old single "mock-backed columns" scenario into Duration/Cost/Overall score (still neither) and new Target/Metrics requirements; update `design.md` Decision 6 as superseded and add Decision 6b; update `proposal.md`'s Non-goals and Impact
- [x] 9.6 Tests: `runs-query.spec.ts` (new), `run-list-values.spec.ts` (new, `resolveRunTarget`), `runs-column-values.spec.ts` and `grid-columns.spec.ts` updated off plain `Run` fixtures instead of the deleted mock fixtures, `runs/tests/actions.spec.ts` covers `getRunsQuery`'s mapping

## 10. Runs, Test cases and Target become sortable

- [x] 10.1 Backend added a real `number_of_runs` field; `mapRunRow` nests it as `runConfig: { numberOfRuns }` (the legacy REST shape, not a new top-level property) so the existing `field: 'runConfig.numberOfRuns'` colDef keeps working via AG Grid's own dot-path resolution — no `valueGetter` needed. Fixed `RUN_COLUMN_TO_DSL_FIELD`'s key for it to the actual colId (`'runConfig.numberOfRuns'`, not a bare `numberOfRuns` the column doesn't carry — a mismatched key silently drops the sort rather than erroring) and kept `numberOfRuns != null` (not `!!numberOfRuns`) so a `0` run count still maps, matching this file's "zero is a value" rule for Duration/Cost/Overall score
- [x] 10.2 Runs and Test cases columns drop `sortable: false` (left to the grid default), keep `filter: false` — no filter UI for the counts was asked for. Target drops `sortable: false` too: asked directly, since a `SortItem` can't express Target's two-field OR, `buildRunsSort` maps it to `deployment_ref::name` alone (MCP_TOOL rows sort together rather than interleaving by their own name) instead of leaving it unsorted
- [x] 10.3 Update `eval-runs-list` spec's sortable/filterable requirement and Target requirement (now sortable-by-approximation, retitled); `design.md` Decision 6b extended; `proposal.md`'s Non-goals updated
- [x] 10.4 Tests: `grid-columns.spec.ts` (Runs/Test cases sortable + filter:false, Target sortable), `runs-query.spec.ts` (`buildRunsSort` maps Target to `deployment_ref::name` and the Runs column to `number_of_runs`; `mapRunRow` nests `number_of_runs` under `runConfig`, including the zero-count case)

