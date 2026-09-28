## 1. Core wiring: enum, route, model, shared helpers

- [x] 1.1 Extract the `$id`-to-resource-name helpers from `utils/app-runners/` to a neutral
  `utils/core-schemas/` (per design D2): `toCoreSchemaResourceName`, `fromCoreSchemaResourceName`,
  `hasUnencodableSchemaIdChars`, `CORE_UNENCODABLE_ID_CHARS`. Re-point every app-runner import
  (`app/[lang]/platform-app-runners/actions.ts`, `utils/app-runners/validation.ts`,
  `server/core/asset-metadata.ts`, `components/Assets/Platform/AppRunners/CreateProperties.tsx`,
  and their specs) and move the existing tests from `utils/app-runners/tests/` alongside.
- [x] 1.2 Add `ResourceType.CATALOG_SCHEMA = 'CATALOG_SCHEMA'` to `types/resource-type.ts`.
- [x] 1.3 Add `ApplicationRoute.PlatformCatalogSchemas = '/platform-catalog-schemas'` to
  `types/routes.ts`, grouped with the other `// Platform entities` members.
- [x] 1.4 Register the type end-to-end so the total `Record<ResourceType, …>` maps compile:
  `constants/publications-core.ts` (`CATALOG_SCHEMAS_PREFIX = 'catalog_schemas/platform/'` —
  Core's `urlSegment` has no alias here, unlike `schemas`; plus `RESOURCE_TYPE_PREFIX`), and
  `constants/assets-core.ts` (`VersionedResourceType` exclusion, `CORE_RESOURCE_URL`,
  `CORE_RESOURCE_METADATA_URL`, `PLATFORM_BUCKET_RESOURCE_TYPES`).
- [x] 1.5 Add `mergeCatalogSchemaResource` + its `ASSET_MERGERS` entry to
  `server/core/asset-metadata.ts`, following `mergeAppRunnerResource` (the `$id`-decoding name
  branch applies here too — extend the `type === APP_TYPE_SCHEMA` check to cover both schema types).
- [x] 1.6 Add `ApplicationRoute.PlatformCatalogSchemas` to `FLAT_PLATFORM_VIEWS`
  (`utils/files/root-folder.ts`), directly after `ApplicationRoute.PlatformAppRunners`.
- [x] 1.7 Add `CatalogEntityType` (model, agent, toolset, skill, interceptor) and
  `CatalogPropertyWidget` (text, richText, badge, chips, url, boolean, image, date) enums plus the
  default-locale pattern to a new `constants/catalog-schemas.ts` (per design D9 — enums, not
  string-literal unions; constants file separate from models).
- [x] 1.8 Add `DialCatalogSchemaResource` to `models/dial/resource.ts` (`$id`,
  `dial:catalogEntityType`, `dial:catalogDisplayName`, `dial:defaultLocale?`, `properties?`,
  `required?`, plus `name`/`path`/`folderId`/`author?`/`status?`/`validationWarnings?`) and add it to
  the `PlatformAsset` union.
- [x] 1.9 Add `CATALOG_SCHEMA`/`PlatformCatalogSchemas` cases to the `ApplicationRoute` and
  `ResourceType` union types the seven existing flat-platform entities are already listed in —
  `components/Assets/BaseAssetList/types.ts` (`BaseAssetRoute`, `CreateAssetRoute`),
  `constants/assets-core.ts`'s platform-asset type, and
  `server/publications/resolver/types.ts` if its union is total.
- [x] 1.10 Unit tests for the extracted helpers' new location and for
  `mergeCatalogSchemaResource`, following `server/core/tests/asset-metadata.spec.ts`.

## 2. Shared schema grid: lossless round-trip

- [x] 2.1 In `components/Common/SchemaGrid/utils.ts`, carry `format` and `dial:file` through
  `convertPropertyToField` → `SchemaFieldRow` → `fieldsToJsonSchema` so they survive an edit
  (design D3). Applies at every nesting depth.
- [x] 2.2 In the same file, read and write `dial:meta` at every nesting depth instead of only when
  `parentId === null`, preserving nested metadata untouched. Editable columns stay first-level-only
  — preserve everywhere, author at the top level.
- [x] 2.3 Unit tests in `components/Common/SchemaGrid/tests/utils.spec.ts`: a schema carrying
  `format`, `dial:file`, and nested `dial:meta` round-trips byte-identically through
  `jsonSchemaToFields` → `fieldsToJsonSchema`, including after an unrelated field edit.
- [x] 2.4 Regression coverage for the existing callers (design risk 1). Corrected during
  implementation: `SchemaGrid`'s editing callers are the platform App Runners Parameters tab, the
  entity-side App Runners Parameters tab, and the Test Suites endpoint schema — Interceptors are
  *not* a caller (their parameter schema is a different component,
  `Interceptors/View/ParameterSchema`), so the design's "App Runners and Interceptors" pairing was
  wrong. Cover that an App Runner Parameters edit preserves the declarations
  (`components/Assets/Platform/AppRunners/tests/Parameters.spec.tsx`) and add an app-runner-shaped
  fixture (carrying `dial:propertyKind` alongside `dial:file`) to the grid's own round-trip tests.

## 3. Shared schema grid: catalog presentation-hint columns

- [x] 3.1 Add optional `Tab`, `Section`, `Widget`, and `Localized` columns to
  `components/Common/SchemaGrid/columns.tsx`, each appended only when its `onChange` callback is
  supplied — the mechanism `Order`/`Property kind` already use. Tab/section are text, widget is a
  select over `CatalogPropertyWidget`, localized is a boolean toggle. First-level rows only, like
  `Order`.
- [x] 3.2 Add the matching `onChangeTab`/`onChangeSection`/`onChangeWidget`/`onChangeLocalized`
  handlers to `components/Common/SchemaGrid/SchemaGrid.tsx`, writing into `dialMeta` exactly as
  `onChangeOrder` does. Refined during implementation: the component's `isDialSchema` boolean became
  `metaColumns?: SchemaMetaColumn[]` (new `models.ts` enum + `constants.ts` sets), so the caller
  names which meta columns its schema kind has instead of the grid branching on a second boolean —
  keeping design D3's "no isCatalog flag" while letting the catalog set omit `Property kind`. The two
  existing callers now pass `APP_RUNNER_META_COLUMNS`. `onChangeOrder`/`onChangePropertyKind` were
  folded into one shared `dial:meta` writer while adding the four new ones.
- [x] 3.3 Confirm App Runners and Interceptors render unchanged because they supply none of the new
  callbacks, and that a catalog caller supplying no `onChangePropertyKind` gets no `Property kind`
  column.
- [x] 3.4 Component tests for the new columns: present when callbacks are supplied, absent
  otherwise, and each edit landing in the right `dial:meta` key.

## 4. Validation util

- [x] 4.1 Create `utils/catalog-schemas/validation.ts` with
  `validateCatalogSchema(schema): CatalogSchemaValidationError[]` enforcing design D5's rules:
  non-blank `$id`, entity type within `CatalogEntityType`, non-blank display name, default locale
  matching the BCP-47 pattern when present, and a file-valued property carrying the string type and
  encoded-file format. Shape-check every field before use so malformed JSON from the raw editor
  produces a message, not a `TypeError`.
- [x] 4.2 Unit tests in `utils/catalog-schemas/tests/validation.spec.ts` covering each rule, the
  clean case, and non-object/wrong-type inputs, following
  `utils/app-runners/tests/validation.spec.ts`.

## 5. Server actions

- [x] 5.1 Create `app/[lang]/platform-catalog-schemas/actions.ts` with `toCatalogSchemaPayload`
  (stripping `name`, `status`, `validationWarnings`, `path`, `folderId`, `author`, timestamps — per
  design D6), an `$id`-presence/forbidden-character guard, and
  `getCatalogSchemas`/`getAllCatalogSchemas`/`createCatalogSchema`/`getCatalogSchema`/
  `updateCatalogSchema`/`removeCatalogSchema`/`bulkDeleteCatalogSchemas` against
  `ResourceType.CATALOG_SCHEMA`, following `platform-app-runners/actions.ts`. No resolved-schema and
  no config-file action (design D4, D10).
- [x] 5.2 Unit tests in `platform-catalog-schemas/actions.spec.ts` covering the payload stripping,
  the `$id` guards, and each action's call shape (path construction, conditional etag on
  update/delete), following `platform-app-runners/actions.spec.ts`.

