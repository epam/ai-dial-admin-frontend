## ADDED Requirements

### Requirement: Unit map and ownership
The shared org units context SHALL load the units visible to the caller with one recursive `GET
/v1/org-units/public` call, keep them keyed by each unit's `folder`, and expose a status of `loading`,
`ready`, `disabled` or `error`. A folder SHALL be considered inside a unit when a unit's `folder` is a
path prefix of it at a segment boundary; its owner SHALL be the longest such prefix. The panel SHALL
use the `folder` value core returns and SHALL NOT build it. After create, rename or remove the map SHALL be
reloaded.

#### Scenario: Units off
- **WHEN** the units call answers 404
- **THEN** the status is `disabled`, no unit control is shown and the page behaves as before

#### Scenario: Units cannot be loaded
- **WHEN** the units call answers 5xx
- **THEN** the details panel shows "Units can't be loaded right now. Try again." with a retry action and
  does not show folders as plain folders

#### Scenario: Subfolder belongs to its unit
- **WHEN** `public/Acme/Risk/` is a unit and the selected folder is `public/Acme/Risk/models/`
- **THEN** the owner is `public/Acme/Risk/`

#### Scenario: Name prefix is not ownership
- **WHEN** `public/Acme/Risk/` is a unit and the selected folder is `public/Acme/Risk2/`
- **THEN** the folder has no owning unit

#### Scenario: Nearest unit wins
- **WHEN** `public/Acme/` and `public/Acme/Risk/` are units and the selected folder is
  `public/Acme/Risk/models/`
- **THEN** the owner is `public/Acme/Risk/`

### Requirement: Details panel shows rules or roles by ownership
For a selected folder under no unit the details panel SHALL show the rules editor with its existing
draft, validation and Save/Discard behaviour. For a unit it SHALL show the unit header actions and the
roles card instead of the rules editor. For a plain folder inside a unit it SHALL show a read-only
statement that the owning unit's roles apply, with an action that selects the unit, and SHALL NOT show
the rules editor.

#### Scenario: Folder under no unit
- **WHEN** the user selects `public/Handbook/` and it has no owning unit
- **THEN** the rules editor is shown and no roles card is shown

#### Scenario: Unit selected
- **WHEN** the user selects a unit
- **THEN** the roles card and unit actions are shown and the rules editor is not

#### Scenario: Subfolder of a unit selected
- **WHEN** the user selects `public/Acme/Risk/models/` inside a unit
- **THEN** a read-only note names the owning unit and offers to select it, and no rules editor is shown

### Requirement: Roles card lists roles and holders
The roles card SHALL list the roles returned by `GET …/roles` in core's order, each with its description,
and under each role its holders from `GET …/role-assignments` as chips. Holder chips SHALL be classified
as person (`EQUAL` on `email`, or a target containing `@`), group (`EQUAL` on the configured group
claim), everyone signed in (`TRUE`), or DIAL role (`EQUAL` on `roles`); any other subject SHALL render as a
raw chip `source = targets` that can still be removed. A `403` from either call SHALL hide the card.

#### Scenario: Configured role appears without a panel change
- **WHEN** core returns a role named `files-reader` after the built-in four
- **THEN** the card shows a `files-reader` section after `member`

#### Scenario: Person and group chips
- **WHEN** an assignment subject is `EQUAL` on `email` with target `carol@acme.com`, and another is
  `EQUAL` on the configured group claim with target `us-risk-analysts`
- **THEN** the first renders as a person chip and the second as a group chip

#### Scenario: Unrecognised subject
- **WHEN** an assignment subject is `EQUAL` on `tenant` with target `a`
- **THEN** a raw chip `tenant = a` is shown and can be removed

#### Scenario: Card hidden on 403
- **WHEN** the role-assignments call answers 403
- **THEN** the roles card is not shown

