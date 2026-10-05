## Context

See `proposal.md` — Why. Requirements live in `specs/eval-runs-list/spec.md`, plus MODIFIED deltas on
`specs/run-status-display/` and `specs/grid-column-selection/`.

Three surfaces consume `RUNS_COLUMN` (`src/constants/grid-columns/grid-columns.tsx:1276`):

| Surface               | Component                                                    | Grid        | `storageKey`            | Row click today                          |
| --------------------- | ------------------------------------------------------------ | ----------- | ----------------------- | ---------------------------------------- |
| `/runs`               | `ListView/Evaluation/List.tsx` → `ListEntities`              | infinite    | `ApplicationRoute.Runs` | `onCellClicked` → run details (same tab) |
| Test Suite → Runs tab | `TestSuites/Runs/Runs.tsx` → `GridView`                      | infinite    | none                    | always `window.open` new tab             |
| Compare picker        | `Runs/Compare/SelectCompareRunModal.tsx` → `RadioSelectGrid` | client-side | none                    | radio select                             |

Sizing facts established in `AgGridWrapper.tsx` and AG Grid 35.2.1, which the decisions below rest on:

- `defaultColDef` sets `minWidth: 150` and `flex: 1` for **every** column (`:211`).
- `autoSizeStrategy={!storageKey ? { type: 'fitGridWidth' } : void 0}` (`:272`) — so `/runs` (which
  has a `storageKey`) gets no strategy at all and the suite tab gets `fitGridWidth`. Neither surface
  can reach `fitCellContents` today.
- Autosize never clears `flex` (there is no `setFlex` call in the autosize path), so a measured width
  on a column that still has `flex: 1` is re-stomped by the next flex pass.
- `normaliseColumnWidth` clamps to `limits.minWidth ?? column.getMinWidth()`: a strategy's
  `columnLimits` / `defaultMinWidth` wins **at autosize time**, but manual resize and later
  flex/fit passes clamp to the colDef's own `minWidth`.
- Autosize dispatches `columnResized` with `source: 'autosizeColumns'`, and
  `onColumnResized={handleStateUpdated}` (`:281`) persists it — so on a grid with a `storageKey` the
  first visit's measured widths are saved and thereafter restored as if the operator had dragged
  them.
- Cells are measured from rendered DOM only, once; under the infinite row model that is the first
  block.
- Cell padding comes from balham's `--ag-cell-horizontal-padding` (12px each side). `ag-grid.scss`'s
  `padding: 0 !important` is scoped to `.heat-map-grid`, not this grid.

## Goals / Non-Goals

**Goals:**

- One shared column set, three explicit variants, no per-surface column drift.
- Columns sized to content without wrapping; the flexible three absorb the remaining width.
- Truncation that is measured at the rendered width and always has a full-value affordance.
- Mock-backed columns swappable to real data by editing one `valueGetter` each.

**Non-Goals:**

- Converging the two runs lists (see `proposal.md` — Non-goals; drift recorded under Risks below).
- Row virtualization / row-height changes. The two-line cells fit the existing 48px `ROW_HEIGHT`.
- Making `fitCellContents` re-measure as later infinite blocks arrive.

## Decisions

### 1. Two-line cells are a renderer concern only — no row-height change

A `TitleSubtitleCellRenderer` with `flex flex-col` and `min-w-0`, `dial-small-text text-primary` on
the title and `dial-tiny-text text-secondary` on the subtitle: 20px + 16px = 36px inside the 48px
`ROW_HEIGHT`. No `TWO_LINE_ROW_HEIGHT`, no `rowHeight` override, no per-column height.

Mechanics that come for free and must not be re-implemented: the global
`.ag-cell { @apply flex items-center }` (`src/scss/ag-grid.scss:128`) centres the block vertically;
`.ag-cell-value { flex: 1 1 auto; overflow: hidden }` gives the slot an auto-minimum of 0 so it
shrinks with the column; `white-space: nowrap` is inherited from base `.ag-cell`. The renderer adds
**no** horizontal padding — the theme already supplies 12px, and `TestCaseNameCellRenderer` is the
in-repo proof (it has no `px-*`). `StackedTurnsCellRenderer` is the closest precedent, but it uses
the legacy `className="tiny"`; new code uses `dial-tiny-text`.

