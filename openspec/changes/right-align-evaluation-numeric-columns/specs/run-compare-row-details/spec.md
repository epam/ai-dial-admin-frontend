## ADDED Requirements

### Requirement: Execution metadata fields are right-aligned in the row-detail panel

In the compare row-detail panel — both the bottom pivot layout and the right-sidebar table layout —
the `# Run number`, `HTTP`, and `execDurationMs` (Duration) fields SHALL render their primary and
secondary values right-aligned. Every other field, except a metric field rendered as a `ScoreBar` (see
the following requirement), keeps its existing (left) alignment.

#### Scenario: Run number, HTTP, and Duration are right-aligned in the pivot panel

- **WHEN** the bottom pivot panel shows the `# Run number`, `HTTP`, or `execDurationMs` field
- **THEN** that field's primary and secondary values are right-aligned

#### Scenario: Run number, HTTP, and Duration are right-aligned in the sidebar table

- **WHEN** the right-sidebar table shows the `# Run number`, `HTTP`, or `execDurationMs` field
- **THEN** that field's primary and secondary values are right-aligned

#### Scenario: Other fields are unaffected

- **WHEN** the panel shows a field other than `# Run number`, `HTTP`, `execDurationMs`, or a metric
  field rendered as a `ScoreBar`
- **THEN** that field's values keep their existing left alignment

### Requirement: A metric field rendered as a ScoreBar is right-aligned in the row-detail panel

In the compare row-detail panel — both the bottom pivot layout and the right-sidebar table layout — a
metric field whose value renders as a `ScoreBar` (bar plus formatted number) SHALL right-align that
bar-and-value pair within its cell, for both the primary and secondary values.

#### Scenario: A ScoreBar metric field is right-aligned in the pivot panel

- **WHEN** the bottom pivot panel shows a metric field whose value renders as a `ScoreBar`
- **THEN** that field's primary and secondary bar-and-value pairs are right-aligned within their cells

#### Scenario: A ScoreBar metric field is right-aligned in the sidebar table

- **WHEN** the right-sidebar table shows a metric field whose value renders as a `ScoreBar`
- **THEN** that field's primary and secondary bar-and-value pairs are right-aligned within their cells
