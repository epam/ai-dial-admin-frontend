## Why

Assets Applications (`/assets-applications`) and Assets Toolsets (`/assets-toolsets`) are dual-bucket
views: every mount, refresh, and file-picker load fetches **both** the `platform` and `public` roots
(`getRootFolders` in `src/utils/files/root-folder.ts`). When the deployment disables the `Catalog`
menu group via `DISABLE_MENU_ITEMS=...catalog...`, every `Platform*` view is already hidden from the
sidebar, but the dual-bucket views still issue a `platform` list call on every fetch — wasted requests
against a bucket the deployment has declared off-limits, and a `platform` tree node the user cannot
reach through any menu.

## What Changes

- Add a `catalogEnabled` feature flag (`FeatureFlags` in `src/models/feature-flags.ts`), computed
  server-side in `[lang]/layout.tsx` from `DISABLE_MENU_ITEMS` exactly the way `dashboardEnabled` is:
  `!process.env.DISABLE_MENU_ITEMS?.toLowerCase().includes('catalog')`. It flows to client components
  through the existing `AppContextProvider`.
- Gate the platform root in `getRootFolders(view, isPlatformBucketEnabled = true)`
  (`src/utils/files/root-folder.ts`): for the dual-bucket views, when the flag is `false` the util
  returns only `['public']`, so every caller — `FileManager`'s mount/refresh fetch, `FilePath`'s
  folder-picker fetch — stops requesting the `platform` bucket, and the single-root code paths
  (`rootPaths.length === 1`, `isMultiRootView === false`) take over unchanged.
- `FileManager.tsx` and `FilePath.tsx` pass `useAppContext().featureFlags.catalogEnabled` into
  `getRootFolders`.
- With `Catalog` disabled, the dual-bucket grids show only the `public` tree — no `platform` node, no
  platform list request.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `platform-applications`: the "Platform bucket shown above public in the Assets Applications grid"
  requirement becomes conditional — the `platform` bucket node and its list fetch are present only
  when the Catalog menu group is not disabled via `DISABLE_MENU_ITEMS`.
- `platform-toolsets`: same condition applied to the "Platform bucket shown above public in the
  Assets Toolsets grid" requirement.

## Impact

- `apps/ai-dial-admin/src/models/feature-flags.ts` — new `catalogEnabled` field (all `FeatureFlags`
  literals in tests must gain the field).
- `apps/ai-dial-admin/src/app/[lang]/layout.tsx` — compute the flag.
- `apps/ai-dial-admin/src/utils/files/root-folder.ts` + its spec — new optional parameter.
- `apps/ai-dial-admin/src/components/Common/FileManager/FileManager.tsx`,
  `apps/ai-dial-admin/src/components/Common/FilePath/FilePath.tsx` — pass the flag; both are shared
  components, but every other view already resolves to a single root, so only the two dual-bucket
  views change behavior.
- No API, server-action, or backend changes — the platform server actions
  (`getPlatformApplications`, `getPlatformToolsets`, etc.) remain; they simply stop being called for
  the root listing.

## Non-goals

- Blocking direct URL access to a platform-bucket item (`/assets-applications/<id>` without
  `?path=`): a detail-page fetch of one explicitly addressed entity stays allowed. Only the
  bucket-root listing is gated.
- Gating the six `Platform*` list views themselves — `DISABLE_MENU_ITEMS` already removes them from
  the menu; their routes are untouched.
- Renaming or repurposing the existing `DISABLE_MENU_ITEMS` menu filtering (`getActualMenuItems`).
