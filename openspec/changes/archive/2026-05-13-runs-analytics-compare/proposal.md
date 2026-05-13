## Why

When evaluating a test suite across multiple runs, users have no way to compare metric results side-by-side in the Analytics grid — they must open each run separately and compare mentally. Adding a run-comparison control directly in the Analytics tab removes this friction and makes regressions or improvements immediately visible.

## What Changes

- Add a **Compare with** dropdown above the Analytics grid, populated with completed runs from the same test suite (excluding the current run)
- When a comparison run is selected, fetch its analytics results and merge rows by `testCaseId`
- Re-render the grid with a three-level column header: each dynamic group (EXECUTION, metric groups, EXTRACTED) gains a **Current / Compared** sub-level
- Missing test case matches (test case in current run but not in compared run) render `—` in all Compared cells
- Clearing the dropdown restores the normal two-level column layout

## Non-goals

- No comparison for the Extraction Result tab (analytics only)
- No diff highlighting between current vs compared values (plain display only)
- No support for comparing more than two runs at once

## Capabilities

### New Capabilities

- `runs-analytics-run-compare`: Side-by-side comparison of two runs within the Analytics tab — dropdown control, row merging by test case, and dynamic three-level column headers (Current / Compared) for all execution and metric columns

### Modified Capabilities

_(none — the comparison is additive; no existing spec-level behavior changes)_

## Impact

- `components/Runs/View/Analytics.tsx` — new state, new fetch for sibling runs and compared results, renders the comparison dropdown
- `components/Runs/View/utils.ts` — new `mergeByTestCaseId` function, new `getAnalyticsColumnsCompare` column builder
- `components/Runs/View/models.ts` — new `CompareAnalyticsRow` type
- `app/[lang]/runs/actions.ts` — no changes needed (existing `getRuns` action is sufficient)
- AG Grid `groupHeaderHeight` will need to increase when compare mode is active to accommodate the extra header tier
