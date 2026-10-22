## 1. Reset filters in file-manager lists

- [x] 1.1 Bump `@epam/ai-dial-react-file-manager` to `^0.4.0-dev.12` and `@epam/ai-dial-ui-kit` to `^0.16.0-dev.19`; refresh the lockfile.
- [x] 1.2 Pass `ResetFiltersButton` through a memoized `toolbarOptions.additionalButtons` in `Common/FileManager/FileManager.tsx`.
- [x] 1.3 Cover it in `Common/FileManager/tests/FileManager.spec.tsx`: hidden with no filter, shown once a filter is applied, click clears filters only.
- [x] 1.4 `typecheck`, `typecheck:specs`, lint and the test suite pass.
