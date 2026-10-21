## Why

`Assets > Models` and `Assets > Routes` already give admins a Roles tab that edits a Core-direct
asset's `userRoles` (see the archived `add-assets-roles` change). `Assets > Applications` and
`Assets > Toolsets`'s **platform-bucket** detail views never got the same tab — `getTabsForAsset`'s
`AssetsApplications`/`AssetsToolsets` branches list no `Roles` entry — so a platform application or
toolset has no way to grant role-based access through the UI at all (Issue #4406). Core's
`Application`/`ToolSet` classes both extend `RoleBasedEntity` and already accept `userRoles` on
write, so the gap is purely a missing UI surface.

## What Changes

- Add a `Roles` tab to the **platform-bucket** detail views for `Assets > Applications`
  (`src/components/Assets/Platform/Applications/View.tsx`) and `Assets > Toolsets`
  (`src/components/Assets/Platform/Toolsets/View.tsx`), reusing the existing generic `AssetRoles`
  component (`EntityView/Roles/AssetRoles.tsx`) the same way `Assets > Models`/`Assets > Routes`
  already do — membership-only editing of `userRoles`, no per-role limits.
- Add `user_roles?: string[]` to `DialApplicationResource` and `DialToolsetResource`
  (`models/dial/resource.ts`), the field Core's `RoleBasedEntity` base already serializes for both
  entity types but this app's models don't yet expose. Named `user_roles` (not `userRoles`, unlike
  `DialModelResource`/`DialRouteResource`) because Core's `Application`/`ToolSet` classes are
  `@JsonNaming(SnakeCaseStrategy)` — see design D2.
- Fetch the Roles tab's option population the same way `Assets > Models`/`Assets > Routes` do —
  Core's own union of API-written and configuration-file-declared roles
  (`readConfigEntities<DialRole>(..., ConfigFileEntityType.Roles)`) — rather than the admin
  backend's role list, and thread it from `assets-applications/[id]/page.tsx` /
  `assets-toolsets/[id]/page.tsx` through to the platform detail views.
- **Scoped to the platform bucket only**: the public-bucket `Assets > Applications`/`Assets >
  Toolsets` detail views (`AppView.tsx`/`ToolsetView.tsx`) share the same `getTabsForAsset` branches
  and the same `TabsContent` components as their platform counterparts, so the tab list needs a
  bucket-aware condition (not a blanket addition to the shared branch) to avoid also surfacing Roles
  on the public bucket, which is out of scope for this change.
- **BREAKING**: none. Additive UI surface; the new model fields are optional.

**Non-goals**:

- No Roles tab on the public-bucket `Assets > Applications`/`Assets > Toolsets` views. Whether that
  gap should close too is a separate decision, deliberately left to a follow-up.
- No per-role limits (`roleLimits`) editing for platform applications/toolsets — Core's
  `Application`/`ToolSet` classes carry no such field; only `userRoles` membership is in scope, same
  boundary `AssetRoles`'s own doc comment already documents for Models/Routes.
- No changes to the admin-backend-only `Applications`/`Toolsets` entity surfaces, which already have
  a working Roles tab against a different (admin-BE) data shape.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-applications`: gains a Roles tab on the platform application detail view, editing
  `userRoles` against Core's own role population.
- `platform-toolsets`: gains a Roles tab on the platform toolset detail view, editing `userRoles`
  against Core's own role population.

## Impact

- **Modified files**: `models/dial/resource.ts` (`userRoles` on `DialApplicationResource`/
  `DialToolsetResource`), `utils/tabs/utils.ts` (`getTabsForAsset`, bucket-aware `Roles` tab
  insertion for `AssetsApplications`/`AssetsToolsets`), `components/Applications/View/TabsContent.tsx`
  (branch the existing `Roles` case onto `AssetRoles` for the platform-bucket asset shape),
  `components/Assets/Toolsets/View/TabsContent.tsx` (add a `Roles` case), `components/Assets/Platform/
  Applications/View.tsx`, `components/Assets/Platform/Toolsets/View.tsx` (also gains an
  `optionWarnings` prop and the same incomplete-role-list notification `PlatformApplicationView`
  already has, so it can meet the `platform-toolsets` delta spec's degraded-read scenario),
  `app/[lang]/assets-applications/[id]/page.tsx`, `app/[lang]/assets-toolsets/[id]/page.tsx` (roles
  fetch + prop threading, following `assets-models/[id]/page.tsx`'s and `assets-routes/[id]/page.tsx`'s
  precedent).
- **No changes** to DIAL Core, the admin backend, `AppView.tsx`/`ToolsetView.tsx` (public-bucket
  views), or `Entities > Applications`/`Entities > Toolsets`.
