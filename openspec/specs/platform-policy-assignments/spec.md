# platform-policy-assignments Specification

## Purpose

The `Governance > Policy Assignments` admin surface over DIAL Core's `policy_assignments/platform` records: one
grant of a policy, saying who it reaches in which cost object. Shares the opt-in `POLICIES_ENABLED` switch,
the one-level cost-object folder tree, and the Subjects rule editor with `platform-policies`. An assignment is
always `<costObject>/<id>`, its `costObject` is taken from the folder and never typed twice, and its `policy`
is picked from the global policies and the cost object's own. Read and written directly through Core, never
through the admin backend. Created by archiving change `add-platform-policies`.
## Requirements
### Requirement: Governance > Policy Assignments menu entry
The system SHALL add a `Policy Assignments` item to the Governance group, directly after `Policies`,
linking to `/platform-policy-assignments`. The item SHALL be a Core-direct item, shown only when
`featureFlags.policiesEnabled` is `true` (see `platform-policies`). The same flag SHALL switch both entities together.

#### Scenario: Assignments follows Policies
- **WHEN** the Governance group of the menu renders, `POLICIES_ENABLED` is on
- **THEN** `Policy Assignments` appears immediately after `Policies`

#### Scenario: Entry carries the Preview badge
- **WHEN** the `Policy Assignments` item renders
- **THEN** it shows the Preview badge

#### Scenario: Flag off hides the entry
- **WHEN** `POLICIES_ENABLED` is off
- **THEN** `Policy Assignments` is absent from the Governance group

### Requirement: Assignment list columns are metadata-only
The system SHALL show name, cost object, author, created-at, and updated-at columns, sourced from Core's
resource metadata and the assignment's path, and SHALL NOT fetch each row's content to populate the list.

#### Scenario: Listing issues no per-row content request
- **WHEN** the assignment list loads
- **THEN** only metadata requests are issued, with no content request per row

### Requirement: Assignment create modal derives the cost object from the folder
The system SHALL open a create modal requesting **Cost object**, **ID**, **Policy**, and optionally
the subject rules, because Core needs a subject pinned by the policy or by the assignment. The cost object
SHALL name the folder the assignment is written to, and the saved body SHALL carry the same value as
`costObject`. The cost object is always entered in the modal and never pre-filled from the list. The ID SHALL
follow Core's entity-name rule.

#### Scenario: Cost object is entered, not inherited
- **WHEN** a user opens the create modal from the header
- **THEN** Cost object is empty and editable

#### Scenario: The folder and the body agree
- **WHEN** a user submits cost object `team-a` and ID `grant-1`
- **THEN** the write goes to `policy_assignments/platform/team-a/grant-1` and its body has `costObject` equal to `team-a`

#### Scenario: Missing required value blocks create
- **WHEN** the cost object, ID, or policy is empty or invalid
- **THEN** an inline validation error is shown and Create is unavailable

### Requirement: Policy selector offers global policies and the cost object's own
The system SHALL fill the `policy` field from a single-select listing the global policies and the project
policies of the assignment's cost object, and SHALL NOT list other cost objects' project policies. If the
listing request fails, the system SHALL fall back to a text input holding the policy path and SHALL show
an error notification.

#### Scenario: Other cost objects' policies are filtered out
- **WHEN** Core holds `daily-cap`, `team-a/team-cap`, and `team-b/team-cap`, and the cost object is `team-a`
- **THEN** the selector offers `daily-cap` and `team-a/team-cap` and not `team-b/team-cap`

#### Scenario: Listing failure degrades to text input
- **WHEN** the policy listing request fails
- **THEN** the policy field is a text input accepting a path and an error notification is shown

### Requirement: Assignment detail view tab set
The system SHALL render an assignment detail view with a **Properties** tab and a **Subjects** tab and a
JSON editor toggle, using the shared simple-entity header with save and discard.

#### Scenario: Tabs are Properties and Subjects
- **WHEN** a user opens an assignment
- **THEN** the tabs `Properties` and `Subjects` are shown and `Properties` is active

### Requirement: Assignment Properties tab content
The system SHALL show on the Properties tab the fields `policy` (selector, required), `costObject`
(read-only, derived from the folder), `source`, `ticket`, `description` (text), and `expiresAt`. `expiresAt`
SHALL be an ISO-8601 date-time with an offset and SHALL be omitted when empty.

#### Scenario: costObject is read-only
- **WHEN** a user opens an assignment's Properties tab
- **THEN** `costObject` shows the folder name and cannot be edited

#### Scenario: expiresAt without an offset is rejected
- **WHEN** a user enters `2027-01-01T00:00:00` with no offset
- **THEN** an inline validation error is shown and Save is unavailable

#### Scenario: Empty optional fields are omitted
- **WHEN** a user saves with `ticket` and `expiresAt` left empty
- **THEN** the payload contains neither field