## 6. Menu, i18n, breadcrumbs, folder context

- [x] 6.1 Add `MenuI18nKey.PlatformCatalogSchemas` to `constants/i18n.ts` and its `Catalog Schemas`
  label to `locales/en.ts`, plus the entity-type, widget, and validation-message keys the new views
  need.
- [x] 6.2 Add the `Catalog Schemas` item to the Catalog group in
  `components/Menu/menu-configuration.tsx`, directly after `PlatformAppRunners` (before
  `PlatformRoles`).
- [x] 6.3 Add a `PlatformCatalogSchemas` breadcrumb entry to `components/Breadcrumbs/constants.ts`
  plus its `Id` segment, following the `PlatformAppRunners` shape.
- [x] 6.4 Create `context/assets/CatalogSchemasFolderContext.tsx` following
  `AppRunnersFolderContext.tsx`, mount `CatalogSchemasFolderProvider` in `app/[lang]/layout.tsx`
  alongside the other asset folder providers, and add its mock to `test-setup.tsx`.
- [x] 6.5 Add `ApplicationRoute.PlatformCatalogSchemas` to `components/ListView/constants.ts`
  (page-title key) and `components/EntityHeaderControls/JsonToggle/JsonToggleWithFormats.tsx` (raw
  JSON editor availability).

