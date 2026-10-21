## MODIFIED Requirements

### Requirement: Change image button uses proper button semantics
The change image action SHALL be rendered as a `GhostButton` with the image name and version as `label` and the OpenPopup icon as `iconAfter`. The `DialLabelledText` SHALL provide only the label, with the button as its child.

#### Scenario: Button renders image name and version
- **WHEN** a container has an associated image
- **THEN** the change image button displays the image name and version as its label with the OpenPopup icon after it
