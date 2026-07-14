## 1. Path resolution and rewriting (pure functions)

- [x] 1.1 `isTechnicalItem(path)` implemented in `src/server/files/export.ts`
- [x] 1.2 `resolveExportEntries(paths, listFolderChildren)` implemented — expands folder paths one level deep (excluding technical items), includes non-folder paths directly (excluding if technical), throws on a duplicate storage path
- [x] 1.3 `toExportArchivePath(storagePath, exportFolderPath)` implemented
- [x] 1.4 Unit tests in `src/server/files/tests/export.spec.ts` — single file, folder with children, technical-item exclusion (direct and via expansion), duplicate-path rejection, one-level-only expansion explicitly documented — all passing

## 2. Archive assembly

- [x] 2.1 Folder-children listing via `filesCoreApi.getFileMetadata(token, path, false)`, filtering to `ITEM` nodes (case-insensitive `nodeType` comparison, matching the same unverified-Core-casing caution used in `migrate-folders-to-core`'s `resource-walk.ts`)
- [x] 2.2 Zip assembly via `filesCoreApi.downloadFile` → `jszip` entry at `files/<archivePath>`, implemented in `buildFilesExportZip`
- [x] 2.3 Deterministic zip filename: `<name>.zip` for a single-item selection, `files-export-<count>.zip` otherwise
- [x] 2.4 Unit tests — built a real zip with `jszip` and inspected its file entries (filtering out JSZip's implicit directory entries) for a mixed file+folder selection — 13/13 passing total in this file

## 3. Wire and cleanup

- [x] 3.1 `exportFiles` in `src/app/[lang]/files/actions.ts` now calls `buildFilesExportZip(filesCoreApi, token, paths)` instead of `assetsApi.exportFiles`; the now-unused `assetsApi` import was removed from this file
- [x] 3.2 Confirmed `Files/List.tsx`'s export button/handler and the `{ blob, fileName }` contract are unchanged — no changes made to that component
- [x] 3.3 Confirmed `assetsApi` has zero remaining references anywhere under `src/app/[lang]/files/`; the class itself is untouched and still alive for other asset types' deferred import/export
- [x] 3.4 `npm run lint` / `npm run format` — clean
- [x] 3.5 `vitest run` — `export.spec.ts` (13/13), `files/actions.spec.ts` (8/8), full-repo suite green
- [x] 3.6 `openspec validate migrate-files-export-to-core --strict` — passes

<!--
No browser-verification task: no UI element, route, or rendered text changes as a result of
this change — the export button and its result contract are identical, only the
implementation behind `exportFiles` changes. Unit tests (including a real jszip-built archive
inspection) are the verification bar, consistent with this series' established pattern for
changes with no live Core instance to test against.
-->
