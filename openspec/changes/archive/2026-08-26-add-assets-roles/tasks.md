## 1. Model and merger

- [x] 1.1 Add `DialRoleResource` to `models/dial/resource.ts` (`name`, `path`, `folderId`, `author`,
      `createdAt`, `updatedAt`, `limits`, `costLimit`, `share`, reusing `DialRoleLimits`/`DialRoleShare`
      from `models/dial/role-limits.ts`) — no `grantedKeys` (design D5), no `displayName`/
      `description` (`Role` has neither).
- [x] 1.2 Add `mergeRoleResource` (flat/unversioned, following `mergeRouteResource`'s
      `flatMetadataFields` shape) and register it in `ASSET_MERGERS[ResourceType.ROLE]` in
      `server/core/asset-metadata.ts`.
- [x] 1.3 Unit tests for `mergeRoleResource` and the updated `ASSET_MERGERS` map.

## 2. Server actions

- [x] 2.1 Create `app/[lang]/assets-roles/actions.ts` with `toRolePayload` (stripping `status`,
      `validationWarnings`, `path`, `folderId`, `author`, `createdAt`, `updatedAt`, `description` up
      front — design D3) and `createRole`/`getRole`/`updateRole`/`removeRole`/`bulkDeleteRoles`/
      `getRoles`, following `assets-routes/actions.ts`.
- [x] 2.2 Unit tests for `actions.ts` (`assets-roles/actions.spec.ts`), including a case that verifies
      `toRolePayload` strips every field in 2.1's list, following `assets-routes/actions.spec.ts`.

## 3. List view

- [x] 3.1 Add `ApplicationRoute.AssetsRoles` to `types/routes.ts` and a new `AssetsRoles` entry to
      `MenuI18nKey` (`constants/i18n.ts`) plus its `en.ts` label — distinct from the existing
      `Roles`/`Entities > Roles` key.
- [x] 3.2 Add the `Roles` menu item to the Assets section in `components/Menu/menu-configuration.tsx`,
      directly after `AssetsRoutes`.
- [x] 3.3 Create `context/assets/RolesFolderContext.tsx`, following `RoutesFolderContext.tsx`. Also
      wired `RolesFolderProvider` into the provider tree in `app/[lang]/layout.tsx` (the tasks list
      omitted this, but every existing asset folder context is mounted there).
- [x] 3.4 Create `components/Assets/Roles/List.tsx` on the shared `BaseAssetList` (flat, no folder
      tree, create/delete/bulk-delete, no create-folder/move), following
      `components/Assets/Routes/List.tsx`. Wiring `AssetsRoles` through the shared list/modal
      infrastructure (`BaseAssetList/utils.tsx`, `BaseAssetList/types.ts`, `Assets/utils.ts`,
      `Assets/Modals/utils.tsx`, `Common/FileManager/utils.ts`, `Breadcrumbs/constants.ts`,
      `ListView/constants.ts`, `utils/files/root-folder.ts`, `utils/is-view.ts`,
      `utils/open-in-new-tab.ts`, `utils/entities/{create,update}-entity.ts`,
      `EntityView/Modals/Delete/utils.ts`, `EntityHeaderControls/JsonToggle/JsonToggleWithFormats.tsx`)
      turned out to be substantially larger than this task implied — those maps/switches are keyed by
      every `ApplicationRoute`, not just the ones tasks.md named, and each needed an `AssetsRoles` arm.
      Deliberately **not** given `duplicate` in `getGridActionLabels` (`Assets/utils.ts`): the shared
      `DuplicatePlatformAsset` modal unconditionally writes a `displayName`, a field `Role.class`
      doesn't declare — the same Core-rejection risk design D3 documents for the identity field.
      Roles get delete + open-in-new-tab only; `duplicateEntityMap` (`utils/entities/duplicate-entity.ts`)
      has no `AssetsRoles` entry as a result.
- [x] 3.5 Wire the role asset's create modal to the shared plain-name field `Assets > Models`/
      `Assets > Routes` use (`components/Assets/Modals/utils.tsx`).
