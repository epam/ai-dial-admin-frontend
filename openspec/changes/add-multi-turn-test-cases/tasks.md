## 1. Models

- [x] 1.1 Add `TestCase.multiTurnData?: Record<string, unknown>[]` and `TestCaseSchema.perTurn?: boolean` in `src/models/evaluation/test-suite.ts`. Document on `multiTurnData` that it coexists with `data` (shared fields in `data`, per-turn fields in each turn map) — state this once here, not at each call site.
- [x] 1.2 Add `DatasetTestCase.multiTurnData?: Record<string, unknown>[]` in `src/models/evaluation/dataset.ts`.
- [x] 1.3 Add `ResultDto.turnIndex?: number` and `ResultDto.totalTurns?: number` in `src/models/evaluation/run.ts`.
- [x] 1.4 Add `src/models/evaluation/test-case-grouping.ts`: `GridRowType` enum (`GROUP`/`TURN`/`SINGLE`), `TestCaseRow`, `TestCaseGroup`, `GroupedGridRow`.

## 2. Pure grouping utils

- [x] 2.1 Add `src/utils/evaluation/test-case-grouping.ts` with `getPerTurnFieldNames`, `selectSharedFields`, `selectPerTurnFields`.
- [x] 2.2 Add `readTurnIndex` (accepts number or numeric string, `0` is present, anything else absent) and `readGroupKey` (returns the case `id` for turn rows, `null` for single rows). No `_groupKey` override — nothing needs one now that results are not grouped.
- [x] 2.3 Add `groupTestCaseRows`: group by shared `id` when `_turnIndex` is present, single rows keyed by their own id, case order = first appearance, turns sorted by `_turnIndex`.
- [x] 2.4 Add the turn mutators: `renumberTurns`, `promoteToMultiTurn`, `demoteToSingle`, `reorderTurns` (out-of-range move is a no-op that still renumbers).
- [x] 2.5 Add `aggregateValidity` — a group is valid only when every turn is, warnings concatenated.
- [x] 2.6 Add `projectGroupsToGridRows(groups, expandedKeys, isSearching)`: collapsed-by-default GROUP rows expanding into TURN rows; single cases as SINGLE rows; when `isSearching`, drop GROUP rows and emit every turn flat. No `defaultExpanded`/`singlesFirst` params — both were results-grid-only.

## 3. Cell renderers

- [x] 3.1 Add `STACKED_LINE_HEIGHT` and `STACKED_ROW_PADDING` to `src/components/Grid/constants.ts` beside the existing `ROW_HEIGHT`.
- [x] 3.2 Add `TurnExpanderCellRenderer` — chevron on GROUP, indent bullet on TURN, nothing on SINGLE; `stopPropagation` on click so a row-level handler cannot double-toggle; `aria-label` reflecting expand/collapse state.
- [x] 3.3 Add `StackedTurnsCellRenderer` — one line per turn on a collapsed GROUP row, em dash for empty, `null` when expanded. Fix each line to `STACKED_LINE_HEIGHT` inside `STACKED_ROW_PADDING` so the rendered height matches the row-height calculation exactly; note this coupling at both ends. Use `DialEllipsisTooltip` for truncation.
- [x] 3.4 Add `TestCaseNameCellRenderer` — name plus `{n} turns` `DialTag` on GROUP; `Turn N` label on TURN.
- [x] 3.5 Add `TurnIdCellRenderer` (case id on GROUP/SINGLE, blank on TURN) and `BlankCellRenderer` (shared field on a TURN row).

## 4. Shared column factory

- [x] 4.1 Add `src/components/Grid/columns/turn-columns.tsx` with `TurnActionHandlers` and `SchemaColumnContext` types, `getTurnExpanderColumn`, `getGroupedIdColumn`, `getGroupedNameColumn`. Place it under `Grid/` rather than `TestSuites/utils/` so Datasets does not depend on TestSuites.
- [x] 4.2 Add `getGroupedSchemaColumn`, moving the existing `TestCaseItemType` renderer switch (`TestSuites/utils/columns.tsx:146-231`) here verbatim, then layering the two grouping cases in front of it: per-turn field on a GROUP row → stacked; shared field on a TURN row → blank.
- [x] 4.3 Add `getTurnActionsColumn`: Add turn / Delete test case hidden on TURN rows; Move up / Move down / Delete turn hidden on non-TURN rows.
- [x] 4.4 Select renderers by **blacklisting** GROUP and TURN rather than whitelisting SINGLE, so an unprojected caller with no `rowType` stays editable.

