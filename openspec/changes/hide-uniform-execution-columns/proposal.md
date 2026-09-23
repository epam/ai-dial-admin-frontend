## Why

Issue [#4664](https://github.com/epam/ai-dial-admin-frontend/issues/4664). The `Execution` column group
on **Runs → Extraction result** always renders five index columns — `# Run number`, `Request`,
`Total requests`, `Turn`, `Total turns`. For the common single-request / single-turn run every one of
those cells holds the same value (`1`, or nothing at all), so five locked-width columns consume
horizontal space while carrying no information, pushing the metric and extracted columns that the tab
exists for off-screen.

## What Changes

- `Total requests` and `Total turns` start hidden outright. A total is context for a position, not a
  reading of its own, and it repeats on every row of a test case by construction.
- The Extraction Result grid's default visibility for the remaining position columns — `# Run number`,
  `Request`, `Turn` — becomes a function of the loaded results: one whose values do not vary across
  those results starts hidden, that is, unchecked in the Columns panel, rather than occupying grid
  width.
- Nothing is removed from the grid's schema. A hidden column keeps its entry in the Columns panel and
  the operator re-enables it with one click, exactly as with the already-hidden `INPUT BINDINGS` group.
- The rule only ever hides. It never makes visible a column a builder already chose to hide, so the run
  Compare → Execution results grid — whose Execution children all ship `hide: true` today — keeps its
  current defaults while sharing the same predicate.
- The predicate becomes a shared pure util so the two grids cannot drift apart on what "varies" means.

No breaking changes.

## Non-goals

- **Other column groups.** Details, metric groups, `INPUT BINDINGS` and `EXTRACTED` keep their current
  defaults. A single-valued extracted column is the answer the operator came for; hiding it would be a
  regression, not a cleanup.
- **`HTTP` and `Duration`.** They stay always-visible in the Extraction Result grid even when uniform —
  an all-`200` run is a meaningful reading, not noise.
- **Revealing columns.** Compare's Execution defaults are not loosened; see above.
- **Persisting the choice.** The Extraction Result grid passes no `storageKey` and keeps its column
  state in React for the life of the run view. This change does not introduce persistence.
- **Column removal or reordering.** Only the initial `hide` flag changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `run-results-turn-columns`: adds a requirement governing the **default visibility** of the Extraction
  Result grid's Execution position columns, and modifies "Run results show the turn number and total
  turn count" so its `SHALL display` reads as `SHALL provide` — the two columns still exist and still
  render a 1-based position against a supplied total, but whether they are on screen when the grid opens
  is now the new requirement's business, and `Total turns` in particular starts hidden. The remaining
  requirements — that rows stay flat, that Request and Turn are sortable — are unchanged; they describe
  how a column behaves once shown.

## Impact

- `apps/ai-dial-admin/src/utils/evaluation/column-variation.ts` — new pure util: the variation
  predicate and a hide-only column mapper.
- `apps/ai-dial-admin/src/components/Runs/View/utils.ts` — the `Execution` group moves from a
  module-level const into a function of `results` inside `getAnalyticsColumns`.
- `apps/ai-dial-admin/src/components/Runs/Compare/ExecutionResults/utils/columns.ts` — wires the same
  predicate into `getComparedExecutionColumns`; no observable change today, since those columns already
  start hidden.
- Unit tests for the new util and both column builders.

Nothing else consumes these builders. `ExtractionResult.tsx` needs no change — it already rebuilds the
column defs once the results arrive. No API, dependency, or shared-component change; `GridView`,
`AgGridWrapper` and `TreeColumnsPanel` are untouched, and the panel already renders a tri-state group
checkbox for a group whose children are partly hidden.
