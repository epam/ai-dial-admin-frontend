## Why

DIAL Core has carried a `catalog_schemas` resource type since `0.47.1` — a registered JSON-Schema
document describing the display metadata a catalog entity type exposes (`dial:catalogEntityType`,
`dial:catalogDisplayName`, and per-property presentation hints). Every deployment type can point at
one through `catalog_schema_id` and fill it in through `catalog_properties`, and Core validates that
pairing on write. The admin console has no surface for these schemas at all, so the only way to
register or edit one today is a hand-written `PUT` against Core — with no validation, since Core
stores this resource's body verbatim and checks nothing but the `$id`.

## What Changes

- A new `Catalog ▸ Catalog Schemas` list at `/platform-catalog-schemas`, placed directly after
  `App Runners`, backed by DIAL Core's `catalog_schemas/platform` resources with create, delete and
  bulk-delete — the same flat, Core-direct shape the other seven Catalog entities already have.
- A two-tab detail view: `Properties` (read-only `$id`, entity type, display name, default locale)
  and `Parameters` (the schema's own `properties`, edited in the shared schema grid).
- Client-side meta-schema validation blocking a save Core would accept but its config loader would
  then reject, mirroring what `platform-app-runners` already does for the app-runner meta-schema.
- The shared schema grid keeps `format`, `dial:file`, and nested `dial:meta` through an edit instead
  of dropping them, and gains optional columns for the catalog presentation hints (`dial:tab`,
  `dial:section`, `dial:widget`, `dial:localized`).

Non-goals, both deferred to a follow-up change:

- The config-file half of the population — `READABLE_CONFIG_FILE_TYPES`, the `showConfigFiles`
  toggle, and a `CONFIG_FILE_ENTITY_VIEWS` entry. Core's `/v1/admin/config/file/catalog_schemas`
  route exists and is unused by this change.
- The consumer side: selecting a catalog schema and editing `catalog_properties` on models,
  applications, toolsets, skills and interceptors. Without it this surface registers schemas that
  nothing in the console yet consumes, which is the deliberate first half of the work.

## Capabilities

### New Capabilities

- `platform-catalog-schemas`: the `Catalog ▸ Catalog Schemas` list + detail view — menu entry, flat
  create/delete list, `$id`-as-resource-name identity, a Properties/Parameters detail view over
  DIAL Core's `catalog_schemas/platform` resources, and the client-side meta-schema validation that
  substitutes for Core's absent write-time checks.

### Modified Capabilities

- `platform-app-runners`: its `Parameters` tab requirement gains the guarantee that editing a
  runner's parameters preserves the `dial`-prefixed schema extensions it does not render. The
  shared grid currently reconstructs each property from a fixed field set, so `format` and
  `dial:file` — which the app-runner meta-schema carries verbatim from the same definition the
  catalog meta-schema reuses — are silently dropped on save, and `dial:meta` survives only on
  first-level properties. Fixing the grid for catalog schemas fixes it for app runners, which makes
  this an observable behavior change to that capability rather than an implementation detail.

## Impact

- **New**: `app/[lang]/platform-catalog-schemas/` (list page, detail page, `actions.ts`),
  `components/Assets/Platform/CatalogSchemas/`, `context/assets/CatalogSchemasFolderContext.tsx`,
  a `DialCatalogSchemaResource` model, and a `validateCatalogSchema` util.
- **Core client**: `ResourceType.CATALOG_SCHEMA` registered end-to-end —
  `constants/publications-core.ts` (`CATALOG_SCHEMAS_PREFIX`, `RESOURCE_TYPE_PREFIX`),
  `constants/assets-core.ts` (`VersionedResourceType` exclusion, both URL maps,
  `PLATFORM_BUCKET_RESOURCE_TYPES`), and a merger in `server/core/asset-metadata.ts`. Several of
  these are total `Record<ResourceType, …>` maps, so the enum member does not compile without them.
- **Shared, touched with care**: `components/Common/SchemaGrid/` (round-trip fix + optional
  columns) is used by App Runners and Interceptors — the fix is a correctness change for both, and
  the new columns follow the existing "callback supplied → column rendered" pattern rather than
  adding catalog-specific branching. `components/Common/FileManager/utils.ts` needs the same
  URI-shaped-name exceptions App Runners already has, since the row name is a `$id`.
- **Shared, mechanical**: the per-view maps and switches every flat platform entity registers in —
  `FLAT_PLATFORM_VIEWS`, `BaseAssetList/utils.tsx`, `Assets/utils.ts`, `Assets/Modals/utils.tsx`,
  `EntityView/Modals/Delete/utils.ts`, `utils/is-view.ts`, `utils/open-in-new-tab.ts`,
  `utils/entities/*`, `Breadcrumbs/constants.ts`, `Menu/menu-configuration.tsx`, `constants/i18n.ts`,
  `locales/en.ts`, and the folder-context mock in `test-setup.tsx`.
- **Shared, extracted**: the `$id`-to-resource-name helpers in `utils/app-runners/` (`toCoreRunnerName`,
  `fromCoreRunnerName`, `hasUnencodableRunnerIdChars`, `CORE_UNENCODABLE_ID_CHARS`) become
  two-consumer utilities; the rule they encode belongs to Core's schema resources, not to runners.
- **Docs**: the comment in `constants/config-file-core.ts` asserting catalog schemas have "no
  admin-console surface of its own" stops being true and must say the config-file half is deferred.
- **No backend work**: every endpoint this change needs ships in Core `0.47.1`.
