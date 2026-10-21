## Why

`ai-dial-core` already lets `applications` live in a `platform` bucket — API-managed, config-equivalent
applications served through `ConfigResourceController`, exactly the duality it already gives the other
migrated entities (models, interceptors, roles, keys, routes) for the `platform` bucket alone, except
applications (like toolsets) are also legal in `public`. The admin frontend has no way to reach
`platform/applications/*` yet: `Assets ▸ Applications` only ever opens the `public/` root, and every
`Assets/Platform/<Entity>` precedent (Models, App Runners, Interceptors, Routes, Roles, Keys) is a
separate flat list at its own `/platform-*` route with no folder tree — a shape that doesn't fit
Applications, whose list is a single grid mixing a hierarchical, versioned `public/` tree with a flat,
unversioned `platform/` set.

## What Changes

- Add a `platform` bucket to the existing `Assets ▸ Applications` grid (`/assets-applications`),
  fetched and shown as a top-level sibling of `public`, ordered above it. No new menu entry and no new
  list route — this is the same `BaseAssetList` instance the public applications list already uses.
- Generalize the Apps folder-fetch path (`AppsFolderContext`/`FileManager` mount logic /
  `getRootFolder`) from "one root per view" to "Apps fetches both `platform/` and `public/`", without
  changing the single-root behavior of every other view (Prompts, Toolsets, Conversations, Skills, and
  the six existing flat platform views).
- Make the Apps action surface (row actions, folder-tree actions, toolbar "New" menu, bulk-actions
  toolbar) branch on which bucket a row/folder belongs to, not only on view: platform-bucket application
  rows get the same restricted action set as the other flat platform entities (duplicate, delete,
  openInNewTab; no folders, no versioning, no publish); public-bucket rows and the folder tree keep
  their current full action set unchanged.
- Add `createPlatformApp`/read/update/delete/bulk-delete server actions for `platform/applications/*`,
  parallel to `platform-keys/actions.ts`'s direct-Core pattern, reusing `ResourceType.APPLICATION` and
  the existing `assetApi` client — Core already routes the `platform` bucket segment to
  `ConfigResourceController` ahead of the generic applications route, so no Core change is required.
  Platform application writes omit `version`/folder placement (Core has no folder concept for this
  bucket), unlike the public path's versioned, folder-aware write.
- Add `src/components/Assets/Platform/Apps/` (`View.tsx`, `TabsContent.tsx`, `Properties.tsx`, create
  modal) as the detail view for a platform-bucket application row — mirrors the Keys/Models precedent
  (flat entity, `EntityJsonEditor` toggle) rather than reusing the public Apps `View.tsx` (which carries
  versioning/publish tabs that don't apply to the platform bucket). Add its detail route nested under
  the existing Apps route (final path TBD in design.md) since there is no separate platform list route
  to host it under.
- **BREAKING**: none — this only adds a new bucket and new detail route; existing `/assets-applications`
  behavior for `public/` is unchanged.

## Capabilities

### New Capabilities

- `platform-applications`: platform-bucket applications — server actions, detail view/components under
  `Assets/Platform/Apps/`, and the bucket-aware action-label branching needed for a platform-bucket
  application row inside the existing Apps grid.

### Modified Capabilities

- `application-resources-core-api`: the existing spec assumes a single `public/`-bucket contract for
  `getApps`/`createApp`/`getApp`/`updateApp`/`removeApp`/`bulkDeleteApps`; this change adds the
  platform-bucket variant of list/get/create/update/delete/bulk-delete alongside it, and states that
  platform-bucket writes never carry a version suffix or folder placement.

## Impact

- `src/utils/files/root-folder.ts`, `src/context/assets/AssetsFolderContext.tsx` (or a new
  `AppsFolderContext`-specific extension), `src/components/Common/FileManager/FileManager.tsx` — root-fetch
  generalization, scoped to the Apps view only.
- `src/components/Assets/utils.ts`, `src/components/Assets/constants.ts`,
  `src/components/Assets/BaseAssetList/utils.tsx` — bucket-aware action-label branching for the Apps view.
- `src/app/[lang]/assets-applications/actions.ts` (or a new sibling actions file for the platform
  variant), `src/models/dial/resource.ts` (a `DialApplicationResource`-shaped platform type, added to the
  `PlatformAsset` union).
- New: `src/components/Assets/Platform/Apps/**`, a new detail route and page under the App Router.
- No backend change — `ai-dial-core` already serves `platform/applications/{path}` through
  `ConfigResourceController`.
