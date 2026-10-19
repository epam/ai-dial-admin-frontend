## 1. Shared schema-create validation

- [x] 1.1 Complete the opt-in declared-ID resolver path in `apps/ai-dial-admin/src/components/EntityListView/CreateEntity/CreateEntity.tsx`: resolve only after local form validation on Create, render the standard `IdControl` external error for a found schema, clear it after `$id` changes, and fail open to the existing create callback on no result or resolver failure.
- [x] 1.2 Update `apps/ai-dial-admin/src/components/Assets/BaseAssetList/Modals.tsx` to supply `getResolvedRunnerSchema` for `ApplicationRoute.PlatformAppRunners` and `getCatalogSchemaById` for `ApplicationRoute.PlatformCatalogSchemas`, leaving every other CreateEntity caller without a resolver.
- [x] 1.3 Thread `externalIdError` through `apps/ai-dial-admin/src/components/EntityMainProperties/Properties/Properties.tsx`, `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/CreateProperties.tsx`, and `apps/ai-dial-admin/src/components/ApplicationRunners/ConfigurationView/Properties.tsx` so the Platform App Runner `$id` control renders and validates the shared external collision error; preserve the already-wired Catalog Schema path.

## 2. Catalog Schema duplicate support

- [x] 2.1 Update `apps/ai-dial-admin/src/components/Assets/utils.ts` so writable API-backed Catalog Schema rows expose the existing Duplicate action while preserving file-root and read-only action restrictions.
- [x] 2.2 Extend `apps/ai-dial-admin/src/components/Assets/Modals/DuplicatePlatformAsset.tsx` with a Catalog Schema branch that clones storage Name and declared `$id` with the standard copy suffix, exposes required Name, ID, and `dial:catalogDisplayName` fields, preserves the remaining schema body, and uses `getCatalogSchemaById` to apply the same resolved-ID, recovery, and fail-open behavior as Platform App Runner duplication.
- [x] 2.3 Keep `apps/ai-dial-admin/src/components/Assets/BaseAssetList/BaseAssetList.tsx` and `apps/ai-dial-admin/src/components/Assets/BaseAssetList/utils.tsx` on their existing `getPlatformAssetDuplicate` and `createCatalogSchema` callback path after a permitted duplicate submission, so list refresh, notification, navigation, and Core write conflict handling remain unchanged.

## 3. Automated test coverage

- [x] 3.1 Extend `apps/ai-dial-admin/src/components/EntityListView/CreateEntity/tests/CreateEntity.spec.tsx` with Platform App Runner cases for resolved-ID blocking and inline feedback, recovery after an ID edit, and unresolved/failed lookup falling through to the normal create callback; retain equivalent Catalog Schema coverage and a no-resolver regression where needed.
- [x] 3.2 Update `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/tests/CreateProperties.spec.tsx` and, if the property boundary requires it, `apps/ai-dial-admin/src/components/ApplicationRunners/ConfigurationView/tests/Properties.spec.tsx` to cover the App Runner `$id` external-error wiring without changing local validation behavior.
- [x] 3.3 Update `apps/ai-dial-admin/src/components/Assets/tests/utils.spec.ts` to assert Catalog Schema action availability for writable rows and its absence for read-only/file-root cases.
- [x] 3.4 Extend `apps/ai-dial-admin/src/components/Assets/Modals/tests/DuplicatePlatformAsset.spec.tsx` to cover Catalog Schema copied Name/ID/display name, retained schema payload, resolved-ID blocking and recovery, resolver-failure fallback, and unchanged Platform App Runner and non-schema duplicate behavior.

Browser verification task omitted because the user declined the dedicated automated `spec-browser-verify` task.

## 4. Quality checks

- [x] 4.1 Run the focused Vitest specs from `apps/ai-dial-admin/`, then run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the appropriate full test gate; resolve failures attributable to this change.