### Requirement: Assignment Subjects tab edits the subject rule list
The system SHALL show on the Subjects tab the same rule editor as the policy Subjects tab, with the
same semantics for `TRUE`/`FALSE`, for requiring a source and at least one target on every other rule
(Save and Create are unavailable while a rule lacks either), and for omitting an empty list, and SHALL tell the user that `subject`
is pinned by either the policy or the assignment, never by both.

#### Scenario: Rule editor matches the policy editor
- **WHEN** a user adds a rule with function `EQUAL`, source `roles`, and target `admin`
- **THEN** the rule is added and the pending-changes state is raised

#### Scenario: A rule without targets blocks the save
- **WHEN** a rule whose function is `EQUAL`, `CONTAIN`, or `REGEX` has no targets
- **THEN** the targets control shows an inline error and Save is unavailable

#### Scenario: Empty rule list is omitted
- **WHEN** a user removes every rule and saves
- **THEN** the payload contains no `subject` field

### Requirement: Assignment update, discard, delete, duplicate, and bulk delete
The system SHALL save an assignment with the ETag it was loaded with and show the standard success
notification, SHALL support discard and delete from the detail header, SHALL offer duplicate into the
same cost-object folder under a new ID, and SHALL offer bulk delete.

#### Scenario: Save sends the loaded ETag
- **WHEN** a user changes a field and saves
- **THEN** the write carries the ETag read with the assignment and the success notification is shown

#### Scenario: Duplicate stays in the cost-object folder
- **WHEN** a user duplicates `team-a/grant-1` as `grant-2`
- **THEN** `team-a/grant-2` exists with the same fields

#### Scenario: Bulk delete removes the selected assignments
- **WHEN** a user selects several assignments and confirms bulk delete
- **THEN** each is deleted and the list refreshes without them

### Requirement: Core validates a write; the client adds only shape checks
The system SHALL send assignment writes to Core and SHALL NOT re-implement Core's semantic rules (policy
existence, cost-object ownership, subject pinned exactly once, instance-id collisions, `expiresAt` in the
future). The system SHALL render Core's 400, 409, and 422 messages unchanged in an error notification
and SHALL omit `id` from payloads. A failed create SHALL show exactly one error notification and keep the
create form open with the user's edits.

#### Scenario: A 422 is shown as returned
- **WHEN** Core answers 422 because the referenced policy does not exist
- **THEN** that message is shown in the error notification and the form keeps the user's edits

#### Scenario: Failed create shows one error
- **WHEN** a valid assignment form is submitted and Core rejects the write, including a subject-rule error or priority conflict
- **THEN** exactly one notification shows Core's unchanged error details and the create form remains open with the entered values

### Requirement: Assignments need no admin-backend call
The system SHALL read and write assignments only through DIAL Core and SHALL NOT call the admin backend
or Core's config-file population for them.

#### Scenario: No admin-backend request
- **WHEN** a user lists, opens, saves, or deletes an assignment
- **THEN** no request is made to the admin backend

### Requirement: Assignment create modal presents Details and Subjects as steps

The policy assignment create modal, which shares its implementation with the policy create modal, SHALL present two
steps through `Steps`: **Details** (cost object, ID, and policy) and **Subjects** (the subject rule list). The Details
step footer SHALL offer Cancel and Next, with Next unavailable while the details are invalid. The Subjects step footer
SHALL offer Back, Cancel, and Finish labeled **Create**. The cost-object folder rules, validation, create call, success
notification, and navigation SHALL be unchanged.

#### Scenario: Both steps are visible

- **WHEN** a user opens the assignment create modal
- **THEN** the modal shows the Details and Subjects steps with Details current

#### Scenario: Next waits for valid details

- **WHEN** the cost object, ID, or policy is empty or invalid
- **THEN** Next is unavailable and the Subjects step cannot be selected in the indicator

#### Scenario: Locked cost object survives the step change

- **WHEN** the modal was opened inside the `team-a` folder and the user moves to Subjects and back
- **THEN** Cost object still shows `team-a` and cannot be changed

### Requirement: Assignment list is a flat grid with a cost-object column

The system SHALL render the assignment list as the Platform tab's flat grid: every assignment is one row and shows
its cost object in the **Cost object** column. Every assignment has a cost object, so the Cost object cell SHALL never be
empty. The list SHALL NOT render cost-object folders as rows or tree nodes, and SHALL NOT offer create-folder,
rename-folder, move-to-folder or delete-folder.

#### Scenario: Entries are rows with their cost object
- **WHEN** Core holds `team-a/grant-1`
- **THEN** one row `grant-1` is shown with `team-a` in its Cost object cell

#### Scenario: Read-only admin sees no mutating actions
- **WHEN** a read-only admin opens the assignment list
- **THEN** no create, delete, or duplicate action is offered

