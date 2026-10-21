# core-resource-entity-metadata — `_metadata` object on Core resource detail entities

## ADDED Requirements

### Requirement: Merged Core-resource detail entities carry a `_metadata` object

The system SHALL populate a `_metadata` object on every merged Core-resource detail entity — the
`getMerged`/`getMergedWithEtag` reads of the twelve `ASSET_MERGERS` types (application-resource,
toolset-resource, conversation, prompt, model, app-runner, catalog-schema, interceptor,
translator, route, role, project-key) and the single-skill read — holding every field the merge
layer grafts that is not resource content: `author`, `createdAt`, `updatedAt`, `name`, `path`,
`folderId`, `version`, `nodeType`, `status`, and `validationWarnings`. Timestamps SHALL be
formatted through the existing merge formatters (epoch-millisecond numbers converted to strings).
The `_metadata` object is frontend-constructed and temporary: it is never sent to Core and never
persisted.

#### Scenario: A merged detail entity nests all grafted helpers under `_metadata`

- **WHEN** any of the twelve asset-merger types or a single skill is read through the merged
  detail flow
- **THEN** the returned entity carries `author`, `createdAt`, `updatedAt`, `name`, `path`,
  `folderId`, `version` (where the type has one), `nodeType`, and — where Core serves them —
  `status`/`validationWarnings` inside a single `_metadata` object, and carries no flat copy of
  those grafts outside it

#### Scenario: Types Core serves without status or warnings omit them from `_metadata`

- **WHEN** a type whose content response carries no `status` projection (e.g. a project key) is
  merged
- **THEN** its `_metadata` carries no `status`/`validationWarnings` keys, and the read succeeds

### Requirement: `_metadata` values are sourced from the metadata response first, then the original resource

`author`, `createdAt`, and `updatedAt` SHALL be sourced from the metadata response's item node;
where the metadata response does not supply a value, the system SHALL fall back to the original
resource's own inline field — snake_case `created_at`/`updated_at` for public-bucket
applications and toolsets alike, which Core's
`ApplicationService`/`ToolSetService` graft from the blob metadata at serve time.

#### Scenario: Metadata response wins for a public-bucket application

- **WHEN** a public-bucket application whose content response inlines `author`/`created_at`/
  `updated_at` is merged with a metadata response that also carries them
- **THEN** `_metadata.author`, `_metadata.createdAt`, and `_metadata.updatedAt` hold the metadata
  response's values

#### Scenario: Inline resource fields back up a metadata gap

- **WHEN** a merged resource's metadata response omits a timestamp that its content response
  inlines
- **THEN** `_metadata` carries the inlined value rather than leaving the field undefined

### Requirement: Resource content is never mutated by the merge

Fields the original resource response carries SHALL remain on the merged entity exactly as
served — including the editable maintainer (`author` on `Deployment`-based types: model,
application, interceptor, toolset), inline `created_at`/`updated_at` where Core serves them, and
every type-specific content field. The merge layer SHALL NOT overwrite, rename, or remove any
content field, **except** for the dual-bucket application/toolset `name` correction below.

#### Scenario: An editable maintainer value survives a merge

- **WHEN** an interceptor whose content response carries a user-authored `author` is read through
  the merged flow
- **THEN** the entity's flat `author` still holds the served value, editable and written back on
  save, while `_metadata.author` separately holds the metadata-sourced value

#### Scenario: A toolset's inline snake_case timestamps stay untouched

- **WHEN** a public-bucket toolset is merged
- **THEN** the entity still carries the served `updated_at`/`created_at` content fields with their
  original values, alongside `_metadata.updatedAt`/`_metadata.createdAt`

#### Scenario: A platform-bucket application or toolset's `name` is corrected, not left as served

- **WHEN** a platform-bucket application or toolset is merged and its content response's `name`
  diverges from the name the Core resource URL encodes
