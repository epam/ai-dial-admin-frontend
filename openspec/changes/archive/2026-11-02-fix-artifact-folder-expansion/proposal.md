## Why

Issue #5325 reports that expanding an Artifacts subfolder rotates its caret without revealing children until the folder name is clicked. The shared FileManager updates expansion state on caret clicks but only loads children through selection; expansion must load children independently of selection.

## What Changes

- Load uncached children when a folder becomes expanded through the shared FileManager's controlled expansion callback, covering caret clicks and Arrow-key expansion.
- Preserve the selected folder, grid contents, and navigation when expanding or collapsing through that callback.
- Reuse successful folder loads, suppress duplicate pending expansion requests, and allow reopening after a failed load to retry.
- Preserve folder-name selection behavior and existing request-error feedback.
- Add regression tests for expansion, selection independence, cache reuse, and pending/failed loads.

## Capabilities

### New Capabilities

- `asset-folder-tree-expansion`: Lazy loading and selection-independent expansion in the shared content-page FileManager.

### Modified Capabilities

None. `folder-list-tree` describes the separate FolderList surface, which is outside this change.

## Impact

- Shared integration: `apps/ai-dial-admin/src/components/Common/FileManager/FileManager.tsx`, its expansion/loading helper if needed, and colocated tests.
- Consumers: all content-page listings using this wrapper, including Artifacts and the shared Platform listings. Existing multi-root and synthetic file-root cache behavior must remain intact.
- Reuses `AssetsFolderContext.fetchFiles` and successful `fetchedFoldersData` entries; no backend API, dependency, or library implementation changes.
- Automated browser-verification task omitted at the user's explicit request; unit tests and final quality gates remain required.

## Non-goals

- Changing `FolderList` in Folders Storage, Rules, or asset creation dialogs.
- Selecting folders on caret clicks (`selectOnCaretClick` stays disabled).
- Changing folder-name click semantics, eagerly loading the full tree, or redesigning notifications.
