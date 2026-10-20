## Context

The app already has one established alignment mechanism: a `cellClass`/`headerClass: 'align-right'`
pair, backed by `ag-grid.scss` rules that apply `justify-end` to `.ag-cell.align-right` and
`.ag-header-cell.align-right .ag-header-cell-label`. `numericColumn`
(`constants/grid-columns/configs.ts`) bundles that pair together with a comparator, a
thousands-separator `valueFormatter`, and a numeric `filterValueGetter`. Evaluation's grid columns
mostly define their own `valueGetter`/`comparator`/`cellClass` already (index columns, status-colored
HTTP/Duration cells, compare-pair `cellClassRules`), so spreading `numericColumn` wholesale onto them
would silently clobber that existing behavior.

Investigating each target area surfaced three distinct rendering mechanisms behind "numeric column,"
not one, and each needs its own fix:

1. **Plain ag-grid `ColDef`s using the default header renderer** — `RUNS_COLUMN`, most of the
   Extraction Result execution columns, the Compare Execution Results index/HTTP/Duration pairs.
   `cellClass`/`headerClass: 'align-right'` works as-is.
2. **Ag-grid `ColDef`s with a fully custom `headerComponent`** — `buildIndexColumn`'s
   `innerHeaderComponent: EllipsisHeader` usage still renders inside ag-grid's default
   `.ag-header-cell-label` wrapper, so `headerClass` works there; but the Compare grid's
   `CompareRunIndexHeader` and a couple of `headerComponent: EllipsisHeader` overrides (not
   `innerHeaderComponent`) replace that wrapper entirely, so `headerClass: 'align-right'` is a no-op
   on their header text. The requirement is about cell content, not header labels, so this change
   still adds `headerClass` where it's free and correct, and accepts the no-op elsewhere rather than
   reworking those header components for a cosmetic label tweak.
3. **Non-ag-grid renderers whose root fills the cell** — `EditableCellRenderer`'s `<input>` has
   `width: 100%` from the `dial-input` design-system class, and `HeatMapValueCellRenderer`'s root is
   `flex ... size-full`. A ColDef `cellClass` cannot right-align content inside either: the flex
   `justify-content` on the ag-grid cell has nothing to push against once the child already fills the
   cell. These need the alignment class applied *inside* the renderer.
   The Run Comparison expanded-row panel (pivot and list) is a fourth variant of this same problem: it
   isn't ag-grid at all, just CSS-grid/flex markup, so alignment there is plain Tailwind classes on the
   value cell.

## Decisions

### `rightAlignedColumn` as a standalone fragment

`numericColumn` becomes `{ ...rightAlignedColumn, comparator, valueFormatter, filterValueGetter }`.
Every existing spread of `numericColumn` keeps exactly the same resulting `ColDef` (the new fragment
contributes only the two class properties `numericColumn` already had), so no existing column changes
behavior. `grid-columns.tsx`'s `USAGE_LOG_NUMERIC_COLUMNS` derivation
(`c.cellClass === 'align-right'`, a strict string check) still matches, because `rightAlignedColumn`'s
`cellClass` is the same literal string, not an array.

New Evaluation columns spread `rightAlignedColumn` alone, keeping their own `valueGetter`,
`comparator`, and `cellClassRules` untouched.

### Composing `cellClass` where one is already a function

The Extraction Result HTTP and Duration columns compute `cellClass` from the response status
(`getTestCaseStatusClass`) for color, not alignment. The fix wraps that function so it returns
`align-right` alongside whatever status class it already returned, instead of replacing it:

```ts
cellClass: (params) => classNames('align-right', getTestCaseStatusClass(params.data?.responseStatusCode)),
```

This is the same pattern as the existing `cellClass: 'align-right text-accent-secondary'` literal
elsewhere in `grid-columns.tsx` — a right-aligned figure keeps whichever other class it already had.

### A fieldKey allowlist for the expanded-row panel, not `RowDetailField.isNumeric`

`RowDetailField.isNumeric` already exists, but it means something narrower than "should render
right-aligned": it drives numeric diffing (`getFieldDiffKind`) and the pivot column's width tier
(`resolvePivotFieldWidthTier`), and its value per field is deliberately inconsistent with the
alignment rule — `# Run number` ships `isNumeric: false` (it's an index/badge, not a value to diff
numerically) while `HTTP` ships `isNumeric: true`. Repurposing it for alignment would either misalign
the run-number field or change its diff/width semantics as a side effect.

Instead, alignment for this panel is a small dedicated predicate keyed on the three fieldKey
constants the ticket names (`ROW_DETAIL_RUN_NUMBER_FIELD_KEY`, `ROW_DETAIL_HTTP_FIELD_KEY`,
`ROW_DETAIL_DURATION_FIELD_KEY`) — the same style of fieldKey switch `resolvePivotFieldWidthTier`
already uses for width. This also keeps the change scoped to exactly the three fields the ticket
lists, rather than reaching into generic `testCaseData`/`extractedColumns` rows, which don't carry
real type information at this layer (their `isNumeric` is hardcoded `false` regardless of the
underlying value) and are out of scope here.

