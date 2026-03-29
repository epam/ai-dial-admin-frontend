## ADDED Requirements

### Requirement: Table view renders fields as rows grouped by section

The Table view SHALL display a comparison table with a "Field" column and one column per test case. Rows SHALL be grouped into sections: Execution, Test Case Data, Extracted Columns, Request / Response, and one section per metric group (named by metric declaration). Each section SHALL have a group header row.

#### Scenario: Single test case in Table view
- **WHEN** one test case is active (no pinned case)
- **THEN** the table shows a Field column and one test case column with section-grouped rows

#### Scenario: Two test cases in Table view (pinned + active)
- **WHEN** one test case is pinned and a different test case is active
- **THEN** the table shows a Field column, a pinned column (with pin indicator), and an active column

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

### Requirement: Table view focus strip for pinned fields

The Table view SHALL display a focus strip above the comparison table when one or more fields are pinned. Each pinned field renders as a card showing the field label, badge, and values for each test case column.

#### Scenario: Pin a field to focus strip
- **WHEN** the user clicks the pin icon on a field row in the Table view
- **THEN** a card for that field appears in the focus strip, and the pin icon on the row shows as active

#### Scenario: Unpin a field from focus strip
- **WHEN** the user clicks the close button on a pinned field card in the focus strip
- **THEN** the card is removed and the row's pin icon returns to inactive state

#### Scenario: No pinned fields
- **WHEN** no fields are pinned
- **THEN** the focus strip is not rendered

### Requirement: Table view field rows display data adaptively

Each field row SHALL display the field name (monospace) in the Field column and the corresponding value in each test case column. Long values and JSON content SHALL render in a scrollable pre-formatted block with max-height 180px. Short scalar values SHALL render inline.

#### Scenario: Short scalar value
- **WHEN** a field value is "nappe formations"
- **THEN** the cell displays the text inline

#### Scenario: Long JSON value
- **WHEN** a field value is a JSON string longer than 100 characters
- **THEN** the cell displays the value in a pre-formatted scrollable block

#### Scenario: Null or missing value
- **WHEN** a field value is null or undefined
- **THEN** the cell displays a dash (—) in secondary color

### Requirement: Table view metric value formatting

Metric output values (numbers) SHALL be formatted to 4 decimal places and color-coded: green for values >= 0.7, amber for values >= 0.4, red for values < 0.4. Null metric values SHALL display as a dash.

#### Scenario: High metric value
- **WHEN** a metric value is 0.9200
- **THEN** the cell displays "0.9200" in green

#### Scenario: Low metric value
- **WHEN** a metric value is 0.1176
- **THEN** the cell displays "0.1176" in red

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

### Requirement: Comparison data transformation is memoized

The `buildComparisonSections()` utility that transforms `TestCaseRunResultDetails` into `ComparisonSection[]` SHALL be wrapped in `useMemo`, keyed on the active detail, pinned detail, field visibility, and section order. This prevents re-computation on unrelated re-renders.

#### Scenario: Same inputs produce cached result
- **WHEN** the component re-renders but active detail, pinned detail, field visibility, and section order have not changed
- **THEN** the comparison sections are not recomputed
