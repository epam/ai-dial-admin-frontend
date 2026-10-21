# core-asset-client — `_metadata` merge and write-resolution delta

## MODIFIED Requirements

### Requirement: Content+metadata field merge matches per-type source-of-truth
For application-resource and toolset-resource, the system SHALL populate `_metadata.name`,
`_metadata.folderId`, `_metadata.updatedAt`, `_metadata.author`, and the parsed
`_metadata.version` from the metadata response, and populate the type-specific content fields
from the content response. For conversation and prompt, the system SHALL populate
`_metadata.name`, `_metadata.folderId`, `_metadata.updatedAt`, and `_metadata.author` from the
metadata response and the type-specific content fields from the content response, with no
`version` grafted from the URL — a `__` in the name stays part of the name. All grafted helpers
(`author`, `createdAt`, `updatedAt`, `name`, `path`, `folderId`, `version`, `nodeType`) SHALL
live inside the `_metadata` object (see the `core-resource-entity-metadata` capability); no flat
copy of a graft SHALL remain on the entity root, and no content field SHALL be overwritten.

#### Scenario: Metadata-sourced fields
- **WHEN** any of the four content-addressed types is merged from a content and metadata response pair
- **THEN** `_metadata.name`, `_metadata.folderId`, `_metadata.updatedAt`, and `_metadata.author`
  come from the metadata response's parsed URL, not the content response, and `_metadata.version`
  comes from it only for application-resource and toolset-resource

#### Scenario: Content-sourced fields
- **WHEN** any of the four content-addressed types is merged
- **THEN** its type-specific fields (e.g. `endpoint`/`viewerUrl`/`editorUrl` for
  application-resource, `content`/`description` for prompt) come from the content response

#### Scenario: Conversation and prompt merge without a version
- **WHEN** a conversation or prompt is merged from a content and metadata response pair
- **THEN** the returned model's `_metadata` carries no `version` key, and `_metadata.name` is the
  full last path segment including any `__`

#### Scenario: Flat grafts do not survive outside `_metadata`
- **WHEN** any merged type is returned from `getMerged`/`getMergedWithEtag`
- **THEN** the entity root carries no flat `author`/`createdAt`/`updatedAt`/`path`/`folderId`/
  `version`/`nodeType` graft — except fields the content response itself serves, which remain
  untouched as resource content

### Requirement: Write operations resolve with normalized admin-format path fields

On a successful `put` (create or update) of a content-addressed asset resource, the client SHALL
resolve with a response that includes the admin-format identity fields `path`, `folderId`, and
`name`, derived from the resource path written to, grafted into the response's `_metadata` object
(see the `core-resource-entity-metadata` capability). For the versioned group
(application-resource, toolset-resource) the response's `_metadata` SHALL additionally include
`version`, derived via the shared version-path helper; for conversation and prompt no `version`
is included, since their paths carry no version part. This matches the field shape the merge
readers already return, so post-write consumers (redirects, list refresh) receive a consistent
object regardless of Core's raw response shape.

Existing Core-format fields on the response SHALL be preserved; the `_metadata` object SHALL be
added alongside them.

#### Scenario: Successful versioned write returns parsed path fields
- **WHEN** `put` succeeds for an application-resource or toolset-resource written to `folder/Name__1.0`
- **THEN** the resolved response's `_metadata` includes `path`, `folderId=folder/`, `name=Name`,
  and `version=1.0`

#### Scenario: Successful versionless write returns path fields without version
- **WHEN** `put` succeeds for a conversation or prompt written to `folder/Name` (whatever `Name` contains, including `__`)
- **THEN** the resolved response's `_metadata` includes `path`, `folderId=folder/`, and
  `name=Name`, with `version` undefined

#### Scenario: Failed write is unchanged
- **WHEN** `put` fails (non-success `ServerActionResponse`)
- **THEN** the response SHALL be returned unchanged, with no path fields added

#### Scenario: Unparseable path does not break the write
- **WHEN** `put` succeeds but the written path cannot be parsed into folder + name (e.g. a path with no `/` separator)
- **THEN** the successful response SHALL be returned unchanged rather than raising an error
