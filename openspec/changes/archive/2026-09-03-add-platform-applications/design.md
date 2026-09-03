## Context

`ai-dial-core` already allows two entity types — `applications` and `toolsets` — to live in **both**
the `public` bucket (user-published, hierarchical, versioned, served by the generic
`ResourceController`/`ApplicationService` per-request path) and the `platform` bucket (API-managed,
config-equivalent, merged into `Config` by `MergedConfigStore`, served by `ConfigResourceController`,
which still delegates PUT/DELETE business logic — secret encryption, function lifecycle — into
`ApplicationService`). Every other migrated entity (models, interceptors, roles, keys, routes) exists
**only** in `platform`.

The frontend mirrors that asymmetry structurally, but only halfway:

- `Assets ▸ Applications` (`/assets-applications`) is one `BaseAssetList` instance rooted at `public/`
  — hierarchical tree, full action set, versioning.
- The six platform-only entities each got their **own** route (`/platform-keys`, `/platform-models`, …)
  and their own `Assets/Platform/<Entity>/` component folder, each a separate `BaseAssetList` instance
  rooted at `platform/`, flagged `isFlatPlatformView` so the tree/versioning/most actions are suppressed.

Applications don't fit either shape cleanly: they need `public/`'s tree+versioning behavior **and**
`platform/`'s flat behavior, in the **same grid**, because the user experience should be "one Apps list,
platform bucket shown above public" — not a second, separate Apps page.

Every root-fetch and action-labeling function in the codebase is currently keyed by `ApplicationRoute`
(one view → one root → one action set): `getRootFolder`, `isFlatPlatformView`,
`AssetFolderContextMap`/`GetAssetActionMap`/`CreateAssetActionMap`/`BulkDeleteAssetActionMap` in
`BaseAssetList/utils.tsx`, and `getGridActionLabels`/`getTreeActionLabels`/`getToolbarOptionLabels`/
`getBulkActionsToolbarOptions` in `Assets/utils.ts` / `Common/FileManager/utils.ts`. None of these
currently vary within a single view.

Confirmed with the user: multi-select in `DialFileManager` is already scoped to one folder — a
selection can never span two folders, so it can never span two buckets either. The "mixed bulk-action"
question raised during exploration doesn't need a design decision; the existing selection model already
prevents the case.

## Goals

- Show `platform/` as a bucket above `public/` in the existing `Assets ▸ Applications` grid, with no
  new menu entry and no new top-level list route.
- Let a platform-bucket application row get the same restricted action set the other six flat platform
  views already use (duplicate, delete, openInNewTab; no folder ops, no versioning, no publish), while
  every `public/`-bucket row and the folder tree keep their current full behavior, unchanged.