- [x] 3.6 Create `app/[lang]/assets-roles/page.tsx` (list page), following
      `app/[lang]/assets-routes/page.tsx`.
- [x] 3.7 Component tests for `List.tsx`, following `Assets/Routes/tests/List.spec.tsx`. Also added
      `getGridActionLabels` coverage in `Assets/tests/utils.spec.ts` for the no-duplicate carve-out.

## 4. Detail view

- [x] 4.1 Create `components/Assets/Roles/CreateProperties.tsx` (shared `IdControl` only, no
      display-name or description control), following `Assets/Routes/CreateProperties.tsx`, and wire it
      into `components/EntityMainProperties/Properties/Properties.tsx` ahead of `isSimpleEntity` for
      `ApplicationRoute.AssetsRoles` (design D3 — pre-empting the `Route` migration's post-hoc fix).
- [x] 4.2 Create `components/Assets/Roles/Properties.tsx`, composing ported `RoleCostLimit`
      (`components/Assets/Roles/CostLimits.tsx`) and `RoleSharing` (`components/Assets/Roles/Sharing.tsx`)
      controls against `DialRoleResource` — copied from `components/Roles/View/Properties/
      {CostLimits,Sharing}.tsx` with only the prop type changed from `DialRole` to `DialRoleResource`,
      rather than imported directly: their `onChangeRole` callback type is contravariant, and
      `DialRoleResource`'s required `name`/`path`/`folderId` make `DialRole` (all fields optional) not
      assignable to it, so a direct import can't type-check against this surface's state without a
      cast. No `EntityProperties`, no `TopicsControl` (design D3, D2 Non-Goals).
- [x] 4.3 Create `components/Assets/Roles/TabsContent.tsx` rendering exactly the `Properties` tab,
      following `components/Assets/Routes/TabsContent.tsx`. Threads an `isSkipRefresh` flag through to
      `RoleSharing` (§11 AG Grid rule) since, unlike Route, this Properties tab owns a grid.
- [x] 4.4 Create `components/Assets/Roles/View.tsx` (etag/discard/save/JSON-editor wiring, no
      Admin/CORE toggle), following `components/Assets/Routes/View.tsx`. Also owns the `isSkipRefresh`
      state `TabsContent`/`Properties`/`RoleSharing` need, mirroring `Entities > Roles`' `RolesView`.
- [x] 4.5 `getTabsForAsset`'s default branch (`utils/tabs/utils.ts`) already returns `[propertiesTab(t)]`
      for any unlisted view, so `ApplicationRoute.AssetsRoles` needed no new branch — confirmed rather
      than skipped.
- [x] 4.6 Create `app/[lang]/assets-roles/[id]/page.tsx` (detail page), following
      `app/[lang]/assets-routes/[id]/page.tsx`.
- [x] 4.7 Component tests for `CreateProperties.tsx`, `Properties.tsx`, `TabsContent.tsx`, and
      `View.tsx`, following the `Assets/Routes/tests/` equivalents. Added a global
      `RolesFolderContext` mock to `test-setup.tsx` (every other asset folder context already has one).

## 5. Quality gate

- [x] 5.1 Run lint, format, and the full test suite (`npm run lint`, `npm run format`, `npm run test`
      from `apps/ai-dial-admin/`) and fix any failures. Lint: 0 errors (134 pre-existing warnings, none
      in files this change touches). Format: one new spec file needed `prettier --write`, applied.
      Full suite: 9822 passed, 4 failed — all four in
      `src/components/Runs/Compare/ExecutionResults/tests/ExecutionResultsTab.spec.tsx` (AG Grid
      interaction timeouts in the unrelated Evaluation/Runs feature; `git status` confirms this change
      touches nothing under `components/Runs/`). Every test this change added or touched passes.

## 6. Post-implementation fixes

- [x] 6.1 Fixed a real precision bug in `costLimit`: Core's `Limit`/`CostLimit` classes default
      several `long`/`BigDecimal` fields to `Long.MAX_VALUE` (9223372036854775807, 19 digits) to mean
      "unlimited", which is far past `Number.MAX_SAFE_INTEGER` — a plain `JSON.parse` silently rounds
      it (visibly `9223372036854776000` in a browser), and writing that rounded value back would
      corrupt the stored limit. First pass preserved the sentinel's exact digits end-to-end (a
      big-integer-safe parse/stringify pair at the shared request choke point,
      `utils/api/big-integer-json.ts`). Simplified per design D8, once confirmed a role PUT is always
      a full replace (`Role`'s `WriteSpec` has `hasEncryptedFields = false`, so
      `ConfigResourceController.prepareWrite`'s update arm skips `mergePreservingOmittedSecrets`
      entirely): the UI never needs the sentinel's exact value, only whether a token is unlimited, so
      `utils/roles/limits.ts` (`normalizeRoleLimits`/`toWireRoleLimits`) now drops any token that
      overflows `Number.isSafeInteger` on read instead of preserving it, and omits it on write —
      Core's own field default already means "unlimited" once a token is missing, and a full-replace
      write means no merge-with-existing can let a stale value survive underneath it. Removed
      `utils/api/big-integer-json.ts` entirely and reverted `server/base-api.ts`/`utils/api/
      send-request.ts` to plain `JSON.parse`/`JSON.stringify` — no shared-infra change is needed at
      all. Updated `RoleCostLimit` (`Assets/Roles/CostLimits.tsx`) to represent "toggle off" as
      `costLimit: {}` (every token absent) rather than explicitly writing `UNLIMITED_VALUE` into all
      four, and simplified its "is a limit set" check to `Object.keys(costLimit || {}).length > 0`.
      Unit tests for `limits.ts`'s new drop-on-read/omit-on-write behavior, a dedicated
      `mergeRoleResource`/`toRolePayload` regression case, and a new `CostLimits.spec.tsx` covering
      the toggle-off write.
