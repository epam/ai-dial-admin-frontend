## Purpose

Defines the Test Suites tab of the dataset detail view: a read-only list of the test suites bound to the dataset, loaded through the unified query API, from which a suite can be opened in a new browser tab.

## ADDED Requirements

### Requirement: Test Suites tab lists the test suites bound to the dataset
The Test Suites tab SHALL list every test suite whose bound dataset is the dataset being viewed, and only those. The grid SHALL show the columns Display Name, Description, ID, Suite Type, Application, Creation Time, Updated Time and Created By, with a filter input under each filterable column header, and SHALL be sorted by Creation Time descending by default. Sorting and filtering SHALL be applied by the backend. A short line above the grid SHALL state that these are the test suites using this dataset. The Application column SHALL show the deployment name, falling back to the MCP deployment name, as in the test suites list.

#### Scenario: Dataset used by several suites
- **WHEN** the user opens the Test Suites tab of a dataset bound to three test suites
- **THEN** exactly those three suites are listed, newest first

#### Scenario: Suite bound to another dataset
- **WHEN** a test suite exists that is bound to a different dataset or to none
- **THEN** it is not listed

#### Scenario: Dataset with no bound suites
- **WHEN** the user opens the Test Suites tab of a dataset no suite uses
- **THEN** an empty-state message is shown instead of rows

#### Scenario: Filtering a column
- **WHEN** the user types in a column's filter input
- **THEN** the grid reloads with the filter applied on top of the dataset scope, and suites of other datasets still never appear

#### Scenario: Columns and defaults
- **WHEN** the tab is open
- **THEN** the eight columns above are visible with their filter inputs
- **AND** the Creation Time header shows a descending sort indicator

### Requirement: Opening the Test Suites tab sends a single list request
Opening the Test Suites tab SHALL load the list with one request to the unified query API, `test_suites` entity filtered by `dataset_id`, for the first page. The tab SHALL NOT issue a request per row or per column, and SHALL NOT load the list again unless the user changes the sort, filter or page, or leaves and reopens the tab.

#### Scenario: Single request on open
- **WHEN** the user clicks the Test Suites tab
- **THEN** exactly one list request is sent

#### Scenario: Re-render without reload
- **WHEN** the tab stays open and the page re-renders with no sort, filter or page change
- **THEN** no further list request is sent

### Requirement: A bound test suite opens in a new browser tab
Clicking a row in the Test Suites tab SHALL open that test suite's detail page in a new browser tab, leaving the dataset page open. The context menu at the end of each row SHALL contain only the "Open in new tab" option, which does the same; that menu SHALL NOT offer run, duplicate or delete.

#### Scenario: Clicking a row
- **WHEN** the user clicks a test suite row
- **THEN** `/test-suites/{id}` opens in a new browser tab
- **AND** the dataset page stays on the Test Suites tab

#### Scenario: Context menu option
- **WHEN** the user opens the three-dot menu of a row and chooses "Open in new tab"
- **THEN** the test suite opens in a new browser tab

#### Scenario: Context menu is not a click-through
- **WHEN** the user clicks the three-dot menu button itself
- **THEN** no new tab opens until an option is chosen

#### Scenario: Context menu content
- **WHEN** the user opens the three-dot menu of a row
- **THEN** "Open in new tab" is the only option

### Requirement: The Test Suites tab does not affect unsaved dataset changes
Visiting the Test Suites tab SHALL NOT mark the dataset as changed, and unsaved edits made on the other tabs SHALL be preserved while it is open.

#### Scenario: Unsaved property edit survives a visit
- **WHEN** the user edits the dataset name, opens the Test Suites tab, and returns to Properties
- **THEN** the edited name is still shown and Save is still offered
