## 1. Models

- [ ] 1.1 Add `TestCase.multiTurnData?: Record<string, unknown>[]` and `TestCaseSchema.perTurn?: boolean` in `src/models/evaluation/test-suite.ts`. Document on `multiTurnData` that it coexists with `data` (shared fields in `data`, per-turn fields in each turn map) — state this once here, not at each call site.
- [ ] 1.2 Add `DatasetTestCase.multiTurnData?: Record<string, unknown>[]` in `src/models/evaluation/dataset.ts`.
- [ ] 1.3 Add `ResultDto.turnIndex?: number` and `ResultDto.totalTurns?: number` in `src/models/evaluation/run.ts`.
- [ ] 1.4 Add `src/models/evaluation/test-case-grouping.ts`: `GridRowType` enum (`GROUP`/`TURN`/`SINGLE`), `TestCaseRow`, `TestCaseGroup`, `GroupedGridRow`.

## 2. Pure grouping utils

- [ ] 2.1 Add `src/utils/evaluation/test-case-grouping.ts` with `getPerTurnFieldNames`, `selectSharedFields`, `selectPerTurnFields`.
- [ ] 2.2 Add `readTurnIndex` (accepts number or numeric string, `0` is present, anything else absent) and `readGroupKey` (returns the case `id` for turn rows, `null` for single rows). No `_groupKey` override — nothing needs one now that results are not grouped.
- [ ] 2.3 Add `groupTestCaseRows`: group by shared `id` when `_turnIndex` is present, single rows keyed by their own id, case order = first appearance, turns sorted by `_turnIndex`.
- [ ] 2.4 Add the turn mutators: `renumberTurns`, `promoteToMultiTurn`, `demoteToSingle`, `reorderTurns` (out-of-range move is a no-op that still renumbers).
- [ ] 2.5 Add `aggregateValidity` — a group is valid only when every turn is, warnings concatenated.
- [ ] 2.6 Add `projectGroupsToGridRows(groups, expandedKeys, isSearching)`: collapsed-by-default GROUP rows expanding into TURN rows; single cases as SINGLE rows; when `isSearching`, drop GROUP rows and emit every turn flat. No `defaultExpanded`/`singlesFirst` params — both were results-grid-only.

## 3. Cell renderers

- [ ] 3.1 Add `STACKED_LINE_HEIGHT` and `STACKED_ROW_PADDING` to `src/components/Grid/constants.ts` beside the existing `ROW_HEIGHT`.
- [ ] 3.2 Add `TurnExpanderCellRenderer` — chevron on GROUP, indent bullet on TURN, nothing on SINGLE; `stopPropagation` on click so a row-level handler cannot double-toggle; `aria-label` reflecting expand/collapse state.
- [ ] 3.3 Add `StackedTurnsCellRenderer` — one line per turn on a collapsed GROUP row, em dash for empty, `null` when expanded. Fix each line to `STACKED_LINE_HEIGHT` inside `STACKED_ROW_PADDING` so the rendered height matches the row-height calculation exactly; note this coupling at both ends. Use `DialEllipsisTooltip` for truncation.
- [ ] 3.4 Add `TestCaseNameCellRenderer` — name plus `{n} turns` `DialTag` on GROUP; `Turn N` label on TURN.
- [ ] 3.5 Add `TurnIdCellRenderer` (case id on GROUP/SINGLE, blank on TURN) and `BlankCellRenderer` (shared field on a TURN row).

## 4. Shared column factory

- [ ] 4.1 Add `src/components/Grid/columns/turn-columns.tsx` with `TurnActionHandlers` and `SchemaColumnContext` types, `getTurnExpanderColumn`, `getGroupedIdColumn`, `getGroupedNameColumn`. Place it under `Grid/` rather than `TestSuites/utils/` so Datasets does not depend on TestSuites.
- [ ] 4.2 Add `getGroupedSchemaColumn`, moving the existing `TestCaseItemType` renderer switch (`TestSuites/utils/columns.tsx:146-231`) here verbatim, then layering the two grouping cases in front of it: per-turn field on a GROUP row → stacked; shared field on a TURN row → blank.
- [ ] 4.3 Add `getTurnActionsColumn`: Add turn / Delete test case hidden on TURN rows; Move up / Move down / Delete turn hidden on non-TURN rows.
- [ ] 4.4 Select renderers by **blacklisting** GROUP and TURN rather than whitelisting SINGLE, so an unprojected caller with no `rowType` stays editable.

## 5. Grid hooks

