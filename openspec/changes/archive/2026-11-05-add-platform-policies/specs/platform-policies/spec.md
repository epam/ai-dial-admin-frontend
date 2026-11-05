## ADDED Requirements

### Requirement: POLICIES_ENABLED switches the policies feature on
The system SHALL read the `POLICIES_ENABLED` environment variable through a single function and expose
the result as `featureFlags.policiesEnabled`. The variable SHALL be off when unset or falsy per
`isValueTruthy`, and the default SHALL be off. While it is off, the system SHALL NOT show the
`Policies` or `Policy Assignments` menu items and SHALL answer 404 for `/platform-policies`,
`/platform-policies/<id>`, `/platform-policy-assignments`, and `/platform-policy-assignments/<id>`.
The variable SHALL NOT gate the server actions.

#### Scenario: Unset means off
- **WHEN** `POLICIES_ENABLED` is not set
- **THEN** `featureFlags.policiesEnabled` is `false`

#### Scenario: Truthy value turns the feature on
- **WHEN** `POLICIES_ENABLED` is `true`
- **THEN** `featureFlags.policiesEnabled` is `true`

#### Scenario: Off hides the routes
- **WHEN** `POLICIES_ENABLED` is off and a user opens `/platform-policies` or `/platform-policy-assignments`
- **THEN** the not-found page is shown

#### Scenario: Off hides a detail address
- **WHEN** `POLICIES_ENABLED` is off and a user opens `/platform-policies/<id>`
- **THEN** the not-found page is shown and no request is made to Core

### Requirement: Governance > Policies menu entry
The system SHALL add a `Policies` item to the Governance group of the admin menu, after `Interceptors`
and before `Approvals`, linking to `/platform-policies`. The item SHALL be a Core-direct item, shown only
when `featureFlags.policiesEnabled` is `true`.

#### Scenario: Policies sits between Interceptors and Approvals
- **WHEN** the Governance group of the menu renders, `POLICIES_ENABLED` is on
- **THEN** `Policies` appears after `Interceptors` and before `Approvals`

#### Scenario: Entry carries the Preview badge
- **WHEN** the `Policies` item renders
- **THEN** it shows the Preview badge and the Governance group itself shows none

#### Scenario: Flag off hides the entry
- **WHEN** `POLICIES_ENABLED` is off
- **THEN** `Policies` is absent from the Governance group and the other Governance items are unchanged

### Requirement: Policy list is a one-level folder tree of cost objects
The system SHALL render the policy list on the shared asset list under the `platform` root, where root
entries are global policies and each folder is a cost object holding that cost object's project policies.
A cost-object folder exists in Core only while it holds a record, so the list SHALL NOT offer
create-folder, rename-folder, or move-to-folder, and SHALL NOT allow a folder inside a folder.

#### Scenario: Global and project policies are shown
- **WHEN** a user opens `/platform-policies` and Core holds `daily-cap` and `team-a/team-cap`
- **THEN** `daily-cap` is a root entry and `team-cap` is shown inside the `team-a` folder

#### Scenario: Folder actions are not offered
- **WHEN** a user opens the toolbar or row actions at the root or inside a cost-object folder
- **THEN** no create-folder, rename-folder, or move action is offered

#### Scenario: Read-only admin sees no mutating actions
- **WHEN** a read-only admin opens the policy list
- **THEN** no create, delete, bulk-delete, or duplicate action is offered

### Requirement: Policy list columns are metadata-only
The system SHALL show name, author, created-at, and updated-at columns for policies, sourced from
Core's resource metadata, and SHALL NOT fetch each row's content to populate the list.

#### Scenario: Listing issues no per-row content request
- **WHEN** the policy list loads
- **THEN** only metadata requests are issued, with no content request per row

### Requirement: Policy create modal
The system SHALL open a create modal from the list toolbar requesting the policy name, an optional
**Cost object**, and the budget fields Core requires on every write (priority, what the policy applies to,
and a cost limit). A blank cost object SHALL create a global policy; a value SHALL create a project policy in
the folder of that cost object. When the list is showing a cost-object folder the field SHALL be
pre-filled with it. The name and the cost object SHALL follow Core's entity-name rule. After success the system
SHALL show the existing success notification and navigate to the policy detail view.

