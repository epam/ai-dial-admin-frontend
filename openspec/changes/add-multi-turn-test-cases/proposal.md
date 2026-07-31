## Why

A test case today is single-turn: one `TestCase` carries one `data` map and renders as exactly one grid row. Evaluating a conversational agent needs a case to carry an *ordered sequence* of turns — a conversation — with per-turn inputs and per-turn results, while fields that describe the conversation as a whole (persona, system prompt, expected final outcome) stay stated once.

A proof-of-concept exists on `feat/17-multi-step-poc-alternative` (~3,700 production lines across 69 files). Its UX decisions are sound and its pure grouping layer is genuinely reusable, but it carries three kinds of waste worth not repeating:

1. It **duplicated ~250 lines of stateful list logic that were already duplicated** between the TestSuites and Datasets test-case surfaces, instead of writing the shared editable hook its own plan named.
2. It **shipped dead code**: `regroupSortedRows` (exported and unit-tested, wired into no grid), `ValidationWarning.turnIndex` (never rendered), `RowMapping.turnIndex` (never read — its two "multi-turn import" tests pass unchanged on `development`).
3. It made the **results grid invasive** — row grouping, an expander column, and `sortable: false` forced onto every column — in precisely the area where comparison and heatmap work is landing.

This change re-implements multi-turn taking the POC's learnings at roughly a third of the size (~1,150 production lines). The compaction comes from one structural decision: a shared `useTurnGroupGrid` hook, so both authoring surfaces get multi-turn from one implementation and the *pre-existing* duplication is paid down rather than doubled.

## What Changes

- **Data model.** `TestCase.multiTurnData?: Record<string, unknown>[]` holds the ordered per-turn maps; `TestCase.data` continues to hold the shared, test-case-level fields. The two **coexist** — they are not mutually exclusive. `TestCaseSchema.perTurn?: boolean` marks which schema fields vary per turn.
- **Grid row model.** In the grid one logical case becomes 1..N flat rows sharing the case `id`, distinguished by a client-only, never-persisted `_turnIndex`. Projected into three row types — `GROUP` (collapsed multi-turn master), `TURN`, `SINGLE`.
- **Authoring UX**, on **both** the TestSuites and Datasets test-case tabs: a leading chevron column; multi-turn cases collapsed by default showing the case name, a `{n} turns` badge, and each turn's value stacked one line per turn in per-turn columns; expanding reveals editable `Turn N` rows. Row actions: Add turn, Delete turn, Move turn up/down, Delete test case.
- **No explicit multi-turn toggle.** "Add turn" on a single-turn case promotes it; deleting down to one turn demotes it back to a plain single row. No degenerate one-element `multiTurnData` is ever persisted.
- **Shared vs per-turn rendering.** A per-turn field stacks on the collapsed GROUP row and is editable on each TURN row. A shared field is editable **once** on the GROUP row and renders blank on TURN rows; editing it fans out to every turn of the case.
- **Schema editor** gains a Scope column (`Per turn` / `Shared`) writing `TestCaseSchema.perTurn`.
- **Results display is deliberately minimal**: two new columns, `Turn` (1-based) and `Total turns`, appended to the existing `EXECUTION` column group. **No grouping, no expander, no default sort, no changes to `ExtractionResult.tsx`.**
- **CSV import**: surface `ImportPreview.warnings`, which the backend already returns and the frontend currently discards; add `RowMapping.turnIndex`; collapse the two byte-identical import modals into one.
- **One shared editable hook** (`useTurnGroupGrid`) plus a shared column factory replace ~250 lines of pre-existing copy-paste across the two `TestCasesList.tsx` files and the two `utils/columns.tsx` cell-renderer switches.

## Capabilities

### New Capabilities

- `multi-turn-test-cases`: The turn data model and its client-only row representation; grouping and projection into GROUP/TURN/SINGLE rows; expand/collapse and filter-aware flattening; turn add/delete/reorder with promote/demote; shared-vs-per-turn field scoping and its fan-out-on-edit rule; the collapse-on-save contract that reassembles rows into `data` + `multiTurnData`.
- `run-results-turn-columns`: The `Turn` and `Total turns` columns in the run results grid, and the guarantee that a single-turn run is otherwise unchanged. Deliberately a separate capability from `runs-analytics-run-compare` so that comparison and heatmap work does not collide with it.

### Modified Capabilities

- `dataset-test-cases`: The Test Cases grid now groups multi-turn cases rather than showing one row per case; save collapses turn rows back into test cases; delete distinguishes deleting a turn from deleting a case; CSV import surfaces preview warnings.
- `dataset-schema`: Schema fields carry a Scope (per-turn vs shared), editable in the schema editor.

