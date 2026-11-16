## ADDED Requirements

### Requirement: Failed import items carry Core's reason
When Core rejects the write of an imported entity (prompt, application or toolset), the import result for that item SHALL carry Core's error message unchanged. An item that fails without a Core response — such as an id that does not belong to the imported resource type — SHALL carry no reason.

#### Scenario: Core rejects one toolset
- **WHEN** a toolset import writes an OAuth toolset that has no `client_secret` and Core answers `Field 'CLIENT_SECRET' is required for OAUTH authentication.`
- **THEN** that item's result is a failure carrying exactly that message

#### Scenario: Item fails before any Core call
- **WHEN** an imported entity's id does not belong to the imported resource type
- **THEN** that item's result is a failure with no reason

### Requirement: Import error notification groups failures by reason
The error notification presented when an import settles SHALL list failed items grouped by reason. Each group SHALL be a header line made of the reason followed by `:`, then the group's item paths, one per line, indented by one space. Groups with a reason SHALL keep the order in which their reason first occurs. Items with no reason SHALL form a final group headed by the generic import-error text followed by `:`, shown only when such items exist. The reason text MUST be Core's, shown as is. The title and item count are unchanged. The behavior MUST be identical on the Files, Prompts, Applications and Toolsets routes.

#### Scenario: Items fail for different reasons
- **WHEN** two toolsets fail with `Field 'CLIENT_SECRET' is required for OAUTH authentication.` and one fails with `Field 'CLIENT_SECRET' must be at least 8 characters long`
- **THEN** the error notification shows each reason once, as a header ending in `:`, with the paths of the items that failed for it listed beneath it, one per line

#### Scenario: Items fail without a reason
- **WHEN** some failed items carry a reason and others do not
- **THEN** the reasoned groups appear first, and the items with no reason are listed last under the generic import-error header

#### Scenario: Every failed item has the same reason
- **WHEN** several files fail with the same reason
- **THEN** the reason appears once, followed by every file path, and no path is dropped

#### Scenario: No item fails
- **WHEN** an import finishes with no failed items
- **THEN** no error notification is shown
