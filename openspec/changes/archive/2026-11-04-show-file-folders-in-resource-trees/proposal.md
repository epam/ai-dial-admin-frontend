## Why

An org unit is created with a `.dial_folder` marker in the Files tree, so it shows only in the Files listing. Folders Storage already merges the folder trees of every resource type, but each resource page loads only its own listing: a unit (or any folder that exists only in Files) is invisible in the toolsets, applications, skills, projects, conversations and prompts trees, and the user cannot browse into it to create a resource there. Core is moving toward folders shared across resource types; until then the admin repeats the Folders Storage merge per page.

## What Changes

- On the toolsets, applications, skills, projects, conversations and prompts listings, every folder load also reads the Files **folders** for the same path and merges them with the type's own folders. The union is deduplicated by path and the type's own node wins.
- Only folder nodes are taken from Files. File rows, including the `.dial_folder` marker, never reach the tree or the folder cache; item grids stay type-only.
- The extra read is applied only under `public/`. The Applications `platform` root and the synthetic config-file roots are unchanged.
- A failed or empty Files read adds no folders and never fails the type's own listing.
- The Files listing itself, and every other asset tree (models, keys, roles, routes, interceptors, translators, catalog schemas, app runners), are unchanged.

## Capabilities

### New Capabilities
- `resource-tree-file-folders`: the merged Files folders on the six resource trees — which trees, which paths, folders only, dedupe rule, failure isolation.

### Modified Capabilities
<!-- None: existing folder-tree specs (asset-folder-tree-expansion, folder-list-tree) keep their requirements; the extra folders arrive through the same `fetchFiles(path)` contract. -->

## Non-goals

- Filtering Files folders to org units; all Files folders appear, as in Folders Storage.
- Reading the org units map or changing `OrgUnitsContext`.
- Per-unit create permission (`canWriteAt`); folders keep the existing placeholder permissions.
- Changing Move, Rename or Delete behavior for the added folders.

## Impact

- `src/context/assets/AssetsFolderContext.tsx` (`createFolderContext` gains an opt-in option; `fetchByPath` merges) and the six contexts that opt in: `ToolsetsFolderContext`, `AppsFolderContext`, `SkillFolderContext`, `ProjectFolderContext`, `ConversationsFolderContext`, `PromptFolderContext`.
- One new server action returning Files folder nodes for a path, built on `filesCoreApi.getFileMetadata` (non-recursive, paged) and the existing folder-tree helpers in `src/server/folders/`.
- Extra request per folder load on the six trees; a folder holding many files is paged through to pick out its folders.
- No Core or backend contract changes.
