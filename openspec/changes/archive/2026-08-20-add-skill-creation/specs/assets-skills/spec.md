## MODIFIED Requirements

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