Each line truncates independently and carries its own tooltip. Use `EllipsisTooltip` (ui-kit 2.0),
not `DialEllipsisTooltip` (1.0, superseded).

`Target` uses the same renderer: entity name over entity type (Application / Model / MCP).

### 2. Status is an indicator plus an accessible name, not a bare dot

`RunStatus.tsx` is shared with `Runs/Summary/Header.tsx`, where the visible label must stay — so add a
label-less variant (a `hideLabel`-style prop) rather than editing the existing output. Two gaps the
dot-only column makes load-bearing:

- The transitional branch (`DialLoader` + `<span>`) has **no tooltip** today. Dropping its label
  would leave a running run with no way to read its status; the variant must tooltip both branches.
- A tooltip is not an accessible name. The cell keeps the label as `sr-only` text (or an
  `aria-label`), so the column is not colour-only — which is also what `a11y.md`'s
  "row-like collections" and "hover-only affordances" rules require.

Column definition: `headerName: 'Status'` is retained and rendered by the grid's default header, so
the column name and its sort control are both on screen. The column stays pinned to the indicator
width (`width` / `minWidth` / `maxWidth` all equal, since the grid's global `minWidth: 150` and
`flex: 1` would otherwise stretch it), which is narrower than the word `Status` — so the label
truncates and `headerTooltip` keeps it readable. `ACTION_COLUMN`'s `UTILITY_COLUMN_WIDTH = 32` is the
precedent for a fixed utility-width column in this codebase.

The filter row keeps `floatingFilter` on so its filter button stays where every other column's
controls are, but overrides `defaultColDef`'s shared search input with an empty body
(`EmptyFloatingFilter`): a status is a fixed value, so a `contains` query cannot express it
(`dateFilter` already sidesteps the box for the same reason, by turning `floatingFilter` off). Turning
`floatingFilter` off instead would move that button up into the header cell — AG Grid renders it in
one place or the other (`isHeaderFilterButtonEnabled` is gated on `!isFloatingFilterButtonDisplayed`)
— which is not where an operator looks for it.

An empty body still occupies the cell, leaving the button where an input's right edge would have
been, so `EmptyFloatingFilter` renders a marker span (`FILTER_BUTTON_ONLY_CLASS`) and `ag-grid.scss`
hides the body and centres the button on `.ag-floating-filter:has(.ag-grid-filter-button-only)`. The
marker is what makes this work for any such column: `headerClass` reaches only the header cell, not
the filter row's (`setupClassesFromColDef` lives on `HeaderCellCtrl`, and `HeaderFilterCellCtrl`
applies `headerStyle` only).

> An `sr-only` header component was tried first, so the column could render at indicator width. It
> replaced the whole default header cell — name and sort control with it — leaving the column neither
> sortable nor filterable from the grid. Reverted in favour of the visible header above.

### 3. `fitCellContents` opt-in on `AgGridWrapper`, restricted by `colIds` — REVERTED

> **Reverted after implementation, at the user's request:** no `autoSizeStrategy` prop was kept on
> `AgGridWrapper` / `GridView`, and neither runs surface passes a strategy — the grid keeps its
> original `!storageKey ? fitGridWidth : undefined`. Column widths are configured explicitly on the
> column defs instead, on top of the grid's global `flex: 1`: a `maxWidth` ceiling on the narrow columns
> (the two counts, Duration, Cost, Overall score), a `minWidth` floor on Target and the two dates, and
> `width` / `minWidth` / `maxWidth` all equal on Status (no `suppressAutoSize`, nothing to suppress).
> Ceilings rather than floors on the narrow ones is what keeps a two-digit count from being padded out:
> with `flex: 1` left in place, a floor alone still lets the column grow. The
> reasoning below is kept as the record of what was tried; Decision 4 still stands, since the
> `fitGridWidth` default also dispatches grid-computed resizes.

