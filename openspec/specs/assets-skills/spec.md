# assets-skills Specification

## Purpose
The `Assets > Skills` surface — a menu entry, metadata-only folder-tree list, folder and skill
creation from the list toolbar, and a detail view (Save/Discard header; staged file
add/preview/download/remove with `SKILL.md` protected from removal; a destination-folder field that
moves the skill on Save) — plus delete and bulk delete. Skill is a folder-of-files resource (rooted at
a `SKILL.md` manifest), scoped to what Core's metadata-only listing endpoint actually returns: no
per-row content fetch beyond what creation and file management need, and no editing of an existing
skill's own parsed metadata (name/description/version) after creation, which lives only in
`SKILL.md`'s frontmatter — created by archiving change `add-assets-skills`; creation added by
archiving change `add-skill-creation`.

## Requirements

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

### Requirement: Skill asset list offers delete, bulk delete, folder creation, and skill creation; no import, export, or row-level move
The system SHALL offer row-level delete and multi-select bulk delete on the Skills asset list, and
SHALL offer a `Create` toolbar action with two options, `Folder` and `Skill`. The system SHALL NOT
offer import, export, or a row-level move-to-folder action, since this surface's authoring is limited
to creating a skill and its containing folders, and Move is offered on the detail view instead (see
the Save/Discard requirement below).

#### Scenario: Row delete removes a single skill
- **WHEN** a user deletes a single skill row and confirms
- **THEN** that skill is deleted and the list refreshes without it

#### Scenario: Bulk delete removes the selected skills
- **WHEN** a user selects several skills and confirms bulk delete
- **THEN** each selected skill is deleted and the list refreshes without them

#### Scenario: Create offers exactly Folder and Skill
- **WHEN** a user opens the Skills asset list toolbar's `Create` action
- **THEN** exactly two options are offered: `Folder` and `Skill`

#### Scenario: No import, export, or row-level move action is present
- **WHEN** a user opens the Skills asset list toolbar and row actions
- **THEN** no import, export, or move-to-folder action is offered

### Requirement: Creating a folder from the Skills asset list
The system SHALL let a user create an empty grouping folder at the currently open path by selecting
`Create > Folder`, matching the existing folder-creation UX (inline-named pending node, created on
confirmation) already used by `Assets > Prompts`/`Toolsets`/`Applications`.

#### Scenario: A new folder appears at the current path
- **WHEN** a user selects `Create > Folder`, enters a name, and confirms
- **THEN** an empty grouping folder is created at the current path and the list shows it

#### Scenario: Folder creation follows the same name validation as other asset folders
- **WHEN** a user enters a folder name during creation
- **THEN** the same forbidden-character and name-length validation already enforced for folder
  creation on other asset surfaces applies here

### Requirement: Creating a skill from the Skills asset list
The system SHALL let a user create a new skill by selecting `Create > Skill`, opening a modal with two
required fields, `Name` and `Description`. On submit, the system SHALL create a new skill at the
currently open path, named after `Name`, with a `SKILL.md` manifest containing the entered `Name` and
`Description` as its YAML frontmatter, and SHALL navigate to the new skill's detail page on success.

#### Scenario: Name accepts only lowercase letters, digits, and hyphens
- **WHEN** a user enters a `Name` containing any character other than a lowercase letter, digit, or
  hyphen (including a space)
- **THEN** the modal shows a validation error and the create action is disabled

#### Scenario: Name must be unique within the current folder
- **WHEN** a user enters a `Name` matching a skill or folder already listed at the current path
- **THEN** the modal shows a duplicate-name error and the create action is disabled

#### Scenario: Description is required
- **WHEN** a user attempts to submit the create-skill modal with an empty `Description`
- **THEN** the create action is disabled until a `Description` is entered

#### Scenario: Submitting creates the skill and navigates to it
- **WHEN** a user enters a valid `Name` and `Description` and confirms
- **THEN** a new skill is created at the current path with a `SKILL.md` manifest carrying the entered
  `Name` and `Description`, and the browser navigates to that skill's detail page

#### Scenario: A create-only request fails if the name already exists on the server
- **WHEN** a user submits a `Name` that passed the client-side duplicate check but already exists as a
  skill on the server (e.g. created concurrently by another user)
