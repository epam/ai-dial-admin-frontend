## ADDED Requirements

### Requirement: Numeric schema columns are right-aligned

In the Test Cases grid, a schema-generated column whose field type is `NUMBER` or `INTEGER` SHALL
render its cell content right-aligned, both in its editable and read-only states. Columns generated
for other schema types (`STRING`, `BOOLEAN`, `OBJECT`, `ARRAY`, `FILE`) SHALL keep their existing left
alignment.

#### Scenario: A number or integer column is right-aligned

- **WHEN** the dataset schema declares a field of type `NUMBER` or `INTEGER`
- **THEN** that field's column renders its values right-aligned, whether the cell is editable or
  read-only

#### Scenario: Non-numeric columns are unaffected

- **WHEN** the dataset schema declares a field of type `STRING`, `BOOLEAN`, `OBJECT`, `ARRAY`, or
  `FILE`
- **THEN** that field's column keeps its existing left alignment
