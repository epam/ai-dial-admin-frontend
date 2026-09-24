## ADDED Requirements

### Requirement: Execution metadata fields are right-aligned in the row-detail panel

In the compare row-detail panel — both the bottom pivot layout and the right-sidebar table layout —
the `# Run number`, `HTTP`, and `execDurationMs` (Duration) fields SHALL render their primary and
secondary values right-aligned. Every other field keeps its existing (left) alignment.

#### Scenario: Run number, HTTP, and Duration are right-aligned in the pivot panel

- **WHEN** the bottom pivot panel shows the `# Run number`, `HTTP`, or `execDurationMs` field
- **THEN** that field's primary and secondary values are right-aligned

#### Scenario: Run number, HTTP, and Duration are right-aligned in the sidebar table

- **WHEN** the right-sidebar table shows the `# Run number`, `HTTP`, or `execDurationMs` field
- **THEN** that field's primary and secondary values are right-aligned

#### Scenario: Other fields are unaffected

- **WHEN** the panel shows a field other than `# Run number`, `HTTP`, or `execDurationMs`
- **THEN** that field's values keep their existing left alignment