### Requirement: Role edits are a draft saved with Save and Discard
Adding or removing a holder SHALL change a local draft only. The page SHALL show Save and Discard
(`ChangedEntityButtons`) while the draft differs from the stored assignments. Save SHALL `POST` each added
assignment (`roleName` and a `claimsPredicate` subject with `source`, `function`, `targets`) and `DELETE`
each removed one, sequentially, then reload the assignments from core. Discard SHALL restore the stored
assignments. Selecting another folder SHALL discard the draft without a prompt. Holder values SHALL be
non-blank, at most 256 characters and free of control characters before Save is enabled.

#### Scenario: Add a holder
- **WHEN** the user adds group `us-risk-analysts` to `editor`
- **THEN** the chip appears, Save and Discard are shown, and nothing has been sent to core

#### Scenario: Save sends only the difference
- **WHEN** the draft has one added and one removed holder and the user clicks Save
- **THEN** one POST and one DELETE are sent and the card shows the reloaded assignments

#### Scenario: Partial failure
- **WHEN** a POST succeeds and the following DELETE fails
- **THEN** sending stops, the assignments are reloaded from core, and core's error message is shown in a
  notification

#### Scenario: Discard
- **WHEN** the user clicks Discard
- **THEN** the card shows the stored assignments and Save/Discard disappear

#### Scenario: Selection change drops the draft
- **WHEN** the draft has changes and the user selects another folder
- **THEN** the draft is dropped without a prompt

#### Scenario: Invalid holder blocks Save
- **WHEN** an added holder value is blank or longer than 256 characters
- **THEN** Save is disabled

### Requirement: New unit
The page SHALL offer **New unit** in its header (and in the unit panel header). The dialog SHALL show the
parent, take `name` and optional `displayName`, and `POST /v1/org-units/public[/…]`. **New unit** SHALL be
disabled with "Units can only be created at the top of the shared space or in another unit." when the
selection is a plain folder that is not a direct child of `public`, and with "Units can be at most 4
levels deep." when the selection is a level-4 unit. Core's errors SHALL show next to the name field:
400 "Unit names can't contain these characters." for invalid characters, a leading `.`, or a trailing
space or `.`; 400 for reserved `roles`, `role-assignments`, `rate` as `"<name>" is reserved. Choose another
name.`; 409 for a sibling unit with that name in any case as `<parent> already has a unit named <name>.`;
409 for an existing folder or item as `<parent> already has a folder named <name>. Choose another name.`.
A successful create SHALL reload the units, expand the parent and select the new unit.

#### Scenario: Create under a unit
- **WHEN** a unit is selected and the user submits name `US Risk`
- **THEN** a POST to that unit's path is sent with `{"name": "US Risk"}` and the new unit is selected

#### Scenario: Create at the top of the shared space
- **WHEN** `public/` is selected and the user submits a name
- **THEN** a POST to `/v1/org-units/public` is sent

#### Scenario: Disabled inside a plain folder
- **WHEN** the selection is `public/Handbook/models/` under no unit
- **THEN** New unit is disabled and its tooltip states units can only be created at the top of the shared
  space or in another unit

#### Scenario: Disabled at the deepest level
- **WHEN** a level-4 unit is selected
- **THEN** New unit is disabled and its tooltip states units can be at most 4 levels deep

#### Scenario: Name already used by a folder
- **WHEN** core answers 409 for an existing folder named `Policies`
- **THEN** the name field shows that the parent already has a folder named Policies and the dialog stays
  open

#### Scenario: Reserved name
- **WHEN** the user submits `roles`
- **THEN** the name field shows that `roles` is reserved

### Requirement: Rename unit
**Rename** on a unit SHALL edit only its `displayName` through `PATCH /v1/org-units/public/<unit>` with
`{"displayName": …}`; the folder name SHALL never change. The display name SHALL be at most 128
characters and free of control characters; a blank value SHALL fall back to the unit's name. The tree and
panel title SHALL show the display name after a successful rename.

#### Scenario: Rename
- **WHEN** the user renames `US Risk` to `US Risk Department`
- **THEN** only `displayName` is sent and the tree and title show `US Risk Department`

