## Context

The BE's `FileService.export(ExportResource)` (`com.epam.aidial.cfg.service.FileService`) is more than a zip-and-stream operation:

1. `resolveExportFileEntries` (via `ResourceEximExportHelper.resolveExportEntries`) turns the user's selected paths into a `storagePath → exportFolderPath-or-null` map:
   - A folder path → expand via `collectPathsUnderFolder` (a `recursive: true` metadata fetch, but `ExportPathUtils.collectExportablePaths` only reads the **top node's immediate `items`**, silently dropping nested subfolder contents — a real BE quirk, not this change's problem to fix, per explicit decision).
   - A non-folder path → added as-is with `exportFolderPath = null`, unless it's a technical item (`ExportPathUtils.isTechnicalItem`: filename is `.dial_folder` or starts with `.dial_folder__`), which is dropped.
   - Duplicate storage paths throw `IllegalStateException` (`addExportEntry`).
2. Each entry's **archive path** is computed by `ExportPathUtils.toExportedFileStoragePath(storagePath, exportFolderPath)`:
   - `exportFolderPath == null` (single-file selection) → `toSingleFileExportPublicPath`: `"public/" + <filename>`.
   - Otherwise (folder selection) → `toFolderExportPublicPath`: `"public/" + <lastSegmentOfExportedFolder> + <path-inside-that-folder>`.
3. Sorted paths are streamed into a `ZipOutputStream`, each entry written as `"files/" + archivePath`, fetching each file's bytes via the BE's own `get(path)` (a Core passthrough).

Since files were already migrated to Core-direct CRUD, this change only needs to reproduce steps 1–3 client-side using data already available from `filesCoreApi` (`getFileMetadata` for folder expansion, `downloadFile` for content) and `jszip` (already a dependency, added for zip import in `migrate-files-to-core`).

## Goals / Non-Goals

**Goals**
- `exportFiles` produces a zip archive with the same entry paths (`files/public/...`) the BE produced, for the same selection.
- Technical `.dial_folder*` marker resources are excluded.
- Duplicate archive-path collisions are rejected, not silently resolved.
- Folder selections expand only one level deep, matching the BE exactly (not fixed).

**Non-Goals**
- Fixing the one-level-deep folder-expansion limitation.
- Reproducing the BE's exact zip filename (`Content-Disposition`-derived) — a new deterministic name is chosen instead.
- Streaming the archive incrementally (the BE streamed via `StreamingResponseBody`; this change builds the full zip in memory via `jszip.generateAsync` before returning it — acceptable for the file-count/size this admin tool handles, matching how zip *import* already works in `migrate-files-to-core`).

## Decisions

### D1 — Path resolution and archive-path rewriting ported as pure, unit-testable functions
Mirror the BE's split cleanly:
- `isTechnicalItem(path)`: filename is exactly `.dial_folder` or starts with `.dial_folder__`.
- `resolveExportEntries(paths, listFolderChildren)`: for each input path, if it's a folder (determined by trailing slash, matching `PathUtils.isFolderPath`), expand via `listFolderChildren` (one level, filtering to `ITEM` nodes, excluding technical items); otherwise include it directly (excluding if technical). Throws on a duplicate storage path across entries.
- `toExportArchivePath(storagePath, exportFolderPath)`: `exportFolderPath == null` → `"public/" + filename`; otherwise → `"public/" + lastSegment(exportFolderPath) + relativePath`.

### D2 — Folder expansion reuses `filesCoreApi.getFileMetadata(path, recursive=false)`, not `true`
Since the BE's own "recursive" fetch only ever has its immediate `items` read (D3 of `migrate-folders-to-core`'s design already found this exact one-level-only pattern for a different feature), this change requests `recursive: false` directly — same observable result, cheaper, and doesn't pretend to fetch a deep tree it will discard.

### D3 — Archive assembly via `jszip`, sequential downloads
For each resolved entry: `filesCoreApi.downloadFile(token, path, filename)` → read the response body → `zip.file("files/" + archivePath, buffer)`. Sequential (not parallel) to keep memory/connection usage bounded and match the BE's own sequential streaming — no need for concurrency here.

### D4 — New deterministic zip filename
Since there's no BE to set `Content-Disposition`, generate a filename directly: `files-export-<count>.zip` for multi-item selections, or `<name>.zip` for a single file/folder selection. Exact format is a minor UX detail, not a compatibility requirement (Non-goals).

## Risks / Trade-offs

- **[Risk] In-memory zip assembly for very large/many selected files** could be slow or memory-heavy compared to the BE's streaming approach. → **Mitigation**: accepted for this admin tool's realistic file counts/sizes; revisit only if it proves a real problem in practice.
- **[Trade-off] Preserving the one-level-deep folder-expansion quirk** means this change inherits a limitation users may not expect from "export folder." Accepted per explicit decision — parity over a scope-creeping fix.

## Migration Plan

1. Implement `isTechnicalItem`, `resolveExportEntries`, `toExportArchivePath` as pure functions with unit tests covering every branch (single file, folder, technical-item exclusion, duplicate detection).
2. Implement the zip-assembly function using `filesCoreApi.getFileMetadata`/`downloadFile` and `jszip`.
3. Wire `exportFiles` to the new implementation.
4. Test pass, including a case mirroring the folder-expansion one-level-only behavior explicitly (so a future reader sees it's intentional, not an oversight).

## Open Questions

None outstanding.
