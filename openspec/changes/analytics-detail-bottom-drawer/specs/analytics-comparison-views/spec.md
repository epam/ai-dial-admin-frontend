## ADDED Requirements

### Requirement: Table view renders fields as rows grouped by section

The Table view SHALL display a comparison table with a "Field" column and one column per test case. Rows SHALL be grouped into sections: Execution, Test Case Data, Extracted Columns, Request / Response, and one section per metric group (named by metric declaration). Each section SHALL have a group header row.

#### Scenario: Single test case in Table view
- **WHEN** one test case is active (no pinned case)
- **THEN** the table shows a Field column and one test case column with section-grouped rows

#### Scenario: Two test cases in Table view (pinned + active)
- **WHEN** one test case is pinned and a different test case is active
- **THEN** the table shows a Field column, a pinned column (with pin indicator), and an active column

#### Scenario: Pinned and active are the same test case
- **WHEN** the pinned and active IDs are the same
- **THEN** the table shows a Field column and one test case column (no duplication)

### Requirement: Table view section group rows

Each section group SHALL render a full-width header row with the section name in uppercase, small font, secondary color. The header row SHALL visually separate sections.

#### Scenario: Section headers render
- **WHEN** the Table view is rendered with data
- **THEN** each visible section has a header row spanning all columns with the section name

### Requirement: Table view column headers show test case summary

Each test case column header SHALL display the test case name, execution status (color-coded: green for SUCCESS, red for others), and execution duration.

#### Scenario: Column header for successful test case
- **WHEN** a test case has executionStatus "SUCCESS" and duration 10500ms
- **THEN** the column header shows the test case name, a green "SUCCESS" label, and "10500ms"

### Requirement: Table view diff highlighting

When two test cases are displayed (pinned + active), the system SHALL highlight cells in the non-pinned column where the raw value differs from the pinned column. Numeric differences SHALL use amber highlighting. Text differences SHALL use teal highlighting.

#### Scenario: Numeric metric value differs
- **WHEN** pinned case has f1=0.1176 and active case has f1=0.5714
- **THEN** the active case's f1 cell has an amber background tint

#### Scenario: Text value differs
- **WHEN** pinned case has answer="nappe formations" and active case has answer="Limestone Alps"
- **THEN** the active case's answer cell has a teal background tint

#### Scenario: Values are identical
- **WHEN** both cases have the same value for a field
- **THEN** no diff highlighting is applied to that cell

#### Scenario: Numeric values differ only in formatting
- **WHEN** pinned case has value "0.500" and active case has value "0.5"
- **THEN** no diff highlighting is applied (values are numerically equal)

#### Scenario: JSON values differ only in key ordering
- **WHEN** pinned case has `{"a":1,"b":2}` and active case has `{"b":2,"a":1}`
- **THEN** no diff highlighting is applied (JSON content is equivalent)

#### Scenario: Null vs non-null value
- **WHEN** pinned case has value "0.5" and active case has null
- **THEN** the active case cell shows "—" with diff highlighting applied

### Requirement: Table view focus strip for spotlighted fields

The Table view SHALL display a focus strip above the comparison table when one or more fields are spotlighted. Each spotlighted field renders as a card showing the field label, badge, and values for each test case column. "Spotlight" is distinct from "pin" (which refers to test case pinning).

#### Scenario: Spotlight a field to focus strip
- **WHEN** the user clicks the spotlight icon on a field row in the Table view
- **THEN** a card for that field appears in the focus strip, and the spotlight icon on the row shows as active

#### Scenario: Remove a field from focus strip
- **WHEN** the user clicks the close button on a spotlighted field card in the focus strip
- **THEN** the card is removed and the row's spotlight icon returns to inactive state

#### Scenario: No spotlighted fields
- **WHEN** no fields are spotlighted
- **THEN** the focus strip is not rendered

### Requirement: Table view field rows display data adaptively

Each field row SHALL display the field name (monospace) in the Field column and the corresponding value in each test case column. Long values and JSON content SHALL render in a scrollable pre-formatted block with max-height 180px. Short scalar values SHALL render inline.

#### Scenario: Short scalar value
- **WHEN** a field value is "nappe formations"
- **THEN** the cell displays the text inline

#### Scenario: Long JSON value
- **WHEN** a field value is a JSON string longer than 100 characters
- **THEN** the cell displays the value in a pre-formatted scrollable block with max-height 180px and overflow-y auto

#### Scenario: Very long value (over 500 characters)
- **WHEN** a field value exceeds 500 characters
- **THEN** the cell displays a truncated preview with a "Show more" toggle to expand

#### Scenario: Null or missing value
- **WHEN** a field value is null or undefined
- **THEN** the cell displays a dash (—) in secondary color

#### Scenario: Field exists in one test case but not the other
- **WHEN** the pinned case has an `extractedColumns` field "confidence" but the active case does not
- **THEN** the active case cell shows "—" for that field; the field row is still visible

### Requirement: Table view metric value formatting

Metric output values (numbers) SHALL be formatted to 3 decimal places with a progress bar fill indicating the value from 0 to 1, matching the existing `MetricCard` component pattern. Null metric values SHALL display as a dash. No hardcoded color thresholds — use the standard accent color for the progress bar.

#### Scenario: Metric value displayed
- **WHEN** a metric value is 0.571
- **THEN** the cell displays "0.571" with a progress bar filled to ~57.1%

#### Scenario: Null metric value
- **WHEN** a metric value is null
- **THEN** the cell displays a dash (—) in secondary color

#### Scenario: Error metric (all null in group)
- **WHEN** all metric values in a group are null and an error message exists in metricInfos
- **THEN** the metric section shows the error message in error styling

### Requirement: Pivot view renders test cases as rows

The Pivot view SHALL display a transposed table with test cases as rows and fields as columns. The first column (sticky) SHALL show the test case name with status indicator. Column headers SHALL show the section name (small, uppercase) and field name.

#### Scenario: Pivot view layout
- **WHEN** the user switches to Pivot view with two test cases
- **THEN** the table has two data rows (one per test case) and columns for each visible field

#### Scenario: Pivot column headers
- **WHEN** a field "f1" belongs to section "aidial_rag_eval.retrieval"
- **THEN** the column header shows "AIDIAL_RAG_EVAL.RETRIEVAL" in small text above "f1" in bold

### Requirement: Pivot view sticky headers

The test case name column (leftmost) SHALL be sticky horizontally. The field column headers (top row) SHALL be sticky vertically. Both SHALL maintain visibility during scrolling.

#### Scenario: Horizontal scroll
- **WHEN** the user scrolls the Pivot table horizontally
- **THEN** the test case name column remains fixed on the left

#### Scenario: Vertical scroll
- **WHEN** the user scrolls the Pivot table vertically
- **THEN** the field column headers remain fixed at the top

#### Scenario: Many fields in Pivot view
- **WHEN** the test case has more fields than fit in the drawer width
- **THEN** the table is horizontally scrollable with the test case name column remaining sticky on the left

### Requirement: Comparison data transformation is memoized

The `buildComparisonSections()` utility that transforms `AnalyticsResult` objects into `ComparisonSection[]` SHALL be wrapped in `useMemo`, keyed on the active detail, pinned detail, field visibility, and section order. This prevents re-computation on unrelated re-renders.

#### Scenario: Same inputs produce cached result
- **WHEN** the component re-renders but active detail, pinned detail, field visibility, and section order have not changed
- **THEN** the comparison sections are not recomputed
