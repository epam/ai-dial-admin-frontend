## Why

Folders Storage lists folders by merging the one-level folder trees of five resource types (application, toolset, conversation, prompt, file). Skills and Projects are not among them, so a folder that holds only skills or only projects never appears in the tree, and its permission rules cannot be managed there. This blocks the folder actions planned for the Skills and Projects tree views (issue #5306), whose "manage permissions" action opens Folders Storage.

## What Changes

- `getFoldersCore` also reads the Skill and Project folder listings (Core's v2 endpoints) and merges their **folder** rows into the same tree. Resource rows (the skills and projects themselves) are dropped: only folders are shown.
- The Skill and Project trees are re-rooted onto another type's root (`withRootOf`) and contribute only their children, so a root mismatch between types cannot trip the cross-type consistency check and fail the whole tree.
- A failing Skill or Project listing is skipped, as for the existing types, and does not break the tree.
- Rules read and write (`getRules`, `updateRules`) are unchanged: Core stores rules per public folder path regardless of resource type, allows `SKILL` and `PROJECT` in publications, and enforces rules on them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `folders-core-api`: the folder-listing requirement grows from five resource types to seven, with Skill and Project contributing folder rows only.

## Impact

- `src/server/folders/folders-core.ts` (`getFoldersCore`) and `src/server/folders/folder-tree.ts` (a builder for folder trees from list rows).
- Folders Storage and `RuleFolderContext` are unchanged: they already render whatever `getFolders` returns.
- One extra Core call per type (two in total) on each folder expansion. This is temporary: Core is expected to sync folders across resource types, after which a single call suffices.

## Non-goals

- Rename and move of skill and project folders (`changeFolderCore` keeps its five types). They belong with the tree-view actions.
- The Skills and Projects tree-view actions (add sibling, add child, manage permissions, rename, delete): a follow-up change.
- Showing individual skills or projects in Folders Storage.
