## 1. Models and pure helpers

- [x] 1.1 Add `ExtractionRowType`, `TestCaseGroupRow`, the tagged result-row type and the `isTestCaseGroupRow` guard to `apps/ai-dial-admin/src/components/Runs/models.ts` (consts, if any, to `Runs/constants.ts`); verify `npm run typecheck` is clean
- [x] 1.2 Add `hasVaryingExecutionIndices` to `apps/ai-dial-admin/src/utils/evaluation/column-variation.ts`, built on `getUniformExecutionFields`; verify it is false for empty and uniform results and true when run, request or turn varies
- [x] 1.3 Add `buildTestCaseGroupRows` in `apps/ai-dial-admin/src/components/Runs/utils/test-case-groups.ts` (group key `testCaseId ?? testCaseName ?? id`, groups by name, rows by run → request → turn with a stable tiebreak, collapsed groups emit only the group row, group score taken from the first result row); verify against the ordering, collapse and missing-score scenarios of `run-results-test-case-grouping`

## 2. Grouped column layout

- [x] 2.1 Add `Runs/View/GroupToggleCellRenderer.tsx`, the cell of a fixed left toggle column: chevron button with `aria-expanded` (no `aria-controls`: the controlled rows are siblings with no single container to reference), collapse/expand accessible name and `aria-hidden` icon on group rows inside a `role="group"` + `aria-label` root; nothing on result rows; verify Enter/Space and click call `onToggleGroup`, that a click on the button does not bubble to the row, and that the button takes focus back when `consumeFocusRequest` asks for its group
- [x] 2.2 Add `Runs/View/grouped-columns.ts` (reusing the shared `Grid/CellRenderers/EmptyCellRenderer` for empty cells) that derives the grouped column defs from the stored ones without mutating them: name column renderer, Overall score blank on result rows and `OverallScoreCellRenderer` on group rows, `cellRendererSelector` with both branches explicit for columns that already have a renderer, `null`-returning `valueGetter` and `''`-returning `valueFormatter` wrappers for `—`-substituting columns (inputs, extracted, `Duration`) on group rows, `sortable`/`filter`/`floatingFilter` off on every leaf, `hide`/`colId`/widths preserved; verify the output for a representative `getAnalyticsColumns` result
- [x] 2.3 Add the `RunsI18nKey` entries (switch label, expand/collapse group labels) in `constants/i18n.ts` and `locales/en.ts`, reusing shared keys where one exists; verify no hardcoded display text in the new components

## 3. Wire the Extraction result tab

- [x] 3.1 Add `isGroupedByTestCase` (default `false`) and `collapsedGroupKeys` (default `[]`) to `ExtractionResultTabUiState` in `Runs/View/models.ts` and `use-run-view-tab-state.ts`; verify they reset when the run id changes
- [x] 3.2 In `Runs/View/ExtractionResult.tsx`, derive the effective grouping flag, build `rowData` through `buildTestCaseGroupRows` and the derived columns through `grouped-columns.ts` when grouped, keep the flat path unchanged otherwise, add the toggle callback, skip group rows in `onCellClicked`/`onRowClicked` before touching `cellClickHandledRef`, add the group-row `getRowClass`, and clear the grid sort and filter models when the effective flag changes; verify the flat list is unchanged when grouping does not apply
- [x] 3.3 In `Runs/View/View.tsx`, add the ui-kit `Switch` beside the Columns button, shown only on the Extraction result tab when `hasVaryingExecutionIndices` holds for the loaded results; verify it is absent on the Summary tab and for uniform runs

## 4. Unit tests

- [x] 4.1 Add specs for `hasVaryingExecutionIndices` (`utils/evaluation/tests/column-variation.spec.ts`) and `buildTestCaseGroupRows` (`Runs/utils/tests/test-case-groups.spec.ts`) covering group order, in-group order, stable ties, collapse, missing ids/names/indices and score propagation; run with `npx vitest run <file>` from `apps/ai-dial-admin/`
- [x] 4.2 Add specs for `GroupToggleCellRenderer` and `grouped-columns` covering keyboard toggle, `aria-expanded`/accessible names, focus restore, group vs result rendering, the pinned non-movable toggle column in front of the stored columns, blank cells on group rows, blank Overall score on result rows, sort/filter off, and that stored column defs are not mutated
- [x] 4.3 Extend `Runs/View/tests/ExtractionResult.spec.tsx`, `View.spec.tsx` and `use-run-view-tab-state.spec.ts` for: flat by default even for a varying run, grouped once switched on, flat for a uniform run, toggle on/off, collapse state surviving a toggle, group-row clicks not opening details, result-row clicks (including the empty score cell) opening them, switch visibility; keep `npm run typecheck:specs` at zero and add any missing mocks to `test-setup.tsx`

## 5. Specs and docs

- [x] 5.1 Search `docs/` and `openspec/specs/` for descriptions of the Extraction result grid that this change makes stale (for example row-details or column-visibility wording), update them in this change, and note in the task if none exist; verify `openspec validate group-run-results-by-test-case` passes. Result: `docs/` has none; `run-results-turn-columns` contradicted the change ("Multi-turn results are not grouped", and sorting) and now has a delta in this change

## 6. Browser verification

- [x] 6.1 Run the `spec-browser-verify` skill for this change against the local app and resolve every `fail` verdict; make sure the scenarios include that toggling grouping keeps a column hidden or reordered through the columns panel

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`, and fix everything they report
