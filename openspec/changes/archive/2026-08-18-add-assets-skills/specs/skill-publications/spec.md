## MODIFIED Requirements

### Requirement: Skill publication read-only properties view

The system SHALL show a Skill publication's detail view with the standard publication properties
(name, folder, comment — editable, shared with every other publication type) plus a skill-metadata
block (name, description, version — read-only; editing a skill's own parsed metadata requires
parsing and regenerating `SKILL.md`'s frontmatter, not built here) and a file listing (file name, no
size — Core reports none for this listing) with preview, download, add, and remove available, staged
locally and applied only when the reviewer saves the publication. (The requirement name predates this
file-listing capability; the skill's own metadata block remains read-only, which is what it refers to.)

#### Scenario: Skill metadata is displayed

- **WHEN** a reviewer opens a pending Skill publication
- **THEN** the properties tab shows the skill's name, description, and version alongside the
  standard publication fields

#### Scenario: A file can be previewed or downloaded

- **WHEN** a reviewer activates the preview or download action on a file row
- **THEN** the file's content opens for inline preview, or downloads, respectively

#### Scenario: A file other than SKILL.md can be staged for removal and applied on save

- **WHEN** a reviewer removes a file other than `SKILL.md` and then saves the publication
- **THEN** the file listing no longer shows the removed file locally right away, and saving deletes
  it from the skill's bundle in Core

#### Scenario: SKILL.md has no remove action

- **WHEN** the file listing renders the `SKILL.md` row
- **THEN** no remove action is offered for that row

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
