## MODIFIED Requirements

### Requirement: Policy create modal
The system SHALL open a create modal from the list toolbar requesting the policy name, an optional
**Cost object**, and the budget fields Core requires on every write (priority, what the policy applies to,
and a cost limit). A blank cost object SHALL create a global policy; a value SHALL create a project policy in
the folder of that cost object. When the list is showing a cost-object folder the field SHALL be
pre-filled with it. The name and the cost object SHALL follow Core's entity-name rule. The modal SHALL
show these fields on a **Details** step and optional subject rules on a **Subjects** step. Next SHALL be
available only when Details is valid; Back SHALL retain edits on both steps. Create SHALL require valid
Details and valid subject rule shapes, but SHALL allow an empty subject list. Rules SHALL follow the
existing policy Subjects validation and an empty list SHALL be omitted. If both a cost-object folder and
subject rules are present, the created policy body SHALL contain the folder cost object as `costObject`;
otherwise it SHALL omit the body `costObject`. The hint SHALL explain the distinction. After success the system
SHALL show the existing success notification and navigate to the policy detail view. On failure it SHALL
show Core's error details unchanged and keep the modal open with the user's edits.

#### Scenario: Blank cost object makes a global policy
- **WHEN** a user submits a valid name with the cost object left blank
- **THEN** the policy is written to `policies/platform/<name>` without a body cost object and the detail view opens

#### Scenario: A cost object makes a project policy
- **WHEN** a user submits a valid name with cost object `team-a` and no subject rules
- **THEN** the policy is written to `policies/platform/team-a/<name>` without a body cost object

#### Scenario: A project policy with subjects pins the cost object
- **WHEN** a user creates a valid policy with cost object `team-a` and valid subject rules
- **THEN** the Core policy body contains the subject rules and `costObject: team-a`, and the detail Properties and JSON views show that cost object

#### Scenario: A global policy with subjects has no cost object pin
- **WHEN** a user creates a valid policy with subject rules and a blank cost object
- **THEN** the policy body contains the subject rules and omits `costObject`

#### Scenario: Create waits for valid subjects
- **WHEN** a subject rule is incomplete
- **THEN** Create is unavailable until the rule is completed or removed

#### Scenario: Create waits for a valid budget
- **WHEN** the priority is empty or no cost window is set in the create modal
- **THEN** Next is unavailable and the field shows its inline error

#### Scenario: The current folder pre-fills the cost object
- **WHEN** a user opens the create modal while the list shows the `team-a` folder
- **THEN** Cost object shows `team-a`

#### Scenario: Invalid name blocks create
- **WHEN** the name is empty or contains a character Core's entity-name rule rejects
- **THEN** an inline validation error is shown and Next is unavailable

#### Scenario: Navigate between steps without losing edits
- **WHEN** a user enters valid Details, selects Next, enters a subject rule, selects Back, and returns to Subjects
- **THEN** the Details and subject rule edits are retained

#### Scenario: Core rejects creation
- **WHEN** Core rejects a policy create request
- **THEN** its error details are shown unchanged and the modal remains open with the entered values
