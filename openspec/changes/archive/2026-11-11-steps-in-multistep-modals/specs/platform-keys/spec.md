## ADDED Requirements

### Requirement: Create-key modal is a three-step flow with a locked reveal step

The create-key modal SHALL present three steps through `Steps`: **Details** (name and project, both required),
**Roles** (at least one role required), and **Key** (the generated key value with a copy button). On the Details step
the footer SHALL offer Cancel and Next; on the Roles step it SHALL offer Back, Cancel, and **Create**, which creates the
key; after a successful create the modal SHALL move to the Key step, show the earlier steps as completed and not
selectable, and offer only Close. Closing from the Key step SHALL navigate to the new key's detail page.

#### Scenario: Steps are visible while creating

- **WHEN** the user opens the create-key modal
- **THEN** the modal shows the Details, Roles, and Key steps with Details current

#### Scenario: Create is offered on the Roles step

- **WHEN** the user has completed Details and is on the Roles step
- **THEN** the footer shows Create instead of Next
- **AND** Create is unavailable until at least one role is selected

#### Scenario: Key step is final and locked

- **WHEN** the key is created successfully
- **THEN** the Key step shows the generated key value with a copy button
- **AND** the Details and Roles steps are shown as completed and cannot be selected
- **AND** the only footer action is Close

#### Scenario: A failed create stays on the Roles step

- **WHEN** the create call fails
- **THEN** the modal stays on the Roles step with the entered details and selected roles intact

### Requirement: Duplicate-key modal is a two-step flow with a locked reveal step

The duplicate-key modal SHALL present two steps through `Steps`: **Name** and **Key**. The Name step footer SHALL offer
Cancel and **Create**; after a successful create the modal SHALL show the Key step with the Name step completed and
not selectable, and offer only Close.

#### Scenario: Create on the Name step reveals the key

- **WHEN** the user submits a unique name from the Name step and the create call succeeds
- **THEN** the modal shows the Key step with the generated key value and a copy button
- **AND** the only footer action is Close

### Requirement: Rotate-key modal is a two-step flow with a locked reveal step

The rotate-key modal SHALL present two steps through `Steps`: **Confirm** and **Key**. The Confirm step footer SHALL
offer Cancel and **Rotate**; after a successful rotation the modal SHALL show the Key step with the Confirm step
completed and not selectable, and offer only Close.

#### Scenario: Rotate on the Confirm step reveals the new key

- **WHEN** the user confirms rotation and the call succeeds
- **THEN** the modal shows the Key step with the new key value and a copy button
- **AND** the Confirm step cannot be selected and the only footer action is Close