- Add server actions and a detail view for platform-bucket applications, following the Keys precedent
  (flat config entity, direct-to-Core, `EntityJsonEditor` toggle) rather than reusing the public Apps
  detail view (which carries versioning/publish tabs that don't apply here).
- Land this without changing the single-root behavior of any other view (Prompts, Toolsets,
  Conversations, Skills, or the six existing flat platform views) and without any `ai-dial-core` change.

## Non-Goals

- Toolsets. Core allows the identical `public`/`platform` duality for `toolsets`, but the user scoped
  this change to applications only; toolsets can follow the same pattern as a separate change once this
  one is validated.
- Folders or versioning inside the `platform` bucket for applications. Confirmed flat, matching every
  other platform entity and `ConfigResourceController`'s key-based (non-folder) storage model.
- Any change to `ai-dial-core`. `platform/applications/{path}` is already routed to
  `ConfigResourceController` ahead of the generic `RESOURCE` route (see `PLATFORM_APP_TOOLSET_RESOURCE`
  route template) — this change only adds a frontend consumer for an endpoint that already exists.
- Mixed-bucket bulk actions. Not reachable: selection is already scoped to one folder.

## Decisions

### D1 — Apps fetches two roots; every other view keeps fetching one

`getRootFolder(view)` returns a single string today. Rather than generalizing every view to a
multi-root shape, add a narrow, Apps-specific path: `AppsFolderContext`'s `fetchFiles`-driving mount
effect (currently in `FileManager.tsx`, gated by `getRootFolder(view)`) fetches **both** `platform/`
and `public/` when `view === ApplicationRoute.AssetsApplications`, and merges them into the same
`files` state — which already supports two independent subtrees, since `fetchedFoldersData` and
`expandedFolders` are keyed by path string, and `platform/` and `public/` are already distinct keys.

Rejected alternative: generalize `createFolderContext`/`getRootFolder` to always take a root **list**.
This would touch all nine existing single-root views for a shape only Apps needs, and none of the six
flat platform views have a second bucket to gain from it.

Ordering (`platform` above `public`) is a merge-order concern in this same mount effect / merge helper
— append `platform`'s top-level node before `public`'s when constructing the initial `files` array, not
a sort applied after the fact (so it survives refetches/toggles without re-sorting every render).

### D2 — Action-label functions gain a current-path parameter, only exercised by the Apps view

Confirmed against the ui-kit: `GridOptions.actionLabels`/`BulkActionsToolbarOptions.actionLabels`/
`ToolbarOptions.newActions` are each a single static map for the whole `DialFileManager` render —
there is no per-row action-availability callback. Bucket-aware restriction is still possible without
one, because the platform bucket is flat (D4/Non-Goals) and public is hierarchical: the grid is never
showing platform rows and public rows at the same time. Browsing into `platform/` renders only
platform's flat row set; browsing into any `public/...` path renders the public tree. So "bucket" is a
property of the **current path being browsed**, exactly like every other per-view decision already
made in `FileManager.tsx`, not a per-row concern.

`getGridActionLabels`, `getTreeActionLabels`, `getToolbarOptionLabels`, `getBulkActionsToolbarOptions`
add an optional current-path parameter. For every existing view this parameter is unused (single fixed
bucket, as today). For `AssetsApplications`, the caller passes the context's current `filePath`, and
the functions return the flat-platform action set when that path is `platform/`-prefixed (matching the
existing `isFlatPlatformView` output verbatim) and the current full set otherwise. `FileManager.tsx`'s
`gridOptions`/toolbar/bulk memoization already depends on `view`; add `filePath` (or its bucket prefix)
to those dependency arrays so the memo recomputes when the user navigates between buckets.

Rejected alternative: treat platform-bucket applications as a second `ApplicationRoute` (e.g.
`PlatformApplications`) reusing the existing view-keyed branching untouched. Rejected because the user
explicitly wants **one grid**, not two lists behind one route — a second route would mean a second
`BaseAssetList` mount, defeating the "platform above public in the same grid" requirement.

### D3 — Platform-bucket application writes reuse `createApp`/`updateApp`'s existing conditional path

`createApp`/`updateApp` already call `getVersionedName(name, version)`, which is a no-op when `version`
is omitted. Platform-bucket writes simply never set `version` and never compute a `folderId`-prefixed
path (Core has no folder concept for this bucket) — the existing versioned-path branch is already
conditional on `version` being present, so this is a difference in what the platform-write server
action passes in, not a new branch inside `createApp`/`updateApp` themselves. New platform-specific
server actions (`getPlatformApplication`, `createPlatformApplication`, `updatePlatformApplication`,
`removePlatformApplication`, `bulkDeletePlatformApplications`) live alongside the existing `public` ones in
`assets-applications/actions.ts` (or a sibling file if the existing file would grow unwieldy — final
call at implementation time), following `platform-keys/actions.ts`'s pattern: call `assetApi` directly
with `ResourceType.APPLICATION` and a `platform/`-prefixed path, strip fields Core's typed entity
doesn't declare.

Whether the platform-bucket payload needs its own `toPlatformAppPayload` (stripping fields the way
`toKeyPayload` does for `Key.class`) depends on how much of `DialApplicationResource`'s shape
`ConfigResourceController`'s `Application`-typed write path accepts for the `platform` bucket — this
needs confirming against Core's `Application` entity class during implementation; assumed yes, mirrored
on `toKeyPayload`, until proven otherwise.

### D4 — `Assets/Platform/Applications/View.tsx` reuses the public Apps' `TabsContent`/tab
components directly; only the header chrome and server actions are new

Verified against `ai-dial-core` (`Application.java`, `ConfigResourceController.handleAppOrToolSetPut`,
`ApplicationService.prepareApplication`): a platform-bucket application has full field/tab parity with
a public-bucket one — MCP, Parameters, Features, external services, schema-rich apps, `userRoles`
(which public-bucket apps have *stripped*, so platform is actually a superset there) all work
identically. The only two real differences are structural, not field-level: no versioning/folders
(already known), and `function`/code-runtime apps are rejected outright for the platform bucket
(`ApplicationService.java`: `"Function-type applications are not supported in the platform bucket"`).

Given that parity, `Assets/Platform/Applications/View.tsx` reuses
`Applications/View/TabsContent` — the same component the public Apps view uses — passing
`view={ApplicationRoute.AssetsApplications}` through it. That value selects the asset-shaped
`DialApplicationResource` branch those components already have (vs. the admin-BE config-entity shape),
which holds regardless of which bucket the resource is actually in. No new `TabsContent`/`Properties`
components were written — only a new `View.tsx` wrapper (`SimpleEntityHeader` instead of the public
view's versioning-aware `AssetHeader`; `updatePlatformApplication`/`removePlatformApplication` instead
of `updateApp`/`removeApp`; no move/version logic) and the new detail route/page.

**Known accepted gap**: `ApplicationAssetProperties`'s `ResourceSourceField` (reused unmodified) can
still offer the "Code" source option when `codeAppEditorUrl` is configured, and a `FilePath` folder-move
control that has no effect for a bucket with no folders. Neither was gated off for platform bucket in
this change — doing so cleanly needs a new prop threaded through `ApplicationAssetProperties` →
`ResourceSourceField`, which is real but separable follow-up scope. Picking "Code" and saving fails
loudly with Core's own 400 (surfaced through the existing error-notification path, not a silent
failure); setting a folder path is silently ignored by `updatePlatformApplication`'s bucket pin. Neither
corrupts data.

