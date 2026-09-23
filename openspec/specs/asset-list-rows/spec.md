# asset-list-rows Specification

## Purpose
TBD

## Requirements

### Requirement: One unified asset row model with an explicit bucket
The system SHALL serve every asset folder-tree row — prompts, conversations, files, skills, asset
applications and toolsets in both buckets, and the flat platform views — through one client row
model with a shared base: `name`, `path`, `nodeType`, `author`, `createdAt`, `updatedAt`, `etag`,
and an explicit `bucket` field (`'public'` | `'platform'`) mapped from Core's metadata node, which
already carries it. No row consumer SHALL derive the bucket by parsing a `folderId` or `path`
prefix.

#### Scenario: Every asset type's rows share the base shape
- **WHEN** any asset type's list action returns rows to the folder context
- **THEN** each row carries `name`, `path`, `nodeType`, and `bucket`, with `author`, `createdAt`,
  `updatedAt`, and `etag` populated when Core's metadata node provides them

#### Scenario: The bucket comes from the row, not a prefix parse
- **WHEN** a row consumer needs to know which bucket a row belongs to
- **THEN** it reads the row's `bucket` field, and no code path inspects `folderId` or `path` for a
  `platform/` prefix to answer that question

### Requirement: Movable rows carry a root-level, changeable folderId
The system SHALL require `folderId` at the root of every movable asset row — prompts, files,
skills, and asset applications and toolsets in the `public` bucket — and SHALL support changing it
through the move flow. Movable rows for the versioned types additionally carry `version`. Row and
create-flow shapes carry `folderId` flat; merged detail reads keep the
`core-resource-entity-metadata` convention (identity grafted under `_metadata`), with write paths
resolving `folderId ?? _metadata.folderId`.

#### Scenario: A movable row's folderId is present and authoritative
- **WHEN** a prompt, file, skill, or public-bucket application/toolset row is listed
- **THEN** the row carries a required root-level `folderId` naming its containing folder, and the
  move flow changes it

#### Scenario: Merged detail reads keep the _metadata convention
- **WHEN** a movable entity's detail is merged from content and metadata responses
- **THEN** its identity lives under `_metadata` as before this change, and write paths resolve
  `folderId ?? _metadata.folderId` — the root-level `folderId` contract applies to rows and
  create-flow shapes only

### Requirement: Conversation rows are tree rows without move support
Conversation rows SHALL carry a root-level `folderId` (they sit in the folder tree) but SHALL NOT
offer a move action: the move affordance SHALL NOT appear for conversation rows, unlike prompts
which share the versionless handling but are movable.

#### Scenario: Conversations show no move action
- **WHEN** a conversation row's action set renders
- **THEN** no move action is offered, while a prompt row in the same tree does offer one

#### Scenario: Conversation rows still carry folderId
- **WHEN** a conversation row is listed
- **THEN** it carries a root-level `folderId` naming its containing folder, used for tree placement
  and path building, never changed by a move flow

### Requirement: Platform rows carry no folderId
The system SHALL serve platform rows — the flat platform views (models, app-runners, catalog
schemas, interceptors, translators, routes, roles, keys) and asset applications and toolsets in the
`platform` bucket — without a `folderId` at all: the field is semantically void for a flat,
unversioned resource, and the row type SHALL make reading it a compile-time error rather than a
runtime convention.

#### Scenario: A platform row has no folderId to read
- **WHEN** a platform-bucket application/toolset row or a flat platform view row is listed
- **THEN** the row carries no `folderId`, and code that tries to read one off the platform row
  flavor does not compile

#### Scenario: Platform rows carry the bucket instead
- **WHEN** a platform row's bucket must be known
- **THEN** the row's `bucket` field is `'platform'`

### Requirement: The folder context is generic over the row model
The folder-context factory (`createFolderContext`) SHALL be generic over the row type, and each
per-entity folder context SHALL declare the row flavor it serves (movable, tree-immovable, or
platform) without casting its list action's return type into a shared union.

#### Scenario: Per-entity contexts declare their row flavor
- **WHEN** a per-entity folder context wires its list action into the shared factory
- **THEN** the context's rows are typed as that entity's row flavor with no type cast, and a
  platform-flavored context cannot feed rows into a tree feature that requires `folderId`

#### Scenario: The flat platform views shed the tree machinery
- **WHEN** a flat platform view's context serves rows
- **THEN** only the root list is fetched — folder hierarchy fetching, folder toggling, and merge
  behavior that presuppose a folder tree are not exercised for these views

### Requirement: Row action handling resolves the bucket explicitly
Move, delete, update, and open-in-new-tab handling SHALL resolve a row's bucket from the row's
explicit `bucket` field, and SHALL resolve the browsed surface from the existing view-level helpers
(`isFlatPlatformView`, `isPlatformDualBucketView`) when the view and current path are in scope —
never by inferring either from a `folderId` value.

#### Scenario: Delete shaping reads the bucket
- **WHEN** a delete confirmation grid or success toast is shaped for a row
- **THEN** platform-bucket rows get the flat name-only treatment because their `bucket` is
  `'platform'`, and public rows get the versioned treatment, with no `folderId` inspection

#### Scenario: Open-in-new-tab resolves the route segment from the row flavor
- **WHEN** a row is opened in a new tab
- **THEN** a platform row resolves to the flat name-only detail segment and a movable row to the
  `?path=`-carrying URL, selected by the row's flavor/bucket rather than by prefix-sniffing
  `folderId`

#### Scenario: Detail-page bucket detection stays one stated contract
- **WHEN** an asset application or toolset detail page decides which bucket it is rendering
- **THEN** it applies the existing URL contract (presence of `?path=` means public) through a
  single named helper, not an inverted raw-path check duplicated per page

### Requirement: File rows arrive through the shared mapper with a derived folderId
File listing rows SHALL be produced by the shared row mapper, deriving each row's `folderId` from
the raw file DTO's `parentPath`/`bucket` (which carries no `folderId`), so every movable row —
files included — arrives with the same field provenance.

#### Scenario: A file row carries the same movable shape as every other asset
- **WHEN** a files listing returns rows
- **THEN** each row carries the movable flavor's required root-level `folderId` alongside `bucket`,
  derived server-side from the raw DTO, and participates in move flows like any movable row
