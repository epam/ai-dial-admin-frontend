## MODIFIED Requirements

### Requirement: Model asset list is flat with create and delete actions
The system SHALL render the model asset list as a single, non-nested list of entries under the `platform` root, built on the shared asset list, exposing create, delete, and bulk-delete actions and no folder-create, rename-folder, or move-into-folder controls — unlike the Apps asset list, which supports arbitrary nested folders.

The shared create dispatch SHALL remove its transient `folderId` and merged-read `_metadata` fields before it invokes the model create server action. All remaining model content and identity fields SHALL be preserved for the server action's existing Core payload transformation.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens the `/assets-models` list
- **THEN** all model resources are shown as direct entries with no folder-expand affordance

#### Scenario: No create-folder or move action is present
- **WHEN** a user opens the model asset list toolbar and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered, unlike the Apps asset list

#### Scenario: The folder tree offers no folder actions
- **WHEN** a user opens the context menu on the model asset folder tree's root
- **THEN** no add-sibling, add-child, rename, move, or manage-permissions action is offered, since the namespace is flat and a folder create would submit a placeholder asset Core cannot store

#### Scenario: A rejected folder create never fails silently
- **WHEN** a folder-create submission for this resource kind is rejected
- **THEN** the rejection is surfaced to the user as an error, rather than the pending tree node disappearing with no message

#### Scenario: Create action opens the model create modal
- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal opens requesting the model's name, and submitting it creates the model resource and navigates to its detail view

#### Scenario: Platform create dispatch does not forward shared identity fields
- **WHEN** the shared asset-list create dispatch invokes a flat platform create action with `folderId` and `_metadata` present
- **THEN** the delegated model create server action receives neither field and retains the model's content and identity fields

#### Scenario: Bulk delete removes the selected models
- **WHEN** a user selects several model resources and confirms bulk delete
- **THEN** each selected model is deleted and the list refreshes without them

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the model asset list
- **THEN** no create, delete, or bulk-delete action is offered
