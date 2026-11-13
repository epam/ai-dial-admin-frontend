## Context

`getRootDescriptors(view)` decides which of `file/`, `platform/`, `public/` a listing offers. One
`createFolderContext` per view loads all of them into a single tree (`fetchFiles(string[])` →
`buildRootNodes`), and `FileManager` renders it. Only `public/` is genuinely hierarchical: `platform/` and
`file/` are flat. The multi-root shape leaks into five places:

- `FileManager`: `isMultiRootView` (label wrapper as tree root), `isFileRootActive` (disables create-folder,
  download, delete, move, permissions, preview, upload), `isMoveSupported`, `isCreateFolderSupported`.
- `BaseAssetList`: `isPlatformDualBucketView(view, path)` picks a different server action in duplicate, create,
  delete and move; `isNestedPlatformView` handles the policy cost-object folder.
- `AssetsFolderContext`: `fetchByPath` special-cases `file/` and `getFolderRows`; `fetchRoots` special-cases
  failed `file/` reads.
- `EntitySelectManager`: `rootFolders`, `rootLabelI18nKey`, `isMultiRoot`.
- `Roles/utils.ts`: `isPublicPath(path)` recovers a row's source by sniffing the `public/` prefix.

Decisions already taken with the product owner: Public is the only tree; Platform and config.json are flat
grids; the header and tab layout; Policies flatten with a Cost object column; the header count rule; the picker
mirrors the listing; role limits keep their stored shape.

## Goals / Non-Goals

**Goals:**
- One listing shell used by all platform entities, Applications and Toolsets.
- Delete the multi-root machinery rather than leaving it dormant.
- Platform and config.json load without a tree: no expansion state, no folder cache, no path-keyed fetches.
- Picker and listing share the same three data sources, so they cannot disagree about what exists.

**Non-Goals:**
- Counting Public entities; changing detail routes, server actions or Core requests; migrating stored data.

## Decisions

### D1. Source of truth is an explicit `AssetSource`, not a path prefix

Introduce `enum AssetSource { Public, Platform, ConfigFile }` and a per-view descriptor
`getAvailableSources(view, { isUnitMode })` returning the ordered subset that applies:

| View kind | Sources | Default |
|---|---|---|
| Applications, Toolsets | Public, Platform, ConfigFile | Public |
| Platform entity with `file/` (models, routes, roles, …) | Platform, ConfigFile | Platform |
| Keys | Platform | Platform |
| Unit mode, Applications/Toolsets | Public | Public |

This replaces `getRootDescriptors`, `DUAL_BUCKET_VIEWS`, `isPlatformDualBucketView`, `isFileRootPath`,
`isPlatformBucketPath` and `FILE_ROOT_FOLDER`. Row actions and the picker branch on the tab that is active,
never on a string prefix. `ConfigFileEntityType` mapping (`getConfigFileEntityType`) stays; it only answers
"does this view have a config.json tab".

*Alternative — keep path sniffing, only change the UI:* rejected. It leaves the bucket branching in
`BaseAssetList` and forces the grids to fabricate `platform/…` paths just to be recognised.

### D2. Three tab bodies, one shell

`TabbedAssetList` (feature component under `components/Assets/`) owns: header (reusing `ListEntities`'s title,
`listLabelAddon`, `children` slots), the tab row, and the active body.

```
TabbedAssetList(view)
 ├─ header   title · count addon · Create (Platform tab only)
 ├─ tabs     visible sources, badge on Platform / ConfigFile
 └─ body     Public      → BaseAssetList (FileManager, one root)
             Platform    → FlatAssetGrid (writable)
             ConfigFile  → FlatAssetGrid (readOnly)
```

The shell renders its own header with the same layout classes as `ListEntities` (title, count, actions) instead of
extending `ListEntities` with a `tabs` slot: the Public body is a `FileManager` that draws its own toolbar, so there is
no single grid component for a `ListEntities` header to wrap. The page chrome is therefore identical across tabs.

*Alternative — one `FileManager` with a "flat mode":* rejected. It would keep every `FileManager` branch this
change is trying to delete and still not give Platform the `/models`-style header.

### D3. Flat data via a small hook, not the folder context

`useFlatAssets(view, source)` returns `{ rows, isLoading, hasError, refetch }`, calling the same server actions
the folder contexts call today (`getModels`, `getConfigFileModels`, …). Platform and config.json counts come from
`rows.length`; badges for both tabs are fetched on mount so they show before the tab is opened. Mutations
(create, duplicate, delete) call `refetch` instead of `fetchFiles(folderPath)`. The hook owns its own state and
needs no folder context: nothing on the Platform or config.json tab reads `filePath`, `files` or a folder cache.

