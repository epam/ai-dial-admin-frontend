# Multi-turn test cases — UI-grouped flat rows

**Date:** 2026-07-20
**Scope:** Dataset test-case grid **and** Test-Suite test-case grid

## Problem

Multi-turn test cases are currently authored by hand: the grid exposes two editable columns,
`multiTurnId` and `turnIndex` (`getConversationColumns`), and the user must type a shared
conversation id across rows and number the turns themselves. This is error-prone (the backend
rejects "exactly one" of the pair, bad UUIDs, duplicate/gap turn indices) and leaks storage
mechanics into the authoring experience.

## Goal

Keep storage **flat and unchanged** — every turn stays its own backend row with top-level
`multiTurnId` + `turnIndex`; same entity, same CSV, same server actions. Move all grouping
and key management into the **UI**: the grid groups flat rows by `multiTurnId` into one logical
multi-turn test case, renders multi-turn cases as a collapsible master/detail unit, and
auto-manages `multiTurnId` (generated) and `turnIndex` (= position). The user assembles turns
and never types those keys.

## Non-goals

- No backend, entity, or CSV format change.
- No change to the Runs results grid (`turnIndex`/`totalTurns` there are read-only, unchanged).
- No drag-and-drop reorder in this pass — reorder is via up/down actions.

## Constraints that shaped the design

- **ag-grid community v35, no Enterprise** (confirmed: only community modules registered, no
  `ag-grid-enterprise` installed). Master/detail, tree-data, and row-grouping are all Enterprise —
  unavailable. `RowAutoHeightModule`, `TextFilterModule`, `cellRendererSelector`,
  client-side row model, and floating filters **are** available.
- Project rules (`.claude/rules/components.md` §5/§6/§11): all tabular data must use ag-grid;
  no hand-rolled `<table>` / CSS-grid tables. So the collapsible unit is built from ag-grid
  rows sharing one column set — not a custom detail panel.
- `.claude/rules/code-standards.md`: enums over string-literal unions; types in `models.ts`;
  `constants.ts` separate from `models.ts`; `@/` imports.
- `.claude/rules/utils.md`: pure helpers, named exports, unit-tested.

## Chosen approach: A — synthesized rows

One flat client-side `rowData` list holds a *group summary* row per multi-turn case, its *turn*
rows beneath it (present only when expanded), and single-turn cases as one normal row. All rows
share the **same column defs**, so turn↔summary alignment is automatic and everything stays
inside ag-grid. (Approaches B "full-width detail renderer" and C "external-filter hide/show" were
rejected — B needs a hand-built table inside the renderer and loses alignment; C has no real
aggregate summary row and weaker UX.)

## Architecture / code layout

Both `TestCasesList` components become thin consumers of shared logic:

