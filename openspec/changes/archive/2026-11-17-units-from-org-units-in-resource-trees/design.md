## Context

Core keeps org units as a flat tree (`org_units/public/units`) and writes a `.dial_folder` marker into the **files** tree only; in every other type tree a folder exists only as a prefix of an item. `GET /v1/org-units/public?recursive=true` returns every unit the caller sees as one flat `items` array, parents before children. Core guarantees a unit's parent is a unit or the shared space, and `collect()` only descends from visible children, so **every ancestor of a listed unit is in the same list**. With org units switched off (`orgUnits.enabled=false`, static) every org-units route answers 404.

Today `createFolderContext.fetchByPath` merges Files folders (an extra paged Files metadata read) into each `public/` load. The folder providers live in `[lang]/layout.tsx` (`AssetFolderProviders`, inside `OrgUnitsProvider`), so a provider's `files` / `fetchedFoldersData` survive navigation; `FileManager` loads the root only when `files` is empty. `OrgUnitsContext` loads units once per session (`ensureUnits`), and `FileManager` already calls `ensureUnits()` in a mount effect for unit icons.

Consequence for this design: a tree built at fetch time is a **snapshot** that outlives the page, so "when are units re-read" and "when is a snapshot rebuilt" are two separate questions.

## Goals / Non-Goals

**Goals**
- Show every unit on the six resource trees next to the type's own folders, from the in-memory units list, with no Files read.
- Re-read units when a unit-aware listing opens; not on subfolder navigation.
- Keep a built tree consistent with the units it was built from.
- Org units off, forbidden or failing: nothing breaks, nothing waits on it.

**Non-Goals**
- See the proposal's non-goals (no Files listing change, no new trees, no live polling).
- Reworking the reducer beyond one action, or `mergeFiles`.

## Decisions

**D1 — Keep merging inside `fetchByPath`; only the source of the extra rows changes.**
`mergeFiles` can attach children only to a node already in `state.files`, so a unit folder must arrive in the same `FolderLoaded` as the type's rows. `mergeFolderRows(own, unitRows)` is reused unchanged. *Rejected:* a render-time overlay of units (a unit-only node absent from `state.files` would drop children loaded under it, and selection/expansion helpers look nodes up in state — the reason D1 of the archived change gave too); a reducer action that injects units (a second code path for data that already arrives by fetch).

**D2 — Rows are derived from the units map by a pure util; no ancestor synthesis.**
`getChildUnitRows(units, path)` in `utils/org-units/units.ts` returns, for a normalized `public/…/` path, the units whose parent folder equals it, as folder rows: `name = unit.name` (the folder segment; `displayName` is a label and stays out of tree nodes), `path = normalizeFolder(unit.folder)` (decoded, trailing slash — the form real folder rows carry, since the metadata mapper decodes Core paths), `nodeType = FOLDER`, `bucket = Public`, `folderId = parent path`. Ancestors need no synthesis because of the Core invariant above. Dedupe against the type's own rows stays in `mergeFolderRows` (decoded, trailing-slash key; own node wins). The `file-folders.ts` cast disappears with the Files read.
The field set was checked against the metadata mapper (`toResourceInfo`): `name`, decoded `path` with trailing slash, parent `folderId`, `nodeType`, `bucket`, plus optional `author` and `createdAt` (string).

**D3 — `OrgUnitsContext` gets an awaitable load; failures resolve, never reject.**
- `refreshUnits()` resolves with the units map it settled on.
- New `loadUnits(): Promise<Record<string, OrgUnit>>` returns the in-flight request if there is one, starts the first load if none was ever made, otherwise resolves immediately with the current map. A ref mirrors `units` so callbacks that outlive a render read the latest value.
- `DISABLED` (404/403) → `{}`; `ERROR` or a thrown action → the **last good map** (current behavior already leaves `units` untouched), so one failed refresh does not make unit folders vanish.
- Once the status is `DISABLED`, `refreshUnits` skips the request and resolves `{}`: `orgUnits.enabled` is static in Core, so re-asking on every listing open only buys a 404. A page reload re-probes.
`fetchByPath` calls `await loadUnits()` only for contexts that opt in and only on `public/` paths, wrapped so a rejection becomes `{}`. The type's own listing is requested in parallel with it, so a slow units call never delays the type's rows beyond `Promise.all`, and `undefined` from the type listing keeps the existing `FetchFailed` path untouched.

