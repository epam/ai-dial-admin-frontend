# skill-resources-core-api Specification

## Purpose
The Skill Core API client additions backing the `assets-skills` surface: list metadata, parent-folder
author/date/etag lookup, whole-skill create and delete, grouping-folder create and delete, per-file
upload/download/preview/delete, and the `SkillFolderContext` that both `assets-skills` and the
corrected `skill-publications` properties view depend on — created by archiving change
`add-assets-skills`; whole-skill and grouping-folder create added by archiving change
`add-skill-creation`.

## Requirements

### Requirement: Skill folder metadata can be listed
The system SHALL provide a Skill Core API method that lists the direct children of a Skill folder path
(`GET /v2/metadata/skills/{bucket}/{path}`), mapping each returned item into the same `Asset`-shaped row
(`name`, `path`, `nodeType`, `author`, `createdAt`, `updatedAt`) the shared asset list and folder-tree
context already consume for every other asset type, and SHALL paginate using Core's continuation token
until the full folder has been read.

#### Scenario: Listing returns metadata-only rows
- **WHEN** the list method is called for a folder path
- **THEN** it returns one row per child with `name`, `path`, `nodeType`, `author`, `createdAt`, and
  `updatedAt` populated from Core's response, and no other per-row Core request is made

#### Scenario: A folder child is distinguished from a skill child
- **WHEN** the listing response classifies a child as `FOLDER` versus `ITEM`
- **THEN** the mapped row's `nodeType` reflects that distinction, so the folder-tree context can decide
  whether the row is expandable

#### Scenario: A paginated folder is fully read
- **WHEN** Core's response for a folder includes a continuation token
- **THEN** the method continues requesting subsequent pages until no token is returned, and the combined
  result includes every child across all pages

### Requirement: A skill can be deleted through the Skill Core client, not the generic asset client
The system SHALL provide a Skill Core API method that deletes a skill (`DELETE /v2/skills/{bucket}/{path}`)
given a concrete etag, sent as `If-Match`, and SHALL reject the call before any request reaches Core if no
etag is supplied. This method SHALL be used for all Skill deletes; the generic `AssetApi.delete` SHALL NOT
be used for `SKILL`, since its URL is built from `CORE_RESOURCE_URL[SKILL]`, a `v1/skills/...` path Core
does not serve.

#### Scenario: Delete without a usable etag is rejected
- **WHEN** the delete method is called without a concrete etag
- **THEN** the call is rejected before any request reaches Core

#### Scenario: Delete sends If-Match
- **WHEN** the delete method is called with a concrete etag
- **THEN** the delete request to Core includes `If-Match` set to that etag

#### Scenario: Bulk delete requires an etag per item
- **WHEN** multiple skills are deleted in one bulk-delete action
- **THEN** each skill is deleted individually with `If-Match` set to that item's own etag, and the whole
  batch is rejected before any item reaches Core if any item is missing an etag

### Requirement: A skill's files can be listed with their relative path
The system SHALL provide a Skill Core API method that lists the files contained in a skill's bundle
(`GET /v2/metadata/skills/{bucket}/{path}/files`, recursive), and SHALL derive each file's name as its
path relative to the skill's root (e.g. `scripts/run.sh`), not Core's bare per-item name, so files nested
in subfolders remain distinguishable. Grouping-folder entries within the bundle SHALL be excluded from
the result. This method SHALL be used to populate a skill's file listing wherever it's read, since the
skill's own metadata call resolves to an item node that Core does not populate with file contents.

#### Scenario: File names are relative to the skill root
- **WHEN** the listing includes a file nested in a subfolder
- **THEN** the mapped row's name is the file's path relative to the skill's root, not its bare filename

#### Scenario: Folder entries are excluded
- **WHEN** the listing includes a grouping-folder entry alongside file entries
- **THEN** only the file entries are returned

