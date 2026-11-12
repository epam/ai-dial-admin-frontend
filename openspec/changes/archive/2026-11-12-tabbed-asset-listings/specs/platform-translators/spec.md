## MODIFIED Requirements

### Requirement: Translator asset list is flat with create and delete actions
The system SHALL render the translator asset list with a flat Platform tab and a config.json tab, built on the shared tabbed listing. The Platform tab SHALL retain create (header) and delete actions; the config.json tab SHALL list config-file-defined translators and expose no mutating action.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/platform-translators`
- **THEN** all translator resources are shown as direct grid rows with no folder-expand affordance

#### Scenario: Translator resource list remains mutable
- **WHEN** a user browses the Platform tab on `/platform-translators`
- **THEN** create and delete actions remain available according to the user's permissions

#### Scenario: Translator config.json tab is read-only
- **WHEN** a user opens the config.json tab on `/platform-translators`
- **THEN** config-file translator names are listed and no create, delete, duplicate, move, rename, or folder action is offered

#### Scenario: No create-folder, move, or duplicate action is present
- **WHEN** a user opens the translator asset list header and row actions
- **THEN** no create-folder, move-to-folder, or duplicate action is offered

#### Scenario: Create action opens the translator create modal
- **WHEN** a user activates the header Create button
- **THEN** a modal opens requesting only the translator's name — no display name or description
  field, since `Translator` has neither — and submitting it creates the resource and navigates to its
  detail view

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the translator asset list
- **THEN** no create or delete action is offered
