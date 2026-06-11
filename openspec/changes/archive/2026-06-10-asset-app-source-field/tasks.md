## 1. Model migration

- [x] 1.1 In `src/models/dial/application.ts`, remove the stale flat `applicationTypeSchemaId?: string` field from `DialApplication` (regular apps already use `source`; only the bespoke/asset paths read it).
- [x] 1.2 In `src/models/dial/deployment-asset.ts`, change `AssetApp` to extend `DialApplication` without `Omit<..., 'source'>`, and remove its own `applicationTypeSchemaId` field. AssetApp now inherits `source?: SOURCE_FIELD` and no longer carries any flat schema field.
- [x] 1.3 Grep the repo for `applicationTypeSchemaId` reads on a DialApplication/AssetApp (not `source.applicationTypeSchemaId`); confirm each is covered by the tasks below (type removal turns any missed site into a compile error).

## 2. Migrate reads/writes to `source`

- [x] 2.1 `Applications/ParametersTab/utils.ts` (`getAppRunner`): drop the `(entity as AssetApp)?.applicationTypeSchemaId` branch; resolve schema id solely via `getSchemaSourceId(entity.source)` (keep the `editorUrl` fallback match).
- [x] 2.2 `components/Assets/Apps/Properties.tsx`: replace the two `assetApp.applicationTypeSchemaId` reads in `showResponsesDefaults` with `getSchemaSourceId(assetApp.source)`.
- [x] 2.3 `EntityView/Interceptors/Interceptors.tsx:72`: remove the `|| (entity as unknown as AssetApp).applicationTypeSchemaId` fallback (and the now-unused `AssetApp` import).
- [x] 2.4 `EntityView/Interceptors/CollapsableInterceptors.tsx:47`: remove the `|| (entity as unknown as AssetApp).applicationTypeSchemaId` fallback (and the now-unused `AssetApp` import).
- [x] 2.5 `ApplicationRunners/View/View.tsx:228`: write the schema source via `source: createSchemaSource(selectedRunner.$id)` in the create-asset modal `initialValues`, mirroring the regular app modal above.

## 3. Source items + route wiring

- [x] 3.1 In `components/SourceField/constants.ts`, add `ASSET_APPLICATION_SOURCE_ITEMS: SelectOption[]` = `[ENDPOINTS, SCHEMA]` (labels "Endpoints", "App Runner").
- [x] 3.2 Wire `case ApplicationRoute.AssetsApplications: return ASSET_APPLICATION_SOURCE_ITEMS;` into `getItems()`.
- [x] 3.3 In `components/SourceField/SourceField.tsx`, extend the stale-field reset condition (`if (view === ApplicationRoute.Applications)`) to also include `ApplicationRoute.AssetsApplications`, and drop the now-dead `applicationTypeSchemaId: undefined` entry from the reset object (the live value lives at `source.applicationTypeSchemaId`).
- [x] 3.4 In `components/SourceField/Endpoints/Endpoints.tsx`, render `ApplicationEndpoint` for `AssetsApplications` as well as `Applications` (the ENDPOINTS branch was previously gated to `Applications` only, so the asset view would render nothing).

## 4. Swap the editor component

- [x] 4.1 In `components/Assets/Apps/Properties.tsx`, replace `<ApplicationSource ...>` with `<SourceField view={ApplicationRoute.AssetsApplications} sourceItems={ASSET_APPLICATION_SOURCE_ITEMS} label={t(EntitiesI18nKey.SourceType)} id="sourceType" entity={assetApp} onChange={...} runners={runners} isEntityImmutable />`. Reuse the same `ApplicationRoute.AssetsApplications` constant the component already passes to `TopicsControl`/`FilePath` (there is no `view` prop on this component). Mirror `Applications/View/Properties/Properties.tsx`; pass no `getContainers`. ALSO migrated the second importer `EntityMainProperties/Properties/AssetProperties.tsx` (the create-modal variant) to `SourceField`.
- [x] 4.2 Verify no other importers of `components/SourceField/Application/ApplicationSource.tsx`, then delete it and its local `constants.ts`.

## 5. Serialization check

- [x] 5.1 Inspect `src/app/[lang]/assets-applications/actions.ts` (createApp/save paths): confirmed `createApp`/`updateApp` spread `...app`, so `source` reaches the backend; no code maps `source` to a flat `applicationTypeSchemaId` — nothing to remove.

## 6. Tests

- [x] 6.1 Update `Applications/ParametersTab/tests/utils.spec.ts` AssetApp cases to use `source` instead of the flat field; removed the now-meaningless flat-over-source precedence tests.
- [x] 6.2 N/A — `Publications/Assets/Application/tests/...` and `Publications/View/tests/utils.spec.ts` fixtures are typed `PublicationApplication.applicationResource: DialApplicationResource` (a separate model in `application-resource.ts`, NOT touched by this change). They still compile; no edit needed. See follow-up note about `DialApplicationResource` vs backend PR #907.
- [x] 6.3 Added an `AssetsApplications`-view block to `SourceField/tests/SourceField.spec.tsx`: asserts the dropdown offers only Endpoints + App Runner (no Container) and that ENDPOINTS→SCHEMA clears the app fields.
- [x] 6.4 N/A — no orphaned tests. `SourceField/Application/tests/AppRunners.spec.tsx` targets the shared `AppRunners` (still present, both APIs intact), and there was no `ApplicationSource.spec`.

## 7. Verify

- [x] 7.1 Ran vitest across all touched component areas — 475 tests pass.
- [x] 7.2 `nx lint` (0 errors) and `nx build` (full typecheck) both pass — no type errors from the removed flat field.
