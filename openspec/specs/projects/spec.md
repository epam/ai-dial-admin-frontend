# projects Specification

## Purpose
The `Artifacts > Projects` surface — a menu entry after `Skills`, a metadata-only folder-tree list with row, bulk and
folder delete, creation from a name and description, and a single-tab detail view with Description, Instructions and a
Context section of files (added from the device or from file storage, shown as tiles, counted against env-driven
limits). A project is a folder of files in the chat application's layout: `PROJECT.md` at the root and context files
under `context/`. Created by archiving change `add-projects-entity`.

## Requirements

### Requirement: Artifacts > Projects menu entry
The system SHALL add a `Projects` item to the `Artifacts` menu group directly after `Skills`, linking to the
`/projects` route. The item SHALL be shown unconditionally, with no feature flag and no `catalog` token gating.

#### Scenario: Projects follows Skills in the Artifacts group
- **WHEN** the Artifacts group of the menu renders
- **THEN** `Projects` appears immediately after `Skills`

#### Scenario: Selecting Projects navigates to its list
- **WHEN** a user selects `Projects` from the Artifacts group
- **THEN** the app navigates to `/projects`

### Requirement: Project list is a folder tree with metadata-only columns
The system SHALL render the Projects list on the shared asset list as a folder tree (a grouping folder may
contain projects or further folders), with columns `Name`, `Author`, `Created time`, `Updated time` sourced only
from Core's `GET /v2/metadata/projects/{bucket}/{path}` listing. The list SHALL issue no per-row content or
manifest request.

#### Scenario: Listing issues only the folder-metadata request
- **WHEN** the Projects list loads or a folder is expanded
- **THEN** only the folder-metadata listing request is issued for that path

#### Scenario: Columns are Name, Author, Created time, Updated time
- **WHEN** the Projects list renders
- **THEN** exactly those four columns are shown, with both date columns locale-formatted

#### Scenario: Empty list shows the empty state
- **WHEN** there are no projects or folders at the current path
- **THEN** the standard empty-state message is shown

### Requirement: Project list offers delete, bulk delete, folder and project creation; no import, export or move
The system SHALL offer row delete and multi-select bulk delete, and a `Create` toolbar action with the options
`Folder` and `Project`. The system SHALL NOT offer import, export, or a row-level move action. Deleting a
grouping-folder row SHALL recursively delete every project and nested folder it contains through Projects' own
Core endpoints, bottom-up, stopping at the first failure.

#### Scenario: Create offers exactly Folder and Project
- **WHEN** a user opens the toolbar's `Create` action
- **THEN** exactly `Folder` and `Project` are offered

#### Scenario: Row and bulk delete remove projects
- **WHEN** a user confirms deleting one or several selected projects
- **THEN** each is deleted with its etag and the list refreshes without them

#### Scenario: Deleting a folder deletes its contents first
- **WHEN** a user confirms deleting a grouping folder that contains projects and nested folders
- **THEN** every project and nested folder is deleted before the folder itself

#### Scenario: A failed delete stops the folder delete
- **WHEN** deleting a project or nested folder fails partway through a folder delete
- **THEN** the operation reports failure and attempts no further deletes

#### Scenario: No import, export or move is offered
- **WHEN** a user opens the toolbar and row actions
- **THEN** no import, export, or move-to-folder action is present

### Requirement: Creating a project needs only a name and a description
The system SHALL let a user create a project from `Create > Project` through a modal with required `Name` and
`Description`. On submit the system SHALL create a project at the currently open path through a create-only
`PUT /v2/projects/{bucket}/{path}` carrying a single generated `PROJECT.md` whose YAML frontmatter holds `name`
and `description` and whose body is empty, and SHALL navigate to the new project's detail page. No file upload
SHALL be offered or required in the modal.

#### Scenario: Name accepts only lowercase letters, digits and hyphens
- **WHEN** a user enters a `Name` with any other character, including a space
- **THEN** the modal shows a validation error and the create action is disabled

#### Scenario: Name must be unique within the current folder
- **WHEN** a user enters a `Name` matching a project or folder already listed at the current path
- **THEN** the modal shows a duplicate-name error and the create action is disabled

#### Scenario: Description is required
- **WHEN** the `Description` is empty
- **THEN** the create action is disabled

#### Scenario: Submitting creates a manifest-only project and opens it
- **WHEN** a user enters a valid `Name` and `Description` and confirms
- **THEN** a project is created with only `PROJECT.md` carrying that name and description, and the browser
  navigates to the project's detail page

#### Scenario: A create-only request fails if the name already exists on the server
- **WHEN** the submitted name already exists on the server
- **THEN** the request fails, the modal stays open, and an error notification is shown

