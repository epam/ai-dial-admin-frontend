## 1. Foundations: types, constants, route and i18n

- [x] 1.1 Add `ApplicationRoute.AssetsAliases = '/assets-aliases'` (`types/routes.ts`), `ResourceType.ALIAS` (`types/resource-type.ts`), `ConfigFileEntityType.Aliases = 'aliases'` (`types/config-file-entity.ts`), `ALIASES_PREFIX = 'aliases/'` (`constants/publications-core.ts`; the bucket is part of the path)
- [x] 1.2 Add `models/dial/alias.ts` (`DialAliasResource`, `AliasPresentAs`, `AliasTargetType`) and `constants/aliases.ts` holding the present-as compatibility table and the name pattern `^[A-Za-z0-9._-]+$`
- [x] 1.3 Add all i18n per design D8: `MenuI18nKey.PlatformAliases`; `Alias` entries in `DeleteI18nKey` (entity + `BulkDelete.Aliases`), `DuplicateI18nKey`, `UpdateI18nKey`, `CreateI18nKey`; `FileManagerI18nKey.Aliases`, `Alias`, `AliasesEmptyStateTitle`, `AliasesEmptyStateDescription`; the new `AliasI18nKey` section (target, target type, present-as and their option labels, picker headers, name validation message, banner texts) — each with its matching entry in `locales/en.ts`; reuse `BasicI18nKey`, `ButtonsI18nKey`, `AssetTabsI18nKey`, `EntitiesI18nKey` where a label already exists
- [x] 1.4 Unit tests: every new i18n enum key resolves in `locales/en.ts` (extend the existing locale spec in `locales/tests/`), and the present-as table / name pattern constants

## 2. Server: alias API and actions

- [x] 2.1 Register `ResourceType.ALIAS` in `AssetApi`'s type maps as a dual-bucket flat resource (design D3): add it to `FOLDER_NESTED_VERSIONLESS_TYPES`, exclude it from `VersionedResourceType` (`constants/assets-core.ts`), and leave it out of `PLATFORM_BUCKET_RESOURCE_TYPES` and `RESOURCE_CONTROLLER_TYPES`; no dedicated client class
- [x] 2.2 Add `mergeAliasResource` in `server/core/asset-metadata.ts` (folder-path parse via `parseEncodedFolderPath`, `splitValidityFields`, bucket-qualified `_metadata.path`/`folderId`) and register it in `ASSET_MERGERS`; make `toResourceInfo` give alias rows `name` = last segment and `path` = `<bucket>/<name>`
- [x] 2.3 Add `ConfigFileEntityType.Aliases` to `READABLE_CONFIG_FILE_TYPES` (`constants/config-file-core.ts`) and `CONFIG_FILE_ENTITY_TYPE_BY_VIEW` (`utils/files/root-folder.ts`), and register `AssetsAliases` in the dual-bucket views list
- [x] 2.4 Add `app/[lang]/assets-aliases/actions.ts` (`getAliases`, `getAlias`, `createAlias`, `updateAlias`, `deleteAlias`, `bulkDeleteAliases`, `getConfigFileAliases`): body built from the nine-field allow-list (design D3), `If-None-Match: *` on create, `validationFailure` for the name pattern, a Platform-only name-clash pre-check (names of models, applications, toolsets, interceptors, routers and aliases from the platform and config-file readers, design D7) for create and duplicate, Core's rejection text passed through verbatim
- [x] 2.5 Unit tests for `alias-api`, the merge function, the allow-list body builder (no `_metadata`, `status` or `validationWarnings`), the actions (create refuses an existing name; a Platform name taken by a model, application, toolset, interceptor, router or alias is refused before the `PUT`; a Public name is not pre-checked; delete only touches the alias) and the config-file client for `aliases` (list, read one, `keys` still refused)

## 3. Flat Public source in the shared listing

- [x] 3.1 In `utils/files/asset-sources.ts` split `PUBLIC_SOURCE_VIEWS` into `PUBLIC_TREE_VIEWS` and `FLAT_PUBLIC_VIEWS` with `hasPublicTree` / `hasFlatPublic`; keep `hasPublicSource` as their union; make `getAvailableSources` return `[Platform, Public, ConfigFile]` (admin) / `[Platform]` (unit mode) for a flat-Public view, `getDefaultSource` return Platform for it, and `getHeaderCount` sum all three counted sources
- [x] 3.2 In `TabbedAssetList.tsx` read the Public source through `useFlatAssets` for a flat-Public view, badge its tab, and show the Create button on the Platform and flat-Public tabs; in `FlatAssetGrid/readers.ts` add the Public `list` per bucket
- [x] 3.3 Unit tests: table-driven over every `ApplicationRoute` for `getAvailableSources`, `getDefaultSource`, `parseSourceParam`, `getHeaderCount` (Applications and Toolsets unchanged byte-for-byte), plus `TabbedAssetList` specs for the Aliases tab order, badges, header sum, Create on the flat Public tab and the unit-mode single source

## 4. Alias list, create, duplicate and delete

