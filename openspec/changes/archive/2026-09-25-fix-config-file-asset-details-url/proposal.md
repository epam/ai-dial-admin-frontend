## Why

Opening a config-file-sourced asset toolset's details can append a second `?` to an already query-bearing detail URL. The browser then treats `configFile=true` as part of the encoded `path` value, so the detail page does not enter its read-only config-file mode (Issue #4722).

## What Changes

- Build config-file asset detail URLs with the existing query-appending helper so `configFile=true` is a distinct query parameter.
- Apply the corrected URL construction to both asset-details navigation and the BaseAssetList action-menu new-tab path.
- Add regression coverage for versioned asset URLs that already include `?path=`.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `asset-list-rows`: Config-file asset row navigation preserves the resource path and appends the read-only marker as a separate query parameter.

## Non-goals

- Changing asset route or identity construction in `getEntityPath`.
- Changing non-config-file asset navigation.
- Changing the detail pages' interpretation of `path` or `configFile`.

## Impact

- `apps/ai-dial-admin/src/components/Assets/BaseAssetList/BaseAssetList.tsx`
- Focused BaseAssetList navigation tests.
- Reuses `appendUrlQuery` from `apps/ai-dial-admin/src/utils/open-in-new-tab.ts`; no backend API or dependency changes.
