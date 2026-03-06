## MODIFIED Requirements

### Requirement: Immediate duplicate ID validation for deployment entities

The `DeploymentProperties` component SHALL pass the `names` array to `IdControl` so that duplicate ID validation triggers immediately on user input, not only on form submission.

#### Scenario: User enters a duplicate ID when creating a Model
- **WHEN** user types an existing entity ID in the ID field of the Model creation form
- **THEN** the "This ID already exists" error message SHALL appear immediately without submitting the form

#### Scenario: User enters a duplicate ID when creating an Application
- **WHEN** user types an existing entity ID in the ID field of the Application creation form
- **THEN** the "This ID already exists" error message SHALL appear immediately without submitting the form

#### Scenario: User enters a duplicate ID when creating a Toolset
- **WHEN** user types an existing entity ID in the ID field of the Toolset creation form
- **THEN** the "This ID already exists" error message SHALL appear immediately without submitting the form
