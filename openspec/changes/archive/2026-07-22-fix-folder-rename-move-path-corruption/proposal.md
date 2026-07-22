## Why

Renaming or moving an Assets folder (Applications, Prompts, Toolsets, Conversations, Files) corrupts every descendant resource's path instead of relocating it cleanly. This is filed as two issues that turn out to be one root cause:

- **#3974**: renaming a folder makes it disappear from the tree; its contents relocate to the `public` folder; for Applications, the app ID gets the old folder name glued onto it with no separator (`als_code_apps` + `als-quickapp20` → `als_code_appsals-quickapp20`).
- **#3983**: "Move to folder" turns the folder into a `.dial_folder`-suffixed file at the destination instead of a folder, and when the folder has contents, the folder name gets glued onto the entity's name.

`changeFolderCore` (`apps/ai-dial-admin/src/server/folders/folders-core.ts:216-227`) computes each descendant's destination path with `barePath.replace(oldPath, newPath)` — a plain first-occurrence substring swap with no path-segment boundary check and no trailing-slash normalization. Rename and move-to-folder share this exact code path (both are driven through the same `changeFolder` call from `BaseAssetList.tsx`'s folder-move branch), so a single fix addresses both issues.

A correct, segment-safe rewrite already exists in the codebase — `changeFolderName()` in `apps/ai-dial-admin/src/utils/files/path.ts:39-45` — but it is unused (referenced only by its own test).

## What Changes

- Replace the naive `barePath.replace(oldPath, newPath)` substitution in `changeFolderCore` with a segment-safe path rewrite that only matches `oldPath` at a path-segment boundary and preserves the correct `/` separator and trailing-slash convention for folders.
- Wire in (or extend, if its current signature doesn't fit the per-descendant rewrite use case) the existing `changeFolderName()` utility rather than introducing a second implementation.
- Add regression test coverage in `folders-core.spec.ts` for the case that currently has no coverage: `oldPath`/`newPath` with mismatched trailing slashes, and descendant paths (including the `.dial_folder` marker resource) that must gain/lose a separator correctly during rewrite.
- No change to the public behavior of `changeFolder`/`FoldersStorage`/`RuleFolderContext` signatures — this is an internal path-computation fix within the existing `folders-core-api` capability.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `folders-core-api`: the "Folder move validates existence, copies rules, then moves each type sequentially" requirement gains a precise, testable rule for how each descendant's destination path is computed during move/rename, replacing the current unspecified (and buggy) behavior.

## Impact

- `apps/ai-dial-admin/src/server/folders/folders-core.ts` (`changeFolderCore`) — the fix itself.
- `apps/ai-dial-admin/src/utils/files/path.ts` (`changeFolderName`) — reused, possibly adjusted.
- `apps/ai-dial-admin/src/server/folders/tests/folders-core.spec.ts` — new regression cases.
- No API surface change: `apps/ai-dial-admin/src/app/[lang]/folders-storage/actions.ts`, `BaseAssetList.tsx`, `Files/List.tsx` call sites are unaffected.
- Confirmed out of scope: ai-dial-core and ai-dial-admin-backend are not touched — Core's `ResourceOperationService` correctly rejects folder-level moves by design and only ever receives correctly-computed per-resource move calls once this fix lands.
