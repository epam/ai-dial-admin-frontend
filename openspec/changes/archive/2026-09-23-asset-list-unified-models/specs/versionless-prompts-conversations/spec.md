# versionless-prompts-conversations Specification (delta)

## MODIFIED Requirements

### Requirement: Prompts and conversations are versionless entities
The system SHALL treat prompts and conversations as versionless in every bucket (`public/`, user
buckets, review buckets, platform buckets): a double underscore (`__`) in a prompt or conversation
name SHALL be an ordinary part of the name, never a name/version delimiter, and no prompt or
conversation model, form, grid, modal, toast, or publication surface SHALL expose, edit, or
transmit a `version` field for them.

#### Scenario: A name containing double underscores works end to end
- **WHEN** a prompt is created, listed, opened, edited, moved, exported, published, or deleted with
  a name that contains `__` (e.g. `foo__bar`), or a conversation is created, listed, opened,
  edited, exported, published, or deleted with such a name
- **THEN** every operation addresses it by that exact name, and no code path splits, joins, or
  otherwise interprets the `__` as a version separator

#### Scenario: No version surface remains for prompts and conversations
- **WHEN** any prompt or conversation view, create/edit form, grid, duplicate modal, delete modal,
  or notification renders
- **THEN** it contains no version field, version column, version dropdown, "save as new version"
  action, version comparison, or "all versions" option

### Requirement: Duplicate and move flows use plain names for prompts and conversations
For prompts and conversations, the duplicate flow SHALL offer only new-entity duplication (name
seeded by the existing copy-name convention, no version input). The move flow with a duplicate name
SHALL use the supplied name verbatim as the destination name — a same-name collision at the
destination is governed by the existing overwrite flag or surfaced as a Core conflict — and SHALL
be offered for prompts only: conversation rows carry no move action (see `asset-list-rows`), so no
move flow exists whose destination name could be version-mangled for them.

#### Scenario: Duplicate modal offers no version option
- **WHEN** a user duplicates a prompt or conversation
- **THEN** the modal asks for a name and folder only, seeds the name with the copy convention, and
  never offers a "New Version" option or version input

#### Scenario: Move with a duplicate name uses the name as-is
- **WHEN** a prompt is moved with a duplicate name supplied
- **THEN** the destination path uses that name verbatim, with no version suffix extracted from or
  reapplied to the source path

#### Scenario: Conversations offer no move flow
- **WHEN** a conversation row's action set renders
- **THEN** no move action is offered, so no version-suffix reconstruction can occur for a
  conversation
