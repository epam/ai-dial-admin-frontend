## ADDED Requirements

### Requirement: Assets > Skills menu entry

The system SHALL add a `Skills` menu item to the Assets section of the admin menu, directly after `Files`
(the last existing Assets entry), linking to a new `/assets-skills` route.

#### Scenario: Skills follows Files in the Assets section

- **WHEN** the Assets section of the menu renders
- **THEN** `Skills` appears immediately after `Files`, as the last Assets entry

#### Scenario: Selecting Skills navigates to its list

- **WHEN** a user selects `Skills` from the Assets menu
- **THEN** the app navigates to `/assets-skills`

### Requirement: Skill asset list is a folder tree with metadata-only columns

The system SHALL render the Skills asset list on the shared asset list, browsable as a folder tree (a
skill's grouping folder may itself contain skills or further folders), showing only columns sourced from
Core's folder-metadata listing response: `Name` (the skill or folder's path segment), `Author`, `Created
time`, and `Updated time`. The system SHALL NOT fetch a skill's own content or its dedicated metadata
(name/description/version) to populate the list, and SHALL NOT offer a `Version` column, since a skill's
metadata listing carries no version information distinguishable from its `Name`.

#### Scenario: Listing issues no per-row content or metadata request

- **WHEN** the Skills asset list loads or a folder is expanded
- **THEN** only the folder-metadata listing request is issued for that path, with no additional
  per-row request

#### Scenario: List columns are exactly Name, Author, Created time, Updated time

- **WHEN** the Skills asset list renders
- **THEN** its columns are `Name`, `Author`, `Created time`, and `Updated time`, with both date columns
  shown as locale-formatted dates rather than raw epoch milliseconds

#### Scenario: A folder in the listing expands to its children

- **WHEN** a user expands a row whose metadata `nodeType` is `FOLDER`
- **THEN** the tree fetches and shows that folder's children without navigating away from the list

#### Scenario: Empty Skills list shows an empty state

- **WHEN** there are no skills or folders at the current path
- **THEN** the list shows the standard empty-state message rather than an error

### Requirement: Skill asset list offers delete and bulk delete, and no create, import, or export; Move is detail-view only

The system SHALL offer row-level delete and multi-select bulk delete on the Skills asset list, and SHALL
NOT offer create, import, export, or a row-level move-to-folder action, since this surface does not
support authoring a skill's bundle content and Move is offered on the detail view instead (see the
Save/Discard requirement below).

#### Scenario: Row delete removes a single skill

- **WHEN** a user deletes a single skill row and confirms
- **THEN** that skill is deleted and the list refreshes without it

#### Scenario: Bulk delete removes the selected skills

- **WHEN** a user selects several skills and confirms bulk delete
- **THEN** each selected skill is deleted and the list refreshes without them

#### Scenario: No create, import, export, or row-level move action is present

- **WHEN** a user opens the Skills asset list toolbar and row actions
- **THEN** no create, import, export, or move-to-folder action is offered

### Requirement: Deleting a Skills grouping folder recursively deletes its contents

The system SHALL support deleting a grouping-folder row from the Skills asset list (single or as part
of a bulk selection), recursively deleting every skill and nested grouping folder it contains, bottom-up,
before deleting the folder itself. This SHALL use Skills' own dedicated Core endpoints directly, not the
generic cross-type folder-delete path used by the other five asset types (Prompts, Toolsets,
Applications, Conversations, Files), since Skills are folder-shaped resources with no equivalent
flat-resource/publication-based delete path.

#### Scenario: Deleting a folder removes every skill and nested folder within it

- **WHEN** a user deletes a grouping-folder row containing one or more skills, or nested grouping
  folders containing skills, and confirms
- **THEN** every skill at any depth under that folder is deleted, every nested grouping folder is
  deleted once empty, and finally the folder itself is deleted

#### Scenario: A failed delete partway through stops without deleting the remaining contents

- **WHEN** deleting a skill or a nested folder marker fails partway through a folder delete
- **THEN** the operation reports failure and does not attempt to delete anything after the failure

