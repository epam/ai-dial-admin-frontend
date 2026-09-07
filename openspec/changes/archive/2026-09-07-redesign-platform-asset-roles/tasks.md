## 1. Availability semantics and shared utilities

- [x] 1.1 In `src/components/EntityView/Roles/utils.ts`, add an array-shaped availability predicate
      (e.g. `isAssetUnavailable(userRoles: string[] | null | undefined): boolean`) implementing the
      three-state rule: `[]` → unavailable, populated array → restricted, `undefined`/`null` →
      available to all. Keep it separate from the existing `roleLimits`/`isPublic`-based
      `isDisableRole`, which stays untouched for config entities.
- [x] 1.2 In the same file, fix `getNoAvailableTitle` to branch explicitly on
      `ApplicationRoute.AssetsApplications` (returning `RolesI18nKey.NotAvailableApplication`)
      instead of falling through to the ToolSet wording.
- [x] 1.3 Add unit tests for `isAssetUnavailable` (empty array / populated array / `undefined` /
      `null`) and for the `getNoAvailableTitle` fix (`AssetsApplications` now returns the
      application-specific key) in `utils.ts`'s existing test file.

## 2. Redesign `AssetRoles`

- [x] 2.1 In `src/components/EntityView/Roles/AssetRoles.tsx`, add a header row with a title and a
      live count of granted roles, matching `RolesGrid`'s `<h1>{t(Roles)}: {count}</h1>` pattern.
- [x] 2.2 Add a "Make available to specific roles" `DialSwitch`, checked when `Array.isArray(userRoles)`.
      Wire its `onChange` to the toggle semantics from design.md: turning on sets `userRoles` (or
      `user_roles`, per the adapter contract already used by each caller) to `[]`; turning off sets
      it to `undefined`.
- [x] 2.3 Restyle the Add-role button from `DialNeutralButton` to `DialPrimaryButton`, matching
      `RolesGrid`.
- [x] 2.4 Change the roles grid's empty state from `getNoAvailableTitle(view)` to
      `EntitiesI18nKey.NoRoles` ("No Roles"), via `GridView`'s `emptyDataProps`, matching
      `RolesGrid`.
- [x] 2.5 Add a bottom `DialNotification` (info variant) shown only when
      `isAssetUnavailable(userRoles)` is true, using `getNoAvailableTitle(view)` for its message —
      mirroring `EntityRoles`'s own bottom notification instead of folding the message into the
      grid's empty state.
- [x] 2.6 Update or add component tests for `AssetRoles` covering: counter updates on
      add/remove, toggle on/off writing the correct `userRoles` value, Add button uses
      `DialPrimaryButton`, empty grid shows "No Roles", notification shown only when `userRoles` is
      `[]` and hidden when `undefined`/`null`/populated, and read-only-admin renders roles without
      add/remove controls.

## 3. Create-time defaults

- [x] 3.1 In `src/components/EntityListView/CreateEntity/CreateEntity.tsx`, add `userRoles: []` to
      the existing `ApplicationRoute.PlatformModels` initializer branch.
- [x] 3.2 Add a new initializer branch for `ApplicationRoute.PlatformRoutes` setting `userRoles: []`.
- [x] 3.3 Add a new initializer branch, guarded by
      `isPlatformDualBucketCreate && (route === ApplicationRoute.AssetsApplications || route === ApplicationRoute.AssetsToolsets)`,
      setting `user_roles: []`. Leave the admin-BE (non-dual-bucket) Applications/Toolsets create
      paths untouched.
- [x] 3.4 Add unit tests for `CreateEntity`'s initializer covering: a new platform model/route
      starts with `userRoles: []`; a new platform-bucket application/toolset starts with
      `user_roles: []`; a new admin-BE (public-bucket) application/toolset is unaffected.

## 4. Quality gate

- [x] 4.1 Run `npm run lint`, `npm run format`, and `npm run test` (from `apps/ai-dial-admin/`) and
      fix any failures.