Add an explicit prop (e.g. `autoSizeStrategy`) that a consumer passes, keeping the current
`!storageKey ? fitGridWidth : undefined` as the default so no other grid changes. The runs surfaces
pass:

```
{ type: 'fitCellContents', colIds: [<the nine auto-content colIds>] }
```

`colIds` (not the whole grid) is what keeps autosize off `Test case run name`, `Test Suite ID` and
`Metrics`, which keep `flex: 1` and split the remainder. `scaleUpToFitGridWidth` is deliberately not
used — it would grow the measured columns too.

The nine auto-content columns must **drop `flex`** (set `flex: 0` explicitly, since `defaultColDef`
supplies `flex: 1`), or their measured widths are overwritten by the next flex pass. They also need
per-column `minWidth` below the global 150 (Status, Runs, Test cases in particular), because relying
on the strategy's `columnLimits` alone leaves manual resize and later fit passes clamping back to 150.

`Target` gets a `columnLimits` `maxWidth`: it is measured from the first block only, and a long
entity name in row 1 would otherwise fix the column wide for the whole session.

### 4. Autosize-sourced resize events are not persisted

`onStateChanged` writes `api.getColumnState()` on every `columnResized`. Autosize fires that event
with `source: 'autosizeColumns'`, so measured widths get saved and then restored on the next visit —
which both defeats re-measuring and records a width the operator never chose. `handleStateUpdated`
must ignore `columnResized` events whose `source` is `'autosizeColumns'` (leave `'uiColumnResized'` /
`'uiColumnDragged'` persisting as today). This is the `grid-column-selection` MODIFIED delta.

### 5. Versioned `storageKey` for `/runs`

`/runs` persists per-view state under `storageKey={route}`. Restored state is applied two ways —
`mergeStoredColumnDefs` (stored props under the colDef's own props) and
`gridApi.applyColumnState({ state: model.columns })`, which does apply stored `width` / `flex` /
`hide` — and `GridView` restores order and visibility through
`getColumnVisibilityFromGridState`. Consequences for an existing user:

- `testSuiteId` was stored `hide: true` and stays hidden, so the reworked column never appears.
- Stored widths for `id` / `testRunName` / `status` override the new sizing.
- `applyColumnStateOrderToColDefs` orders by stored state first, so Status does not move to the
  front.

Bump the key for this view (a versioned suffix, e.g. `${route}-v2`) so the reworked set starts from
its defaults. Cost: an operator's own hide/reorder/width choices on the runs list are discarded once.
Rejected alternative: a migration that rewrites the stored model — more code, and there is no stable
mapping from the old `id` + `testRunName` pair to the combined column.

### 6. Mocks behind `valueGetter`, in one deletable module — SUPERSEDED, mocks removed

> **Superseded once the query API exposed the real fields:** `Runs/mocks/` is deleted.
> `RUN_SELECT_FIELDS` (`ListView/Evaluation/utils/constants.ts`) already projected `suite_type`,
> both `*_deployment_ref::*` groups and `metric_names`; once the backend started answering them
> instead of null, Target's `valueGetter` moved to `resolveRunTarget` (`Runs/utils/run-list-values.ts`,
> reading `run.suiteSnapshot`) and Metrics' to `run.metricNames` directly. Cost and Overall score read
> `run.totalCost` / `run.overallScoreValue`, which `mapRunRow` fills from `total_cost` /
> `overall_score_value` — two fields the backend appends to a row *after* the query runs, so they are
> deliberately absent from `RUN_SELECT_FIELDS` (naming them in a `select` would be naming a field the
> entity schema does not declare) and stay `sortable: false, filter: false` permanently, not just
> until "the real fields land". Target and Metrics, being real `select`ed fields, gained sort/filter
> per Decision 6b below. The two count columns are unaffected and keep `derivedRunColDef`.
>
> The original decision (mock module, its determinism rule, and the fixture-coverage rule) is kept
> below as the record of what shipped first.

