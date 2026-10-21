## 1. Model

- [x] 1.1 Add `id?: string` to `TestCaseSchema` in `apps/ai-dial-admin/src/models/evaluation/test-suite.ts` with a one-line comment (server-assigned; classifies renames on dataset PUT). Verify `npm run typecheck` and `npm run typecheck:specs` stay at zero.

## 2. Pure utils

- [x] 2.1 Add `getDuplicateFieldNames(schema)` in `apps/ai-dial-admin/src/utils/evaluation/` (case-insensitive, empty names ignored) per design D5. Verify with a unit spec covering `prompt`/`Prompt`, unique names, and empty names.
- [x] 2.2 Add `remapRenamedFields(testCases, savedSchema, editedSchema)` in `apps/ai-dial-admin/src/utils/evaluation/` per design D3 (rebuilds `data` and every `multiTurnData[i]`; delete-all-old-then-set so swaps/chains work; returns input unchanged when there are no renames). Verify with a unit spec covering plain rename, swap `a↔b`, chain `a→b,b→c`, per-turn field, missing old key, new field without `id`, and no-op.

## 3. Duplicate-name validation UI

- [x] 3.1 In `apps/ai-dial-admin/src/components/TestSuites/TestCaseSchema/SchemaManager.tsx` render an error `DialNotification` above the grid naming the first case-insensitive duplicate (new i18n key in `TestSuitesI18nKey` + `locales/en.ts`), per design D5. Verify in `SchemaManager.spec.tsx`: notification shows for `prompt` + `Prompt`, absent for unique names, and a renamed row keeps its `id` in the emitted schema.
- [x] 3.2 Gate Save on duplicates in `components/Datasets/Schema/SchemaTab.tsx` (validity dispatch) and `components/TestSuites/TestCases/TestCasesSchemaModal.tsx` (`disableConfirmButton`). Verify in their specs that Save/Apply is disabled with `prompt` + `Prompt` and enabled once resolved.

## 4. Unsaved-rename preview on the Dataset page

- [x] 4.1 Pass `originalDataset.testCaseSchema` as `savedSchema` from `components/Datasets/View/View.tsx` through `View/TabsContent.tsx` → `TestCases/TestCases.tsx` → `TestCases/TestCasesList.tsx`, and call `clearDirtyAndRefresh(selectedDataset.testCaseSchema)` after a successful `updateDataset` (design D4). Verify with `npm run typecheck`.
- [x] 4.2 In `components/Datasets/TestCases/TestCasesList.tsx` keep `savedSchema` in a ref (synced from the prop, advanced by `clearDirtyAndRefresh`) and apply `remapRenamedFields` to fetched test cases before `expandTestCasesToRows`. Verify in `TestCasesList.spec.tsx`: with a renamed field, rows show the old value under the new name; after `clearDirtyAndRefresh(newSchema)` the refetch is not remapped.
- [x] 4.3 In `components/TestSuites/View/View.tsx`, refresh the route after a successful immediate dataset schema update so the TestSuite's `valid` and `validationWarnings` are reloaded. Verify in `View.spec.tsx` that success refreshes the route and failure does not.

## 5. Specs and docs

- [x] 5.1 Confirm no `docs/` page describes schema field rename/duplicate behavior (grep `docs/` for "schema"); update it if one does. Verify by the grep result.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format:check` (or the repo's format script), `npm run typecheck`, `npm run typecheck:specs`, and `npm run test` from the repo root; all pass. No browser verification task: the user chose unit tests only.