#### Scenario: Too long
- **WHEN** the value exceeds 128 characters
- **THEN** the dialog's confirm action is disabled

### Requirement: Remove unit
**Remove unit** SHALL open one dialog listing the unit and its sub-units, and on confirm SHALL call
`DELETE /v1/org-units/public/<unit>?recursive=true`. On 409 the dialog SHALL stay open and show core's
message naming up to three blocking items; the panel SHALL NOT delete content. On success the units SHALL be
reloaded and the nearest surviving ancestor selected.

#### Scenario: Remove with sub-units
- **WHEN** the unit has two sub-units and the user confirms
- **THEN** the dialog listed both sub-units and one recursive DELETE was sent

#### Scenario: Unit still holds content
- **WHEN** core answers 409 naming `Reports/q3.xlsx`
- **THEN** the dialog stays open showing that message

### Requirement: Structural actions are disabled on unit folders in content pages
The content-page file managers SHALL load the unit map through the shared org units context and SHALL disable
Move, Rename and Delete for a unit folder and for a folder that contains a unit, in the grid context menu, the tree
menu and the bulk toolbar, showing why. When units are off, not loaded or failed to load, no action SHALL be
disabled by this rule.

#### Scenario: Unit folder
- **WHEN** a file manager lists a unit folder and the user opens its context menu
- **THEN** Move, Rename and Delete are disabled and state that the folder is an org unit

#### Scenario: Folder containing a unit
- **WHEN** a plain folder has a unit below it
- **THEN** Move, Rename and Delete are disabled for it

#### Scenario: Folder inside a unit stays editable
- **WHEN** the folder is inside a unit but contains no unit
- **THEN** Move, Rename and Delete are available as before

#### Scenario: Bulk selection
- **WHEN** a selection contains a unit folder
- **THEN** the toolbar's Move and Delete are disabled with the reason

#### Scenario: Units off
- **WHEN** the units call answers 404
- **THEN** no action is disabled

### Requirement: Unit map is shared by every folder context
One org units context SHALL hold the unit map, its status, the configured group claim and the ownership lookup,
and SHALL load the units once on first use by Folders Storage or any file manager. Asset folder contexts SHALL NOT
fetch units themselves.

#### Scenario: One load for several consumers
- **WHEN** Folders Storage and a file manager are used in one session
- **THEN** the units call is made once until a unit is created, renamed or removed

### Requirement: Group claim is configured
The claim name used to recognise and create group holders SHALL be a single value from the
`ORG_UNITS_GROUP_CLAIM` environment variable, documented as a commented entry in `.env.template` and in
the README, defaulting to `groups`. It SHALL be read on the server and passed to the Folders Storage
context.

#### Scenario: Default claim
- **WHEN** no value is configured
- **THEN** group holders are recognised and created using `groups`

#### Scenario: Configured claim
- **WHEN** `ORG_UNITS_GROUP_CLAIM` is `realm_access.roles` and the user adds group `us-risk-analysts`
- **THEN** the assignment is sent with `source` `realm_access.roles`, and an existing assignment on that
  source renders as a group chip

#### Scenario: Other claims stay raw
- **WHEN** the configured claim is `groups` and an assignment is `EQUAL` on `realm_access.roles`
- **THEN** it renders as a raw `source = targets` chip

### Requirement: Units API client contract
The panel SHALL call core with the signed-in user's token through server actions, encode each path
segment, and return `ServerActionResponse` with core's status and message. Unit delete SHALL be typed as
returning `{removed: string[]}` and assignment delete as `{removed: string}`.

#### Scenario: Path encoding
- **WHEN** a unit path is `public/Acme/Risk/US Risk`
- **THEN** the request path is `/v1/org-units/public/Acme/Risk/US%20Risk`

#### Scenario: Core error surfaces
- **WHEN** core answers 409 with a message
- **THEN** the action response is unsuccessful, carries status 409 and that message