`valueGetter` is already the established seam in this file (`:272`, `:983`, `:1099`, `:1193`). Each
mock-backed column defines `valueGetter: (p) => mockX(p.data)` against
`src/components/Runs/mocks/run-list-mock-data.ts`; renderers, sizing, truncation and tests are
production code, and the swap is one line per column.

Rules for the mock module:

- **Deterministic, seeded off `run.id`** — never `Math.random()`. The infinite row model re-renders
  rows on scroll and sort, and the Metrics renderer measures widths at render time, so a random value
  makes the `+N` badge flicker and makes tests non-reproducible.
- All five mock-backed columns are `sortable: false, filter: false`; the endpoint can neither sort nor
  filter them, `sort=cost,ASC` names a column it has not got, and a filter on one is a server request
  that comes back empty rather than filtered. The two count columns carry the same pair, as they did
  before this change. Both flags flip when the real fields land.
- Fixtures must cover 0 metrics, 1 metric, ~12 metrics, null cost, null score, and a `RUNNING` run
  with neither — the edge cases that must keep working after the real-data swap.
- Every mock-backed column keeps a `field` (`target`, `metrics`, `duration`, `cost`, `overallScore`),
  because `updateColumnVisibilityInStorage` matches stored state by `def.field === col.colId` and the
  columns panel keys on `field ?? colId`.

`Duration` is **not** mocked: derive it from `startedAt` / `completedAt`, reusing the existing helper
shape in `TestSuites/Trends/utils/parse-trends.ts:19` (null unless both are present and the delta is
finite and non-negative).

### 6b. Runs, Test cases, Target and Metrics gain real sort/filter; Duration/Cost/Overall score do not

The backend later added `number_of_runs` as a real, flat `test_suite_runs` field (mirroring
`number_of_test_cases`). `mapRunRow` nests it as `runConfig: { numberOfRuns }` rather than a new
top-level property, matching the shape the legacy `GET /test-suite-runs` response already used for the
Test Suite Runs tab and compare picker — so the existing `field: 'runConfig.numberOfRuns'` colDef (AG
Grid's own dot-path field resolution) keeps working unchanged for both data sources, with no
`valueGetter`. `RUN_COLUMN_TO_DSL_FIELD` keys this DSL mapping by the colId itself
(`'runConfig.numberOfRuns'`), not a bare `numberOfRuns` — the map is a colId → DSL-field lookup, and a
key that doesn't match the actual colId silently drops the sort (`buildRunsSort` treats a missing entry
as "not sortable" rather than erroring). The Runs and Test cases columns drop `sortable: false` (left
to the grid default) but keep `filter: false` — a numeric filter UI for the two counts was not asked
for.

Target combines two physical fields (`deployment_ref::name` for a `DEPLOYMENT` suite,
`mcp_deployment_ref::name` for an `MCP_TOOL` one) — the same shape the test suites list already solved
for its `application` column (`test-suites-query.ts`'s `buildApplicationFilter` /
`APPLICATION_FILTER_COLUMN`). `runs-query.ts` mirrors it for filtering: `buildRunTargetFilter` ORs a
`co`/`eq`/`ne` comparison across both name fields, keyed off a new `RUN_TARGET_FILTER_COLUMN = 'target'`;
the column declares `evalStringFilter([EQUALS, NOT_EQUAL, CONTAINS])`.

Sorting Target has no equivalent OR: a `SortItem` names exactly one field, and there is no DSL
expression for "whichever ref is set". Asked directly, the user chose to approximate it by sorting on
`deployment_ref::name` alone (over leaving Target unsorted, or gating on a backend-side unified field
that does not exist) — `buildRunsSort` maps `RUN_TARGET_FILTER_COLUMN` to `DEPLOYMENT_REF_NAME_FIELD`
unconditionally. The consequence: `MCP_TOOL` rows, which carry no value in that field, sort together at
one end rather than interleaving by their own MCP name. `buildTestSuitesSort`'s treatment of
`application` (skipped entirely, no approximation) remains the precedent for a column that has *no*
sort rather than an approximate one — that path was deliberately not reused here per the same request.