## 5. Grid hooks

- [x] 5.1 Add `src/components/Grid/hooks/use-turn-group-projection.tsx`: read-only projection over `rawRows` — grouping, `expandedKeys` toggling, `expandGroup`, filter-aware `isSearching`, forced `refreshCells` after each projection change (the chevron is driven by `data.expanded`, which ag-grid will not otherwise re-render), pruning of stale keys after a reload, plus `getRowId` and `getRowHeight`.
- [x] 5.2 `getRowId` must qualify by row type — every turn of a case shares the case `id`, so `id` alone collides.
- [x] 5.3 `getRowHeight` returns the stacked height only for a **collapsed** GROUP row; an expanded group is a single-line header.
- [x] 5.4 Add `src/components/Grid/hooks/use-turn-group-grid.tsx` — the editable layer. Owns `flatRowsRef` + a version counter, `dirtyIdsRef: Set<caseId>`, `getCaseRows`, `replaceCaseRows`, `onAddTurn`, `onDeleteTurn`, `moveTurn`/up/down, `turnActionHandlers`, `getDirtyRows`, `setServerRows`, `pruneToSchema`, and a `turnGridOptions` object for the caller to spread. (Planned as `spliceDirtyRows`; it landed as `setServerRows`, which names what it does — take the server's rows and keep the dirty ones. `markDirty`, `replaceCaseRows` and `perTurnFields` were dropped from the returned object during review: nothing outside the hook read them.)
- [x] 5.5 `onCellChange` must edit the **stored** row, never the object ag-grid passes in — that object is a projection copy, so an in-place edit is lost on the next re-derivation. Shared field → fan out to every row of the case; per-turn or structural field → the one row matching `id` + `_turnIndex`. Comment the *why*.
- [x] 5.6 Parameterize the only two real variations: `structuralFields` (whether `enabled` is treated as non-`data`) and `collapseRows`. Everything else is identical between the two callers and takes no parameter.
- [x] 5.7 `onAddTurn` on a single-turn case promotes it and appends an empty turn; `onDeleteTurn` renumbers and demotes when one turn remains; every structural mutation expands the affected group.

## 6. Converters

- [x] 6.1 In `src/components/TestSuites/utils/data.ts`, make `getTestCaseGridData` expand `multiTurnData` into one row per turn, each carrying the merged `{...shared, ...turn}` as its `data` plus the flattened fields, stamped with `_turnIndex`. Merging is what keeps the existing schema value-getters working unchanged.
- [x] 6.2 Add `collapseRowsToTestCases(rows, perTurnFields)`: group by `id`, sort by `_turnIndex`, split the merged map back into shared `data` (read off turn 0) and per-turn `multiTurnData`. A case with one row emits `data` only.
- [x] 6.3 Mirror 6.1 and 6.2 in `src/components/Datasets/utils/data.ts` as `getDatasetTestCaseGridData` / `collapseRowsToDatasetTestCases`.
- [x] 6.4 Leave `rowToTestCase` / `rowToDatasetTestCase` in place — still used by the single-row delete path.

## 7. Column builders

- [x] 7.1 Rewrite `getTestCaseColumns` in `src/components/TestSuites/utils/columns.tsx` to delegate to `Grid/columns/turn-columns.tsx`, deleting the inline renderer switch. Keep the include-in-run and validity columns as they are.
- [x] 7.2 Rewrite `getDatasetTestCaseColumns` in `src/components/Datasets/utils/columns.tsx` the same way, deleting its near-copy of the same switch.
- [x] 7.3 Convert both builders' parameters to an options object — they are already at six positional params with optionals in the middle, and this change adds another.

## 8. Wire the authoring surfaces

- [x] 8.1 Wire `src/components/TestSuites/TestCases/TestCasesList.tsx` to `useTurnGroupGrid`, replacing the `data` state and `dirtyRowsRef`. Route `getRowId`/`getRowHeight`/`onFilterChanged` through `additionalGridOptions` — `AgGridWrapper` forwards `getRowId` only when `isLiveData` is set and does not expose the other two at all (precedent: `HeatMapTab`, `ContainerCreate`).
- [x] 8.2 ~~Rework `onCellValueChanged` so `disabledTestCaseIds` is recomputed from live grid nodes, skipping expanded GROUP rows.~~ **DROPPED.** Written from the POC, which introduced `enabled`-toggle handling that this branch never had. On `development` there is no `enabled` toggle column in the test-cases grid, `disabledTestCaseIds` appears only in the `TestSuite` model, and `TestCasesList.spec.tsx` asserts `onCellValueChanged` is undefined. The expanded-group double-count it guarded against cannot occur, and adding the handler would be new scope plus a broken test. `useTurnGroupGrid`'s `structuralFields` param is retained: `enabled` is spread onto rows by `getTestCaseGridData`, so it must not be treated as a `data` field if it is ever passed to `onCellChange`.
- [x] 8.3 Base the header's test-case count on grouped cases, not grid rows.
- [x] 8.4 Wire `src/components/Datasets/TestCases/TestCasesList.tsx` to the same hook. This second caller is the check that the abstraction is right — if it needs a third parameter, reconsider the split before adding one. **It needed none** — Datasets takes the defaults for `structuralFields` and passes no option TestSuites does not.
- [x] 8.5 **Finding: `newTestCases` is dead in both files.** Every `setNewTestCases` call is initialisation (`[]`), an in-place `map` on edit, a `filter` on remove, or a clear — nothing ever appends. `onAddTestCase` creates the case server-side via `createTestCase` and then calls `refreshGrid()`, and no consumer of `TestCasesActions`/`DatasetTestCasesActions` can add to it either. Left in place in both callers as instructed; not moved into the hook, not removed. Removing it is a separate change.

## 9. Schema editor and dataset preview

- [x] 9.1 Add a Scope column to `getSchemaFieldGridColumns` using `BooleanButtonCellRenderer` (per `.claude/rules/components.md` §11), `Per turn` / `Shared`, `maxWidth: 110`, writing `TestCaseSchema.perTurn`. No `valueGetter` needed — `BooleanButtonCellRenderer` coerces its value, so an unset `perTurn` renders `Shared`, the same way `Required` already relies on it.
- [x] 9.2 Wire the change handler in `src/components/TestSuites/TestCaseSchema/SchemaManager.tsx`, following the existing `isSkipRefresh` pattern so inline edits keep grid focus. `SchemaManager` is shared, so this lands on the Datasets schema tab too, as intended.
- [x] 9.3 Swap `PickPublicDataset.tsx`'s hand-rolled `previewColumns` for `getDatasetTestCaseColumns` plus a read-only `useTurnGroupProjection`, so the attach-dataset preview shows the same collapsed turn summary. Needed `isReadOnly` on `DatasetTestCaseColumnsOptions`, mirroring the TestSuites builder. `TEST_CASES_COLUMN` had no other caller and is deleted.

## 10. Results columns

- [x] 10.1 Append `turnIndex` (headerName `Turn`, `valueGetter` rendering `turnIndex + 1`) and `totalTurns` (headerName `Total turns`) to `executionColumns` in `src/components/Runs/View/utils.ts`, immediately after `runIndex`, reusing `fixedWidthColDef` and `NO_FILTER_COL_DEF`. Headers stay hardcoded, matching `'# Run number'` and `'HTTP'`.
- [x] 10.2 Change nothing else in `src/components/Runs/View/` — no projection, no expander, no `getRowId`, no `postSortRows`, no default sort. This boundary is the point of the scope decision; if something seems to require touching `ExtractionResult.tsx`, stop and re-check.

## 11. API and i18n

- [x] 11.1 Widen the `createTestCase` body `Pick` with `'multiTurnData'` in `src/app/[lang]/datasets/actions.ts`, `src/server/eval/datasets-api.ts`, and `src/server/eval/test-suites-api.ts`. There is no bulk-PATCH whitelist to leave alone: `test-cases-bulk-enabled-patch` is a deprecated, removed capability and `TEST_CASES_BULK_URL` is an unused leftover builder — proposal corrected accordingly.
- [x] 11.2 Add i18n keys in `src/constants/i18n.ts` and `src/locales/en.ts`: `TestSuites.TurnLabel` (`Turn {index}`), `TestSuites.TurnCountBadge` (`{count} turns`), `ActionMenuOperation.{Add_turn,Delete_turn,Move_turn_up,Move_turn_down}`, `Basic.PerTurn`, `Basic.Shared`, and a key for the import-warnings heading. Check `BasicI18nKey`/`ButtonsI18nKey`/`EntitiesI18nKey` for reusable labels first.

## 12. CSV import

- [x] 12.1 Add `RowMapping.turnIndex?: number | null` in `src/components/TestSuites/TestCases/Import/models.ts`. The preview grid then shows a Turn column with no further work, since `getGridDataFromImportPreview` maps every entry in the backend's `detectedColumns`.
- [x] 12.2 Add `ImportWarningsList.tsx` rendering `ImportPreview.warnings` — currently returned by the backend and discarded. Show the row number, i18n the heading, and cap the height with scroll. Render nothing when there are no warnings.
- [x] 12.3 Collapse `Datasets/TestCases/Import/DatasetImportFileModal.tsx` into `TestSuites/TestCases/Import/ImportFile.tsx` — they are identical apart from component name, `portalId`, and import paths, and already share every sub-component and util. Parameterize `portalId` and the i18n keys, delete the duplicate, and update `Datasets/TestCases/Header.tsx`.

## 13. Tests

- [x] 13.1 `src/utils/evaluation/tests/test-case-grouping.spec.ts` — `groupTestCaseRows` ordering and first-appearance stability; `readTurnIndex` across number / numeric string / `0` / absent / garbage; `projectGroupsToGridRows` collapsed, expanded, and searching; `promoteToMultiTurn` → `demoteToSingle` round trip; `reorderTurns` bounds; `renumberTurns` contiguity; `selectShared`/`selectPerTurnFields` partitioning; `aggregateValidity`.
- [x] 13.2 `components/{TestSuites,Datasets}/utils/tests/data.spec.ts` — round trip `getTestCaseGridData` → edit → `collapseRowsTo*` preserving turn order and the shared/per-turn split; single-turn produces no `multiTurnData`; a case collapsing to one turn emits `data` only; no client-only field survives.
- [x] 13.3 `use-turn-group-grid` — add/delete/reorder turn, promote/demote, dirty tracking per case, shared-field fan-out, and that an edit made while collapsed is present in `getDirtyRows`.
- [x] 13.4 Renderers — expander toggles and stops propagation; stacked renders `n` lines collapsed and nothing expanded; name renderer shows badge on GROUP and `Turn N` on TURN.
- [x] 13.5 `turn-columns` — renderer selection across `rowType` × `perTurn`, including that a row with no `rowType` stays editable.
- [x] 13.6 Both `TestCasesList` components — GROUP/TURN/SINGLE render, turn actions fire, and the header count is per case rather than per row. (The `disabledTestCaseIds` double-count assertion originally listed here went with dropped task 8.2 — there is no `enabled` toggle column to double-count.)
- [x] 13.7 `components/Runs/View/tests/utils.spec.ts` — Turn renders `turnIndex + 1`, both columns render empty when the fields are absent.
- [x] 13.8 `ImportWarningsList` — renders each warning with its row number, renders nothing when empty.
- [x] 13.9 Regression: single-turn behaviour is unchanged on both authoring surfaces and in the results grid.

## 14. Browser verification

- [x] 14.1 Verified in the browser against the developer's running local stack (backend on `:8082`, frontend on `:4200`, signed in through Keycloak) by driving the live app over the Playwright MCP. Every scenario passed; two defects were found and fixed in the process.

  **Defects found and fixed (both in `use-turn-group-projection.tsx`, neither reachable from the unit suite as written):**
  1. **An expanded GROUP row kept its collapsed stacked height** (76px for a 3-turn case instead of a 48px header). `getRowId` deliberately keeps a GROUP row's node identity stable across a toggle, so ag-grid reused the node together with its cached height and never re-ran `getRowHeight`. Fixed by calling `resetRowHeights()` alongside the existing `refreshCells()` on every projection change. Task 5.3's requirement was correct in the code but unobservable in the grid.
  2. **`refreshCells`/`resetRowHeights` ran against a destroyed grid api** after the parent's discard remount, logging an ag-grid warning #26 each time. Fixed with an `api.isDestroyed()` guard.

  Both are pinned by new tests in `Grid/hooks/tests/use-turn-group-grid.spec.tsx`.

  **Scenario results:**
  - Add turn on a single case → GROUP with a `2 turns` badge, auto-expanded, `Turn 1` keeping the original values and an empty `Turn 2`. Verified on both surfaces.
  - Collapsed group stacks one line per turn (3-turn case: 76px = `3*22 + 10`, em dash for empty turns) and blanks those cells when expanded.
  - A shared field (`tags`, `topic`) renders its editor on the GROUP row and blank on TURN rows; `id` is blank on TURN rows.
  - Move turn up / move turn down reorder and renumber; deleting down to one turn demotes back to a plain SINGLE row (48px, badge gone, name editable again) — and that demotion persists across save + reload.
  - An edit typed character-by-character into a turn keeps input focus for the whole string (the F1 regression, confirmed live), survives collapsing the group, and persists to the backend across a full reload against the right turn.
  - Discard restores the server state, including an un-saved turn deletion.
  - Toggling Scope in the schema editor moves a field between shared and per-turn rendering immediately.
  - Attach-dataset preview (task 9.3) shows the same read-only collapsed turn summary.
  - Header count is per grouped case, not per grid row (`View only included in run (1)` for a 2-turn case).
  - Results grid shows `Turn` (1-based) and `Total turns` directly after `# Run number`, with nothing else changed. Note: the "both cells empty" half of this scenario is not reachable against this backend — it populates `turnIndex`/`totalTurns` on every result, including runs of a purely single-turn suite. The absent-field rendering stays covered by task 13.7.

  **Out of scope, observed:** ag-grid logs error #200 (`ExternalFilter` module not registered) on the TestSuites test-cases grid, so the "View only included in run" filter is inert. Pre-existing on `development` — `isExternalFilterPresent`/`doesExternalFilterPass` are set at `TestSuites/TestCases/TestCasesList.tsx:228-229` (present there before this change) while `AgGridWrapper`'s `ModuleRegistry.registerModules` list, untouched here, omits `ExternalFilterModule`.

  Environment left as found: the temporary test suite created to exercise the editable TestSuites path (its dataset is public, hence read-only) was deleted along with its auto-created private dataset, and the `multi-turn-01` case promoted during persistence testing was demoted back.

## 15. Quality checks

- [x] 15.1 `npm run lint`, `npm run format`, `npm run test`. Do not skip the pre-commit or pre-push hooks.
  - `npm run lint` — 0 errors, 32 warnings, all pre-existing and in files this change never touches.
  - `npm run format` — clean.
  - `npm run test` (full `vitest run`) — 719 files passed, 1 skipped; 7330 tests passed, 4 skipped.
  - `npx tsc --noEmit -p tsconfig.app.json` — 291 errors, exactly the pre-existing baseline, none in any file added or changed here. (`tsconfig.json` cannot be used for this: it aborts with `TS6306`/`TS6310` project-reference errors before checking a single file.)
  - `npm run build` — succeeds. Added as an extra gate because `tsc` alone would not catch a missing `'use client'` in the new renderers.
  - Every commit went through the pre-commit hook; none were skipped.