### Requirement: Skill asset detail view shows read-only metadata and a file listing

The system SHALL render a Skill asset's detail view with its path, author, and created/updated dates
read from Core, plus a file listing (name only — Core's file listing carries no per-file size). None of
the skill's own read-only fields (path, author, dates) are editable; the skill's parsed metadata
(name/description/version) is out of scope for this surface — see the change's Non-goals — since it
lives only in `SKILL.md`'s frontmatter, not parsed or shown here. The file listing and destination
folder are editable per the requirements below.

#### Scenario: Detail view shows the skill's read-only fields and file listing

- **WHEN** a user opens a skill from the Skills asset list
- **THEN** the detail view shows the skill's path, author, created and updated dates, and its bundle's
  file listing (file name per row)

#### Scenario: A skill that no longer exists 404s rather than rendering blank

- **WHEN** a user opens a skill whose path no longer resolves to a skill resource
- **THEN** the detail page renders the standard not-found page

#### Scenario: Breadcrumbs reflect the skill's folder path

- **WHEN** a user opens a skill from the Skills asset list
- **THEN** the page shows breadcrumbs for the route and the skill's folder path, matching how
  `Assets > Toolsets`/`Applications` render their own breadcrumbs

### Requirement: Skill asset detail view stages file changes and a folder move, applied on Save

The system SHALL let a user preview, download, add, and remove files within an existing skill's bundle,
and change its destination folder, from its Assets detail view — staged locally and only written to
Core (per-file upload/delete, and a move) when the user clicks Save; Discard reverts all staged changes,
including files, without contacting Core. The system SHALL NOT allow removing the skill's root
`SKILL.md` manifest, since a skill has no meaning without it. A Save/Discard control pair SHALL appear
in the detail view's header once any file or folder change is staged, matching how every other asset
type surfaces its own Save/Discard, and SHALL NOT appear otherwise.

#### Scenario: A file can be previewed or downloaded without staging anything

- **WHEN** a user activates the preview or download action on an already-saved file row
- **THEN** the file's content opens for inline preview, or downloads, respectively, with no change
  staged

#### Scenario: Removing a file stages it and shows Save/Discard

- **WHEN** a user removes a file other than `SKILL.md`
- **THEN** the file listing no longer shows that file, no request has reached Core yet, and the
  header now offers Save and Discard

#### Scenario: SKILL.md has no remove action

- **WHEN** the file listing renders the `SKILL.md` row
- **THEN** no remove action is offered for that row

#### Scenario: Adding a file stages it and shows Save/Discard

- **WHEN** a user adds a file
- **THEN** the file appears in the listing immediately as a staged addition, no request has reached
  Core yet, and the header now offers Save and Discard

#### Scenario: Saving applies every staged file change

- **WHEN** a user with staged file additions and/or removals clicks Save
- **THEN** each staged removal is deleted and each staged addition is uploaded to the skill's bundle
  in Core, and the header's Save/Discard controls disappear on success

#### Scenario: Discarding reverts staged file changes without contacting Core

- **WHEN** a user with staged file changes clicks Discard
- **THEN** the file listing reverts to the skill's last-saved state and no request is sent to Core

#### Scenario: Changing the destination folder stages a move

- **WHEN** a user selects a different destination folder for the skill
- **THEN** the header now offers Save and Discard, and no move request has reached Core yet

#### Scenario: Saving a changed folder moves the skill and navigates to its new location

- **WHEN** a user with a changed destination folder clicks Save
- **THEN** the skill is moved to the new folder in Core and the browser navigates to the skill's
  detail view at its new path

### Requirement: Skill asset detail view has no Audit tab or Core-sync banner

The system SHALL render a Skill asset's detail view without an `Audit` tab and without a Core-sync status
banner, since Core exposes no rollback/revision history endpoint for skills that this surface reads.

#### Scenario: No Audit tab is present

- **WHEN** a user opens a skill's detail view
- **THEN** no `Audit` tab is present

#### Scenario: No Core-sync banner is present

- **WHEN** a user opens a skill's detail view
- **THEN** no Core-sync status banner is rendered in the header
