## Why

`exportFiles` is the last file operation still proxied through the admin BE — deferred by `migrate-files-to-core` because it needs its own risk assessment. Reverse-engineering `FileService.export` shows it isn't a simple "zip the selected files": it rewrites archive paths differently for single-file vs. folder selections, excludes internal `.dial_folder` marker resources, and detects duplicate archive-path collisions. This change ports that logic to run directly against Core, using `jszip` (already a dependency, added by `migrate-files-to-core` for zip import) to build the archive client-side instead of asking a BE that's going away to stream one.

## What Changes

- **Port `exportFiles`** (`src/app/[lang]/files/actions.ts`) to build a zip archive directly: for each selected path, resolve it to a flat list of exportable file paths (a folder selection expands to its **direct children only** — see Non-goals), fetch each file's content from Core (`filesCoreApi.downloadFile`), and assemble them into a zip via `jszip`.
- **Preserve the BE's archive-path rewriting rules** verbatim:
  - A single selected **file** → flattened to `public/<filename>` in the archive.
  - A selected **folder** → re-rooted to `public/<lastFolderSegment>/<path-relative-to-that-folder>`, preserving the folder's one-level-deep internal structure.
  - Technical `.dial_folder` / `.dial_folder__<version>` marker resources are excluded from any export, whether selected directly or picked up via folder expansion.
- **Preserve duplicate-path detection**: if two selected paths would collide at the same archive path, reject the export with an error rather than silently overwriting one entry with another.
- No change to `exportFiles`'s signature, the `Files/List.tsx` export button, or the download UX (still returns `{ blob, fileName }` for the existing `downloadFile` browser-side helper).

## Capabilities

### Modified Capabilities
- `files-core-api`: adds file export (archive-path rewriting, technical-file exclusion, duplicate detection), executed directly against DIAL Core, replacing the admin-BE proxy.

## Impact

- **Modified code:**
  - `src/app/[lang]/files/actions.ts` — `exportFiles` builds the archive directly instead of calling `assetsApi.exportFiles`
  - New: `src/server/files/export.ts` (or similar) — path-resolution, rewriting, and zip-assembly logic
- **Unchanged:** `Files/List.tsx`'s export button/handler, `getFileName`/`downloadFile` browser-side helpers, the `{ blob, fileName }` return contract.
- **Dependency:** `jszip` (already added by `migrate-files-to-core`) and `filesCoreApi.downloadFile`/`getFileMetadata` (already built).
- **Removed:** `assetsApi.exportFiles` becomes unreferenced (not deleted from `assetsApi` itself — that class stays alive for other asset types' deferred export/import work).

## Non-goals

- **Fixing the one-level-deep folder-expansion behavior**: the BE's `collectExportablePaths` only reads a node's immediate `items`, even though the metadata request that feeds it asks for `recursive: true` — nested subfolder contents are silently dropped from a folder export today. Preserved bug-for-bug per explicit decision, not fixed, consistent with this migration's general stance (only previously-identified, explicitly-decided bugs get fixed; this one wasn't on that list and the user chose parity here specifically).
- Changing the generated zip filename's exact format — the BE set it via a `Content-Disposition` header this FE can no longer receive from a BE that isn't involved; this change picks a reasonable deterministic name, not a byte-for-byte match of whatever the BE historically produced.
- Any other asset type's export (prompts, toolsets, applications) — separate fast-follows.
- Import (already ported by `migrate-files-to-core`).
