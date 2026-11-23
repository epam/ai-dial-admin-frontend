## Context

The Extraction result tab (`Runs/View/ExtractionResult.tsx`) renders `GridView` with plain `ag-grid-react`
(community — there is no `ag-grid-enterprise`, so no native row grouping or tree data). Row data is
`AnalyticsResult[]` with `testCaseScore` attached from the test-case-scores query (`attachTestCaseScores`);
`colDefs` are built once per results load by `getAnalyticsColumns` and live in `ExtractionResultTabUiState`,
where `onPanelColumnsChange` also overwrites them with the user's columns-panel choices. The tab state is
reset when the run id changes (`useRunViewTabState`). Click handling reads `event.data.id` to open the row
detail panel, and `useDetailMode` derives the selected result's score from a map built over `rowData`.

Position-column visibility already follows the data: `getUniformExecutionFields` hides `# Run number`,
`Request` and `Turn` when they never vary. Overall score is already a per-row column (spec
`run-results-overall-score`).

See `proposal.md` for motivation. PR #5213 is a visual reference only; its file layout predates the current
`Runs/utils/` and `Runs/Details/` split.

## Goals / Non-Goals

**Goals:**

- Grouping as a pure projection of the existing result rows: no new data, no new request.
- Stored `colDefs` and the user's columns-panel choices stay untouched by the grouping switch.
- Every behaviour in the two specs is reachable from a unit test of a pure function or of one component.

**Non-Goals:**

- Anything in the proposal's Non-goals, and no change to shared Grid components (`GridView`,
  `AgGridWrapper`, `OverallScoreCellRenderer`, `ScoreCellRenderer`).
- Server-side or paged grouping: the grid already holds all rows of the run in memory.

## Decisions

### D1. Grouping is a flat list with group rows, built outside the grid

Without enterprise row grouping, `rowData` becomes `[groupRow, ...resultRows, groupRow, ...]`, rebuilt in a
`useMemo` from the scored rows, the collapsed keys and the grouping flag. Collapsing drops a group's result
rows from the array.

- **Alternative — full-width group rows** (`isFullWidthRow` + `fullWidthCellRenderer`): rejected. The score
  must sit in the Overall score column under its header; a full-width row cannot align to a column.
- **Alternative — AG Grid master/detail or enterprise tree data**: rejected, new licensed dependency.

### D2. A discriminated row type, not a faked `AnalyticsResult`

New models in `Runs/models.ts` (beside `TestCaseScoreSummary`): an enum `ExtractionRowType { Group, Result }`
and a `TestCaseGroupRow` interface with `rowType`, `groupKey`, `testCaseName`, `testCaseScore` and
`isExpanded`. Result rows are the existing scored `AnalyticsResult` tagged with `rowType: Result` and
`groupKey`. The old PR typed a group as an `AnalyticsResult` with `undefined as unknown as number` and
`runIndex: 0`; that leaks fake data into every column that reads `runIndex`. Here a group row has no
`runIndex`/`id`/`executionInfo` at all, so field-based cells are blank by construction, and a type guard
(`isTestCaseGroupRow`) is the one place that tells the two apart.

### D3. Pure builder in `Runs/utils/test-case-groups.ts`

