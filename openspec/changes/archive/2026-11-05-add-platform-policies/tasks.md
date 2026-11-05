## 1. Foundations (shared by both entities)

- [x] 1.1 Add `src/models/dial/policy.ts`: `DialPolicy`, `DialPolicyAssignment`, `PolicySubjectRule` interfaces, and `PolicyKind`, `PolicyQuantity`, `PolicySubjectFunction` enums; add `DialPolicyResource` / `DialPolicyAssignmentResource` to `src/models/dial/resource.ts` following `DialRouteResource`
- [x] 1.2 Add `ResourceType.POLICY` and `ResourceType.POLICY_ASSIGNMENT` to `src/types/resource-type.ts`; register prefixes `policies` and `policy_assignments` in `RESOURCE_TYPE_PREFIX` and add both types to the folder-nested versionless set and merge map in `src/server/core/asset-metadata.ts`, so `folderId` is the cost object
- [x] 1.3 Add `ApplicationRoute.PlatformPolicies` (`/platform-policies`) and `ApplicationRoute.PlatformPolicyAssignments` (`/platform-policy-assignments`) in `src/types/routes.ts`
- [x] 1.4 Add `MenuI18nKey`, entity and create i18n keys (`PoliciesI18nKey`, `PolicyAssignmentsI18nKey`) in `src/constants/i18n.ts` and `src/locales/en.ts`, reusing shared `BasicI18nKey` / `ButtonsI18nKey` labels where they exist
- [x] 1.5 Add `PolicyFolderContext` and `PolicyAssignmentFolderContext` in `src/context/assets/` via `createFolderContext`, and append both to the list in `AssetFolderProviders.tsx`
- [x] 1.6 Add `src/utils/env/get-policies-toggle.ts` (`getIsPoliciesEnabled`, `isValueTruthy(process.env.POLICIES_ENABLED)`), add `policiesEnabled` to `FeatureFlags` in `src/models/feature-flags.ts`, and build it in `src/app/[lang]/layout.tsx`; add the field to every `FeatureFlags` fixture so `npm run typecheck:specs` stays at zero
- [x] 1.7 Add both Governance menu items to `menu-configuration.tsx` after `Interceptors` and before `Approvals`, shown only when `featureFlags.policiesEnabled` is true, each with `badge: MenuBadge.Preview` and an icon in `menu-item-icons.tsx`
- [x] 1.8 Add both views to `Breadcrumbs/constants.ts`

## 2. Nested platform views (shared file-manager support)

- [x] 2.1 Add `isNestedPlatformView` (policy and assignment views) in `utils/files/root-folder.ts`; make `getRootFolder` return `platform` for flat and nested views; add the views to `CATALOG_VIEWS` and `isAssetView`; unit-test the predicates
- [x] 2.2 Revisit each `isFlatPlatformView` consumer (`FileManager`, `BaseAssetList`, `Modals`, `CreateAsset`, `Assets/utils.ts`, `ContainersButtonsWrapper`): accept nested views where the rule is "platform bucket path", keep flat-only where it is "no folders"; offer no create-folder, rename, move or nested folder (folders are implicit in Core), and take the cost object in the create modal
- [x] 2.3 Make create and duplicate path building take the current folder for nested views, so the written path is `[costObject/]name`

## 3. Policies

- [x] 3.1 Add `src/app/[lang]/platform-policies/actions.ts` (`getPolicies`, `createPolicy`, `getPolicy`, `updatePolicy`, `removePolicy`, `bulkDeletePolicies`) with a `toPolicyPayload` helper that strips `_metadata`, seeded `description`/timestamps, `id`, and reserved fields and omits empty `subject`/`costObject`; no config-file actions
- [x] 3.2 Add `page.tsx` and `[id]/page.tsx` for `platform-policies` (force-dynamic, `SaveValidationContextProvider`), mirroring `platform-routes`, each calling `notFound()` first when `getIsPoliciesEnabled()` is false
- [x] 3.3 Wire `ApplicationRoute.PlatformPolicies` into the remaining `switch (view)` helpers in `Assets/BaseAssetList/utils.tsx`, `Assets/BaseAssetList/{BaseAssetList,Modals,types}`, `Assets/utils.ts`, `Assets/Modals/*`, `EntityView/Modals/Delete/*`, `utils/tabs/utils.ts`, `ListView/constants.ts`, `utils/is-view.ts`, `utils/open-in-new-tab.ts` and `utils/entities/{create,update,duplicate}-entity.ts`
- [x] 3.4 Add `Assets/Platform/Policies/List.tsx` (on `BaseAssetList`) and a create modal asking for the name, creating in the currently shown folder
- [x] 3.5 Add `Assets/Platform/Policies/View.tsx`, `TabsContent.tsx` and `Properties.tsx`: priority, kind and quantity selects, `object` two-mode control (all / list), `cost.day`, `cost.month`, optional `costObject`, with shape validation through the existing validation context; ETag save, discard, delete, JSON toggle
- [x] 3.6 Add duplicate-into-same-folder and bulk delete for policies
- [x] 3.7 Delete a cost object folder by deleting the records under it (`removePolicyFolder` / `removePolicyAssignmentFolder`, listing the folder with its trailing slash, refusing the root), wired into `onMultipleRemove` for the nested views, skipping records already covered by a deleted folder

## 4. Subjects editor

