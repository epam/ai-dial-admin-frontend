## Why

Exporting a folder from Assets → Files and re-importing it into the same destination folder creates a
duplicate nested parent: `Files > public > public > test_01` instead of `Files > public > test_01`.
The export embeds the storage bucket (`public/`) into the archive path, and the import prepends the
destination folder (also `public/`) on top of it, doubling the bucket segment.

## What Changes

- **`toExportArchivePath`** in `server/files/export.ts`: remove the hardcoded `public/` prefix from
  both branches. A single-file entry becomes `files/<filename>`; a folder selection's entries become
  `files/<lastFolderSegment>/<relative-path>`. The archive path is now bucket-agnostic — the
  destination folder chosen at import time determines where files land.
- **`export.spec.ts`**: update expected archive paths (the assertions currently bake in `public/`).
- **`specs/files-core-api/spec.md`**: correct the two scenarios ("Single file exported flat" and
  "Folder exported with re-rooted structure") and the requirement prose, which currently specify the
  buggy `files/public/…` shape.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `files-core-api`: the archive-path requirement and its two scenarios currently specify `files/public/<…>`,
  which encodes the bug. The corrected requirement is `files/<…>` (no bucket prefix).

## Impact

- **`apps/ai-dial-admin/src/server/files/export.ts`** — `toExportArchivePath` (2 lines + JSDoc).
- **`apps/ai-dial-admin/src/server/files/tests/export.spec.ts`** — expected values in
  `toExportArchivePath` and `buildFilesExportZip` test suites.
- **`openspec/specs/files-core-api/spec.md`** — requirement prose and two scenarios.
- No UI, no API-route, no import-path changes — the import side is correct as-is.
- **Backward compat**: archives exported before this fix contain `public/` in their paths and will
  still produce a doubled folder on import. This is acceptable for a pre-release (0.21.0-dev).