### Requirement: Project detail view has a single Properties tab with read-only metadata
The system SHALL render a project's detail page with one `Properties` tab and no other tab. It SHALL show the
project's path, author and created/updated dates read from Core, a disabled `Name` input holding the
project's name (its last path segment), and no destination-folder field. A project that no longer exists SHALL
render the standard not-found page. Breadcrumbs SHALL reflect the project's folder path.

#### Scenario: Properties shows read-only metadata and a disabled name
- **WHEN** a user opens a project
- **THEN** the path, author and dates are shown, `Name` is shown disabled, and no other tab or folder field is
  present

#### Scenario: A missing project renders not-found
- **WHEN** a user opens a path that no longer resolves to a project
- **THEN** the standard not-found page is rendered

### Requirement: Project Description and Instructions are edited on the Properties tab
The system SHALL show an editable `Description` input populated from `PROJECT.md`'s frontmatter `description` and
a markdown `Instructions` editor populated from the manifest body, both on the Properties tab below `Name`. Edits
SHALL be staged locally with no Core request until Save. Frontmatter keys other than `name` and `description`
SHALL be preserved on Save. A manifest that is missing or has no valid frontmatter SHALL show an empty
`Description` and the whole text as `Instructions`.

#### Scenario: Fields are populated from the manifest
- **WHEN** a user opens a project whose `PROJECT.md` has a description and a body
- **THEN** `Description` shows the description and `Instructions` shows the body

#### Scenario: Editing stages a change
- **WHEN** a user edits `Description` or `Instructions`
- **THEN** no request reaches Core and the header offers Save and Discard

#### Scenario: Saving rewrites PROJECT.md and keeps unknown keys
- **WHEN** a user saves a staged Description or Instructions change on a project whose manifest has an extra
  frontmatter key
- **THEN** `PROJECT.md` is rewritten with the new values and the extra key is unchanged

#### Scenario: Missing frontmatter shows the text as instructions
- **WHEN** a project's `PROJECT.md` has no valid frontmatter
- **THEN** `Description` is empty and `Instructions` shows the full text

### Requirement: Project Context section manages files under context/
The system SHALL render a `Context` section under Instructions, styled like the chat application's project form:
a capacity meter, an `Add` menu offering `From device` and `From file storage`, a file dropzone, rejection
messages, and one square tile per file, plus an `aria-live` status announcing adds and removes. A tile SHALL show the
file's name without its extension, a file-type icon with the extension and, when known, the size beneath it, and its
actions (download and remove for a stored file; remove alone for a staged one) in its top corner, revealed on
hover or keyboard focus. It SHALL list only files under the project's `context/` folder,
with the `context/` prefix removed, and SHALL NOT show `PROJECT.md` or any file outside `context/`, and SHALL NOT
offer to add any file outside `context/`. Added files SHALL be uploaded to `context/{name}` and removed files
deleted from it. Additions and removals SHALL be staged and written only on Save; Discard SHALL revert them
without contacting Core. Stored files SHALL be downloadable without staging a change. The section
SHALL be disabled for a read-only admin.

#### Scenario: Only context files are listed
- **WHEN** a project holds `PROJECT.md`, `context/a.csv` and `notes/b.txt`
- **THEN** the Context section shows one card named `a.csv`

#### Scenario: A tile shows the name, type and size
- **WHEN** a stored file `report.pdf` of 2048 bytes is listed
- **THEN** its tile shows `report`, and `PDF · 2 KB` beside the file-type icon, wide enough for the size to be visible

#### Scenario: The add menu offers both sources
- **WHEN** a user opens the `Add` menu
- **THEN** `From device` and `From file storage` are offered

#### Scenario: Files can be picked from file storage
- **WHEN** a user chooses `From file storage`, selects one or more files in the file browser, and confirms
- **THEN** copies of the selected files are staged exactly as if they had been added from the device, the stored files
  stay where they are, and they go through the same extension, size, count and duplicate checks

#### Scenario: A failed pick from file storage stages nothing
- **WHEN** a selected file cannot be downloaded
- **THEN** an error notification is shown and no file is staged

#### Scenario: Only files can be picked from storage
- **WHEN** a user selects a grouping folder in the file browser
- **THEN** the folder is not counted as a selection and Confirm stays disabled until a file is selected

#### Scenario: Adding a file stages it
- **WHEN** a user adds a file through the dropdown or the dropzone
- **THEN** a card appears immediately, no request reaches Core, and the header offers Save and Discard

#### Scenario: Removing a file stages the removal
- **WHEN** a user removes a stored file
- **THEN** its card disappears, no request reaches Core, and the header offers Save and Discard

