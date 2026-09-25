## Why

A Catalog entity with a colon in its name can be written successfully but its post-create redirect can resolve to a 404 page. The create flow does not consistently derive the created entity's identity from Core's successful response before constructing the detail URL.

## What Changes

- Make post-create navigation resolve the Core-returned resource name before producing a detail URL, including the identity stored under `_metadata`.
- Route create redirects through the shared entity URL builder so colon-containing names are encoded as one path segment.
- Preserve existing platform App Runner and Catalog Schema encoding behavior, and public-bucket Application and Toolset URL behavior.

## Non-goals

- Do not change grid rendering, disabled-row presentation, tooltips, or row-click navigation.
- Do not change name validation or the set of characters Core accepts.
- Do not change backend or DIAL Core API contracts.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `platform-models`: ensure a newly created Catalog model, including one with `:` in its name, opens its detail view through the encoded route.
- `platform-applications`: ensure platform-bucket Application creation redirects to the created detail view when its name contains `:`.
- `platform-toolsets`: ensure platform-bucket Toolset creation redirects to the created detail view when its name contains `:`.

## Impact

- Shared entity URL construction in `apps/ai-dial-admin/src/utils/open-in-new-tab.ts`.
- Shared and seeded create redirects in `apps/ai-dial-admin/src/components/EntityListView/CreateEntity/CreateEntity.tsx` and `apps/ai-dial-admin/src/components/Assets/Deployments/CreateAsset.tsx`.
- Focused unit and component tests for URL generation and post-create navigation.