**Revised after first review**: the component folder is `Assets/Platform/Applications/` (not
`PlatformApplications`) and the toolbar's create action reads "Application" (not "Platform
Application") — the user found the fuller naming added no clarity in the UI/directory tree once the
feature was visible end to end, so both were simplified back down to match the public `Apps`
naming exactly. Only the exported component name (`PlatformApplicationView`) and the server
actions/`isPlatformApplicationsBucket` helper — which must stay distinct from their public
counterparts — keep the fuller spelling.

### D5 — Detail route is the existing `/assets-applications/[id]` route, not a new nested one

**Revised after first review.** The original plan nested a nominally distinct
`/assets-applications/platform-applications/[id]` route under the existing one, reasoning that
platform applications have no list route of their own to pair a detail route with. Trying it end to
end surfaced two problems: (1) it needlessly duplicated the public detail page's entire data-fetch
(models/applications/schemes/interceptors) into a second `page.tsx`, and (2) the extra path segment
broke `Breadcrumbs.getBreadcrumbs` — `breadcrumbConfig[AssetsApplications].segments` has exactly two
entries (list, id), and a three-segment pathname indexed a `configSegment` that doesn't exist,
throwing `Cannot read properties of undefined (reading 'i18nKey')` and crashing the page inside its
error boundary.

The fix: **both buckets share the single existing `/assets-applications/[id]/page.tsx`**, which
already told them apart structurally without any new signal — the public branch always passes a
`?path=` query param (needed to locate a versioned, folder-nested resource); the platform branch
never has one (flat, identified by name alone). `page.tsx` now branches on whether `searchParams.path`
is present: absent → build `platform/{id}` and fetch via `getPlatformApplication`, rendering
`PlatformApplicationView`; present → the original `getApp` flow, rendering the public `AppView`
unchanged. This also resolves the breadcrumbs crash for free — the pathname is back to the two
segments the existing config already handles, exactly like every other `/assets-applications/[id]`
visit before this change.