### Requirement: A skill's files can be added, downloaded, previewed, and removed individually
The system SHALL provide Skill Core API methods for uploading (`PUT
/v2/skills/{bucket}/{path}/files/{filePath}`, multipart), downloading, previewing, and deleting
(`DELETE /v2/skills/{bucket}/{path}/files/{filePath}`) a single file within a skill's bundle. Unlike
whole-skill delete, the per-file delete method's etag SHALL be optional — Core's per-file route accepts
an unconditional delete.

#### Scenario: A file is uploaded with overwrite semantics
- **WHEN** the upload method is called for a file path that already exists in the bundle
- **THEN** the file is replaced rather than rejected as a conflict

#### Scenario: A file can be deleted without an etag
- **WHEN** the per-file delete method is called without an etag
- **THEN** the delete request still reaches Core, unlike the whole-skill delete method

### Requirement: A single skill's author, created/updated dates, and etag are read from a single parent-folder listing
The system SHALL populate a single skill's `author`/`createdAt`/`updatedAt`/`etag` by finding that
skill's own row in a single (first-page, non-paginated) read of its parent folder's listing, and SHALL
NOT issue a separate `SKILL.md` manifest fetch for this purpose. Confirmed by reading Core's actual
implementation, not just its design documentation: no metadata endpoint returns these for a direct "read
this one skill" call — the children-listing mapper that backs `GET /v2/metadata/skills/{bucket}/{path}`
only ever sets `nodeType`/`createdAt`/`updatedAt`/`author`/`etag` on *children of a listed folder*, but
that same per-child `etag` is exactly the aggregate etag a `SKILL.md` content-read's `ETag` header would
carry, making a second, dedicated manifest fetch redundant. `name`/`description`/`version` remain
unpopulated by this method — they live only in `SKILL.md`'s frontmatter, out of scope until in-browser
`SKILL.md` editing is built. A skill read costs exactly two Core requests: this listing read, plus the
files listing (see the file-listing requirement above).

#### Scenario: Author, dates, and etag all come from one parent-folder listing read
- **WHEN** a single skill is read
- **THEN** its `author`, `createdAt`, `updatedAt`, and `etag` are all populated from that skill's row in
  a single read of its parent folder's listing, with no separate manifest fetch and no per-skill
  metadata call

#### Scenario: A skill missing from its parent folder's first listing page is reported not found
- **WHEN** a skill's row cannot be found on the first page of its parent folder's listing
- **THEN** the read reports the skill as not found, rather than paginating further or returning a
  partial result with the missing fields left undefined

### Requirement: A skill can be moved through the generic asset move operation
The system SHALL move a skill using the existing generic `AssetApi.move` (`POST /v1/ops/resource/move`)
unchanged — Core's move operation is resource-type-agnostic and already accepts `SKILL` via
`RESOURCE_TYPE_PREFIX[ResourceType.SKILL]` — rather than adding Skill-specific move logic to the Core
client.

#### Scenario: Moving a skill uses the generic move endpoint
- **WHEN** a skill is moved to a different folder
- **THEN** the request goes through the same generic resource-move operation used for Prompts,
  Toolsets, and Applications, addressed with the `skills/` resource-type prefix

### Requirement: A dedicated Skill folder context backs both Assets > Skills and Skill Publications
The system SHALL provide a `SkillFolderContext`, instantiated from the same generic folder-context factory
every other asset type uses, backed by the Skill folder-listing method above. The system SHALL use this
context — not `FileFolderContext` — to back the Skill Publications properties view's folder-browsing needs,
replacing the placeholder wiring previously marked with a TODO.

#### Scenario: Skill Publications properties view uses the Skill folder context
- **WHEN** a reviewer opens a pending Skill publication's properties tab
- **THEN** the view is wrapped in `SkillFolderProvider`, not `FileFolderProvider`

#### Scenario: Assets > Skills uses the same context
- **WHEN** the Skills asset list or folder tree renders
- **THEN** it reads folder data through the same `SkillFolderContext` the Skill Publications view uses

