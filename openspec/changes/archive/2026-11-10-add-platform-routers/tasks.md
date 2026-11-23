## 1. Core plumbing

- [x] 1.1 Add `ResourceType.ROUTER` and its entries in `RESOURCE_TYPE_PREFIX`, `CORE_RESOURCE_URL`, `CORE_RESOURCE_METADATA_URL`, the `VersionedResourceType` exclusion list, and any other total `Record<ResourceType, …>` the typecheck flags
- [x] 1.2 Add `ConfigFileEntityType.Routers` and include it in `READABLE_CONFIG_FILE_TYPES`; extend the client specs for list/get and for the still-refused `keys` type
- [x] 1.3 Add `DialRouterResource`, `RouterMode`, `RouterDecision` (feature `models.ts`), register the resource in the `PlatformAsset` union, and cover the omit-unset-fields payload rule
- [x] 1.4 Add `app/[lang]/platform-routers/actions.ts` (list, create, get, update, remove, bulk delete, config-file list/get, `toRouterPayload`) with `actions.spec.ts`
- [x] 1.5 Add `RoutersFolderContext`, register it in `AssetFolderProviders`, and add `PlatformRouters` to `FLAT_PLATFORM_VIEWS`

## 2. Routes, menu, and shared maps

- [x] 2.1 Add `ApplicationRoute.PlatformRouters`, the breadcrumb entry, and the update-notification titles
- [x] 2.1a Add the menu i18n: `MenuI18nKey.PlatformRouters` + `en.ts`, and extend the AI Gateway group description to name routers
- [x] 2.2 Add the menu item after Toolsets in AI Gateway with its icon (re-check `menu-item-icons.tsx` for a collision), and update `menu-configuration.spec.ts`
- [x] 2.3 Add the `PlatformRouters` entries to the shared maps: `GetAssetActionMap`, `CreateAssetActionMap`, `BulkDeleteAssetActionMap`, `AssetFolderContextMap`, and the label switches in `Assets/utils.ts`, `Common/FileManager/utils.ts`, `Assets/Modals/utils.tsx`, `create-entity.ts`, `duplicate-entity.ts`, `Delete/utils.ts`
- [x] 2.4 Add the `[lang]/platform-routers` list page and `[id]` detail page (config-file mode, option reads for roles, translators, catalog schemas, and app-type schemas)

## 2b. i18n

- [x] 2b.1 Add `Router`/`Routers` keys and `en.ts` text to the Delete (entity and bulk), Duplicate, Update, Create, and `FileManager` enums, including `RoutersEmptyStateTitle` and `RoutersEmptyStateDescription`
- [x] 2b.2 Add the `EntityFields` keys for `mode`, its options, the decision settings (labels, placeholders showing Core's defaults, validation errors), and the schema picker, reusing existing shared keys where they exist
- [x] 2b.3 Add the `InterfacesI18nKey` info text for the Passthrough-only mode in decision mode

## 3. List and create

- [x] 3.1 Add `Routers/List.tsx` (platform and file roots, metadata-only columns, no folder actions) following `Translators/List.tsx`, with tests
- [x] 3.2 Add `Routers/CreateProperties.tsx` (name-only create) and wire it into the shared create modal, with tests

## 4. Detail view and Properties

- [x] 4.1 Add `getTabsForAsset` branch for `PlatformRouters` (Properties, Features, Parameters when a schema is set, Catalog, Roles) and tests in `utils/tabs`
- [x] 4.2 Add `Routers/View.tsx` and `Routers/TabsContent.tsx` (save, discard, JSON editor, read-only file mode, tab switch) with tests
- [x] 4.3 Add `Routers/Properties.tsx`: identity and display fields, `baseUrl`, `forwardAuthToken`, `maxRetryAttempts`, `overrideName`, `mode` select, with tests
- [x] 4.4 Add the decision settings (`body`, `timeoutMs`, `maxDecisions`) with range validation through `SaveValidationContext`, drop-on-proxy behavior, and tests
- [x] 4.5 Wire `Features`, `Catalog`, and `Roles` tabs to the existing Models controls with `view={PlatformRouters}`; widen the `InterfaceFeaturesButton` model-feature-set check; add tests

## 5. Interfaces

- [x] 5.1 Add `ROUTER_INTERFACE_TYPES` and wire `InterfacesField` into `Routers/Properties.tsx` with `isAsset`, `translators`, and `entityBaseUrl`
- [x] 5.2 Add the optional `isTranslatorDisabled` prop to `InterfacesField` and `InterfaceRow` (Passthrough-only mode select) and the mode-switch clearing of translated rows; extend the existing specs without changing the Models/Apps behavior

## 6. Schema and properties

- [x] 6.1 Make the `AppRunnersResource` required marker optional through a prop (default unchanged) and confirm the option builder lists schemas that declare no endpoints, with a unit test
- [x] 6.2 Add the schema picker to `Routers/Properties.tsx` (pick seeds defaults, clear removes both fields) and tests
- [x] 6.3 Add the `Parameters` tab for `applicationProperties` with the tab guard, following `Assets/Entities/Apps`, and tests

## 7. Docs and final checks

- [x] 7.1 Update `.claude/reference/areas.md` and any `docs/` page that lists AI Gateway entities; run `npm run sync:agent-mirrors` if a `.claude` source changed
- [x] 7.2 Run lint, format check, `npm run typecheck`, `npm run typecheck:specs`, and the full test suite, and fix anything they raise
