## ADDED Requirements

### Requirement: Duplicate an editable test case

The Test Cases grid SHALL offer a **Duplicate** action in a case's row context menu when the case is
editable. This action SHALL be available in the dataset detail Test Cases grid and in the Test Cases
grid for a test suite's private dataset. It SHALL be unavailable when the grid is read-only.

Choosing **Duplicate** SHALL add a new case to the grid with a unique ID and the same data and
multi-turn values as the source case. Since test-case names must be unique within a dataset, the
duplicate's `testCaseName` SHALL use the localized copy postfix and a numeric suffix if that copy
name is already taken. The source case SHALL remain unchanged. The duplicate SHALL be created
immediately through the existing test-case creation API, which assigns its new ID, and the grid
SHALL refresh after successful creation. If creation fails, the grid SHALL show its existing error
notification.

#### Scenario: Duplicate a dataset test case

- **WHEN** the user chooses **Duplicate** from an editable dataset test case's row context menu
- **THEN** a new test case appears with a unique ID, a unique copy name, and the same data values
- **AND** the original test case remains unchanged
- **AND** the duplicate is created immediately and the grid refreshes

#### Scenario: Duplicate a test case in a private dataset on a test suite

- **WHEN** the user chooses **Duplicate** from a test case's row context menu on a suite's private
  dataset
- **THEN** a new test case appears with a unique ID, a unique copy name, and the same data values
- **AND** the duplicate is created immediately and the suite grid refreshes

#### Scenario: Duplicate is unavailable for read-only cases

- **WHEN** the test case grid is read-only
- **THEN** the row context menu does not offer **Duplicate**