## 7. List view

- [x] 7.1 Create `components/Assets/Platform/CatalogSchemas/List.tsx` — a thin `BaseAssetList`
  wrapper for `ApplicationRoute.PlatformCatalogSchemas`, following
  `Assets/Platform/AppRunners/List.tsx` (metadata-only columns per design D8).
- [x] 7.2 Create `app/[lang]/platform-catalog-schemas/page.tsx`. Corrected during implementation:
  no `PageList.tsx` — App Runners only has one because it wraps the list in `ConfigFileListSwap`,
  which this change defers (D10), so the page renders `List` directly the way
  `platform-translators/page.tsx` does.
- [x] 7.3 Wire the route into the shared asset-list infrastructure:
  `AssetFolderContextMap`/`GetAssetActionMap`/`CreateAssetActionMap`/`BulkDeleteAssetActionMap`
  (`components/Assets/BaseAssetList/utils.tsx`), the toolbar/empty-state/action-label switches in
  `components/Assets/utils.ts`, `components/Assets/Modals/utils.tsx` (create-modal field set), and
  `components/EntityView/Modals/Delete/utils.ts` (delete-modal copy) — matching the entries each
  already carries for `PlatformAppRunners`. Deliberately no duplicate-action entry (design D7).
- [x] 7.4 Extend the URI-shaped-name exceptions in `components/Common/FileManager/utils.ts` (the
  `CONTROL_CHARS_ONLY_REGEXP` and name-validity branches currently keyed on `PlatformAppRunners`) to
  cover the new route, plus `utils/is-view.ts`, `utils/open-in-new-tab.ts`,
  `utils/entities/is-simple-entity.ts`, `create-entity.ts`, and `update-entity.ts`.
