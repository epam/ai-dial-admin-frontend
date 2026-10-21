## ADDED Requirements

### Requirement: Execution metadata columns are right-aligned

On the run Extraction Result grid, the `EXECUTION` group's `# Run number`, `Request`,
`Total requests`, `Turn`, `Total turns`, `HTTP`, and `Duration` columns SHALL render their cell
content right-aligned, matching how the rest of the app aligns numeric columns.

#### Scenario: Execution index columns are right-aligned

- **WHEN** the `# Run number`, `Request`, or `Turn` column is shown
- **THEN** its cell values are right-aligned

#### Scenario: HTTP and Duration keep their status coloring and gain right alignment

- **WHEN** a result's `HTTP` or `Duration` cell is colored for its response status
- **THEN** the cell is both colored and right-aligned