**D4 — Units are re-read on listing open, via the existing `FileManager` mount effect.**
The effect that calls `ensureUnits()` becomes: if `getRouteNamespace(view) != null` (applications, toolsets, prompts, files, skills, projects, conversations) call `refreshUnits()`, otherwise keep `ensureUnits()` so platform listings do not gain a request. It runs on mount only, so expanding a subfolder never refetches; leaving and returning (toolsets → applications → toolsets) does. The effect runs before the root fetch in the same commit, so the first `fetchByPath` awaits that in-flight refresh through `loadUnits()` and builds the tree from fresh data. *Rejected:* refresh at provider mount or lazily on first fetch (providers live in the layout, so that is once per session); refresh inside every `fetchByPath` (one Core call per folder expand).

**D5 — A tree is invalidated when the set of unit folders changes; the listing rebuilds it.**
The provider records a signature of the unit folder set (sorted `normalizeFolder(unit.folder)` keys, from a pure util) each time `fetchByPath` builds rows from it. An effect on `units` compares the new signature with the recorded one; when they differ and a tree was already built, it dispatches a new `TreeInvalidated` action that empties `files`, `fetchedFoldersData` and `expandedFolders` and keeps `filePath`. `expandedFolders` has to go too: the first load into an empty tree toggles the first node, so a kept set would make it collapse the root. The rebuilt tree opens what a fresh one opens: the root, or the chain down to the kept selection. `FileManager`'s existing effect on empty `files` then rebuilds: a nested selection restores its chain through `fetchFolderHierarchy(filePath, true)` (`shouldRestoreFolderHierarchy` is true because the cache is empty), otherwise the root is fetched. A provider whose listing is not mounted does nothing until it next mounts, so six providers never refetch in the background. A rename (display name only) does not change the signature and invalidates nothing. A unit created, deleted or first seen while a listing is open therefore shows up without a reload, which also covers in-app changes made elsewhere.
*Rejected:* `fetchFiles(ROOT, true)` on change (collapses the user's tree and trips the empty-selection case that `fix-folder-restore-on-list-return` fixed); refetching only on the next listing open without invalidation (a cached tree would keep stale unit rows indefinitely because roots load only when `files` is empty).

**D6 — Opt-in is a flag, not a row-fetching function.**
`createFolderContext(getFilesFunc, contextName, includeUnits?)`. The factory imports `useOrgUnits` (already provided above it in the layout) rather than a server action, so `getFolderRows` and `getFileFolderRows` go away and the six contexts pass `true`. Files, models, keys, roles, routes, interceptors, translators, catalog schemas, app runners and the rest do not.

**D7 — `public/` only, as before.**
Unit rows are built only when `isPublicPath(path)`. The Applications/Toolsets `platform` root and synthetic config-file roots get none.

**D8 — Test mocks.**
`test-setup.tsx` mocks `OrgUnitsContext`; its default value gains `loadUnits` and a `refreshUnits` that resolves a map, so specs for the factory inject units through `vi.mocked(useOrgUnits)` like existing unit specs do.

## Risks / Trade-offs

- [A non-unit Files-only folder no longer appears on these trees] → Intended (units were the goal); recorded as BREAKING in the proposal and in the spec delta.
- [Units created by another admin appear only on the next listing open] → Accepted; refresh-on-open bounds the delay to a navigation, and D5 rebuilds a cached tree when it differs.
- [A non-admin sees a subset of units] → Core already filters the list to what the caller may see; the tree shows exactly that.
- [`TreeInvalidated` while the listing is mounted triggers the empty-`files` effect, which clears the grid briefly] → Same visible behavior as the first load; only fires when the unit set really changed.
- [Synthetic rows differ subtly from metadata rows] → Field set taken from the mapper (D2); cover with a spec asserting a unit row passes through `getFolderItems`, `mergeFiles` and expansion like a real folder.
- [A unit folder has no items of the type: listing it returns 404 which Core's client layer turns into an empty list] → Shown as an empty folder, as in the archived change; creating into it relies on Core creating the folder with the first resource.
- [Providers outside a mounted `OrgUnitsProvider`] → Not possible in the app (the layout nests them); specs get the global mock.

## Migration Plan

No data or contract migration. Rollback is reverting the six opt-ins plus the `FileManager` effect; the factory option is inert without them. The archived change's spec is replaced by this change's delta at archive time.

## Open Questions

None.
