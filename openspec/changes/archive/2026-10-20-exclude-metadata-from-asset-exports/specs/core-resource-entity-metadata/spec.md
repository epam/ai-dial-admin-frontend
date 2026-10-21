## MODIFIED Requirements

### Requirement: Export documents exclude `_metadata`; import strips legacy metadata

exim export documents for Core resources SHALL exclude the frontend-constructed `_metadata` object from every exported entity while retaining the export `id` and every resource-content field. This requirement applies equally to direct JSON and DIAL archive exports because both formats are built from the same export document. Import SHALL continue to strip `_metadata` from each entry before writing, alongside the existing identity-field strips, so documents created before this change remain importable.

#### Scenario: A JSON export excludes `_metadata`

- **WHEN** a Core resource with `_metadata` is exported as JSON
- **THEN** the exported entity entry contains no `_metadata` object and retains its export `id` and resource-content fields

#### Scenario: A DIAL archive export excludes `_metadata`

- **WHEN** a Core resource with `_metadata` is exported as a DIAL archive
- **THEN** the archive's serialized entity entry contains no `_metadata` object and retains its export `id` and resource-content fields

#### Scenario: An import never writes `_metadata`

- **WHEN** an exported document, including one created before this change that contains `_metadata`, is imported back into Core
- **THEN** every written request body is free of `_metadata`