- [x] 6.2 Fixed a real wire-shape bug in `share`: Core's `ShareResourceLimit` carries
      `@JsonNaming(SnakeCaseStrategy.class)` (`invitation_ttl`/`max_accepted_users`), unlike
      `costLimit`/`limits` (`Limit`/`CostLimit`, neither annotated) — the original port reused the
      admin-backend's camelCase `DialRoleShare`, which doesn't match Core's actual response at all.
      Added `DialCoreRoleShare` (`models/dial/role-limits.ts`) and retyped `DialRoleResource.share`
      to it. Also removed an hours↔ms conversion the original port copied from `Entities > Roles`:
      Core's own `ShareResourceLimit.invitationTtl` is documented, on the Core class itself, as
      already measured in hours, so converting it (as the admin-backend's differently-scaled field
      needs) silently wrote a value 3600× too large. Rewrote `components/Assets/Roles/Sharing.tsx`
      against a new `components/Assets/Roles/utils.ts` (`getAssetSharingData`, `toCoreShareField`,
      `applySharingChange` — the last extracted as a pure, directly-testable function per
      `components.md`'s "logic lives elsewhere" rule). `CostLimits.tsx` needed no change at the time
      this task was done — see 6.1's later revision, which did end up changing it once the
      drop-on-read/omit-on-write approach replaced the string-preservation approach. Unit tests for
      all three new utils, plus updated `actions.spec.ts`/`asset-metadata.
      spec.ts` cases reflecting the corrected shapes.
- [x] 6.3 Widened the `Assets > Models` Roles tab's role population to match `Assets > App Runners`
      (which already did this correctly): switched `assets-models/[id]/page.tsx`'s roles fetch from
      the admin-backend's `rolesApi.getRolesList` to the Core-direct `readConfigEntities<DialRole>`
      union (Api-written ∪ config-file-declared) — the same fix `no-admin-be.spec.tsx`'s own doc
      comment already asserts this surface needs elsewhere. Generalized
      `components/Assets/Models/Roles.tsx` (`ModelAssetRoles`, `DialModelResource`-specific) into a
      shared, generic `components/EntityView/Roles/AssetRoles.tsx` (`<T extends { userRoles?:
      string[] }>`), the same "one shared component across multiple entity/asset surfaces" pattern
      `EntityInterceptors` already established — reused by both `Assets > Models` and the new `Assets
      > Routes` Roles tab (6.4). Added `RolesI18nKey.NotAvailableRoute` and extended
      `getNoAvailableTitle` (`EntityView/Roles/utils.ts`) with `AssetsModels`/`AssetsRoutes` cases.
      Unit + component tests for `AssetRoles` and the two new `getNoAvailableTitle` cases.
- [x] 6.4 Added a Roles tab to `Assets > Routes` — deferred by the original `assets-routes` change's
      design D4 as "role-limit handling on Core-direct asset surfaces is being reconsidered
      separately"; membership-only editing (no role-limits, matching D4's own reasoning and every
      other asset Roles tab) is now in scope. Added `userRoles?: string[]` back to
      `DialRouteResource` (a real `RoleBasedEntity` field Core already accepts — no backend change
      needed), a `rolesTab` branch in `getTabsForAsset` for `AssetsRoutes`, an
      `optionWarnings`-reading roles fetch in `assets-routes/[id]/page.tsx` (via
      `readConfigEntities`, matching 6.3), and wired `AssetRoles` into `Routes/View.tsx`/
      `TabsContent.tsx`. Updated `View.spec.tsx`/`TabsContent.spec.tsx` for the new required `roles`
      prop, plus a new test rendering the Roles tab itself.
