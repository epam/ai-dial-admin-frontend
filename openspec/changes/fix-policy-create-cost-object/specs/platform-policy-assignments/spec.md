## MODIFIED Requirements

### Requirement: Assignment create modal derives the cost object from the folder
The system SHALL open a create modal requesting **Cost object**, **ID**, **Policy**, and optionally
the subject rules, because Core needs a subject pinned exactly once across the policy and the assignment.
The cost object SHALL name the folder the assignment is written to, and the saved body SHALL carry the
same value as `costObject`. When create is launched from inside a cost-object folder the cost object SHALL be
pre-filled and not editable. The ID SHALL follow Core's entity-name rule. The modal SHALL show the
cost object, ID, and policy on a **Details** step and optional subject rules on a **Subjects** step.
Next SHALL be available only when Details is valid; Back SHALL retain edits on both steps. Create SHALL
require valid Details and valid subject rule shapes, but SHALL allow an empty subject list, which SHALL
be omitted from the body. The system SHALL NOT require subjects on the assignment or determine whether
the selected policy supplies them; Core SHALL validate the combined policy and assignment. The existing
assignment body and success and failure handling SHALL otherwise remain unchanged.

#### Scenario: Launched inside a folder locks the cost object
- **WHEN** a user opens the create modal while viewing the `team-a` folder
- **THEN** Cost object shows `team-a` and cannot be changed

#### Scenario: The folder and the body agree
- **WHEN** a user submits cost object `team-a` and ID `grant-1`
- **THEN** the write goes to `policy_assignments/platform/team-a/grant-1` and its body has `costObject` equal to `team-a`

#### Scenario: Missing required value blocks create
- **WHEN** the cost object, ID, or policy is empty or invalid
- **THEN** an inline validation error is shown and Next is unavailable

#### Scenario: Empty subjects are allowed on the assignment
- **WHEN** a user creates an assignment with valid Details and no subject rules
- **THEN** the request omits `subject` and Core decides whether the policy supplies the subject

#### Scenario: Incomplete subjects block create
- **WHEN** a subject rule has an invalid shape
- **THEN** Create is unavailable until the rule is completed or removed

#### Scenario: Navigate between steps without losing edits
- **WHEN** a user enters valid Details, selects Next, enters a subject rule, selects Back, and returns to Subjects
- **THEN** the Details and subject rule edits are retained

#### Scenario: Core rejects the policy and assignment subject combination
- **WHEN** Core rejects an assignment because its subject and the policy's subject do not meet Core's exactly-once rule
- **THEN** exactly one notification shows Core's unchanged error details and the create form stays open with the entered values
