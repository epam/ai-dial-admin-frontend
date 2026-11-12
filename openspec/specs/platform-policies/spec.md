# platform-policies Specification

## Purpose

The `Governance > Policies` admin surface over DIAL Core's `policies/platform` records: the spending-limit
budgets that say what a policy covers and how much it allows. Core stores them and does not enforce them yet,
so the whole feature is opt-in behind `POLICIES_ENABLED`. Policies are read and written directly through Core
(`/v1/policies/platform/[<costObject>/]<name>`, listed through `/v1/metadata/...`) with ETag on writes, never
through the admin backend. They nest exactly one folder level, the cost object: a policy is global or
belongs to one cost object. Core stays the validator; the client adds only shape checks and shows Core's own
messages. Created by archiving change `add-platform-policies`.
## Requirements
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

### Requirement: Policy list columns are metadata-only
The system SHALL show name, cost object, author, created-at, and updated-at columns for policies, sourced
from Core's resource metadata and the policy's path, and SHALL NOT fetch each row's content to populate the list.

#### Scenario: Listing issues no per-row content request
- **WHEN** the policy list loads
- **THEN** only metadata requests are issued, with no content request per row

### Requirement: Policy create modal
The system SHALL open a create modal from the Create button on the tab row requesting the policy name, an optional
**Cost object**, and the budget fields Core requires on every write (priority, what the policy applies to,
and a cost limit). A blank cost object SHALL create a global policy; a value SHALL create a project policy in
the folder of that cost object. The name and the cost object SHALL follow Core's entity-name rule. After success the system
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

#### Scenario: Cost object starts blank
- **WHEN** a user opens the create modal from the header
- **THEN** Cost object is empty and editable

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

### Requirement: Policy create modal presents Details and Subjects as steps

The policy create modal SHALL present two steps through `Steps`: **Details** (the existing name, cost object, and
budget fields) and **Subjects** (the subject rule list). The Details step footer SHALL offer Cancel and Next, with Next
unavailable while the details are invalid. The Subjects step footer SHALL offer Back, Cancel, and Finish labeled
**Create**, unavailable while the details or any subject rule is invalid. Values entered on Details SHALL survive going
back from Subjects. Validation, the create call, the success notification, and navigation to the policy detail view
SHALL be unchanged.

#### Scenario: Both steps are visible

- **WHEN** a user opens the policy create modal
- **THEN** the modal shows the Details and Subjects steps with Details current

#### Scenario: Next waits for valid details

- **WHEN** the policy name or budget fields are invalid
- **THEN** Next is unavailable and the Subjects step cannot be selected in the indicator

#### Scenario: Create on the last step

- **WHEN** the user is on the Subjects step with valid details and valid rules
- **THEN** the footer shows Back, Cancel, and Create
- **AND** Create writes the policy and opens its detail view

#### Scenario: Going back keeps the entered details

- **WHEN** the user moves from Subjects back to Details
- **THEN** the previously entered values are still present

### Requirement: Policy list is a flat grid with a cost-object column

The system SHALL render the policy list as the Platform tab's flat grid: every policy is one row, global policies
have an empty **Cost object** cell, and each project policy shows its cost object in the Cost object cell. Core keeps a
cost-object folder only while it holds a record, so the list SHALL NOT render cost-object folders as rows or tree
nodes, and SHALL NOT offer create-folder, rename-folder, move-to-folder or delete-folder.

#### Scenario: Global and project policies are shown as rows
- **WHEN** a user opens `/platform-policies` and Core holds `daily-cap` and `team-a/team-cap`
- **THEN** two rows are shown, `daily-cap` with an empty Cost object cell and `team-cap` with `team-a` in its Cost object cell

#### Scenario: Folder actions are not offered
- **WHEN** a user opens the header or row actions
- **THEN** no create-folder, rename-folder, move or delete-folder action is offered

#### Scenario: Read-only admin sees no mutating actions
- **WHEN** a read-only admin opens the policy list
- **THEN** no create, delete, or duplicate action is offered

