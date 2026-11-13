## ADDED Requirements

### Requirement: A rail field offers the schema's description of it

Each row of the rail's field groups SHALL offer the schema's description of its field as a keyboard-reachable hint
beside the label, where the hop log's schema reports one. A field the schema does not describe SHALL carry no hint
control. The description is the catalog's own account of what a column records, and the rail states columns this
frontend has no label of its own for, so the schema is the only source of that account. The rows are the same rows
the session detail's metadata and enrichment panels use, so a description is offered the same way in all three.

#### Scenario: A described span field offers its description

- **WHEN** a rail group is open and the hop log's schema reports a description for one of its fields
- **THEN** that field's row offers the description as a hint reachable by keyboard

#### Scenario: An undescribed span field has no hint

- **WHEN** the hop log's schema reports no description for a field
- **THEN** that field's row carries no hint control
