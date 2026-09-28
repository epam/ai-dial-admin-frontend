## Why

`add-platform-catalog-schemas` shipped the surface that authors catalog schemas, and deliberately
stopped there: nothing in the console consumes one. A registered schema is display metadata waiting
for a deployment to point at it — DIAL Core has carried `catalog_schema_id` and `catalog_properties`
on every `Deployment` since `0.47.0` and validates the pairing — so today an admin can define the
shape of a catalog card and then has no way to fill one in.

This change closes that half, and with it the three smaller items the previous change left listed as
non-goals or review leftovers.

## What Changes

- On the four Core-direct deployment surfaces — `Catalog ▸ Models`, `Catalog ▸ Interceptors`,
  `Assets ▸ Applications`, `Assets ▸ Toolsets` — an admin can attach a catalog schema and edit the
  values it describes.
- A schema picker built the way the App Runner source field is built: a select with a button opening
  a single-select grid modal. Its options come from one Core read that returns both schema
  populations at once, listing each schema's id, display name, and the entity kind it was written
  for.
- A values editor driven by the chosen schema: fields grouped into the tabs and sections the schema
  names, in the order it declares, each rendered per its widget hint, with file-valued and
  multi-language fields getting controls of their own.
- Client-side validation of the values against the chosen schema before the write. This matters
  unevenly and the change says so: for a platform-bucket resource, invalid values break Core's
  merged configuration at assembly, so the client gate is the only thing standing in front of that;
  for a user-bucket application or toolset, Core validates on write and answers `400` itself.
- The config-file half of catalog schemas — the read-only population declared in Core's
  configuration file — becomes visible behind the existing `showConfigFiles` toggle, making catalog
  schemas the eighth type that surface covers.
- Deployment display fields (`displayName`, `description`, `intro`) stop being corrupted when they
  arrive as a locale map. Core accepts either a plain string or a `{locale: value}` map on these
  fields; the console types them as `string`, so a map renders as an object and is overwritten on
  the next save. This change preserves the map. It does **not** add an editor for it.
- `docs/MENU-DOCUMENTATION.md` gains its missing `Catalog` section.

Non-goals:

- **The entity (admin-backend) surfaces.** `Entities ▸ Models/Applications/Toolsets/Interceptors`
  carry the same two fields on the admin backend's own `Deployment`, and are still left out: that
  half of the console disappears entirely when `adminApiEnabled` is off, and thirteen capabilities
  have already migrated to reading Core directly. Building the editor twice to retire one copy is
  the wrong order of work.
- **Authoring multi-language display fields.** Preserving a locale map is in scope; offering a UI to
  create one is not. Core exposes `Config.defaultLocale` — the locale such a map is required to
  contain — through no endpoint at all, so the console cannot validate what it would let a user
  write. Catalog properties are unaffected: their default locale comes from the schema's own
  `dial:defaultLocale`.
- **Skills.** `Skill` does not extend `Deployment` on Core and has neither field.
- **The `Analytics` section of the menu documentation**, missing for the same reason `Catalog` was.
  Out of scope here, and noted so the next reader does not take its absence as an oversight of this
  change.

## Capabilities

### New Capabilities

- `catalog-properties-editing`: the mechanism shared by all four surfaces — the schema picker, the
  schema-driven values editor (tabs, sections, order, widgets, file fields, locale-map fields), the
  client-side validation that precedes a write, and the preservation of locale-map display fields.

### Modified Capabilities

- `platform-models`: the Catalog model detail view exposes the catalog section.
- `platform-interceptors`: the Catalog interceptor detail view exposes the catalog section.
- `platform-applications`: the platform-bucket application detail view exposes the catalog section.
- `platform-toolsets`: the platform-bucket toolset detail view exposes the catalog section.
- `platform-catalog-schemas`: the config-file population is no longer out of scope — its boundary
  requirement is replaced by the toggle behaviour the other covered views have; and a schema whose
  Core resource name differs from its own `$id` is no longer rewritten on read.
- `config-file-entity-views`: catalog schemas become the eighth covered type, with the toggle and the
  read-only detail view its requirements already describe for the other seven.

## Impact

- **New**: a `CatalogSection` (picker + editor + validation) under `components/Common/` or a
  catalog-specific folder, `SelectCatalogSchemaModal`, `CATALOG_SCHEMA_PICKER_COLUMNS` in
  `constants/grid-columns/grid-columns.tsx`, a `validateCatalogProperties` util, and a
  `catalogSchemasApi` read for `GET /v1/catalog_schemas/schemas`.
- **Touched, per surface**: four detail views plus their server actions and resource models.
  `catalogSchemaId`/`catalogProperties` already exist on `DialModelResource` (added in #4058) but are
  dead — no component reads them, no action writes them; the interceptor, platform-application and
  platform-toolset models need them added, and all four need them to survive a round-trip.
- **Shared, touched with care**: `SchemaUiRenderer` wraps ui-kit's `DialSchemaRenderer`, which
  understands neither `dial:file` nor `dial:meta` (verified — neither string appears in the shipped
  package). The grouping, ordering, widget and file behaviour therefore lives in our own layer around
  it rather than as changes to the shared wrapper, whose existing caller is the application
  parameters tab.
- **Shared, mechanical**: `READABLE_CONFIG_FILE_TYPES`, `CONFIG_FILE_ENTITY_VIEWS`, a `PageList`
  wrapper for the catalog-schema list, and the now-stale deferral comment in
  `constants/config-file-core.ts`.
- **Review leftovers from the previous change**: regression coverage for the third `SchemaGrid`
  caller (`TestSuites/EndpointSchema`), whose preserved-keyword behaviour changed with no test of its
  own; and the `$id`-versus-blob-name rewrite in `mergeCatalogSchemaResource`.
- **No backend work**: every endpoint and field this change needs already ships — Core `0.47.1` and
  the admin backend's own `Deployment` alike.