Policies and Policy Assignments: the server action already lists the cost-object folders and their records one
level at a time. `useFlatAssets` for these views fans out per folder and flattens, adding `folderId` as the
Cost object column value. This is the one place the flat hook costs extra requests (one per cost object); see Risks.

`createFolderContext` stays, but loses `string[]` roots, `buildRootNodes`, `getConfigFileNames`, and the
`file/` branches. It becomes a single-root tree loader used by Public and by the single-source tree views.
Providers in `AssetFolderProviders` for platform-only views (those whose only consumer was the old tree) are
dropped if nothing else reads them.

*Alternative — keep one context per view and add a flat selector:* rejected. The context caches by folder path
and carries expansion state that has no meaning for a flat list. It would also share one cache between the Public
tree and a Platform grid on Applications/Toolsets, where a `refreshData` fetch replaces the whole cache and can move
`filePath`.

### D4. Header count rule is a pure function

`getHeaderCount(sources, counts)` returns `undefined` when the listing has a Public source (Applications, Toolsets),
`undefined` while any flat source has no count (a failed read never shows a partial total), and
`platform + configFile` otherwise. It is a util with unit tests, so the rule is stated once and the
component only renders the result (`dial-small-text text-secondary` after the title).

### D5. Public tab: `FileManager` loses the multi-root and file-root branches, and every platform path

With one root, `rootItem` is `files[0]` (the `public/` node) always; `isMultiRootView`, `isFileRootActive`,
`isMoveSupported`/`isCreateFolderSupported` (both existed for flat and nested platform views) are deleted.
`getTreeOptions` stops receiving `label`, so the tree has no title. The file manager's own Create / Entity flow and
its modals (`CreateAsset`, `CreateApplication`, `CreateEntity` for Public views, `DuplicateAsset`,
`DeleteAssetsModal`) drop all platform support: no `isPlatformDualBucketCreate`, no `shouldOpenOnPlatform`, no
platform root list, no `PlatformCreateAssetActionMap` branch. Bucket branching in `BaseAssetList` for
duplicate/create/delete/move is deleted; those paths serve Public only.

### D5a. Platform writes go through standalone modals that take explicit props

Platform's create, duplicate and delete live with `FlatAssetGrid`, not `BaseAssetList`, and none of them takes
`getContext`:

- **`CreatePlatformEntity`** (new, `components/Assets/Platform/CreatePlatformEntity.tsx`) is the one create popup
  for the Platform tab. It switches on the view exactly as `Modals.renderCreateModal` does today: keys to
  `CreateKeyModal`, policies and assignments to `CreatePolicyModal`, applications to `CreateApplication`, and
  everything else to `CreateEntity`. The forms it renders are in platform mode and receive `names`,
  `runners`/`translators` and an `onCreated` callback instead of a folder context. Platform has no versions, no
  folders and no `folderId`, so those inputs disappear rather than being faked.
- **Duplicate** reuses `DuplicatePlatformAsset` and `DuplicatePlatformKeyModal`, which already take no context.
- **Delete** uses a context-free confirm over the selected rows (the platform case of `DeleteAssetsModal`, which
  only needs the rows, not a folder listing).
- Writes still go through the flat per-view create actions, `PlatformBulkDeleteAssetActionMap` and `bulkDelete*` (called with one row; the grid has no selection or bulk toolbar for now);
  after success the grid calls `refetch`.

The shared create forms (`CreateEntity`, `CreatePolicyModal`, `CreateApplication`) therefore gain an explicit
platform mode that replaces their `context`/`getContext` prop; their Public-tree callers keep passing the context.

### D6. Picker: source-aware selection

`EntitySelectManager` is replaced by a tabbed picker that renders, per available source, the Public tree
(existing tree + selection) or a selectable flat grid (`FlatAssetGrid` in select mode, name column only,
multi-select checkboxes). It reports `PickedEntity[]`:

```ts
interface PickedEntity { source: AssetSource; path?: string; name: string }  // path only for Public
```

The tabbed picker is a separate module loaded on demand (`React.lazy`): it reads the Platform and config.json grids,
which pull in every entity's list actions, and a picker that only browses one tree (a skill, a file) must not carry
them. Every tab body stays mounted (hidden while inactive) so a pick survives a visit to another tab.

