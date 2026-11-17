## Why

An org unit exists in Core's files tree only (a hidden `.dial_folder` marker); in the applications, toolsets, skills, projects, conversations and prompts trees a folder exists only as a prefix of an item, so a unit with no content of a type is invisible on that type's listing. `show-file-folders-in-resource-trees` (#5406) worked around this by reading Files folders on every `public/` folder load. That read pages through every file of the folder just to pick out folders, and it also surfaces every Files-only folder, which was never the goal — the problem is units.

Core already answers "which units exist" in one call (`GET /v1/org-units/public?recursive=true`), and `OrgUnitsContext` already holds the result. Every ancestor of a unit is itself a unit (Core: a unit's parent is a unit or the shared space), so that one list is enough to build the unit folders of any level.

## What Changes

- Resource trees add **unit folders from the org-units list** instead of Files folders. A folder row is built for every unit that is a direct child of the loaded `public/` path and merged into the type's own rows (type's node wins).
- **BREAKING (behavior):** a folder that exists only in Files and is not a unit no longer appears on these trees. Unit folders still do.
- Remove the Files folder read: the `getFileFolders` server action and `getFileFolderRows`.
- `OrgUnitsContext` gains an awaitable load so a folder fetch can wait for units that are still in flight, and `refreshUnits` resolves with the loaded map.
- Units are refetched **when a unit-aware listing opens** (mount of `FileManager` for a route that has a unit namespace), not on subfolder navigation and not on every folder load.
- Because folder providers live in the layout and keep their tree across navigation, a tree built from one set of units is **invalidated when the set of unit folders changes**, and the listing's existing mount logic rebuilds it.
- Org units switched off in Core (every route answers 404), a forbidden read or a failed read adds no folders and never fails or delays the type's own listing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `resource-tree-file-folders`: requirements change from "Files folders are merged" to "unit folders are merged" — source, scope of what appears, refresh trigger, tree invalidation and failure isolation. The capability keeps its name to avoid churn; its purpose text is rewritten.
- `org-units-folders-storage`: "Unit map is shared by every folder context" — the units are no longer loaded once per session: a unit-aware listing re-reads them on open, folder loads wait for a read in flight, and a read that answered 404/403 is not repeated.

## Non-goals

- Filtering or restricting the Files listing itself (it keeps showing the marker folders natively).
- Showing unit rows on trees that do not opt in today (models, keys, roles, routes, interceptors, translators, catalog schemas, app runners, Files).
- Any create-permission or access work for units (owned by `org-units-folders-storage`).
- Polling or live updates for units created by another admin; a change shows on the next listing open.
- Changing Folders Storage, which builds its own tree server-side in `getFoldersCore`.

## Impact

- `src/context/assets/AssetsFolderContext.tsx` (opt-in argument, awaited units, signature tracking), `folder-reducer.ts` + `models.ts` (one new action), the six `*FolderContext.tsx` opt-ins, `file-folders.ts` (deleted).
- `src/context/OrgUnitsContext.tsx` (awaitable load, `refreshUnits` returns the map, skip refetch once disabled).
- `src/utils/org-units/units.ts` (pure child-unit row builder and unit-set signature).
- `src/components/Common/FileManager/FileManager.tsx` (mount effect refreshes units for unit-aware views).
- `src/app/[lang]/files/actions.ts` (remove `getFileFolders`).
- Shared components touched: `FileManager` is used by every folder listing; the refresh is gated to routes with a unit namespace so other listings behave as before.
- Supersedes decisions D1, D3, D5 and D6 of the archived `show-file-folders-in-resource-trees`.
- No backend change; Core's org-units API is used as is.
