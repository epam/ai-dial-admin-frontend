# versionless-prompts-conversations Specification

## Purpose
App-wide versionless treatment of prompts and conversations: DIAL Core's contract for them has no version concept (`id/folderId/name/content` DTOs, plain `/`-joined paths), so `__` is an ordinary part of the name, never a name/version delimiter, and no model, form, grid, modal, toast, or publication surface exposes a `version` for them. Shared asset surfaces fork by resource-type group — applications and toolsets keep their versioned behavior unchanged — created by archiving change `make-prompts-conversations-versionless`.

## Requirements

### Requirement: Prompts and conversations are versionless entities
The system SHALL treat prompts and conversations as versionless in every bucket (`public/`, user buckets, review buckets, platform buckets): a double underscore (`__`) in a prompt or conversation name SHALL be an ordinary part of the name, never a name/version delimiter, and no prompt or conversation model, form, grid, modal, toast, or publication surface SHALL expose, edit, or transmit a `version` field for them.

#### Scenario: A name containing double underscores works end to end
- **WHEN** a prompt or conversation is created, listed, opened, edited, moved, exported, published, or deleted with a name that contains `__` (e.g. `foo__bar`)
- **THEN** every operation addresses it by that exact name, and no code path splits, joins, or otherwise interprets the `__` as a version separator

#### Scenario: No version surface remains for prompts and conversations
- **WHEN** any prompt or conversation view, create/edit form, grid, duplicate modal, delete modal, or notification renders
- **THEN** it contains no version field, version column, version dropdown, "save as new version" action, version comparison, or "all versions" option

### Requirement: Versioned asset types keep their version behavior
The system SHALL preserve the existing versioned behavior of asset applications and toolsets unchanged: their paths keep the `name__version` form, their models keep the `version` field, and their version UX (version field on create, version dropdown, save-as-new-version, duplicate "New Version" option, version comparison) keeps working exactly as before this change.

#### Scenario: Application and toolset paths remain versioned
- **WHEN** an asset application or toolset is created, moved, exported, or published
- **THEN** its path is built with the `name__version` suffix and its version UX is unchanged

#### Scenario: Shared pipeline forks by resource-type group
- **WHEN** a shared code path (asset client, publications, import/export, grid pipeline, move) handles both groups
- **THEN** version parsing and building are applied for applications and toolsets only, and prompts and conversations flow through the versionless branch

### Requirement: Asset grids render prompts and conversations without version semantics
For prompt and conversation routes, the system SHALL render every stored resource as its own grid row addressed by its plain path: no Version column, no merging of rows that share a name, no per-name version multi-select, and selection that expands to plain paths.

#### Scenario: Each stored resource is one row
- **WHEN** two stored prompts have names `foo__1.0` and `foo__2.0` in the same folder
- **THEN** the prompt grid shows two unrelated rows whose displayed names are exactly `foo__1.0` and `foo__2.0`, with no grouping, merging, or version column

#### Scenario: Bulk operations use plain paths
- **WHEN** rows are selected for move, export, or bulk delete on a prompt or conversation route
- **THEN** the operation receives each selected row's plain path, without any `__`-suffix expansion or reconstruction

### Requirement: Duplicate and move flows use plain names for prompts and conversations
For prompts and conversations, the duplicate flow SHALL offer only new-entity duplication (name seeded by the existing copy-name convention, no version input), and a move with a duplicate name SHALL use the supplied name verbatim as the destination name — a same-name collision at the destination is governed by the existing overwrite flag or surfaced as a Core conflict.

#### Scenario: Duplicate modal offers no version option
- **WHEN** a user duplicates a prompt or conversation
- **THEN** the modal asks for a name and folder only, seeds the name with the copy convention, and never offers a "New Version" option or version input

#### Scenario: Move with a duplicate name uses the name as-is
- **WHEN** a prompt is moved with a duplicate name supplied
- **THEN** the destination path uses that name verbatim, with no version suffix extracted from or reapplied to the source path
