## Context

`getFoldersCore` (`src/server/folders/folders-core.ts`) already builds the Folders Storage tree by reading one non-recursive metadata level per resource type, keeping only folder nodes (`toFolderTree`) and merging them (`mergeFolderTrees`); Files is one of the types. Each content page instead loads one type through its `createFolderContext` provider (`fetchByPath` → the type's `getXxx(path)` action → `FolderLoaded`). An org unit's `.dial_folder` marker lives in the Files tree, so the unit — and any other folder that exists only in Files — never reaches the other types' trees.

`mergeFiles` can only attach children to a node already present in `state.files`, so any folder that should be browsable must arrive in the same list as the type's own rows, in the same `FolderLoaded`.

## Goals / Non-Goals

**Goals**
- On the six resource trees, show every Files folder next to the type's own folders, as Folders Storage does.
- Keep Files rows (items, the `.dial_folder` marker) out of the tree and the folder cache.
- Make the change once, in the shared factory, with a per-context opt-in.

**Non-Goals**
- Filtering to org units, reading `OrgUnitsContext`, or any create-permission work (see proposal).
- Changing the reducer, `mergeFiles`, or the Files context.

## Decisions

**D1 — Merge inside `fetchByPath`, not in the reducer or at render.**
`fetchByPath` calls the type listing and the Files folders read with `Promise.all` and returns one list. `FolderLoaded` then behaves exactly as today. *Alternatives:* a derived overlay at render time (rejected: unit-only folders are absent from `state.files`, so their loaded children would be dropped by `mergeFiles`); a reducer action for extra folders (rejected: more state and a second code path for no benefit when the data comes from a fetch).

**D2 — Opt-in through `createFolderContext`.**
A new optional argument (a function returning the Files folder rows for a path) is passed by the six contexts — toolsets, applications, skills, projects, conversations, prompts. Files, models, keys, roles, routes, interceptors, translators, catalog schemas and app runners do not pass it. *Alternative:* a boolean flag with the factory importing the action (rejected: the factory stays free of server-action imports and tests inject a stub).

**D3 — One server action, folders only, filtered on the server.**
A `getFileFolders(path)` action in `files/actions.ts` pages through `filesCoreApi.getFileMetadata(token, path, false, nextToken)`, keeps `FOLDER` nodes only and returns them as rows. File items and the `.dial_folder` marker are dropped before the response, so no client code can leak them into the tree or `fetchedFoldersData`. The existing `fetchAllPages` and `toFolderTree` helpers are reused; no new Core call shape.

**D4 — Pure merge helper, type's node wins.**
A pure `mergeFolderRows(own, fileFolders)` in `src/utils/files/folder.ts` returns the own rows plus any Files folder whose normalized path is not already present (own rows keep their order and fields). Dedupe uses the trailing-slash, decoded form so the two sources cannot disagree on encoding.

**D5 — `public/` only.**
The Files read runs only when the path starts with `public/`. The Applications `platform` root and the synthetic config-file roots (`isFileRootPath`) skip it: they are not Files trees, and a non-public Files path would list the user's own bucket.

**D6 — Failure isolation.**
A rejected or empty Files read yields `[]`. It never changes the outcome of the type's own listing: if that listing is `undefined` (403) the existing `FetchFailed` path runs unchanged, otherwise its rows are merged with whatever Files returned.

## Risks / Trade-offs

- [A folder with many files is paged through to pick out folders; Core has no folder-only filter] → only one extra read per folder load, public paths only; measure on a file-heavy folder after implementation.
- [All Files folders appear, not only units] → intentional (matches Folders Storage); unit-only filtering stays a possible follow-up.
- [A folder visible in a type tree has no items of that type; listing it returns 404 and Core's client layer turns that into an empty list] → shown as an empty folder; creating into it relies on Core creating the folder with the first resource, to be confirmed against a running Core.
- [Path encoding differs between sources] → D4 compares normalized paths; covered by a unit test with an encoded segment.

## Migration Plan

No data or contract migration. Ship behind no flag; rollback is reverting the six opt-ins (the factory option is inert without them).

## Open Questions

- None blocking. Whether Delete on a Files-only folder from a type tree reaches the Files content is existing folder-delete behavior and is not changed here.
