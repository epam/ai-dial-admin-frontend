# skill-publications Specification

## Purpose
The Approvals-facing Skill Publications feature — a menu entry, route, list, and read-only detail
view (metadata plus a file listing) for reviewing pending Skill publication requests — created by
archiving change `add-skill-publications`. Skill is a folder-of-files resource (rooted at a
`SKILL.md` manifest) rather than a single-JSON-document resource like Toolset/Application, so this
capability's properties view is read-only: metadata display plus a file listing, with no in-browser
editing of the skill's own content. Approve/reject/delete reuse the generic publication actions
already used by every other publication type (see `publications-core-api`).

## Requirements

### Requirement: Skill Publications menu entry
The system SHALL show a "Skill Publications" item in the Approvals menu, positioned after File
Publications, so the full Approvals submenu order is: Application, Toolset, Prompt, Conversation,
File, Skill.

#### Scenario: Skill Publications appears last in Approvals
- **WHEN** a user opens the Approvals menu group
- **THEN** the items appear in the order Application, Toolset, Prompt, Conversation, File, Skill,
  with Skill Publications last

#### Scenario: Skill Publications navigates to its list
- **WHEN** a user selects "Skill Publications" from the Approvals menu
- **THEN** the app navigates to the Skill Publications list route

### Requirement: Skill publications list filtered by resource type
The system SHALL list pending Skill publications by requesting the publications list filtered to
the `SKILL` resource type, using the same list request and grid columns (name, author, created date,
actions) as the other publication types.

#### Scenario: Skill publications list shows only Skill-typed publications
- **WHEN** the Skill Publications list page loads
- **THEN** it displays only publications whose resolved resource type is `SKILL`

#### Scenario: Empty Skill publications list shows an empty state
- **WHEN** there are no pending Skill publications
- **THEN** the list shows the standard empty-state message rather than an error

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

### Requirement: Skill publication approve, reject, and delete reuse the generic actions
The system SHALL allow approving, rejecting (with comment), and deleting a Skill publication through
the same generic publication actions used by every other publication type, requiring no
Skill-specific server action.

#### Scenario: Approve a pending Skill publication
- **WHEN** a reviewer approves a pending Skill publication
- **THEN** the generic approve action is invoked with the publication's path and the publication
  moves out of the pending queue on success

#### Scenario: Reject a pending Skill publication with a comment
- **WHEN** a reviewer rejects a pending Skill publication with a comment
- **THEN** the generic reject action is invoked with the publication's path and sanitized comment