## Impact

**New** — `apps/ai-dial-admin/src/`
- `models/evaluation/test-case-grouping.ts` — `GridRowType`, `TestCaseRow`, `TestCaseGroup`, `GroupedGridRow`.
- `utils/evaluation/test-case-grouping.ts` — pure grouping, projection, and turn-mutation helpers.
- `components/Grid/hooks/use-turn-group-projection.tsx` — read-only projection (grouping, expand/collapse, `getRowId`, `getRowHeight`).
- `components/Grid/hooks/use-turn-group-grid.tsx` — editable layer: row store, dirty tracking, turn CRUD, `onCellChange`, `getDirtyRows`.
- `components/Grid/CellRenderers/{TurnExpander,StackedTurns,TestCaseName,TurnId,Blank}CellRenderer.tsx`.
- `components/Grid/columns/turn-columns.tsx` — shared column factory for both surfaces.
- `components/TestSuites/TestCases/Import/ImportWarningsList.tsx`.

**Modified**
- `models/evaluation/{test-suite,dataset,run}.ts` — `multiTurnData`, `perTurn`, `turnIndex`, `totalTurns`.
- `components/{TestSuites,Datasets}/utils/data.ts` — expand `multiTurnData` on load; add `collapseRowsTo*` for save. `rowToTestCase`/`rowToDatasetTestCase` stay (single-row delete path).
- `components/{TestSuites,Datasets}/utils/columns.tsx` — delegate to `Grid/columns/turn-columns.tsx`, deleting ~250 lines of duplicated cell-renderer switch; convert the builders' 6 positional params to an options object.
- `components/{TestSuites,Datasets}/TestCases/TestCasesList.tsx` — wire to `useTurnGroupGrid`.
- `components/TestSuites/TestCaseSchema/SchemaManager.tsx` + `getSchemaFieldGridColumns` — Scope column.
- `components/TestSuites/TestCases/PickPublicDataset.tsx` — attach-dataset preview reuses the projection.
- `components/Runs/View/utils.ts` — **the only results file touched**; two entries appended to `executionColumns`.
- `components/TestSuites/TestCases/Import/{ImportFile.tsx,models.ts}`, `components/Datasets/TestCases/{Import/DatasetImportFileModal.tsx,Header.tsx}` — warnings list, `turnIndex`, modal dedupe.
- `app/[lang]/datasets/actions.ts`, `server/eval/{datasets-api,test-suites-api}.ts` — widen the `createTestCase` body `Pick` with `multiTurnData`.
- `constants/i18n.ts`, `locales/en.ts`.

**Backend contract is assumed, not verified.** No contract for `multiTurnData` / `perTurn` / `turnIndex` / `totalTurns` exists in this repo — there is no OpenAPI spec, `openspec/specs/dataset-test-cases/spec.md` documents the import contract with no turn column, and `grep -riE "multi.?turn|turnIndex"` over `openspec/`, `docs/`, and `apps/` returns zero hits outside unrelated archived analytics-chat proposals. Wire shapes are taken from the POC's design doc on the user's explicit instruction. If the real API differs, the model and converter layers are where rework lands.

**Bulk PATCH is untouched.** The `test-cases-bulk-enabled-patch` whitelist stays `{testCaseName, data}` — it never switches a case's turn structure.

## Non-goals

- **Test-case grouping in the results grid.** No expander, no GROUP rows, no forced sort-off. Deferred to a separate change once comparison/heatmap work settles — this is the explicit reason results display is held to two columns.
- **Run-summary turn-aware relabeling.** The POC swapped 11 i18n strings ("Test Cases Passed Threshold" → "Test Case Turns Passed Threshold") behind an extra `max(total_turns)` query. Wording only; not worth the round trip.
- **Grouped or nested CSV import preview**, and multi-turn import conflict UX. The preview grid is entirely backend-driven (columns come verbatim from `detectedColumns`; there is no client-side CSV parsing), so a flat turn column costs nothing once the backend emits it, while a grouped preview is blocked on a contract that does not yet exist.
- **Conditional metrics** (`Metric.condition`, JSONata per-row/per-turn gating). Rode along on the POC branch; unrelated to multi-turn.
- **Client-side turn validation** — contiguity, duplicate turn index, turn caps. Backend's responsibility; surfaces through the existing error-toast path.
- **Drag-and-drop turn reordering.** Move up / move down only.
- **Porting the POC's `docs/superpowers/` design doc and plan.** These change artifacts are the record; those docs describe a `data` XOR `multiTurnData` contract the POC itself later reversed.
