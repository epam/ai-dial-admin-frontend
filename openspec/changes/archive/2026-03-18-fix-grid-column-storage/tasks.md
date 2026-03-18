# Tasks

- [x] Add unified visibility helpers in utils.ts (`apps/ai-dial-admin/src/components/Grid/utils.ts`): Add `updateColumnVisibilityInStorage(storageKey, colDefs)` and `getColumnVisibilityFromGridState(storageKey, columnDefs)`. Remove `saveColumnVisibilityToStorage` and `getColumnVisibilityFromStorage`.
- [x] Update GridView to use unified storage (`apps/ai-dial-admin/src/components/Grid/GridView/GridView.tsx`): Replace `getColumnVisibilityFromStorage` with `getColumnVisibilityFromGridState`, replace `saveColumnVisibilityToStorage` with `updateColumnVisibilityInStorage`, update imports.
- [x] Remove `COLUMNS_KEY` constant from `apps/ai-dial-admin/src/components/Grid/constants.ts`
- [x] Update tests (`apps/ai-dial-admin/src/components/Grid/utils.spec.ts`): Replace tests for removed functions with tests for new helpers. Cover edge cases: no stored state, column set mismatch, partial state.
- [x] Run code quality checks: lint, format, and tests to verify no regressions