`Roles/utils.ts` maps Public → `${APPLICATIONS_PREFIX}${path}` and Platform / ConfigFile → `name`, so stored
limits are byte-identical to today. A name already picked from one flat tab is shown as selected in the other,
since both store the same bare name. `Skill` and `File` pickers are single-root already; they keep the
Public-tree body and simply lose the `rootFolders` array.

### D7. Unit mode

Platform and `file/` are admin-only today (`isPlatformBucketEnabled = !isUnitMode`, file root off in unit mode).
`getAvailableSources` takes `isUnitMode`, so unit users get Public only: Applications and Toolsets render the
tab bar with a single tab omitted entirely (no bar), every other platform entity is not reachable and is
unchanged.

### D8. Tabs and badge component

Use the ui-kit `Tabs`: its `TabItem` has a `count` field that draws the badge and joins the tab's accessible name, so
no custom badge is needed. The active tab is kept in local state and mirrored to a `tab` query parameter, so deep links and
"back" return to the same tab (compatible with `restore-folder-on-menu-return`).

### D9. Landing order inside the single PR

One PR, ordered so every commit builds, typechecks (both gates) and passes its own tests:

1. Source model + utils (`AssetSource`, `getAvailableSources`, `getHeaderCount`) with tests.
2. `useFlatAssets`, `FlatAssetGrid`, `CreatePlatformEntity` and its context-free forms, and the `TabbedAssetList`
   shell with the `ListEntities` tabs slot, wired for one pilot platform entity (Models) behind the old route.
3. Roll the shell out to the remaining platform entities and flatten Policies / Policy Assignments.
4. Applications and Toolsets: Public tab on `BaseAssetList`, Platform and config.json tabs.
5. Picker rewrite and `AddApplicationsPopup` / `Roles/utils.ts` switch.
6. Delete the multi-root machinery, dead branches, unused providers and i18n keys; sync specs and docs.

### D10. Create-destination pickers (`CreateAsset`, `FolderList`, `FilePath`) lose the platform root

These three also call `getRootFolders` to offer `platform/` and `public/` as destinations. `CreateAsset` is
opened from the Public tab and, separately, from an app-runner or MCP container detail view ("create from this
runner / container") with `shouldOpenOnPlatform`. After this change:

- The Public tab's Create dropdown creates into the browsed `public/` folder through `CreateAsset`, which no
  longer knows about `platform/`. The Platform tab's header Create opens `CreatePlatformEntity` (D5a).
- A runner or container detail view has no tab to imply the destination, so a thin `CreateSeededAsset` wrapper
  shows a two-option **Destination** control (Public folder / Platform) and renders `CreateAsset` (Public, with the
  single-root `FolderList`) or `CreatePlatformEntity` (Platform, no folder picker, no version field) with the same
  seed values.
- `FilePath` and `FolderList` drop `file/` filtering and the multi-root auto-fetch; they work on one root.

## Risks / Trade-offs

- **[Large single PR]** → ordered commits (D9) so review can go commit by commit; deletion of dead code is the
  last commit, so the earlier ones stay reviewable as additions.
- **[Badges cost requests on mount]** → config.json is one names request (already the case today); Platform is the
  same listing the tab shows, so opening it reuses the loaded rows. Policies fan out per cost object — measure,
  and if it is slow, load the badge from the root listing's folder count instead of flattening eagerly.
- **[Stored limits]** → mapping is source-aware but produces the same strings; covered by a `Roles/utils` test
  that pins `applications/{path}` and bare-name outputs.
- **[Same name in Platform and config.json]** → both store as the bare name; the picker marks it selected on both
  tabs rather than allowing a duplicate entry.
- **[Wide spec delta]** → `config-file-entity-views` and the `platform-*` listing requirements are rewritten in
  this change; specs and docs under `docs/` are updated in the same PR per `AGENTS.md`.
- **[Overlap with in-flight changes]** → `flat-page-layout` and `restore-folder-on-menu-return` also touch list
  pages; rebase on them rather than racing them.

## Migration Plan

No data or API migration. Rollout is a normal deploy; rollback is a revert. Users lose cross-bucket drag/move
and the combined three-root tree; nothing persisted depends on them. Column-state storage keys for flat grids
reuse the view's `storageKey`, so saved column layouts survive where the columns still exist.

## Open Questions

- Runner- and container-seeded create modals (D10): is a Public/Platform Destination control the right replacement for the
  platform folder in the tree, or should that entry point always create into Platform? Defaulting to the control
  because it preserves both outcomes the current spec allows.
- Is the per-cost-object fan-out for Policies acceptable, or should Core's listing be asked for a flat read?
  (Server-side change, out of scope here; decide after measuring.)
