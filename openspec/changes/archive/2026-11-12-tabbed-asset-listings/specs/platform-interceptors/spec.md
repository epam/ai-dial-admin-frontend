## MODIFIED Requirements

### Requirement: Interceptor asset list is flat with create and delete actions
The system SHALL render the interceptor asset list as the Platform tab's flat grid of entries, with a config.json tab beside it, exposing create (header) and delete actions and
no folder-create, rename-folder, or move-into-folder controls.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/assets-interceptors`
- **THEN** all interceptor resources are shown as direct grid rows with no folder-expand affordance

#### Scenario: No create-folder or move action is present
- **WHEN** a user opens the interceptor asset list header and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered

#### Scenario: Create action opens the interceptor create modal
- **WHEN** a user activates the header Create button
- **THEN** a modal opens requesting the interceptor's name and display name, and submitting it
  creates the resource and navigates to its detail view

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the interceptor asset list
- **THEN** no create or delete action is offered
