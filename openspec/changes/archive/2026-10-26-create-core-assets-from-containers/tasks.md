## 1. Admin-API guard on container pages

- [x] 1.1 In `app/[lang]/containers/[id]/page.tsx`, call `getEntityNames` and pass `createEntity` only when `getIsAdminApiEnabled()` is true
- [x] 1.2 In `app/[lang]/model-servings/[id]/page.tsx`, fetch the admin-backend model and toolset name lists and pass the admin-backend create actions only when `getIsAdminApiEnabled()` is true

## 2. Core asset templates

- [x] 2.1 Extend `getAssetTemplate` in `utils/deployments/entity.ts` with the per-type routing fields from `container-core-assets` "Core asset template per container type" (adapter → model, interceptor, application, MCP, Model Serving text generation → model, text classification → toolset). Add any new path literals next to their single consumer per the extract-only-when-reused rule.
- [x] 2.2 Confirm the template leaves `userRoles`/`user_roles`, `upstreams` and `overrideName` (non-serving types) unset, and never emits an empty URL string

## 3. Create action and asset modal wiring

- [x] 3.1 In `ContainersButtonsWrapper.tsx`, generalize `createToolsetOptions` into per-type options (admin-backend entity + Core asset) for adapter, interceptor, application and MCP containers and for both Model Serving capabilities
- [x] 3.2 Without the admin API (`featureFlags.adminApiEnabled` false), render the single `OutlinedButton` opening `CreateAsset`, labelled per `container-core-assets` ("Create model" for an adapter container)
- [x] 3.3 Open `CreateAsset` with the view and folder context of the target type (`AssetFolderContextMap`: models, interceptors, applications platform root, toolsets) instead of the fixed `AssetsToolsets` / `useToolsetFolder`
- [x] 3.4 In both pages, wrap the view in the folder provider of the type being created, replacing the MCP-only `ToolsetFolderProvider` branch
- [x] 3.5 Add i18n keys for "Asset model", "Asset interceptor" and "Asset application" in `src/locales/en.ts` and `EntitiesI18nKey`, reusing existing entity labels for the single-button case

## 4. Core name validation

- [x] 4.1 Feed `CreateAsset` the merged `platform/` + `file/` names of the target type for container-originated creates, without changing the modal's behavior for its other callers
- [x] 4.2 Ensure a Core rejection (409/412/422) on save surfaces through the existing error notification and keeps the modal open

## 5. Specs and docs

- [x] 5.1 Check `docs/` for any description of creating entities from containers and update it to cover the Core option

## 6. Tests

- [x] 6.1 Unit tests for `getAssetTemplate`: one per row of the template table, plus the no-`userRoles`/no-`upstreams`/no-empty-string assertions
- [x] 6.2 Component tests for `ContainersButtonsWrapper`: dropdown with both options when the admin API is on, single Core button with the plain label when off, adapter labelled "model", Model Serving per capability
- [x] 6.3 Page tests for `containers/[id]` and `model-servings/[id]`: no admin-backend API call when `DIAL_ADMIN_API_URL` is unset; name list fetched when set
- [x] 6.4 Test that container-originated `CreateAsset` rejects a name present only in the config-file population

## 7. Browser verification

- [x] 7.1 Run the `spec-browser-verify` skill for this change. It builds a VerificationRequest from the browser-observable scenarios in `container-core-assets`, `containers`, `model-serving-capability-gating` and `admin-api-availability`, and the `spec-verification-gate` sub-agent checks them against the local app via the Playwright MCP. Boot the local stack with auth disabled, `DEPLOYMENTS_ENABLED='true'` and at least one RUNNING container per type the scenarios open, and run it twice: once with the admin API configured (dropdown scenarios) and once without it (Core-only scenarios). Resolve every `fail` verdict before the change is complete.

## 8. Quality gates

- [x] 8.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; fix every failure

## 9. Follow-up: both buckets for toolsets and applications

- [x] 9.1 In `components/Assets/Modals/CreateAsset.tsx`, replace `isPlatformTarget` with `shouldOpenOnPlatform`: keep every root from `getRootFolders`, select `platform/` once after the initial roots load (only when that root exists), and merge the `file/` names into the duplicate list only while the selected folder is `platform/`
- [x] 9.2 Pass `shouldOpenOnPlatform` from `ContainersButtonsWrapper.tsx` instead of `isPlatformTarget`
- [x] 9.3 Update `CreateAsset.spec.tsx` and `ContainersButtonsWrapper.spec.tsx`: all three roots kept, platform selected on load, public selectable, config-file names reserved on platform only, Catalog-off keeps public only
- [x] 9.4 Run the `spec-browser-verify` skill for the new and changed `container-core-assets` scenarios (platform default, public create, public name check, Catalog off) with the admin API configured; it spawns the `spec-verification-gate` sub-agent against the local app via the Playwright MCP. Resolve every `fail` verdict before the change is complete
- [x] 9.5 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; fix every failure
