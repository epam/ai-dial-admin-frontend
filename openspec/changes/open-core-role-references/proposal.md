## Why

A role referenced from a Core-direct Roles tab is stored by name, so a user cannot tell whether it comes from a platform resource or a configuration file. Catalog Keys currently offers no way to open that role in a new tab ([issue #4381](https://github.com/epam/ai-dial-admin-frontend/issues/4381)), and other Core-direct role grids have similar gaps.

## What Changes

- Offer **Open in a new tab** for role rows across Core-direct Roles tabs, including keys, models, routes, routers, applications, toolsets, and Core-backed embedded application routes. Keep the action available in read-only views and preserve existing mutation permissions. A referenced role remains openable even when its origin was not returned with the row.
- Open the unqualified `/platform-roles/{name}` detail URL for a Core role reference. Resolve the platform role first and, only when it is confirmed absent, resolve the configuration-file role. This matches Core's platform-first precedence when both populations contain the same name.
- Render a resolved configuration-file role read-only using the existing role view's source-aware behavior, without redirecting the unqualified reference URL. Preserve `configFile=true` as an explicit file-source override for file-root navigation, including when a same-name platform role exists.
- Treat a role as not found only when the applicable source reads establish that it is absent. Surface access, service, and indeterminate lookup failures rather than silently falling back to a different role or presenting them as absence.
- Preserve the legacy admin-backend Roles tabs and their existing `/roles` navigation. Shared embedded-route components must distinguish Core-backed references from legacy ones.

## Capabilities

### New Capabilities

- `core-role-reference-navigation`: Opening Core role references from role grids, including read-only and missing-origin rows, with source resolution and error behavior shared across those grids.

### Modified Capabilities

- `platform-roles`: Resolve an unqualified role detail URL platform-first, with a read-only configuration-file fallback and explicit file-source override.
- `platform-keys`: Offer role-detail navigation from the key's Roles tab.
- `platform-models`: Offer role-detail navigation from the model's Roles tab.
- `platform-routes`: Offer role-detail navigation from the route's Roles tab.
- `platform-routers`: Offer role-detail navigation from the router's Roles tab.
- `platform-applications`: Offer role-detail navigation from Core-backed application Roles and embedded route-role grids.
- `platform-toolsets`: Offer role-detail navigation from the toolset's Roles tab.
- `platform-app-runners`: Offer role-detail navigation from Core-backed embedded route-role grids.

## Non-goals

- Changing how role membership is stored, how Core resolves duplicate names, or how the role picker merges its populations.
- Changing admin-backend role storage, detail routes, or navigation.
- Adding role editing or other write operations for configuration-file roles.
- Extending file-source fallback to other entity types.

## Impact

The change affects the Core-direct role grids (`KeyRoles`, `AssetRoles`, and shared embedded route-role components), role URL construction, and `platform-roles/[id]/page.tsx` with its role actions and Core clients. The existing role detail view and file-root URLs are reused. Platform-role lookup must distinguish a confirmed missing resource from authorization, service, and metadata failures; the existing merged asset lookup does not preserve the status of every metadata failure. Core's resource and config-file read APIs are reused; no backend API or dependency change is anticipated. The role-detail and affected role-tab specs must be updated alongside the implementation; the existing explicit file-source contract remains unchanged.
