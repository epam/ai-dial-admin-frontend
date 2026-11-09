## ADDED Requirements

### Requirement: Resource Dependencies tab on public-bucket application detail view
The system SHALL provide a `Resource Dependencies` tab on the public-bucket Assets > Applications
detail view, in the position the `Dependencies` tab previously held. The tab SHALL NOT appear on
platform-bucket applications, on the admin-backend Applications view, or on toolsets.

The `Dependencies` tab (the deployment-name `dependencies[]` editor) SHALL NOT appear on any
Assets > Applications detail view, public or platform. The admin-backend Applications view SHALL keep
its `Dependencies` tab. The `dependencies` property SHALL remain part of the application model and
SHALL remain editable through the JSON editor.

#### Scenario: Public application shows the new tab and not Dependencies
- **WHEN** a user opens a public-bucket application's detail view
- **THEN** a `Resource Dependencies` tab is present and no `Dependencies` tab is present

#### Scenario: Platform application shows neither tab
- **WHEN** a user opens a platform-bucket application's detail view
- **THEN** neither a `Resource Dependencies` tab nor a `Dependencies` tab is present

#### Scenario: Admin-backend Applications view is unchanged
- **WHEN** a user opens an application on the admin-backend Applications view
- **THEN** its `Dependencies` tab is present and no `Resource Dependencies` tab is present

#### Scenario: Deployment dependencies remain editable as JSON
- **WHEN** a user enables the JSON editor on an Assets > Applications detail view
- **THEN** the `dependencies` array is present in the editable document

### Requirement: Declared dependencies grid
The tab SHALL render, below the consent block, a grid that fills all remaining vertical space of the
tab. Its header SHALL show the label `Resource Dependencies: {n}` with the live number of declared
dependencies, and an `Add dependency` button aligned to the opposite edge. The grid SHALL have the
columns `Link ID`, `Target Path`, `Access`, `Required` and an action column offering Edit, Duplicate
and Remove. `Access` SHALL list the granted rights, `Required` SHALL show a yes/no state, and long
paths SHALL stay reachable in full through an ellipsis tooltip. Rows SHALL be shown in declaration
order. When there are no dependencies the grid SHALL show an empty state.

`Add dependency` SHALL be disabled, with an explanation, when the declaration already holds 100
entries.

#### Scenario: Header shows the live count
- **WHEN** an application declares three dependencies
- **THEN** the grid header reads `Resource Dependencies: 3`, and after one is removed it reads
  `Resource Dependencies: 2` without saving

#### Scenario: Grid fills the space below the consent block
- **WHEN** the tab is displayed
- **THEN** the grid occupies the remaining height of the tab and scrolls its own rows

#### Scenario: Rows show all columns
- **WHEN** an application declares `{ link_id: "skills-link", target: { path: "skills/{current-user}/" }, access: ["WRITE","READ"], required: true }`
- **THEN** its row shows `skills-link`, `skills/{current-user}/`, both rights, and a required state of yes

#### Scenario: Empty declaration
- **WHEN** an application has no `resource_dependencies`
- **THEN** the grid shows its empty state and the header reads `Resource Dependencies: 0`

#### Scenario: Add is capped
- **WHEN** the declaration holds 100 entries
- **THEN** `Add dependency` is disabled and conveys why

### Requirement: Add and edit dependency modal
`Add dependency` and a row's Edit action SHALL open a modal with:

- `Link ID` — text input, required;
- `Target path` — text input, required, with the placeholder
  `e.g. skills/{current-user}/ or files/public/folder/`;
- `Access` — `Read` and `Write` checkboxes;
- `Required` — a switch described by "A required dependency that is declined or unresolvable fails the
  call instead of the app running without it";
- footer buttons `Cancel` and `Add` (`Save` when editing).

Selecting `Write` SHALL also select `Read`, and `Read` SHALL be disabled (and remain selected) while
`Write` is selected. A new dependency starts with `Read` selected. While no right is selected the
modal SHALL show "Select at least one access right" next to `Access`. The confirm button
SHALL be disabled until `Link ID` and `Target path` are non-empty and every validation rule holds.
Confirming SHALL update the entity's draft only; nothing SHALL be persisted until the header Save.