- [ ] 5.1 Add `src/components/Grid/hooks/use-turn-group-projection.tsx`: read-only projection over `rawRows` — grouping, `expandedKeys` toggling, `expandGroup`, filter-aware `isSearching`, forced `refreshCells` after each projection change (the chevron is driven by `data.expanded`, which ag-grid will not otherwise re-render), pruning of stale keys after a reload, plus `getRowId` and `getRowHeight`.
- [ ] 5.2 `getRowId` must qualify by row type — every turn of a case shares the case `id`, so `id` alone collides.
- [ ] 5.3 `getRowHeight` returns the stacked height only for a **collapsed** GROUP row; an expanded group is a single-line header.
- [ ] 5.4 Add `src/components/Grid/hooks/use-turn-group-grid.tsx` — the editable layer. Owns `flatRowsRef` + a version counter, `dirtyIdsRef: Set<caseId>`, `getCaseRows`, `replaceCaseRows`, `onAddTurn`, `onDeleteTurn`, `moveTurn`/up/down, `turnActionHandlers`, `getDirtyRows`, `spliceDirtyRows`, `pruneToSchema`, and a `turnGridOptions` object for the caller to spread.
- [ ] 5.5 `onCellChange` must edit the **stored** row, never the object ag-grid passes in — that object is a projection copy, so an in-place edit is lost on the next re-derivation. Shared field → fan out to every row of the case; per-turn or structural field → the one row matching `id` + `_turnIndex`. Comment the *why*.
- [ ] 5.6 Parameterize the only two real variations: `structuralFields` (whether `enabled` is treated as non-`data`) and `collapseRows`. Everything else is identical between the two callers and takes no parameter.
- [ ] 5.7 `onAddTurn` on a single-turn case promotes it and appends an empty turn; `onDeleteTurn` renumbers and demotes when one turn remains; every structural mutation expands the affected group.

## 6. Converters

- [ ] 6.1 In `src/components/TestSuites/utils/data.ts`, make `getTestCaseGridData` expand `multiTurnData` into one row per turn, each carrying the merged `{...shared, ...turn}` as its `data` plus the flattened fields, stamped with `_turnIndex`. Merging is what keeps the existing schema value-getters working unchanged.
- [ ] 6.2 Add `collapseRowsToTestCases(rows, perTurnFields)`: group by `id`, sort by `_turnIndex`, split the merged map back into shared `data` (read off turn 0) and per-turn `multiTurnData`. A case with one row emits `data` only.
- [ ] 6.3 Mirror 6.1 and 6.2 in `src/components/Datasets/utils/data.ts` as `getDatasetTestCaseGridData` / `collapseRowsToDatasetTestCases`.
- [ ] 6.4 Leave `rowToTestCase` / `rowToDatasetTestCase` in place — still used by the single-row delete path.

## 7. Column builders

- [ ] 7.1 Rewrite `getTestCaseColumns` in `src/components/TestSuites/utils/columns.tsx` to delegate to `Grid/columns/turn-columns.tsx`, deleting the inline renderer switch. Keep the include-in-run and validity columns as they are.
- [ ] 7.2 Rewrite `getDatasetTestCaseColumns` in `src/components/Datasets/utils/columns.tsx` the same way, deleting its near-copy of the same switch.
- [ ] 7.3 Convert both builders' parameters to an options object — they are already at six positional params with optionals in the middle, and this change adds another.

## 8. Wire the authoring surfaces

- [ ] 8.1 Wire `src/components/TestSuites/TestCases/TestCasesList.tsx` to `useTurnGroupGrid`, replacing the `data` state and `dirtyRowsRef`. Route `getRowId`/`getRowHeight`/`onFilterChanged` through `additionalGridOptions` — `AgGridWrapper` forwards `getRowId` only when `isLiveData` is set and does not expose the other two at all (precedent: `HeatMapTab`, `ContainerCreate`).
- [ ] 8.2 Rework `onCellValueChanged` so `disabledTestCaseIds` is recomputed from live grid nodes, **skipping expanded GROUP rows** — an expanded group's own `enabled` (derived from turn 0) would otherwise double-count ids its TURN rows already contribute. A collapsed GROUP row is its case's only visible row and must still count.
- [ ] 8.3 Base the header's test-case count on grouped cases, not grid rows.
- [ ] 8.4 Wire `src/components/Datasets/TestCases/TestCasesList.tsx` to the same hook. This second caller is the check that the abstraction is right — if it needs a third parameter, reconsider the split before adding one.
- [ ] 8.5 Verify whether `newTestCases` is still reachable in either file (nothing appears to add to it — `onAddTestCase` creates server-side then refreshes). If it is dead, leave it in the callers rather than growing the hook; do not remove it in this change. Record the finding here.

## 9. Schema editor and dataset preview

- [ ] 9.1 Add a Scope column to `getSchemaFieldGridColumns` using `BooleanButtonCellRenderer` (per `.claude/rules/components.md` §11), `Per turn` / `Shared`, `maxWidth: 110`, writing `TestCaseSchema.perTurn`.
- [ ] 9.2 Wire the change handler in `src/components/TestSuites/TestCaseSchema/SchemaManager.tsx`, following the existing `isSkipRefresh` pattern so inline edits keep grid focus.
- [ ] 9.3 Swap `PickPublicDataset.tsx`'s hand-rolled `previewColumns` for `getDatasetTestCaseColumns` plus a read-only `useTurnGroupProjection`, so the attach-dataset preview shows the same collapsed turn summary.

## 10. Results columns