- `buildTestCaseGroupRows(rows, collapsedKeys)` — groups by `testCaseId ?? testCaseName ?? id`, orders groups
  by `testCaseName` with `localeCompare` (ties by key), orders each group's rows by `runIndex → requestIndex
  → turnIndex` with a stable tiebreak on source index, and emits the flat list. Missing indices count as 0,
  as `sortCompareRows` in `View/utils.ts` already does.
- The group row's score is read from its first result row's `testCaseScore`. Scores were attached to every
  row from the same lookup, so the first row is as good as any and no second lookup is needed.
- `hasVaryingExecutionIndices(results)` goes into `utils/evaluation/column-variation.ts`, defined as
  `results.length > 0 && getUniformExecutionFields(results).size < EXECUTION_INDEX_FIELDS.length`. Reusing the
  helper makes the spec's "same condition that shows a position column" true by construction.

### D4. Grouped columns are derived at render time, not stored

`getAnalyticsColumns` keeps producing the flat definitions that live in tab state. When grouping is active,
`ExtractionResult.tsx` passes `GridView` a `useMemo`-derived copy produced by a new pure function
(`Runs/View/grouped-columns.ts`) instead of regenerating and storing `colDefs`. Rationale: the old PR
rebuilt and stored `colDefs`/`panelColDefs` in an effect on every toggle, which would discard the user's
column visibility and order from the columns panel. The derived copy changes only:

1. **A toggle column in front** — a new leaf `groupToggle`, `pinned: 'left'`, `lockPinned`, `lockPosition:
   'left'`, `suppressMovable`, not resizable, with `GroupToggleCellRenderer`. It renders the chevron button
   (`aria-expanded`, labelled collapse/expand; no `aria-controls`, the controlled rows being siblings with no
   single container to reference; `aria-hidden` icon per `a11y.md`) inside a `role="group"` + `aria-label`
   root for group rows, and nothing for result rows. It exists only in this derived copy, so the columns
   panel (built from the stored definitions) never lists it and the user can neither hide nor move it. It
   replaces an earlier layout that put the chevron inside the Test Case name cell: with the status column
   to the left of the name, that read as misaligned next to the nested rows.
2. **Test Case name** — stays a plain cell. A `font-semibold` class rule bolds it on group rows; no renderer
   and no indent, so group and result names share one left edge. — empty cell for result rows, the existing `OverallScoreCellRenderer` for group rows.
3. **Every other leaf** — blank on group rows. Columns that already have a `cellRenderer` (status, metric
   `ScoreCellRenderer`) get a `cellRendererSelector` that returns an empty component for group rows and the
   original renderer with its original params otherwise — both branches explicit, so the result does not
   depend on how AG Grid falls back when a selector returns `undefined`. Columns without a renderer whose
   `valueGetter` or `valueFormatter` substitutes `—` (input bindings, extracted, `Duration`) get a wrapper
   that returns `null` (getter) or `''` (formatter) for group rows. Index and `HTTP` columns already read
   optional fields and need nothing.
4. **Sort/filter** — `sortable: false`, `filter: false`, `floatingFilter: false` on every leaf.

Because the derived defs keep each column's `hide`, `colId` and width, AG Grid keeps column state (order,
visibility, width) when the array identity changes; this is verified in the browser task rather than assumed.

- **Alternative — regenerate and store grouped `colDefs`** (old PR): rejected for the state-loss above.
- **Alternative — blank cells with `valueGetter` checks inside `getAnalyticsColumns`**: rejected, it spreads
  group-row branches through ~8 column builders; one transform keeps them in one tested place.

### D5. State lives in the Extraction result tab state

`ExtractionResultTabUiState` gains `isGroupedByTestCase: boolean` (default `false`: the grid opens as the flat
list, grouping is opt-in) and
`collapsedGroupKeys: string[]`. Both survive tab switches because the tab state is owned by
`useRunViewTabState`, and both reset on a run change for free (the hook resets the whole state). Collapsed
keys are kept when grouping is toggled off and on (a spec scenario) since they are separate from the flag.
The effective mode is `isGroupedByTestCase && canGroup`, where `canGroup` comes from
`hasVaryingExecutionIndices(results ?? [])`; `View.tsx` computes the same value for the switch.
`collapsedGroupKeys` is an array rather than a `Set` so the state stays serialisable and cheap to patch.

### D6. Clearing sort/filter on entering grouped mode

An effect keyed on the effective grouping flag calls `api.setFilterModel(null)` and
`api.applyColumnState({ defaultState: { sort: null } })` when it turns on, and again when it turns off, so
neither mode starts with state the user cannot see. Hiding the controls alone (D4.4) would leave a previously
applied sort or filter active and silently reorder groups or drop result rows.

### D7. Click handling and styling

`onCellClicked` and `onRowClicked` return early for group rows **before** setting `cellClickHandledRef`,
otherwise the next real row click would be swallowed. Group rows carry a `getRowClass` hook (bold, `bg-layer-2`
style using tokens) so they are visually distinct; the accessible distinction is the `role="group"` in D4.1,
not the colour. `rowClassRules` for the selected row keys on `data.id`, which a group row lacks, so no change.

### D8. The switch

`View.tsx` renders the ui-kit 2.0 `Switch` (`isOn`, `labelProps`, `onChange`) in `columnsTabsTrailing` next to
the Columns button, only on the Extraction result tab and only when `canGroup`. The label is a new
`RunsI18nKey` entry, with sibling keys for the chevron's expand/collapse labels; common labels are reused
from the shared sections per `components.md` §10.

### D9. Two grid behaviours found only in the browser

Both passed in jsdom and failed in the real grid, so both now have a unit test pinning the cause.

- **Redraw when the grid takes new columns.** The grid applies `columnDefs` a render after `rowData`, so on
  a mode switch the new rows are first evaluated against the previous mode's definitions, and a cell it has
  already computed is not recomputed when the definitions swap — group rows kept the flat list's `—` in
  `Duration` and the extracted columns. `ExtractionResult.tsx` redraws the rows in `onNewColumnsLoaded`.
- **Keyboard focus survives a toggle through a callback, never a ref.** A toggle rebuilds the rows, which
  remounts the group's button and drops focus to `body`. The toggle records the group key for a fixed
  window (`FOCUS_RESTORE_WINDOW_MS`), and the button that mounts for that group calls
  `consumeFocusRequest(groupKey)` and takes focus. The window is a timeout, not "until the next frame":
  the grid mounts the rebuilt cell at a time it decides, and clearing after one frame had already lost the
  race. The function has to be a function: the grid deep-merges plain objects in `cellRendererParams`, so a
  `{ current }` ref reaches the renderer as a copy that never sees the request. `grouped-columns.spec.ts`
  asserts the name renderer's params are all functions.
- **Alternative — keep the cell mounted** with a stable `getRowId` and in-place row updates: rejected for
  now. `AgGridWrapper` only wires `getRowId` for live data, and an in-place update would leave the
  renderer's `isExpanded` stale because the cell value (the name) does not change.

## Risks / Trade-offs

- [Rebuilding `rowData` on every expand/collapse re-renders all rows] → the grid already holds the whole run
  in memory and uses client-side rows; the projection is O(n log n) and memoised on its inputs. If runs of
  many thousands of rows prove slow, `getRowId` plus incremental `applyTransaction` is the follow-up.
- [Passing a derived `columnDefs` array might reset column order/visibility in `GridView`/AG Grid] → keep
  `hide`, `colId` and widths identical, derive inside `useMemo` so identity changes only with the grouping
  flag, and cover with the browser verification task.
- [Whole-run grouping condition shows a one-row group for single-request test cases] → accepted in the
  proposal; it keeps the toggle stable and the layout uniform.
- [Alphabetical group order differs from the backend's order] → intentional: the backend order interleaves
  test cases, which is the problem being solved.
- [`cellRendererSelector` semantics differ between AG Grid versions] → both branches return an explicit
  component, so no fallback behaviour is relied on.
- [Collapsing the group containing the selected result hides the highlighted row while the panel stays
  open] → specified behaviour; the panel is keyed by result id, not by row presence.