#### Scenario: Write forces Read
- **WHEN** a user selects `Write`
- **THEN** `Read` becomes selected and disabled, and deselecting `Write` re-enables `Read`

#### Scenario: Add is disabled without any access right
- **WHEN** a user deselects `Read` while `Write` is not selected
- **THEN** the message "Select at least one access right" is shown and `Add` is disabled

#### Scenario: Add is disabled until required fields are filled
- **WHEN** the modal opens empty
- **THEN** `Add` is disabled, and it becomes enabled only after both `Link ID` and `Target path` hold
  valid values

#### Scenario: Adding appends a row in the draft
- **WHEN** a user fills the modal with Link ID `docs`, path `files/public/folder/`, Read, Required off and
  presses `Add`
- **THEN** the modal closes, the row appears last in the grid, and the entity is marked as changed

#### Scenario: Editing replaces the row in place
- **WHEN** a user edits a row, changes its path and presses `Save`
- **THEN** the row keeps its position and shows the new path

#### Scenario: Cancel discards the modal input
- **WHEN** a user presses `Cancel`
- **THEN** the modal closes and the declaration is unchanged

### Requirement: Dependency validation mirrors Core
The UI SHALL validate a dependency with the same rules Core applies at write time and SHALL show the
first failing rule next to the offending field:

- `Link ID` is required (after trimming) and unique among the declaration's dependencies
  (case-sensitive; the row being edited is excluded).
- `Target path` is required (after trimming). After removing one trailing `/` and decoding each segment
  (an undecodable segment is kept as is), the first segment SHALL be one of `files`, `prompts`,
  `conversations`, `applications`, `toolsets`, `skills`; a first segment of `users` SHALL be rejected
  with a message pointing to the `{current-user}` form; a path with only the type segment SHALL be
  rejected; `{current-user}` SHALL be accepted only as the second segment; no segment after the first
  may be empty, contain `*`, or equal `.` or `..`.
- At least one access right is present, and `SHARE` is never offered.

Core remains authoritative: a validation error returned by Core on Save SHALL be reported through the
normal save error notification.

#### Scenario: Both documented examples are accepted
- **WHEN** a user enters path `skills/{current-user}/` and, separately, `files/public/folder/`
- **THEN** each is accepted as valid

#### Scenario: Unknown root is rejected
- **WHEN** a user enters path `models/public/x`
- **THEN** the modal shows an error naming the allowed type roots and `Add` stays disabled

#### Scenario: Concrete personal path is rejected
- **WHEN** a user enters path `users/abc/files/x`
- **THEN** the modal shows an error telling the user to declare personal targets as
  `{type}/{current-user}/…`

#### Scenario: Bare type root is rejected
- **WHEN** a user enters path `files/`
- **THEN** the modal shows an error that a folder or resource within the type is required

#### Scenario: Placeholder in the wrong position is rejected
- **WHEN** a user enters path `files/public/{current-user}/`
- **THEN** the modal shows an error that the placeholder is valid only as the second segment

#### Scenario: Wildcards and relative segments are rejected
- **WHEN** a user enters path `files/public/*` or `files/public/../x`
- **THEN** the modal shows the corresponding error and `Add` stays disabled

#### Scenario: Encoded relative segment is rejected
- **WHEN** a user enters path `files/public/%2e%2e/x`
- **THEN** the modal rejects it as a relative segment

#### Scenario: Duplicate Link ID is rejected on create
- **WHEN** a user enters a Link ID that another dependency already uses
- **THEN** the modal shows a uniqueness error and `Add` stays disabled

#### Scenario: Editing a row does not conflict with itself
- **WHEN** a user edits a row without changing its Link ID
- **THEN** no uniqueness error is shown

### Requirement: Duplicating a dependency
A row's Duplicate action SHALL insert a copy directly after the source row without opening a modal.
The copy's `Link ID` SHALL be the source's followed by `_copy`; when that is taken, `_copy2`, `_copy3`
and so on until unique. All other fields SHALL be copied.

#### Scenario: First duplicate
- **WHEN** a user duplicates the row with Link ID `docs`
- **THEN** a new row `docs_copy` with identical path, access and required state appears right below it