- **`src/utils/evaluation/test-case-grouping.ts`** — pure, unit-tested helpers:
  - `groupTestCaseRows(rows)` → ordered logical cases (single vs multi, turns sorted by
    `turnIndex`, case order by first turn's position).
  - `renumberTurns(turns)` → contiguous `turnIndex` 0..n-1.
  - `promoteToMultiTurn(singleRow)` / `demoteToSingle(turns)` — add/strip generated
    `multiTurnId` + `turnIndex`.
  - `reorderTurns(turns, from, to)`.
  - `aggregateValidity(turns)` → invalid if any turn invalid.
  - `projectGroupsToGridRows(cases, expandedKeys, isSearching)` → flat `GridRow[]`.
- **`src/components/Grid/CellRenderers/TurnExpanderCellRenderer.tsx`** — chevron for GROUP rows,
  indent spacer for TURN, nothing for SINGLE.
- **`src/components/Grid/CellRenderers/StackedTurnsCellRenderer.tsx`** — read-only cell that
  renders every turn's value for a field, one line per turn, with row auto-height.
- **Shared hook** (`src/components/Grid/hooks/use-turn-group-grid.tsx` or feature-local if the two
  lists diverge) — owns `expandedKeys`, search-mode projection, and the structural-op handlers;
  exposes the projected `rowData` and the op callbacks to each list.
- **Removed from the UI:** `getConversationColumns` (the manual `multiTurnId`/`turnIndex`
  columns) is no longer added to either grid's column defs. The helper may remain for CSV/other
  uses but is not rendered.

## Data model

Group flat backend rows by non-empty `multiTurnId`; rows without a `multiTurnId` are
single-turn cases.

```ts
// models.ts (feature-local or src/models/evaluation)
enum GridRowType {
  GROUP = 'GROUP',   // collapsed multi-turn summary row (carries all its turns)
  TURN = 'TURN',     // one editable turn (present only when its group is expanded)
  SINGLE = 'SINGLE', // single-turn case, one editable row
}
```

`rowData` is a single flat list: for each multi-turn case, a `GROUP` row followed by its `TURN`
rows when expanded; each single-turn case is one `SINGLE` row. This is fully backward-compatible
with existing data that already has `multiTurnId`/`turnIndex`.

## Columns (rowType-aware via `cellRendererSelector`)

- **Expander column (new, leading):** chevron on GROUP (toggles expand); indent spacer on TURN;
  empty on SINGLE.
- **Name column:** SINGLE → editable name; GROUP → name + `N turns` badge (read-only summary);
  TURN → indented `Turn k` label.
- **Schema columns:** GROUP → `StackedTurnsCellRenderer` (all turns' values stacked, auto-height,
  read-only); TURN and SINGLE → existing editable renderers (`EditableCellRenderer`,
  `JsonEditorCellRenderer`, `SelectCellRenderer`, `FileSelectCellRenderer`, number/boolean
  variants) writing to that row via `onCellChange`.
- **Validity column:** GROUP → aggregate (`aggregateValidity`); TURN/SINGLE → own value.
- **Action column(s):** GROUP → *Add turn* + *Delete case*; TURN → *↑ / ↓ reorder* +
  *Delete turn*; SINGLE → *Add turn* (promotes to multi) + *Delete case*.

## Collapse + search behavior

- `expandedKeys: Set<string>` in the shared hook, **empty by default → every multi-turn case is
  collapsed** on load. Chevron toggles a key; `rowData` is re-projected.
- **On search:** any active floating column filter (detected via `onFilterChanged` +
  `api.getFilterModel()`) switches the grid to a **flat turn view** — `rowData` = all `TURN` +
  `SINGLE` rows, **no `GROUP` summary rows**. ag-grid's native per-column filtering then hides
  non-matching turn/single rows; a case appears iff one of its turns matches. `TURN` rows carry
  the case name for context while flat. Clearing all filters restores the collapsed view
  (honoring `expandedKeys`). This reuses native filtering rather than reimplementing text matching.

## Turn operations & persistence

Reuses existing server actions — `createTestCase` already accepts `multiTurnId` + `turnIndex`;
`updateTestCases` (batch); `removeTestCase`. **Structural ops persist immediately** (consistent
with today's immediate add/delete); **field edits stay batched-dirty** and flush on the existing
page-level Save. After each structural op, `refreshGrid()` runs (it already preserves
`dirtyRowsRef` edits).

- **Add turn to SINGLE (promote):** generate `multiTurnId` (uuid); `updateTestCases` existing
  row → `turnIndex 0` + new `multiTurnId`; `createTestCase` new blank turn `turnIndex 1`.
- **Add turn to GROUP:** `createTestCase` at `turnIndex = current turn count`.
- **Delete turn:** `removeTestCase`; `renumberTurns` remaining → `updateTestCases`; if exactly one
  turn remains → **demote** (`updateTestCases` stripping `multiTurnId`/`turnIndex`).
- **Delete case:** existing case-level delete (single `removeTestCase` for single-turn, or remove
  all rows of the conversation).
- **Reorder:** swap adjacent turns' `turnIndex` → `updateTestCases` on the two affected rows.

Delete of a persisted case still routes through the existing `DeleteConfirmationModal`.

## Selection / batch delete

Selection is restricted to **GROUP + SINGLE rows** (whole cases); `TURN` rows are not selectable.
Batch delete stays case-level and uses the existing `removeMultipleTestCases` flow. CSV
import/export is unchanged.

## Edge cases

- Legacy data with gaps/duplicates in `turnIndex`: display is sorted by `turnIndex`; the next
  structural op renumbers to contiguous 0..n-1.
- Data with `multiTurnId` but a single row: treated as a one-turn multi case; demote path
  applies if reduced.
- New blank case created via *Add test case*: a `SINGLE` row (today's behavior).
- Read-only mode (Test Suites `isReadOnly`): expander + collapse work; add/delete/reorder actions
  hidden, as other edit actions are today.

## Testing

- **Unit** (`src/utils/evaluation/tests/test-case-grouping.spec.ts`): grouping order, renumber,
  promote/demote, reorder, validity aggregation, projection under collapsed vs search modes,
  and both-or-neither edge cases.
- **Component**: collapsed-by-default, expand-on-search flattening, add/delete/reorder,
  promote/demote, for both `TestCasesList` components. Extend existing
  `TestSuites/TestCases/tests/TestCasesList.spec.tsx`.

## Files touched (anticipated)

- New: `src/utils/evaluation/test-case-grouping.ts` (+ tests)
- New: `src/components/Grid/CellRenderers/TurnExpanderCellRenderer.tsx`,
  `StackedTurnsCellRenderer.tsx`
- New: shared hook `use-turn-group-grid.tsx` + its `models.ts`/`constants.ts`
- Edit: `src/components/Datasets/TestCases/TestCasesList.tsx`
- Edit: `src/components/TestSuites/TestCases/TestCasesList.tsx`
- Edit: `src/components/Datasets/utils/columns.tsx`,
  `src/components/TestSuites/utils/columns.tsx` (drop `getConversationColumns`, add
  expander + rowType-aware selectors)
- Edit: `src/components/Datasets/utils/data.ts`, `src/components/TestSuites/utils/data.ts`
  (grouping/projection wiring)