#### Scenario: Saving applies staged changes under context/
- **WHEN** a user saves staged additions and removals
- **THEN** each added file is uploaded to `context/{name}`, each removed file is deleted, and Save/Discard
  disappears on success

#### Scenario: Discard reverts without contacting Core
- **WHEN** a user discards staged Context changes
- **THEN** the section returns to the last saved state and no request is sent

### Requirement: Context additions are validated against env-driven limits
The system SHALL validate each added file against limits read server-side from `PROJECT_CONTEXT_ALLOWED_EXTENSIONS`
(default `csv,pdf,xlsx`; trimmed, lower-cased, leading dot stripped, empty entries dropped, empty or unset gives
the default), `PROJECT_CONTEXT_FILE_MAX_BYTES` (default 1048576) and `PROJECT_CONTEXT_TOTAL_MAX_BYTES` (default
10485760), plus a fixed cap of 100 context files. A byte variable that is unset or not a positive integer SHALL
fall back to its default. A file that fails a check SHALL NOT be staged and SHALL be reported by name with its
reason: not allowed extension, over the per-file size, over the total capacity, over the file count, or a
duplicate name. The capacity meter SHALL show the used share of the total limit. Stored files SHALL always be
shown regardless of extension.

#### Scenario: A disallowed extension is rejected
- **WHEN** a user adds `notes.txt` and the allowed extensions are `csv,pdf,xlsx`
- **THEN** the file is not staged and a message names `notes.txt` and the extension reason

#### Scenario: An oversized file is rejected
- **WHEN** a user adds a file larger than `PROJECT_CONTEXT_FILE_MAX_BYTES`
- **THEN** the file is not staged and a message names it with the size reason

#### Scenario: Exceeding total capacity is rejected
- **WHEN** adding a file would push the context total over `PROJECT_CONTEXT_TOTAL_MAX_BYTES`
- **THEN** the file is not staged and a message names it with the capacity reason

#### Scenario: A duplicate name is rejected
- **WHEN** a user adds a file whose name matches an existing or staged context file
- **THEN** the file is not staged and a message names it with the duplicate reason

#### Scenario: Stored files count toward the capacity after a reload
- **WHEN** a project holding context files is opened
- **THEN** the capacity meter counts the stored files' sizes, read from the project's archive because Core's file
  listing reports none, and does not count `PROJECT.md`

#### Scenario: An unreadable archive does not block the page
- **WHEN** the project's archive cannot be read or is larger than Core's per-project total
- **THEN** the project still opens, with its stored files shown and counted as 0 bytes toward the capacity

#### Scenario: Unset or invalid variables use defaults
- **WHEN** a limit variable is unset, empty, or not a positive integer
- **THEN** its default value is used

### Requirement: Project Save applies steps in order and reports failures
The system SHALL apply a Save as manifest rewrite (if Description or Instructions changed), then context file
deletes, then context file uploads, stopping at the first failure. A failure SHALL show an error notification with
Core's message, keep the staged changes, and not show the success notification. A successful Save SHALL show the
standard update notification and refresh the page state.

#### Scenario: A failed step stops the save and keeps staged changes
- **WHEN** an upload fails during Save
- **THEN** an error notification is shown, later steps are not attempted, and the staged changes remain

#### Scenario: A successful save notifies and refreshes
- **WHEN** every Save step succeeds
- **THEN** the update notification is shown and the view reflects the saved state

### Requirement: Project detail offers delete only
The system SHALL offer a Delete action in the detail header when nothing is staged, using the project's etag,
and Save/Discard when changes are staged. A read-only admin SHALL be offered neither. Delete SHALL confirm and then
return to the Projects list.

#### Scenario: Delete confirms and returns to the list
- **WHEN** a user confirms deleting a project from its detail page
- **THEN** the project is deleted and the browser returns to the Projects list

#### Scenario: Read-only admin sees no mutating actions
- **WHEN** a read-only admin opens a project
- **THEN** no Delete, Save, Discard, add-file or remove-file control is operable

### Requirement: Project interoperates with the chat application's layout
The system SHALL read and write projects using the chat application's layout: `PROJECT.md` at the root with YAML
frontmatter `name` and `description` and a markdown body of instructions, and context files under `context/`.
The frontmatter `name` SHALL NOT be used as the project's name; the name is the resource path.

#### Scenario: A chat-created project opens in the admin
- **WHEN** a project created by the chat application is opened in the admin
- **THEN** its description, instructions and context files are shown

#### Scenario: An admin-created project is valid for chat
- **WHEN** a project is created in the admin and later opened in chat
- **THEN** it has a `PROJECT.md` with the frontmatter and body chat expects