#### Scenario: Repeated duplicate stays unique
- **WHEN** a user duplicates `docs` twice
- **THEN** the rows are `docs`, `docs_copy2`, `docs_copy` in order of insertion after the source,
  and all Link IDs are distinct

### Requirement: Removing a dependency
A row's Remove action SHALL remove the dependency from the draft and mark the entity changed. When the
last dependency is removed, `resource_dependencies` SHALL be omitted from the saved body rather than
saved as an empty array.

#### Scenario: Remove updates draft only
- **WHEN** a user removes a row
- **THEN** the row disappears, the count drops, and nothing is sent to Core until the header Save

#### Scenario: Removing the last row omits the property
- **WHEN** a user removes the only dependency and saves
- **THEN** the request body carries no `resource_dependencies` property

### Requirement: Dependency persistence shape
Dependencies SHALL be stored in the application's `resource_dependencies` array. Each entry SHALL have
the shape `{ "kind": "dial.resourceLink", "link_id": <string>, "target": { "path": <string> },
"access": [<"READ" | "WRITE">...], "required": <boolean> }`. `access` SHALL be emitted in the fixed
order `READ`, `WRITE`. `required` SHALL be written explicitly as a boolean.

#### Scenario: Entry shape
- **WHEN** a user adds a dependency with Read and Write selected and Required on, then saves
- **THEN** the saved array contains `{ "kind": "dial.resourceLink", "link_id": <id>, "target": { "path": <path> }, "access": ["READ","WRITE"], "required": true }`

#### Scenario: Existing declarations round-trip
- **WHEN** an application already holds `resource_dependencies` and the user changes an unrelated property
- **THEN** the array is sent back unchanged

### Requirement: Admin consent block
Above the grid the tab SHALL render an `Admin consent` block with a header label and, on its opposite
edge, the buttons `Re-Approve`, `Approve` and `Revoke` according to the state matrix below; a
sub-header of labelled values `Status` (`Approved` or `Not approved`), `Last approved by` and
`Last approved at`; and the state-dependent notes. `Last approved by` and `Last approved at` SHALL be
shown whenever Core reports a record exists, including a stale one.

| Saved dependencies | Core status | Status | Buttons |
|---|---|---|---|
| none | any | Not approved | none |
| one or more | no record | Not approved | Approve |
| one or more | `consented` | Approved | Revoke |
| one or more | `stale` | Not approved | Re-Approve, Revoke |

Status SHALL come from Core's `consented` / `stale` flags and SHALL NOT be recomputed in the UI.
`Re-Approve` SHALL NOT be shown unless the record is stale. While the status loads, the block SHALL
show a spinner and the grid SHALL remain usable.

When the draft's declaration differs from the saved one, the approving buttons (`Approve`,
`Re-Approve`) SHALL be disabled and the block SHALL show, in normal text colour, "Approval state
reflects the saved definition - save to update it". Differences in properties other than
`resource_dependencies` SHALL NOT trigger this.

When the record is stale, the block SHALL show, in the error text colour, "Declaration changed since last
approval - re-approve to restore". Whenever a record exists, an `Approved resources` list SHALL show
each approved target with its rights, for example `skills/{current-user}/ (WRITE, READ)`.

The status SHALL be fetched when the tab opens, and re-fetched after a successful Save of the entity,
after Approve and after Revoke.

#### Scenario: Never approved
- **WHEN** an application has saved dependencies and Core reports no record
- **THEN** Status is `Not approved`, only `Approve` is offered, and no approved-resources list is shown

#### Scenario: Approved
- **WHEN** Core reports `consented: true`
- **THEN** Status is `Approved`, the approver and time are shown, the approved resources are listed,
  and only `Revoke` is offered

#### Scenario: Stale after saving a change
- **WHEN** Core reports `stale: true`
- **THEN** Status is `Not approved`, `Re-Approve` and `Revoke` are offered, the red "Declaration changed
  since last approval - re-approve to restore" note is shown, and the previously approved resources are
  listed