Metrics maps directly to `metric_names`, a single real field, via `RUN_COLUMN_TO_DSL_FIELD['metrics']`.
It gets both a filter (`evalStringFilter([CONTAINS])` — "does the run's metric list include this name")
and sort, left to the grid's default (`sortable` unset).

Cost and Overall score do not follow: `overall_score_value`/`total_cost` are appended to a row after
the query executes (see Decision 6's superseding note), so there is no DSL field to filter or sort by,
ever — this is a permanent constraint, not a "not yet wired" one.

### 7. Metrics reuses `TagsCellRenderer`, with a tooltip added to `+N`

`TagsCellRenderer` already does exactly the specified overflow: it measures each tag against
`container.offsetWidth`, reserves room for the counter, backs off `fitCount`, and reflows via
`ResizeObserver` — i.e. measured at render time, not a fixed tag count. What is missing is the
tooltip listing the hidden names; add that, and give the `+N` element keyboard reachability so the
hidden names are not mouse-only (`a11y.md`, hover-only affordances).

Its two known defects (an early `if (!items) return` above the `useRef` calls — a rules-of-hooks
violation; `setItemRef` / `hiddenCountRef` each assigned twice) are fixed only if the Metrics work
touches those lines; a broader cleanup is a separate change.

### 8. Three explicit column variants, not conditional flags

- `RUNS_COLUMN` — the full 12 for `/runs`.
- A suite variant = `RUNS_COLUMN` minus `testSuiteId` (derived by filtering on `colId`, in the spirit
  of the existing `suppressCellTooltips` / `restrictSort` helpers in this file) — the suite tab is
  already scoped to one suite.
- A compare-picker subset (Status, Test case run name, Runs, Test cases, Start Date, End Date) for
  `SelectCompareRunModal`. A picker exists to identify a run; mock-backed columns have no business
  in a modal the operator makes a decision in.

### 9. Row activation on the suite tab matches `/runs`

`TestSuites/Runs/Runs.tsx` currently calls `onOpenInNewTab(...)` for every non-actions cell. Route it
through the shared `navigateEntityUrl` / `onCellClicked`
(`components/EntityListView/utils/on-cell-clicked.ts`) so a plain click pushes the run details route
and ctrl / cmd / middle-click still opens a new tab. The Actions column stays excluded by its
`ACTIONS_COLUMN_CEL_ID` check.

## Risks / Trade-offs

- **`/runs` has no `useRunStatusStream`** — only `useCancellingRunsPoll`. A status that is a dot plus
  a tooltip goes stale as quietly as the text did, but with less on screen to make the staleness
  legible. Accepted; adding SSE to `/runs` is out of scope.
- **The key bump discards operator column state on `/runs`** once, silently. Accepted as the cheaper
  half of Decision 5.
- **Mock data on a real list.** ~~Four columns will show plausible values that are not the run's.~~
  Resolved: `Runs/mocks/` is deleted (Decision 6), all four columns read the run's own data.
- **The runs list is filterable on seven columns** — Status, Test case run name, Test Suite ID, Target,
  Metrics and the two dates. Cost, Overall score and the two counts are values the endpoint does not
  accept as a filter, and a filter it rejects comes back as an empty grid with no message
  (`EvaluationListView` renders a failed page that way). Accepted: an empty list is worse than an
  absent control.
- ~~**`fitCellContents` measures the first block only.**~~ Moot once Decision 3 was reverted: no column
  is measured from row data, so no page can widen or narrow one. Column widths are whatever the column
  defs say, and a value wider than its column truncates.
- **The two runs lists stay separate** (recorded decision). The suite tab keeps its own SSE stream,
  its page-0 pre-fetch, its new-tab-only actions and no columns panel; `/runs` keeps persistence and
  the panel. Every future column change has to be made aware of both consumers — known debt, not a
  bug to fix here.

## Migration Plan

Frontend-only. No feature flag: the reworked columns shipped with mock values first, then the mock
module was deleted once the query API exposed the real fields (Decision 6); the `storageKey` bump is
the only user-visible state change either step made. Rollback is a revert plus reverting the key bump
(which restores the operator's pre-change column state, since the old key's entry is never deleted).