### `EditableCellRenderer` gets an opt-in prop, not a type-based default

`EditableCellRenderer` is shared by many non-numeric grids (Roles, Interceptors, …), so its default
behavior cannot change. It gains an optional `isRightAligned?: boolean`, applied as `text-right` on
both the editable `<input>` and the read-only `<div>` fallback. `getGroupedSchemaColumn` passes it
(via `cellRendererParams`) only from the `INTEGER`/`NUMBER` branch, plus `cellClass`/`headerClass:
'align-right'` on the `ColDef` itself for the read-only rendering, where `.ag-cell`'s own
`justify-content` is what moves an unstretched `<div>`.

### `HeatMapValueCellRenderer` changes its default instead of taking an alignment prop

`Common/HeatMap/HeatMapValueCellRenderer` has exactly two callers today —
`Runs/Compare/HeatMap/HeatMapValueCellRenderer` (Heat Map results) and
`TestSuites/Trends/utils/build-stability-columns.ts` (Test Case Stability) — both Evaluation, both
wanting right alignment. `Analytics/Usage/Charts/ActivityHeatmap.tsx` renders its own cells and does
not use this component. Given there is no second call site pulling the other way, this change edits
the shared renderer's className directly (`justify-center` → `justify-end`) rather than adding an
`align` prop for a choice nothing currently makes. If a future consumer wants centered values, that's
the moment to parameterize it — see `.claude/rules/components.md` §2 (don't over-engineer for a
single use).

### `ScoreBar` cells: a ColDef fragment in the grid, a prop in the row-detail panel

A metric rendered above a score threshold shows as a `ScoreBar` plus a formatted number
(`MetricScoreCellRenderer` in grids, `FieldValue`'s score branch in the row-detail panel), and both
needed the same fix as everything else, split by the same case 1/3 mechanics from the Context:

- **Grids** (`getMetricsColumns` in `Runs/View/utils.ts`; `buildMetricColumn` and
  `buildComparedMetricColumn` in the Compare grid's `columns.ts`) are case 1: `MetricScoreCellRenderer`
  renders an unstretched `<div>`, so the existing ag-grid `.ag-cell` flex row already has room to push
  it right — a plain `...rightAlignedColumn` spread on the `ColDef` is enough, no renderer change.
  Alignment is per-column here, not per-cell-value: a metric column's plain-text cells (a
  non-score-indicator value, or a missing-data dash) right-align along with its score-indicator ones,
  which is consistent with treating the whole column as a numeric metric column.
- **The row-detail panel** is case 3: `FieldValue`'s score branch is its own `flex items-center gap-2`
  row, and in `DetailRow`'s (non-flex) value cell that row is a block box that fills the cell width by
  default — so the ancestor's `text-right` (which works for the panel's plain-text fields) has nothing
  to act on; the div's own `justify-content` needs to move. `FieldValue` gains an optional
  `isRightAligned?: boolean`, applied as `justify-end` on that div only. In `PivotValueCell`'s (flex)
  layout the div is instead a shrink-to-fit flex item already pushed right by the button's own
  `justify-end`, so passing the same prop there is a no-op today — done anyway so the two callers stay
  symmetric and the prop keeps working if that layout ever stops being flex.
- `isRightAlignedRowDetailField` — the same predicate `PivotValueCell` and `DetailRow` already used for
  Run number/HTTP/Duration — gains `|| field.isScoreIndicator`. `isScoreIndicator` (unlike
  `isNumeric`) already means exactly "renders as a `ScoreBar`", so no new field-identity list is
  needed here the way Run number/HTTP/Duration needed a fieldKey allowlist.

## Consequences

- `numericColumn` callers are unaffected; `rightAlignedColumn` is available for any future column that
  needs alignment without the rest of `numericColumn`'s behavior.
- `Grid/columns/turn-columns.tsx#getGroupedSchemaColumn` is shared by both Dataset and Test Suite Test
  Cases grids, so fixing it once right-aligns numeric schema columns in both places — a deliberate,
  positive side effect, consistent with how `RUNS_COLUMN` already being shared fixes the Runs tab and
  the Compare Against modal together.
- Header-label alignment is best-effort: it lands wherever ag-grid's default header renderer is in
  play, and is skipped (not faked) wherever a column already overrides `headerComponent` entirely —
  see Decision 2. No column's header text moves in a way that contradicts its cell content.
- `EditableCellRenderer`, `Common/HeatMap/HeatMapValueCellRenderer`, and `FieldValue` are all shared,
  general-purpose components; the changes here are additive (a new optional prop) or scoped to their
  only current callers (a default flip with no other consumer), so none becomes Evaluation-specific.
