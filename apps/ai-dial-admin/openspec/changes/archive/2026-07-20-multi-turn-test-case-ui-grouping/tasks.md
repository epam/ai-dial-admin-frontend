## 1. Models & constants

- [x] 1.1 Add `GridRowType` enum (`GROUP`, `TURN`, `SINGLE`) and grouping/grid-row interfaces
  (`TestCaseGroup`, `TurnItem`, `GroupedGridRow`) to a shared models file
  (`src/models/evaluation/test-case-grouping.ts` or feature `models.ts`).
- [x] 1.2 Add any constants (row-type CSS classes, `Add turn`/`Turn k`/`N turns` i18n keys,
  expander col id) — keep `constants.ts` separate from `models.ts`.

## 2. Grouping utils (pure) + tests

- [x] 2.1 Create `src/utils/evaluation/test-case-grouping.ts` with named exports:
  `groupTestCaseRows`, `renumberTurns`, `promoteToMultiTurn`, `demoteToSingle`, `reorderTurns`,
  `aggregateValidity`, `projectGroupsToGridRows(cases, expandedKeys, isSearching)`.
- [x] 2.2 Unit tests `src/utils/evaluation/tests/test-case-grouping.spec.ts`: grouping order,
  renumber, promote/demote, reorder, validity aggregation, collapsed vs search projection,
  both-or-neither edge cases, legacy gap/duplicate turnIndex.

## 3. Cell renderers

- [x] 3.1 `Grid/CellRenderers/TurnExpanderCellRenderer.tsx` — chevron toggle for GROUP rows,
  indent spacer for TURN, empty for SINGLE (uses `@tabler/icons-react`, ui-kit icon button).
- [x] 3.2 `Grid/CellRenderers/StackedTurnsCellRenderer.tsx` — read-only cell rendering every
  turn's value for a field, one line per turn; enable row auto-height on GROUP rows.

## 4. Shared hook

- [x] 4.1 `Grid/hooks/use-turn-group-grid.tsx` — owns `expandedKeys`, derives projected `rowData`
  (collapsed vs search mode via `onFilterChanged`/`getFilterModel`), exposes toggle + structural-op
  callbacks (add/delete/reorder turn, promote/demote) that call existing server actions and
  `refreshGrid`.

## 5. Columns refactor (both grids)

- [x] 5.1 Remove `getConversationColumns` from `Datasets/utils/columns.tsx` and
  `TestSuites/utils/columns.tsx` column output.
- [x] 5.2 Add leading expander column (`TurnExpanderCellRenderer`).
- [x] 5.3 Make name + schema + validity columns rowType-aware via `cellRendererSelector`:
  GROUP → stacked/read-only + `N turns` badge; TURN → editable + `Turn k` label; SINGLE → editable.
- [x] 5.4 Add action column entries: GROUP → Add turn + Delete case; TURN → up/down + Delete turn;
  SINGLE → Add turn + Delete case. Respect `isReadOnly`.

## 6. Datasets TestCasesList wiring

- [x] 6.1 Wire `Datasets/TestCases/TestCasesList.tsx` to the shared hook: projected rowData,
  expand/search behavior, structural ops; keep batched field-edit save + delete modal.

## 7. Test Suites TestCasesList wiring

- [x] 7.1 Wire `TestSuites/TestCases/TestCasesList.tsx` to the shared hook, preserving `enabled`
  toggle, disabled-ids, try-out, read-only, and selection-only-on-GROUP/SINGLE semantics.

## 8. Component tests

- [x] 8.1 Extend/adjust `TestSuites/TestCases/tests/TestCasesList.spec.tsx` (and a dataset-list
  test if present) for collapsed-by-default, expand-on-search flattening, add/delete/reorder,
  promote/demote.

## 9. Validate

- [x] 9.1 `openspec validate 2026-07-20-multi-turn-test-case-ui-grouping --strict`.
- [x] 9.2 Lint + typecheck + run affected vitest specs from `apps/ai-dial-admin`.
