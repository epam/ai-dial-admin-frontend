## ADDED Requirements

### Requirement: Model resources carry the provider and lifecycle fields unchanged
The model resource type SHALL carry Core's optional `provider`, `deprecationDate` and `endOfService` fields in camelCase. A read SHALL surface them as Core returns them and a write SHALL send them as held on the resource, with no renaming, reformatting or default; an absent field SHALL stay absent.

#### Scenario: Fields round-trip through read and update
- **WHEN** a model resource with `provider` `Azure`, `deprecationDate` `2027-06-30` and `endOfService` `2027-12-31` is read and then updated without changes
- **THEN** the update payload carries the same three values under the same camelCase names

#### Scenario: Absent fields are not introduced
- **WHEN** a model resource without any of the three fields is updated
- **THEN** the payload contains none of them
