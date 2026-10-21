## MODIFIED Requirements

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

## ADDED Requirements

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
