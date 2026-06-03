## ADDED Requirements

### Requirement: Unbound suite shows dataset binding UI
A TestSuite with `datasetId = null` SHALL display a dataset binding section in the Test Cases tab area instead of the test cases grid and schema tab. The binding section SHALL show two buttons: "Pick public dataset" and "Create private dataset". The Schema tab entry SHALL be hidden from the tab list.

#### Scenario: Unbound suite hides Schema and Test Cases tabs
- **WHEN** a TestSuite has `datasetId = null`
- **THEN** the Schema tab is not shown in the tab navigation
- **THEN** the Test Cases tab content shows only the binding buttons (no grid, no header bar)

#### Scenario: Unbound suite shows two binding buttons
- **WHEN** the user opens the Test Cases tab of an unbound suite
- **THEN** "Pick public dataset" and "Create private dataset" buttons are visible
- **THEN** no test case grid, add/import/export buttons, or schema controls are shown

---

### Requirement: Create private dataset flow
Clicking "Create private dataset" on an unbound suite SHALL auto-create a PRIVATE dataset with `id = DATASET_{suiteId}`, then update the suite's `datasetId` to the new dataset's ID. No confirmation dialog is shown. On success the page SHALL reload to show the bound state.

#### Scenario: Create private dataset succeeds
- **WHEN** user clicks "Create private dataset"
- **THEN** `createDataset({ id: 'DATASET_{suiteId}', visibility: 'PRIVATE' })` is called
- **THEN** `updateTestSuite({ ...suite, datasetId: newDataset.id })` is called
- **THEN** the page reloads and the suite is shown in bound-private state

#### Scenario: Create private dataset fails
- **WHEN** either the createDataset or updateTestSuite call fails
- **THEN** an error toast is shown
- **THEN** the suite remains in unbound state (binding buttons still visible)

---

### Requirement: Pick public dataset flow
Clicking "Pick public dataset" SHALL open a selection modal listing all PUBLIC datasets (paginated, searchable, single-select). Confirming a selection SHALL call `updateTestSuite({ ...suite, datasetId: selectedId })`. On success the page SHALL reload.

#### Scenario: Dataset selection modal opens
- **WHEN** user clicks "Pick public dataset"
- **THEN** a modal opens showing a list of PUBLIC datasets with name and description columns
- **THEN** user can search/filter the list

#### Scenario: User selects and confirms a public dataset
- **WHEN** user selects one dataset and clicks Confirm
- **THEN** `updateTestSuite` is called with the selected `datasetId`
- **THEN** the modal closes and the page reloads in bound-public state

#### Scenario: User cancels dataset selection
- **WHEN** user opens the modal but clicks Cancel
- **THEN** the suite remains unbound and the binding buttons are still shown

---

### Requirement: Dataset header section on Test Cases tab
When a suite is bound to a dataset, the Test Cases tab SHALL show a `DatasetHeader` section above the test cases grid. The header SHALL display: the dataset ID (truncated with tooltip), a visibility badge (PUBLIC or PRIVATE), an "Open in new tab" icon button linking to `/datasets/{datasetId}`, a contextual action button, and a description text.

#### Scenario: Dataset header shows for bound suite
- **WHEN** the suite has a non-null `datasetId`
- **THEN** the DatasetHeader component is rendered at the top of the Test Cases tab
- **THEN** the dataset ID is shown (truncated via DialEllipsisTooltip if long)
- **THEN** the visibility badge reflects the dataset's visibility (PUBLIC or PRIVATE)

#### Scenario: Open in new tab button
- **WHEN** user clicks the "Open in new tab" icon button in DatasetHeader
- **THEN** the dataset detail page (`/datasets/{datasetId}`) opens in a new browser tab

---

### Requirement: Dataset visibility action button
The DatasetHeader SHALL show a visibility action button whose label and behavior depends on the dataset's current visibility and binding type:
- Bound to PRIVATE dataset: shows "Make Public" button — calls `transitionVisibility(datasetId, { visibility: 'PUBLIC' })`.
- Bound to PUBLIC dataset: shows "Unbind" button — calls `updateTestSuite({ ...suite, datasetId: null })` after confirmation.

#### Scenario: Make public confirmation for private dataset
- **WHEN** user clicks "Make Public"
- **THEN** a confirmation popup appears warning that making it public removes the permanent bind
- **THEN** on confirm, `transitionVisibility` is called
- **THEN** on success the page reloads to show the PUBLIC bound state