- [x] 4.1 Add the shared `SubjectRulesEditor` (rule list with `source` + suggestion, `function` select, `targets` multi-value input; add/remove; `TRUE`/`FALSE` disable and clear targets; omit empty list) next to the two entity folders, with a `models.ts` / `constants.ts` split
- [x] 4.2 Add the Subjects tab to the Policy view and the pinned-once informational note
- [x] 4.3 Decide the `expiresAt` control from the kit's own types: a validated text input (ISO-8601 with an offset), since `Calendar`'s offset behavior is unspecified
- [x] 4.4 Require a source and, unless the function is `TRUE`/`FALSE`, at least one target on every subject rule, blocking Save and Create from any tab (`isRuleValid`, `areRulesValid`)

## 5. Policy assignments

- [x] 5.1 Add `src/app/[lang]/platform-policy-assignments/actions.ts` and the two `page.tsx` files (same `notFound()` guard as the policy pages) with `toAssignmentPayload` (derive `costObject` from the folder, drop `id`, omit empty optionals)
- [x] 5.2 Wire `ApplicationRoute.PlatformPolicyAssignments` into the same shared `switch (view)` helpers listed in the policy wiring task; no root entries and no create-folder
- [x] 5.3 Add `PolicySelector`: lists global policies and the assignment's own cost-object policies via `ResourceType.POLICY` metadata listing, filters other cost objects' policies, and falls back to a text input with an error notification when the listing fails
- [x] 5.4 Add `Assets/Platform/PolicyAssignments/List.tsx` and the create modal (Cost object locked when launched inside a folder, ID, Policy)
- [x] 5.5 Add `View.tsx`, `TabsContent.tsx`, `Properties.tsx` (policy selector, read-only cost object, source, ticket, description, `expiresAt` with offset validation) and the Subjects tab reusing `SubjectRulesEditor`
- [x] 5.6 Add duplicate-into-same-folder and bulk delete for assignments

## 6. Configuration docs

- [x] 6.1 Document `POLICIES_ENABLED` (default `false`) as a commented entry in `.env.template` under a new `# Policies` heading; do not touch any `.env*.local`
- [x] 6.2 Add a `POLICIES_ENABLED` [Preview] row to the `README.md` environment table, matching the `MCP_REGISTRY_ENABLED` row's shape
- [x] 6.3 Add a `POLICIES_ENABLED` entry under `Added` in the `0.23.0` section of `docs/INFRA-CHANGELOG.md`, stating that it shows the Governance Policies and Policy Assignments pages and that Core does not enforce policies yet (default: `false`)
- [x] 6.4 Update `.claude/reference/areas.md` if it lists platform resource areas

## 7. Remove the catalog flag

- [x] 7.1 Remove `catalogEnabled` from `FeatureFlags` and `[lang]/layout.tsx`, inline the `catalogItems` helper in `Menu/menu-configuration.tsx`, and pass `!isUnitMode` instead of `catalogEnabled && !isUnitMode` in `Assets/Modals/CreateAsset.tsx`, `Common/FilePath/FilePath.tsx` and `Common/FileManager/FileManager.tsx`
- [x] 7.2 Drop `catalogEnabled` from every fixture and from `test-setup.tsx`; delete the tests that exercised Catalog off (menu configuration, `FilePath`, `FileManager`, `CreateAsset`) and keep the Catalog-on cases as the default behavior
- [x] 7.3 Add `MODIFIED` delta specs for `platform-applications`, `platform-toolsets`, `config-file-entity-views`, `container-core-assets` and `projects`, with the Catalog on/off wording removed
- [x] 7.4 Update `docs/MENU-DOCUMENTATION.md` (the `catalog` token no longer hides Core-direct items) and add a `Removed` entry for the token to `docs/INFRA-CHANGELOG.md` (0.23.0), and drop the token mention from the `POLICIES_ENABLED` entry

## 8. Unit tests

- [x] 8.1 Add specs for both `actions.ts` files (payload stripping, empty-field omission, ETag pass-through, bulk delete) beside `platform-routes/actions.spec.ts`
- [x] 8.2 Add specs for the `asset-metadata.ts` additions (folder-nested parsing, `folderId` equals cost object) and one assertion per new view in each updated `switch (view)` helper, a flat-view regression assertion for each branch changed in the file-manager consumers (`getTreeActionLabels`, bulk actions, grid columns, `isMoveSupported`), `menu-configuration.spec.ts` (order, flag off, `catalog` token with flag on) and `MenuContent.spec.tsx`
- [x] 8.3 Add `utils/env/tests/get-policies-toggle.spec.ts` (unset, falsy, truthy values) and page specs for the four routes asserting `notFound()` when the flag is off and a render when it is on, beside the existing `dashboards/tests/page.spec.tsx`
- [x] 8.4 Add component specs for the policy and assignment `Properties`, `List`, create modals and `View` (validation, required fields, locked cost object, ETag save, 409 and 422 notifications)
- [x] 8.5 Add component specs for `SubjectRulesEditor` and `PolicySelector` (TRUE/FALSE clearing, empty-list omission, cost-object filtering, listing-failure fallback)
- [x] 8.6 Run `npm run typecheck:specs` and fix fixture drift for the new models

## 9. Quality checks

- [x] 9.1 Run lint, format check, `npm run typecheck`, `npm run typecheck:specs` and the full test suite; fix all findings
