## Why

`ai-dial-core` lets `toolsets` live in a `platform` bucket — API-managed, config-equivalent toolsets
served through `ConfigResourceController`, the exact duality already given to `applications` (see
archived change `add-platform-applications`) and to the six platform-only entities. The admin
frontend has no way to reach `platform/toolsets/*` yet: `Assets ▸ Toolsets` (`/assets-toolsets`) only
ever opens the `public/` root. Applications already validated the pattern for a dual-bucket asset
list; this change applies the same pattern to Toolsets, which the Applications change explicitly
deferred ("toolsets can follow the same pattern as a separate change once this one is validated").

## What Changes

- Add a `platform` bucket to the existing `Assets ▸ Toolsets` grid (`/assets-toolsets`), fetched and
  shown as a top-level sibling of `public`, ordered above it — same `BaseAssetList` instance, no new
  menu entry, no new list route. `getRootFolders` (already generalized past a single Apps-specific
  case) gains `AssetsToolsets` as a second dual-bucket view.
- **Generalize the bucket-detection and action-label helpers from Applications-only to any dual-bucket
  view**: `isPlatformApplicationsBucket` is renamed/reshaped into a view-agnostic helper (e.g.
  `isPlatformAssetBucket`) checked against a small `DUAL_BUCKET_VIEWS` set containing both
  `AssetsApplications` and `AssetsToolsets`, rather than adding a second Toolsets-specific copy of the
  same branch. `getGridActionLabels`, `getTreeActionLabels`, `getToolbarOptionLabels`, and
  `getGridColumns` switch on that shared helper.
- Make the Toolsets action surface (row actions, folder-tree actions, toolbar "New" menu, bulk-actions
  toolbar) branch on bucket exactly as Applications' does: platform-bucket toolset rows get the
  restricted action set (duplicate, delete, openInNewTab; no folders, no versioning, no publish);
  public-bucket rows and the folder tree keep their current full action set unchanged.
- Add `getPlatformToolset`/`createPlatformToolset`/`updatePlatformToolset`/`removePlatformToolset`/
  `bulkDeletePlatformToolsets` server actions for `platform/toolsets/*`, parallel to
  `assets-applications/actions.ts`'s platform functions and `platform-keys/actions.ts`'s direct-Core
  pattern, reusing `ResourceType.TOOLSET` and the existing `assetApi` client — Core already routes the
  `platform` bucket segment for toolsets to `ConfigResourceController` ahead of the generic toolsets
  route, so no Core change is required. Platform toolset writes omit `version`/folder placement, like
  platform applications.
- Add `src/components/Assets/Platform/Toolsets/` (`View.tsx` + create modal) as the detail view for a
  platform-bucket toolset row — mirrors the `Assets/Platform/Applications/` precedent: reuse the
  existing `Assets/Toolsets/View/TabsContent` (Properties, Tools, Audit) and `ResourceAuthButtons`
  (sign-in/out) unmodified, since Core's `ToolSetService` derives auth-secret encryption and
  credential-locator scope from the resource's own bucket already — no platform-specific auth
  behavior to special-case. Only the header chrome (`SimpleEntityHeader` instead of the versioning-aware
  `AssetHeader`) and the platform server actions are new.
- Add its detail route nested under the existing `/assets-toolsets/[id]` route, told apart from the
  public route by the same `?path=` presence/absence signal Applications uses (present → public
  bucket; absent → platform bucket) — not a new route.
- Strip fields the merge reader adds but that aren't part of Core's `ToolSet` entity (`status`,
  `validationWarnings`, `author`, `createdAt`, `updatedAt`, `reference`) before a platform toolset
  write, mirroring `toPlatformApplicationPayload`.
- Surface Core's toolset-name key-pattern rejection (`ConfigPostProcessor.isValidToolSetKey` — stricter
  than the generic entity-name pattern applications use) through the existing error-notification path,
  the same way the Applications change let Core's own 400s surface for its accepted gaps — no new
  client-side name validation added.
- **BREAKING**: none — this only adds a new bucket and new detail route; existing `/assets-toolsets`
  behavior for `public/` is unchanged.

## Capabilities

### New Capabilities

- `platform-toolsets`: platform-bucket toolsets — server actions, detail view/components under
  `Assets/Platform/Toolsets/`, and the (now view-agnostic) bucket-aware action-label branching applied
  to the Toolsets view.

### Modified Capabilities

- `toolset-resources-core-api`: the existing spec assumes a single `public/`-bucket contract for
  `getToolsets`/`createToolset`/`getToolset`/`updateToolset`/`removeToolset`/`bulkDeleteToolsets`; this
  change adds the platform-bucket variant of list/get/create/update/delete/bulk-delete alongside it,
  and states that platform-bucket writes never carry a version suffix or folder placement.

Note: `isPlatformApplicationsBucket` being generalized into a view-agnostic helper (design.md D2) is
an implementation detail, not a requirement change — `platform-applications`'s spec never names the
helper, so it needs no delta here.

## Impact

- `src/utils/files/root-folder.ts` — `getRootFolders` gains `AssetsToolsets` as a second dual-bucket
  view.
- `src/components/Assets/utils.ts` — `isPlatformApplicationsBucket` generalized to a view-agnostic
  helper; `getGridActionLabels`/`getTreeActionLabels`/`getToolbarOptionLabels` gain a Toolsets branch
  keyed off that helper instead of a second copy of the Applications branch.
- `src/components/Assets/BaseAssetList/utils.tsx` — `getGridColumns`'s bucket check generalized the
  same way; `AssetFolderContextMap`/`GetAssetActionMap`/`CreateAssetActionMap`/
  `BulkDeleteAssetActionMap` gain platform-toolset entries.
- `src/components/EntityListView/CreateEntity/CreateEntity.tsx` — `isPlatformApplicationCreate`
  generalized to cover Toolsets (no version field when creating into either view's platform bucket).
- `src/components/Assets/Toolsets/View/Properties.tsx` — hide the `FilePath` folder-move control for a
  platform-bucket toolset, mirroring `Assets/Apps/Properties.tsx`.
- `src/app/[lang]/assets-toolsets/actions.ts` — new platform server actions; `src/models/dial/resource.ts`
  (a `DialPlatformToolsetResource`-shaped type, added to the `PlatformAsset` union).
- New: `src/components/Assets/Platform/Toolsets/**`, a new detail route nested under
  `/assets-toolsets/[id]`.
- No backend change — `ai-dial-core` already serves `platform/toolsets/{path}` through
  `ConfigResourceController`.
