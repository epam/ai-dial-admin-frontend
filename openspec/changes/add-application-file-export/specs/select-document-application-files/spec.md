## Purpose

Lets a user download files stored on a test suite or private dataset from the Application tab of the
Select document modal, using the same row actions pattern as the Public tab.

## ADDED Requirements

### Requirement: Row actions menu on Application-tab files
Each file row on the Application tab of the Select document modal SHALL expose a row actions menu
containing Export and Delete (in that order). The menu SHALL replace the previous single delete icon.

#### Scenario: Application tab lists files
- **WHEN** a user opens the Select document modal and views the Application tab with at least one file
- **THEN** each file row shows a row actions menu
- **THEN** the menu contains Export and Delete

### Requirement: Export downloads the original file
Choosing Export SHALL download the file with its original filename and unchanged content. The
download SHALL use the Evaluation Framework file download endpoint for the owning entity (test suite
or dataset). Export SHALL NOT change the selected file path or close the modal.

#### Scenario: Export from a test suite Application tab
- **WHEN** a user chooses Export on a file row while the modal is scoped to a test suite
- **THEN** the browser saves that file under its original name
- **THEN** the modal stays open and the selected file path is unchanged

#### Scenario: Export from a private dataset Application tab
- **WHEN** a user chooses Export on a file row while the modal is scoped to a private dataset
- **THEN** the browser saves that file under its original name
- **THEN** the modal stays open and the selected file path is unchanged

#### Scenario: Export fails
- **WHEN** the download request fails or returns an error body
- **THEN** an error notification is shown
- **THEN** no file is saved
- **THEN** the selected file path and modal open state are unchanged

### Requirement: Delete keeps current behaviour
Choosing Delete SHALL remove the file from the owning entity using the existing remove API and
notifications. Delete SHALL NOT open a confirmation dialog beyond what the current remove action
uses (immediate remove).

#### Scenario: Delete a file
- **WHEN** a user chooses Delete on a file row
- **THEN** the file is removed via the existing remove endpoint for that entity
- **THEN** on success, a success notification is shown and the file list refreshes
- **THEN** on failure, an error notification is shown

### Requirement: Action column does not select the row
Interacting with the row actions column SHALL NOT change the selected file for the modal.

#### Scenario: Open or use the row actions menu
- **WHEN** a user clicks the actions column or chooses Export or Delete
- **THEN** the row selection / selected file path for Confirm is not changed by that click alone
  (Delete may later remove the file from the list; Export never changes selection)