#### Scenario: Blank cost object makes a global policy
- **WHEN** a user submits a valid name with the cost object left blank
- **THEN** the policy is written to `policies/platform/<name>` and the detail view opens

#### Scenario: A cost object makes a project policy
- **WHEN** a user submits a valid name with cost object `team-a`
- **THEN** the policy is written to `policies/platform/team-a/<name>`

#### Scenario: Create waits for a valid budget
- **WHEN** the priority is empty or no cost window is set in the create modal
- **THEN** Create is unavailable and the field shows its inline error

#### Scenario: The current folder pre-fills the cost object
- **WHEN** a user opens the create modal while the list shows the `team-a` folder
- **THEN** Cost object shows `team-a`

#### Scenario: Invalid name blocks create
- **WHEN** the name is empty or contains a character Core's entity-name rule rejects
- **THEN** an inline validation error is shown and Create is unavailable

### Requirement: Policy detail view tab set
The system SHALL render a policy detail view with a **Properties** tab and a **Subjects** tab, and a
JSON editor toggle in the header, using the shared simple-entity header with save and discard.

#### Scenario: Tabs are Properties and Subjects
- **WHEN** a user opens a policy
- **THEN** the tabs `Properties` and `Subjects` are shown and `Properties` is active

#### Scenario: JSON editor round-trips the form
- **WHEN** a user toggles the JSON editor, edits the document, and toggles back
- **THEN** the form fields reflect the edited JSON

### Requirement: Policy Properties tab content
The system SHALL show on the Properties tab the fields `priority` (integer, required), `kind` (select,
only `budget`), `quantity` (select, only `cost`), `object`, `cost.day`, `cost.month`, and `costObject`
(optional, text). `object` SHALL be either **All deployments** (stored as `"*"`) or a **list of deployment
names**, and an empty list SHALL NOT be submittable. `cost.day` and `cost.month` SHALL accept positive
decimals, and at least one of them SHALL be set. `per` SHALL be written as `["subject"]` and not be
editable.

#### Scenario: All deployments is stored as a star
- **WHEN** a user selects All deployments and saves
- **THEN** the payload carries `object` equal to `"*"`

#### Scenario: Deployment list requires at least one name
- **WHEN** a user selects the list mode and leaves it empty
- **THEN** an inline validation error is shown and Save is unavailable

#### Scenario: A cost window is required
- **WHEN** both `cost.day` and `cost.month` are empty
- **THEN** an inline validation error is shown and Save is unavailable

#### Scenario: Non-positive amount is rejected
- **WHEN** a user enters `0` or a negative number in `cost.day`
- **THEN** an inline validation error is shown and Save is unavailable

#### Scenario: Priority must be an integer
- **WHEN** a user enters `10.5` in `priority`
- **THEN** an inline validation error is shown and Save is unavailable

### Requirement: Policy Subjects tab edits the subject rule list
The system SHALL show on the Subjects tab an editable list of rules, each with `source`, `function`
(`TRUE`, `FALSE`, `EQUAL`, `CONTAIN`, `REGEX`) and `targets`. A rule whose function is `TRUE` or `FALSE`
SHALL have its targets control disabled and its targets cleared. Every other rule SHALL require a source and
at least one target, and the policy SHALL NOT be saveable while a rule lacks either. The system SHALL omit `subject` from the
payload when the list is empty and SHALL NOT send an empty array. The tab SHALL tell the user that
`subject` is pinned either by the policy or by each assignment, never by both.

#### Scenario: Add and remove a rule
- **WHEN** a user adds a rule, fills `source`, `function`, and `targets`, and later removes it
- **THEN** the rule list and the pending-changes state follow each action

#### Scenario: A rule needs at least one target
- **WHEN** a rule whose function is `EQUAL`, `CONTAIN`, or `REGEX` has no targets
- **THEN** the targets control shows an inline error and Save is unavailable

