## Why

Two export regressions were reported after the recent Core-direct export work: folder exports for
Applications/Toolsets/Prompts embed the internal `.dial_folder` marker resource, which then fails
re-import (#4002); and folder exports for Files can produce a fully empty archive despite the folder
having content (#4001). Both trace back to the same class of gap in the export path built for
`migrate-files-export-to-core`/`migrate-application-import-export-to-core`: folder handling that either
omits marker-exclusion (assets) or infers folder-ness from a path-string convention instead of the
resource's actual type (files).

## What Changes

- Exclude `.dial_folder`/`.dial_folder__<version>` marker resources from Applications/Toolsets/Prompts
  export, whether selected directly or picked up via folder expansion — mirroring the exclusion Files
  export already has.
- Fix Files export's folder detection so a selected folder is recognized reliably (by its resource
  type, not by whether its path string happens to end in `/`), so a folder with content no longer
  produces a silently empty archive.
- Expand Files folder export recursively at any nesting depth, matching how Applications/Toolsets/
  Prompts export already walks folders — a folder containing a nested subfolder with files previously
  silently dropped those nested files (a deliberate one-level-deep limit inherited from the admin BE,
  found during live verification to actively lose data with no error or warning).
- Fix streamed file downloads/previews (shared by Files, test-suites, datasets, and asset downloads —
  not just Files export) so a filename containing a character outside the Latin1 range (e.g. `™`)
  no longer throws inside `Content-Disposition` header construction. That throw was previously
  swallowed into a promise that never resolves, hanging any caller awaiting it — recursive folder
  expansion (above) is what first made a real file with such a name reachable during export.
- Add regression tests covering all fixes: exporting a folder containing a `.dial_folder` marker for
  each of Applications/Toolsets/Prompts, exporting a Files folder whose path is passed in whatever
  shape the real selection flow produces, exporting a Files folder with nested subfolders, and
  streaming a download for a filename with a non-Latin1 character.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `application-resources-core-api`: export SHALL exclude `.dial_folder` marker resources encountered
  during folder expansion.
- `toolset-resources-core-api`: same marker-exclusion requirement as above.
- `prompts-core-api`: same marker-exclusion requirement as above.
- `files-core-api`: folder export SHALL detect folder selections by resource type rather than by path
  shape, so folder-ness is never silently misdetected; folder export SHALL expand recursively at any
  nesting depth (replacing the prior one-level-deep limitation); folder export SHALL succeed for
  files whose name contains a character outside the Latin1 range.

## Impact

- `apps/ai-dial-admin/src/server/assets/exim.ts` (`expandFolderPath`) — shared by
  `applications/exim.ts`, `toolsets/exim.ts`, `prompts/exim.ts`.
- `apps/ai-dial-admin/src/server/files/export.ts` (`isFolderPath`, `resolveExportEntries`,
  `buildFilesExportZip`) and its caller chain (`files/actions.ts#exportFiles`,
  `components/Assets/Files/List.tsx#onExport`) — the folder/file distinction needs to travel with the
  selection instead of being re-derived from the path string.
- `apps/ai-dial-admin/src/utils/api/create-stream-request.ts` (`streamRequest`,
  `buildFilenameDisposition`) — shared by every caller that streams a file/asset download or preview
  (Files, test-suites, datasets, asset downloads), not exclusive to Files export.
- No route, server-action signature, or wire-format changes; existing zip/JSON export contracts are
  unchanged. No new admin-BE dependency is introduced (fixes are entirely within the Core-direct path).
