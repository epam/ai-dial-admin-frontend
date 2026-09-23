## Context

See `proposal.md` — Why. The code this change moves through, and what each piece already assumes:

- `getAnalyticsColumns(results)` (`components/Runs/View/utils.ts:267`) already takes the loaded results
  and already derives three of the grid's four column groups from them — metrics, input bindings and
  extracted columns all come from a merged schema over the rows. The `Execution` group is the exception:
  it is a module-level const, `executionColumns` (`utils.ts:161`), embedded in `staticColumns`
  (`utils.ts:204`). So the function's shape already supports a data-derived group; one group has simply
  never needed to be one.
- The same function already ships a group hidden by default — `getInputColumns(input, true)`
  (`utils.ts:276`) sets `hide: true` on every `INPUT BINDINGS` leaf. Hiding by default is an established
  move in this file, not a new mechanism.
- `ExtractionResult.tsx:170-177` renders `GridView` with **no `storageKey`**. That grid therefore has no
  localStorage column state: its defaults are whatever the builder returns, held in React and reset per
  run (`use-run-view-tab-state.ts:42`). There is no persisted `hide` to reconcile with, and no
  "reset to defaults" affordance whose baseline could drift.
- The panel is `TreeColumnsPanel`, driven entirely by `colDef.hide`. `TreeColumnNode` renders a leaf as
  checked when `node.hide !== true` and a group as checked / indeterminate / unchecked from
  `getGroupCheckState`. An unchecked leaf under an indeterminate `Execution` group — the issue's second
  screenshot — needs no panel change.
- Execution column colIds are their field names exactly: `runIndex`, `requestIndex`, `totalRequests`,
  `turnIndex`, `totalTurns` (`utils.ts:150-181`), and all five are declared on `ResultDto`
  (`models/evaluation/run.ts:11-15`). No colId-to-field mapping is needed.
- On the Compare side, `getComparedExecutionColumns` (`Compare/ExecutionResults/utils/columns.ts:322`)
  emits each index column as a primary/secondary **pair** (`runIndex` + `cmp_runIndex`), all with an
  unconditional `hide: true`. Its rebuild path preserves operator toggles —
  `preserveFlatColDefHideState` / `preservePanelHideState`
  (`utils/panel-columns.ts:262-276`) return the new tree untouched when the previous one is empty — so
  the first build with data sets the defaults and later rebuilds keep the operator's choices.

## Goals / Non-Goals

**Goals:**

- One predicate decides "does this column vary" for both grids, so the two cannot drift on the meaning.
- The Extraction Result grid's defaults follow its data with no change to `GridView`, `AgGridWrapper`,
  `TreeColumnsPanel`, or `ExtractionResult.tsx`.
- The rule is a pure function of `(results, columns)`, testable without mounting a grid — which matters
  because the edge cases (no results, an all-absent column, one row) are where it would be got wrong.

**Non-Goals:**

- No persistence for this grid, and no `storageKey`. Adding one would pull in the whole stored-state
  reconciliation path and would make a data-derived default fight a remembered one.
- No generalisation into `components/Grid/utils.ts`. The rule is about evaluation results, not about
  grids; the shared grid helpers stay about colDef shape.
- No change to which columns exist, their order, widths, sorting, or filtering.
- **No browser-verification task.** Asked and declined: unit tests only. The two panel-side scenarios —
  the group rendering indeterminate, and selecting a hidden column bringing it back — are existing
  `TreeColumnsPanel` behaviour driven by `colDef.hide`, unchanged here and already exercised by that
  component's own tests; what this change actually decides is the `hide` flag the builder emits, which
  is what the unit tests pin. The residual risk is that `hide: true` reaches the panel by some path
  other than the builder's output, which `ExtractionResult.tsx:54-59` rules out by construction.

## Decisions

### The default is computed in the column builder, not applied to the grid afterwards

`getAnalyticsColumns` returns the `Execution` group with `hide: true` already set on the unvarying
leaves, rather than the grid being told to hide columns once rows load.

The builder is the only place that already knows both the columns and the rows, and its output is
simultaneously the grid's `columnDefs` and the panel's `panelColDefs`
(`ExtractionResult.tsx:54-59`). Computing there keeps those two in agreement by construction. It also
means the hidden state arrives with the first render that has data, so no column is drawn and then
removed.

*Alternative considered:* an effect in `ExtractionResult.tsx` that calls `gridApi.setColumnsVisible`
after results land. That would hide columns in the grid while leaving the panel's checkboxes checked —
the panel reads `colDef.hide`, not the grid's live column state — which is precisely the desync the
issue asks to avoid.

### Uniformity is `new Set(values).size <= 1` over `value ?? null`, and an empty result set is never uniform

Normalising `undefined` to `null` before the set collapses "absent on every row" into one distinct
value, which makes a single-turn run — where no result carries `turnIndex` at all — hide `Turn`. That is
the issue's main case, and treating absent and present-but-equal differently would leave it unfixed.

The `results.length > 0` guard is what keeps `getAnalyticsColumns([])` — called once before the fetch
resolves, at `use-run-view-tab-state.ts:15` — returning the position columns. Without it all three would
be "uniform" over zero rows, and the grid would mount narrow and then widen as data arrived. A run that
genuinely returns no results renders the empty state anyway, so nothing is lost by hiding nothing there.