- **THEN** the create request fails, the modal stays open, and an error notification is shown rather
  than silently overwriting the existing skill

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
read from Core, plus a file listing (name only — Core's file listing carries no per-file size),
excluding `SKILL.md` itself. None of the skill's own read-only fields (path, author, dates) are
editable. The skill's parsed metadata (name, description, and its markdown body) is read and edited
through the dedicated `Skill` tab, not this Properties tab; `version`, if present in `SKILL.md`'s
frontmatter, remains out of scope for both tabs. The file listing and destination folder are editable
per the requirements below.

#### Scenario: Detail view shows the skill's read-only fields and file listing
- **WHEN** a user opens a skill from the Skills asset list
- **THEN** the detail view shows the skill's path, author, created and updated dates, and its bundle's
  file listing (file name per row), with no row for `SKILL.md`

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
`SKILL.md` manifest, and SHALL NOT show it as a row in the file listing at all — its content is edited
through the `Skill` tab instead. A Save/Discard control pair SHALL appear in the detail view's header
once any file or folder change is staged, or once a change is staged on the `Skill` tab (see the
dedicated requirement below), matching how every other asset type surfaces its own Save/Discard, and
SHALL NOT appear otherwise.

#### Scenario: A file can be previewed or downloaded without staging anything
- **WHEN** a user activates the preview or download action on an already-saved file row
- **THEN** the file's content opens for inline preview, or downloads, respectively, with no change
  staged

#### Scenario: Removing a file stages it and shows Save/Discard
- **WHEN** a user removes a file other than `SKILL.md`
- **THEN** the file listing no longer shows that file, no request has reached Core yet, and the
  header now offers Save and Discard

#### Scenario: SKILL.md is excluded from the file listing
- **WHEN** the file listing renders
- **THEN** no row for `SKILL.md` is shown, and no remove action needs to be suppressed for it

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

### Requirement: Skill asset detail view has a Skill tab for viewing and editing the manifest
The system SHALL add a `Skill` tab to the Assets > Skills detail view, positioned after `Properties`,
showing a disabled `Name` input populated from `SKILL.md`'s parsed frontmatter `name`, an editable
`Description` input populated from frontmatter `description`, and a markdown editor showing the
manifest's body content (the markdown after the frontmatter block). Edits to `Description` and the
body SHALL be staged locally, matching the file-listing staging requirement above — no request reaches
Core until the user clicks Save, and Discard reverts both fields to `SKILL.md`'s last-saved content
without contacting Core.

#### Scenario: The Skill tab appears after Properties
- **WHEN** a user opens a skill's detail view
- **THEN** the tab bar shows `Properties` followed by `Skill`

#### Scenario: Name is shown disabled from parsed frontmatter
- **WHEN** a user opens the Skill tab
- **THEN** the `Name` input shows `SKILL.md`'s frontmatter `name` and cannot be edited

#### Scenario: Description is editable and pre-populated
- **WHEN** a user opens the Skill tab
- **THEN** the `Description` input shows `SKILL.md`'s frontmatter `description` and can be edited

#### Scenario: The markdown editor shows the manifest body
- **WHEN** a user opens the Skill tab
- **THEN** the markdown editor shows `SKILL.md`'s content after its frontmatter block, editable

#### Scenario: Editing description or body stages a change and shows Save/Discard
- **WHEN** a user edits the `Description` input or the markdown editor's content
- **THEN** no request reaches Core, and the header now offers Save and Discard

#### Scenario: Saving reassembles and writes SKILL.md
- **WHEN** a user with a staged Skill-tab change clicks Save
- **THEN** the staged `name`, `description`, and body are reassembled into a valid frontmatter
  document and written to `SKILL.md` via the existing per-file upload method

#### Scenario: Discarding reverts staged Skill-tab changes without contacting Core
- **WHEN** a user with a staged Skill-tab change clicks Discard
- **THEN** the `Description` input and markdown editor revert to `SKILL.md`'s last-saved content and
  no request is sent to Core

#### Scenario: A save rejected for invalid frontmatter surfaces as an error
- **WHEN** Core rejects a Skill-tab save because the reassembled `SKILL.md` fails frontmatter
  validation
- **THEN** an error notification is shown, the staged change remains staged, and `SKILL.md` is left
  unchanged in Core

### Requirement: Skill asset detail view has no Audit tab or Core-sync banner
The system SHALL render a Skill asset's detail view without an `Audit` tab and without a Core-sync status
banner, since Core exposes no rollback/revision history endpoint for skills that this surface reads.

#### Scenario: No Audit tab is present
- **WHEN** a user opens a skill's detail view
- **THEN** no `Audit` tab is present

#### Scenario: No Core-sync banner is present
- **WHEN** a user opens a skill's detail view
- **THEN** no Core-sync status banner is rendered in the header
