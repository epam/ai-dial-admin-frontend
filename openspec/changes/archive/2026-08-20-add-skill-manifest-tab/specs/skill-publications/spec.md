## MODIFIED Requirements

### Requirement: Skill publication read-only properties view
The system SHALL show a Skill publication's detail view with the standard publication properties
(name, folder, comment — editable, shared with every other publication type) and a file listing (file
name, no size — Core reports none for this listing), excluding `SKILL.md` itself, with preview,
download, add, and remove available, staged locally and applied only when the reviewer saves the
publication. The skill's own parsed metadata (name, description, and markdown body) is read and edited
through the dedicated `Skill` tab, not this properties tab; `version`, if present in `SKILL.md`'s
frontmatter, remains out of scope for both tabs.

#### Scenario: A file can be previewed or downloaded
- **WHEN** a reviewer activates the preview or download action on a file row
- **THEN** the file's content opens for inline preview, or downloads, respectively

#### Scenario: A file other than SKILL.md can be staged for removal and applied on save
- **WHEN** a reviewer removes a file other than `SKILL.md` and then saves the publication
- **THEN** the file listing no longer shows the removed file locally right away, and saving deletes
  it from the skill's bundle in Core

#### Scenario: SKILL.md is excluded from the file listing
- **WHEN** the file listing renders
- **THEN** no row for `SKILL.md` is shown

#### Scenario: A new file can be staged and applied on save
- **WHEN** a reviewer adds a file and then saves the publication
- **THEN** the file appears in the listing immediately as a staged addition, and saving uploads it to
  the skill's bundle in Core

#### Scenario: Discarding clears staged file changes without contacting Core
- **WHEN** a reviewer stages a file add or removal and then discards their changes
- **THEN** the file listing reverts to the skill's saved state and no request is sent to Core for the
  discarded change

#### Scenario: Missing skill resource surfaces as an issue, not a crash
- **WHEN** the skill resource referenced by a pending publication cannot be found
- **THEN** the detail view surfaces the corresponding resource issue instead of failing to render

## ADDED Requirements

### Requirement: Skill publication has a Skill tab for viewing and editing the manifest
The system SHALL add a `Skill` tab to the Skill Publications properties view, positioned after
`Properties`, showing a disabled `Name` input populated from `SKILL.md`'s parsed frontmatter `name`,
an editable `Description` input populated from frontmatter `description`, and a markdown editor
showing the manifest's body content. Edits to `Description` and the body SHALL be staged locally,
matching the file-listing staging behavior above — no request reaches Core until the reviewer saves
the publication, and discarding reverts both fields to `SKILL.md`'s last-saved content without
contacting Core.

#### Scenario: The Skill tab appears after Properties
- **WHEN** a reviewer opens a pending Skill publication
- **THEN** the tab bar shows `Properties` followed by `Skill`

#### Scenario: Name is shown disabled from parsed frontmatter
- **WHEN** a reviewer opens the Skill tab
- **THEN** the `Name` input shows `SKILL.md`'s frontmatter `name` and cannot be edited

#### Scenario: Description is editable and pre-populated
- **WHEN** a reviewer opens the Skill tab
- **THEN** the `Description` input shows `SKILL.md`'s frontmatter `description` and can be edited

#### Scenario: The markdown editor shows the manifest body
- **WHEN** a reviewer opens the Skill tab
- **THEN** the markdown editor shows `SKILL.md`'s content after its frontmatter block, editable

#### Scenario: Editing description or body stages a change
- **WHEN** a reviewer edits the `Description` input or the markdown editor's content
- **THEN** no request reaches Core until the publication is saved

#### Scenario: Saving the publication reassembles and writes SKILL.md
- **WHEN** a reviewer with a staged Skill-tab change saves the publication
- **THEN** the staged `name`, `description`, and body are reassembled into a valid frontmatter
  document and written to `SKILL.md` via the existing per-file upload method, alongside any other
  staged file changes

#### Scenario: Discarding reverts staged Skill-tab changes without contacting Core
- **WHEN** a reviewer with a staged Skill-tab change discards their changes
- **THEN** the `Description` input and markdown editor revert to `SKILL.md`'s last-saved content and
  no request is sent to Core

#### Scenario: A save rejected for invalid frontmatter surfaces as an error
- **WHEN** Core rejects the save because the reassembled `SKILL.md` fails frontmatter validation
- **THEN** an error notification is shown, the staged change remains staged, and `SKILL.md` is left
  unchanged in Core
