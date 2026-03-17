## ADDED Requirements

### Requirement: Change image button uses proper button semantics
The change image action SHALL be rendered as a `DialGhostButton` with the image name and version as `label` and the OpenPopup icon as `iconAfter`. The `DialLabelledText` SHALL provide only the label, with the button as its child.

#### Scenario: Button renders image name and version
- **WHEN** a container has an associated image
- **THEN** the change image button displays the image name and version as its label with the OpenPopup icon after it

### Requirement: Change image button disabled during intermediate statuses
The change image button SHALL be disabled via native button `disabled` prop when the container is in a PENDING or STOPPING status. The button SHALL be visually indicated as disabled and SHALL NOT open the change image modal when clicked.

#### Scenario: Button disabled when container is PENDING
- **WHEN** the container status is PENDING
- **THEN** the change image button is natively disabled and clicking it does not open the modal

#### Scenario: Button disabled when container is STOPPING
- **WHEN** the container status is STOPPING
- **THEN** the change image button is natively disabled and clicking it does not open the modal

#### Scenario: Button enabled when container is RUNNING
- **WHEN** the container status is RUNNING
- **THEN** the change image button is enabled and opens the change image modal

#### Scenario: Button enabled when container is STOPPED
- **WHEN** the container status is STOPPED
- **THEN** the change image button is enabled and opens the change image modal

#### Scenario: Button enabled when container is FAILED
- **WHEN** the container status is FAILED
- **THEN** the change image button is enabled and opens the change image modal
