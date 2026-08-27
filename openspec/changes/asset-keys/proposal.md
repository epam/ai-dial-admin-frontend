## Why

Keys are the last remaining entity in the "Access Management" section that has not been migrated to
the Core-direct asset surface. All other platform-bucket resource types (models, app runners,
interceptors, routes, roles) already have asset counterparts using `AssetApi` and the
`BaseAssetList` file-manager pattern. Migrating Keys completes the pattern and brings Keys in line
with the folder-aware, etag-gated, bulk-deletable asset surface every other config resource type
already has.

## What Changes

- Add a new **Assets > Keys** menu item (after Roles) in the Assets section, gated with
  `isPreview: true`.
- Introduce `ApplicationRoute.AssetsKeys` (`/assets-keys`) with list and detail pages.
- Create a `DialKeyResource` model for the Core-direct representation (flat platform-bucket
  resource, same tier as `DialRoleResource`).
- Add `PROJECT_KEY` to the frontend `ResourceType` enum.
- Wire `BaseAssetList` infrastructure: folder context, action maps, flat-platform-view registration.
- Build `components/Assets/Keys/` with List, View, Properties, TabsContent, and a Roles tab that
  edits the Key's `roles` field (the roles this key grants to its bearer).
- Key rotation remains functional — Core supports rotation via PUT with a new `key` value.
- Key secret (`key` field) is write-only in Core; the UI shows the generated value only at
  creation time and never displays it in the properties view afterwards.
- Drop `expiresAt`, `keyGeneratedAt`, `projectContactPoint` — these are admin-backend constructs
  not present in Core's `Key.class`.
- Drop the Core-key dual-format toggle (`ExportFormat.CORE`) — the JSON editor uses the standard
  `JsonConfiguration` without a format switcher.
- The existing `/keys` route under Access Management stays unchanged.

## Non-goals

- Modifying or removing the existing `/keys` (old-style) route.
- Adding folder support for Keys (Core stores them in the flat `platform` bucket only).
- Editing role limits from the Key view (limits live on the Role resource, not on Key).
- Import/export/move operations (Keys is not a `CrudAssetRoute`; it's a flat platform view like
  Models, Interceptors, Routes, Roles).

## Capabilities

### New Capabilities
- `assets-keys`: Core-direct asset surface for Keys — listing, detail view, create, update, delete,
  bulk delete, key rotation, roles assignment, and IP address range restrictions.

### Modified Capabilities

(none)

## Impact

- **Routes**: New `ApplicationRoute.AssetsKeys`, new `app/[lang]/assets-keys/` directory.
- **Menu**: One new entry in the Assets group in `menu-configuration.tsx`.
- **ResourceType enum**: New `PROJECT_KEY` entry.
- **BaseAssetList wiring**: New entries in `AssetFolderContextMap`, `GetAssetActionMap`,
  `CreateAssetActionMap`, `BulkDeleteAssetActionMap` in `BaseAssetList/utils.tsx` and
  `BaseAssetList/types.ts`.
- **Flat platform views**: `root-folder.ts` gains `ApplicationRoute.AssetsKeys`.
- **Context**: New `KeysFolderContext.tsx`.
- **Models**: New `DialKeyResource` interface in `models/dial/resource.ts`.
- **i18n**: New `MenuI18nKey.AssetsKeys` and `FileManagerI18nKey` entries.
- **Shared components**: Reuses `AssetRoles`-style pattern but with a custom roles editor for
  the `roles` field (not `userRoles`).
