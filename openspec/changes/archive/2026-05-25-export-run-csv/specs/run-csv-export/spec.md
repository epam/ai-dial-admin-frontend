## ADDED Requirements

### Requirement: Export button in run detail view header
The run detail view header SHALL display an Export button positioned between the Delete button and the Grafana traces link (order: Delete → Export → 1px divider → Grafana). The Export button SHALL be visible only when the run is available. Clicking Export SHALL open the Export Run popup.

#### Scenario: Export button is present in run header
- **WHEN** a user views a run detail page
- **THEN** an Export button is visible in the header between the Delete button and the divider

#### Scenario: Export button opens the export popup
- **WHEN** a user clicks the Export button in the run detail header
- **THEN** the Export Run popup opens with the current run's ID pre-loaded

### Requirement: Export action in runs list context menu
The runs list action menu (both the global runs list and the test suite Runs tab) SHALL include an Export item. It SHALL appear between "Open in new tab" and "Delete". Clicking Export SHALL open the Export Run popup for the selected run.

#### Scenario: Export appears in list row menu
- **WHEN** a user opens the action menu for any row in the runs list
- **THEN** the menu shows items in order: Open in new tab → Export → Delete

#### Scenario: Export from list opens popup with correct run
- **WHEN** a user clicks Export for a specific run in the list
- **THEN** the Export Run popup opens scoped to that run's ID

### Requirement: Export Run popup structure
The Export Run popup SHALL use `PopupSize.Lg`. It SHALL have a header titled "Export run", a scrollable content area with two accordions, and a footer with Cancel and "Export CSV" buttons. Clicking Cancel SHALL close the popup without performing any action.

#### Scenario: Popup opens and shows correct title
- **WHEN** the Export Run popup is opened
- **THEN** the header displays "Export run" and both accordions are visible

#### Scenario: Cancel closes popup
- **WHEN** a user clicks Cancel
- **THEN** the popup closes and no export request is made

### Requirement: Columns accordion — column list with grouping
The Columns accordion SHALL display all columns available for the run, grouped in the following order: Identification, Data, Response, Metrics, Body. Groups SHALL be inferred from column name prefixes: `data:*` → Data; `response:*` → Response; `metric:*` / `metricInfo:*` / `metricError:*` → Metrics; `requestBody` / `responseBody` / `extractionWarnings` → Body; all other columns → Identification. Within the Metrics group, columns SHALL be further sub-grouped by metric name (the second colon-separated segment, e.g. `metric:Accuracy:score` belongs to sub-group "Accuracy"). Columns SHALL be displayed in a 4-column grid of checkboxes. Each group header SHALL include a group-level checkbox that selects or deselects all columns in that group. The accordion label SHALL show the count of selected columns out of total (e.g. "Columns (12 / 24)"). Body group columns SHALL be unchecked by default; all other columns SHALL be checked by default.

#### Scenario: Columns load and are grouped correctly
- **WHEN** the Export Run popup opens and preview data is fetched
- **THEN** columns are displayed in groups: Identification, Data, Response, Metrics, Body (in that order) with correct prefix-based assignment

#### Scenario: Body columns default to unchecked
- **WHEN** the popup opens for the first time
- **THEN** requestBody, responseBody, and extractionWarnings checkboxes are unchecked; all other columns are checked

#### Scenario: Group-level checkbox selects all in group
- **WHEN** a user clicks a group header checkbox that is unchecked
- **THEN** all columns in that group become checked

#### Scenario: Group-level checkbox deselects all in group
- **WHEN** a user clicks a group header checkbox that is checked
- **THEN** all columns in that group become unchecked

#### Scenario: Group-level checkbox shows indeterminate state
- **WHEN** some but not all columns in a group are checked
- **THEN** the group header checkbox shows an indeterminate state

#### Scenario: Column count updates on toggle
- **WHEN** a user checks or unchecks a column
- **THEN** the selected count in the accordion label updates immediately

### Requirement: Columns accordion — display names
Column names SHALL be displayed without their prefix. For metric columns with three segments (e.g. `metric:Accuracy:score`), the display name SHALL be the third segment only (e.g. "score"), with the metric name shown as the sub-group header. Columns with no prefix SHALL display their raw name.

#### Scenario: Data column display name strips prefix
- **WHEN** a column named `data:prompt` is rendered
- **THEN** the checkbox label shows "prompt"

#### Scenario: Metric column display name uses third segment
- **WHEN** a column named `metric:Accuracy:score` is rendered
- **THEN** the checkbox label shows "score" under the "Accuracy" sub-group header

### Requirement: Preview accordion — live AG Grid
The Preview accordion SHALL contain an AG Grid (client-side row model) showing up to 10 rows of preview data fetched from `GET /api/v1/analytics/eval-summaries/export/preview?runId=&computation=latest`. The grid SHALL display only the currently selected columns, updating instantly when the user checks or unchecks columns in the Columns accordion (no additional API call). Column headers in the grid SHALL show the full column name as returned by the backend. The grid container SHALL have a fixed height when the accordion is expanded to ensure AG Grid renders correctly.

#### Scenario: Preview shows selected columns only
- **WHEN** a user unchecks a column in the Columns accordion
- **THEN** that column disappears from the Preview grid immediately without a network request

#### Scenario: Preview shows up to 10 rows
- **WHEN** the popup opens and preview data is fetched
- **THEN** the Preview grid shows at most 10 data rows

#### Scenario: Preview loading state
- **WHEN** the popup is opening and the preview API call is in flight
- **THEN** a loading indicator is shown in the Preview accordion area

### Requirement: Export CSV action
When the user clicks "Export CSV", the system SHALL POST to `/api/v1/analytics/eval-summaries/export.csv` with `{ runId, computation: "latest", columns: <ordered list of checked column names>, delimiter: "," }`. The response SHALL be downloaded as a CSV file. The filename SHALL be taken from the `Content-Disposition` header; if absent, the fallback filename SHALL be `run-export.csv`. After a successful download, a success notification SHALL be shown. On error, an error notification SHALL be shown with any available error detail.

#### Scenario: Successful export downloads CSV
- **WHEN** a user clicks "Export CSV" with at least one column selected
- **THEN** a CSV file is downloaded to the user's device and a success notification appears

#### Scenario: Export error shows notification
- **WHEN** the backend returns an error response to the export request
- **THEN** no file is downloaded and an error notification is shown

#### Scenario: Export CSV button is disabled while exporting
- **WHEN** an export request is in flight
- **THEN** the "Export CSV" button is disabled to prevent duplicate submissions

#### Scenario: Filename from Content-Disposition
- **WHEN** the backend response includes a Content-Disposition header with a filename
- **THEN** the downloaded file uses that filename

#### Scenario: Fallback filename when header absent
- **WHEN** the backend response does not include a Content-Disposition header
- **THEN** the downloaded file is named `run-export.csv`

### Requirement: Preview data fetch on popup open
The preview API call (GET `/export/preview`) SHALL be made once when the popup opens, using `computation=latest`. The popup SHALL show a loading state while the request is in flight. If the request fails, an error message SHALL be shown in the Preview accordion area and the Export CSV button SHALL remain enabled with whatever columns were listed (the columns list from a failed preview is empty, so the user cannot proceed to export meaningfully).

#### Scenario: Preview fetch is made once on open
- **WHEN** the Export Run popup opens
- **THEN** exactly one GET request is made to the preview endpoint

#### Scenario: Preview fetch failure shows error state
- **WHEN** the preview API call returns an error
- **THEN** an error message is displayed in the Preview accordion and no columns are shown