`getEntityPath`'s `AssetsApplications` case (`utils/open-in-new-tab.ts`) was updated to match: a
platform-bucket entity now resolves to the bare `{encodedName}` segment (matching
`PlatformModels`/etc.'s shape) with no `platform-applications/` prefix and no `?path=` — landing on
this same shared route.

## Risks / Trade-offs

- **[Risk]** Branching four action-label functions on a bucket parameter that's unused everywhere else
  adds a parameter every existing call site must pass (even if `undefined`), a small but real diff
  surface across `Assets/utils.ts`, `Common/FileManager/utils.ts`, and their tests.
  → **Mitigation**: make the new parameter optional and default every existing view's behavior
  unchanged when omitted; add tests only for the new Apps-view branch, not full re-tests of the other
  nine views.
- **[Risk]** Merging two fetches into one `files` array on mount changes `AppsFolderContext`'s
  fetch-on-mount effect from one `fetchFiles` call to two, with two independent loading states to
  reconcile into the single `isFetchingFiles` flag the UI reads.
  → **Mitigation**: gate the merged `isFetchingFiles` on "either fetch in flight", matching how a user
  would expect the grid's loading indicator to behave (loading until both roots have data).
- **[Risk]** `ApplicationAssetProperties`'s reused `ResourceSourceField` still offers the "Code" source
  option, which doesn't apply to the platform bucket (D4's Known accepted gap — narrowed after first
  review, see below).
  → **Mitigation**: Core rejects a "Code" source save for the platform bucket with its own 400,
  surfaced through the existing error-notification path — not silent. Gating this control off
  properly needs a new prop threaded through `ApplicationAssetProperties` → `ResourceSourceField`,
  left as separable follow-up scope rather than blocking this change.

**Revised after first review — three real bugs found testing end to end, all fixed:**
- The `FilePath` folder-move control (the other half of D4's original "Known accepted gap") is no
  longer just documented as inert — `Assets/Apps/Properties.tsx` now hides it outright for a
  platform-bucket asset (`isPlatformBucketPath(asset.folderId)`), since a bucket with no folders has
  nothing to move into.
- **Real bug, not just a gap**: `createApp`/`updateApp` never stripped `status`/`validationWarnings`/
  `author`/`createdAt`/`updatedAt`/`reference` — fields the merge reader adds that aren't part of
  Core's `Application` entity. That's tolerated by the public bucket's generic `ResourceController`
  write path, but `ConfigResourceController` (the platform bucket's write path) deserializes strictly
  (`FAIL_ON_UNKNOWN_PROPERTIES`, the same reason `platform-keys/actions.ts` already has
  `toKeyPayload`) and rejected every platform-bucket save with "Failed to parse entity". Added
  `toPlatformApplicationPayload` in `assets-applications/actions.ts`, applied in
  `createPlatformApplication`/`updatePlatformApplication` before their existing `createApp`/`updateApp`
  delegation — the exact fallback this design already flagged as provisional (D3).
- The generic `CreateEntity` create modal (reused for both buckets) always defaulted and required a
  `version` field for `AssetsApplications`, regardless of bucket. `CreateEntity` now derives
  `isPlatformApplicationCreate` from the current folder (`folderContext.filePath`, the same
  bucket-detection signal used everywhere else in this change) and skips seeding/requiring `version`
  when creating into the platform bucket; `AssetProperties`' `VersionControl` is hidden via a new
  `hideVersionField` prop threaded through `Properties` → `AssetProperties`.
- `BaseAssetList/utils.tsx`'s `getGridColumns` gained the same current-path bucket check the action-
  label functions already use (D2), so a platform-bucket application row gets the flat Name/Author/
  Created/Updated column set every other platform entity uses, instead of the public bucket's
  Name/Version/Author/Updated set.

## Open Questions

None outstanding. Resolved during apply:
- Field/tab parity (D3/D4) confirmed against `ai-dial-core`'s `Application.java`,
  `ConfigResourceController`, and `ApplicationService` — full parity except `function`-type apps
  (rejected for platform) and versioning/folders (structurally absent). No `toPlatformApplicationPayload`
  stripping helper was needed; `createApp`/`updateApp` are reused as-is (see D3).
- `Assets/Platform/Applications/Properties.tsx` was not written — `TabsContent`/`Properties` are
  reused directly from the public Apps view per D4; only `View.tsx` (header chrome + server actions)
  is new.
- Detail route (D5): both buckets share the existing `/assets-applications/[id]` route, told apart by
  whether the `?path=` query param is present, not a new nested route — see D5 for why the original
  nested-route plan was reverted (it broke breadcrumbs and duplicated the data-fetch).
- Naming (D4): the component folder is `Assets/Platform/Applications/` and the toolbar action reads
  "Application", matching the public naming exactly — the initial `PlatformApplications`/"Platform
  Application" spelling was reverted after first review found it added no clarity once visible in the
  UI/directory tree. Only symbols that must stay distinct from their public counterparts
  (`PlatformApplicationView`, the `*PlatformApplication*` server actions,
  `isPlatformApplicationsBucket`) keep the fuller spelling.
