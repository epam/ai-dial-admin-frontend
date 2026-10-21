## Why

Issue #4424: the Roles tab on platform-bucket assets (Models, Routes, and platform-bucket
Applications/Toolsets) — `AssetRoles` — looks and behaves nothing like the Roles tab config
entities get (`EntityRoles`/`RolesGrid`). There's no counter, no "available to specific roles"
toggle, the Add button uses the wrong button style, and the empty grid shows the "not available"
warning as its only feedback instead of a dedicated notification. Separately, availability itself
is under-specified: nothing today defaults a newly created platform entity's `userRoles`/
`user_roles` to an explicit empty array, so a fresh entity reads as "available to everyone" by
default rather than "not available to anyone" until roles are deliberately granted.

## What Changes

- Redesign `AssetRoles` (`src/components/EntityView/Roles/AssetRoles.tsx`) to match
  `EntityRoles`/`RolesGrid`'s layout:
  - Header row with a title + live role counter, mirroring `RolesGrid`'s `<h1>{t(Roles)}: {count}</h1>`.
  - A "Make available to specific roles" `DialSwitch`, bound to whether `userRoles`/`user_roles`
    is an array (`[]` or populated) vs. `undefined`/`null` — the equivalent of `RolesGrid`'s
    `isPublic`-bound switch, but for the array-shaped membership model these surfaces use instead
    of `roleLimits`.
  - Add button restyled from `DialNeutralButton` to `DialPrimaryButton`, matching `RolesGrid`.
  - Grid empty state changed from `getNoAvailableTitle(view)` to `EntitiesI18nKey.NoRoles` ("No
    Roles"), matching `RolesGrid`'s `GridView` `emptyDataProps`.
  - A bottom `DialNotification` (info variant) carrying the "not available to any end-users"
    message, shown only when the entity is genuinely unavailable to everyone — mirroring
    `EntityRoles`' own bottom notification, rather than folding that message into the grid's empty
    state.
- Fix `getNoAvailableTitle` (`src/components/EntityView/Roles/utils.ts`) to branch on
  `ApplicationRoute.AssetsApplications` explicitly — today it falls through to the ToolSet wording
  for that view.
- Define and apply explicit availability semantics for the array-shaped `userRoles`/`user_roles`
  field, used by the new toggle and the new "not available" notification:
  - `userRoles: []` → not available to any user.
  - `userRoles: ['role', ...]` → available only to the listed roles.
  - `userRoles: undefined | null` → available to all users (unchanged from today).
- Default newly created platform-bucket Models, Routes, Applications, and Toolsets to
  `userRoles: []` / `user_roles: []` at creation time, so a fresh entity is unavailable to
  everyone until roles are explicitly granted, rather than implicitly available to everyone.

## Non-goals

- No change to config-entity (admin-BE) Roles tabs — `EntityRoles`/`RolesGrid`, `roleLimits`, or
  `isPublic` semantics are untouched; this only touches the platform/Core-direct asset surfaces
  that use `AssetRoles`.
- No per-role token limits for platform entities — `AssetRoles` remains membership-only
  (add/remove a role), matching every platform asset surface's existing scope.
- No changes to `PlatformAppRunners`, `PlatformInterceptors`, `PlatformRoles`, or `PlatformKeys` —
  their Core resource classes don't extend `RoleBasedEntity`, so they have no `userRoles` field
  and no Roles tab to redesign.
- No save-time "empty roles" confirmation popup (the `EmptyRoles`/`EntityRolesModal` equivalent
  config entities have) — not requested, and the new bottom notification already surfaces the
  "not available" state without blocking save.

## Capabilities

### Modified Capabilities

- `platform-models`: Roles tab requirement gains the redesigned layout (counter, toggle, Add
  button style, "No Roles" empty state, bottom notification) and the create-time `userRoles: []`
  default.
- `platform-routes`: same Roles tab redesign and create-time `userRoles: []` default.
- `platform-applications`: same Roles tab redesign (operating on `user_roles`) and create-time
  `user_roles: []` default, scoped to the platform-bucket detail view only.
- `platform-toolsets`: same Roles tab redesign (operating on `user_roles`) and create-time
  `user_roles: []` default, scoped to the platform-bucket detail view only.

## Impact

- `src/components/EntityView/Roles/AssetRoles.tsx` — layout/behavior rewrite.
- `src/components/EntityView/Roles/utils.ts` — `getNoAvailableTitle` gains an `AssetsApplications`
  branch; a new array-shaped availability predicate is added alongside the existing
  `roleLimits`-based `isDisableRole`.
- `src/components/EntityListView/CreateEntity/CreateEntity.tsx` — initial-entity-state branches
  extended to default `userRoles`/`user_roles` to `[]` for the four in-scope platform routes.
- Callers unaffected: `Applications/View/TabsContent.tsx`, `Assets/Toolsets/View/TabsContent.tsx`,
  `Assets/Platform/Models/TabsContent.tsx`, `Assets/Platform/Routes/TabsContent.tsx` keep their
  existing `AssetRoles` wiring and snake_case adapters unchanged — only the component's internals
  and its `view`/`asset` contract's rendering change.
- No admin-backend or DIAL Core API changes — this is purely admin-frontend read/write of the
  existing `userRoles`/`user_roles` field.