- [ ] 10.1 Append `turnIndex` (headerName `Turn`, `valueGetter` rendering `turnIndex + 1`) and `totalTurns` (headerName `Total turns`) to `executionColumns` in `src/components/Runs/View/utils.ts`, immediately after `runIndex`, reusing `fixedWidthColDef` and `NO_FILTER_COL_DEF`. Headers stay hardcoded, matching `'# Run number'` and `'HTTP'`.
- [ ] 10.2 Change nothing else in `src/components/Runs/View/` — no projection, no expander, no `getRowId`, no `postSortRows`, no default sort. This boundary is the point of the scope decision; if something seems to require touching `ExtractionResult.tsx`, stop and re-check.

## 11. API and i18n

- [ ] 11.1 Widen the `createTestCase` body `Pick` with `'multiTurnData'` in `src/app/[lang]/datasets/actions.ts`, `src/server/eval/datasets-api.ts`, and `src/server/eval/test-suites-api.ts`. Leave the bulk PATCH whitelist at `{testCaseName, data}`.
- [ ] 11.2 Add i18n keys in `src/constants/i18n.ts` and `src/locales/en.ts`: `TestSuites.TurnLabel` (`Turn {index}`), `TestSuites.TurnCountBadge` (`{count} turns`), `ActionMenuOperation.{Add_turn,Delete_turn,Move_turn_up,Move_turn_down}`, `Basic.PerTurn`, `Basic.Shared`, and a key for the import-warnings heading. Check `BasicI18nKey`/`ButtonsI18nKey`/`EntitiesI18nKey` for reusable labels first.

## 12. CSV import

- [ ] 12.1 Add `RowMapping.turnIndex?: number | null` in `src/components/TestSuites/TestCases/Import/models.ts`. The preview grid then shows a Turn column with no further work, since `getGridDataFromImportPreview` maps every entry in the backend's `detectedColumns`.
- [ ] 12.2 Add `ImportWarningsList.tsx` rendering `ImportPreview.warnings` — currently returned by the backend and discarded. Show the row number, i18n the heading, and cap the height with scroll. Render nothing when there are no warnings.
- [ ] 12.3 Collapse `Datasets/TestCases/Import/DatasetImportFileModal.tsx` into `TestSuites/TestCases/Import/ImportFile.tsx` — they are identical apart from component name, `portalId`, and import paths, and already share every sub-component and util. Parameterize `portalId` and the i18n keys, delete the duplicate, and update `Datasets/TestCases/Header.tsx`.

## 13. Tests

- [ ] 13.1 `src/utils/evaluation/tests/test-case-grouping.spec.ts` — `groupTestCaseRows` ordering and first-appearance stability; `readTurnIndex` across number / numeric string / `0` / absent / garbage; `projectGroupsToGridRows` collapsed, expanded, and searching; `promoteToMultiTurn` → `demoteToSingle` round trip; `reorderTurns` bounds; `renumberTurns` contiguity; `selectShared`/`selectPerTurnFields` partitioning; `aggregateValidity`.
- [ ] 13.2 `components/{TestSuites,Datasets}/utils/tests/data.spec.ts` — round trip `getTestCaseGridData` → edit → `collapseRowsTo*` preserving turn order and the shared/per-turn split; single-turn produces no `multiTurnData`; a case collapsing to one turn emits `data` only; no client-only field survives.
- [ ] 13.3 `use-turn-group-grid` — add/delete/reorder turn, promote/demote, dirty tracking per case, shared-field fan-out, and that an edit made while collapsed is present in `getDirtyRows`.
- [ ] 13.4 Renderers — expander toggles and stops propagation; stacked renders `n` lines collapsed and nothing expanded; name renderer shows badge on GROUP and `Turn N` on TURN.
- [ ] 13.5 `turn-columns` — renderer selection across `rowType` × `perTurn`, including that a row with no `rowType` stays editable.
- [ ] 13.6 Both `TestCasesList` components — GROUP/TURN/SINGLE render, turn actions fire, and (TestSuites) `disabledTestCaseIds` is not double-counted for an expanded group.
- [ ] 13.7 `components/Runs/View/tests/utils.spec.ts` — Turn renders `turnIndex + 1`, both columns render empty when the fields are absent.
- [ ] 13.8 `ImportWarningsList` — renders each warning with its row number, renders nothing when empty.
- [ ] 13.9 Regression: single-turn behaviour is unchanged on both authoring surfaces and in the results grid.

## 14. Browser verification

- [ ] 14.1 Run the `spec-browser-verify` skill against the running local app (local stack up, auth disabled). Resolve every `fail` verdict before considering the change complete. Scenarios: add turn promotes a single case and shows the `2 turns` badge; collapsed group stacks per-turn values and blanks them when expanded; a shared field is editable on the GROUP row and blank on TURN rows; move up/down reorders; deleting to one turn demotes; an edit made while collapsed persists across save and reload; toggling Scope moves a field between shared and per-turn rendering; both TestSuites and Datasets tabs; results grid shows Turn and Total turns, and a single-turn run renders both cells empty with nothing else changed.

## 15. Quality checks

- [ ] 15.1 `npm run lint`, `npm run format`, `npm run test`. Do not skip the pre-commit or pre-push hooks.
