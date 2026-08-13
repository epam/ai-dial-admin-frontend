## Why

Validation warnings are **case-level** in the API: `TestCase.validationWarnings` describes the whole test case, and `multiTurnData` carries no validity fields at all. Grouping then displays that one list in as many places as the case has turns.

Two places do it:

1. `expandTestCasesToRows` (`src/utils/evaluation/test-case-grouping.ts:40`) destructures `{ multiTurnData, data, ...rest }` and spreads `...rest` — which includes `valid` and `validationWarnings` — into **every** turn row. So all N turn rows of a case carry an identical copy of the case's warnings, and each renders the same `● Invalid` with the same tooltip.
2. `aggregateValidity` (`:159`) flat-maps those per-turn copies back onto the GROUP row. A case with three turns and one warning produces a master tooltip containing that message three times, joined by `', \n'`.

The result reads as if a multi-turn case had a validity problem per turn, when it has exactly one. Nothing in the display distinguishes turns anyway — `ValidationWarning.path` and `.fieldName` exist on the model (`src/models/evaluation/test-suite.ts:92`) and are never rendered; only `.message` is.

## What Changes

- **The master row is the only validity signal for a grouped case.** A `TURN` row inside an expanded group renders an empty Status cell — the same treatment shared (non-per-turn) schema fields already get on turn rows (`turn-columns.tsx:112`).
- **Flattened turn rows keep their status.** When an active column filter flattens groups (`projectGroupsToGridRows` with `isSearching`), no `GROUP` row is emitted, so blanking every turn row would leave an invalid case with no validity signal at all. The guard keys off the existing `GroupedGridRow.isFlattened` flag rather than `rowType` alone.
- **The master row's warning list is deduplicated**, so each distinct warning appears once instead of once per turn.
- **No model, API, or persistence changes.** Turn rows keep carrying `valid`/`validationWarnings` in their data — `aggregateValidity` still derives the master row from them. The duplication stays in the data and stops being rendered.

Single-turn cases, the CSV import preview grid, and every non-grouped consumer of the shared Status column are unaffected.

## Non-goals

- **Per-turn validity.** No attempt to attribute a warning to the turn it came from. The backend does not say which turn a warning belongs to, so any attribution would be invented. `ValidationWarning.path` / `.fieldName` stay unrendered.
- **Changing what a warning says.** Message text, the `', \n'` join, the tooltip trigger, and the copy-on-click behaviour of `ValidityStatus` are untouched.
- **Removing the duplicated data.** `expandTestCasesToRows` keeps spreading case-level `valid`/`validationWarnings` onto turn rows; `aggregateValidity` reads them from there. Only the rendering changes.
- **Any change to the run results grid**, which has no grouping.

## Capabilities

### Modified Capabilities

- `multi-turn-test-cases`: adds the rule that a grouped test case displays its validity once, on the row that represents the case, and the fallback that applies when filtering has flattened the group away.

## Impact

**Modified** — `apps/ai-dial-admin/src/`

- `components/TestSuites/utils/columns.tsx` — `getValidityStatusColumn` gains a row-type guard. This one factory serves all three grouped surfaces: TestSuites test cases, Datasets test cases (`Datasets/utils/columns.tsx:40`), and the attach-dataset preview (`TestSuites/TestCases/PickPublicDataset.tsx`, via `getDatasetTestCaseColumns`).
- `utils/evaluation/test-case-grouping.ts` — `aggregateValidity` deduplicates.

**Tests**

- `utils/evaluation/tests/test-case-grouping.spec.ts` — deduplication.
- `components/TestSuites/utils/tests/columns.spec.ts` — the Status column per row type.

**Not affected**

- `components/TestSuites/TestCases/Import/utils.tsx:15` reuses `getValidityStatusColumn` for the import preview, whose rows carry no `rowType`. The guard is a blacklist of `TURN`, matching the deliberate blacklist-not-whitelist rule the shared column factory already follows, so those rows keep rendering.
- The Status column inherits a text filter from `AgGridWrapper`'s `defaultColDef`, but it declares `field: 'status'` — a field no row carries — and filtering and sorting read that field rather than the renderer's output. Blanking cells therefore cannot change filtering or ordering.
