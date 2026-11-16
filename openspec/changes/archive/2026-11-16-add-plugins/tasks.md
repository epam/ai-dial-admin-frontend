All groups below ship together in a single PR; the numbering is the implementation order, not a PR split.

## 1. Foundations: types, constants, route and i18n

- [x] 1.1 Add `ApplicationRoute.PlatformPlugins = '/platform-plugins'` (`types/routes.ts`), `ResourceType.PLUGIN` (`types/resource-type.ts`), `ConfigFileEntityType.Plugins = 'plugins'` (`types/config-file-entity.ts`), and the `plugins/` prefix entry in `constants/publications-core.ts`
- [x] 1.2 Add the plugin resource type (`DialPluginResource`: `type`, `settings`, plus the merge graft) next to `DialTranslatorResource` in `models/dial/resource.ts`
- [x] 1.3 Add all i18n: `MenuI18nKey.PlatformPlugins`; `Plugin` entries in `DeleteI18nKey` (entity + `BulkDelete.Plugins`), `CreateI18nKey`, `UpdateI18nKey`; `FileManagerI18nKey.Plugins`, `Plugin` and empty-state title/description; a `PluginI18nKey` section (type label and placeholder, settings label, no-secrets hint, preview notice, type-required and slash-in-name messages) — each with its `locales/en.ts` entry; reuse existing generic keys where one fits
- [x] 1.4 Unit tests: every new i18n enum key resolves in `locales/en.ts` (extend the existing locale spec)

## 2. Server: plugin API and actions

- [x] 2.1 Register `ResourceType.PLUGIN` like `TRANSLATOR` in `constants/assets-core.ts` (flat, versionless, `PLATFORM_BUCKET_RESOURCE_TYPES`, content and metadata path maps), and add `ConfigFileEntityType.Plugins` to `READABLE_CONFIG_FILE_TYPES` (`constants/config-file-core.ts`)
- [x] 2.2 Add `mergePluginResource` in `server/core/asset-metadata.ts` (via `flatMetadataFields`) and register it in `ASSET_MERGERS`
- [x] 2.3 Add `app/[lang]/platform-plugins/actions.ts` (`getPlugins`, `createPlugin`, `getPlugin`, `updatePlugin`, `removePlugin`, `bulkDeletePlugins`, `getConfigFilePlugins`, `getConfigFilePlugin`) with `toPluginPayload` sending only `type` and `settings`, and the plugin resource name read from `name` or `_metadata.name`
- [x] 2.4 Unit tests: the merge function, `toPluginPayload` (no `name`, timestamps or `_metadata`), the actions (create sends `If-None-Match: *`, update carries the ETag, bulk delete touches only plugins, Core's rejection text passes through verbatim) and the config-file client for `plugins`

## 3. Plugin list, create and delete

- [x] 3.1 Add `context/assets/PluginsFolderContext.tsx` and register it in `context/assets/AssetFolderProviders.tsx`
- [x] 3.2 Add `components/Assets/Platform/Plugins/List.tsx` (`TabbedAssetList view={PlatformPlugins}`) and `app/[lang]/platform-plugins/page.tsx`
- [x] 3.3 Register `PlatformPlugins` in the per-entity registries Translators uses: `BaseAssetList/types.ts` and `utils.tsx` (title, empty state, folder hook, getter, create, bulk delete), `FlatAssetGrid/readers.ts`, `Assets/utils.ts`, `Assets/Modals/utils.tsx`, `Assets/Platform/utils.ts`, `Common/FileManager/utils.ts`, `EntityView/Modals/Delete/utils.ts`, `ListView/constants.ts`, `EntityHeaderControls/JsonToggle/JsonToggleWithFormats.tsx`, `utils/entities/create-entity.ts`; no duplicate, move, share, publish or folder action
- [x] 3.4 Add `Plugins/CreateProperties.tsx` (`IdControl` name blocked on `/`, required trimmed `type`, `settings` via `JsonEditorInput` defaulting to `{}`, `FieldCaveat` hint) and branch to it in `EntityMainProperties/Properties/Properties.tsx` ahead of `isSimpleEntity`
- [x] 3.5 Unit tests: List and registry wiring, create form validation (type required, slash in name, taken name, `settings` default), create navigates to the detail view, single and bulk delete, read-only admin sees no mutating action, config.json tab row actions

## 4. Plugin detail view

- [x] 4.1 Add `app/[lang]/platform-plugins/[id]/page.tsx` (config-file mode and Platform mode, `notFound()` on a missing entity)
- [x] 4.2 Add `Plugins/View.tsx`, `Properties.tsx` and `TabsContent.tsx` (info header, shared field set with `isModal={false}`, preview notice, JSON toggle, change tracking, save and discard, read-only for a config-file source) (the default Properties-only tab list already applies, so `utils/tabs/utils.ts` is unchanged)
- [x] 4.3 Unit tests: View (change tracking, discard restores, save success refreshes, `422` shows Core's message and keeps edits, config-file source read-only), Properties (two fields, no Roles tab, name not editable, hint is keyboard-reachable, preview notice shown), TabsContent

## 5. Menu, breadcrumbs, docs and specs

- [x] 5.1 Insert `PlatformPlugins` between `PlatformTranslators` and `PlatformAliases` in `Menu/menu-configuration.tsx`, add its icon in `Menu/menu-item-icons.tsx`, and add the breadcrumb entry in `Breadcrumbs/constants.ts`
- [x] 5.2 Unit tests: menu order (`Translators`, `Plugins`, `Aliases`), the icon registry, breadcrumb root and detail, unit mode hides Plugins and `getRouteNamespace` returns `undefined` for the route
- [x] 5.3 Update `docs/MENU-DOCUMENTATION.md` (Plugins item after Translators) and `docs/org-units-access.md` (Plugins in the "Hidden in unit mode" list)

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test` suite, and fix what they report
