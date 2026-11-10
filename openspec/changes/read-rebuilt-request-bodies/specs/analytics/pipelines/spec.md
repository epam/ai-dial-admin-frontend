## ADDED Requirements

### Requirement: A pipeline editor never offers a projection-only field as an operand

A schema field marked `projection_only: true` is computed by the service after a query runs, and the service
rejects any query that filters, sorts, groups or aggregates on it or passes it to a function. Every pipeline
editor that picks a source field to compare, group, measure, order by or bind SHALL leave such a field out of
its options: the filter condition's column, the aggregate group keys and measures, the enrichment's order-by
and member-selection fields, and its variables.

The exclusion SHALL key on the flag alone and SHALL add to the existing type-based exclusion of `object`, `array`
and `map` fields, not replace it. A field without the flag, or with it `false`, SHALL be offered as before. A
pipeline whose saved declaration already names a projection-only field in one of these positions SHALL load
with that value shown as authored; the service's own error reports the problem.

#### Scenario: The filter condition does not list a projection-only field

- **WHEN** a pipeline's source schema reports a field with `projection_only: true`
- **THEN** the filter condition's column dropdown does not list it

#### Scenario: Aggregate and enrichment editors do not list a projection-only field

- **WHEN** the source schema reports a projection-only field
- **THEN** the group keys, measures, order-by, member-selection and variable dropdowns do not list it

#### Scenario: A saved declaration keeps an authored projection-only field

- **WHEN** a saved pipeline already names a projection-only field as a group key
- **THEN** the editor shows that group key as authored