- [x] 6.5 Re-ran the full quality gate after 6.1–6.4. Lint: 0 errors. Format: two new spec files
      needed `prettier --write`, applied. Full suite: 9870 passed, 1 failed
      (`src/components/Assets/Interceptors/tests/Properties.spec.tsx`'s "Should render the icon
      control" — confirmed pre-existing and unrelated: `git status` shows `Interceptors/Properties.tsx`
      already staged with `IconControl` removed before this fix round began, and this change touches
      nothing under `Assets/Interceptors/`). Every test this fix round added or touched passes.
- [x] 6.6 Simplified 6.1 per design D8's revision (drop-on-read/omit-on-write instead of exact-digit
      preservation) — see 6.1's updated text. Re-ran the full quality gate after the simplification.
      Lint: 0 errors. Format: clean, no changes needed. Full suite: 9861 passed, 1 failed — the same
      pre-existing, unrelated `Interceptors/Properties.spec.tsx` failure from 6.5.
- [x] 6.7 Removed the last stringification: `costLimit`/`limits` tokens were still being converted to
      strings (matching the admin-backend's `DialRoleLimits` convention) even after 6.6 dropped the
      out-of-range ones. Added `DialCoreRoleLimits` (`models/dial/role-limits.ts`, plain `number`
      fields — no `enabled`, since that flag has no Core wire representation at all) and retyped
      `DialRoleResource.costLimit`/`limits` to it. `normalizeRoleLimits` now keeps a safe token as a
      number instead of stringifying it; `toWireRoleLimits` is a plain null-filtering passthrough
      (no `Number`/`String` conversion left in either direction). Rewrote `Assets/Roles/CostLimits.tsx`
      to stop reusing the entity-side `LimitsControl`/`LimitControl` (`EntityMainProperties/Limits/*`
      — string-typed, `Big.js`-based) and render its own four `DialNumberInput` fields bound directly
      to `DialCoreRoleLimits`. Updated `limits.spec.ts`/`asset-metadata.spec.ts`/`actions.spec.ts` for
      the numeric expectations, and added `CostLimits.spec.tsx` cases proving a typed value round-trips
      as a `number` and a cleared field removes the key entirely. Full quality gate re-run: lint 0
      errors, format clean, full suite 9863 passed, 0 failed (the `Interceptors/Properties.spec.tsx`
      flake from 6.5/6.6 didn't reproduce this run — still confirmed pre-existing/unrelated, not
      re-litigated).
