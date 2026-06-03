## ADDED Requirements

### Requirement: Dataset listing page shows only PUBLIC datasets
The system SHALL display a listing page at `/datasets` that shows only datasets with `visibility: PUBLIC`, fetched from `GET /api/v1/datasets` with a PUBLIC visibility filter. The page SHALL be accessible from the Evaluation section menu between "Test Suites" and "Runs".

#### Scenario: Navigating to the datasets listing
- **WHEN** the user clicks "Datasets" in the Evaluation menu
- **THEN** the user is navigated to `/datasets` and sees a grid of PUBLIC datasets with columns: Name, Description, Updated At

#### Scenario: Empty datasets list
- **WHEN** no PUBLIC datasets exist
- **THEN** the grid displays an empty state message

#### Scenario: PRIVATE datasets not visible in listing
- **WHEN** a PRIVATE dataset exists in the backend
- **THEN** it does NOT appear in the `/datasets` listing grid

### Requirement: Create dataset
The system SHALL allow users to create a new PUBLIC dataset via a modal triggered by a "Create Dataset" button on the listing page. The modal SHALL collect `name` (required) and `description` (optional). The POST body SHALL always send `visibility: PUBLIC`.

#### Scenario: Successful creation
- **WHEN** user fills in a valid name and submits the Create modal
- **THEN** `POST /api/v1/datasets` is called with `{ name, description, visibility: "PUBLIC" }`, a success toast is shown, and the new dataset appears in the listing

#### Scenario: Duplicate name validation
- **WHEN** user submits a name that already exists
- **THEN** the backend returns an error and the FE displays an error notification; the modal stays open

#### Scenario: Name field required validation
- **WHEN** user submits the Create modal with an empty name
- **THEN** the Submit button is disabled or a validation error is shown inline

### Requirement: Delete dataset
The system SHALL allow users to delete a dataset from the listing page via a row action. A confirmation popup SHALL be shown before deletion.

#### Scenario: Successful deletion of PUBLIC dataset with no bound test suites
- **WHEN** user confirms deletion of a PUBLIC dataset that has no bound test suites
- **THEN** `DELETE /api/v1/datasets/{id}` is called, success toast is shown, and the row is removed from the grid

#### Scenario: Deletion blocked by bound test suites
- **WHEN** user confirms deletion of a PUBLIC dataset that is referenced by one or more test suites
- **THEN** the backend returns 409 and the FE shows an error toast explaining that the dataset cannot be deleted while bound to test suites

### Requirement: Dataset detail view navigation
The system SHALL navigate to `/datasets/{id}` when the user clicks a dataset row in the listing grid.

#### Scenario: Click row to open dataset
- **WHEN** user clicks a row in the datasets listing grid
- **THEN** the user is navigated to `/datasets/{id}` showing the dataset detail view

### Requirement: Dataset detail view header
The system SHALL display in the dataset detail view header: the dataset name, creation timestamp, last updated timestamp, and a visibility action button. The view SHALL also show Save and Discard buttons when unsaved changes exist.

#### Scenario: Header for PUBLIC dataset
- **WHEN** a PUBLIC dataset is open
- **THEN** the header shows "Make Private" button alongside Save and Discard

#### Scenario: Header for PRIVATE dataset
- **WHEN** a PRIVATE dataset is open
- **THEN** the header shows "Make Public" button alongside Save and Discard

#### Scenario: PRIVATE dataset not in listing but accessible by URL
- **WHEN** the user navigates directly to `/datasets/{id}` for a PRIVATE dataset
- **THEN** the full dataset detail view is shown including the "Make Public" button

### Requirement: Make dataset private
The system SHALL allow making a PUBLIC dataset PRIVATE via the "Make Private" button. A confirmation popup SHALL be shown before the transition. The transition calls `PATCH /api/v1/datasets/{id}/visibility` with `{ visibility: "PRIVATE" }`.

#### Scenario: Successful PUBLIC to PRIVATE transition
- **WHEN** user confirms the "Make Private" action for a dataset bound to exactly one test suite
- **THEN** `PATCH /api/v1/datasets/{id}/visibility` is called, success toast is shown, and the header button changes to "Make Public"

#### Scenario: Transition fails due to wrong binding count
- **WHEN** the backend returns 409 `PRIVATE_TRANSITION_INVALID_BINDING_COUNT`
- **THEN** an error toast is shown explaining the dataset must be bound to exactly one test suite; the dataset remains PUBLIC

#### Scenario: Make private confirmation popup content
- **WHEN** the user clicks "Make Private"
- **THEN** a confirmation popup is shown explaining that the dataset will only be accessible to test suites currently using it, with Cancel and "Make Private" actions

### Requirement: Make dataset public
The system SHALL allow making a PRIVATE dataset PUBLIC via the "Make Public" button. A confirmation popup SHALL be shown before the transition.

#### Scenario: Successful PRIVATE to PUBLIC transition
- **WHEN** user confirms the "Make Public" action
- **THEN** `PATCH /api/v1/datasets/{id}/visibility` is called with `{ visibility: "PUBLIC" }`, success toast is shown, and the header button changes to "Make Private"

#### Scenario: Make public confirmation popup content
- **WHEN** the user clicks "Make Public"
- **THEN** a confirmation popup is shown explaining the dataset will become visible in the datasets list and usable by any test suite, with Cancel and "Make Public" actions

### Requirement: Dataset tabs
The system SHALL display three tabs on the dataset detail view: Properties, Schema, and Test Cases.

#### Scenario: Default tab on open
- **WHEN** the user opens a dataset detail view
- **THEN** the Properties tab is active by default

#### Scenario: Tab navigation
- **WHEN** the user clicks a different tab
- **THEN** the corresponding tab content is displayed without losing unsaved changes in other tabs
