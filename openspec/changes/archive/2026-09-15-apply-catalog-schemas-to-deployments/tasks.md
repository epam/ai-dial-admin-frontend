## 1. Models, constants and the Core read

- [x] 1.1 Add `catalogSchemaId?: string` and `catalogProperties?: Record<string, unknown>` to
  `DialInterceptorResource`, `DialPlatformApplicationResource` and `DialPlatformToolsetResource`
  (`models/dial/resource.ts`). `DialModelResource` already declares both (line 133, added in #4058)
  — leave the declaration, it becomes live in group 6.
- [x] 1.2 Add a `CatalogSchemaOption` model (`$id`, `dial:catalogEntityType`,
  `dial:catalogDisplayName`) to `models/dial/catalog-schema.ts`, matching what
  `GET /v1/catalog_schemas/schemas` returns.
- [x] 1.3 Add `CatalogSchemasApi` (`server/core/catalog-schemas-api.ts`) with a `listSchemas` read of
  `v1/catalog_schemas/schemas`, register it in `app/api/api.ts` against `DIAL_CORE_API_URL`,
  following `AppRunnerSchemaApi`.
- [x] 1.4 Add a `getCatalogSchemaOptions` server action in a shared location the four surfaces can
  all import (e.g. `app/[lang]/platform-catalog-schemas/actions.ts`, which already owns this
  resource type), returning the option list or a failure the caller can surface.
- [x] 1.5 Unit tests for the new API client and action, following
  `server/core/tests/asset-api.spec.ts` and `platform-catalog-schemas/actions.spec.ts`.

## 2. Schema picker

- [x] 2.1 Add `CATALOG_SCHEMA_PICKER_COLUMNS` (id, display name, entity type) to
  `constants/grid-columns/grid-columns.tsx`, next to `PICKER_RUNNER_COLUMNS`. No author or
  updated-time column — the source read carries no metadata (design D2).
- [x] 2.2 Create `components/CatalogProperties/SelectCatalogSchemaModal.tsx` — `DialFormPopup` +
  `GridView` + `RadioButtonRenderer` + `SINGLE_ROW_SELECTION`, built the way
  `SourceField/Application/SelectAppRunnersModal.tsx` is. Do not modify the app-runner modal.
- [x] 2.3 Create `components/CatalogProperties/CatalogSchemaField.tsx` — 1.0 `DialSelectField` plus
  the button that opens the modal, plus open-in-new-tab to the selected schema's own detail page,
  following `SourceField/Application/AppRunners.tsx`. Clearing the field clears
  `catalog_schema_id`.
- [x] 2.4 Report a failed option read on the field itself rather than rendering an empty selectable
  list (spec scenario), reusing the `EntitiesI18nKey.OptionListPartial` pattern the Core-direct
  option lists already use.
- [x] 2.5 Component tests: both populations listed, exactly three columns, a mismatched entity kind
  still selectable, single selection, cleared selection, failed read reported, read-only admin
  cannot change the selection.

## 3. Values editor

- [x] 3.1 Create `components/CatalogProperties/CatalogPropertiesEditor.tsx`: passes the selected
  schema to the existing `SchemaUiRenderer` and writes the result back to `catalog_properties`, with
  an empty state when the schema declares no properties (design D3). No layer of our own around the
  renderer.
- [x] 3.2 Add the raw JSON view of `catalog_properties` alongside the form, the way the application
  parameters tab offers one, so a value the form renders awkwardly stays enterable.
- [x] 3.3 Component tests: values round-trip, an enumerated property renders a select, a nested
  object and an array render their own editors, empty state, and the JSON view edits the same object.
- [x] 3.4 Add a test asserting the stated limitation rather than leaving it undocumented: a schema
  declaring `dial:tab`/`dial:section`/`dial:widget`/`dial:file` still renders every property
  editable, and those declarations are untouched in the schema.

## 4. Validation

- [x] 4.1 Create `utils/catalog-schemas/validate-properties.ts` with
  `validateCatalogProperties(schema, values): CatalogSchemaValidationError[]`: required properties
  present, values matching declared type and enum, a value that arrived as a locale map carrying the
  schema's own `dial:defaultLocale` (default `en`), and a file-valued property holding something
  shaped like a DIAL file reference. Shape-check every value before use, as `validateCatalogSchema`
  does.
- [x] 4.2 Unit tests covering each rule, the clean case, and malformed input (non-object values,
  wrong types), following `utils/catalog-schemas/tests/validation.spec.ts`.

## 5. Wiring the four surfaces

- [x] 5.1 Add a `Catalog` tab to `EntityViewTab` and to `getTabsForAsset` for `PlatformModels`,
  `PlatformInterceptors`, `AssetsApplications` and `AssetsToolsets` (`utils/tabs/utils.ts`), per
  design D1, plus its i18n key and label.
- [x] 5.2 Render the schema picker (`CatalogSchemaField`) inside each surface's Properties tab —
  `Assets/Platform/Models/Properties`, `Assets/Platform/Interceptors/Properties`,
  `Assets/Apps/Properties`, `Assets/Toolsets/View/Properties` — the way the app-runner source field
  already sits there (design D1).
- [x] 5.3 Render `CatalogPropertiesEditor` in each surface's new `Catalog` tab from its
  `TabsContent`, with an empty state when no schema is selected — the way `Parameters` behaves for
  an application with no runner.
- [x] 5.4 Carry `catalog_schema_id`/`catalog_properties` through each surface's server actions — they
  must survive the payload-stripping each one does before a Core write
  (`platform-models`, `platform-interceptors`, `assets-applications`, `assets-toolsets` actions).
- [x] 5.5 Gate each surface's save on `validateCatalogProperties`, surfacing the errors the way each
  view already surfaces its own validation failures, and surface Core's `400` message unchanged for
  a user-bucket application or toolset (spec scenario).
- [x] 5.6 Component tests per surface: the picker appears in Properties, the `Catalog` tab appears
  and shows its empty state with no schema selected, the two fields round-trip, an invalid value
  blocks the save before any request, and a resource with no schema behaves exactly as before.
- [x] 5.7 Coverage for the tab-set change in `utils/tabs/tests/utils.spec.ts`.

## 6. Locale-map display fields

- [x] 6.1 Widen `displayName`/`description`/`intro` to `string | Record<string, string>` on the four
  resource models, and fix the type errors that surface at the call sites.
- [x] 6.2 Render a map value read-only in `DisplayNameControl`, `DescriptionControl` and
  `BaseControls/Intro` — showing the schema-independent default-locale value (or the first
  available) — and carry the map through the save untouched (design D5).
- [x] 6.3 Component tests: a map survives an unrelated edit, is not rendered as a serialized object,
  is not editable as text, and a plain string behaves exactly as before.

## 7. Config-file half of catalog schemas

- [x] 7.1 Add `ConfigFileEntityType.CatalogSchemas` to `READABLE_CONFIG_FILE_TYPES` and rewrite the
  deferral comment in `constants/config-file-core.ts`, which this change makes false.
- [x] 7.2 Add `ApplicationRoute.PlatformCatalogSchemas` to `CONFIG_FILE_ENTITY_VIEWS`
  (`constants/config-file-entity-views.ts`).
- [x] 7.3 Add `getConfigFileCatalogSchemas`/`getConfigFileCatalogSchema` actions
  (`platform-catalog-schemas/actions.ts`), following the App Runner pair.
- [x] 7.4 Create `components/Assets/Platform/CatalogSchemas/PageList.tsx` wrapping the list in
  `ConfigFileListSwap` + `ConfigFileEntityList` + `ConfigFilesToggle`, and point
  `app/[lang]/platform-catalog-schemas/page.tsx` at it, following the App Runners pair.
- [x] 7.5 Handle `configFile=true` on the detail page: read through the config-file action and render
  read-only, following `platform-app-runners/[id]/page.tsx`.
- [x] 7.6 Tests: the toggle renders on this view, the swapped
  list shows file-declared names with no mutating actions, a file-sourced detail view is read-only,
  and an unknown name is not found.

## 8. Review leftovers from the previous change

- [x] 8.1 Prefer the body's own `$id` in `mergeCatalogSchemaResource` (`server/core/asset-metadata.ts`),
  falling back to the decoded resource name only when the body declares none (design D7), with tests
  for both shapes. Leave `mergeAppRunnerResource` alone and note why in the code comment.
- [x] 8.2 Add preserved-keyword regression coverage for the third `SchemaGrid` caller —
  `components/TestSuites/EndpointSchema` — asserting that `format`, `dial:file` and nested
  `dial:meta` survive an edit there too.

## 9. Documentation

- [x] 9.1 Add the `Catalog` section to `docs/MENU-DOCUMENTATION.md`, listing its eight entries in
  menu order and following the shape of the eight sections already documented. Analytics stays
  missing — a pre-existing gap this change does not own.
- [x] 9.2 Add the catalog fields to any capability doc under `docs/` that enumerates what a model,
  application, toolset or interceptor detail view exposes, if one exists.

## 10. Verification and quality gate

- [ ] 10.1 Run the `spec-browser-verify` skill against this change's browser-observable scenarios on
  the running local app, and resolve every `fail` verdict before the change is considered complete.
- [x] 10.2 Run `npm run lint`, `npm run format`, `npm run typecheck` and the full `npm run test`
  suite from `apps/ai-dial-admin/`; fix any failures introduced by this change.
