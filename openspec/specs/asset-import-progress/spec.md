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
