## Why

Review feedback on the Conversations page asked for a column-selection popup — "the ability to select any
columns from the table" — with the missing user column as the concrete example. The grid shows a hand-picked
subset of the `conversations` entity while the entity carries more, and an operator has no way to reach the
rest.

The app already has the machinery: `ColumnsPanel` with visibility checkboxes and drag-reordering, a "Columns"
toolbar button, and per-view column-state persistence in local storage. Seven grids use it. Conversations
cannot, for one structural reason: its `columnDefs` are `ColGroupDef[]`, because that is what renders the
provenance band, and the panel, its `GridView` state and the column-state helpers are all written against a
flat `ColDef[]` keyed by `field`. The panel's own filter (`col.field && col.headerName`) discards a group
definition outright, so the panel would render empty.

So the ask splits in two: teach the shared panel about grouped columns — which is where the work is, and it is
shared code seven other grids depend on — then drive the Conversations catalog off the entity schema rather
than a hardcoded list, so it offers what the table actually has.

## What Changes

- The shared columns panel operates on **leaf** columns rather than top-level definitions, so a grouped grid
  lists its real columns. Each leaf stays inside its group: reordering is within-group only, matching the
  grid's own `marryChildren` behaviour, so a column can never be dragged out of the provenance it is
  attributed to.
- Column visibility and order persist per view, as they already do for flat grids, and a reset returns to the
  view's defaults.
- Hiding a column SHALL clear its sort and its filter. AG Grid keeps both for a hidden column, so without this
  an operator can hide a filtered column and be left with a narrowed result and no visible cause.
- For a server-paged grid, restored sort and filter state reaches the **first** fetch rather than arriving
  after an unfiltered one.
- The Conversations column catalog is read from the `conversations` entity schema
  (`getEntitySchema`, already used by the Query Builder), not from a hardcoded field list. Each schema field
  contributes a column whose header, cell formatting, sortability and filter type come from its declared type
  and display name. The seven curated columns keep their composed cells and remain the default visible set;
  every other scalar field is offered and hidden by default.
- Fields the grid cannot honestly render or query are not offered: anything the backend marks `sensitive`
  (selecting it would fail for a non-full-admin caller) and the non-scalar `object` / `array` types (a grid
  cell is not a JSON viewer).
- The list query projects the curated fields plus every currently visible schema-driven field. Making a field
  visible that the query does not carry restarts paging, because the data genuinely was not fetched; hiding one
  does not re-query.
- The Conversations grid gains a "Columns" button and, with persistence enabled, explicit column widths — the
  grid's `autoSizeStrategy: fitGridWidth` is inactive once a `storageKey` is present.

## Capabilities

### New Capabilities

- `grid-column-selection`: the shared column-selection panel and per-view column-state persistence — how a
  grid exposes which columns are shown and in what order, including grouped grids where a column belongs to a
  header group it must not leave, and what happens to a hidden column's sort and filter.

### Modified Capabilities

- `analytics`: the conversations view gains a schema-driven column catalog — which fields are offered, which
  are excluded and why, what the default visible set is, and how the list query's projection follows the
  visible columns.

## Impact

- Depends on `conversations-summary-and-user-column` and `conversations-grid-sort-and-filter`, and must be
  applied and archived **after both**. It extends the second change's field-backed sort and filter rule to
  columns added from the schema, and inherits the user column from the first.
- The analytics delta uses new requirements rather than modifying the ones those two changes introduce, so each
  change validates and archives independently. Once all three have archived, the three conversations-grid
  requirements are worth consolidating.
- **Shared code, seven grids affected** — `src/components/Grid/ColumnsPanel/ColumnsPanel.tsx`,
  `src/components/Grid/GridView/GridView.tsx` (`toggleColumnVisibility`, `onFindColumn`, `onMoveColumn`, the
  `getColumnState()` sync), `src/components/Grid/utils.ts` (`applyColumnStateOrderToColDefs`,
  `haveColDefsSamePanelState`, `updateColumnVisibilityInStorage`, `getColumnVisibilityFromGridState`),
  `src/components/Grid/comparators/base-column-comparator.ts`, and `getDefaultSorts` in
  `src/components/Grid/AgGridWrapper.tsx` — all of which key on a top-level `field`. Existing flat grids must
  keep behaving identically; that is the main risk in this change.
- `src/components/Grid/TreeColumnsPanel/` already has its own grouped variant for a different shape (movable
  top-level groups). The two must not be conflated: leaves move here, groups move there.
- Analytics side: `src/components/Analytics/ConversationsTrace/List/ConversationsList.tsx` (the Columns button,
  `storageKey`, `isLiveData`), a new column-catalog builder under `src/utils/analytics/`,
  `src/utils/analytics/conversations-queries.ts` (projection follows the visible set),
  `src/components/Analytics/ConversationsTrace/use-conversations.ts` (visible fields reach the query),
  `src/app/[lang]/conversations-trace/page.tsx` and `actions.ts` (schema fetch), and
  `src/models/analytics/conversations-trace.ts` (a row can now carry fields beyond the curated ones).