- [x] 4.1 Add `context/assets/AliasesFolderContext.tsx` and register it in `context/assets/AssetFolderProviders.tsx`
- [x] 4.2 Add `components/Assets/Entities/Aliases/List.tsx` (ten lines, `TabbedAssetList view={AssetsAliases}`) and `app/[lang]/assets-aliases/page.tsx`
- [x] 4.3 Register `AssetsAliases` in the per-entity registries: `BaseAssetList/types.ts` and `utils.tsx` (titles, empty state, folder hook, getter, create, bulk delete), `Assets/utils.ts`, `Assets/Modals/utils.tsx`, `Assets/Platform/utils.ts`, `Common/FileManager/utils.ts`, `EntityView/Modals/Delete/utils.ts`, `ListView/constants.ts`; no share/publish/copy/move/version/folder action registered
- [x] 4.4 Add `Entities/Aliases/CreateProperties.tsx` (name, target type, target, present-as; validation per the spec) and make the Create flow write to the active tab's bucket; duplicate keeps the definition under a new name in the same bucket
- [x] 4.5 Unit tests: List/registry wiring, Create modal validation (slash blocked, missing target), create bucket follows the tab, duplicate, single and bulk delete, read-only admin sees no mutating action, config.json tab row actions

## 5. Menu, breadcrumbs and docs

- [x] 5.1 Add the `Aliases` item after Translators in the AI Gateway group of `Menu/menu-configuration.tsx`, its icon in `Menu/menu-item-icons.tsx`, and the `AssetsAliases` breadcrumb in `Breadcrumbs/constants.ts`
- [x] 5.2 Update `docs/MENU-DOCUMENTATION.md` with the item and `docs/org-units-access.md` with Aliases under "Hidden in unit mode"
- [x] 5.3 Unit tests: update `Menu/tests/menu-configuration.spec.ts` ordering, assert `getRouteNamespace('/assets-aliases')` is undefined and the item is dropped by `filterMenuForUnitMode` (`utils/org-units/tests/menu.spec.ts`), and the breadcrumb entry

## 6. Generalised entity picker

- [x] 6.1 Add `EntitySelectType.Toolset` and `EntitySelectType.Model` with their `ENTITY_SELECT_CONFIGS` entries (`Common/EntitySelectInput/constants.ts`, `models.ts`); add the toolset and model prefixes if missing
- [x] 6.2 Change the `EntitySelectManager` tabbed-vs-tree gate to "tabbed whenever a selection callback is supplied" (design D5.2) and add `onChangeSelectedEntity` single-selection mode to `TabbedEntityPicker` (selection on one tab replaces the others; add `isSingleSelect` to `FlatAssetGrid`, which is hard-wired to `MULTI_ROW_SELECTION`; `PublicEntityTree` already has a single-path mode)
- [x] 6.3 Add `Common/EntitySelectInput/SelectEntitiesPopup.tsx` (props `entityType`, `isSingle`, optional `header`, `onApply`) and reduce `Roles/AddApplicationsPopup.tsx` to a thin multi-select wrapper over it
- [x] 6.4 Add `toAliasTargetPath` / `parseAliasTargetPath` utils (design D5.5) beside the alias components
- [x] 6.5 Unit tests: the manager keeps Skill and File on the tree; Model offers two tabs; single selection replaces across tabs and reports at most one entity; multi-selection for role limits unchanged (existing `AddApplicationsPopup` and `Entities` specs still pass); path mapping round-trips and leaves an unparseable path unchanged

## 7. Alias detail view

- [x] 7.1 Add `app/[lang]/assets-aliases/[id]/page.tsx` (id `public/<name>` or `platform/<name>`; config.json aliases through the existing config-file detail route) and `Entities/Aliases/View/{View,TabsContent}.tsx` with Properties and JSON tabs, saving through `updateAlias` with the loaded etag
- [x] 7.2 Add `Entities/Aliases/View/Properties.tsx`: read-only name and display fields; `View/Target.tsx` holds `TargetField` (target type select, picker through `SelectEntitiesPopup`, present-as options derived from the table, unparseable path shown as text)
- [x] 7.3 Make the config.json alias view fully read-only with no Save or Delete
- [x] 7.4 Unit tests: Properties fields, present-as options per target type and the default, type change clears the target, save body contains only accepted fields, 412 handling, config.json read-only

## 8. Broken-alias reporting

- [x] 8.1 Read the viewed alias's entry from `/v1/admin/health/config` `skipped: [{id, reason}]` on the detail page (admin only), matching `aliases/<name>` or `aliases/public/<name>` and add `Entities/Aliases/View/InvalidAliasBanner.tsx` (`InvalidModelBanner` is the template) listing `validationWarnings` (`field`, `message`) for `status: invalid`, the `alias_target_missing` / `alias_target_incompatible` messages, and any other reason as Core's text; never blocks editing
- [x] 8.2 Unit tests: invalid blob lists warnings, each health reason maps to its message, healthy alias shows no banner, fields stay editable under the banner

## 9. Final quality checks

- [x] 9.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test` from `apps/ai-dial-admin/`, and fix everything they report

- [x] 10.1 Rework per review: the create modal is a separate two-step wizard component, `CreateAliasModal` (ID, display name, display version, description; then target), the details view drops the callable name and gains Target and Roles tabs (`AssetRoles`, as Models), and the now-unused i18n keys and `callable-name` util are removed
