# asset-import-progress Specification

## Purpose

Give users visible feedback for the whole duration of a file or asset import, on every route that offers the Import modal, so an import in flight is never silent.

## Requirements

### Requirement: In-progress indicator for the lifetime of an import
On every route that offers the Import modal (Files, asset lists such as Prompts, Applications and Toolsets, and entity lists), the system SHALL display a persistent notification with a loading spinner from the moment the import request starts until its response arrives. The notification MUST name the destination folder and MUST NOT auto-dismiss on a timer. The behavior MUST be identical for the "DIAL Admin Archive" and "Separate Files" import modes.

#### Scenario: Import of an archive is started
- **WHEN** a user confirms an import in "DIAL Admin Archive" mode
- **THEN** the Import modal closes and a persistent "Import in progress" notification with a spinner appears and stays visible while the request is pending

#### Scenario: Import of separate files is started
- **WHEN** a user confirms an import in "Separate Files" mode
- **THEN** the same persistent "Import in progress" notification appears and stays visible while the request is pending

#### Scenario: Import takes longer than the default notification lifetime
- **WHEN** an import request is still pending after the default notification auto-dismiss interval
- **THEN** the "Import in progress" notification remains visible

### Requirement: In-progress indicator is replaced by the result
When the import request settles, the system SHALL remove the in-progress notification and then present the import result through the existing success, error, and skipped notifications.

#### Scenario: Import succeeds
- **WHEN** the import response reports success
- **THEN** the in-progress notification is removed and the existing success notification is shown for the destination folder

#### Scenario: Import is rejected by the server
- **WHEN** the import response reports a failure
- **THEN** the in-progress notification is removed and an error notification carrying the server's error header, message and request id is shown

### Requirement: In-progress indicator never outlives a failed request
The system MUST remove the in-progress notification when the import request fails without a server response (for example a network failure), and SHALL report that failure through an error notification.

#### Scenario: Network failure during import
- **WHEN** the connection is lost while the import request is pending
- **THEN** the in-progress notification is removed and an error notification titled with the generic import-failed text is shown, leaving no spinner on screen

### Requirement: Import entry points stay available during an import
The system SHALL NOT disable the Import action, the file-manager upload action, or drag-and-drop upload while an import is in progress.

#### Scenario: User starts another import while one is running
- **WHEN** an import is in progress and the user opens the Import modal again
- **THEN** the modal opens normally and a further import can be started

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
