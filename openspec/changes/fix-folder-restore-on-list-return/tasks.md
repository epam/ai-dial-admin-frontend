## 1. Restore helper

- [x] 1.1 Add a pure `shouldRestoreFolderHierarchy(filePath, fetchedFoldersData)` helper to `apps/ai-dial-admin/src/utils/files/folder-hierarchy.ts`: true only when `filePath` has a segment below the root and `fetchedFoldersData[filePath]` is missing (D2).
- [x] 1.2 Add unit tests in `apps/ai-dial-admin/src/utils/files/tests/folder-hierarchy.spec.ts`: empty path, root path (`public/`), nested uncached, nested cached (including an empty cached list), missing cache object.

## 2. FileManager mount restore

- [x] 2.1 In the mount effect of `apps/ai-dial-admin/src/components/Common/FileManager/FileManager.tsx`, when `files` is empty and the helper returns true and the context has `fetchFolderHierarchy`, call `fetchFolderHierarchy(filePath, true)` and still seed `loadedPaths` with the root paths; otherwise keep the existing root fetch.
- [x] 2.2 Add component tests in `apps/ai-dial-admin/src/components/Common/FileManager/tests/FileManager.spec.tsx`: nested uncached selection triggers the hierarchy load and no root fetch; cached selection, root selection and empty selection keep the root fetch; a context without `fetchFolderHierarchy` keeps the root fetch; non-empty `files` triggers neither.

## 3. Quality checks

- [x] 3.1 Run lint, format check, `npm run typecheck`, `npm run typecheck:specs` and the full test suite; fix anything they report.
