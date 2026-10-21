## 1. Catalog Schema create preflight

- [x] 1.1 Extend `apps/ai-dial-admin/src/components/EntityListView/CreateEntity/CreateEntity.tsx` and its `EntityMainProperties/Properties` / `Assets/Platform/CatalogSchemas/CreateProperties` path with an opt-in submit-time declared-ID preflight path that uses `IdControl.externalError` and `SaveValidationContext` to block creation on a resolved duplicate, clear the error when `$id` changes, and otherwise preserve the existing create result, notification, redirect, and close behavior.
- [x] 1.2 Wire the Catalog Schema-specific `getCatalogSchemaById` resolver through `apps/ai-dial-admin/src/components/Assets/BaseAssetList/Modals.tsx` for `ApplicationRoute.PlatformCatalogSchemas`, leaving other CreateEntity callers unchanged.
- [x] 1.3 Keep `apps/ai-dial-admin/src/components/Assets/BaseAssetList/BaseAssetList.tsx` and `apps/ai-dial-admin/src/components/Assets/BaseAssetList/utils.tsx` on their existing `createCatalogSchema` action path after an unresolved or failed preflight, so Core retains final conflict enforcement.

## 2. Automated test coverage

- [x] 2.1 Extend `apps/ai-dial-admin/src/components/EntityListView/CreateEntity/tests/CreateEntity.spec.tsx` to cover a resolved Catalog Schema ID blocking the create callback and rendering the inline error, clearing that error after an ID edit, an unresolved ID invoking the normal callback, and a resolver failure preserving that callback path.
- [x] 2.2 Update `apps/ai-dial-admin/src/components/Assets/Platform/CatalogSchemas/tests/CreateProperties.spec.tsx` only as needed to verify the Catalog Schema `$id` field accepts and renders the reused external-error state without changing its existing local validation.

Browser verification task omitted because the user declined the dedicated automated `spec-browser-verify` task.

## 3. Quality checks

- [ ] 3.1 Run the focused Vitest specs from `apps/ai-dial-admin/`, then run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the appropriate full test gate; resolve failures attributable to this change.