#### Scenario: A rule needs a source
- **WHEN** a rule has an empty source
- **THEN** Save is unavailable

#### Scenario: TRUE and FALSE take no targets
- **WHEN** a user sets a rule's function to `TRUE`
- **THEN** the targets control is disabled and any entered targets are cleared

#### Scenario: Empty rule list is omitted
- **WHEN** a user removes every rule and saves
- **THEN** the payload contains no `subject` field

### Requirement: Policy update, discard, and delete
The system SHALL save a policy with the ETag it was loaded with, SHALL show the standard success
notification and refresh the list, and SHALL support discard and delete from the detail header. A
concurrent-modification response SHALL surface Core's message as an error notification.

#### Scenario: Save sends the loaded ETag
- **WHEN** a user changes a field and saves
- **THEN** the write carries the ETag read with the policy and the success notification is shown

#### Scenario: Delete of a referenced policy shows Core's message
- **WHEN** a user deletes a policy that an assignment references and Core answers 409
- **THEN** an error notification shows Core's message and the policy remains

### Requirement: Policy list offers duplicate and bulk delete
The system SHALL offer a duplicate action that copies a policy into the same folder under a new name,
and a bulk-delete action over selected policies.

#### Scenario: Duplicate keeps the folder
- **WHEN** a user duplicates `team-a/team-cap` as `team-cap-copy`
- **THEN** `team-a/team-cap-copy` exists with the same fields

#### Scenario: Bulk delete stops at the first refusal
- **WHEN** a user bulk-deletes several policies and Core refuses one with 409
- **THEN** deletion stops at that policy, those before it are deleted, and an error notification shows Core's message

### Requirement: Deleting a cost object folder deletes its policies
The system SHALL let a user delete a cost object folder from the policy list. Core keeps no marker for such a
folder, which exists only while it holds a policy, so deleting it SHALL delete every policy under it, and the
folder disappears with the last one. The system SHALL address the folder with a trailing slash when listing
it, SHALL NOT offer to delete the root, and SHALL delete a policy selected next to the folder only once. A
refusal from Core, such as a policy an assignment still references, SHALL be shown as an error notification
with Core's message and SHALL stop the deletion at that policy.

#### Scenario: Deleting a folder removes its policies and the folder
- **WHEN** a user deletes the `team-a` folder that holds two policies and confirms
- **THEN** both policies are deleted and `team-a` is no longer listed

#### Scenario: A policy selected with its folder is deleted once
- **WHEN** a user selects the `team-a` folder and one of its policies and confirms the delete
- **THEN** the policy is deleted by the folder deletion alone and the delete reports success

#### Scenario: The root cannot be deleted as a folder
- **WHEN** a delete is requested for the platform root
- **THEN** nothing is deleted and an error is returned

#### Scenario: Core refuses a policy of the folder
- **WHEN** Core answers 409 for a policy in the folder because an assignment references it
- **THEN** an error notification shows Core's message and the deletion stops at that policy

### Requirement: Core validates a write; the client adds only shape checks
The system SHALL send policy writes to Core and SHALL NOT re-implement Core's semantic rules
(cost-object folder matching, priority ties, referenced-policy checks). The system SHALL render Core's
400, 409, and 422 messages unchanged in an error notification, and SHALL omit `id`, `attachedTo`,
`harness`, `broker`, `packages`, and any `per` other than `["subject"]` from payloads.

#### Scenario: A 422 is shown as returned
- **WHEN** Core answers 422 with a message
- **THEN** that message is shown in the error notification and the form keeps the user's edits

#### Scenario: Reserved fields are never sent
- **WHEN** a policy is saved from the form
- **THEN** the payload contains none of `id`, `attachedTo`, `harness`, `broker`, `packages`

### Requirement: Policies need no admin-backend call
The system SHALL read and write policies only through DIAL Core and SHALL NOT call the admin backend or
Core's config-file population for them.

#### Scenario: No admin-backend request
- **WHEN** a user lists, opens, saves, or deletes a policy
- **THEN** no request is made to the admin backend
