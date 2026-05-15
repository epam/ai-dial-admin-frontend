## Context

The Run Analytics tab recently gained a compare-mode that renders three levels of column headers: a metric group at L1, then Current/Compared at L2, and individual metric keys at L3. This layout scatters related metrics across the grid, making comparison hard at a glance. Additionally, the grid has no column visibility controls — in compare mode with many metric groups the table becomes unwieldy.

Two things change:
1. The compare-mode column hierarchy is inverted so each metric key has its own Current/Compared pair directly beneath it.
2. A new `TreeColumnsPanel` component lets users toggle groups on/off via a checkbox tree overlay.

Relevant files:
- `apps/ai-dial-admin/src/components/Runs/View/utils.ts` — all column-def construction
- `apps/ai-dial-admin/src/components/Runs/View/Analytics.tsx` — orchestrates data, colDefs, grid rendering
- `apps/ai-dial-admin/src/components/Grid/GridView/GridView.tsx` — wrapper that owns column state for flat panels
- `apps/ai-dial-admin/src/components/Grid/ColumnsPanel/ColumnsPanel.tsx` — existing flat panel (not reused here)

## Goals / Non-Goals

**Goals:**
- Invert the compare column hierarchy so Current/Compared are leaves under each metric key
- Provide a tree-based column visibility panel specific to the analytics grid
- Keep the `TreeColumnsPanel` generic enough that other multi-level grids could use it

**Non-Goals:**
- Drag-and-drop reordering in the panel (users use ag-Grid header drag)
- Persisting column visibility to localStorage
- Modifying `GridView`'s existing flat-panel behaviour
- Applying the tree panel to any grid other than analytics in this change

## Decisions

### Decision 1 — Column hierarchy shape for EXECUTION and EXTRACTED

The hierarchy flip that makes sense for metric groups (`group → key → [Current, Compared]`) should be applied consistently to EXECUTION and EXTRACTED too:

```
EXECUTION → [# → [Current, Compared], HTTP → [Current, Compared], Duration → [Current, Compared]]
EXTRACTED → [key1 → [Current, Compared], key2 → [Current, Compared]]
```

**Alternative considered**: leave EXECUTION as a flat two-sub-group structure. Rejected — inconsistency would confuse users and the panel would need special-casing per section.

**Implementation**: `getComparedMetricsColumns` rewritten from `group → [Current → keys, Compared → keys]` to `group → [key → [Current leaf, Compared leaf]]`. `getAnalyticsColumnsCompare` updated to use the same shape for EXECUTION and EXTRACTED.

---

### Decision 2 — Column state ownership: React state + direct Grid API call

`GridView` initialises `currentColDefs` from the `columnDefs` prop exactly once (when empty). After that it ignores `columnDefs` prop changes. This means we cannot drive column visibility through GridView's React state from outside.

**Chosen approach**: `Analytics.tsx` holds `panelColDefs` state initialised from `computedColDefs`. When the `TreeColumnsPanel` calls `onColumnsChange(newColDefs)`:
1. `setPanelColDefs(newColDefs)` — keeps React state in sync for re-mounts
2. `gridApiRef.current?.setColumnDefs(newColDefs)` — applies the change to the live grid immediately

`panelColDefs` is passed to `GridView` as `columnDefs`. On mode switches (which force a `key` remount of GridView), GridView re-initialises from the latest `panelColDefs` correctly.

**Alternative considered**: Add a `onColumnDefsChange` callback to `GridView` and lift state. Rejected — changes existing component API, adds complexity without benefit for this case. Another alternative: use only the Grid API with no React state. Rejected — on remount, GridView would re-initialise from stale `computedColDefs` rather than the user's current visibility state.

---

### Decision 3 — TreeColumnsPanel renders inside an overlay div in Analytics.tsx

The panel needs to overlay the grid. `GridView` already has an internal overlay for its flat `ColumnsPanel`, but that is tightly coupled to the flat panel component.

**Chosen approach**: In `Analytics.tsx`, wrap the `<GridView>` in a `relative`-positioned container div. Render `<TreeColumnsPanel>` as an absolute overlay inside that container, conditionally shown via `showTreePanel` state. This mirrors the visual pattern of GridView's built-in panel without touching GridView itself.

**Alternative considered**: Add a `columnPanelRenderer` render-prop to GridView. Rejected — over-engineers GridView for a single use case.

---

### Decision 4 — Node identification via path keys

Column group nodes don't carry unique identifiers (groups have `headerName` but not `field` or `colId`). Within the tree panel, nodes are identified by a dot-joined path of `headerName` segments from the root (e.g., `"accuracy"`, `"accuracy.score"`). Leaf columns use `colId` or `field` as the final segment.

This path key is used only for React rendering keys and recursive toggle traversal — it is not persisted.

---

### Decision 5 — Visibility toggle uses recursive deep clone

When a user toggles a node, the entire `panelColDefs` tree is deep-cloned with the `hide` flag set recursively on the target node and all its descendants. Pure function — no mutation of the original colDefs.

Group checkbox state derives from descendants: checked = all leaves visible, unchecked = all leaves hidden, indeterminate = mixed. This derived state is computed at render time from the current colDefs tree.

---

### Decision 6 — skipLeafNames hides Current/Compared from the panel

Leaf columns whose `headerName` matches an entry in `skipLeafNames` (default `['Current', 'Compared']`) are not rendered as panel items. They are still included in visibility toggle operations when their parent node is toggled. From the panel's perspective, the parent metric key (e.g. "score") is the atomic visibility unit.

## Risks / Trade-offs

- **GridView re-init on remount**: Passing `panelColDefs` instead of `computedColDefs` to GridView means if the user hides a column and then the component remounts for any reason, the panel visibility is preserved. This is desirable but means `panelColDefs` and `computedColDefs` can diverge until a mode switch forces a reset.
- **`setColumnDefs` call cost**: Calling `gridApiRef.current?.setColumnDefs()` on every panel toggle causes ag-Grid to recalculate layout. For typical analytics grids with ≤ 50 columns this is imperceptible, but it would be expensive with very large column sets.
- **spec divergence**: The existing `runs-analytics-run-compare` spec describes the old column hierarchy. The delta spec must be kept in sync or the archived spec will be misleading.
