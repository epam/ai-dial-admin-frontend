## MODIFIED Requirements

### Requirement: Model asset list is flat with create and delete actions
The system SHALL render the model asset list as the Platform tab's flat grid of entries, with a config.json tab beside it, exposing create (header) and delete actions and no folder-create, rename-folder, or move-into-folder controls — unlike the Apps Public tab, which supports arbitrary nested folders.

The shared create dispatch SHALL remove its transient `folderId` and merged-read `_metadata` fields before it invokes the model create server action. All remaining model content and identity fields SHALL be preserved for the server action's existing Core payload transformation.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens the `/assets-models` list
- **THEN** all model resources are shown as direct grid rows with no folder-expand affordance

#### Scenario: No create-folder or move action is present
- **WHEN** a user opens the model asset list header and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered, unlike the Apps Public tab

#### Scenario: Create action opens the model create modal
- **WHEN** a user activates the header Create button
- **THEN** a modal opens requesting the model's name, and submitting it creates the model resource and navigates to its detail view

#### Scenario: A created model with a colon in its name opens through an encoded detail route
- **WHEN** a user creates a Catalog model whose name contains `:` and Core returns the created identity under `_metadata.name`
- **THEN** the post-create redirect opens that model's detail view with `:` URL-encoded in the `[id]` segment, without a 404 page

#### Scenario: Platform create dispatch does not forward shared identity fields
- **WHEN** the shared asset-list create dispatch invokes a flat platform create action with `folderId` and `_metadata` present
- **THEN** the delegated model create server action receives neither field and retains the model's content and identity fields

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the model asset list
- **THEN** no create or delete action is offered
