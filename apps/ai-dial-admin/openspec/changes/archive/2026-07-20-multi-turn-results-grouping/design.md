# Design — multi-turn results grouping

## Constraints & reuse

- ag-grid **community** only (no master/detail, tree-data, row-grouping). Same synthesized-flat-rows
  (Approach A) primitive proven for the test-case grids.
- Results are **read-only**: no create/update/delete/reorder. So none of `useTurnGroupGrid`'s CRUD is
  needed — only its projection + expand/search state.
- Grouping key is the same field name (`multiTurnId`), so `readMultiTurnId` / `groupTestCaseRows`
  work as-is on result rows (result rows carry `id`, `testCaseName`, `multiTurnId`, `turnIndex`).
- The results grid host (`ExtractionResult.tsx`) is stateful: a tree-columns panel with column-state
  sync, a detail drawer keyed by row `id`, `rowClassRules` by `id`, and dynamic metric/input/extracted
  columns under grouped headers. Grouping must not disturb those.

## 1. Shared read-only projection hook

Extract the read-only core of `useTurnGroupGrid` into `useTurnGroupProjection`
(`Grid/hooks/use-turn-group-projection.tsx`):

- Owns `toggledKeys: Set<string>` and `isSearching`.
- Config: `{ rawRows, defaultExpanded?, onGridReady? }`.
- Derives `groups = groupTestCaseRows(rawRows)` and
  `rowData = projectGroupsToGridRows(groups, toggledKeys, isSearching, defaultExpanded)`.
- Exposes `onToggleExpand`, `onFilterChanged`, `getRowId`, `getRowHeight`, `onGridReady`,
  a `refreshCells({force})` effect on `rowData`, and a prune effect dropping stale keys.

`useTurnGroupGrid` (test cases) is refactored to consume `useTurnGroupProjection` for those pieces and
keep its CRUD on top. Public API of `useTurnGroupGrid` is unchanged → existing test-case behavior and
tests stay green.

### `defaultExpanded` semantics

`projectGroupsToGridRows(groups, toggledKeys, isSearching, defaultExpanded = false)`:

- `expanded = defaultExpanded ? !toggledKeys.has(key) : toggledKeys.has(key)`.
- Test-case grids pass `defaultExpanded` omitted (false) → collapsed by default, `toggledKeys` =
  expanded keys (unchanged).
- Results pass `true` → expanded by default, `toggledKeys` = collapsed keys. `onToggleExpand` toggles
  membership either way, so the chevron just flips a key.

## 2. Results column wrapper

`Runs/View/results-grouping-columns.tsx` wraps `getAnalyticsColumns(results)`:

- Prepend an **expander** column (`TurnExpanderCellRenderer`, `onToggleExpand`), width ~44, not
  sortable/filterable, pinned-left semantics like the test-case grid.
- Make the existing `testCaseName` column **rowType-aware** via `cellRendererSelector`: GROUP →
  `TestCaseNameCellRenderer` (name + `N turns` badge); TURN → `TestCaseNameCellRenderer` (`Turn k` +
  underlying name); SINGLE → the current text cell.
- For every **data** column (execution, metrics, input, extracted), add:
  - `cellRendererSelector`: GROUP → `StackedTurnsCellRenderer` (stack each turn's value for that
    field); otherwise the column's existing renderer/formatter.
  - `valueGetter` fallback: for GROUP rows return the **first turn's** value for that field (the
    "representative" value used for sorting); otherwise the original getter.

The `turnIndex` / `totalTurns` columns keep their per-turn value on turn/single rows; on GROUP rows
they show the group's total (`totalTurns`) or blank.

## 3. Sorting (disabled while grouped)

ag-grid community cannot keep child rows under a synthesized parent during native sort. A
`postSortRows` re-glue was attempted (walk the post-sort nodes, emit each conversation at its
first-encountered member, turns in `turnIndex` order) and it computes the correct order, **but this
ag-grid build does not honor a `postSortRows` reordering of `params.nodes`** — the grid renders the
pre-sort order regardless (verified via Playwright: `aria-sort` toggles but rows don't move).

Rather than ship a misleading no-op sort indicator (or a native sort that scatters turns across
conversations), **column sorting is disabled in grouped mode** (`sortable: false` on every column via
the wrapper). Row order is owned entirely by the grouping projection: conversation appearance order,
turns by `turnIndex`. The `regroupSortedRows` pure helper is retained (and unit-tested) as the basis
for a future projection-driven sort if we revisit it. The prior default multi-sort
(`testCaseName/runIndex/turnIndex`) is dropped in grouped mode.

## 4. Host wiring (`ExtractionResult.tsx`)

- Feed raw `results` into `useTurnGroupProjection({ rawRows: results, defaultExpanded: true })`.
- `rowData = projection.rowData`; `columnDefs` = wrapped columns (built with
  `projection.onToggleExpand`).
- Merge `getRowId`, `getRowHeight`, `onFilterChanged`, `postSortRows` into `gridOptions`.
- **Row click guard:** `onRowClicked` opens the detail only when `data.rowType !== GROUP` and a real
  `id` exists (turn/single rows). Clicking a GROUP toggles expand instead.
- `rowClassRules` by `id` is unaffected (GROUP id = `multiTurnId`, never a result id).
- The tree-columns panel operates on the wrapped colDefs; the expander column is marked
  non-hideable / excluded from the panel to avoid users removing it.

## 5. Graceful fallback

`groupTestCaseRows` already treats a row without `multiTurnId` as single-turn. If the backend has not
yet added `multiTurnId`, every result row is single-turn → no GROUP rows, expander renders nothing,
`postSortRows` is a pass-through, sort/filter/detail behave exactly as today. No feature flag needed.

## Testing

- Reuse extended: `projectGroupsToGridRows` `defaultExpanded` branch (util spec).
- New: results column wrapper (expander present, rowType-aware selectors, GROUP representative
  valueGetter, stacked renderer on GROUP), `postSortRows` re-glue helper (pure function), row-click
  guard.
- `useTurnGroupProjection` covered indirectly via existing `useTurnGroupGrid` tests (unchanged) plus
  a focused expanded-by-default test through the results grid spec.
