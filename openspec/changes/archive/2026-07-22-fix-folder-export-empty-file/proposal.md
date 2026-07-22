## Why

Exporting an Assets folder (Applications, Prompts, or Toolsets) that contains at least one entity produces an empty export document in both JSON and Archive formats (#3984). All three asset types share one export builder, `buildAssetsExport` (`apps/ai-dial-admin/src/server/assets/exim.ts:39-53`), which treats every incoming path as a single versioned-entity content path and calls `assetApi.getMerged(token, type, path)` on it directly. A folder has no content resource, so `getMerged` (which calls `getContent` first) returns `null` for a folder path, and the path is silently dropped — a selected folder therefore always contributes zero entities to the export, regardless of format.

This is a migration regression, not a longstanding bug: the archived design for `migrate-application-import-export-to-core` explicitly called for the Core port to mirror the old admin-backend's `ResourceEximExportHelper.resolveExportEntries` path resolution, which includes folder expansion. Files export (a separate module, migrated the same day) implements exactly that; the shared `exim.ts` used by Applications/Prompts/Toolsets never got it.

The fix mirrors the recursive-descendant-walk pattern already used (and just hardened) for folder delete/move in `apps/ai-dial-admin/src/server/folders/folders-core.ts`, reusing the existing `gatherResourceUrls`/`fetchAllPages` walker from `apps/ai-dial-admin/src/server/folders/resource-walk.ts` — per user decision, folder expansion for export goes arbitrarily deep (nested subfolders included), not just one level, since deep nesting is an expected case here.

## What Changes

- `buildAssetsExport` gains a folder-expansion step: for each incoming path, determine whether it's a folder or a single item (via a non-recursive metadata read, same check `folderExists` in `folders-core.ts` already uses), and if it's a folder, recursively walk its full descendant tree (any depth) to collect every leaf resource path before running the existing per-path `getMerged` + `id`-tagging loop. Non-folder paths are unaffected — same single-path behavior as today.
- This is shared logic, so the fix applies identically to Applications, Prompts, and Toolsets export (JSON and Archive) — one fix, three call sites (`buildApplicationsExport`, `buildPromptsExport`/equivalent, `buildToolsetsExport`/equivalent, all thin wrappers around `buildAssetsExport`).
- No change to Files export (`apps/ai-dial-admin/src/server/files/export.ts`) — it already does its own folder expansion via `resolveExportEntries`/`listFolderChildren` and is not affected by this bug.
- No change to the export document shape, the JSON/Archive branching in `runAssetExportAction`, or any server-action/route signatures — this is purely a path-resolution fix inside `buildAssetsExport`.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `application-resources-core-api`: the "Application export builds a structured aggregate document directly against Core" requirement gains folder-path expansion.
- `prompts-core-api`: the "Prompt export builds a structured aggregate document directly against Core" requirement gains folder-path expansion.
- `toolset-resources-core-api`: the "Toolset export builds a structured aggregate document directly against Core" requirement gains folder-path expansion.

## Impact

- `apps/ai-dial-admin/src/server/assets/exim.ts` (`buildAssetsExport`) — the fix itself.
- `apps/ai-dial-admin/src/server/folders/resource-walk.ts` (`gatherResourceUrls`, `fetchAllPages`, `isFolderNode`) — reused, not modified.
- `apps/ai-dial-admin/src/server/assets/tests/exim.spec.ts` — new/updated test coverage; the existing "skips a path that resolves to nothing" test documents the current (buggy, for folders) behavior and needs to keep passing for genuinely-missing paths while a new folder-path case is added.
- No API surface change: `apps/ai-dial-admin/src/server/applications/exim.ts`, `.../prompts/exim.ts` (or equivalent), `.../toolsets/exim.ts` (or equivalent), and the `actions.ts` call sites (`exportApps`, `exportPrompts`, `exportToolsets`) are unaffected.
- Confirmed out of scope: Files export and Conversations export (no `exportConversations` action exists in the codebase today) are not touched by this change.