### Requirement: A Skill grouping folder marker can be deleted through a dedicated Core route
The system SHALL provide a Skill Core API method that deletes a grouping folder marker (`DELETE
/v2/skills/{bucket}/{path}/` — trailing slash), distinct from the whole-skill delete route (no trailing
slash). This method SHALL be used for deleting the `.dial-folder` marker itself once a folder's skill and
nested-folder contents have been removed; Core rejects the call if the folder still has contents.

#### Scenario: The folder-delete route is distinct from the skill-delete route
- **WHEN** a grouping folder marker is deleted
- **THEN** the request targets the trailing-slash folder route, not the whole-skill-delete route

### Requirement: A Skills grouping folder is deleted bottom-up with unconditional etags
The system SHALL provide a method that recursively deletes a Skills grouping folder: walking its
contents via the existing (non-recursive) folder-listing method one level at a time, deleting every
skill found at any depth, then every nested grouping-folder marker deepest-first, then the target
folder itself. Every delete SHALL use Core's unconditional-etag convention (no `If-Match` header) rather
than reading a real etag per item, matching how the cross-type `removeFolderCore`'s own folder-marker
cleanup step already treats a folder delete as unconditional. This method SHALL be kept separate from
the cross-type `removeFolderCore` used by the other five asset types, since Skills are folder-shaped
resources with their own dedicated endpoints rather than flat resources addressable through the generic
publication-based delete.

#### Scenario: Every skill and nested folder is deleted before the target folder
- **WHEN** a Skills grouping folder containing skills and nested folders is deleted
- **THEN** every skill is deleted, then every nested folder marker is deleted deepest-first, then the
  target folder itself is deleted last

#### Scenario: A failure stops the delete without attempting further items
- **WHEN** deleting a skill or a folder marker fails partway through
- **THEN** the method returns the failure immediately without deleting any remaining items

### Requirement: A skill can be created from a name and description, create-only
The system SHALL provide a Skill Core API method that creates a brand-new skill via a whole-bundle
multipart request (`PUT /v2/skills/{bucket}/{path}`) containing a single `SKILL.md` part built from a
given name and description, and SHALL send no `If-Match` header, so Core rejects the request if a
resource already exists at that path rather than overwriting it.

#### Scenario: Creating a skill sends a single SKILL.md part
- **WHEN** the create method is called with a path, name, and description
- **THEN** the request is a multipart `PUT` to the whole-bundle route containing exactly one part,
  the generated `SKILL.md`

#### Scenario: An existing resource at the target path is not overwritten
- **WHEN** the create method is called for a path that already resolves to an existing resource
- **THEN** no `If-Match` header is sent, and Core's rejection of the conflicting create is surfaced to
  the caller as a failed result rather than retried or silently ignored

### Requirement: A Skills grouping folder can be created
The system SHALL provide a Skill Core API method that creates an empty grouping folder
(`PUT /v2/skills/{bucket}/{path}/` — trailing slash, no body), distinct from the whole-skill create
route (no trailing slash), matching the existing trailing-slash convention already used for
`deleteSkillFolder`.

#### Scenario: The folder-create route is distinct from the skill-create route
- **WHEN** a grouping folder is created
- **THEN** the request targets the trailing-slash folder route, not the whole-skill-create route

### Requirement: A skill's SKILL.md content can be read as raw text
The system SHALL provide a Skill Core API method that reads `SKILL.md`'s raw content
(`GET /v2/skills/{bucket}/{path}/files/SKILL.md`), returned as text rather than Core's JSON-wrapped
metadata shapes, for use by the Skill tab (see `assets-skills` and `skill-publications`). This method
SHALL be used instead of adding a per-file "content" field to the existing folder-metadata or
files-listing methods, which carry no file content today.

#### Scenario: The manifest's raw content is returned as text
- **WHEN** the method is called for a skill's path
- **THEN** it returns `SKILL.md`'s full raw text content, unparsed

#### Scenario: A missing skill or manifest is reported, not thrown as an unhandled error
- **WHEN** the method is called for a path that no longer resolves to a skill resource, or whose
  bundle has no `SKILL.md`
- **THEN** the call reports a not-found result rather than throwing an unhandled exception