- **THEN** the merged entity's flat `name` and `_metadata.name` both hold the URL-derived name from
  `dualBucketMetadataFields`, not the served `content.name` — the one documented exception to this
  requirement (see design.md D3 amendment and the analogous `folderId` carve-out in
  `platform-applications`/`platform-toolsets`)

### Requirement: UI consumers read entity metadata from `_metadata` only

Every consumer of merge-grafted fields on a detail entity SHALL read them from `_metadata` —
entity info headers (created/updated/maintainer rows), the Assets resource info header, the
Skills view, and app-runner source options. Dual-shape fallbacks SHALL be removed: no consumer
SHALL read `updated_at ?? updatedAt` or similar off the entity root.

#### Scenario: The info header shows created and updated dates from `_metadata`

- **WHEN** a merged entity detail view renders its info header
- **THEN** the Created and Updated rows show `_metadata.createdAt`/`_metadata.updatedAt`, with no
  fallback to entity-root timestamp fields

#### Scenario: Identity reads address `_metadata`

- **WHEN** a detail-view consumer needs the entity's `path`, `folderId`, `name`, or `version`
- **THEN** it reads them from `_metadata`, including dual-bucket checks such as
  `isPlatformBucketPath` on a platform-bucket resource's folder id

### Requirement: Write paths strip the whole `_metadata` object

The system SHALL remove the entire `_metadata` object from the payload before sending any create,
update, rotate, or import write of a Core resource to Core. This replaces the per-field
destructuring of `status`, `validationWarnings`, `path`, `folderId`, `author`, `createdAt`, and
`updatedAt` in the type payload builders; per-type write quirks that are not merge grafts — the
prompt content `id`, the key `key`/`name`/`description` handling, the toolset `reference` and
`displayVersion` — SHALL keep their existing behavior.

#### Scenario: A save strips `_metadata` and nothing else

- **WHEN** a merged entity carrying `_metadata` is saved
- **THEN** the request body sent to Core contains no `_metadata` field and no flat merge grafts,
  while every resource content field round-trips unchanged

#### Scenario: The toolset client-only tracking id is still stripped

- **WHEN** a toolset save is sent
- **THEN** the `reference` field is stripped exactly as before, in addition to `_metadata`

### Requirement: Write responses graft into `_metadata`

On a successful `put`, the client's response enrichment (`parsePathFields`) SHALL graft the
resolved admin-format identity fields into the response's `_metadata` object, so write responses
carry the same shape the merge readers return.

#### Scenario: A successful write response matches the read shape

- **WHEN** `put` succeeds for a versioned resource written to `folder/Name__1.0`
- **THEN** the resolved response's `_metadata` includes `path`, `folderId=folder/`, `name=Name`,
  and `version=1.0`

### Requirement: Export documents carry `_metadata`; import strips it

exim export documents for Core resources SHALL carry the entity's `_metadata` as exported; import
SHALL strip `_metadata` from each entry before writing, alongside the existing identity-field
strips.

#### Scenario: An exported document includes `_metadata`

- **WHEN** a Core resource with `_metadata` is exported
- **THEN** the exported document's entity entry carries the `_metadata` object

#### Scenario: An import never writes `_metadata`

- **WHEN** an exported document is imported back into Core
- **THEN** every written request body is free of `_metadata`

### Requirement: List rows and etag stay outside `_metadata`

`ResourceInfo` list rows (the metadata-only grid projections from `toResourceInfoList`) SHALL keep
their existing flat shape, unchanged by this capability. `etag` SHALL NOT be placed in `_metadata`
and SHALL keep flowing as a separate value through the page → View → save contract.

#### Scenario: A list row keeps its flat shape

- **WHEN** a resource type's grid rows are listed
- **THEN** each row carries `name`/`path`/`folderId`/`author`/`createdAt`/`updatedAt` flat, with
  no `_metadata` object

#### Scenario: etag keeps its separate flow

- **WHEN** a detail page reads a resource whose only etag source is the metadata node (e.g. a
  model)
- **THEN** the etag reaches the View as a separate value, not through `_metadata`
