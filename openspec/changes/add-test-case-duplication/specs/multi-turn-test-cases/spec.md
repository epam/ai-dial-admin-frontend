## ADDED Requirements

### Requirement: Duplicating a multi-turn test case preserves all turns

When a multi-turn test case is duplicated, the new case SHALL retain all of the source case's
shared field values and every per-turn value in the original turn order. The duplicate SHALL have a
new unique case ID and a unique copy name, and its data content SHALL be independent of the source
so edits to either case do not change the other.

#### Scenario: Duplicate a multi-turn case

- **WHEN** the user duplicates a case with shared fields and three turns
- **THEN** the duplicate has the same shared fields and three turns in the same order
- **AND** the duplicate has a different unique ID
- **AND** the duplicate has a unique copy name

#### Scenario: Edit the duplicate without changing the source

- **WHEN** the user edits a copied field or turn in the duplicate
- **THEN** the corresponding value in the original case remains unchanged
