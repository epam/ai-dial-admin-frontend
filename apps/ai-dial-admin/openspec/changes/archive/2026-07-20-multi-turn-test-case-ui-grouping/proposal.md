## Why

Multi-turn test cases are authored by hand today: the Dataset and Test-Suite test-case grids expose
two editable columns — `multiTurnId` and `turnIndex` (`getConversationColumns`) — and the user
must type a shared conversation id across rows and number the turns manually. This leaks storage
mechanics into authoring and is error-prone (the backend rejects "exactly one" of the pair, bad
UUIDs, duplicate/gap turn indices).

## What Changes

- **Storage stays flat and unchanged.** Every turn remains its own backend row with top-level
  `multiTurnId` + `turnIndex`; same entity, same CSV, same server actions. No backend change.
- **UI owns grouping.** Both test-case grids group flat rows by `multiTurnId` into one logical
  multi-turn test case, render multi-turn cases as a collapsible master/detail unit built from
  ag-grid rows sharing one column set, and auto-manage `multiTurnId` (generated) and `turnIndex`
  (= position). The user never types those keys.
- **Remove the manual columns.** `getConversationColumns` is no longer rendered in either grid.
- **New leading expander column** with a chevron on group summary rows; **collapsed by default**.
- **Collapsed summary row** shows every turn's value stacked per schema column (read-only,
  auto-height).
- **Expand on search:** any active floating column filter switches the grid to a flat turn view
  (turn/single rows only, native filtering hides non-matching turns).
- **Turn operations:** add, delete, reorder (up/down), with auto promote (single→multi) / demote
  (multi→single) and `turnIndex` renumbering. Structural ops persist immediately via existing
  server actions; field edits stay batched.
- **Shared logic extracted** into pure grouping utils, two cell renderers, and a shared hook so
  both grids stay thin and consistent.

## Capabilities

### New Capabilities

- `multi-turn-test-case-ui-grouping`: UI-side grouping of flat test-case rows into collapsible
  multi-turn cases across the Dataset and Test-Suite test-case grids. Covers grouping/projection,
  the expander + rowType-aware columns, stacked summary rendering, collapsed-by-default +
  expand-on-search behavior, and add/delete/reorder/promote/demote turn operations with automatic
  `multiTurnId`/`turnIndex` management.

### Modified Capabilities

<!-- No existing spec-level capability document exists to modify; the manual conversation-column
     authoring behavior is superseded by this new capability. -->

## Impact

- **`Datasets/TestCases/TestCasesList.tsx`** and **`TestSuites/TestCases/TestCasesList.tsx`**: consume
  the shared grouping hook; add/delete/reorder wiring; drop reliance on manual conversation columns.
- **`Datasets/utils/columns.tsx`** and **`TestSuites/utils/columns.tsx`**: remove
  `getConversationColumns` usage; add expander column + rowType-aware `cellRendererSelector`.
- **`Datasets/utils/data.ts`** and **`TestSuites/utils/data.ts`**: grouping/projection wiring.
- **New files:** `src/utils/evaluation/test-case-grouping.ts` (+ tests),
  `Grid/CellRenderers/TurnExpanderCellRenderer.tsx`, `Grid/CellRenderers/StackedTurnsCellRenderer.tsx`,
  shared hook `use-turn-group-grid.tsx` (+ `models.ts`).
- **No backend, entity, or CSV format change. Runs results grid unchanged.**