#### Scenario: Unsaved edits disable approval
- **WHEN** a user adds a dependency and has not saved
- **THEN** `Approve` / `Re-Approve` are disabled and the "reflects the saved definition" note is shown

#### Scenario: Unrelated unsaved edits do not disable approval
- **WHEN** a user changes the application's description only
- **THEN** `Approve` / `Re-Approve` stay enabled

#### Scenario: Nothing declared
- **WHEN** the saved declaration is empty
- **THEN** no consent button is shown and Status is `Not approved`

#### Scenario: Status refreshes after Save
- **WHEN** a user saves a changed declaration
- **THEN** the consent status is re-read and the block reflects the new state

#### Scenario: Status announced to assistive technology
- **WHEN** the consent state changes
- **THEN** the state text is exposed through a polite live region

### Requirement: Approve and re-approve confirmation
Pressing `Approve` or `Re-Approve` SHALL open a confirmation with the header "Approve declared resources
dependencies?", the text "The application will act on the calling user's behalf for the declared
targets, for every user whose own reach covers them. The approval covers exactly the saved declaration
below - any change to it requires re-approval.", the list of the **saved** targets (with rights), and
`Cancel` / `Approve` buttons. Confirming SHALL call Core's grant endpoint, then re-fetch status.
Cancelling SHALL change nothing. A failure SHALL be reported through a notification carrying Core's
message and SHALL leave the dialog's trigger usable.

#### Scenario: Dialog lists the saved declaration
- **WHEN** a user opens the approve dialog
- **THEN** it lists every saved dependency's path, one per line, and not unsaved ones

#### Scenario: Confirming approves
- **WHEN** a user confirms
- **THEN** a grant request is sent for the application, a success notification is shown, and Status
  becomes `Approved`

#### Scenario: Cancelling approves nothing
- **WHEN** a user cancels
- **THEN** no request is sent

#### Scenario: Core rejects the approval
- **WHEN** Core answers the grant with an error
- **THEN** an error notification shows Core's message and the status is re-read

### Requirement: Revoke confirmation
Pressing `Revoke` SHALL open a confirmation with `Cancel` / `Revoke` buttons, explaining that the
application will immediately stop acting on users' behalf for the listed resources, for every user, and
that required dependencies will fail the call. The dialog SHALL list the currently **approved**
resources (Core's `grantedResources`) with their rights. Confirming SHALL call Core's withdraw
endpoint, then re-fetch status.

#### Scenario: Dialog lists approved resources
- **WHEN** a user opens the revoke dialog on a stale record
- **THEN** it lists the previously approved targets, not the current draft

#### Scenario: Confirming revokes
- **WHEN** a user confirms
- **THEN** a withdraw request is sent, a success notification is shown, and Status becomes
  `Not approved` with no approved-resources list

### Requirement: Consent unavailable renders the no-data state
The tab SHALL render the standard no-data component, instead of its content and including the grid,
when the consent status cannot be read: Core answers 403 (the user is not an administrator), 404 (Core
without the feature, or the application not found), or the request fails. No feature flag SHALL gate the
tab.

#### Scenario: Non-admin
- **WHEN** Core answers the status read with 403
- **THEN** the tab shows the no-data component and neither the grid nor the consent block

#### Scenario: Core without the feature
- **WHEN** Core answers the status read with 404
- **THEN** the tab shows the no-data component

### Requirement: Core-direct consent client
Consent reads and writes SHALL go to DIAL Core directly, not through the admin backend, using
`GET`, `POST` and `DELETE` on `/v1/consent/{application}/admin-consent` with the application's path
encoded as Core paths are elsewhere on this surface. The client SHALL expose Core's approved-resource
entries (`url`, `access`) to the UI as `path` and `access`, so no UI code depends on that field name.

#### Scenario: Status read maps entries
- **WHEN** Core returns `grantedResources: [{ "url": "skills/{current-user}/", "access": ["WRITE","READ"] }]`
- **THEN** the UI model carries `{ path: "skills/{current-user}/", access: ["WRITE","READ"] }`

#### Scenario: Mutations target the consent endpoint
- **WHEN** an admin approves or revokes
- **THEN** a `POST` or `DELETE` is sent to the application's `/admin-consent` endpoint respectively
