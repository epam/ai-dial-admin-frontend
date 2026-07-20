## 1. Extend the pure projection

- [x] 1.1 Add optional `defaultExpanded = false` param to `projectGroupsToGridRows` in
  `src/utils/evaluation/test-case-grouping.ts` (`expanded = defaultExpanded ? !toggledKeys.has(key) :
  toggledKeys.has(key)`); keep existing callers/behavior unchanged.
- [x] 1.2 Extend `src/utils/evaluation/tests/test-case-grouping.spec.ts` with the
  `defaultExpanded=true` branch (multi-turn expanded on load; toggled key collapses it).

## 2. Shared read-only projection hook

- [x] 2.1 Create `src/components/Grid/hooks/use-turn-group-projection.tsx`
  (`useTurnGroupProjection({ rawRows, defaultExpanded?, onGridReady? })`) owning `toggledKeys`,
  `isSearching`, projection, `onToggleExpand`, `onFilterChanged`, `getRowId`, `getRowHeight`,
  refresh + prune effects.
- [x] 2.2 Refactor `use-turn-group-grid.tsx` to consume `useTurnGroupProjection` for the read-only
  parts, keeping its public API and CRUD identical.

## 3. Group-only sort helper (pure) + tests

- [x] 3.1 Add a pure `regroupSortedRows(nodesData)` helper (in results utils or grouping utils) that
  re-glues turn rows under their GROUP row (turnIndex order) given a post-sort ordered list.
- [x] 3.2 Unit tests: groups reorder by summary position, turns stay contiguous/ordered, single rows
  untouched, flat (no-GROUP) list passes through.

## 4. Results column wrapper + tests

- [x] 4.1 Create `src/components/Runs/View/results-grouping-columns.tsx`:
  `getGroupedAnalyticsColumns(results, onToggleExpand)` — prepend expander, rowType-aware
  `testCaseName`, and per data column add GROUP `StackedTurnsCellRenderer` selector +
  first-turn representative `valueGetter`.
- [x] 4.2 Unit tests `src/components/Runs/View/tests/results-grouping-columns.spec.ts`: expander
  leads and is non-sortable, name selector by rowType, data column GROUP→stacked selector, GROUP
  representative valueGetter returns first turn's value, non-GROUP unchanged.

## 5. Host wiring

- [x] 5.1 Wire `useTurnGroupProjection({ rawRows: results, defaultExpanded: true })` into
  `Runs/View/ExtractionResult.tsx`; set `rowData` = projection rows, `columnDefs` = grouped columns.
- [x] 5.2 Merge `getRowHeight`, `onFilterChanged` into `gridOptions` (no `getRowId` — ag-grid must
  re-render in projection order on expand/collapse). Sorting disabled in grouped mode
  (`sortable: false`) — a `postSortRows` re-glue was attempted but ag-grid did not honor node
  reordering in this build.
- [x] 5.3 Guard `onRowClicked`: open detail only for TURN/SINGLE rows with a real `id`; GROUP row
  click toggles expand.
- [x] 5.4 Keep the expander column out of / non-hideable in the tree-columns panel.

## 6. Fallback & final gate

- [x] 6.1 Verify graceful fallback: results without `multiTurnId` render exactly as today (no groups,
  expander renders null, `postSortRows` pass-through) — covered by unit tests.
- [x] 6.2 Lint + typecheck changed files; run affected specs; then full `nx test ai-dial-admin`.
- [x] 6.3 Note: live Playwright verification is deferred until the backend deploys `multiTurnId` on
  result rows.