#### Scenario: Unbind confirmation for public dataset
- **WHEN** user clicks "Unbind"
- **THEN** a confirmation popup appears warning the suite will have no dataset after unbinding
- **THEN** on confirm, `updateTestSuite({ ...suite, datasetId: null })` is called
- **THEN** on success the page reloads to the unbound state (binding buttons shown again)

#### Scenario: Visibility transition 409 error
- **WHEN** `transitionVisibility` returns a 409 error
- **THEN** an error toast is shown with a descriptive message
- **THEN** the dataset remains in its original state

---

### Requirement: Dataset description text in header
The DatasetHeader SHALL show a contextual description below the dataset ID/badge row:
- PRIVATE dataset: "Private dataset is permanently bound to this test suite"
- PUBLIC dataset: "Public dataset — test cases are read-only from this suite. Edit them on the Dataset page."

#### Scenario: Description shown for private dataset
- **WHEN** the bound dataset has visibility = PRIVATE
- **THEN** the description "Private dataset is permanently bound to this test suite" is displayed

#### Scenario: Description shown for public dataset
- **WHEN** the bound dataset has visibility = PUBLIC
- **THEN** a message indicating the test cases are read-only is displayed

---

### Requirement: Test Cases tab is read-only for PUBLIC datasets
When the bound dataset is PUBLIC, the test cases grid and header buttons SHALL be in read-only mode. Add Test Case and Import buttons SHALL be disabled (hidden or visually disabled with tooltip). Delete row actions SHALL be hidden. Inline cell editing SHALL be disabled. Export SHALL remain available.

#### Scenario: Add and Import disabled for public dataset
- **WHEN** the bound dataset is PUBLIC
- **THEN** the "Add Test Case" button is disabled or hidden
- **THEN** the "Import" button is disabled or hidden
- **THEN** the "Export" button remains enabled

#### Scenario: Grid cells not editable for public dataset
- **WHEN** the bound dataset is PUBLIC
- **THEN** all test case grid cells are read-only (not editable on click)
- **THEN** delete row action icons are not shown

#### Scenario: Grid is fully editable for private dataset
- **WHEN** the bound dataset is PRIVATE
- **THEN** all test case grid cells are editable inline
- **THEN** Add Test Case, Import, Export, and delete actions are all available

---

### Requirement: Enable/disable test cases via disabledTestCaseIds
The test cases grid SHALL retain an enable/disable checkbox column. Toggling a checkbox SHALL update `TestSuite.disabledTestCaseIds` in the parent state (via `onChange`) and set `isChanged = true`. On Save, `disabledTestCaseIds` is persisted as part of the suite PUT. No separate bulk-patch API call is made.

#### Scenario: Disabling a test case
- **WHEN** user unchecks the enable checkbox for test case with id `tc-1`
- **THEN** `tc-1` is added to `selectedTestSuite.disabledTestCaseIds`
- **THEN** `onChange` is called with the updated suite
- **THEN** `isChanged` becomes true

#### Scenario: Enabling a previously disabled test case
- **WHEN** user checks the enable checkbox for test case with id `tc-1` (which was in `disabledTestCaseIds`)
- **THEN** `tc-1` is removed from `selectedTestSuite.disabledTestCaseIds`
- **THEN** `onChange` is called with the updated suite

#### Scenario: Disabled state initialized from suite
- **WHEN** the test cases grid loads
- **THEN** any test case whose ID is in `selectedTestSuite.disabledTestCaseIds` appears with its checkbox unchecked

---

### Requirement: Test case API calls use datasetId
All test case operations (load, create, update, remove, import, export) SHALL use the suite's `datasetId` as the parent key and call `datasetsApi` endpoints. The test cases tab MUST NOT make calls when `datasetId` is null.

#### Scenario: Test cases loaded via dataset endpoint
- **WHEN** the test cases grid loads for a bound suite
- **THEN** `getTestCases(datasetId, ...)` from `datasets/actions.ts` is called
- **THEN** test cases are displayed

#### Scenario: Test cases not loaded for unbound suite
- **WHEN** the suite has `datasetId = null`
- **THEN** no `getTestCases` call is made
- **THEN** the dataset binding UI is shown instead
