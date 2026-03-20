## 1. Fix SelectRunnerModal data passing

- [x] 1.1 In `apps/ai-dial-admin/src/components/SourceField/Template/SelectRunnerModal.tsx`, pass `runners` as `rowData` and `BASE_COLUMNS` as `columnDefs` props to `GridView` (matching how `SelectAdapterModal` passes `columnDefs`)
- [x] 1.2 Simplify `onGridReady` to only handle pre-selecting the previously chosen runner row (remove `updateGridOptions` call for columnDefs/rowData since they're now passed as props)

## 2. Quality checks

- [x] 2.1 Run lint, format, and type checks
- [x] 2.2 Run existing test suite to confirm no regressions