- [x] 7.5 Component tests for `List.tsx` and `PageList.tsx`, plus coverage in
  `Assets/tests/utils.spec.ts`, `BaseAssetList/tests/utils.spec.ts`, `utils/tests/is-view.spec.ts`,
  `utils/tests/open-in-new-tab.spec.ts`, and `utils/files/tests/root-folder.spec.ts` for the new map
  entries — including the no-duplicate carve-out and the URI-shaped-name exception.

## 8. Detail view

- [x] 8.1 Create `components/Assets/Platform/CatalogSchemas/models.ts` with the props/change-handler
  interfaces, following `Assets/Platform/AppRunners/models.ts`.
- [x] 8.2 Create `components/Assets/Platform/CatalogSchemas/CreateProperties.tsx` — `$id` (URL
  validation plus the inline forbidden-character error), entity-type select, display name — and wire
  it into `components/EntityMainProperties/Properties/Properties.tsx` ahead of `isSimpleEntity` for
  the new route, following the `PlatformAppRunners` branch.
- [x] 8.3 Create `components/Assets/Platform/CatalogSchemas/Properties.tsx`: `ResourceInfoHeader`,
  read-only `$id`, entity-type select over `CatalogEntityType`, required display name, optional
  default locale with its pattern validation.
- [x] 8.4 Create `components/Assets/Platform/CatalogSchemas/Parameters.tsx` — `SchemaGrid` over the
  loaded resource with the four catalog callbacks supplied and no `onChangePropertyKind`, an empty
  state when the schema declares no properties, and no resolved-schema read (design D4).
- [x] 8.5 Create `components/Assets/Platform/CatalogSchemas/TabsContent.tsx` rendering exactly the
  `Properties` and `Parameters` tabs.
- [x] 8.6 Add a `PlatformCatalogSchemas` branch to `getTabsForAsset` (`utils/tabs/utils.ts`)
  returning `[propertiesTab(t), parametersTab(t)]`.
- [x] 8.7 Create `components/Assets/Platform/CatalogSchemas/View.tsx` (etag/discard/save/JSON-editor
  wiring, the `validateCatalogSchema` save gate for both the form and the raw editor, success/error
  notifications), following `Assets/Platform/AppRunners/View.tsx`. Corrected during implementation:
  surfacing Core's `invalid` status and `validationWarnings` was dropped from this task and its
  scenario removed from the spec delta — no platform entity renders them today (App Runners included)
  and there is no shared surface to hang them on, so building one is its own change.
- [x] 8.8 Create `app/[lang]/platform-catalog-schemas/[id]/page.tsx`, reading identity from
  `params.id` with no `?path=` query param, following `platform-app-runners/[id]/page.tsx`.
- [x] 8.9 Component tests for `CreateProperties.tsx`, `Properties.tsx`, `Parameters.tsx`,
  `TabsContent.tsx`, and `View.tsx` (including the two-tab set, the blocked save on each validation
  rule, and the conflict-message path), plus `utils/tabs/tests/utils.spec.ts` coverage for the new
  tab branch.

## 9. Docs

- [x] 9.1 Rewrite the `CatalogSchemas` exclusion comment in `constants/config-file-core.ts` (design
  D10): the surface now exists, and the config-file half is deferred to a follow-up change rather
  than absent by design.
- [x] 9.2 Added the row to `.claude/reference/areas.md`'s `Catalog` table.
  `docs/MENU-DOCUMENTATION.md` turned out to have no Catalog section at all — it documents Entities,
  Builders, Assets, Deployments, Access Management, Approvals, Evaluation and Audit only — so the
  whole group is already undocumented there. Writing that section is a bigger, pre-existing gap than
  this change owns; left alone deliberately.

## 10. Quality gate

- [x] 10.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, and the full `npm run test`
  suite from `apps/ai-dial-admin/`; fix any failures introduced by this change.

Note: this change has browser-observable scenarios (menu order, tab set, create-modal fields,
URI-shaped row names), but a dedicated `spec-browser-verify` task was declined by the user for this
change — coverage relies on the unit and component tests in groups 1-9 instead.