*Alternative considered:* a `hasVariation` predicate per column in the style of
`hasHeatMapMultiSubRuns` / `hasHeatMapMultiTurns`
(`Compare/HeatMap/utils/heat-map-test-case-columns.ts:32-47`), which test `value > 0` rather than
distinctness. Those answer "is this run multi-turn at all", which is a different question: a run whose
every result sits at turn 3 is multi-turn by that test and still has a column that reads `4` on every
row. Distinctness is what the issue asks for.

### The mapper only ever sets `hide: true`

`hideUniformColumns(columns, uniformFields)` sets `hide: true` on a match and returns every other
column untouched — it never writes `hide: false`.

This is what lets one predicate serve both grids. Compare's Execution children are unconditionally
hidden today because a comparison opens on the metrics being compared; a symmetric rule would reveal
them whenever the runs happened to span several turns, which is a change to a deliberate default rather
than a removal of noise. Keeping the mapper one-directional means wiring it into Compare is safe by
construction rather than by a reviewer noticing.

The honest consequence: for Compare the call is currently a no-op. Its value is that the rule lives in
one function with one test, so if Compare's defaults are ever loosened the variation behaviour comes
with them instead of being reinvented. Its Compare-side test is a characterisation test of the
hidden-by-default state, not of the new wiring — it would pass with the wiring removed — and is kept
deliberately, as the thing that fails if someone loosens those defaults without deciding to.

*Alternative considered:* leaving Compare alone entirely. That keeps the diff smaller, but it leaves
two grids with the same Execution columns and no shared statement of when one of them is worth showing.

### The totals are hidden outright; only the three position columns follow the data

`Total requests` and `Total turns` carry `hide: true` in `executionColumns`, the way `INPUT BINDINGS`
already does. The variation rule governs `# Run number`, `Request` and `Turn` only, and
`ExecutionIndexField` names exactly those three.

A total is not a reading the operator scans rows for — it is the denominator of the position beside it,
and a run reports the same one on every row of a test case. Deciding it by variation gets the awkward
cases either way round: hide-when-uniform strips the denominator from every multi-turn run, while
pairing it to its index shows a column of identical `4`s whenever `Turn` is on screen. A fixed default
says the thing directly and stays one click from being wrong.

*Alternative considered:* the pairing rule — a total hidden only when its index is. It keeps `Turn 1..4`
legible without a click, at the cost of a fixed-width column of repeated values in exactly the runs
whose Execution group is already busiest. Rejected in favour of the operator asking for the denominator
when they want it.

*Alternative considered:* deciding the totals by variation like everything else. That reads the issue
literally but hides `Total turns` in every multi-turn run and shows it in the rare run whose test cases
disagree on the count — variation in a total says something about the test suite, not about the row.

### The util lives in `src/utils/evaluation/`

Both call sites are evaluation column builders in different feature trees
(`Runs/View/` and `Runs/Compare/ExecutionResults/`), so per `.claude/rules/utils.md` the helper is
cross-cutting and belongs in `src/utils/evaluation/`, alongside `request-chain.ts` and
`test-case-grouping.ts`. It is pure, takes `ResultDto[]` — the narrowest type declaring the index
fields, which `AnalyticsResult` extends — and exports named functions.

The three field names become an `enum` rather than a string-literal union, per
`.claude/rules/code-standards.md` — the set is fixed and needs a runtime value to iterate.

### The `Execution` group becomes a function; the Details group stays a const

`staticColumns` is split: the unnamed Details group (status + `Test Case name`) keeps its current
const, and `getExecutionGroup(results)` produces the Execution group. `getAnalyticsColumns` composes
them.

Only the Execution group depends on the data, so only it becomes a function. `staticColumns` is
module-private, so nothing outside `Runs/View/utils.ts` is affected.

## Risks / Trade-offs

- **A column the operator expected is missing, and they do not realise it is one click away.** → The
  panel already shows the `Execution` group as indeterminate when some children are hidden, which is a
  visible signal that the group holds more than is on screen; and `INPUT BINDINGS` has shipped this way
  for some time. No new affordance is added.
- **A run whose results all sit at, say, turn 3 hides `Turn`, losing the fact that these are third-turn
  rows.** → Accepted: that is the definition the issue asks for, the value is still one click away, and
  the same value on every row is exactly what the change is meant to remove.
- **The Compare wiring is a no-op and reads as dead code at review.** → Called out in the proposal and
  in the task list rather than left for a reviewer to discover; it is droppable without affecting the
  issue.
- **`getAnalyticsColumns` gains a dependency on row content, so a future caller passing a filtered
  subset would get different defaults.** → The only callers are the pre-fetch `[]` call and the
  post-fetch full result set; both are in `Runs/View`, and the behaviour for `[]` is pinned by a test.
- **Two grids, one predicate, different row types** (`AnalyticsResult` vs `CompareAnalyticsRow`, the
  latter carrying `_compared`). → Compare already flattens both sides into one `AnalyticsResult[]`
  before building columns (`columns.ts:442`); the predicate takes that flat array and needs no
  awareness of the pairing.
