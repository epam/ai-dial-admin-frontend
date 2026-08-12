## 1. Deduplicate aggregated warnings

- [x] 1.1 In `src/utils/evaluation/test-case-grouping.ts`, make `aggregateValidity` deduplicate the flat-mapped warnings by `code | path | fieldName | message`. Keep the `valid` logic as is — a group is valid only when every turn is. Keep the function pure and its signature unchanged; it is consumed only by `toGroupRow`.
  - Added two private helpers beside it, `getWarningKey` and `dedupeWarnings`; the exported signature is unchanged.

## 2. Blank the status cell on grouped turn rows

- [x] 2.1 In `src/components/TestSuites/utils/columns.tsx`, change `getValidityStatusColumn`'s cell renderer to type its `params.data` as `GroupedGridRow` and return `null` when `data.rowType === GridRowType.TURN && !data.isFlattened`. Import `GridRowType` from `@/src/types/grid-row-type` and `GroupedGridRow` from `@/src/models/evaluation/test-case-grouping`.
  - Typed as a new `ValidityStatusRow` rather than `GroupedGridRow`. `GroupedGridRow` extends `TestCaseRow = Record<string, unknown>`, so `valid` and `validationWarnings` read as `unknown` off it and every use would need a cast. `ValidityStatusRow` (added to `models/evaluation/test-case-grouping.ts`) extends `TestCase` — the type the renderer already used — with optional `rowType` and `isFlattened`, keeping both fields typed and the cast-free body intact.
- [x] 2.2 Keep the guard a blacklist of `TURN` — do not whitelist `GROUP`/`SINGLE`. Rows with no `rowType` (the CSV import preview via `TestCases/Import/utils.tsx:15`) must keep rendering, matching the rule the rest of the shared column factory already follows.
- [x] 2.3 Leave the `ValidityStatus` props unchanged for every row that does render — same `valid`, same `', \n'`-joined message, same `label`. No new props, no changes to `src/components/Common/ValidityStatus/`.
- [x] 2.4 No changes to `expandTestCasesToRows`: turn rows keep carrying `valid`/`validationWarnings`, because `aggregateValidity` reads the master row's data from them.

## 3. Tests

- [x] 3.1 Extend `src/utils/evaluation/tests/test-case-grouping.spec.ts` for `aggregateValidity`: identical warnings across three turns collapse to one; warnings differing only by `path` are both kept; turns with no `validationWarnings` yield an empty array; one invalid turn makes the group invalid.
  - Three tests added. The empty-warnings and one-invalid-turn cases were already covered by the existing block, so they were not duplicated; a first-occurrence-wins ordering test was added instead.
- [x] 3.2 Add a `getValidityStatusColumn` block to the existing `src/components/TestSuites/utils/tests/columns.spec.ts`, covering the renderer across row types: `GROUP` renders, `TURN` with `isFlattened` false returns `null`, `TURN` with `isFlattened` true renders, `SINGLE` renders, a row with no `rowType` renders, and `data` undefined returns `null`. Call the returned `cellRenderer` directly and assert on the element it returns rather than mounting a grid — that keeps the file `.ts` and needs no JSX literal. Where a render is asserted, query by role; no `data-testid`.
  - Seven tests, asserting on the returned element's props. Nothing is mounted, so no role queries were needed.
- [x] 3.3 Run the narrowest tests while iterating, from `apps/ai-dial-admin/`: `npx vitest run src/utils/evaluation/tests/test-case-grouping.spec.ts` and `npx vitest run src/components/TestSuites/utils/tests/columns.spec.ts`.
  - Both files in one run: 2 files passed, 75 tests passed.
  - This worktree had no `node_modules`; `npm ci` was run at the repo root first (exit 0).

No browser-verification task: the user opted for unit-test coverage only.

## 4. Independent code review

- [x] 4.0 Reviewed by a clean-context sub-agent running the `code-review:code-review` skill at high effort. No finding reached the skill's confidence bar; three were applied anyway on their merits.
  - Applied: the comment in `columns.tsx` and the one on `dedupeWarnings` both restated that every turn row carries a copy of the case's warnings. The `columns.tsx` one now explains only its own decision — why a *flattened* turn row is exempt — leaving the shared fact stated once, next to the code that deduplicates it.
  - Applied: `getWarningKey` now builds its key with `JSON.stringify([...])` instead of a `|`-joined template, so a `|` inside a warning message cannot collide two distinct warnings into one and silently drop it from the tooltip.
  - Applied: corrected `proposal.md`'s claim that the status column is "wired to no filter or sort". `AgGridWrapper`'s `defaultColDef` does apply `filter: 'agTextColumnFilter'`. The conclusion is unchanged — the filter reads `field: 'status'`, which no row carries, not the renderer's output.
  - Declined: rendering the cell in `columns.spec.ts` instead of asserting on the returned element's props. The surrounding tests in that file assert on col-def output the same way, and rendering would test `ValidityStatus` rather than the column factory.
  - Declined: deriving `ValidityStatusRow` from `GroupedGridRow` — the reviewer scored this a false positive for the reason recorded in task 2.1.

## 5. Quality checks

- [x] 5.1 From the repo root, run `npm run lint`, `npm run format`, and `npm run test`. Do not skip the pre-commit or pre-push hooks. Report the actual output rather than asserting success.
  - `npm run lint` — 0 errors, 32 warnings, all pre-existing and in files this change never touches (same count `add-multi-turn-test-cases` recorded as the baseline).
  - `npm run format` — flagged `src/utils/evaluation/tests/test-case-grouping.spec.ts`; fixed with `npx prettier --write`, then `--check` clean across all five changed files.
  - `npm run test` — 757 files passed, 1 skipped; 7899 tests passed, 4 skipped. Coverage 67.08% statements / 57.54% branches / 60.2% functions / 67.32% lines, above the 50/40/40/50 gate.
